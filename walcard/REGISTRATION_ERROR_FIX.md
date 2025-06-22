# Registration Error Fix Guide

## 🔍 Common Registration Errors & Solutions

### 1. **Error 60200 - Invalid Parameter**
**Problem**: Twilio configuration issue in Supabase
**Solution**: 
- Go to Supabase Dashboard > Authentication > Settings > SMS Provider
- Configure Twilio with correct Account SID, Auth Token, and Message Service ID
- Or switch to SMS-only mode temporarily

### 2. **Network Request Failed**
**Problem**: Internet connection or Supabase URL issue
**Solution**:
- Check internet connection
- Verify Supabase URL is correct
- Check if Supabase service is down

### 3. **Invalid Phone Number**
**Problem**: Phone number format is incorrect
**Solution**:
- Ensure phone number includes country code (e.g., +964 for Iraq)
- Remove any spaces or special characters
- Use the phone input component properly

### 4. **Rate Limit Exceeded**
**Problem**: Too many OTP requests
**Solution**:
- Wait 1-2 minutes before trying again
- Check if you're using a valid phone number
- Contact support if issue persists

### 5. **WhatsApp Not Registered**
**Problem**: Phone number not registered on WhatsApp
**Solution**:
- Ensure the phone number is active on WhatsApp
- Try using a different phone number
- Switch to SMS mode temporarily

## 🛠️ Debugging Steps

### Step 1: Check Console Logs
When you try to register, check the console for detailed logs:
```
=== REGISTRATION START ===
Phone number: +964XXXXXXXXX
Name: John Doe
Testing connection...
✅ Connection test passed
Sending WhatsApp OTP...
```

### Step 2: Test Connection
Run this in your app to test Supabase connection:
```javascript
import { testAuthConnection } from '../lib/test-connection';

// Test connection
const isConnected = await testAuthConnection();
console.log('Connection test result:', isConnected);
```

### Step 3: Verify Supabase Configuration
Check your `lib/supabase.ts` file:
```typescript
const supabaseUrl = 'https://wbpynqwkamxxddoteswm.supabase.co';
const supabaseAnonKey = 'your-anon-key';
```

## 🔧 Quick Fixes

### Fix 1: Switch to SMS Mode
If WhatsApp is causing issues, temporarily switch to SMS:
```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  phone: formattedValue,
  options: {
    channel: 'sms', // Change from 'whatsapp' to 'sms'
    data: {
      phone_number: formattedValue,
      full_name: name.trim()
    }
  }
});
```

### Fix 2: Improve Error Handling
Add better error handling in your registration function:
```typescript
} catch (error: any) {
  console.error('Registration error:', error);
  let errorMessage = 'حدث خطأ أثناء إرسال رمز التحقق';
  
  if (error?.message?.includes('60200')) {
    errorMessage = 'خطأ في إعدادات Twilio، يرجى التحقق من التكوين';
  } else if (error?.message?.includes('Invalid phone number')) {
    errorMessage = 'رقم الهاتف غير صحيح';
  }
  // ... more error cases
  
  Alert.alert('خطأ في التسجيل', errorMessage);
}
```

### Fix 3: Validate Phone Number
Ensure proper phone number validation:
```typescript
const validatePhone = (text: string) => {
  // Remove any non-digit characters except +
  const cleanPhone = text.replace(/[^\d+]/g, '');
  
  // Check if it starts with + and has at least 10 digits
  const isValid = cleanPhone.startsWith('+') && cleanPhone.length >= 10;
  
  setIsValidPhone(isValid);
  return isValid;
};
```

## 📱 Testing Checklist

- [ ] Internet connection is stable
- [ ] Phone number includes country code
- [ ] Phone number is registered on WhatsApp (if using WhatsApp)
- [ ] Supabase project is active
- [ ] Twilio is configured (if using WhatsApp)
- [ ] No rate limiting in effect
- [ ] App has proper permissions

## 🚨 Emergency Solutions

### If Nothing Works:
1. **Switch to SMS mode** temporarily
2. **Use a different phone number** for testing
3. **Check Supabase project status** at https://status.supabase.com
4. **Contact support** with error logs

## 📋 Error Log Template

When reporting issues, include:
```
Error Type: [Network/Validation/Twilio/etc]
Error Message: [Exact error message]
Phone Number: [Format used]
Name: [Name entered]
Console Logs: [All console output]
Steps to Reproduce: [What you did]
```

---

**Note**: Most registration errors are related to Twilio configuration or phone number format. The improved error handling will help identify the specific issue. 