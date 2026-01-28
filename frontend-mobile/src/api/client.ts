import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ប្តូរទៅ Domain របស់អ្នក
const API_URL = 'https://id.efimef.org/api'; 

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 វិនាទី (បើលើសនេះ ចាត់ទុកថា Server ដាច់)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Token to Request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle Response Errors Globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network Error (Server Down / No Internet)
      console.log('Network Error:', error.message);
      return Promise.reject(new Error("NETWORK_ERROR"));
    }
    return Promise.reject(error);
  }
);