const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  request: async (endpoint, method = 'GET', body = null, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');
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
