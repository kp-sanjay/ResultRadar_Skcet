# ResultRadar_Skcet

# Auto Result Notifier

A full-stack web application that automatically monitors college exam results and notifies users via WhatsApp or Email when their results are released.

## Features

- 📝 **User Registration**: Register with Roll Number, DOB, and contact information
- 🤖 **Automatic Monitoring**: Background scheduler checks results every 5 minutes
- 🔔 **Instant Notifications**: WhatsApp (Twilio) or Email notifications when results are available
- 📊 **Status Tracking**: Real-time status updates (Checking / Not Released / Released)
- 📥 **PDF Download**: Download results as PDF
- 💾 **SQLite Database**: Lightweight database for storing user data

## Tech Stack

### Backend
- Node.js + Express
- SQLite3
- node-cron (scheduled tasks)
- Puppeteer/Cheerio (web scraping)
- Twilio (WhatsApp API)
- Nodemailer (Email fallback)

### Frontend
- React + Vite
- Tailwind CSS
- Axios (API calls)
- html2pdf.js (PDF generation)

## Project Structure

```
.
├── backend/
│   ├── database.js          # SQLite database operations
│   ├── scraper.js           # Result scraping logic
│   ├── notifier.js          # WhatsApp/Email notifications
│   ├── scheduler.js         # Cron job scheduler
│   ├── server.js            # Express server
│   ├── package.json
│   └── .env                 # Environment variables (create this)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── RegistrationForm.jsx
│   │   │   └── StatusPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Twilio account (for WhatsApp) - Optional
- Email account with app password (for Email notifications) - Optional

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   
   Or create `.env` manually with:
   ```env
   PORT=5000
   
   # Twilio WhatsApp Configuration (Optional)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   
   # Email Configuration (Optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   EMAIL_FROM=your_email@gmail.com
   
   # Database
   DB_PATH=./results.db
   ```

4. **Configure Twilio (Optional):**
   - Sign up at https://www.twilio.com/
   - Get your Account SID and Auth Token
   - Use Twilio Sandbox for testing (free)
   - Add the WhatsApp number to your `.env`

5. **Configure Email (Optional):**
   - For Gmail: Generate an App Password
     - Go to Google Account → Security → 2-Step Verification → App Passwords
     - Generate password and use it in `EMAIL_PASS`
   - For other providers, update `EMAIL_HOST` and `EMAIL_PORT`

6. **Start the backend server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:3000`

4. **Build for production:**
   ```bash
   npm run build
   ```

## Usage

1. **Open the application:**
   - Navigate to `http://localhost:3000` in your browser

2. **Register for notifications:**
   - Fill in the registration form:
     - Full Name
     - Roll Number
     - Date of Birth (DD-MM-YYYY or DD/MM/YYYY)
     - WhatsApp Number (with country code) or Email
   - Click "Register for Notifications"

3. **Monitor status:**
   - View your registration status
   - Status will show: "Checking", "Not Released", or "Released"
   - Use "Check Now" button for manual checks

4. **Receive notifications:**
   - When result is available, you'll receive:
     - WhatsApp message (if configured)
     - Email (if WhatsApp not available or configured)
   - Status will automatically update to "Released"

5. **Download result:**
   - Once released, click "Download Result PDF" to save as PDF

## API Endpoints

### `POST /api/users`
Register a new user
```json
{
  "name": "John Doe",
  "rollno": "12345",
  "dob": "01-01-2000",
  "whatsapp": "+1234567890",
  "email": "john@example.com"
}
```

### `GET /api/users/:id/status`
Get user status
```json
{
  "id": 1,
  "name": "John Doe",
  "rollno": "12345",
  "status": "IN_PROGRESS",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### `GET /api/users/:id/result`
Get result HTML (only if released)

### `POST /api/users/:id/check`
Manually trigger result check

### `GET /api/health`
Health check endpoint

## Database Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  rollno TEXT NOT NULL UNIQUE,
  dob TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'IN_PROGRESS',
  result_html TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  result_released_at DATETIME
);
```

## How It Works

1. **User Registration**: User submits their details via the frontend form
2. **Data Storage**: Details are stored in SQLite database with status "IN_PROGRESS"
3. **Background Scheduler**: Cron job runs every 5 minutes
4. **Result Checking**: For each active user, the system:
   - Submits roll number and DOB to the results page
   - Scrapes the response HTML
   - Checks for result indicators (CGPA, marks, etc.)
5. **Notification**: If result is found:
   - Updates status to "RESULT_RELEASED"
   - Saves result HTML
   - Sends WhatsApp/Email notification
   - Stops further checking for that user

## Troubleshooting

### Backend Issues

- **Database errors**: Ensure SQLite3 is installed and permissions are correct
- **Scraping fails**: The results page structure may have changed. Check `scraper.js` and update selectors
- **Notifications not working**: 
  - Verify Twilio credentials in `.env`
  - Check email credentials and app password
  - Review console logs for error messages

### Frontend Issues

- **API connection errors**: Ensure backend is running on port 5000
- **Build errors**: Clear `node_modules` and reinstall dependencies

### Puppeteer Issues

- **Installation problems**: Puppeteer may require additional system dependencies
- **Headless mode**: If Puppeteer fails, the system falls back to Axios + Cheerio

## Notes

- The scraper attempts to work with the actual results page structure. You may need to adjust selectors in `scraper.js` based on the actual HTML structure of the results page.
- Twilio Sandbox allows free testing but requires users to join the sandbox first.
- For production, consider:
  - Using a proper database (PostgreSQL, MySQL)
  - Adding authentication
  - Rate limiting
  - Error monitoring
  - HTTPS

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!

