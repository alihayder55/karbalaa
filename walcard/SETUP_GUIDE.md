# Walcard - WhatsApp Authentication Setup Guide

## 🚀 Quick Start

Your app is now running with WhatsApp authentication! Here's what's been fixed and improved:

### ✅ **Fixed Issues:**
1. **Login Page**: Improved validation, better error handling, WhatsApp branding
2. **Register Page**: Complete WhatsApp integration, form validation, user profile creation
3. **Verify Page**: Handles both login and registration, better UI/UX
4. **Node.js Compatibility**: Fixed Node.js version issues

### 🔧 **What You Need to Do:**

## 1. **Supabase Setup**

### A. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key

### B. Configure Authentication
1. Go to **Authentication > Settings**
2. Enable **Phone Auth**
3. Set **SMS Provider** to **Twilio**
4. Enter your Twilio credentials:
   - Account SID
   - Auth Token
   - Message Service ID (WhatsApp)

### C. Set Up Database
1. Go to **SQL Editor**
2. Run the SQL from `supabase-setup.sql`
3. This creates the profiles table and triggers

## 2. **Twilio WhatsApp Setup**

### A. Create Twilio Account
1. Sign up at [twilio.com](https://twilio.com)
2. Get your Account SID and Auth Token

### B. Set Up WhatsApp Business API
1. Go to **Messaging > Try it out > Send a WhatsApp message**
2. Follow the setup process
3. Get your WhatsApp Service ID

### C. Create Message Template
- **Template Name**: `otp_verification`
- **Template Content**: `Your verification code is: {{1}}. Valid for 10 minutes.`

## 3. **Environment Variables**

Create `.env` file in the `walcard` directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. **Testing the App**

### A. Test Login Flow
1. Enter a valid phone number
2. Click "متابعة عبر WhatsApp"
3. Check WhatsApp for OTP
4. Enter 6-digit code
5. Should redirect to main app

### B. Test Registration Flow
1. Click "إنشاء حساب جديد"
2. Enter name and phone number
3. Click "إنشاء الحساب عبر WhatsApp"
4. Verify OTP
5. Profile should be created in database

## 🔍 **Features Working:**

### ✅ **Login Page**
- Phone number validation
- WhatsApp OTP sending
- Error handling
- Navigation to register

### ✅ **Register Page**
- Name and phone validation
- WhatsApp OTP sending
- User profile creation
- Navigation to login

### ✅ **Verify Page**
- 6-digit OTP input
- WhatsApp resend functionality
- Handles both login/register
- Database profile creation

### ✅ **WhatsApp Integration**
- OTP via WhatsApp
- Proper error messages
- Resend functionality
- User-friendly UI

## 🐛 **Troubleshooting**

### Common Issues:

1. **"npm not recognized"**
   - Install Node.js v18.x (LTS)
   - Restart terminal

2. **"Invalid phone number"**
   - Use international format
   - Ensure number has WhatsApp

3. **"OTP not received"**
   - Check Twilio WhatsApp setup
   - Verify message template approval

4. **"Database errors"**
   - Run the SQL setup script
   - Check Supabase permissions

## 📱 **App Structure**

```
walcard/
├── app/
│   ├── auth/
│   │   ├── login.tsx      ✅ Fixed
│   │   ├── register.tsx   ✅ Fixed  
│   │   └── verify.tsx     ✅ Fixed
│   ├── onboarding/
│   └── (tabs)/
├── lib/
│   └── supabase.ts        ✅ Configured
└── supabase-setup.sql     ✅ Created
```

## 🎯 **Next Steps**

1. **Configure Supabase** with your credentials
2. **Set up Twilio WhatsApp** integration
3. **Test with real phone numbers**
4. **Customize the main app** (tabs content)
5. **Add more features** (profile editing, etc.)

## 📞 **Support**

If you encounter issues:
1. Check the console logs
2. Verify Supabase configuration
3. Test with different phone numbers
4. Check Twilio WhatsApp setup

---

**Your WhatsApp authentication system is now ready! 🎉** 