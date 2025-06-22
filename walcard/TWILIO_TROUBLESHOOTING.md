# Twilio WhatsApp Integration Troubleshooting

## 🔧 **Fixed Issues**

### ✅ **WhatsApp/SMS Fallback System**
The app now automatically falls back to SMS if WhatsApp fails:
- **Primary**: Tries WhatsApp first
- **Fallback**: Automatically switches to SMS if WhatsApp fails
- **Error Handling**: Better error messages for both channels

### ✅ **Updated Error Messages**
- More specific error messages in Arabic
- Better handling of different error types
- User-friendly feedback

## 🚨 **Common Twilio Errors & Solutions**

### **1. "Invalid phone number" Error**
**Cause**: Phone number format issues
**Solution**:
- Ensure phone number is in international format (+964...)
- Remove spaces and special characters
- Test with a valid phone number

### **2. "WhatsApp not available" Error**
**Cause**: WhatsApp Business API not configured
**Solution**:
1. **In Supabase Dashboard**:
   - Go to Authentication > Settings
   - Set SMS Provider to "Twilio"
   - Enter Twilio credentials

2. **In Twilio Console**:
   - Go to Messaging > Try it out > Send a WhatsApp message
   - Complete WhatsApp Business API setup
   - Get your WhatsApp Service ID

### **3. "Rate limit exceeded" Error**
**Cause**: Too many OTP requests
**Solution**:
- Wait 1-2 minutes before trying again
- Check Twilio usage limits
- Implement rate limiting in production

### **4. "Template not approved" Error**
**Cause**: WhatsApp message template not approved
**Solution**:
1. **Create Template in Twilio**:
   - Template Name: `otp_verification`
   - Template Content: `Your verification code is: {{1}}. Valid for 10 minutes.`
2. **Wait for approval** (usually 24-48 hours)

## 🔧 **Supabase Configuration**

### **Required Settings**:
```sql
-- Enable phone auth
-- Set SMS provider to Twilio
-- Configure Twilio credentials:
--   - Account SID
--   - Auth Token  
--   - Message Service ID (WhatsApp)
```

### **Database Setup**:
Run the SQL from `supabase-setup.sql` to create:
- Profiles table
- Row Level Security
- Triggers for user creation

## 📱 **Testing the App**

### **Test Flow**:
1. **Enter phone number** (use international format)
2. **Click "متابعة"** (Continue)
3. **Check both WhatsApp and SMS**
4. **Enter 6-digit OTP**
5. **Verify success**

### **Debug Information**:
Check console logs for:
- `Attempting to send OTP via WhatsApp to:`
- `WhatsApp failed, trying SMS fallback`
- `OTP sent successfully`

## 🛠️ **Manual Testing**

### **Test with Real Numbers**:
- Use actual phone numbers (not virtual)
- Ensure numbers have WhatsApp installed
- Test both WhatsApp and SMS delivery

### **Test Error Scenarios**:
- Invalid phone numbers
- Numbers without WhatsApp
- Rate limit scenarios
- Network issues

## 📞 **Support Steps**

### **If Still Having Issues**:

1. **Check Supabase Logs**:
   - Go to Supabase Dashboard > Logs
   - Look for authentication errors

2. **Check Twilio Logs**:
   - Go to Twilio Console > Monitor > Logs
   - Look for message delivery status

3. **Verify Configuration**:
   - Supabase phone auth enabled
   - Twilio credentials correct
   - WhatsApp Business API active

4. **Test with Different Numbers**:
   - Try multiple phone numbers
   - Test with and without WhatsApp

## 🎯 **Production Checklist**

- [ ] Supabase phone auth enabled
- [ ] Twilio account configured
- [ ] WhatsApp Business API active
- [ ] Message templates approved
- [ ] Database tables created
- [ ] Error handling implemented
- [ ] Rate limiting configured
- [ ] Monitoring set up

## 📋 **Environment Variables**

Ensure these are set in your `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

**The app now has robust error handling and fallback mechanisms! 🎉** 