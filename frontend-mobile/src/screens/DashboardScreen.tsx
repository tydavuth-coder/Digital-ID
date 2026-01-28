import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, 
  StatusBar, Image, ScrollView, Dimensions, Platform, Alert 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// --- DATA ---
interface Integration {
  id: string;
  name: string;
  clientId: string;
  status: 'Active' | 'Inactive' | 'Revoked';
  icon: string;
}

const SERVICE_ENRICHMENT: Record<string, { subtitle: string; color: string; icon: any }> = {
  'EFI Moodle LMS': { subtitle: 'lms-efi.mef.gov.kh', color: '#f97316', icon: 'school' },
  'Taxation': { subtitle: 'GDT Service', color: '#ea580c', icon: 'bank' },
  'Business Reg': { subtitle: 'Ministry of Commerce', color: '#4f46e5', icon: 'storefront' },
  'Civil Status': { subtitle: 'Vital Records', color: '#db2777', icon: 'account-group' },
  'Driver License': { subtitle: 'Transport Dept', color: '#0d9488', icon: 'card-account-details' },
  'Land Mgmt': { subtitle: 'Cadastral Data', color: '#16a34a', icon: 'map-marker-radius' },
  'Vehicle Registration': { subtitle: 'Public Works', color: '#2563eb', icon: 'car' },
};

const MOCK_INTEGRATIONS: Integration[] = [
  { id: 'tax', name: 'Taxation', clientId: 'gdt-tax-001', status: 'Active', icon: 'bank' },
  { id: 'civ', name: 'Civil Status', clientId: 'moi-civil-112', status: 'Active', icon: 'account-group' },
  { id: 'drv', name: 'Driver License', clientId: 'mpwt-drv-09', status: 'Active', icon: 'card-account-details' },
  { id: 'lnd', name: 'Land Mgmt', clientId: 'mlp-lnd-01', status: 'Active', icon: 'map-marker-radius' },
];

interface DashboardProps {
  onScanPress: () => void;
  onLogout: () => void;
  onEditProfile: () => void; // ✅ New Prop
}

export default function DashboardScreen({ onScanPress, onLogout, onEditProfile }: DashboardProps) {
  
  const [profile] = useState({
    name: "Sophea Chan",
    id: "123-456-789",
    avatar: "https://i.pravatar.cc/150?img=5",
    validUntil: "Dec 2028"
  });

  const handleServiceClick = (serviceName: string) => {
    Alert.alert("Service", `Opening ${serviceName}...`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* 1. TOP HEADER */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onLogout}>
            <Ionicons name="menu" size={28} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Identity</Text>
          <TouchableOpacity>
            <View style={styles.bellContainer}>
              <Ionicons name="notifications-outline" size={26} color="#1e293b" />
              <View style={styles.badge} />
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 2. IDENTITY CARD */}
        <LinearGradient
          colors={['#2563EB', '#1d4ed8']}
          style={styles.idCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.idHeader}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.idInfo}>
              <Text style={styles.nameText}>{profile.name}</Text>
              <Text style={styles.idNumber}>ID: {profile.id}</Text>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={onEditProfile}>
              <Ionicons name="pencil" size={12} color="white" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.idFooter}>
            <View>
              <Text style={styles.footerLabel}>STATUS</Text>
              <View style={styles.statusRow}>
                <MaterialIcons name="verified" size={16} color="#4ade80" />
                <Text style={styles.statusValue}>Digitally Verified</Text>
              </View>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <Text style={styles.footerLabel}>VALID UNTIL</Text>
              <Text style={styles.dateValue}>{profile.validUntil}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* 3. QUICK ACTIONS */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <View style={[styles.actionIconCircle, {backgroundColor: '#eff6ff'}]}>
              <MaterialCommunityIcons name="history" size={24} color="#2563EB" />
            </View>
            <Text style={styles.actionLabel}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <View style={[styles.actionIconCircle, {backgroundColor: '#eff6ff'}]}>
              <Ionicons name="document-text-outline" size={24} color="#2563EB" />
            </View>
            <Text style={styles.actionLabel}>Documents</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <View style={[styles.actionIconCircle, {backgroundColor: '#eff6ff'}]}>
              <Ionicons name="settings-outline" size={24} color="#2563EB" />
            </View>
            <Text style={styles.actionLabel}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* 4. CONNECTED SERVICES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Connected Services</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.servicesGrid}>
          {MOCK_INTEGRATIONS.map((service) => {
            const enrich = SERVICE_ENRICHMENT[service.name] || { subtitle: service.clientId, color: '#64748b', icon: 'apps' };
            return (
              <TouchableOpacity key={service.id} style={styles.serviceCard} onPress={() => handleServiceClick(service.name)}>
                <View style={[styles.serviceIconBox, { backgroundColor: enrich.color + '15' }]}>
                  <MaterialCommunityIcons name={enrich.icon as any} size={28} color={enrich.color} />
                </View>
                <Text style={styles.serviceTitle} numberOfLines={1}>{service.name}</Text>
                <Text style={styles.serviceSub} numberOfLines={1}>{enrich.subtitle}</Text>
              </TouchableOpacity>
            );
          })}
          
          <TouchableOpacity style={[styles.serviceCard, { borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: 'transparent' }]}>
            <View style={[styles.serviceIconBox, { backgroundColor: '#f1f5f9' }]}>
              <Ionicons name="add" size={28} color="#64748b" />
            </View>
            <Text style={[styles.serviceTitle, {color: '#64748b'}]}>Add Service</Text>
            <Text style={styles.serviceSub}>Connect new</Text>
          </TouchableOpacity>
        </View>

        <View style={{height: 100}} />
      </ScrollView>

      {/* 5. BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#2563EB" />
          <Text style={[styles.navLabel, {color: '#2563EB'}]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="folder-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Files</Text>
        </TouchableOpacity>

        <View style={styles.scanBtnContainer}>
          <TouchableOpacity style={styles.scanBtn} activeOpacity={0.9} onPress={onScanPress}>
            <MaterialCommunityIcons name="qrcode-scan" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.scanLabel}>Scan QR</Text>
        </View>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="notifications-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={onEditProfile}>
          <Ionicons name="person-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea: { backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 40 : 0 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  bellContainer: { position: 'relative' },
  badge: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', borderWidth: 1.5, borderColor: '#F8FAFC' },
  idCard: { borderRadius: 20, padding: 20, marginTop: 10, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  idHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#4ade80', borderWidth: 2, borderColor: '#2563EB' },
  idInfo: { flex: 1, marginLeft: 15 },
  nameText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  idNumber: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  editBtn: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignItems: 'center', gap: 4 },
  editBtnText: { color: 'white', fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 15 },
  idFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  footerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 4, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusValue: { color: 'white', fontSize: 14, fontWeight: '600' },
  dateValue: { color: 'white', fontSize: 14, fontWeight: '600' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  actionBtn: { width: '31%', backgroundColor: 'white', paddingVertical: 15, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  actionIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, color: '#334155', fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  viewAll: { color: '#2563EB', fontSize: 14, fontWeight: '600' },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  serviceCard: { width: '48%', backgroundColor: 'white', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, marginBottom: 5 },
  serviceIconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  serviceTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  serviceSub: { fontSize: 12, color: '#64748b' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: Platform.OS === 'ios' ? 25 : 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', elevation: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  navItem: { alignItems: 'center', width: 50 },
  navLabel: { fontSize: 10, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
  scanBtnContainer: { alignItems: 'center', justifyContent: 'center', top: -20 },
  scanBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8, borderWidth: 4, borderColor: '#F8FAFC' },
  scanLabel: { fontSize: 10, color: '#64748b', marginTop: 4, fontWeight: '600' }
});