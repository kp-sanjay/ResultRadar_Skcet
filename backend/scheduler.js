import cron from 'node-cron';
import { checkResult } from './scraper.js';
import { sendNotification } from './notifier.js';
import { userDb } from './database.js';

let isRunning = false;

/**
 * Check results for all active users
 */
async function checkAllResults() {
  if (isRunning) {
    console.log('Previous check still running, skipping...');
    return;
  }
  
  isRunning = true;
  console.log(`[${new Date().toISOString()}] Starting scheduled result check...`);
  
  try {
    const activeUsers = await userDb.getAllActive();
    console.log(`Found ${activeUsers.length} active users to check`);
    
    for (const user of activeUsers) {
      try {
        console.log(`Checking result for ${user.name} (${user.rollno})...`);
        
        const result = await checkResult(user.rollno, user.dob);
        
        if (result.available && result.html) {
          console.log(`✅ Result found for ${user.name}!`);
          
          // Update user status
          await userDb.updateStatus(user.id, 'RESULT_RELEASED', result.html);
          
          // Send notification
          const notification = await sendNotification(user, result.html);
          if (notification.success) {
            console.log(`Notification sent via ${notification.method} to ${user.name}`);
          } else {
            console.warn(`Notification failed for ${user.name}: ${notification.error}`);
          }
        } else {
          console.log(`⏳ Result not yet available for ${user.name}`);
        }
        
        // Add small delay between checks to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error checking result for ${user.name}:`, error.message);
      }
    }
    
    console.log(`[${new Date().toISOString()}] Result check completed`);
  } catch (error) {
    console.error('Error in scheduled check:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the cron scheduler
 * Runs every 5 minutes
 */
export function startScheduler() {
  // Run every 5 minutes: */5 * * * *
  cron.schedule('*/5 * * * *', checkAllResults);
  console.log('Scheduler started: Checking results every 5 minutes');
  
  // Also run immediately on startup
  checkAllResults();
}

/**
 * Manually trigger a check (for testing)
 */
export async function manualCheck() {
  await checkAllResults();
}

