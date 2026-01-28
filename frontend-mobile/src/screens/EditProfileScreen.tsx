import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, 
  TextInput, Image, ScrollView, Platform, Alert, ActivityIndicator, KeyboardAvoidingView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface EditProfileProps {
  onBack: () => void;
}

export default function EditProfileScreen({ onBack }: EditProfileProps) {
  const [loading, setLoading] = useState(false);
  
  // Profile State
  const [profile, setProfile] = useState({
    name: "Sophea Chan",
    id: "123-456-789",
    phone: "12 345 678",
    email: "sophea.chan@email.com",
    address: "#123, Preah Monivong Blvd, Phnom Penh, Cambodia",
    avatar: "https://i.pravatar.cc/150?img=5"
  });

  // Pick Image Function
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfile({ ...profile, avatar: result.assets[0].uri });
    }
  };

  // Handle Save
  const handleSave = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: onBack }
      ]);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* 1. Header (Blue Background like Reference) */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{width: 40}} /> 
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* 2. Avatar Section */}
            <View style={styles.avatarSection}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                  <View style={styles.cameraBadge}>
                    <Ionicons name="camera" size={16} color="white" />
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={pickImage}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            {/* 3. Form Fields */}
            <View style={styles.form}>
              
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput 
                  style={styles.input} 
                  value={profile.name}
                  onChangeText={(text) => setProfile({...profile, name: text})}
                  placeholder="Enter full name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* National ID (Disabled) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>National ID</Text>
                <TextInput 
                  style={[styles.input, styles.inputDisabled]} 
                  value={profile.id}
                  editable={false}
                />
                <Text style={styles.helperText}>ID number cannot be changed online.</Text>
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.phoneContainer}>
                  <View style={styles.countryCode}>
                    <Image 
                      source={{ uri: 'https://flagcdn.com/w40/kh.png' }} 
                      style={{ width: 24, height: 16, borderRadius: 2 }} 
                    />
                    <Text style={styles.codeText}>+855</Text>
                  </View>
                  <TextInput 
                    style={styles.phoneInput} 
                    value={profile.phone}
                    onChangeText={(text) => setProfile({...profile, phone: text})}
                    keyboardType="phone-pad"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput 
                  style={styles.input} 
                  value={profile.email}
                  onChangeText={(text) => setProfile({...profile, email: text})}
                  keyboardType="email-address"
                  placeholder="name@example.com"
                  placeholderTextColor="#94A3B8"
                />
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* 4. Footer Button (Blue & Fixed) */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.saveBtn} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
                <Ionicons name="checkmark" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' }, // Pure White Background
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#fff',
  },
  backBtn: { 
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' 
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },

  // Content
  content: { padding: 24, paddingBottom: 100 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { 
    width: 100, height: 100, borderRadius: 50, 
    backgroundColor: '#E2E8F0' 
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0, right: 0,
    backgroundColor: '#2563EB',
    width: 32, height: 32,
    borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff'
  },
  changePhotoText: { 
    color: '#2563EB', fontWeight: '600', fontSize: 14 
  },

  // Form
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: '#0F172A',
  },
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    color: '#64748B',
    borderColor: '#F1F5F9'
  },
  helperText: { fontSize: 12, color: '#94A3B8', marginTop: 4 },

  // Phone Input
  phoneContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 52,
    overflow: 'hidden',
  },
  countryCode: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14,
    borderRightWidth: 1, borderRightColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 8
  },
  codeText: { fontSize: 15, fontWeight: '600', color: '#475569' },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#0F172A',
  },

  // Footer
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#2563EB', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: {width: 0, height: 4},
    elevation: 4
  },
  btnContent: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8 // ប្រសិនបើ gap មិនដើរលើ Android ចាស់ៗ ខ្ញុំអាចប្តូរដាក់ Margin
  },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});