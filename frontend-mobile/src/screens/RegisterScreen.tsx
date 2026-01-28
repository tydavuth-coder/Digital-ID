import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Image, 
  SafeAreaView, StatusBar, TextInput, Alert, Dimensions, ScrollView, Platform 
} from 'react-native';
import { CameraView, CameraType, FlashMode } from 'expo-camera';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// ជំហាននៃការចុះឈ្មោះ
const STEPS = {
  1: { title: "ID Front", subtitle: "ថតផ្នែកខាងមុខនៃអត្តសញ្ញាណបណ្ណ", type: 'camera' },
  2: { title: "ID Back", subtitle: "ថតផ្នែកខាងក្រោយនៃអត្តសញ្ញាណបណ្ណ", type: 'camera' },
  3: { title: "Selfie", subtitle: "ថតរូប Selfie ជាមួយអត្តសញ្ញាណបណ្ណ", type: 'camera' },
  4: { title: "Verify OTP", subtitle: "បញ្ចូលលេខកូដដែលបានផ្ញើទៅ Telegram", type: 'form' },
  5: { title: "Security", subtitle: "កំណត់ PIN និង FaceID", type: 'security' }
};

export default function RegisterScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [step, setStep] = useState(1);
  const [permission, setPermission] = useState<boolean | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data Storage
  const [images, setImages] = useState({ front: null, back: null, selfie: null });
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [biometricType, setBiometricType] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await CameraView.requestCameraPermissionsAsync();
      setPermission(status === 'granted');
      checkBiometrics();
    })();
  }, []);

  // ពិនិត្យមើលថាតើទូរស័ព្ទមាន FaceID/Fingerprint ដែរឬទេ
  const checkBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (hasHardware) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType("Face ID");
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType("Touch ID");
      }
    }
  };

  const handleCapture = async () => {
    if (cameraRef.current) {
      setLoading(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        
        if (step === 1) setImages({ ...images, front: photo.uri });
        if (step === 2) setImages({ ...images, back: photo.uri });
        if (step === 3) setImages({ ...images, selfie: photo.uri });

        // ទៅជំហានបន្ទាប់
        setTimeout(() => {
          setLoading(false);
          setStep(step + 1);
          if (step === 2) setFacing('front'); // ប្តូរទៅកាមេរ៉ាមុខសម្រាប់ Selfie
        }, 500);
      } catch (e) {
        setLoading(false);
        Alert.alert("Error", "Failed to take picture");
      }
    }
  };

  const handleVerifyOTP = () => {
    if (otp.length < 4) {
      Alert.alert("Error", "សូមបញ្ចូលលេខ OTP ឲ្យបានត្រឹមត្រូវ");
      return;
    }
    // Simulation API Call
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(5);
    }, 1000);
  };

  const handleBiometricAuth = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to enable Digital ID',
    });
    if (result.success) {
      Alert.alert("Success", "Biometric Enabled!");
      // Finish Registration Logic Here
    }
  };

  // --- RENDER FUNCTIONS ---

  const renderCameraOverlay = () => {
    const isSelfie = step === 3;
    return (
      <View style={styles.overlayContainer}>
        {/* Mask */}
        <View style={styles.maskOutter}>
          <View style={[{ flex: 1 }, styles.maskOverlay]} />
          <View style={{ flexDirection: 'row', height: isSelfie ? 350 : 220 }}>
            <View style={[{ flex: 1 }, styles.maskOverlay]} />
            
            {/* The Clear Frame */}
            <View style={[
              styles.scanBox, 
              { 
                width: isSelfie ? 350 : 340, 
                height: isSelfie ? 350 : 220,
                borderRadius: isSelfie ? 175 : 15 // Circle for selfie, Rect for ID
              }
            ]}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            <View style={[{ flex: 1 }, styles.maskOverlay]} />
          </View>
          <View style={[{ flex: 1 }, styles.maskOverlay]} />
        </View>

        {/* Controls */}
        <View style={styles.cameraControls}>
          <TouchableOpacity onPress={() => setFlash(!flash)} style={styles.controlBtn}>
            <Ionicons name={flash ? "flash" : "flash-off"} size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCapture} style={styles.captureBtnOuter}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))} style={styles.controlBtn}>
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderOTP = () => (
    <View style={styles.formContainer}>
      <MaterialCommunityIcons name="telegram" size={60} color="#38bdf8" />
      <Text style={styles.formTitle}>Telegram Verification</Text>
      <Text style={styles.formSub}>បានផ្ញើលេខកូដទៅគណនី Telegram របស់អ្នក</Text>
      
      <TextInput 
        style={styles.input}
        placeholder="Enter OTP"
        placeholderTextColor="#666"
        keyboardType="number-pad"
        value={otp}
        onChangeText={setOtp}
        maxLength={6}
      />
      
      <TouchableOpacity style={styles.mainBtn} onPress={handleVerifyOTP}>
        <Text style={styles.mainBtnText}>ផ្ទៀងផ្ទាត់ (Verify)</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSecurity = () => (
    <View style={styles.formContainer}>
      <Ionicons name="shield-checkmark" size={60} color="#10b981" />
      <Text style={styles.formTitle}>Secure Your ID</Text>
      <Text style={styles.formSub}>បង្កើតលេខសម្ងាត់ PIN និង FaceID</Text>

      <TextInput 
        style={styles.input}
        placeholder="Create 6-digit PIN"
        placeholderTextColor="#666"
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        value={pin}
        onChangeText={setPin}
      />

      {biometricType && (
        <TouchableOpacity style={styles.bioBtn} onPress={handleBiometricAuth}>
          <Ionicons name="finger-print" size={24} color="white" />
          <Text style={styles.bioBtnText}>Enable {biometricType}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={[styles.mainBtn, { marginTop: 20 }]} 
        onPress={() => Alert.alert("Done", "Registration Complete! Redirecting to Dashboard...")}
      >
        <Text style={styles.mainBtnText}>បញ្ចប់ការចុះឈ្មោះ</Text>
      </TouchableOpacity>
    </View>
  );

  if (permission === null) return <View />;
  if (permission === false) return <Text>No Camera Access</Text>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Progress Bar */}
      <SafeAreaView style={styles.header}>
        <View style={styles.progressRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.progressDot, step >= i && styles.progressActive]} />
          ))}
        </View>
        <Text style={styles.headerTitle}>{STEPS[step as keyof typeof STEPS].title}</Text>
        <Text style={styles.headerSub}>{STEPS[step as keyof typeof STEPS].subtitle}</Text>
      </SafeAreaView>

      {/* Main Content */}
      <View style={styles.content}>
        {step <= 3 ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing={facing}
            enableTorch={flash}
          >
            {renderCameraOverlay()}
          </CameraView>
        ) : (
          <View style={styles.whiteCard}>
            {step === 4 && renderOTP()}
            {step === 5 && renderSecurity()}
          </View>
        )}
      </View>

      {loading && (
        <BlurView intensity={20} style={styles.loadingOverlay}>
          <Text style={{color: 'white', fontWeight: 'bold'}}>Processing...</Text>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  
  // Header
  header: { alignItems: 'center', paddingTop: Platform.OS === 'android' ? 40 : 0, paddingBottom: 10, zIndex: 10 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  headerSub: { color: '#94a3b8', fontSize: 14 },
  progressRow: { flexDirection: 'row', gap: 8 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#334155' },
  progressActive: { backgroundColor: '#38bdf8', width: 20 },

  content: { flex: 1, overflow: 'hidden', borderTopLeftRadius: 30, borderTopRightRadius: 30 },

  // Camera Overlay
  overlayContainer: { flex: 1 },
  maskOutter: { flex: 1, justifyContent: 'center' },
  maskOverlay: { backgroundColor: 'rgba(0,0,0,0.7)' },
  scanBox: { borderColor: '#38bdf8', borderWidth: 2, backgroundColor: 'transparent' },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: '#38bdf8', borderWidth: 4 },
  topLeft: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0 },

  // Camera Controls
  cameraControls: { 
    height: 100, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.8)', paddingBottom: 20 
  },
  captureBtnOuter: { 
    width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: 'white', 
    justifyContent: 'center', alignItems: 'center' 
  },
  captureBtnInner: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: 'white' },
  controlBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 25 },

  // Form Styles
  whiteCard: { flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  formContainer: { width: '80%', alignItems: 'center' },
  formTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginTop: 10 },
  formSub: { color: '#64748b', textAlign: 'center', marginBottom: 30 },
  input: { 
    width: '100%', height: 50, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, 
    paddingHorizontal: 15, fontSize: 18, marginBottom: 20, backgroundColor: 'white', color: 'black'
  },
  mainBtn: { 
    width: '100%', height: 50, backgroundColor: '#38bdf8', borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center', shadowColor: '#38bdf8', shadowOpacity: 0.3, shadowRadius: 10 
  },
  mainBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  
  bioBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 15, 
    backgroundColor: '#334155', borderRadius: 12, marginTop: 10 
  },
  bioBtnText: { color: 'white', fontWeight: '600' },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }
});