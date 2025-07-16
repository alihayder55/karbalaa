import { I18nManager } from 'react-native';

// إعدادات RTL للتطبيق
export const setupRTL = () => {
  // تفعيل RTL
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
  
  console.log('✅ RTL enabled:', I18nManager.isRTL);
};

// دالة للتحقق من اتجاه النص
export const isRTL = () => {
  return I18nManager.isRTL;
};

// دالة لتطبيق أنماط RTL
export const getRTLStyles = () => ({
  textAlign: 'right' as const,
  writingDirection: 'rtl' as const,
  direction: 'rtl' as const,
});

// دالة لتطبيق أنماط Flexbox للـ RTL
export const getRTLFlexStyles = () => ({
  flexDirection: 'row-reverse' as const,
  alignItems: 'center' as const,
});

// دالة لتطبيق أنماط النص العربي
export const getArabicTextStyles = () => ({
  textAlign: 'right' as const,
  writingDirection: 'rtl' as const,
  fontFamily: 'System', // يمكن تغييرها لخط عربي
}); 