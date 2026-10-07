import axios from 'axios';
import { supabase } from './supabaseClient';

const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Attach Supabase JWT or Admin Demo Token to every request
apiClient.interceptors.request.use(async (config) => {
  // Use demo admin token if frontend admin session is active
  if (sessionStorage.getItem('srinivasam_admin') === 'true') {
    config.headers.Authorization = 'Bearer admin-demo-token';
    return config;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Auto-retry on network errors (server may still be booting)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Only retry on network errors or 5xx, not on 4xx auth errors
    const isNetworkError = !error.response;
    const isServerError = error.response?.status >= 500;

    if ((isNetworkError || isServerError) && !config._retryCount) {
      config._retryCount = 0;
    }

    if ((isNetworkError || isServerError) && config._retryCount < 3) {
      config._retryCount += 1;
      const delay = 400 * 2 ** (config._retryCount - 1); // 400ms, 800ms, 1600ms
      await new Promise((res) => setTimeout(res, delay));
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
