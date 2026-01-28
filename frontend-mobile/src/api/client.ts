import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ✅ ដូរ IP នេះទៅជា IP ពិតរបស់ Server អ្នក (បើប្រើ Emulator)
// ឬប្រើ https://id.efimef.org/api បើ Server Online
export const BASE_URL = 'https://id.efimef.org/api'; 

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // បង្កើនម៉ោងរង់ចាំ (Upload រូបអាចយូរ)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('userToken');
  
  // ✅ កែសម្រួល៖ ដាក់ Token តែពេលមានប៉ុណ្ណោះ
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor (Optional: Debugging)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.log('API Error:', error.response.status, error.response.data);
    } else {
      console.log('Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);