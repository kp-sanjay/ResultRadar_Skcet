import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { userDb } from './database.js';
import { checkResult } from './scraper.js';
import { startScheduler } from './scheduler.js';
import { isNotificationConfigured } from './notifier.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    notification: isNotificationConfigured()
  });
});

// Create new user/registration
app.post('/api/users', async (req, res) => {
  try {
    const { name, rollno, dob, whatsapp, email } = req.body;
    
    // Validation
    if (!name || !rollno || !dob || (!whatsapp && !email)) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, rollno, dob, and either whatsapp or email' 
      });
    }
    
    // Check if roll number already exists
    const existing = await userDb.findByRollno(rollno);
    if (existing) {
      return res.status(409).json({ 
        error: 'Roll number already registered',
        user: existing
      });
    }
    
    // Create user
    const user = await userDb.create({ name, rollno, dob, whatsapp, email });
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        rollno: user.rollno,
        status: user.status,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

// Get user status
app.get('/api/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userDb.findById(parseInt(id));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      name: user.name,
      rollno: user.rollno,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
      result_released_at: user.result_released_at
    });
  } catch (error) {
    console.error('Error getting user status:', error);
    res.status(500).json({ error: 'Failed to get user status', details: error.message });
  }
});

// Get user result
app.get('/api/users/:id/result', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userDb.findById(parseInt(id));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.status !== 'RESULT_RELEASED' || !user.result_html) {
      return res.status(404).json({ 
        error: 'Result not yet available',
        status: user.status
      });
    }
    
    res.json({
      id: user.id,
      name: user.name,
      rollno: user.rollno,
      result_html: user.result_html,
      result_released_at: user.result_released_at
    });
  } catch (error) {
    console.error('Error getting user result:', error);
    res.status(500).json({ error: 'Failed to get user result', details: error.message });
  }
});

// Get all users (for admin/debugging)
app.get('/api/users', async (req, res) => {
  try {
    const users = await userDb.getAll();
    res.json(users.map(user => ({
      id: user.id,
      name: user.name,
      rollno: user.rollno,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
      result_released_at: user.result_released_at
    })));
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users', details: error.message });
  }
});

// Manual result check (for testing)
app.post('/api/users/:id/check', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userDb.findById(parseInt(id));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.status === 'RESULT_RELEASED') {
      return res.json({ 
        message: 'Result already released',
        status: user.status
      });
    }
    
    const result = await checkResult(user.rollno, user.dob);
    
    if (result.available && result.html) {
      await userDb.updateStatus(user.id, 'RESULT_RELEASED', result.html);
      res.json({ 
        message: 'Result found!',
        status: 'RESULT_RELEASED'
      });
    } else {
      res.json({ 
        message: 'Result not yet available',
        status: 'IN_PROGRESS',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error checking result:', error);
    res.status(500).json({ error: 'Failed to check result', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_PATH || './results.db'}`);
  
  // Start the scheduler
  startScheduler();
});

