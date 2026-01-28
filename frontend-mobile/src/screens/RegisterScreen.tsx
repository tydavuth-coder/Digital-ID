import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, 
  StatusBar, Dimensions, Platform, ActivityIndicator, Switch, Alert, Image 
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// ជំហាននៃការចុះឈ្មោះ (Updated Flow)
type Step = 
  | 'front' | 'processing_front' 
  | 'back' | 'processing_back' 
  | 'selfie' | 'processing_selfie' 
  | 'pin_setup' | 'pin_confirm';

interface RegisterProps {
  onBack: () => void;
  onFinish: () => void;
}

export default function RegisterScreen({ onBack, onFinish }: RegisterProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  
  // State
  const [step, setStep] = useState<Step>('front');
  const [flash, setFlash] = useState(false);
  
  // PIN State
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [faceIDEnabled, setFaceIDEnabled] = useState(true);

  // --- AUTOMATED PROCESSING LOGIC ---
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (step === 'processing_front') {
      timer = setTimeout(() => setStep('back'), 2000); // 2s delay
    } 
    else if (step === 'processing_back') {
      timer = setTimeout(() => setStep('selfie'), 2000);
    } 
    else if (step === 'processing_selfie') {
      timer = setTimeout(() => setStep('pin_setup'), 2000);
    }

    return () => clearTimeout(timer);
  }, [step]);

  // --- ACTIONS ---

  const handleCapture = async () => {
    if (step === 'front') setStep('processing_front');
    else if (step === 'back') setStep('processing_back');
    else if (step === 'selfie') setStep('processing_selfie');
  };

  const handlePinInput = (num: string) => {
    // Logic សម្រាប់ Setup PIN
    if (step === 'pin_setup') {
      if (num === 'del') {
        setPin(prev => prev.slice(0, -1));
      } else if (pin.length < 6) {
        const newPin = pin + num;
        setPin(newPin);
        if (newPin.length === 6) {
          setTimeout(() => setStep('pin_confirm'), 300); // ពេញ 6 ខ្ទង់ ទៅ Confirm
        }
      }
    } 
    // Logic សម្រាប់ Confirm PIN
    else if (step === 'pin_confirm') {
      if (num === 'del') {
        setConfirmPin(prev => prev.slice(0, -1));
      } else if (confirmPin.length < 6) {
        const newConfirm = confirmPin + num;
        setConfirmPin(newConfirm);
        
        if (newConfirm.length === 6) {
          if (newConfirm === pin) {
            // PIN ដូចគ្នា -> ជោគជ័យ
            setTimeout(() => {
                Alert.alert("ជោគជ័យ", "គណនីរបស់អ្នកត្រូវបានបង្កើត!", [
                    { text: "ចូល Dashboard", onPress: onFinish }
                ]);
            }, 300);
          } else {
            // PIN ខុសគ្នា -> Reset Confirm
            Alert.alert("Error", "លេខ PIN មិនដូចគ្នាទេ។ សូមព្យាយាមម្តងទៀត។");
            setConfirmPin('');
          }
        }
      }
    }
  };

  // --- RENDERERS ---

  // 1. HEADER
  const renderHeader = () => {
    const isPinStep = step === 'pin_setup' || step === 'pin_confirm';
    
    return (
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={28} color="#0F172A" />
        </TouchableOpacity>
        
        {!isPinStep ? (
            <View style={{alignItems: 'center'}}>
                <Text style={styles.headerTitleDark}>Identity Verification</Text>
                {/* Dots Indicator */}
                <View style={styles.paginationContainer}>
                    <View style={[styles.dot, (step === 'front' || step === 'processing_front') && styles.activeDot]} />
                    <View style={[styles.dot, (step === 'back' || step === 'processing_back') && styles.activeDot]} />
                    <View style={[styles.dot, (step === 'selfie' || step === 'processing_selfie') && styles.activeDot]} />
                </View>
            </View>
        ) : (
            <Text style={styles.headerTitleDark}>Security Setup</Text>
        )}

        <TouchableOpacity onPress={() => setFlash(!flash)} disabled={isPinStep}>
          <Ionicons name={flash ? "flash" : "flash-off"} size={24} color={isPinStep ? "transparent" : "#0F172A"} />
        </TouchableOpacity>
      </View>
    );
  };

  // 2. PIN SETUP & CONFIRM SCREEN
  if (step === 'pin_setup' || step === 'pin_confirm') {
    const isConfirm = step === 'pin_confirm';
    const currentPin = isConfirm ? confirmPin : pin;
    
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {renderHeader()}
        
        <View style={styles.pinContent}>
          <Text style={styles.pinTitleMain}>{isConfirm ? "Confirm Your PIN" : "Set Your PIN Code"}</Text>
          <Text style={styles.pinSubtitle}>
            {isConfirm ? "Please re-enter your PIN to confirm." : "Create a 6-digit PIN to secure your digital identity."}
          </Text>

          {/* PIN Dots */}
          <View style={styles.pinDotsRow}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={[styles.pinDotCircle, currentPin.length >= i ? styles.pinDotFilled : null]} />
            ))}
          </View>

          <View style={{flex: 1}} />

          {/* Biometric Toggle (Only show on Setup) */}
          {!isConfirm && (
            <View style={styles.biometricCard}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
                    <View style={styles.faceIdIcon}>
                        <MaterialIcons name="face" size={24} color="#2563EB" />
                    </View>
                    <View>
                        <Text style={styles.bioTitle}>Enable FaceID</Text>
                        <Text style={styles.bioSub}>Use biometrics for faster login</Text>
                    </View>
                </View>
                <Switch 
                    value={faceIDEnabled} 
                    onValueChange={setFaceIDEnabled}
                    trackColor={{ false: "#767577", true: "#2563EB" }}
                    thumbColor={"#f4f3f4"}
                />
            </View>
          )}

          {/* Keypad */}
          <View style={styles.keypad}>
            {[
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['face', '0', 'del']
            ].map((row, rIdx) => (
                <View key={rIdx} style={styles.keyRow}>
                    {row.map((key, kIdx) => (
                        <TouchableOpacity 
                            key={kIdx} 
                            style={styles.keyButton}
                            onPress={() => key === 'face' ? null : handlePinInput(key)}
                        >
                            {key === 'del' ? (
                                <Ionicons name="backspace-outline" size={28} color="#0F172A" />
                            ) : key === 'face' ? (
                                <View /> // Placeholder
                            ) : (
                                <Text style={styles.keyText}>{key}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 3. CAMERA & PROCESSING SCREEN
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

  // Determine current mode
  const isProcessing = step.includes('processing');
  const isSelfie = step === 'selfie' || step === 'processing_selfie';
  const isBack = step === 'back' || step === 'processing_back';

  // Text Logic
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
    guideText = "Face & ID / មុខ និង អត្តសញ្ញាណប័ណ្ណ";
    stepCount = "Step 3 of 3";
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}

      <View style={styles.cameraSection}>
        <Text style={styles.titleMain}>{titleText}</Text>
        <Text style={styles.titleKhmer}>{khmerText}</Text>
        <Text style={styles.stepText}>{stepCount}</Text>

        <View style={styles.cameraContainer}>
            
            {/* --- PROCESSING VIEW (BLACK LOADING SCREEN) --- */}
            {isProcessing ? (
                <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color="#2563EB" style={{transform: [{scale: 1.5}], marginBottom: 20}} />
                    <Text style={styles.processingTitle}>Processing</Text>
                    <Text style={styles.processingSub}>Verifying information...</Text>
                    <Text style={styles.processingKhmer}>ផ្ទៀងផ្ទាត់ព័ត៌មាន</Text>
                </View>
            ) : (
                
            /* --- CAMERA VIEW --- */
                <View style={styles.cameraCard}>
                    <CameraView
                        ref={cameraRef}
                        style={StyleSheet.absoluteFillObject}
                        facing={isSelfie ? 'front' : 'back'}
                        enableTorch={flash}
                    />
                    
                    {/* Overlay Mask */}
                    <View style={styles.overlayContainer}>
                        {/* Dark Gradient Overlay */}
                        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                            <LinearGradient
                                colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.6)']}
                                style={StyleSheet.absoluteFill}
                            />
                        </View>

                        {/* Guide Frame */}
                        <View style={[
                            styles.frame, 
                            isSelfie ? styles.circleFrame : styles.rectFrame
                        ]}>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                            
                            {!isSelfie && (
                                <View style={styles.guidePill}>
                                    <Text style={styles.guidePillText}>{guideText}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            )}
        </View>

        {/* HINT & CONTROLS (Only show when NOT processing) */}
        {!isProcessing && (
            <>
                <View style={styles.hintContainer}>
                    <MaterialIcons name="wb-sunny" size={20} color="#2563EB" />
                    <Text style={styles.hintTitle}>Lighting Check</Text>
                </View>
                <Text style={styles.hintText}>
                    Make sure the lighting is good and letters are clear.
                </Text>
                <Text style={styles.hintTextKhmer}>
                    សូមប្រាកដថាពន្លឺគ្រប់គ្រាន់ និងអក្សរច្បាស់ល្អ
                </Text>

                {/* Bottom Controls */}
                <View style={styles.bottomControls}>
                    <TouchableOpacity style={styles.controlItem}>
                        <View style={styles.circleBtnSmall}>
                            <Ionicons name="image-outline" size={24} color="#64748B" />
                        </View>
                        <Text style={styles.controlLabel}>Upload</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.shutterOuter} onPress={handleCapture}>
                        <View style={styles.shutterInner} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.controlItem}>
                        <View style={styles.circleBtnSmall}>
                            <Ionicons name="camera-reverse-outline" size={24} color="#64748B" />
                        </View>
                        <Text style={styles.controlLabel}>Flip</Text>
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
  
  // Header
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, marginBottom: 10
  },
  headerTitleDark: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  
  // Pagination Dots
  paginationContainer: { flexDirection: 'row', gap: 6, marginTop: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  activeDot: { backgroundColor: '#2563EB', width: 18 },

  // Camera Section Texts
  cameraSection: { flex: 1, alignItems: 'center' },
  titleMain: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 10 },
  titleKhmer: { fontSize: 16, color: '#475569', marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Khmer Sangam MN' : 'serif' },
  stepText: { fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 20 },

  // Camera Card & Processing
  cameraContainer: { width: width, alignItems: 'center', justifyContent: 'center' },
  cameraCard: {
    width: '90%', height: 260, borderRadius: 20, overflow: 'hidden', backgroundColor: 'black',
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10
  },
  processingContainer: {
    width: '90%', height: 260, borderRadius: 20, backgroundColor: '#020617', // Dark Black/Blue
    justifyContent: 'center', alignItems: 'center', padding: 20,
    borderWidth: 1, borderColor: '#1e293b'
  },
  
  // Processing Text
  processingTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  processingSub: { color: '#94a3b8', fontSize: 14, marginTop: 5 },
  processingKhmer: { color: '#64748b', fontSize: 14, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Khmer Sangam MN' : 'serif' },

  // Overlay
  overlayContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  frame: { borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1 },
  rectFrame: { width: '85%', height: '70%', borderRadius: 12 },
  circleFrame: { width: 220, height: 220, borderRadius: 110 },
  
  // Corners
  corner: { position: 'absolute', width: 25, height: 25, borderColor: '#2563EB', borderWidth: 4, borderRadius: 4 },
  topLeft: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0 },

  guidePill: {
    position: 'absolute', alignSelf: 'center', top: '45%',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20
  },
  guidePillText: { color: 'white', fontSize: 12, fontWeight: '600' },

  // Hints
  hintContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 5 },
  hintTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginLeft: 6 },
  hintText: { fontSize: 12, color: '#64748B', textAlign: 'center' },
  hintTextKhmer: { fontSize: 12, color: '#64748B', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Khmer Sangam MN' : 'serif' },

  bottomControls: {
    flexDirection: 'row', width: '100%', justifyContent: 'space-evenly', alignItems: 'center',
    position: 'absolute', bottom: 30
  },
  controlItem: { alignItems: 'center' },
  circleBtnSmall: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  controlLabel: { fontSize: 11, color: '#64748B' },
  shutterOuter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#2563EB', padding: 4 },
  shutterInner: { flex: 1, borderRadius: 32, backgroundColor: 'transparent', borderWidth: 2, borderColor: '#2563EB' },

  // PIN Styles
  pinContent: { flex: 1, paddingHorizontal: 30, paddingTop: 20 },
  pinTitleMain: { fontSize: 24, fontWeight: 'bold', color: '#0F172A', textAlign: 'center' },
  pinSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 10, marginBottom: 30 },
  pinDotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginBottom: 40 },
  pinDotCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#94A3B8' },
  pinDotFilled: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  biometricCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'white', padding: 15, borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 30
  },
  faceIdIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  bioTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  bioSub: { fontSize: 12, color: '#64748B' },
  keypad: { marginBottom: 30 },
  keyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 10 },
  keyButton: { width: 70, height: 70, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 28, color: '#0F172A', fontWeight: '500' }
});