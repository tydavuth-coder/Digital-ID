import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, 
  StatusBar, Dimensions, Platform, ActivityIndicator, Switch, Alert, Image 
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../api/client'; // Ensure this is correctly imported

const { width } = Dimensions.get('window');

type Step = 
  | 'front' | 'processing_front' 
  | 'back' | 'processing_back' 
  | 'selfie' | 'processing_selfie' 
  | 'pin_setup' | 'pin_confirm'
  | 'pending_approval';

interface RegisterProps {
  onBack: () => void;
  onFinish: (data: any) => void;
}

const MOCK_DATA_FROM_BACKEND = {
  nameEn: "SOKHA DARA",
  id: "123-999-888",
  validUntil: "Dec 2030",
  avatar: "https://i.pravatar.cc/150?img=12"
};

export default function RegisterScreen({ onBack, onFinish }: RegisterProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  
  const [step, setStep] = useState<Step>('front');
  const [flash, setFlash] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [faceIDEnabled, setFaceIDEnabled] = useState(true);
  const [extractedData, setExtractedData] = useState<any>(null);

  // --- AUTOMATED CAMERA SWITCHING ---
  useEffect(() => {
    if (step === 'front' || step === 'back') {
      setFacing('back');
      setFlash(false);
    } else if (step === 'selfie') {
      setFacing('front');
      setFlash(false);
    }
  }, [step]);

  // --- AUTOMATED PROCESSING ---
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (step === 'processing_front') {
      timer = setTimeout(() => setStep('back'), 2000);
    } 
    else if (step === 'processing_back') {
      timer = setTimeout(() => setStep('selfie'), 2000);
    } 
    else if (step === 'processing_selfie') {
      uploadDataToBackend();
    }

    return () => clearTimeout(timer);
  }, [step]);

  const uploadDataToBackend = async () => {
    try {
        console.log("📤 Uploading data to Backend...");
        
        // Mock Data payload (In real app, send Base64 images)
        const payload = {
            nameEn: "New User",
            idNumber: "N/A", // Will be extracted by backend in real OCR
            frontImage: "placeholder_base64",
            backImage: "placeholder_base64",
            selfieImage: "placeholder_base64"
        };

        // ✅ CALL API (Public Procedure)
        await api.post('/trpc/kyc.submit', { json: payload });
        
        // Success
        setTimeout(() => {
            setExtractedData(MOCK_DATA_FROM_BACKEND);
            setStep('pin_setup');
        }, 1500);

    } catch (error) {
        console.error("Upload Failed:", error);
        // Fallback for demo if offline
        setExtractedData(MOCK_DATA_FROM_BACKEND);
        setStep('pin_setup');
    }
  };

  // --- ACTIONS ---

  const handleStepBack = () => {
    if (step === 'front') onBack();
    else if (step === 'back') setStep('front');
    else if (step === 'selfie') setStep('back');
    else if (step === 'pin_setup') setStep('selfie');
    else if (step === 'pin_confirm') {
        setStep('pin_setup');
        setPin('');
    }
  };

  const handleCapture = async () => {
    if (step === 'selfie') {
        setScreenFlash(true); // Screen Flash Effect
        setTimeout(() => {
            setScreenFlash(false);
            setStep('processing_selfie');
        }, 300);
    } else {
        if (step === 'front') setStep('processing_front');
        else if (step === 'back') setStep('processing_back');
    }
  };

  const toggleFlash = () => {
    if (facing === 'front') setScreenFlash(!screenFlash); // Fake flash for selfie
    else setFlash(!flash); // Real torch for back
  };

  const handlePinInput = (num: string) => {
    if (step === 'pin_setup') {
      if (num === 'del') setPin(prev => prev.slice(0, -1));
      else if (pin.length < 6) {
        const newPin = pin + num;
        setPin(newPin);
        if (newPin.length === 6) setTimeout(() => setStep('pin_confirm'), 300);
      }
    } else if (step === 'pin_confirm') {
      if (num === 'del') setConfirmPin(prev => prev.slice(0, -1));
      else if (confirmPin.length < 6) {
        const newConfirm = confirmPin + num;
        setConfirmPin(newConfirm);
        if (newConfirm.length === 6) {
          if (newConfirm === pin) {
            setTimeout(() => setStep('pending_approval'), 300);
          } else {
            Alert.alert("Error", "PINs do not match");
            setConfirmPin('');
          }
        }
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing(c => (c === 'back' ? 'front' : 'back'));
  };

  // --- RENDERERS ---

  if (step === 'pending_approval') {
    return (
      <View style={styles.pendingContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.pendingContent}>
            <View style={styles.successIcon}>
                <Ionicons name="time" size={60} color="#F59E0B" />
            </View>
            <Text style={styles.pendingTitle}>កំពុងរង់ចាំការអនុម័ត</Text>
            <Text style={styles.pendingSubTitle}>Pending Approval</Text>
            <View style={styles.infoCard}>
                <Text style={styles.infoText}>ឯកសាររបស់អ្នកត្រូវបានបញ្ជូនទៅកាន់ប្រព័ន្ធ។</Text>
                <Text style={styles.infoTextId}>ID: {extractedData?.id || '...'}</Text>
            </View>
            <TouchableOpacity style={styles.homeBtn} onPress={() => onFinish(extractedData)}>
                <Text style={styles.homeBtnText}>ត្រឡប់ទៅទំព័រដើម</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  }

  // PIN UI
  if (step === 'pin_setup' || step === 'pin_confirm') {
    const isConfirm = step === 'pin_confirm';
    const currentPin = isConfirm ? confirmPin : pin;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleStepBack}>
                <Ionicons name="arrow-back" size={28} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.headerTitleDark}>Security Setup</Text>
            <View style={{width: 28}} />
        </View>
        <View style={styles.pinContent}>
          <View style={{alignItems: 'center', marginTop: 10}}>
            <View style={styles.lockIconBg}>
                <MaterialIcons name={isConfirm ? "lock" : "lock-outline"} size={36} color="#2563EB" />
            </View>
            <Text style={styles.pinTitleMain}>{isConfirm ? "Confirm New PIN" : "Set Your PIN Code"}</Text>
            <Text style={styles.pinSubtitle}>Create a 6-digit PIN to secure your digital identity.</Text>
            <View style={styles.pinDotsRow}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={[styles.pinDotCircle, currentPin.length >= i ? styles.pinDotFilled : null]} />
                ))}
            </View>
          </View>
          <View style={{height: 20}} />
          {!isConfirm && (
            <View style={styles.biometricCard}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <View style={styles.faceIdIcon}>
                        <MaterialIcons name="face" size={22} color="#2563EB" />
                    </View>
                    <View>
                        <Text style={styles.bioTitle}>Enable FaceID</Text>
                        <Text style={styles.bioSub}>Use biometrics for faster login</Text>
                    </View>
                </View>
                <Switch value={faceIDEnabled} onValueChange={setFaceIDEnabled} trackColor={{ false: "#767577", true: "#2563EB" }} thumbColor={"#f4f3f4"} />
            </View>
          )}
          <View style={styles.keypad}>
            {[
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['', '0', 'del']
            ].map((row, rIdx) => (
                <View key={rIdx} style={styles.keyRow}>
                    {row.map((key, kIdx) => (
                        <TouchableOpacity key={kIdx} style={styles.keyButton} onPress={() => handlePinInput(key)} disabled={key === ''}>
                            {key === 'del' ? <Ionicons name="backspace-outline" size={28} color="#0F172A" /> : <Text style={styles.keyText}>{key}</Text>}
                        </TouchableOpacity>
                    ))}
                </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // CAMERA & PROCESSING
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
        <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
            <Text>Camera permission needed.</Text>
            <TouchableOpacity onPress={requestPermission} style={{marginTop: 20, padding: 10, backgroundColor: '#2563EB', borderRadius: 8}}>
                <Text style={{color: 'white'}}>Allow Camera</Text>
            </TouchableOpacity>
        </View>
    );
  }

  const isProcessing = step.includes('processing');
  const isSelfie = step === 'selfie' || step === 'processing_selfie';
  const isBack = step === 'back' || step === 'processing_back';

  let titleText = "Scan National ID";
  let khmerText = "ស្កេនអត្តសញ្ញាណប័ណ្ណ";
  let guideText = "Front Side / ផ្នែកខាងមុខ";
  let stepCount = "Step 1 of 3";

  if (isBack) {
    guideText = "Back Side / ផ្នែកខាងក្រោយ";
    stepCount = "Step 2 of 3";
  } else if (isSelfie) {
    titleText = "Selfie with ID";
    khmerText = "ថតរូបជាមួយអត្តសញ្ញាណប័ណ្ណ";
    stepCount = "Step 3 of 3";
  }

  const isFlashActive = (facing === 'back' && flash) || (facing === 'front' && screenFlash);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {screenFlash && <View style={styles.screenFlash} pointerEvents="none" />}

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleStepBack}>
          <Ionicons name="arrow-back" size={28} color="#0F172A" />
        </TouchableOpacity>
        <View style={{alignItems: 'center'}}>
            <Text style={styles.headerTitleDark}>Identity Verification</Text>
            <View style={styles.paginationContainer}>
                <View style={[styles.dot, (step === 'front' || step === 'processing_front') && styles.activeDot]} />
                <View style={[styles.dot, (step === 'back' || step === 'processing_back') && styles.activeDot]} />
                <View style={[styles.dot, (step === 'selfie' || step === 'processing_selfie') && styles.activeDot]} />
            </View>
        </View>
        <View style={{width: 28}} /> 
      </View>

      <View style={styles.cameraSection}>
        <Text style={styles.titleMain}>{titleText}</Text>
        <Text style={styles.titleKhmer}>{khmerText}</Text>
        <Text style={styles.stepText}>{stepCount}</Text>

        <View style={styles.cameraContainer}>
            {isProcessing ? (
                <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color="#2563EB" style={{transform: [{scale: 1.5}], marginBottom: 20}} />
                    <Text style={styles.processingTitle}>Processing</Text>
                    <Text style={styles.processingSub}>Verifying image quality...</Text>
                    {isSelfie && <Text style={styles.processingKhmer}>Sending to Backend...</Text>}
                </View>
            ) : (
                <View style={styles.cameraCard}>
                    {/* ✅ FIXED: Key={facing} forces camera reload when switching */}
                    <CameraView
                        key={facing} 
                        ref={cameraRef}
                        style={StyleSheet.absoluteFillObject}
                        facing={facing}
                        enableTorch={!isSelfie && flash}
                    />
                    <View style={styles.overlayContainer}>
                        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                            <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
                        </View>
                        <View style={[styles.frame, isSelfie ? styles.circleFrame : styles.rectFrame]}>
                            {isSelfie && (
                                <View style={styles.selfiePlaceholder}>
                                    <Ionicons name="person" size={120} color="rgba(255,255,255,0.3)" />
                                    <View style={styles.idCardHint}>
                                        <MaterialCommunityIcons name="card-account-details-outline" size={50} color="rgba(255,255,255,0.5)" />
                                    </View>
                                </View>
                            )}
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                            {!isSelfie && <View style={styles.guidePill}><Text style={styles.guidePillText}>{guideText}</Text></View>}
                        </View>
                    </View>
                </View>
            )}
        </View>

        {!isProcessing && (
            <>
                <View style={styles.hintContainer}>
                    <MaterialIcons name="wb-sunny" size={20} color="#2563EB" />
                    <Text style={styles.hintTitle}>Lighting Check</Text>
                </View>
                <Text style={styles.hintText}>Make sure the lighting is good and letters are clear.</Text>
                <Text style={styles.hintTextKhmer}>សូមប្រាកដថាពន្លឺគ្រប់គ្រាន់ និងអក្សរច្បាស់ល្អ</Text>

                <View style={styles.bottomControls}>
                    <TouchableOpacity style={styles.controlItem} onPress={toggleCameraFacing}>
                        <View style={styles.circleBtnSmall}>
                            <Ionicons name="camera-reverse-outline" size={24} color="#64748B" />
                        </View>
                        <Text style={styles.controlLabel}>Flip</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.shutterOuter} onPress={handleCapture}>
                        <View style={styles.shutterInner} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.controlItem} onPress={toggleFlash}>
                        <View style={[styles.circleBtnSmall, isFlashActive && {backgroundColor: '#FEF3C7'}]}>
                            <Ionicons name={isFlashActive ? "flash" : "flash-off"} size={24} color={isFlashActive ? "#F59E0B" : "#64748B"} />
                        </View>
                        <Text style={styles.controlLabel}>Flash</Text>
                    </TouchableOpacity>
                </View>
            </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  screenFlash: { ...StyleSheet.absoluteFillObject, backgroundColor: 'white', zIndex: 999 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, marginBottom: 10 },
  headerTitleDark: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  paginationContainer: { flexDirection: 'row', gap: 6, marginTop: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  activeDot: { backgroundColor: '#2563EB', width: 18 },
  cameraSection: { flex: 1, alignItems: 'center' },
  titleMain: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 10 },
  titleKhmer: { fontSize: 16, color: '#475569', marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Khmer Sangam MN' : 'serif' },
  stepText: { fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 20 },
  cameraContainer: { width: width, alignItems: 'center', justifyContent: 'center' },
  cameraCard: { width: '90%', height: 260, borderRadius: 20, overflow: 'hidden', backgroundColor: 'black', elevation: 5 },
  processingContainer: { width: '90%', height: 260, borderRadius: 20, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center', padding: 20, borderWidth: 1, borderColor: '#1e293b' },
  processingTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  processingSub: { color: '#94a3b8', fontSize: 14, marginTop: 5 },
  processingKhmer: { color: '#64748b', fontSize: 14, marginTop: 2 },
  overlayContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  frame: { borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1 },
  rectFrame: { width: '85%', height: '70%', borderRadius: 12 },
  circleFrame: { width: 220, height: 220, borderRadius: 110, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  selfiePlaceholder: { justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  idCardHint: { position: 'absolute', bottom: -10, right: -10, transform: [{rotate: '-10deg'}] },
  corner: { position: 'absolute', width: 25, height: 25, borderColor: '#2563EB', borderWidth: 4, borderRadius: 4 },
  topLeft: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0 },
  guidePill: { position: 'absolute', alignSelf: 'center', top: '45%', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
  guidePillText: { color: 'white', fontSize: 12, fontWeight: '600' },
  hintContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 5 },
  hintTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginLeft: 6 },
  hintText: { fontSize: 12, color: '#64748B', textAlign: 'center' },
  hintTextKhmer: { fontSize: 12, color: '#64748B', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Khmer Sangam MN' : 'serif' },
  bottomControls: { flexDirection: 'row', width: '100%', justifyContent: 'space-evenly', alignItems: 'center', position: 'absolute', bottom: 30 },
  controlItem: { alignItems: 'center', width: 60 },
  circleBtnSmall: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  controlLabel: { fontSize: 11, color: '#64748B' },
  shutterOuter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#2563EB', padding: 4 },
  shutterInner: { flex: 1, borderRadius: 32, backgroundColor: 'transparent', borderWidth: 2, borderColor: '#2563EB' },
  pinContent: { flex: 1, paddingHorizontal: 30, justifyContent: 'space-between', paddingBottom: 40 },
  lockIconBg: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  pinTitleMain: { fontSize: 20, fontWeight: 'bold', color: '#0F172A', textAlign: 'center' },
  pinSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 5 },
  pinDotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 30 },
  pinDotCircle: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#94A3B8' },
  pinDotFilled: { backgroundColor: '#2563EB', borderColor: '#2563EB', width: 14, height: 14 },
  biometricCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 15 },
  faceIdIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  bioTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  bioSub: { fontSize: 11, color: '#64748B' },
  keypad: { width: '100%' },
  keyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, paddingHorizontal: 20 },
  keyButton: { width: 70, height: 70, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 26, color: '#0F172A', fontWeight: '500' },
  pendingContainer: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 30 },
  pendingContent: { alignItems: 'center', width: '100%' },
  successIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  pendingTitle: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', fontFamily: Platform.OS === 'ios' ? 'Khmer Sangam MN' : 'serif' },
  pendingSubTitle: { fontSize: 16, color: '#64748B', marginTop: 5 },
  infoCard: { backgroundColor: 'white', padding: 20, borderRadius: 16, width: '100%', alignItems: 'center', marginTop: 40, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  infoText: { textAlign: 'center', color: '#64748B', lineHeight: 24, fontSize: 14 },
  infoTextId: { fontWeight: 'bold', color: '#0F172A', marginTop: 10, fontSize: 16 },
  homeBtn: { marginTop: 50, backgroundColor: '#2563EB', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, elevation: 5 },
  homeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});