/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// اللون الفيروزي كلون أساسي
const tintColorLight = '#40E0D0'; // Turquoise
const tintColorDark = '#40E0D0'; // Turquoise for dark mode too

export const Colors = {
  light: {
    text: '#2C3E50',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#5D6D7E',
    tabIconDefault: '#95A5A6',
    tabIconSelected: tintColorLight,
    primary: '#40E0D0', // Turquoise
    secondary: '#48C9B0', // Lighter turquoise
    accent: '#1ABC9C', // Darker turquoise
    surface: '#F8F9FA',
    border: '#E8F4F8',
    success: '#27AE60',
    warning: '#F39C12',
    error: '#E74C3C',
  },
  dark: {
    text: '#ECF0F1',
    background: '#1A1A1A',
    tint: tintColorDark,
    icon: '#BDC3C7',
    tabIconDefault: '#7F8C8D',
    tabIconSelected: tintColorDark,
    primary: '#40E0D0', // Turquoise
    secondary: '#48C9B0', // Lighter turquoise
    accent: '#1ABC9C', // Darker turquoise
    surface: '#2C2C2C',
    border: '#34495E',
    success: '#27AE60',
    warning: '#F39C12',
    error: '#E74C3C',
  },
};
