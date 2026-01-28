import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, Animated, Easing, Dimensions, 
  Alert, Vibration, StatusBar, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator 
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { authorizeDashboardSession } from '../api/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
// Card Ratio ដូចក្នុងរូបភាព
const CAMERA_WIDTH = width * 0.9;
const CAMERA_HEIGHT = CAMERA_WIDTH * 0.75; 

interface SyncScreenProps {
  onBack?: () => void;
}

export default function SyncScreen({ onBack }: SyncScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startScanAnimation();
  }, []);

  const startScanAnimation = () => {
    scanLineAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);
    Vibration.vibrate(); 

    try {
      await authorizeDashboardSession(data);
      Alert.alert("✅ ជោគជ័យ", "បានភ្ជាប់ទៅ Dashboard រួចរាល់!", [
        { text: "OK", onPress: () => { setScanned(false); setLoading(false); onBack && onBack(); } }
      ]);
    } catch (error) {
      Alert.alert("❌ បរាជ័យ", "QR Code មិនត្រឹមត្រូវ", [
        { text: "ព្យាយាមម្តងទៀត", onPress: () => { setScanned(false); setLoading(false); } }
      ]);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    console.log(result);
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) return <View style={styles.loadingContainer}><ActivityIndicator color="#2563EB"/></View>;
  if (!permission.granted) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{marginBottom: 20}}>ត្រូវការសិទ្ធិកាមេរ៉ា</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={{color: 'white'}}>អនុញ្ញាត</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, CAMERA_HEIGHT - 10], 
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* 1. Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Sync Device</Text>
        <TouchableOpacity onPress={() => setTorchOn(!torchOn)} style={styles.iconBtn}>
          <Ionicons name={torchOn ? "flash" : "flash-off"} size={24} color={torchOn ? "#F59E0B" : "#1E293B"} />
        </TouchableOpacity>
      </View>

      {/* 2. Title & Subtitle */}
      <View style={styles.textSection}>
        <Text style={styles.mainTitle}>Scan QR Login</Text>
        <Text style={styles.subTitle}>ស្កេន QR Code ដើម្បីចូលប្រើ</Text>
        <Text style={styles.stepTitle}>Step 1 of 1</Text>
      </View>

      {/* 3. Camera Card */}
      <View style={styles.cameraContainer}>
        <View style={styles.cameraCard}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing={facing}
            enableTorch={torchOn}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          />
          
          {/* Overlay UI */}
          <View style={styles.overlayLayer}>
            {/* Corners */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Scan Line Animation */}
            {!scanned && (
              <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]}>
                 <LinearGradient
                    colors={['transparent', '#3B82F6', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1, height: 3 }}
                 />
              </Animated.View>
            )}

            {/* Loading */}
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* 4. Lighting Check Hint */}
      <View style={styles.hintSection}>
        <View style={styles.hintHeader}>
          <MaterialIcons name="wb-sunny" size={20} color="#2563EB" />
          <Text style={styles.hintTitle}>Lighting Check</Text>
        </View>
        <Text style={styles.hintText}>
          Make sure the lighting is good and the QR code is clear.
        </Text>
        <Text style={styles.hintTextKhmer}>
          សូមប្រាកដថាពន្លឺគ្រប់គ្រាន់ និងកូដច្បាស់ល្អ
        </Text>
      </View>

      {/* 5. Bottom Controls (Upload, Shutter, Flip) */}
      <View style={styles.bottomControls}>
        
        {/* Upload */}
        <TouchableOpacity style={styles.controlItem} onPress={pickImage}>
          <View style={styles.circleBtnSmall}>
            <Ionicons name="image-outline" size={24} color="#64748B" />
          </View>
          <Text style={styles.controlLabel}>Upload</Text>
        </TouchableOpacity>

        {/* Fake Shutter (Visual only) */}
        <View style={styles.shutterContainer}>
          <View style={styles.shutterOuter}>
            <View style={styles.shutterInner} />
          </View>
        </View>

        {/* Flip */}
        <TouchableOpacity style={styles.controlItem} onPress={toggleCameraFacing}>
          <View style={styles.circleBtnSmall}>
            <Ionicons name="camera-reverse-outline" size={24} color="#64748B" />
          </View>
          <Text style={styles.controlLabel}>Flip</Text>
        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permBtn: {
    backgroundColor: '#2563EB',
    padding: 10,
    borderRadius: 8,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  iconBtn: {
    padding: 8,
  },

  // Text Section
  textSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 16,
    color: '#334155',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Khmer Sangam MN' : 'serif',
  },
  stepTitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Camera Area
  cameraContainer: {
    alignItems: 'center',
  },
  cameraCard: {
    width: CAMERA_WIDTH,
    height: CAMERA_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  overlayLayer: {
    flex: 1,
    position: 'relative',
  },
  scanLine: {
    width: '100%',
    height: 3,
  },
  
  // Corners
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#3B82F6',
    borderWidth: 4,
    borderRadius: 6,
  },
  topLeft: { top: 20, left: 20, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 20, right: 20, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 20, left: 20, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 20, right: 20, borderLeftWidth: 0, borderTopWidth: 0 },

  // Loading Overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontWeight: '600',
  },

  // Hint Section
  hintSection: {
    marginTop: 30,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 6,
  },
  hintText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 4,
  },
  hintTextKhmer: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Khmer Sangam MN' : 'serif',
  },

  // Bottom Controls
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  controlItem: {
    alignItems: 'center',
  },
  circleBtnSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  controlLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  
  // Shutter Button
  shutterContainer: {
    marginTop: -20, // Push up slightly
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#3B82F6',
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    flex: 1,
    width: '100%',
    borderRadius: 30,
    backgroundColor: '#3B82F6',
  },
});