import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, 
  StatusBar, ScrollView, Platform, Linking, Image 
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

// --- TRANSLATIONS ---
type Language = 'en' | 'km';
type Page = 'main' | 'language' | 'terms' | 'privacy' | 'help' | 'about';

const translations = {
  en: {
    settings: 'Settings',
    account: 'ACCOUNT',
    securityCenter: 'Security Center',
    preferences: 'PREFERENCES',
    language: 'Language',
    legalPolicies: 'LEGAL POLICIES',
    termsOfUse: 'Terms of Use',
    privacyPolicy: 'Privacy Policy',
    helpAndSupport: 'HELP AND SUPPORT',
    help: 'Help and Support',
    aboutUs: 'About Us',
    version: 'Version 1.0.2',
    footer: '© 2023-2025 Digital Learning Center',
    contactSupport: 'Contact Support',
    faq: 'Frequently Asked Questions',
    descTerms: 'Please read these terms and conditions carefully before using our service.',
    descPrivacy: 'We value your privacy and are committed to protecting your personal data.',
  },
  km: {
    settings: 'ការកំណត់',
    account: 'គណនី',
    securityCenter: 'មជ្ឈមណ្ឌលសុវត្ថិភាព',
    preferences: 'ចំណូលចិត្ត',
    language: 'ភាសា',
    legalPolicies: 'គោលការណ៍ច្បាប់',
    termsOfUse: 'លក្ខខណ្ឌប្រើប្រាស់',
    privacyPolicy: 'គោលការណ៍ឯកជនភាព',
    helpAndSupport: 'ជំនួយ និងការគាំទ្រ',
    help: 'ជំនួយ និងការគាំទ្រ',
    aboutUs: 'អំពីយើង',
    version: 'ជំនាន់ 1.0.2',
    footer: '© 2023-2025 Digital Learning Center',
    contactSupport: 'ទាក់ទងជំនួយការ',
    faq: 'សំណួរដែលសួរញឹកញាប់',
    descTerms: 'សូមអានលក្ខខណ្ឌទាំងនេះដោយយកចិត្តទុកដាក់ មុនពេលប្រើប្រាស់សេវាកម្មរបស់យើង។',
    descPrivacy: 'យើងផ្តល់តម្លៃចំពោះឯកជនភាពរបស់អ្នក និងប្តេជ្ញាការពារទិន្នន័យផ្ទាល់ខ្លួនរបស់អ្នក។',
  }
};

interface SettingsProps {
  onBack: () => void;
  isAuthenticated?: boolean;
}

export default function SettingsScreen({ onBack, isAuthenticated = true }: SettingsProps) {
  const [lang, setLang] = useState<Language>('en'); // Default 'en'
  const [currentPage, setCurrentPage] = useState<Page>('main');

  const t = translations[lang];
  const isKhmer = lang === 'km';

  // --- SUB-PAGES COMPONENTS ---

  const renderLanguagePage = () => (
    <View style={styles.subPageContainer}>
      <Text style={styles.sectionHeader}>{isKhmer ? 'ជ្រើសរើសភាសា' : 'Select Language'}</Text>
      <View style={styles.card}>
        <TouchableOpacity 
          style={[styles.menuItem, {borderBottomWidth: 1, borderBottomColor: '#f1f5f9'}]} 
          onPress={() => { setLang('en'); setCurrentPage('main'); }}
        >
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
            <Image source={{ uri: 'https://flagcdn.com/w40/gb.png' }} style={styles.flag} />
            <Text style={styles.menuText}>English</Text>
          </View>
          {lang === 'en' && <Ionicons name="checkmark" size={24} color="#2563EB" />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => { setLang('km'); setCurrentPage('main'); }}
        >
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
            <Image source={{ uri: 'https://flagcdn.com/w40/kh.png' }} style={styles.flag} />
            <Text style={[styles.menuText, {fontFamily: Platform.OS === 'ios' ? 'Khmer Sangam MN' : 'serif'}]}>ខ្មែរ</Text>
          </View>
          {lang === 'km' && <Ionicons name="checkmark" size={24} color="#2563EB" />}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTermsPage = () => (
    <ScrollView style={styles.subPageContainer}>
      <Text style={styles.descText}>{t.descTerms}</Text>
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.cardBody}>By accessing and using Digital ID, you accept and agree to be bound by the terms and provision of this agreement.</Text>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>2. Identity Verification</Text>
            <Text style={styles.cardBody}>You are responsible for maintaining the confidentiality of your PIN and FaceID. Digital ID is not liable for unauthorized access.</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderHelpPage = () => (
    <ScrollView style={styles.subPageContainer}>
      <Text style={styles.sectionHeader}>{t.contactSupport}</Text>
      <View style={styles.card}>
        <TouchableOpacity style={[styles.menuItem, {borderBottomWidth: 1, borderBottomColor: '#f1f5f9'}]} onPress={() => Linking.openURL('tel:010284782')}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
            <View style={[styles.iconCircle, {backgroundColor: '#dcfce7'}]}>
              <Ionicons name="call" size={20} color="#16a34a" />
            </View>
            <View>
              <Text style={styles.menuText}>Call Center</Text>
              <Text style={styles.subText}>010 284 782</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('mailto:digitalid@efi.mef.gov.kh')}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
            <View style={[styles.iconCircle, {backgroundColor: '#dbeafe'}]}>
              <Ionicons name="mail" size={20} color="#2563eb" />
            </View>
            <View>
              <Text style={styles.menuText}>Email Support</Text>
              <Text style={styles.subText}>digitalid@efi.mef.gov.kh</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionHeader, {marginTop: 20}]}>{t.faq}</Text>
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{lang === 'km' ? 'តើខ្ញុំអាចប្តូរលេខកូដ PIN យ៉ាងដូចម្តេច?' : 'How do I reset my PIN?'}</Text>
          <Text style={styles.cardBody}>
            {lang === 'km' 
                ? 'អ្នកអាចចូលទៅកាន់ "សុវត្ថិភាព" នៅក្នុងផ្ទាំងគ្រប់គ្រង ហើយជ្រើសរើស "ផ្លាស់ប្តូរលេខ PIN" ។' 
                : 'You can go to "Security" in the dashboard and select "Change PIN".'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderAboutPage = () => (
    <View style={[styles.subPageContainer, {alignItems: 'center', paddingTop: 40}]}>
      <View style={styles.logoBox}>
        <Ionicons name="finger-print" size={48} color="#2563EB" />
      </View>
      <Text style={styles.appName}>Digital ID</Text>
      <Text style={styles.version}>{t.version}</Text>

      <View style={[styles.card, {width: '100%', marginTop: 30}]}>
        <View style={[styles.menuItem, {borderBottomWidth: 1, borderBottomColor: '#f1f5f9'}]}>
          <Text style={styles.subText}>Developer</Text>
          <Text style={styles.menuText}>Digital Learning Center</Text>
        </View>
        <View style={[styles.menuItem, {borderBottomWidth: 1, borderBottomColor: '#f1f5f9'}]}>
          <Text style={styles.subText}>Website</Text>
          <Text style={[styles.menuText, {color: '#2563EB'}]}>dlc-efi.mef.gov.kh</Text>
        </View>
        <View style={styles.menuItem}>
          <Text style={styles.subText}>License</Text>
          <Text style={styles.menuText}>Open Source (MIT)</Text>
        </View>
      </View>
      
      <Text style={styles.footerText}>{t.footer}</Text>
    </View>
  );

  // --- NAVIGATION HANDLER ---
  const getPageTitle = () => {
    switch(currentPage) {
      case 'language': return t.language;
      case 'terms': return t.termsOfUse;
      case 'privacy': return t.privacyPolicy;
      case 'help': return t.help;
      case 'about': return t.aboutUs;
      default: return t.settings;
    }
  };

  const handleHeaderBack = () => {
    if (currentPage === 'main') {
      onBack();
    } else {
      setCurrentPage('main');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleHeaderBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getPageTitle()}</Text>
          <View style={{width: 40}} /> 
        </View>

        {/* CONTENT SWITCHER */}
        <View style={styles.content}>
          {currentPage === 'main' ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              
              {/* Account Section (Only if Authenticated) */}
              {isAuthenticated && (
                <>
                  <Text style={styles.sectionHeader}>{t.account}</Text>
                  <View style={styles.card}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Coming Soon", "Security Center")}>
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                        <MaterialIcons name="security" size={22} color="#2563EB" />
                        <Text style={styles.menuText}>{t.securityCenter}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Preferences */}
              <Text style={styles.sectionHeader}>{t.preferences}</Text>
              <View style={styles.card}>
                <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentPage('language')}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <MaterialIcons name="translate" size={22} color="#2563EB" />
                    <View>
                        <Text style={styles.menuText}>{t.language}</Text>
                        <Text style={styles.subText}>{lang === 'en' ? 'English' : 'ខ្មែរ'}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Legal */}
              <Text style={styles.sectionHeader}>{t.legalPolicies}</Text>
              <View style={styles.card}>
                <TouchableOpacity style={[styles.menuItem, {borderBottomWidth: 1, borderBottomColor: '#f1f5f9'}]} onPress={() => setCurrentPage('terms')}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <MaterialIcons name="description" size={22} color="#2563EB" />
                    <Text style={styles.menuText}>{t.termsOfUse}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentPage('privacy')}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <MaterialIcons name="privacy-tip" size={22} color="#2563EB" />
                    <Text style={styles.menuText}>{t.privacyPolicy}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Help */}
              <Text style={styles.sectionHeader}>{t.helpAndSupport}</Text>
              <View style={styles.card}>
                <TouchableOpacity style={[styles.menuItem, {borderBottomWidth: 1, borderBottomColor: '#f1f5f9'}]} onPress={() => setCurrentPage('help')}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <MaterialIcons name="help-outline" size={22} color="#2563EB" />
                    <Text style={styles.menuText}>{t.help}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentPage('about')}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <MaterialIcons name="info-outline" size={22} color="#2563EB" />
                    <View>
                        <Text style={styles.menuText}>{t.aboutUs}</Text>
                        <Text style={styles.subText}>{t.version}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View style={{height: 50}} />
              <Text style={styles.footerText}>Digital ID</Text>
              <Text style={[styles.footerText, {fontSize: 10, marginTop: 2}]}>{t.footer}</Text>
              <View style={{height: 50}} />

            </ScrollView>
          ) : (
            // Render Sub-Pages
            <View style={{flex: 1}}>
                {currentPage === 'language' && renderLanguagePage()}
                {currentPage === 'terms' && renderTermsPage()}
                {currentPage === 'privacy' && renderTermsPage()} {/* Reusing Terms UI for Demo */}
                {currentPage === 'help' && renderHelpPage()}
                {currentPage === 'about' && renderAboutPage()}
            </View>
          )}
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  backBtn: { 
    width: 40, height: 40, borderRadius: 20, 
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F1F5F9'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },

  content: { flex: 1, padding: 20 },

  // List Items
  sectionHeader: {
    fontSize: 12, fontWeight: '700', color: '#64748B',
    marginBottom: 8, marginTop: 20, textTransform: 'uppercase'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  menuText: { fontSize: 16, fontWeight: '500', color: '#0F172A' },
  subText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  
  // Icons
  flag: { width: 24, height: 16, borderRadius: 2 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  // Sub Pages
  subPageContainer: { flex: 1 },
  descText: { color: '#64748B', lineHeight: 22, marginBottom: 20 },
  cardContainer: { gap: 15 },
  cardContent: { padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  cardBody: { fontSize: 14, color: '#475569', lineHeight: 20 },

  // About Page
  logoBox: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: 'white',
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
  },
  appName: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  version: { fontSize: 14, color: '#64748B', marginTop: 4 },
  footerText: { textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 20 },
});