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
                // Special handling: Don't clear storage if we're already trying to login
                // as 401 here just means "Invalid credentials"
                const isLoginReq = error.config && error.config.url && error.config.url.includes('/auth/login');

                if (!isLoginReq) {
                    console.warn('Unauthorized request. Clearing local storage and redirecting to login.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    }
);

export default api;
