import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api'
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('meetingmind_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('meetingmind_token')
      localStorage.removeItem('meetingmind_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
