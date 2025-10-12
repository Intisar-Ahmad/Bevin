import axios from 'axios'

const axiosInstance = axios.create({
    baseURL:import.meta.VITE_BACKEND_URL
})


export default axiosInstance;