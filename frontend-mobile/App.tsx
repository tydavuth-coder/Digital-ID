import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, 
  StatusBar, Dimensions, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  // Navigation Functions
  const goBackToWelcome = () => setCurrentScreen('welcome');
  const goToDashboard = () => setCurrentScreen('dashboard');
  const goToScan = () => setCurrentScreen('scan');
  const goToEditProfile = () => setCurrentScreen('edit_profile');
  
  // Settings Navigation (អាចចូលបានទាំងពី Welcome និង Dashboard)
  const goToSettings = (from: 'welcome' | 'dashboard') => {
    setPreviousScreen(from);
    setCurrentScreen('settings');
  };

  // --- SCREEN RENDERING ---

  // 1. REGISTER
  if (currentScreen === 'register') {
    return (
      <View style={{ flex: 1 }}>
        <RegisterScreen onBack={goBackToWelcome} onFinish={goToDashboard} />
        <TouchableOpacity style={styles.floatingBackBtn} onPress={goBackToWelcome}>
          <Ionicons name="close-circle" size={36} color="#334155" />
        </TouchableOpacity>
      </View>
    );
  }

  // 2. RECOVERY
  if (currentScreen === 'recovery') {
    return (
      <View style={{ flex: 1 }}>
        <RecoveryScreen onBack={goBackToWelcome} onFinish={goToDashboard} />
      </View>
    );
  }

  // 3. DASHBOARD
  if (currentScreen === 'dashboard') {
    return (
      <DashboardScreen 
        onScanPress={goToScan}
        onLogout={goBackToWelcome}
        onEditProfile={goToEditProfile}
        onSettings={() => goToSettings('dashboard')} // ចូល Settings ពី Dashboard
      />
    );
  }

  // 4. SETTINGS
  if (currentScreen === 'settings') {
    return (
      <SettingsScreen 
        onBack={() => setCurrentScreen(previousScreen)} // ថយក្រោយទៅកន្លែងដើមវិញ
        isAuthenticated={previousScreen === 'dashboard'} // បើមកពី Dashboard បង្ហាញ Account Info
      />
    );
  }

  // 5. EDIT PROFILE
  if (currentScreen === 'edit_profile') {
    return (
      <View style={{ flex: 1 }}>
        <EditProfileScreen onBack={goToDashboard} />
      </View>
    );
  }

  // 6. SCAN QR
  if (currentScreen === 'scan') {
    return (
      <View style={{ flex: 1 }}>
        <SyncScreen onBack={goToDashboard} />
      </View>
    );
  }

  // 7. WELCOME SCREEN (DEFAULT)
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
  floatingBackBtn: { position: 'absolute', top: 50, right: 20, zIndex: 100 },
});