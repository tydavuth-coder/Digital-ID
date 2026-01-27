import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'km';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'app.title': 'Digital ID Admin Portal',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.clear': 'Clear',
    'common.approve': 'Approve',
    'common.reject': 'Reject',
    'common.submit': 'Submit',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.logout': 'Logout',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.users': 'User Management',
    'nav.kyc': 'KYC Verification',
    'nav.services': 'Services',
    'nav.logs': 'System Logs',
    'nav.settings': 'Settings',
    
    // Dashboard
    'dashboard.totalUsers': 'Total Users',
    'dashboard.pendingKyc': 'Pending KYC',
    'dashboard.activeUsers': 'Active Users',
    'dashboard.activeSessions': 'Active Sessions',
    
    // User Management
    'users.title': 'User Management',
    'users.id': 'ID',
    'users.photo': 'Photo',
    'users.nameKhmer': 'Name (Khmer)',
    'users.nameEnglish': 'Name (English)',
    'users.nationalId': 'National ID',
    'users.username': 'Username',
    'users.email': 'Email',
    'users.phoneNumber': 'Phone Number',
    'users.gender': 'Gender',
    'users.address': 'Address',
    'users.status': 'Status',
    'users.actions': 'Actions',
    'users.editUser': 'Edit User',
    'users.deleteUser': 'Delete User',
    'users.deleteConfirm': 'Are you sure you want to delete this user?',
    
    // Status
    'status.active': 'Active',
    'status.pending': 'Pending',
    'status.blocked': 'Blocked',
    'status.approved': 'Approved',
    'status.rejected': 'Rejected',
    
    // Gender
    'gender.male': 'Male',
    'gender.female': 'Female',
    'gender.other': 'Other',
    
    // KYC
    'kyc.title': 'KYC Verification',
    'kyc.nidFront': 'NID Front',
    'kyc.nidBack': 'NID Back',
    'kyc.selfie': 'Selfie with NID',
    'kyc.documents': 'Documents',
    'kyc.viewDocuments': 'View Documents',
    'kyc.approveKyc': 'Approve KYC',
    'kyc.rejectKyc': 'Reject KYC',
    'kyc.rejectionReason': 'Rejection Reason',
    'kyc.enterReason': 'Enter rejection reason',
    
    // Services
    'services.title': 'Service Management',
    'services.name': 'Service Name',
    'services.nameKhmer': 'Name (Khmer)',
    'services.nameEnglish': 'Name (English)',
    'services.description': 'Description',
    'services.logo': 'Logo',
    'services.token': 'Token',
    'services.secret': 'Secret',
    'services.callbackUrl': 'Callback URL',
    'services.isActive': 'Active',
    'services.addService': 'Add New Service',
    'services.editService': 'Edit Service',
    'services.deleteService': 'Delete Service',
    'services.regenerateCredentials': 'Regenerate Credentials',
    'services.deleteConfirm': 'Are you sure you want to delete this service?',
    
    // Logs
    'logs.title': 'System Logs',
    'logs.user': 'User',
    'logs.action': 'Action',
    'logs.type': 'Type',
    'logs.description': 'Description',
    'logs.timestamp': 'Timestamp',
    'logs.exportExcel': 'Export to Excel',
    'logs.clearLogs': 'Clear Logs',
    'logs.clearConfirm': 'Are you sure you want to clear all logs?',
    
    // Settings
    'settings.title': 'System Settings',
    'settings.general': 'General Configuration',
    'settings.maintenanceMode': 'Maintenance Mode',
    'settings.allowKycCreation': 'Allow KYC User Creation',
    'settings.telegram': 'Telegram OTP Configuration',
    'settings.telegramToken': 'Bot Token',
    'settings.telegramBotId': 'Bot ID',
    'settings.sms': 'SMS OTP Configuration',
    'settings.smsProvider': 'SMS Provider',
    'settings.smsApiKey': 'API Key',
    'settings.smsApiSecret': 'API Secret',
    'settings.smsSenderId': 'Sender ID',
    'settings.resetDefault': 'Reset to Default',
    'settings.saveChanges': 'Save Changes',
    
    // Mobile App
    'mobile.dashboard': 'Dashboard',
    'mobile.profile': 'Profile',
    'mobile.services': 'Connected Services',
    'mobile.notifications': 'Notifications',
    'mobile.history': 'History',
    'mobile.settings': 'Settings',
    'mobile.scanQr': 'Scan QR Code',
    'mobile.addService': 'Add Service',
    'mobile.digitalVerified': 'Digital ID Verified',
    'mobile.idExpiry': 'ID Expiry Date',
    'mobile.changePin': 'Change PIN',
    'mobile.twoFactor': '2-Step Verification',
    'mobile.language': 'Language',
    'mobile.termsOfUse': 'Terms of Use',
    'mobile.privacyPolicy': 'Privacy Policy',
    'mobile.helpSupport': 'Help and Support',
    'mobile.aboutUs': 'About Us',
  },
  km: {
    // Common
    'app.title': 'ប្រព័ន្ធគ្រប់គ្រង Digital ID',
    'common.save': 'រក្សាទុក',
    'common.cancel': 'បោះបង់',
    'common.delete': 'លុប',
    'common.edit': 'កែសម្រួល',
    'common.add': 'បន្ថែម',
    'common.search': 'ស្វែងរក',
    'common.filter': 'តម្រង',
    'common.export': 'នាំចេញ',
    'common.clear': 'សម្អាត',
    'common.approve': 'អនុម័ត',
    'common.reject': 'បដិសេធ',
    'common.submit': 'ដាក់ស្នើ',
    'common.close': 'បិទ',
    'common.loading': 'កំពុងផ្ទុក...',
    'common.error': 'កំហុស',
    'common.success': 'ជោគជ័យ',
    'common.logout': 'ចាកចេញ',
    
    // Navigation
    'nav.dashboard': 'ផ្ទាំងគ្រប់គ្រង',
    'nav.users': 'គ្រប់គ្រងអ្នកប្រើប្រាស់',
    'nav.kyc': 'ផ្ទៀងផ្ទាត់ KYC',
    'nav.services': 'សេវាកម្ម',
    'nav.logs': 'កំណត់ត្រាប្រព័ន្ធ',
    'nav.settings': 'ការកំណត់',
    
    // Dashboard
    'dashboard.totalUsers': 'អ្នកប្រើប្រាស់សរុប',
    'dashboard.pendingKyc': 'KYC រង់ចាំ',
    'dashboard.activeUsers': 'អ្នកប្រើប្រាស់សកម្ម',
    'dashboard.activeSessions': 'សម័យសកម្ម',
    
    // User Management
    'users.title': 'គ្រប់គ្រងអ្នកប្រើប្រាស់',
    'users.id': 'លេខសម្គាល់',
    'users.photo': 'រូបថត',
    'users.nameKhmer': 'ឈ្មោះ (ខ្មែរ)',
    'users.nameEnglish': 'ឈ្មោះ (អង់គ្លេស)',
    'users.nationalId': 'អត្តសញ្ញាណបណ្ណ',
    'users.username': 'ឈ្មោះអ្នកប្រើ',
    'users.email': 'អ៊ីមែល',
    'users.phoneNumber': 'លេខទូរស័ព្ទ',
    'users.gender': 'ភេទ',
    'users.address': 'អាសយដ្ឋាន',
    'users.status': 'ស្ថានភាព',
    'users.actions': 'សកម្មភាព',
    'users.editUser': 'កែសម្រួលអ្នកប្រើប្រាស់',
    'users.deleteUser': 'លុបអ្នកប្រើប្រាស់',
    'users.deleteConfirm': 'តើអ្នកប្រាកដថាចង់លុបអ្នកប្រើប្រាស់នេះទេ?',
    
    // Status
    'status.active': 'សកម្ម',
    'status.pending': 'រង់ចាំ',
    'status.blocked': 'បានទប់ស្កាត់',
    'status.approved': 'បានអនុម័ត',
    'status.rejected': 'បានបដិសេធ',
    
    // Gender
    'gender.male': 'ប្រុស',
    'gender.female': 'ស្រី',
    'gender.other': 'ផ្សេងទៀត',
    
    // KYC
    'kyc.title': 'ផ្ទៀងផ្ទាត់ KYC',
    'kyc.nidFront': 'អត្តសញ្ញាណបណ្ណមុខ',
    'kyc.nidBack': 'អត្តសញ្ញាណបណ្ណក្រោយ',
    'kyc.selfie': 'រូបថតខ្លួនឯងជាមួយអត្តសញ្ញាណបណ្ណ',
    'kyc.documents': 'ឯកសារ',
    'kyc.viewDocuments': 'មើលឯកសារ',
    'kyc.approveKyc': 'អនុម័ត KYC',
    'kyc.rejectKyc': 'បដិសេធ KYC',
    'kyc.rejectionReason': 'មូលហេតុបដិសេធ',
    'kyc.enterReason': 'បញ្ចូលមូលហេតុបដិសេធ',
    
    // Services
    'services.title': 'គ្រប់គ្រងសេវាកម្ម',
    'services.name': 'ឈ្មោះសេវាកម្ម',
    'services.nameKhmer': 'ឈ្មោះ (ខ្មែរ)',
    'services.nameEnglish': 'ឈ្មោះ (អង់គ្លេស)',
    'services.description': 'ការពិពណ៌នា',
    'services.logo': 'រូបសញ្ញា',
    'services.token': 'Token',
    'services.secret': 'Secret',
    'services.callbackUrl': 'Callback URL',
    'services.isActive': 'សកម្ម',
    'services.addService': 'បន្ថែមសេវាកម្មថ្មី',
    'services.editService': 'កែសម្រួលសេវាកម្ម',
    'services.deleteService': 'លុបសេវាកម្ម',
    'services.regenerateCredentials': 'បង្កើតលិខិតសម្គាល់ឡើងវិញ',
    'services.deleteConfirm': 'តើអ្នកប្រាកដថាចង់លុបសេវាកម្មនេះទេ?',
    
    // Logs
    'logs.title': 'កំណត់ត្រាប្រព័ន្ធ',
    'logs.user': 'អ្នកប្រើប្រាស់',
    'logs.action': 'សកម្មភាព',
    'logs.type': 'ប្រភេទ',
    'logs.description': 'ការពិពណ៌នា',
    'logs.timestamp': 'ពេលវេលា',
    'logs.exportExcel': 'នាំចេញជា Excel',
    'logs.clearLogs': 'សម្អាតកំណត់ត្រា',
    'logs.clearConfirm': 'តើអ្នកប្រាកដថាចង់សម្អាតកំណត់ត្រាទាំងអស់ទេ?',
    
    // Settings
    'settings.title': 'ការកំណត់ប្រព័ន្ធ',
    'settings.general': 'ការកំណត់ទូទៅ',
    'settings.maintenanceMode': 'របៀបថែទាំ',
    'settings.allowKycCreation': 'អនុញ្ញាតឱ្យបង្កើតអ្នកប្រើ KYC',
    'settings.telegram': 'ការកំណត់ Telegram OTP',
    'settings.telegramToken': 'Bot Token',
    'settings.telegramBotId': 'Bot ID',
    'settings.sms': 'ការកំណត់ SMS OTP',
    'settings.smsProvider': 'អ្នកផ្តល់សេវា SMS',
    'settings.smsApiKey': 'API Key',
    'settings.smsApiSecret': 'API Secret',
    'settings.smsSenderId': 'Sender ID',
    'settings.resetDefault': 'កំណត់ឡើងវិញជាលំនាំដើម',
    'settings.saveChanges': 'រក្សាទុកការផ្លាស់ប្តូរ',
    
    // Mobile App
    'mobile.dashboard': 'ផ្ទាំងគ្រប់គ្រង',
    'mobile.profile': 'ប្រវត្តិរូប',
    'mobile.services': 'សេវាកម្មដែលបានភ្ជាប់',
    'mobile.notifications': 'ការជូនដំណឹង',
    'mobile.history': 'ប្រវត្តិ',
    'mobile.settings': 'ការកំណត់',
    'mobile.scanQr': 'ស្កេន QR កូដ',
    'mobile.addService': 'បន្ថែមសេវាកម្ម',
    'mobile.digitalVerified': 'បានផ្ទៀងផ្ទាត់ Digital ID',
    'mobile.idExpiry': 'កាលបរិច្ឆេទផុតកំណត់',
    'mobile.changePin': 'ប្តូរ PIN',
    'mobile.twoFactor': 'ការផ្ទៀងផ្ទាត់ពីរជំហាន',
    'mobile.language': 'ភាសា',
    'mobile.termsOfUse': 'លក្ខខណ្ឌប្រើប្រាស់',
    'mobile.privacyPolicy': 'គោលការណ៍ភាពឯកជន',
    'mobile.helpSupport': 'ជំនួយនិងការគាំទ្រ',
    'mobile.aboutUs': 'អំពីយើង',
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'km' || saved === 'en') ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
