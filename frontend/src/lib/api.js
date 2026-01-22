const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Security: Auto-logout on 401 Unauthorized
const handleUnauthorized = () => {
  // Clear local storage
  localStorage.removeItem('merit-auth-storage');

  // Redirect to home/login page
  if (window.location.pathname !== '/' && !window.location.pathname.includes('/auth')) {
    window.location.href = '/';
  }
};

// Security: Sanitize request body to prevent XSS in API calls
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Remove potential script tags and dangerous patterns
      sanitized[key] = value
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const api = {
  request: async (endpoint, method = 'GET', body = null, token = null) => {
    const headers = {
      'Content-Type': 'application/json',
      // Security: Prevent MIME type sniffing
      'Accept': 'application/json'
    };

    if (token) {
      // Validate token format before sending
      if (typeof token !== 'string' || token.length < 10) {
        console.warn('Invalid token format detected');
        handleUnauthorized();
        throw new Error('Invalid authentication token');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers,
      // Security: Include credentials for secure cookie handling
      credentials: 'include'
    };

    if (body) {
      // Sanitize body before sending
      config.body = JSON.stringify(sanitizeObject(body));
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);

      // Handle 401 Unauthorized - auto logout
      if (response.status === 401) {
        console.warn('Session expired or invalid token');
        handleUnauthorized();
        throw new Error('Session expired. Please log in again.');
      }

      // Handle 403 Forbidden
      if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to perform this action.');
      }

      // Handle 429 Too Many Requests (Rate Limited)
      if (response.status === 429) {
        throw new Error('Too many requests. Please slow down and try again later.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  post: (endpoint, body, token) => api.request(endpoint, 'POST', body, token),
  get: (endpoint, token) => api.request(endpoint, 'GET', null, token),
  put: (endpoint, body, token) => api.request(endpoint, 'PUT', body, token),
  delete: (endpoint, token) => api.request(endpoint, 'DELETE', null, token),
};
