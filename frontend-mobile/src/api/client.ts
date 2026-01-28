import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// We assume your backend API is prefixed with /api. 
// If your routes are at the root (e.g. id.efimef.org/login), remove '/api'.
export const BASE_URL = 'https://id.efimef.org/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically add the token to requests if it exists
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});