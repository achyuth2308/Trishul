/**
 * Generates an axios instance with interceptors.
 * @returns {string} — axiosInstance.js content
 */
export function generateAxiosInstance() {
    return `import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env?.VITE_API_URL
    || process.env.REACT_APP_API_URL
    || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token if present
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // TODO: Handle unauthorized response
      // Options:
      //   - Redirect to login page
      //   - Clear token: localStorage.removeItem('token')
      //   - Trigger logout action
      console.warn('Unauthorized request — token may be expired.');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
`;
}
