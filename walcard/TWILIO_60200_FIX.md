# Fix Twilio Error 60200: Invalid Parameter

## 🚨 **Error Details**
```
Error sending confirmation OTP to provider: Invalid parameter
More information: https://www.twilio.com/docs/errors/60200
```

## 🔧 **What This Error Means**
Error 60200 means there's an **invalid parameter** in your Twilio configuration in Supabase. This usually happens when:
- Twilio credentials are incorrect
- WhatsApp Service ID is missing or wrong
- Phone number format is invalid
- Twilio account is not properly configured

## ✅ **Step-by-Step Fix**

### **1. Check Supabase Twilio Configuration**

Go to your **Supabase Dashboard**:
1. Navigate to **Authentication > Settings**
2. Find **SMS Provider** section
3. Ensure it's set to **"Twilio"**
4. Verify these credentials:

```
Account SID: AC... (starts with AC)
Auth Token: ... (your auth token)
Message Service ID: MG... (starts with MG for WhatsApp)
```

### **2. Get Correct Twilio Credentials**

**In Twilio Console**:
1. Go to [console.twilio.com](https://console.twilio.com)
2. **Account SID**: Found in Account Info (starts with AC)
3. **Auth Token**: Click "Show" to reveal (or regenerate if needed)
4. **Message Service ID**: Go to Messaging > Services > WhatsApp

### **3. Set Up WhatsApp Service**

**In Twilio Console**:
1. Go to **Messaging > Services**
2. Click **"Create Messaging Service"**
3. Choose **"WhatsApp"** as the channel
4. Follow the setup process
5. Copy the **Service ID** (starts with MG)

### **4. Update Supabase Configuration**

**In Supabase Dashboard**:
1. Go to **Authentication > Settings**
2. **SMS Provider**: Twilio
3. **Account SID**: `AC...` (from Twilio)
4. **Auth Token**: `...` (from Twilio)
5. **Message Service ID**: `MG...` (WhatsApp service ID)
6. **Save** the configuration

### **5. Test Phone Number Format**

Ensure phone numbers are in **international format**:
- ✅ **Correct**: `+9647760057459`
- ❌ **Wrong**: `07760057459`
- ❌ **Wrong**: `9647760057459`

### **6. Verify Twilio Account Status**

**In Twilio Console**:
1. Check **Account Status** (should be active)
2. Verify **Phone Numbers** are provisioned
3. Check **WhatsApp Business API** is active
4. Ensure **Message Templates** are approved

## 🧪 **Testing the Fix**

### **Test Steps**:
1. **Update Supabase** with correct Twilio credentials
2. **Restart your app** (stop and start again)
3. **Try registration** with a valid phone number
4. **Check console logs** for new error messages

### **Expected Results**:
- ✅ No more 60200 errors
- ✅ OTP sent successfully
- ✅ User receives WhatsApp/SMS message

## 🐛 **If Still Getting Errors**

### **Alternative Solutions**:

1. **Use SMS Only** (temporary fix):
   ```javascript
   // In your auth code, force SMS channel
   channel: 'sms'  // instead of 'whatsapp'
   ```

2. **Check Twilio Logs**:
   - Go to Twilio Console > Monitor > Logs
   - Look for specific error details

3. **Verify Phone Number**:
   - Test with a different phone number
   - Ensure it's a real number (not virtual)

4. **Check Supabase Logs**:
   - Go to Supabase Dashboard > Logs
   - Look for authentication errors

## 📞 **Common Issues & Solutions**

### **Issue**: "Account SID not found"
**Solution**: Copy the exact Account SID from Twilio Console

### **Issue**: "Auth Token invalid"
**Solution**: Regenerate Auth Token in Twilio Console

### **Issue**: "Message Service not found"
**Solution**: Create WhatsApp Messaging Service in Twilio

### **Issue**: "Phone number invalid"
**Solution**: Use international format (+964...)

## 🎯 **Quick Checklist**

- [ ] Twilio Account SID is correct (starts with AC)
- [ ] Twilio Auth Token is correct
- [ ] WhatsApp Message Service ID is set (starts with MG)
- [ ] Phone numbers use international format (+964...)
- [ ] Twilio account is active and funded
- [ ] WhatsApp Business API is enabled
- [ ] Message templates are approved

---

**After following these steps, the 60200 error should be resolved! 🎉** 