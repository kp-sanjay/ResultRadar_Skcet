# Quick Setup Guide

## Step 1: Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
DB_PATH=./results.db

# Optional: Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Optional: Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
```

Start backend:
```bash
npm start
```

## Step 2: Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Step 3: Access Application

Open browser: `http://localhost:3000`

## Notes

- Backend runs on port 5000
- Frontend runs on port 3000
- Database file `results.db` will be created automatically
- Notifications are optional - app works without them

