import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle common errors like 401
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response) {
            const { status } = error.response;
            if (status === 401) {
                // Token expired or invalid
                console.warn('Unauthorized request. Clearing local storage and redirecting to login.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // We're in a utility file, so we can't use useNavigate
                // But we can redirect using window.location if absolutely necessary
                // Or let the component handle the error
            }
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    }
);

export default api;
