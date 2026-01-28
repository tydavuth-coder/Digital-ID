import { api } from './client';
import * as SecureStore from 'expo-secure-store';

/**
 * ស្កេន QR Code ដើម្បី Login ចូល Dashboard
 * @param socketId - ID ដែលបានពីការស្កេន QR Code
 */
export const authorizeDashboardSession = async (socketId: string) => {
  console.log('Authorizing session for socket:', socketId);
  
  // ដោយសារ Backend ប្រើ tRPC + SuperJSON យើងត្រូវផ្ញើទិន្នន័យតាមទម្រង់នេះ
  // URL: /api/trpc/mobile.authorizeDashboard
  const response = await api.post('/trpc/mobile.authorizeDashboard', {
    json: {
      socketId: socketId,
      deviceInfo: 'Mobile App (Expo)',
    }
  });

  // tRPC តែងតែ return លទ្ធផលនៅក្នុង `result.data.json`
  const result = response.data?.result?.data?.json;
  return result;
};