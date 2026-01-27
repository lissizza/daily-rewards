import { useLanguageStore } from '@/stores/language';
import { translations } from './translations';

export function useTranslation() {
  const { language } = useLanguageStore();
  return translations[language];
}
