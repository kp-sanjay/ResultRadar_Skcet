# Environment Variables Setup

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=5000

# Twilio WhatsApp Configuration (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Email Configuration (Optional - Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com

# Database
DB_PATH=./results.db
```

## Getting Twilio Credentials

1. Sign up at https://www.twilio.com/
2. Go to Console Dashboard
3. Copy Account SID and Auth Token
4. For WhatsApp Sandbox (free testing):
   - Go to Messaging → Try it out → Send a WhatsApp message
   - Follow instructions to join sandbox
   - Use the sandbox number format: `whatsapp:+14155238886`

## Getting Gmail App Password

1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate a new app password
5. Use this password in `EMAIL_PASS`

## Note

The application will work without notification credentials, but users won't receive notifications when results are released. They can still check the status page manually.

