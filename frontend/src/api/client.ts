import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api'
})

apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    return Promise.reject(error)
  }
)
