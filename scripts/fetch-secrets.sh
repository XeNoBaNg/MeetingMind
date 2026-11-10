#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="/home/ssm-user/meetingmind"
SCRIPTS_DIR="${TARGET_DIR}/scripts"
TARGET_FILE="${TARGET_DIR}/.env.prod"
EXPECTED_USER="ssm-user"
SSM_PATH="/meetingmind/prod/"
AWS_REGION="us-east-1"

# 1. Enforce execution identity as ssm-user
CURRENT_USER="$(id -u -n)"
if [ "${CURRENT_USER}" != "${EXPECTED_USER}" ]; then
  echo "ERROR: Script must be executed as '${EXPECTED_USER}', currently '${CURRENT_USER}'." >&2
  exit 1
fi

# 2. Strict directory & symlink safety check for TARGET_DIR
if [ -L "${TARGET_DIR}" ]; then
  echo "ERROR: Target directory '${TARGET_DIR}' is a symlink. Symlinks are rejected for security." >&2
  exit 1
fi

if [ -e "${TARGET_DIR}" ]; then
  if [ ! -d "${TARGET_DIR}" ]; then
    echo "ERROR: Path '${TARGET_DIR}' exists and is not a directory." >&2
    exit 1
  fi
  DIR_OWNER="$(stat -c '%U' "${TARGET_DIR}")"
  if [ "${DIR_OWNER}" != "${EXPECTED_USER}" ]; then
    echo "ERROR: Target directory '${TARGET_DIR}' is owned by '${DIR_OWNER}', expected '${EXPECTED_USER}'." >&2
    exit 1
  fi
else
  mkdir -m 700 "${TARGET_DIR}"
fi
chmod 700 "${TARGET_DIR}"

# 3. Strict directory & symlink safety check for SCRIPTS_DIR
if [ -L "${SCRIPTS_DIR}" ]; then
  echo "ERROR: Scripts directory '${SCRIPTS_DIR}' is a symlink. Symlinks are rejected for security." >&2
  exit 1
fi

if [ -e "${SCRIPTS_DIR}" ] && [ ! -d "${SCRIPTS_DIR}" ]; then
  echo "ERROR: Path '${SCRIPTS_DIR}' exists and is not a directory." >&2
  exit 1
fi

if [ -e "${SCRIPTS_DIR}" ]; then
  SCRIPTS_OWNER="$(stat -c '%U' "${SCRIPTS_DIR}")"
  if [ "${SCRIPTS_OWNER}" != "${EXPECTED_USER}" ]; then
    echo "ERROR: Scripts directory '${SCRIPTS_DIR}' is owned by '${SCRIPTS_OWNER}', expected '${EXPECTED_USER}'." >&2
    exit 1
  fi
else
  mkdir -m 700 "${SCRIPTS_DIR}"
fi
chmod 700 "${SCRIPTS_DIR}"

# 4. Suppress AWS CLI pagers and set owner-only umask
umask 077
export AWS_PAGER=""

echo "Connecting to AWS SSM Parameter Store (${SSM_PATH}) in ${AWS_REGION}..."

# 5. In-memory retrieval and strict Python validation
aws ssm get-parameters-by-path \
  --path "${SSM_PATH}" \
  --with-decryption \
  --region "${AWS_REGION}" \
  --no-cli-pager \
  --output json | python3 -c '
import sys, json, os, tempfile

EXPECTED_FULL_PATHS = {
    "/meetingmind/prod/BOOTSTRAP_USER_ENABLED",
    "/meetingmind/prod/FRONTEND_URL",
    "/meetingmind/prod/GROQ_API_KEY",
    "/meetingmind/prod/JWT_SECRET",
    "/meetingmind/prod/POSTGRES_DB",
    "/meetingmind/prod/POSTGRES_PASSWORD",
    "/meetingmind/prod/POSTGRES_USER",
}

target_dir = sys.argv[1]
target_file = os.path.join(target_dir, ".env.prod")

try:
    data = json.load(sys.stdin)
except Exception as e:
    sys.stderr.write(f"ERROR: Failed to parse SSM JSON output: {e}\n")
    sys.exit(1)

params = data.get("Parameters", [])

seen_names = []
param_dict = {}
empty_keys = []
invalid_syntax_keys = []

for p in params:
    name = p.get("Name", "")
    val = p.get("Value", "")
    seen_names.append(name)

    if not val or not val.strip():
        empty_keys.append(name)

    # Reject newlines, carriage returns, null bytes, or unescaped $ (which breaks Docker Compose interpolation)
    if any(c in val for c in ("\n", "\r", "\0", "$")):
        invalid_syntax_keys.append(name)

    param_dict[name] = val

seen_set = set(seen_names)

# Check 1: Duplicate parameter paths
if len(seen_names) != len(seen_set):
    duplicates = [name for name in seen_set if seen_names.count(name) > 1]
    sys.stderr.write(f"ERROR: Duplicate parameter paths returned from SSM: {sorted(duplicates)}\n")
    sys.exit(1)

# Check 2: Missing expected paths
missing = EXPECTED_FULL_PATHS - seen_set
if missing:
    sys.stderr.write(f"ERROR: Missing expected parameters: {sorted(list(missing))}\n")
    sys.exit(1)

# Check 3: Unexpected paths
unexpected = seen_set - EXPECTED_FULL_PATHS
if unexpected:
    sys.stderr.write(f"ERROR: Unexpected parameters detected: {sorted(list(unexpected))}\n")
    sys.exit(1)

# Check 4: Empty or whitespace-only values
if empty_keys:
    sys.stderr.write(f"ERROR: Parameters contain empty or whitespace-only values: {sorted(empty_keys)}\n")
    sys.exit(1)

# Check 5: Dotenv or Compose interpolation incompatibility
if invalid_syntax_keys:
    sys.stderr.write(f"ERROR: Parameters contain invalid control characters or unescaped $ symbols: {sorted(invalid_syntax_keys)}\n")
    sys.exit(1)

# Check 6: Exact count invariant
if len(param_dict) != len(EXPECTED_FULL_PATHS):
    sys.stderr.write(f"ERROR: Expected exactly {len(EXPECTED_FULL_PATHS)} parameters, found {len(param_dict)}\n")
    sys.exit(1)

# Secure exclusive temporary file creation in target directory (created atomically with mode 0600)
fd, temp_path = tempfile.mkstemp(prefix=".env.prod.tmp.", dir=target_dir)

try:
    written_keys = []
    with os.fdopen(fd, "w") as f:
        f.write("# MeetingMind Production Environment (Generated via AWS SSM)\n")
        f.write("# DO NOT COMMIT OR EXPOSE THIS FILE\n\n")

        # 1. Injected SSM parameters (sorted alphabetically by full path)
        for full_path in sorted(EXPECTED_FULL_PATHS):
            var_name = full_path.split("/")[-1]
            f.write(f"{var_name}={param_dict[full_path]}\n")
            written_keys.append(var_name)

        # 2. Host-level operational overrides verified from source
        f.write("\n# Host & Operational Overrides\n")
        overrides = [
            ("FRONTEND_PORT", "80"),
            ("MEETINGMIND_SECURITY_BOOTSTRAP_USER_ENABLED", "false"),
            ("MANAGEMENT_TRACING_ENABLED", "false"),
            ("GOOGLE_CLIENT_ID", "dummy"),
            ("GOOGLE_CLIENT_SECRET", "dummy"),
        ]
        for k, v in overrides:
            f.write(f"{k}={v}\n")
            written_keys.append(k)

    # Invariant self-checks: exactly 12 unique variables, zero duplicates
    if len(written_keys) != len(set(written_keys)):
        raise RuntimeError("Duplicate variable keys detected in written output.")
    if len(written_keys) != 12:
        raise RuntimeError(f"Expected exactly 12 variable entries, wrote {len(written_keys)}")

    # Atomic rename on the same filesystem (preserves mode 0600 from mkstemp)
    os.replace(temp_path, target_file)
    print("VALIDATION SUCCESS: Exactly 7 SSM parameters and 5 verified overrides written atomically.")

except Exception as err:
    if os.path.exists(temp_path):
        os.remove(temp_path)
    sys.stderr.write(f"ERROR: Atomic environment generation failed: {err}\n")
    sys.exit(1)
' "${TARGET_DIR}"

echo "SUCCESS: ${TARGET_FILE} atomically updated (permissions: 0600)."
