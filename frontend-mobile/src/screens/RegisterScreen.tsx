import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView,
  StatusBar, Dimensions, Platform, ActivityIndicator, Switch, Alert, TextInput
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { api, getApiBaseUrls } from '../api/client';

const { width } = Dimensions.get('window');

type Step =
  | 'phone_input'
  | 'front' | 'processing_front'
  | 'back' | 'processing_back'
  | 'selfie' | 'processing_selfie'
  | 'pin_setup' | 'pin_confirm'
  | 'pending_approval';

interface RegisterProps {
  onBack: () => void;
  onFinish: (data: any) => void;
}

export default function RegisterScreen({ onBack, onFinish }: RegisterProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);

  const [step, setStep] = useState<Step>('phone_input'); // Start with phone input
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ Prevent double submit

  // Flash States
  const [flash, setFlash] = useState(false); // Torch (Back)
  const [selfieFlashOn, setSelfieFlashOn] = useState(false); // Button State (Front)
  const [triggerWhiteScreen, setTriggerWhiteScreen] = useState(false);

  const [facing, setFacing] = useState<CameraType>('back');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [faceIDEnabled, setFaceIDEnabled] = useState(true);
  const [extractedData, setExtractedData] = useState<any>(null);

  // ✅ State សម្រាប់រូបភាព
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);

  // --- AUTOMATION ---
  useEffect(() => {
    if (step === 'front' || step === 'back') {
      setFacing('back');
      setSelfieFlashOn(false);
    } else if (step === 'selfie') {
      setTimeout(() => setFacing('front'), 50);
      setFlash(false);
    }
  }, [step]);

  // --- PROCESSING SIMULATION ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'processing_front') {
      timer = setTimeout(() => {
        setStep('back');
      }, 1500); // Simulate processing delay
    } else if (step === 'processing_back') {
      timer = setTimeout(() => {
        setStep('selfie');
      }, 1500);
    } else if (step === 'processing_selfie') {
      // For selfie, we upload data
      uploadDataToBackend();
    }
    return () => clearTimeout(timer);
  }, [step]);

  // --- API CALL (FIXED: NO LOOP, LONG TIMEOUT) ---
  const uploadDataToBackend = async () => {
    if (isSubmitting) return; // ✅ Prevent double execution
    setIsSubmitting(true);

    try {
      console.log("📤 Sending data to Backend (Single Attempt)...");

      if (!frontImage || !backImage || !selfieImage) {
        Alert.alert("Error", "Missing photos. Please try again.");
        setStep('front');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        nameEn: "",
        nameKh: "",
        idNumber: "",
        gender: "male",
        address: "",
        phoneNumber: phoneNumber, // ✅ Send Phone Number
        frontImage: frontImage,
        backImage: backImage,
        selfieImage: selfieImage
      };

      // ✅ Get Base URL
      const { apiBaseUrl } = getApiBaseUrls();
      const url = `${apiBaseUrl}/kyc/submit`;

      console.log(`Target URL: ${url}`);

      // ✅ Send Request with 120s Timeout
      const response = await axios.post(url, payload, { timeout: 120000 });

      console.log("Response Status:", response.status);

      const isSuccessful =
        response?.data?.success === true ||
        response?.data?.result?.data?.json?.success === true ||
        typeof response?.data?.userId === "number" ||
        typeof response?.data?.result?.data?.userId === "number";

      if (isSuccessful) {
        console.log("✅ Upload Successful!");

        const backendResult = response.data.result?.data?.json || response.data;
        const ocrData = backendResult.extractedData || {};

        const finalData = {
          nameEn: ocrData.nameEn || "New User",
          id: ocrData.nationalId || `ID_${Date.now()}`, // Fallback if OCR fails
          validUntil: ocrData.expiryDate || "Unknown Date",
          avatar: selfieImage
        };

        setExtractedData(finalData);

        // Move to next step
        setStep('pin_setup');
      } else {
        throw new Error("API returned success=false");
      }

    } catch (error: any) {
      console.error("Upload Error:", error);

      Alert.alert(
        "Upload Failed",
        "Connection timed out or failed. Please check your internet and try again."
      );
      setStep('selfie'); // Let user retry manually
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ACTIONS ---
  const handleStepBack = () => {
    if (step === 'phone_input') onBack();
    else if (step === 'front') setStep('phone_input');
    else if (step === 'back') setStep('front');
    else if (step === 'selfie') setStep('back');
    else if (step === 'pin_setup') setStep('selfie');
    else if (step === 'pin_confirm') {
      setStep('pin_setup');
      setPin('');
    }
  };

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        console.log("📸 Attempting to take picture...");
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.5,
          skipProcessing: true,
          exif: false
        });

        if (!photo || !photo.base64) {
          throw new Error("Failed to capture image data");
        }

        console.log("✅ Picture taken:", photo.uri);
        const base64Img = `data:image/jpeg;base64,${photo.base64}`;

        if (step === 'front') {
          setFrontImage(base64Img);
          setStep('processing_front');
        } else if (step === 'back') {
          setBackImage(base64Img);
          setStep('processing_back');
        } else if (step === 'selfie') {
          // ... selfie logic ...
          // Simplified for debugging safety, recursive logic was risky
          setSelfieImage(base64Img);
          setStep('processing_selfie');
        }
      } catch (e: any) {
        console.error("Failed to capture photo:", e);
        Alert.alert("Camera Error", e.message || "Could not take photo.");
      }
    } else {
      console.warn("Camera ref is null");
    }
  };

  const toggleFlashButton = () => {
    if (facing === 'front') setSelfieFlashOn(!selfieFlashOn);
    else setFlash(!flash);
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

  if (step === 'phone_input') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={28} color="#0F172A" />
          </TouchableOpacity>
        </View>
        <View style={{ padding: 24 }}>
          <Text style={styles.titleMain}>Telegram Phone Number</Text>
          <Text style={styles.stepText}>Enter the number connected to your Telegram account</Text>

          <View style={{
            marginTop: 30,
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 18, marginRight: 10, color: '#64748B' }}>+855</Text>
            <View style={{ width: 1, height: 24, backgroundColor: '#E2E8F0', marginRight: 10 }} />
            <TextInput
              style={{ flex: 1, fontSize: 18, color: '#0F172A' }}
              placeholder="Enter Number"
              placeholderTextColor="#CBD5E1"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              autoFocus={true}
            />
          </View>

          <TouchableOpacity
            style={{
              marginTop: 24,
              backgroundColor: phoneNumber.length >= 8 ? '#2563EB' : '#94A3B8',
              padding: 16,
              borderRadius: 14,
              alignItems: 'center',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2
            }}
            disabled={phoneNumber.length < 8}
            onPress={() => setStep('front')}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.infoText}>សូមរង់ចាំការត្រួតពិនិត្យពី Admin។</Text>
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
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.pinContent}>
          <View style={{ alignItems: 'center', marginTop: 10 }}>
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

          <View style={{ flex: 1 }} />

          {!isConfirm && (
            <View style={styles.biometricCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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

  // CAMERA UI
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Camera permission needed.</Text>
        <TouchableOpacity onPress={requestPermission} style={{ marginTop: 20, padding: 10, backgroundColor: '#2563EB', borderRadius: 8 }}>
          <Text style={{ color: 'white' }}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isProcessing = step.includes('processing');
  const isSelfieStep = step === 'selfie' || step === 'processing_selfie';
  const isBack = step === 'back' || step === 'processing_back';

  let titleText = "Scan National ID";
  let khmerText = "ស្កេនអត្តសញ្ញាណប័ណ្ណ";
  let guideText = "Front Side / ផ្នែកខាងមុខ";
  let stepCount = "Step 1 of 3";

  if (isBack) {
    guideText = "Back Side / ផ្នែកខាងក្រោយ";
    stepCount = "Step 2 of 3";
  } else if (isSelfieStep) {
    titleText = "Selfie with ID";
    khmerText = "ថតរូបជាមួយអត្តសញ្ញាណប័ណ្ណ";
    stepCount = "Step 3 of 3";
  }

  const isFlashBtnActive = (facing === 'back' && flash) || (facing === 'front' && selfieFlashOn);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {triggerWhiteScreen && <View style={styles.screenFlash} pointerEvents="none" />}

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleStepBack}>
          <Ionicons name="arrow-back" size={28} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitleDark}>Identity Verification</Text>
          <View style={styles.paginationContainer}>
            <View style={[styles.dot, (step === 'front' || step === 'processing_front') && styles.activeDot]} />
            <View style={[styles.dot, (step === 'back' || step === 'processing_back') && styles.activeDot]} />
            <View style={[styles.dot, (step === 'selfie' || step === 'processing_selfie') && styles.activeDot]} />
          </View>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.cameraSection}>
        <Text style={styles.titleMain}>{titleText}</Text>
        <Text style={styles.titleKhmer}>{khmerText}</Text>
        <Text style={styles.stepText}>{stepCount}</Text>

        <View style={styles.cameraContainer}>
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#2563EB" style={{ transform: [{ scale: 1.5 }], marginBottom: 20 }} />
              <Text style={styles.processingTitle}>Processing</Text>
              <Text style={styles.processingSub}>Verifying image quality...</Text>
              {isSelfieStep && <Text style={styles.processingKhmer}>Sending to Backend (This may take a minute)...</Text>}
            </View>
          ) : (
            <View style={styles.cameraCard}>
              <CameraView
                key={step}
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                facing={facing}
                enableTorch={!isSelfieStep && flash}
                onCameraReady={() => {
                  console.log("Camera is ready!");
                  setIsCameraReady(true);
                }}
              />

              <View style={styles.overlayContainer}>
                <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                  <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
                </View>

                <View style={[styles.frame, isSelfieStep ? styles.circleFrame : styles.rectFrame]}>
                  {isSelfieStep && (
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
                  {!isSelfieStep && <View style={styles.guidePill}><Text style={styles.guidePillText}>{guideText}</Text></View>}
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

              <TouchableOpacity style={styles.controlItem} onPress={toggleFlashButton}>
                <View style={[styles.circleBtnSmall, isFlashBtnActive && { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name={isFlashBtnActive ? "flash" : "flash-off"} size={24} color={isFlashBtnActive ? "#F59E0B" : "#64748B"} />
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
  idCardHint: { position: 'absolute', bottom: -10, right: -10, transform: [{ rotate: '-10deg' }] },
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