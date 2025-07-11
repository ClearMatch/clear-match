const puppeteer = require('puppeteer');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'costajohnt@gmail.com',
  password: 'Spaceman7!'
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function logTest(testName, passed, details = '') {
  if (passed) {
    testResults.passed++;
    log(`TEST PASSED: ${testName}`, 'success');
  } else {
    testResults.failed++;
    testResults.errors.push(`${testName}: ${details}`);
    log(`TEST FAILED: ${testName} - ${details}`, 'error');
  }
}

async function waitForElement(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

async function signIn(page) {
  log('Starting sign-in process...');
  
  try {
    // Navigate to auth page
    await page.goto(`${BASE_URL}/auth`);
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Fill in credentials
    await page.type('input[name="email"]', TEST_USER.email);
    await page.type('input[name="password"]', TEST_USER.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      logTest('User Sign-in', true);
      return true;
    } else {
      logTest('User Sign-in', false, `Redirected to ${currentUrl} instead of dashboard`);
      return false;
    }
  } catch (error) {
    logTest('User Sign-in', false, error.message);
    return false;
  }
}

async function testNavigation(page) {
  log('Testing navigation links...');
  
  const navItems = [
    { name: 'Dashboard', selector: 'a[href="/dashboard"]', expectedPath: '/dashboard' },
    { name: 'Contacts', selector: 'a[href="/contacts"]', expectedPath: '/contacts' },
    { name: 'Tasks', selector: 'a[href="/task"]', expectedPath: '/task' },
    { name: 'Events', selector: 'a[href="/event"]', expectedPath: '/event' }
  ];
  
  for (const item of navItems) {
    try {
      // Check if nav item exists
      const navExists = await waitForElement(page, item.selector);
      if (!navExists) {
        logTest(`Navigation - ${item.name} Link Exists`, false, 'Link not found');
        continue;
      }
      
      // Click navigation item
      await page.click(item.selector);
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
      
      const currentPath = new URL(page.url()).pathname;
      const success = currentPath === item.expectedPath;
      logTest(`Navigation - ${item.name}`, success, 
        success ? '' : `Expected ${item.expectedPath}, got ${currentPath}`);
      
      await page.waitForTimeout(1000); // Brief pause between tests
    } catch (error) {
      logTest(`Navigation - ${item.name}`, false, error.message);
    }
  }
}

async function testContactsCRUD(page) {
  log('Testing Contacts CRUD operations...');
  
  try {
    // Navigate to contacts page
    await page.goto(`${BASE_URL}/contacts`);
    await page.waitForSelector('main', { timeout: 10000 });
    
    logTest('Contacts Page Load', true);
    
    // Test Create Contact
    const createButton = await waitForElement(page, 'a[href="/contacts/new"]');
    if (createButton) {
      await page.click('a[href="/contacts/new"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      const isCreatePage = page.url().includes('/contacts/new');
      logTest('Contacts - Create Page Navigation', isCreatePage);
      
      if (isCreatePage) {
        // Fill out create form
        const formExists = await waitForElement(page, 'form');
        if (formExists) {
          // Fill basic contact info
          await page.type('input[name="firstName"]', 'Test');
          await page.type('input[name="lastName"]', 'Contact');
          await page.type('input[name="email"]', 'test@example.com');
          
          // Submit form
          const submitButton = await page.$('button[type="submit"]');
          if (submitButton) {
            await submitButton.click();
            await page.waitForTimeout(2000); // Wait for submission
            
            // Check if we were redirected or see success
            const currentUrl = page.url();
            const success = currentUrl.includes('/contacts') && !currentUrl.includes('/new');
            logTest('Contacts - Create Form Submission', success);
          }
        }
      }
    } else {
      logTest('Contacts - Create Button', false, 'Create button not found');
    }
    
    // Go back to contacts list to test other operations
    await page.goto(`${BASE_URL}/contacts`);
    await page.waitForSelector('main', { timeout: 5000 });
    
    // Test if contacts are displayed
    const contactsExist = await page.$('table') || await page.$('[data-testid="contact-item"]') || await page.$('.contact-list');
    logTest('Contacts - List Display', !!contactsExist);
    
    // Look for edit/view links
    const editLink = await page.$('a[href*="/contacts/edit/"]') || await page.$('a[href*="/contacts/show/"]');
    if (editLink) {
      const href = await page.evaluate(el => el.href, editLink);
      await page.goto(href);
      await page.waitForTimeout(2000);
      
      const isDetailPage = page.url().includes('/contacts/') && (page.url().includes('/edit/') || page.url().includes('/show/'));
      logTest('Contacts - Detail Page Navigation', isDetailPage);
    }
    
  } catch (error) {
    logTest('Contacts CRUD', false, error.message);
  }
}

async function testTasksCRUD(page) {
  log('Testing Tasks CRUD operations...');
  
  try {
    await page.goto(`${BASE_URL}/task`);
    await page.waitForSelector('main', { timeout: 10000 });
    
    logTest('Tasks Page Load', true);
    
    // Test create task navigation
    const createButton = await waitForElement(page, 'a[href="/task/new"]');
    if (createButton) {
      await page.click('a[href="/task/new"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      const isCreatePage = page.url().includes('/task/new');
      logTest('Tasks - Create Page Navigation', isCreatePage);
    }
    
    // Go back and test list
    await page.goto(`${BASE_URL}/task`);
    await page.waitForSelector('main', { timeout: 5000 });
    
    const tasksExist = await page.$('table') || await page.$('[data-testid="task-item"]') || await page.$('.task-list');
    logTest('Tasks - List Display', !!tasksExist);
    
  } catch (error) {
    logTest('Tasks CRUD', false, error.message);
  }
}

async function testEventsCRUD(page) {
  log('Testing Events CRUD operations...');
  
  try {
    await page.goto(`${BASE_URL}/event`);
    await page.waitForSelector('main', { timeout: 10000 });
    
    logTest('Events Page Load', true);
    
    // Test create event navigation
    const createButton = await waitForElement(page, 'a[href="/event/new"]');
    if (createButton) {
      await page.click('a[href="/event/new"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      const isCreatePage = page.url().includes('/event/new');
      logTest('Events - Create Page Navigation', isCreatePage);
    }
    
    // Go back and test list
    await page.goto(`${BASE_URL}/event`);
    await page.waitForSelector('main', { timeout: 5000 });
    
    const eventsExist = await page.$('table') || await page.$('[data-testid="event-item"]') || await page.$('.event-list');
    logTest('Events - List Display', !!eventsExist);
    
  } catch (error) {
    logTest('Events CRUD', false, error.message);
  }
}

async function testProfile(page) {
  log('Testing Profile functionality...');
  
  try {
    // Test profile edit page
    await page.goto(`${BASE_URL}/profile/edit`);
    await page.waitForSelector('main', { timeout: 10000 });
    
    const profileForm = await waitForElement(page, 'form');
    logTest('Profile Edit Page', !!profileForm);
    
    // Test password change page
    await page.goto(`${BASE_URL}/profile/change-password`);
    await page.waitForSelector('main', { timeout: 10000 });
    
    const passwordForm = await waitForElement(page, 'form');
    logTest('Profile Password Change Page', !!passwordForm);
    
  } catch (error) {
    logTest('Profile Pages', false, error.message);
  }
}

async function testDashboard(page) {
  log('Testing Dashboard functionality...');
  
  try {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForSelector('main', { timeout: 10000 });
    
    // Check for dashboard elements
    const hasStats = await page.$('[data-testid="stats"]') || await page.$('.stats') || await page.$('.dashboard-stats');
    const hasCharts = await page.$('canvas') || await page.$('.chart') || await page.$('[data-testid="chart"]');
    const hasContent = await page.$('main') && await page.content();
    
    logTest('Dashboard Page Load', !!hasContent);
    logTest('Dashboard Stats/Content', hasStats || hasCharts || hasContent.includes('dashboard'));
    
  } catch (error) {
    logTest('Dashboard', false, error.message);
  }
}

async function testResponsiveDesign(page) {
  log('Testing responsive design...');
  
  try {
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForSelector('main', { timeout: 5000 });
    
    logTest('Mobile Viewport Load', true);
    
    // Test tablet viewport
    await page.setViewport({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForSelector('main', { timeout: 5000 });
    
    logTest('Tablet Viewport Load', true);
    
    // Reset to desktop
    await page.setViewport({ width: 1920, height: 1080 });
    
  } catch (error) {
    logTest('Responsive Design', false, error.message);
  }
}

async function runRegressionTests() {
  log('🚀 Starting Clear Match Regression Tests');
  log(`Testing against: ${BASE_URL}`);
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Sign in first
    const signedIn = await signIn(page);
    
    if (signedIn) {
      // Run all tests
      await testDashboard(page);
      await testNavigation(page);
      await testContactsCRUD(page);
      await testTasksCRUD(page);
      await testEventsCRUD(page);
      await testProfile(page);
      await testResponsiveDesign(page);
    } else {
      log('❌ Cannot proceed with tests - sign-in failed', 'error');
    }
    
  } catch (error) {
    log(`Unexpected error during testing: ${error.message}`, 'error');
  } finally {
    await browser.close();
    
    // Print final results
    console.log('\n' + '='.repeat(60));
    console.log('📊 REGRESSION TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Tests Passed: ${testResults.passed}`);
    console.log(`❌ Tests Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
    
    if (testResults.errors.length > 0) {
      console.log('\n🚨 Failed Tests:');
      testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\n🏁 Regression testing completed');
  }
}

// Run the tests
runRegressionTests().catch(console.error);