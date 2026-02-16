import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView,
  StatusBar, Dimensions, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { api } from './src/api/client';

WebBrowser.maybeCompleteAuthSession();

// Import Screens
import SyncScreen from './src/screens/SyncScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import RecoveryScreen from './src/screens/RecoveryScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'register' | 'recovery' | 'dashboard' | 'scan' | 'edit_profile' | 'settings'>('welcome');
  const [previousScreen, setPreviousScreen] = useState<'welcome' | 'dashboard'>('welcome');

  // State សម្រាប់ទិន្នន័យអ្នកប្រើប្រាស់
  const [userProfile, setUserProfile] = useState<any>(null);

  // --- GOOGLE AUTH CONFIG ---
  // Placeholder Client IDs - Use Google Cloud Console to generate real ones
  const [request, response, promptAsync] = Google.useAuthRequest({
    // androidClientId: "YOUR_ANDROID_CLIENT_ID",
    // iosClientId: "YOUR_IOS_CLIENT_ID",
    // webClientId: "YOUR_WEB_CLIENT_ID",
    redirectUri: makeRedirectUri({
      scheme: 'digitalid'
    }),
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      handleGoogleLogin(code);
    } else if (response?.type === 'error') {
      Alert.alert("Login Failed", "Google login could not complete.");
    }
  }, [response]);

  const handleGoogleLogin = async (code: string) => {
    try {
      console.log("Google Auth Code:", code);
      const redirectUri = makeRedirectUri({ scheme: 'digitalid' });

      const res = await api.post('/oauth/google-mobile', {
        code,
        redirectUri
      });

      if (res.data && (res.data.success || res.data.token)) {
        console.log("Login Success:", res.data.user);
        setUserProfile({
          ...res.data.user,
          nameEn: res.data.user.name,
          avatar: res.data.user.picture,
        });
        setCurrentScreen('dashboard');
      } else {
        Alert.alert("Login Failed", "Server refused login.");
      }
    } catch (e: any) {
      console.error("Backend Exchange Failed:", e);
      Alert.alert("Login Error", "Failed to connect to server: " + (e.message || "Unknown error"));
    }
  };

  // --- NAVIGATION FUNCTIONS ---
  const goBackToWelcome = () => setCurrentScreen('welcome');
  const goToDashboard = () => setCurrentScreen('dashboard');
  const goToScan = () => setCurrentScreen('scan');
  const goToEditProfile = () => setCurrentScreen('edit_profile');

  const goToSettings = (from: 'welcome' | 'dashboard') => {
    setPreviousScreen(from);
    setCurrentScreen('settings');
  };

  // Callback ពេល Register ជោគជ័យ
  const handleRegisterFinish = (data: any) => {
    if (data) {
      setUserProfile(data); // រក្សាទុកទិន្នន័យដែលបានពី Register
    }
    setCurrentScreen('dashboard');
  };

  // --- SCREEN RENDERING ---

  if (currentScreen === 'register') {
    return (
      <View style={{ flex: 1 }}>
        <RegisterScreen onBack={goBackToWelcome} onFinish={handleRegisterFinish} />
      </View>
    );
  }

  if (currentScreen === 'recovery') {
    return (
      <View style={{ flex: 1 }}>
        <RecoveryScreen onBack={goBackToWelcome} onFinish={goToDashboard} />
      </View>
    );
  }

  if (currentScreen === 'dashboard') {
    return (
      <DashboardScreen
        userData={userProfile} // ✅ បញ្ជូនទិន្នន័យទៅ Dashboard
        onScanPress={goToScan}
        onLogout={goBackToWelcome}
        onEditProfile={goToEditProfile}
        onSettings={() => goToSettings('dashboard')}
      />
    );
  }

  if (currentScreen === 'settings') {
    return (
      <SettingsScreen
        onBack={() => setCurrentScreen(previousScreen)}
        isAuthenticated={previousScreen === 'dashboard'}
      />
    );
  }

  if (currentScreen === 'edit_profile') {
    return (
      <View style={{ flex: 1 }}>
        <EditProfileScreen onBack={goToDashboard} />
      </View>
    );
  }

  if (currentScreen === 'scan') {
    return (
      <View style={{ flex: 1 }}>
        <SyncScreen onBack={goToDashboard} />
      </View>
    );
  }

  // --- WELCOME SCREEN ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1d4ed8" />

      <View style={styles.content}>
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="finger-print" size={60} color="white" />
          </View>
          <Text style={styles.appTitle}>Digital ID</Text>
          <Text style={styles.appSubtitle}>Easy yet Secure Mobile Authentication Service</Text>
          <Text style={styles.description}>
            A QR code authentication system that connects{'\n'}
            you to Digital Learning Center services
          </Text>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.mainButton, !request && { opacity: 0.7 }]}
            activeOpacity={0.9}
            disabled={!request}
            onPress={() => {
              promptAsync();
            }}>
            <Text style={styles.buttonText}>Login with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mainButton} activeOpacity={0.9} onPress={() => setCurrentScreen('register')}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mainButton} activeOpacity={0.9} onPress={() => setCurrentScreen('recovery')}>
            <Text style={styles.buttonText}>Recovery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mainButton} activeOpacity={0.9} onPress={() => goToSettings('welcome')}>
            <Text style={styles.buttonText}>Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1d4ed8' },
  content: { flex: 1, paddingHorizontal: 30, justifyContent: 'space-between', paddingVertical: 50 },
  brandSection: { alignItems: 'center', marginTop: 60 },
  logoContainer: { marginBottom: 20 },
  appTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 10, letterSpacing: 1 },
  appSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 40, textAlign: 'center', fontWeight: '500' },
  description: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20 },
  buttonSection: { width: '100%', gap: 15 },
  mainButton: { backgroundColor: 'white', height: 55, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  buttonText: { color: '#1d4ed8', fontSize: 16, fontWeight: 'bold' },
  footer: { alignItems: 'center' },
  versionText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
});