import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView,
  StatusBar, Dimensions, Platform, ActivityIndicator, Switch, Alert, TextInput, Linking
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../api/client';

const { width } = Dimensions.get('window');

// --- TYPES ---
type CameraType = 'front' | 'back';
type Step =
  | 'phone_input'
  | 'telegram_verification'
  | 'front' | 'processing_front'
  | 'back' | 'processing_back'
  | 'selfie' | 'processing_selfie'
  | 'pin_setup' | 'pin_confirm'
  | 'pending_approval';

interface RegisterProps {
  onBack: () => void;
  onFinish: (data: any) => void;
}

// --- MOCK CAMERA (For UI Testing) ---
// We will replace this with real 'expo-camera' later
const CameraView = (props: any) => (
  <View style={[props.style, { backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }]}>
    <Ionicons name="camera-outline" size={50} color="#555" />
    <Text style={{ color: '#555', marginTop: 10 }}>Camera View</Text>
    {props.children}
  </View>
);

export default function RegisterScreen({ onBack, onFinish }: RegisterProps) {
  // --- STATE & HOOKS (VERIFIED SAFE) ---
  const cameraRef = useRef<any>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const [step, setStep] = useState<Step>('phone_input');
  console.log("Current Step:", step);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flash, setFlash] = useState(false);
  const [selfieFlashOn, setSelfieFlashOn] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [sessionId] = useState(() => `session_${Math.random().toString(36).substring(7)}`);
  const [telegramChatId, setTelegramChatId] = useState<string | null>(null);
  const [isTelegramLinked, setIsTelegramLinked] = useState(false);
  const [isCheckingTelegram, setIsCheckingTelegram] = useState(false);

  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

  // --- EFFECTS ---
  useEffect(() => {
    // Camera Mock Ready
    setTimeout(() => setIsCameraReady(true), 500);
  }, []);

  useEffect(() => {
    if (step === 'front' || step === 'back') {
      setFacing('back');
      setSelfieFlashOn(false);
    } else if (step === 'selfie') {
      setTimeout(() => setFacing('front'), 50);
      setFlash(false);
    }
  }, [step]);

  // --- ACTIONS ---
  const getTelegramLink = async () => {
    try {
      const { data } = await api.post('/auth/telegram/generate-registration-link', { sessionId });
      if (data.success && data.link) {
        Linking.openURL(data.link);
        startPollingTelegramStatus();
      } else {
        Alert.alert("Error", "Could not generate Telegram link.");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to connect to Telegram.");
    }
  };

  const startPollingTelegramStatus = () => {
    setIsCheckingTelegram(true);
    const interval = setInterval(async () => {
      try {
        const { data } = await api.post('/auth/telegram/check-registration-status', { sessionId });
        if (data.success && data.chatId) {
          clearInterval(interval);
          setTelegramChatId(data.chatId);
          setIsTelegramLinked(true);
          setIsCheckingTelegram(false);
          Alert.alert("Success", "Telegram Linked! Proceeding to ID Scan...");
          setTimeout(() => setStep('front'), 1500);
        }
      } catch (e) {
        // Ignore errors, keep polling
      }
    }, 3000);
  };

  const dummySubmit = () => {
    Alert.alert("Success", "Registration Complete (Mock)");
    onFinish({});
  };

  // --- RENDER HELPERS ---
  const renderHeader = (title: string, subtitle?: string) => (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
    </View>
  );

  // --- RENDER: PHONE INPUT ---
  if (step === 'phone_input') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.padding}>
          {/* Nav Header */}
          <View style={styles.navHeader}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.navTitle}>Register</Text>
          </View>

          {renderHeader("What's your number?", "We'll verify it via Telegram.")}

          {/* Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.prefix}>+855</Text>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              placeholder="12 345 678"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              autoFocus
            />
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.button, { opacity: phoneNumber.length > 5 ? 1 : 0.5 }]}
            disabled={phoneNumber.length <= 5}
            onPress={() => setStep('telegram_verification')}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- RENDER: TELEGRAM VERIFICATION ---
  if (step === 'telegram_verification') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.padding}>
          <TouchableOpacity onPress={() => setStep('phone_input')} style={{ marginBottom: 20 }}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>

          {renderHeader("Connect Telegram", "Secure your account & receive notifications.")}

          <View style={{ alignItems: 'center', marginVertical: 40 }}>
            <MaterialCommunityIcons name="telegram" size={100} color="#229ED9" />
            <Text style={styles.infoText}>
              We use Telegram to send you OTPs and verification updates. Please connect your account.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#229ED9', flexDirection: 'row', gap: 10 }]}
            onPress={getTelegramLink}
          >
            <Ionicons name="paper-plane" size={24} color="white" />
            <Text style={styles.buttonText}>Open Telegram</Text>
          </TouchableOpacity>

          {isCheckingTelegram && (
            <View style={{ marginTop: 20, alignItems: 'center' }}>
              <ActivityIndicator color="#229ED9" />
              <Text style={{ color: '#64748b', marginTop: 10 }}>Waiting for you to click "Start"...</Text>
            </View>
          )}

          {/* DEBUG SKIP */}
          <TouchableOpacity onPress={() => setStep('front')} style={{ marginTop: 40, alignItems: 'center' }}>
            <Text style={{ color: '#cbd5e1' }}>[DEBUG: SKIP TO CAMERA]</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- RENDER: CAMERA STEPS (Mocked for now) ---
  if (step === 'front' || step === 'back' || step === 'selfie') {
    const title = step === 'front' ? "Scan Front ID" : step === 'back' ? "Scan Back ID" : "Take a Selfie";

    return (
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <CameraView style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, width: '100%', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={() => setStep('phone_input')} style={{ padding: 20 }}>
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{title}</Text>
              <View style={{
                width: width - 40, height: 220,
                borderWidth: 2, borderColor: 'white', marginTop: 20
              }} />
            </View>

            <View style={{ alignItems: 'center', marginBottom: 50 }}>
              <TouchableOpacity
                onPress={() => {
                  if (step === 'front') setStep('back');
                  else if (step === 'back') setStep('selfie');
                  else if (step === 'selfie') dummySubmit();
                }}
                style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}
              >
                <View style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'black' }} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Unknown Step: {step}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  padding: { padding: 20 },
  navHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  backButton: { marginRight: 15 },
  navTitle: { fontSize: 20, fontWeight: 'bold' },

  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
  headerSubtitle: { fontSize: 16, color: '#64748b', marginTop: 8 },

  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, height: 56,
    paddingHorizontal: 15, marginBottom: 30
  },
  prefix: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  divider: { width: 1, height: 24, backgroundColor: '#cbd5e1', marginHorizontal: 15 },
  input: { flex: 1, fontSize: 16, color: '#0f172a' },

  button: {
    backgroundColor: '#2563EB', height: 56, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center', shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  infoText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#334155', lineHeight: 24 }
});