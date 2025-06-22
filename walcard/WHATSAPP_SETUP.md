# WhatsApp OTP Setup Guide

This app uses WhatsApp for OTP verification through Supabase Auth and Twilio. Here's how to configure it:

## Prerequisites

1. **Twilio Account**: Sign up at [twilio.com](https://twilio.com)
2. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
3. **WhatsApp Business API**: Apply for WhatsApp Business API access

## Supabase Configuration

### 1. Enable Phone Auth
1. Go to your Supabase Dashboard
2. Navigate to Authentication > Settings
3. Enable "Phone Auth"
4. Set "Enable phone confirmations" to true

### 2. Configure Twilio Provider
1. In Authentication > Settings, find "SMS Provider"
2. Select "Twilio" from the dropdown
3. Enter your Twilio credentials:
   - **Account SID**: From your Twilio Console
   - **Auth Token**: From your Twilio Console
   - **Message Service ID**: Your Twilio WhatsApp Service ID

### 3. WhatsApp Business API Setup
1. In Twilio Console, go to Messaging > Try it out > Send a WhatsApp message
2. Follow the setup process to connect your WhatsApp Business account
3. Get your WhatsApp Service ID

## Environment Variables

Add these to your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## WhatsApp Message Template

Create a message template in Twilio for OTP:

**Template Name**: `otp_verification`
**Template Content**: `Your verification code is: {{1}}. Valid for 10 minutes.`

## Testing

1. Use a real phone number (WhatsApp doesn't work with virtual numbers)
2. Make sure the number is registered with WhatsApp
3. Test the flow: Login → Receive WhatsApp → Verify OTP

## Troubleshooting

### Common Issues:
- **"Invalid phone number"**: Ensure the number is in international format
- **"WhatsApp not available"**: Check if the number has WhatsApp installed
- **"Template not approved"**: Wait for Twilio to approve your message template

### Debug Logs:
The app includes comprehensive logging. Check the console for:
- `Attempting to send OTP via WhatsApp to:`
- `WhatsApp verification response:`
- `WhatsApp OTP verified successfully`

## Security Notes

- OTP codes expire after 10 minutes
- Rate limiting is handled by Supabase
- WhatsApp messages are end-to-end encrypted
- Phone numbers are validated before sending OTP

## Cost Considerations

- Twilio charges per WhatsApp message
- WhatsApp Business API has usage limits
- Consider implementing rate limiting for production use 