# WhatsApp Template Fix Guide (Error 60242)

## 🚨 Problem
**Error 60242**: "An approved WhatsApp template was not found for the given account sid and language"

This means your Twilio WhatsApp Business API doesn't have an approved template for OTP messages.

## 🛠️ Quick Fix: Switch to SMS

**Immediate Solution** - Change your app to use SMS instead of WhatsApp:

### 1. Update Login Page
Edit `walcard/app/auth/login.tsx`:
```typescript
// Find this line (around line 100):
channel: 'whatsapp',

// Change it to:
channel: 'sms',
```

### 2. Update Register Page  
Edit `walcard/app/auth/register.tsx`:
```typescript
// Find this line (around line 100):
channel: 'whatsapp',

// Change it to:
channel: 'sms',
```

### 3. Update Verify Page
Edit `walcard/app/auth/verify.tsx`:
```typescript
// Find this line (around line 50):
channel: 'whatsapp',

// Change it to:
channel: 'sms',
```

## 📱 Long-term Solution: Fix WhatsApp Templates

If you want to use WhatsApp, you need to set up templates in Twilio:

### Step 1: Twilio Console Setup
1. **Go to Twilio Console**: https://console.twilio.com/
2. **Navigate to**: Messaging > Try it out > Send a WhatsApp message
3. **Set up WhatsApp Business API**

### Step 2: Create WhatsApp Templates
1. **Go to**: Messaging > Templates
2. **Create a new template** for OTP messages
3. **Template example**:
   ```
   Name: otp_verification
   Language: Arabic (ar)
   Content: "رمز التحقق الخاص بك هو: {{1}}"
   ```

### Step 3: Submit for Approval
1. **Submit template** for WhatsApp approval
2. **Wait for approval** (can take 24-48 hours)
3. **Template must be approved** before use

### Step 4: Update Supabase
1. **Go to Supabase Dashboard**
2. **Navigate to**: Authentication > Settings > SMS Provider
3. **Add your approved template ID**

## 🔧 Alternative Solutions

### Option 1: Use Twilio Test Mode
- Use Twilio's sandbox for testing
- Add your phone number to test numbers
- Limited to test numbers only

### Option 2: Use Different Provider
- Configure a different SMS provider in Supabase
- Or use Supabase's built-in SMS service

### Option 3: Mixed Approach
- Use SMS for now
- Set up WhatsApp templates in background
- Switch back to WhatsApp when approved

## ⚡ Immediate Fix Commands

Run these to switch to SMS mode:

1. **Login Page**:
```bash
# Find and replace in login.tsx
channel: 'whatsapp' → channel: 'sms'
```

2. **Register Page**:
```bash
# Find and replace in register.tsx  
channel: 'whatsapp' → channel: 'sms'
```

3. **Verify Page**:
```bash
# Find and replace in verify.tsx
channel: 'whatsapp' → channel: 'sms'
```

## 📋 Verification Checklist

After switching to SMS:
- [ ] Test login with SMS OTP
- [ ] Test registration with SMS OTP  
- [ ] Test OTP verification
- [ ] Check SMS delivery
- [ ] Update UI text (remove WhatsApp references)

## 🎯 Why This Happens

WhatsApp Business API requires:
1. **Approved Templates** - All messages must use pre-approved templates
2. **Business Verification** - Your business must be verified
3. **Template Review** - Templates go through approval process
4. **Language Support** - Templates must exist for your language

## 📞 Support Resources

- **Twilio Docs**: https://www.twilio.com/docs/whatsapp
- **Template Guide**: https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates
- **Error 60242**: https://www.twilio.com/docs/errors/60242

---

**Quick Action**: Switch to SMS mode immediately to get your app working, then set up WhatsApp templates properly for future use. 