#!/usr/bin/env bash
set -euo pipefail

# 1. Enforce strict owner-only umask immediately
umask 077

REPO_DIR="/home/ssm-user/meetingmind"
RELEASE_ENV="${REPO_DIR}/.release.env"
LOCK_FILE="${REPO_DIR}/.deploy.lock"
EXPECTED_USER="ssm-user"
AWS_REGION="us-east-1"
ECR_REGISTRY="038462793348.dkr.ecr.us-east-1.amazonaws.com"
BACKEND_REPO="${ECR_REGISTRY}/meetingmind-backend"
FRONTEND_REPO="${ECR_REGISTRY}/meetingmind-frontend"

# Temporary file tracking for atomic replacements
TMP_FILE=""

cleanup() {
  if [ -n "${TMP_FILE:-}" ] && [ -f "${TMP_FILE}" ]; then
    rm -f "${TMP_FILE}"
  fi
}

# Proper signal handling: EXIT trap cleans up; explicit INT and TERM traps exit with standard Unix codes
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# 2. Enforce execution identity as ssm-user
CURRENT_USER="$(id -u -n)"
if [ "${CURRENT_USER}" != "${EXPECTED_USER}" ]; then
  echo "ERROR: deploy.sh must be executed as '${EXPECTED_USER}', currently '${CURRENT_USER}'." >&2
  exit 1
fi

# 3. Concurrency protection via flock (non-blocking exclusive lock)
exec 200>"${LOCK_FILE}"
if ! flock -n 200; then
  echo "ERROR: Another deployment is currently in progress (lock held on ${LOCK_FILE})." >&2
  exit 1
fi

# 4. Validate input commit SHA
if [ $# -ne 1 ]; then
  echo "Usage: $0 <40-char-git-commit-sha>" >&2
  exit 1
fi

TARGET_SHA="$1"
if ! [[ "${TARGET_SHA}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "ERROR: Invalid target Git commit SHA '${TARGET_SHA}'." >&2
  echo "       Must be exactly 40 lowercase hexadecimal characters." >&2
  exit 1
fi

# 5. Check systemd service state: routine reload requires an active service
if ! systemctl is-active --quiet meetingmind.service; then
  echo "ERROR: 'meetingmind.service' is not currently active." >&2
  echo "       Routine deployment via reload requires an active service." >&2
  echo "       Perform initial service start first: sudo systemctl start meetingmind.service" >&2
  exit 1
fi

# 6. Validate previous release file and CURRENT_SHA
if [ ! -f "${RELEASE_ENV}" ]; then
  echo "ERROR: Release file '${RELEASE_ENV}' does not exist." >&2
  echo "       Initial deployment configuration must be created before running routine deployments." >&2
  exit 1
fi

CURRENT_SHA="$(grep -E '^IMAGE_TAG=' "${RELEASE_ENV}" | cut -d '=' -f 2 || true)"
if ! [[ "${CURRENT_SHA}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "ERROR: Existing release file '${RELEASE_ENV}' contains an invalid or malformed IMAGE_TAG '${CURRENT_SHA}'." >&2
  echo "       Expected exactly 40 lowercase hexadecimal characters." >&2
  echo "ABORTING: Existing release file left untouched. Service continues running." >&2
  exit 1
fi

if [ "${CURRENT_SHA}" = "${TARGET_SHA}" ]; then
  echo "NOTICE: Target SHA '${TARGET_SHA}' is already the active release in ${RELEASE_ENV}."
fi

# 7. ECR Authentication with pipefail
echo "==> Authenticating Docker with Amazon ECR (${AWS_REGION})..."
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

# 8. Preflight Image Verification: Pull BOTH images BEFORE touching running containers or release configuration
echo "==> Pre-pulling target release images from Amazon ECR..."
echo "    Pulling backend: ${BACKEND_REPO}:${TARGET_SHA}"
if ! docker pull "${BACKEND_REPO}:${TARGET_SHA}"; then
  echo "ERROR: Failed to pull backend image for SHA '${TARGET_SHA}'." >&2
  echo "ABORTING: Target release not applied. Running release '${CURRENT_SHA}' remains untouched." >&2
  exit 1
fi

echo "    Pulling frontend: ${FRONTEND_REPO}:${TARGET_SHA}"
if ! docker pull "${FRONTEND_REPO}:${TARGET_SHA}"; then
  echo "ERROR: Failed to pull frontend image for SHA '${TARGET_SHA}'." >&2
  echo "ABORTING: Target release not applied. Running release '${CURRENT_SHA}' remains untouched." >&2
  exit 1
fi

# 9. Synchronize production secrets from SSM (atomic)
echo "==> Synchronizing production secrets from SSM..."
"${REPO_DIR}/scripts/fetch-secrets.sh"

# 10. Atomically update .release.env using mktemp in target directory
echo "==> Updating ${RELEASE_ENV} to ${TARGET_SHA}..."
TMP_FILE="$(mktemp "${RELEASE_ENV}.tmp.XXXXXX")"
echo "IMAGE_TAG=${TARGET_SHA}" > "${TMP_FILE}"
chmod 0600 "${TMP_FILE}"
mv -f "${TMP_FILE}" "${RELEASE_ENV}"
TMP_FILE=""

# 11. Trigger systemd reload for container replacement
echo "==> Reloading meetingmind.service..."
if sudo systemctl reload meetingmind.service; then
  echo "SUCCESS: MeetingMind successfully updated to ${TARGET_SHA}."
  sudo systemctl status meetingmind.service --no-pager
else
  echo "ERROR: systemctl reload failed! Application containers failed health checks." >&2

  # 12. Automated Image-Only Rollback to validated previous release SHA
  echo "==> INITIATING AUTOMATED ROLLBACK to previous image SHA ${CURRENT_SHA}..."
  TMP_FILE="$(mktemp "${RELEASE_ENV}.tmp.XXXXXX")"
  echo "IMAGE_TAG=${CURRENT_SHA}" > "${TMP_FILE}"
  chmod 0600 "${TMP_FILE}"
  mv -f "${TMP_FILE}" "${RELEASE_ENV}"
  TMP_FILE=""

  if sudo systemctl reload meetingmind.service; then
    echo "ROLLBACK SUCCESSFUL: Stack restored to previous image SHA ${CURRENT_SHA}." >&2
    echo "NOTICE: Rollback restored the application container images only." >&2
  else
    echo "CRITICAL: Automated image rollback also failed. Manual operator intervention required." >&2
  fi
  exit 1
fi
