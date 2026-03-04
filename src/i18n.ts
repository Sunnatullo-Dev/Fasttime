import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import uzTranslations from './locales/uz.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            uz: {
                translation: uzTranslations,
            },
        },
        fallbackLng: 'uz',
        lng: 'uz', // Set default to Uzbek as requested
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
