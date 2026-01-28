import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, Animated, Easing, Dimensions, 
  Alert, Vibration, StatusBar, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator, Linking 
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera'; // ✅ Added useCameraPermissions
import * as ImagePicker from 'expo-image-picker';
import { authorizeDashboardSession } from '../api/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CAMERA_HEIGHT = width * 0.65;
const CAMERA_WIDTH = width * 0.9;
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

export default function SyncScreen() {
  // ✅ ប្រើ Hook ជំនួសឱ្យ useEffect ដើម្បីគ្រប់គ្រង Permission
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
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
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
        { text: "OK", onPress: () => { setScanned(false); setLoading(false); } }
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

  // 1. Loading Permission State
  if (!permission) {
    // Permission មិនទាន់ Load ចប់
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.permissionText}>កំពុងដំណើរការ...</Text>
      </View>
    );
  }

  // 2. Permission Not Granted State
  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="camera-outline" size={64} color="#64748b" />
        <Text style={styles.permissionTitle}>ត្រូវការប្រើប្រាស់កាមេរ៉ា</Text>
        <Text style={styles.permissionText}>ដើម្បីស្កេន QR Code សូមអនុញ្ញាតឱ្យប្រើកាមេរ៉ា</Text>
        
        <TouchableOpacity style={styles.settingBtn} onPress={requestPermission}>
          <Text style={styles.settingBtnText}>អនុញ្ញាត (Allow)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingBtn, { marginTop: 10, backgroundColor: 'transparent' }]} onPress={() => Linking.openSettings()}>
          <Text style={[styles.settingBtnText, { color: '#3b82f6' }]}>បើក Settings</Text>
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
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" translucent />
      
      <View style={styles.contentContainer}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sync Device</Text>
          <TouchableOpacity onPress={() => setTorchOn(!torchOn)}>
            <Ionicons name={torchOn ? "flash" : "flash-off"} size={24} color="#1e293b" />
          </TouchableOpacity>
        </View>

        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Titles */}
        <View style={styles.textContainer}>
          <Text style={styles.mainTitle}>Scan QR Login</Text>
          <Text style={styles.khmerTitle}>ស្កេន QR Code ដើម្បីចូលប្រើ</Text>
          <Text style={styles.stepText}>Step 1 of 1</Text>
        </View>

        {/* Camera Card */}
        <View style={styles.cameraWrapper}>
          <View style={styles.cameraCard}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing={facing}
              enableTorch={torchOn}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            />
            
            {/* Overlay Inside Camera */}
            <View style={styles.overlayContainer}>
              {/* Dark Tint Overlay */}
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                 <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.3)']}
                    style={StyleSheet.absoluteFill}
                 />
              </View>

              {/* Blue Corners */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Scan Line */}
              {!scanned && (
                <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]}>
                   <LinearGradient
                      colors={['transparent', '#3b82f6', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ flex: 1, height: 2 }}
                   />
                </Animated.View>
              )}

              {/* Loading Spinner inside camera */}
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.loadingText}>Processing...</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Hint Text */}
        <View style={styles.hintContainer}>
          <MaterialIcons name="wb-sunny" size={20} color="#3b82f6" />
          <Text style={styles.hintText}>Lighting Check</Text>
        </View>
        <Text style={styles.hintSubText}>
          Make sure the lighting is good and the QR code is clear.
        </Text>
        <Text style={[styles.hintSubText, { fontFamily: Platform.OS === 'ios' ? 'Khmer Sangam MN' : 'serif' }]}>
          សូមប្រាកដថាពន្លឺគ្រប់គ្រាន់ និងកូដច្បាស់ល្អ
        </Text>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          
          {/* Upload Button */}
          <TouchableOpacity style={styles.controlBtnSmall} onPress={pickImage}>
            <Ionicons name="images-outline" size={24} color="#64748b" />
            <Text style={styles.btnLabel}>Upload</Text>
          </TouchableOpacity>

          {/* Shutter Button (Visual) */}
          <View style={styles.shutterOuter}>
            <View style={styles.shutterInner} />
          </View>

          {/* Flip Camera Button */}
          <TouchableOpacity style={styles.controlBtnSmall} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse-outline" size={26} color="#64748b" />
            <Text style={styles.btnLabel}>Flip</Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: STATUSBAR_HEIGHT,
  },
  contentContainer: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // Permission Styles
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 20,
  },
  permissionText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  settingBtn: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    elevation: 2,
  },
  settingBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },

  // Progress Dots
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
  },
  activeDot: {
    backgroundColor: '#3b82f6',
    width: 20,
  },

  // Texts
  textContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  khmerTitle: {
    fontSize: 18,
    color: '#334155',
    marginBottom: 6,
  },
  stepText: {
    fontSize: 12,
    color: '#64748b',
  },

  // Camera Card Area
  cameraWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCard: {
    width: CAMERA_WIDTH,
    height: CAMERA_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 10, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  overlayContainer: {
    flex: 1,
    position: 'relative',
  },
  
  // Corners
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#3b82f6',
    borderWidth: 4,
    borderRadius: 6,
  },
  topLeft: { top: 15, left: 15, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 15, right: 15, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 15, left: 15, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 15, right: 15, borderLeftWidth: 0, borderTopWidth: 0 },

  // Scan Line
  scanLine: {
    width: '100%',
    height: 2,
  },

  // Loading Overlay inside Camera
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },

  // Hints
  hintContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 8,
  },
  hintText: {
    color: '#0f172a',
    fontWeight: '600',
    marginLeft: 6,
  },
  hintSubText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    paddingHorizontal: 40,
    lineHeight: 18,
  },

  // Bottom Controls
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 'auto', // Push to bottom
    marginBottom: 30,
  },
  controlBtnSmall: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  btnLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  
  // Big Center Button (Visual)
  shutterOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff', 
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});