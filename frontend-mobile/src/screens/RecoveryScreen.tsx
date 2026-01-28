import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, 
  TextInput, Dimensions, StatusBar, Alert, ActivityIndicator 
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { api } from '../api/client'; // ត្រូវប្រាកដថាមាន api client

const { width } = Dimensions.get('window');

type Step = 'phone' | 'otp' | 'pin_setup' | 'pin_confirm';

interface RecoveryScreenProps {
  onBack: () => void;
  onFinish: () => void;
}

export default function RecoveryScreen({ onBack, onFinish }: RecoveryScreenProps) {
  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  
  // Data
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  // Focus Management
  const [activeOtpIndex, setActiveOtpIndex] = useState(0);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Timer (180s = 3 minutes)
  const [timer, setTimer] = useState(180);

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Format Time (e.g., 180 -> 03:00)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- API ACTIONS ---

  // 1. Send OTP via Telegram
  const handleSendOTP = async () => {
    if (phone.length < 8) {
      Alert.alert("Error", "សូមបញ្ចូលលេខទូរស័ព្ទឱ្យបានត្រឹមត្រូវ");
      return;
    }

    setLoading(true);
    try {
      // ហៅទៅ Backend ដើម្បីផ្ញើ Telegram Msg
      // POST /api/auth/recovery/send-otp
      /* 
      await api.post('/auth/recovery/send-otp', { 
        phone: phone,
        method: 'telegram' 
      }); 
      */
      
      // Simulation Success
      setTimeout(() => {
        setLoading(false);
        setStep('otp');
        setTimer(180); // Reset Timer
      }, 1500);

    } catch (error) {
      setLoading(false);
      Alert.alert("Failed", "មិនអាចផ្ញើលេខកូដបានទេ។ សូមព្យាយាមម្តងទៀត។");
    }
  };

  // 2. Verify OTP
  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      Alert.alert("Error", "សូមបញ្ចូលលេខ OTP ៦ ខ្ទង់");
      return;
    }

    setLoading(true);
    try {
      // ហៅទៅ Backend ដើម្បីផ្ទៀងផ្ទាត់
      // POST /api/auth/recovery/verify-otp
      /*
      await api.post('/auth/recovery/verify-otp', { 
        phone: phone,
        otp: otpCode 
      });
      */

      // Simulation Success
      setTimeout(() => {
        setLoading(false);
        setStep('pin_setup');
      }, 1500);

    } catch (error) {
      setLoading(false);
      Alert.alert("Invalid", "លេខកូដ OTP មិនត្រឹមត្រូវ។");
    }
  };

  // 3. Resend Code
  const handleResend = () => {
    setTimer(180); // Reset to 3 mins
    handleSendOTP();
  };

  // --- OTP INPUT LOGIC ---
  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setActiveOtpIndex(index + 1);
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = ''; 
      setOtp(newOtp);
      setActiveOtpIndex(index - 1);
    }
  };

  // --- PIN LOGIC ---
  const handlePinInput = (number: string) => {
    if (number === 'del') {
      if (step === 'pin_setup') setPin(prev => prev.slice(0, -1));
      if (step === 'pin_confirm') setConfirmPin(prev => prev.slice(0, -1));
    } else {
      if (step === 'pin_setup' && pin.length < 6) {
        const newPin = pin + number;
        setPin(newPin);
        if (newPin.length === 6) setTimeout(() => setStep('pin_confirm'), 300);
      }
      if (step === 'pin_confirm' && confirmPin.length < 6) {
        const newConfirm = confirmPin + number;
        setConfirmPin(newConfirm);
        if (newConfirm.length === 6) {
          if (newConfirm === pin) {
            setTimeout(() => {
                Alert.alert("Success", "PIN ត្រូវបានផ្លាស់ប្តូរជោគជ័យ!", [
                    { text: "OK", onPress: onFinish }
                ]);
            }, 300);
          } else {
            Alert.alert("Error", "លេខ PIN មិនដូចគ្នាទេ");
            setConfirmPin('');
          }
        }
      }
    }
  };

  // --- UI RENDERERS ---

  const renderHeader = (title: string, icon: any, subTitle?: string) => (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <View style={styles.iconCircle}>
          <MaterialIcons name={icon} size={40} color="#2563EB" />
        </View>
        <Text style={styles.headerTitle}>{title}</Text>
        {subTitle && <Text style={styles.headerSubTitle}>{subTitle}</Text>}
      </View>
    </View>
  );

  const renderKeypad = () => (
    <View style={styles.keypadContainer}>
      {[
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['', '0', 'del']
      ].map((row, rowIndex) => (
        <View key={rowIndex} style={styles.keypadRow}>
          {row.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.keyButton} 
              onPress={() => item && handlePinInput(item)}
              disabled={!item}
            >
              {item === 'del' ? (
                <Ionicons name="backspace-outline" size={28} color="#1e293b" />
              ) : (
                <Text style={styles.keyText}>{item}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );

  // --- UI: STEP 1 (PHONE) ---
  if (step === 'phone') {
    return (
      <View style={styles.container}>
        {renderHeader('Recovery', 'lock-reset')}
        <View style={styles.body}>
          <Text style={styles.stepTitle}>Step 1/2: Contact Information</Text>
          <Text style={styles.stepDesc}>Enter your registered phone number to recover your account.</Text>
          
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneInputContainer}>
            <Text style={styles.countryCode}>+855</Text>
            <View style={styles.verticalLine} />
            <TextInput 
              style={styles.phoneInput} 
              placeholder="12 345 678" 
              keyboardType="number-pad"
              value={phone}
              onChangeText={setPhone}
              autoFocus
            />
          </View>

          <TouchableOpacity 
            style={[styles.mainButton, loading && {opacity: 0.7}]} 
            onPress={handleSendOTP}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.mainBtnText}>Send OTP</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- UI: STEP 2 (OTP) ---
  if (step === 'otp') {
    return (
      <View style={styles.container}>
        {renderHeader('Verification', 'verified-user')}
        <View style={styles.body}>
          <Text style={styles.stepTitle}>Step 2/2: Verify OTP</Text>
          <Text style={styles.stepDesc}>
            Enter the 6-digit code sent to <Text style={{fontWeight:'bold'}}>+855 {phone}</Text> via Telegram.
          </Text>
          
          {/* OTP INPUTS */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                    styles.otpBox, 
                    (activeOtpIndex === index || digit) ? styles.otpBoxActive : null
                ]}
                maxLength={1}
                keyboardType="number-pad"
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleOtpKeyPress(e, index)}
                onFocus={() => setActiveOtpIndex(index)}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* TIMER / RESEND */}
          <View style={{alignItems: 'center', marginBottom: 30}}>
            {timer > 0 ? (
                <Text style={styles.timerText}>
                    Resend code in <Text style={{fontWeight: 'bold'}}>{formatTime(timer)}</Text>
                </Text>
            ) : (
                <TouchableOpacity onPress={handleResend}>
                    <Text style={styles.resendText}>Resend Code</Text>
                </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.mainButton, loading && {opacity: 0.7}]} 
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.mainBtnText}>Verify</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- UI: PIN SETUP ---
  if (step === 'pin_setup' || step === 'pin_confirm') {
    const currentPin = step === 'pin_setup' ? pin : confirmPin;
    const title = 'Reset PIN';
    const subTitle = step === 'pin_setup' ? 'Setup New PIN' : 'Confirm New PIN';
    
    return (
      <View style={styles.container}>
        {renderHeader(title, 'lock-clock', subTitle)}
        <View style={styles.bodyCenter}>
          <Text style={styles.pinTitle}>{subTitle}</Text>
          <View style={styles.dotContainer}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={[styles.pinDot, currentPin.length >= i ? styles.pinDotActive : null]} />
            ))}
          </View>
          <View style={{flex: 1}} />
          {renderKeypad()}
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // Header
  headerContainer: {
    backgroundColor: '#2563EB',
    height: 220,
    justifyContent: 'center',
    paddingBottom: 20,
    borderBottomLeftRadius: 30, // កោងផ្នែកខាងក្រោម
    borderBottomRightRadius: 30,
  },
  headerContent: { alignItems: 'center', marginTop: 40 },
  backBtn: { position: 'absolute', left: 20, top: 10 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'white',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  headerSubTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 5 },

  // Body
  body: { padding: 24, marginTop: 10 },
  bodyCenter: { flex: 1, alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  stepTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  stepDesc: { color: '#64748b', marginBottom: 30, lineHeight: 20 },
  label: { fontSize: 14, color: '#334155', fontWeight: '600', marginBottom: 8 },

  // Inputs
  phoneInputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9',
    borderWidth: 1, borderColor: '#2563EB', borderRadius: 8, height: 55,
    paddingHorizontal: 15, marginBottom: 30,
  },
  countryCode: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  verticalLine: { width: 1, height: '60%', backgroundColor: '#cbd5e1', marginHorizontal: 15 },
  phoneInput: { flex: 1, fontSize: 16, color: '#0f172a' },

  // Button
  mainButton: {
    backgroundColor: '#818CF8', height: 55, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center', shadowColor: '#818CF8',
    shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 5, elevation: 3,
  },
  mainBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // OTP
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  otpBox: {
    width: 48, height: 55, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12,
    textAlign: 'center', fontSize: 22, backgroundColor: 'white', color: '#0f172a',
  },
  otpBoxActive: { borderColor: '#2563EB', borderWidth: 2 },
  resendText: { color: '#2563EB', textAlign: 'center', fontWeight: '600' },
  timerText: { color: '#64748b', textAlign: 'center' },

  // PIN
  pinTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 30 },
  dotContainer: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  pinDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#cbd5e1' },
  pinDotActive: { backgroundColor: '#2563EB' },
  
  // Keypad
  keypadContainer: { width: '100%', paddingHorizontal: 40, paddingBottom: 20 },
  keypadRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  keyButton: { width: 70, height: 70, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 28, color: '#0f172a', fontWeight: '500' },
});