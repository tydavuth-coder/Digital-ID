import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

type Language = 'en' | 'km';

type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
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
        // New Keys
        changePin: 'Change PIN',
        biometrics: 'Biometric Authentication',
        linkTelegram: 'Link Telegram',
        telegramLinked: 'Telegram Linked',
        telegramNotLinked: 'Telegram Not Linked',
        logout: 'Log Out',
        confirmLogout: 'Are you sure you want to log out?',
        cancel: 'Cancel',
        yes: 'Yes',
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
        // New Keys
        changePin: 'ផ្លាស់ប្តូរលេខ PIN',
        biometrics: 'ការផ្ទៀងផ្ទាត់ជីវមាត្រ',
        linkTelegram: 'ភ្ជាប់ Telegram',
        telegramLinked: 'បានភ្ជាប់ Telegram',
        telegramNotLinked: 'មិនទាន់ភ្ជាប់ Telegram',
        logout: 'ចាកចេញ',
        confirmLogout: 'តើអ្នកពិតជាចង់ចាកចេញមែនទេ?',
        cancel: 'ថយក្រោយ',
        yes: 'យល់ព្រម',
    }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        // Load saved language
        SecureStore.getItemAsync('user-language').then((lang) => {
            if (lang === 'en' || lang === 'km') {
                setLanguageState(lang);
            }
        });
    }, []);

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        await SecureStore.setItemAsync('user-language', lang);
    };

    const t = (key: string) => {
        // @ts-ignore
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
