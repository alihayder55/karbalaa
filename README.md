# Karbalaa - React Native App

A React Native application with Arabic language support and phone number authentication using Supabase and WhatsApp OTP.

## Features

- 🌍 Arabic language support with RTL layout
- 📱 Phone number authentication via WhatsApp OTP
- 🔐 Supabase backend integration
- 🎨 Modern UI with Arabic typography
- 📞 Phone number input with country picker
- 🔄 Real-time authentication flow

## Tech Stack

- **Frontend**: React Native
- **Backend**: Supabase
- **Authentication**: Supabase Auth with Twilio WhatsApp
- **UI Components**: Custom Arabic-styled components
- **Phone Input**: react-native-phone-number-input
- **Country Picker**: react-native-country-picker-modal

## Prerequisites

- Node.js (v16 or higher)
- React Native CLI
- Expo CLI
- Supabase account
- Twilio account (for WhatsApp messaging)

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd karbalaa
```

2. Install dependencies:
```bash
npm install
```

3. Install iOS dependencies (if developing for iOS):
```bash
cd ios && pod install && cd ..
```

## Configuration

### Supabase Setup

1. Create a new Supabase project
2. Enable Phone authentication in Authentication > Settings
3. Configure Twilio as your SMS provider
4. Set up WhatsApp messaging templates
5. Add your Supabase URL and anon key to the configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
karbalaa/
├── walcard/                 # Main app directory
│   ├── lib/
│   │   └── supabase.ts     # Supabase configuration
│   ├── screens/
│   │   ├── WelcomeScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── components/
│   │   └── PhoneInput.tsx
│   └── App.tsx
├── package.json
├── .gitignore
└── README.md
```

## Running the App

### Development

```bash
# Start the development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

### Production

```bash
# Build for production
npx expo build:android
npx expo build:ios
```

## Authentication Flow

1. **Welcome Screen**: App introduction with Arabic UI
2. **Login Screen**: Phone number input with country picker
3. **OTP Verification**: WhatsApp OTP sent via Twilio
4. **Registration**: User profile creation after verification

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository. 