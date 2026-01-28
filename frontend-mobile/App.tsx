import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, 
  StatusBar, Dimensions, Platform, ScrollView 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import Screens
import SyncScreen from './src/screens/SyncScreen';
import RegisterScreen from './src/screens/RegisterScreen';

const { width } = Dimensions.get('window');

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'scan' | 'register'>('home');

  const goHome = () => setCurrentScreen('home');

  // --- SCREEN RENDERING ---
  if (currentScreen === 'scan') {
    return (
      <View style={{ flex: 1 }}>
        <SyncScreen onBack={goHome} />
      </View>
    );
  }

  if (currentScreen === 'register') {
    return (
      <View style={{ flex: 1 }}>
        <RegisterScreen />
        <TouchableOpacity style={styles.floatingBackBtn} onPress={goHome}>
          <Ionicons name="close-circle" size={36} color="#334155" />
        </TouchableOpacity>
      </View>
    );
  }

  // --- HOME SCREEN UI ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      <View style={styles.contentContainer}>
        
        {/* 1. Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="finger-print" size={48} color="#2563EB" />
          </View>
          <Text style={styles.appTitle}>Digital ID</Text>
          <Text style={styles.appSubtitle}>អត្តសញ្ញាណឌីជីថលរបស់អ្នក</Text>
        </View>

        {/* 2. Menu Buttons */}
        <View style={styles.menuContainer}>
          
          {/* Button: Scan Login (Blue Gradient) */}
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => setCurrentScreen('scan')}
            style={styles.shadowProp}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.menuButtonPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <MaterialCommunityIcons name="qrcode-scan" size={28} color="white" />
              </View>
              <View style={styles.textWrapper}>
                <Text style={[styles.btnTitle, { color: 'white' }]}>Scan Login</Text>
                <Text style={[styles.btnSub, { color: 'rgba(255,255,255,0.9)' }]}>
                  ស្កេន QR ដើម្បីចូលប្រើប្រព័ន្ធ
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Button: Register KYC (White) */}
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => setCurrentScreen('register')}
            style={[styles.menuButtonWhite, styles.shadowProp]}
          >
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="person-add-outline" size={28} color="#2563EB" />
            </View>
            <View style={styles.textWrapper}>
              <Text style={[styles.btnTitle, { color: '#1E293B' }]}>Register KYC</Text>
              <Text style={[styles.btnSub, { color: '#64748B' }]}>
                ចុះឈ្មោះ និងផ្ទៀងផ្ទាត់គណនី
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
          </TouchableOpacity>

        </View>

        {/* 3. Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0 (Beta)</Text>
          <Text style={styles.footerText}>Powered by EFIMEF</Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  
  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 5,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Khmer Sangam MN' : 'serif',
  },

  // Menu Buttons
  menuContainer: {
    gap: 20,
  },
  shadowProp: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  menuButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    height: 100,
  },
  menuButtonWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    height: 100,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textWrapper: {
    flex: 1,
  },
  btnTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  btnSub: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Khmer Sangam MN' : 'serif',
  },

  // Footer
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  floatingBackBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
  }
});