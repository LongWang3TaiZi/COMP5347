import axios from 'axios';
import Swal from 'sweetalert2';

// create axios instance
const api = axios.create({
    baseURL: 'http://localhost:7777/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    // include credentials (cookies) with every request
    withCredentials: true
});

// response interceptor
api.interceptors.response.use(
    response => {
        // directly return data part
        return response.data;
    },
    error => {
        // handle 401 errors (unauthorized/session expired) with appropriate handling
        if (error.response && error.response.status === 401) {
            // check current path
            const currentPath = window.location.pathname;
            const isLoginAttempt = error.config && (
                error.config.url.includes('/login') || 
                error.config.url.includes('/register') ||
                error.config.url.includes('/signup')
            );
            
            // skip redirect for authentication pages or if this is a login/register attempt
            if (currentPath === '/login' || currentPath === '/admin/login' || 
                currentPath === '/signup' || currentPath === '/register' ||
                currentPath === '/verify-email' || isLoginAttempt) {
                return Promise.reject(error);
            }
            
            // for all other pages, redirect based on path
            setTimeout(() => {
                // check if we're on an admin page and redirect accordingly
                if (currentPath.includes('/admin')) {
                    window.location.href = '/admin/login';
                } else {
                    window.location.href = '/login';
                }
            }, 100);
        }
        
        // for other errors, show the error message
        handleApiError(error);
        return Promise.reject(error);
    }
);

// error handling function
const handleApiError = (error) => {
    // Skip if it's a 401 error
    if (error.response && error.response.status === 401) {
        return;
    }
    
    const errorMessage = error.response?.data?.message ||
        error.message ||
        'Unknown error occurred';

    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonText: 'OK'
    });
};

// api service methods
const apiService = {
    // get request
    async get(endpoint, params = {}) {
        try {
            return await api.get(endpoint, {params});
        } catch (error) {
            throw error;
        }
    },

    // post request
    async post(endpoint, data = {}) {
        try {
            return await api.post(endpoint, data);
        } catch (error) {
            throw error;
        }
    },
    
    // file upload request (multipart/form-data)
    async uploadFile(endpoint, formData) {
        try {
            const response = await axios({
                method: 'post',
                url: `http://localhost:7777/api/${endpoint}`,
                data: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
                timeout: 30000, // longer timeout for file uploads
            });
            
            // Return the data directly like other methods
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },

    // put request
    async put(endpoint, data = {}) {
        try {
            return await api.put(endpoint, data);
        } catch (error) {
            throw error;
        }
    },

    // delete request
    async delete(endpoint) {
        try {
            return await api.delete(endpoint);
        } catch (error) {
            throw error;
        }
    },

    // batch process requests
    async all(requests) {
        try {
            return await axios.all(requests);
        } catch (error) {
            // Don't show error for 401
            if (!(error.response && error.response.status === 401)) {
                handleApiError(error);
            }
            throw error;
        }
    },
    
    // download file (for exports)
    async downloadFile(endpoint, params = {}, options = {}) {
        try {
            // extract options with defaults
            const {
                filename = `export-${new Date().toISOString().split('T')[0]}`,
                format = 'csv',
                showErrors = true
            } = options;
            
            // prepare request config
            const config = {
                method: 'GET',
                url: `http://localhost:7777/api/admin/${endpoint}`,
                params,
                responseType: 'blob',
                withCredentials: true,
                timeout: 30000, // longer timeout for downloads
                headers: {
                    'Accept': format === 'csv' ? 'text/csv' : 'application/json'
                }
            };
            
            // make the request
            const response = await axios(config);
            
            // ensure we got a successful response with data
            if (!response.data) {
                throw new Error('No data received');
            }
            
            // create a file extension based on the format
            const extension = format || 
                (response.headers['content-type']?.includes('csv') ? 'csv' : 
                response.headers['content-type']?.includes('json') ? 'json' : 'txt');
            
            // generate final filename with extension
            const fullFilename = `${filename}.${extension}`;
            
            // create blob URL
            const blob = new Blob([response.data], {
                type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json'
            });
            const url = window.URL.createObjectURL(blob);
            
            // create and trigger download link
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fullFilename);
            document.body.appendChild(link);
            link.click();
            
            // cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            return { success: true, filename: fullFilename };
        } catch (error) {
            if (showErrors) {
                handleApiError(error);
            }
            throw error;
        }
    }
};

export default apiService;