import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, 
  StatusBar, TextInput, Alert, Dimensions, Platform, ActivityIndicator 
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';

const { width } = Dimensions.get('window');
const CONTENT_WIDTH = width * 0.9;

const STEPS = {
  1: { title: "ID Front", subtitle: "ថតផ្នែកខាងមុខនៃអត្តសញ្ញាណបណ្ណ", type: 'camera' },
  2: { title: "ID Back", subtitle: "ថតផ្នែកខាងក្រោយនៃអត្តសញ្ញាណបណ្ណ", type: 'camera' },
  3: { title: "Selfie", subtitle: "ថតរូប Selfie ជាមួយអត្តសញ្ញាណបណ្ណ", type: 'camera' },
  4: { title: "Verification", subtitle: "ផ្ទៀងផ្ទាត់ OTP និងកំណត់សុវត្ថិភាព", type: 'form' },
};

// ✅ បន្ថែម Interface សម្រាប់ Props
interface RegisterProps {
  onBack: () => void;
  onFinish: () => void;
}

export default function RegisterScreen({ onBack, onFinish }: RegisterProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState(1);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Data
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [biometricType, setBiometricType] = useState<string | null>(null);

  useEffect(() => {
    checkBiometrics();
  }, []);

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
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        setTimeout(() => {
          setLoading(false);
          if (step < 4) {
            setStep(step + 1);
            if (step === 2) setFacing('front'); 
          }
        }, 800);
      } catch (e) {
        setLoading(false);
        Alert.alert("Error", "Failed to take picture");
      }
    }
  };

  // ✅ កែសម្រួលមុខងារ Finish
  const handleFinish = () => {
    if (otp.length < 4 || pin.length < 4) {
        Alert.alert("Required", "Please enter OTP and create a PIN");
        return;
    }
    
    setLoading(true);
    // Simulation API Call
    setTimeout(() => {
        setLoading(false);
        Alert.alert("ជោគជ័យ", "ការចុះឈ្មោះបានសម្រេច!", [
            { text: "ចូលប្រើប្រព័ន្ធ", onPress: onFinish } // ហៅទៅ App.tsx ដើម្បីចូល Dashboard
        ]);
    }, 1500);
  };

  const renderCameraStep = () => {
    const isSelfie = step === 3;
    return (
      <View style={styles.cameraContainer}>
        <View style={styles.cameraCard}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing={facing}
            enableTorch={flash}
          />
          
          <View style={styles.overlayContainer}>
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
               <LinearGradient
                  colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.3)']}
                  style={StyleSheet.absoluteFill}
               />
            </View>
            <View style={[
              styles.guideFrame, 
              isSelfie ? styles.circleFrame : styles.rectFrame
            ]}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            {loading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="white" /></View>}
          </View>
        </View>

        <View style={styles.camControls}>
          <TouchableOpacity onPress={() => setFlash(!flash)} style={styles.iconBtn}>
            <Ionicons name={flash ? "flash" : "flash-off"} size={24} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCapture} style={styles.shutterBtn}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFacing(c => (c === 'back' ? 'front' : 'back'))} style={styles.iconBtn}>
            <Ionicons name="camera-reverse" size={24} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFormStep = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Telegram OTP</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter 6-digit code"
          keyboardType="number-pad"
          value={otp}
          onChangeText={setOtp}
          maxLength={6}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Create PIN</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Set 6-digit PIN"
          keyboardType="number-pad"
          secureTextEntry
          value={pin}
          onChangeText={setPin}
          maxLength={6}
        />
      </View>
      {biometricType && (
        <TouchableOpacity style={styles.bioBtn}>
          <View style={{flexDirection:'row', alignItems:'center'}}>
            <Ionicons name="finger-print" size={24} color="#2563EB" />
            <Text style={styles.bioText}>Enable {biometricType}</Text>
          </View>
          <Ionicons name="toggle" size={32} color="#2563EB" />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.submitBtn} onPress={handleFinish}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>Finish Setup</Text>}
      </TouchableOpacity>
    </View>
  );

  if (!permission) return <View style={styles.center}><ActivityIndicator color="#2563EB"/></View>;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{marginBottom: 20}}>Camera permission required</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={{color: 'white'}}>Grant Permission</Text>
        </TouchableOpacity>
        {/* ប៊ូតុង Back ករណី User ចង់ថយក្រោយ */}
        <TouchableOpacity style={{marginTop: 20}} onPress={onBack}>
            <Text style={{color: '#64748B'}}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.header}>
        <Text style={styles.stepIndicator}>Step {step} of 4</Text>
        <Text style={styles.stepTitle}>{STEPS[step as keyof typeof STEPS].title}</Text>
        <Text style={styles.stepSub}>{STEPS[step as keyof typeof STEPS].subtitle}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
        </View>
      </View>
      <View style={styles.content}>
        {step <= 3 ? renderCameraStep() : renderFormStep()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  permBtn: { backgroundColor: '#2563EB', padding: 12, borderRadius: 8 },
  header: { paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 10, marginBottom: 20 },
  stepIndicator: { color: '#2563EB', fontWeight: '700', fontSize: 12, marginBottom: 4 },
  stepTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  stepSub: { fontSize: 14, color: '#64748B', marginBottom: 15, fontFamily: Platform.OS === 'ios' ? 'Khmer Sangam MN' : 'serif' },
  progressBar: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2563EB' },
  content: { flex: 1, alignItems: 'center' },
  cameraContainer: { width: CONTENT_WIDTH, alignItems: 'center' },
  cameraCard: { width: '100%', height: CONTENT_WIDTH * 1.2, borderRadius: 24, overflow: 'hidden', backgroundColor: '#000', marginBottom: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  overlayContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  guideFrame: { borderColor: 'rgba(255,255,255,0.8)', borderWidth: 1 },
  rectFrame: { width: '85%', height: '60%', borderRadius: 12 },
  circleFrame: { width: 250, height: 250, borderRadius: 125 },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: '#2563EB', borderWidth: 4 },
  topLeft: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0 },
  camControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '80%' },
  shutterBtn: { width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: '#2563EB', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563EB' },
  iconBtn: { padding: 10, backgroundColor: '#EFF6FF', borderRadius: 50 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  formContainer: { width: CONTENT_WIDTH, paddingTop: 10 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: 'white', height: 50, borderRadius: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 16 },
  bioBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EFF6FF', padding: 15, borderRadius: 12, marginBottom: 30 },
  bioText: { color: '#2563EB', fontWeight: '600', marginLeft: 10 },
  submitBtn: { backgroundColor: '#2563EB', height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});