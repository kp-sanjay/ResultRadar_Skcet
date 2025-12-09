import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

const RESULTS_URL = 'https://skcet.ac.in/exams/results/';

/**
 * Check if result is available for given roll number and DOB
 * @param {string} rollno - Roll number
 * @param {string} dob - Date of birth (format: DD-MM-YYYY or DD/MM/YYYY)
 * @returns {Promise<{available: boolean, html: string|null, error: string|null}>}
 */
export async function checkResult(rollno, dob) {
  try {
    // Try with Puppeteer first (more reliable for dynamic content)
    try {
      return await checkResultWithPuppeteer(rollno, dob);
    } catch (puppeteerError) {
      console.log('Puppeteer failed, trying axios:', puppeteerError.message);
      // Fallback to axios + cheerio
      return await checkResultWithAxios(rollno, dob);
    }
  } catch (error) {
    console.error('Error checking result:', error);
    return {
      available: false,
      html: null,
      error: error.message
    };
  }
}

/**
 * Check result using Puppeteer (handles JavaScript-rendered content)
 */
async function checkResultWithPuppeteer(rollno, dob) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto(RESULTS_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for form elements to be available
    await page.waitForSelector('input[name="rollno"], input[type="text"]', { timeout: 10000 });
    
    // Fill in the form
    const rollnoInput = await page.$('input[name="rollno"], input[type="text"]');
    if (rollnoInput) {
      await rollnoInput.type(rollno);
    }
    
    // Find DOB input (could be different field names)
    const dobInput = await page.$('input[name="dob"], input[name="date"], input[type="date"]');
    if (dobInput) {
      // Format DOB if needed
      const formattedDob = formatDobForInput(dob);
      await dobInput.type(formattedDob);
    }
    
    // Submit the form
    const submitButton = await page.$('button[type="submit"], input[type="submit"], button');
    if (submitButton) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        submitButton.click()
      ]);
    } else {
      // Try pressing Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
    }
    
    // Get the result page HTML
    const html = await page.content();
    const $ = cheerio.load(html);
    
    // Check if result is available
    const isAvailable = isResultAvailable($);
    
    await browser.close();
    
    return {
      available: isAvailable,
      html: isAvailable ? html : null,
      error: null
    };
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

/**
 * Check result using Axios + Cheerio (faster but may not work with JS-heavy sites)
 */
async function checkResultWithAxios(rollno, dob) {
  // First, get the form page
  const formResponse = await axios.get(RESULTS_URL, {
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  const $ = cheerio.load(formResponse.data);
  
  // Find form action and method
  const form = $('form').first();
  const formAction = form.attr('action') || RESULTS_URL;
  const formMethod = form.attr('method') || 'POST';
  
  // Build form data
  const formData = new URLSearchParams();
  
  // Try to find input field names
  $('input[type="text"], input[name*="roll"], input[name*="rollno"]').each((i, el) => {
    const name = $(el).attr('name') || 'rollno';
    formData.append(name, rollno);
  });
  
  $('input[type="date"], input[name*="dob"], input[name*="date"]').each((i, el) => {
    const name = $(el).attr('name') || 'dob';
    formData.append(name, formatDobForInput(dob));
  });
  
  // Submit the form
  const submitResponse = await axios({
    method: formMethod.toLowerCase(),
    url: formAction.startsWith('http') ? formAction : RESULTS_URL + formAction,
    data: formData.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    timeout: 30000
  });
  
  const result$ = cheerio.load(submitResponse.data);
  const isAvailable = isResultAvailable(result$);
  
  return {
    available: isAvailable,
    html: isAvailable ? submitResponse.data : null,
    error: null
  };
}

/**
 * Format DOB for input fields
 */
function formatDobForInput(dob) {
  // Convert DD-MM-YYYY or DD/MM/YYYY to YYYY-MM-DD for date inputs
  if (dob.includes('-')) {
    const parts = dob.split('-');
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  } else if (dob.includes('/')) {
    const parts = dob.split('/');
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return dob;
}

/**
 * Check if result is available in the HTML
 * Looks for indicators like CGPA, Result, marks table, etc.
 */
function isResultAvailable($) {
  const html = $.html().toLowerCase();
  
  // Check for result indicators
  const resultIndicators = [
    'cgpa',
    'gpa',
    'result',
    'marks',
    'grade',
    'passed',
    'failed',
    'total',
    'percentage',
    'subject',
    'semester'
  ];
  
  // Check if any result indicator is present
  const hasIndicator = resultIndicators.some(indicator => 
    html.includes(indicator)
  );
  
  // Check for error messages that indicate result not found
  const errorIndicators = [
    'no result found',
    'result not found',
    'invalid roll number',
    'invalid date of birth',
    'please check your details'
  ];
  
  const hasError = errorIndicators.some(error => 
    html.includes(error)
  );
  
  // Check for tables (results are often in tables)
  const hasTable = $('table').length > 0;
  
  // Result is available if:
  // 1. Has result indicators AND
  // 2. No error messages AND
  // 3. (Has table OR has substantial content)
  if (hasIndicator && !hasError) {
    if (hasTable || html.length > 5000) {
      return true;
    }
  }
  
  return false;
}

