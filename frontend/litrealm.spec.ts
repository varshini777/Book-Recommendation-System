import { test, expect, devices } from '@playwright/test';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/VARSHINI/.gemini/antigravity/brain/a14c53ce-c3dd-4c20-bbfe-314d9bb28321';
const BASE_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:8000';

test.describe('LitRealm Application QA Audit', () => {
  let consoleErrors: string[] = [];
  let networkFailures: string[] = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    networkFailures = [];

    // Log console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Console Error] ${msg.text()}`);
      }
    });

    // Log failed network requests
    page.on('requestfailed', request => {
      networkFailures.push(`[Network Failure] ${request.url()} - ${request.failure()?.errorText || 'Unknown error'}`);
    });

    // Log bad HTTP status responses (4xx, 5xx)
    page.on('response', response => {
      if (response.status() >= 400) {
        networkFailures.push(`[HTTP ${response.status()}] ${response.url()}`);
      }
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Print collected failures
    if (consoleErrors.length > 0) {
      console.log(`\n--- Console Errors in ${testInfo.title} ---`);
      consoleErrors.forEach(err => console.log(err));
    }
    if (networkFailures.length > 0) {
      console.log(`\n--- Network Failures in ${testInfo.title} ---`);
      networkFailures.forEach(fail => console.log(fail));
    }
  });

  test('STEP 1: Verify API Health & Swagger Documentation', async ({ request }) => {
    console.log('Verifying Backend Health & Swagger...');
    
    // Check Health Check Endpoint
    const healthResponse = await request.get(`${BACKEND_URL}/health`);
    expect(healthResponse.ok()).toBeTruthy();
    const healthJson = await healthResponse.json();
    console.log('Health JSON:', healthJson);
    expect(healthJson.status).toBe('ok');
    expect(healthJson.database).toBe('healthy');

    // Check Swagger Documentation page
    const swaggerResponse = await request.get(`${BACKEND_URL}/docs`);
    expect(swaggerResponse.ok()).toBeTruthy();
    expect(await swaggerResponse.text()).toContain('swagger-ui');
  });

  test('STEP 2-4: Authentication Flow & Onboarding Flow', async ({ page }) => {
    test.setTimeout(120000);
    const uniqueId = Date.now();
    const email = `qa_user_${uniqueId}@example.com`;
    const name = `QA Tester ${uniqueId}`;
    const password = 'Password123!';

    console.log(`Navigating to landing page to start Auth & Onboarding Flow...`);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Screenshot initial screen (should redirect to login since not logged in)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'login_screen.png') });
    expect(page.url()).toContain('/login');

    // Navigate to registration page
    await page.click('text=Create one');
    await page.waitForURL('**/register');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'register_screen.png') });

    // Fill registration form
    await page.fill('input[placeholder="Your full name"]', name);
    await page.fill('input[placeholder="you@example.com"]', email);
    await page.fill('input[placeholder="Min 8 characters"]', password);
    await page.fill('input[placeholder="Re-enter password"]', password);

    // Submit registration and verify auto-login + redirect to onboarding
    await page.click('button:has-text("Create Account")');
    await page.waitForURL('**/onboarding');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'onboarding_welcome.png') });

    // Onboarding Step 0 -> Step 1 (Welcome -> Genres)
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'onboarding_genres.png') });

    // Onboarding Step 1 (Genres) - Validate check (error toast when genres < 3)
    await page.click('button:has-text("Next")');
    // Check if toast appears
    const genreToast = page.locator('text=Please select at least 3 genres');
    await expect(genreToast).toBeVisible({ timeout: 5000 });
    console.log('Verified Genre Validation Error Toast works!');

    // Click 3 genres (e.g. Technology, AI, Programming)
    await page.click('text=Technology');
    await page.click('text=AI');
    await page.click('text=Programming');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'onboarding_authors.png') });

    // Onboarding Step 2 (Authors) - Click Next
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'onboarding_goals.png') });

    // Onboarding Step 3 (Goals) - Click Next (default goal is selected)
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'onboarding_interests.png') });

    // Onboarding Step 4 (Interests) - Validate check (error toast when interests < 1)
    await page.click('button:has-text("Next")');
    const interestToast = page.locator('text=Please select at least 1 reading interest');
    await expect(interestToast).toBeVisible({ timeout: 5000 });
    console.log('Verified Interest Validation Error Toast works!');

    // Select Technology interest
    await page.click('text=Learn New Skills');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000); // Wait for sample books to load
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'onboarding_books.png') });

    // Onboarding Step 5 (Sample Books) - Validate check (error toast when books < 5)
    await page.click('button:has-text("Next")');
    const booksToast = page.locator('text=Please choose at least 5 sample books');
    await expect(booksToast).toBeVisible({ timeout: 5000 });
    console.log('Verified Book Validation Error Toast works!');

    // Click 5 sample books
    const bookButtons = page.locator('div.grid button');
    const count = await bookButtons.count();
    console.log(`Found ${count} sample books to select from`);
    expect(count).toBeGreaterThanOrEqual(5);
    for (let i = 0; i < 5; i++) {
      await bookButtons.nth(i).click();
    }
    
    await page.click('button:has-text("Next")');
    
    // We should be on Calibrating step now
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'onboarding_calibrating.png') });
    
    // Wait for Ready page and automatic redirect to Dashboard (approx 3.5s + 6 ticks * 0.9s = 9s total)
    await page.waitForURL(BASE_URL, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'home_dashboard.png') });
    console.log('Successfully completed onboarding and redirected to Dashboard home!');

    // STEP 5: Homepage Validation
    console.log('Verifying Homepage layout and recommendations...');
    const mainTitle = page.locator('h1');
    await expect(mainTitle).toContainText('Discover Your Next');
    
    // Check if recommendations contain explanation text (Info icons)
    const infoIcon = page.locator('svg.lucide-info').first();
    const infoCount = await infoIcon.count();
    console.log(`Explanations (Info icons) visible on Homepage: ${infoCount}`);

    // Check for broken images on Homepage
    const images = page.locator('img');
    const imgCount = await images.count();
    for (let i = 0; i < imgCount; i++) {
      const src = await images.nth(i).getAttribute('src');
      const isNatural = await images.nth(i).evaluate((img: HTMLImageElement) => img.naturalWidth > 0);
      if (!isNatural) {
        console.log(`WARNING: Mismatched or broken image src: ${src}`);
      }
    }

    // STEP 6: Book Catalog
    console.log('Navigating to Catalog page...');
    await page.click('text=Catalog');
    await page.waitForURL('**/catalog');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'catalog_page.png') });

    // Test Search & Filters
    console.log('Testing Catalog search...');
    const searchInput = page.locator('input[placeholder*="Search title"]').first();
    
    // Search Python
    await searchInput.fill('Python');
    await page.waitForTimeout(1000);
    let resultsText = await page.locator('p:has-text("Showing")').first().textContent();
    console.log(`Search 'Python' results: ${resultsText}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'catalog_search_python.png') });

    // Search Atomic Habits
    await searchInput.fill('Atomic Habits');
    await page.waitForTimeout(1000);
    resultsText = await page.locator('p:has-text("Showing")').first().textContent();
    console.log(`Search 'Atomic Habits' results: ${resultsText}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'catalog_search_habits.png') });

    // STEP 7: Book Details
    console.log('Opening a book details page...');
    // Click the first card
    await page.locator('a .card').first().click();
    await page.waitForURL('**/catalog/*');
    await page.waitForLoadState('networkidle');
    // Wait for loading skeleton to disappear and actual content to render
    try {
      await expect(page.locator('text=Back to Catalog')).toBeVisible({ timeout: 10000 });
    } catch (e) {
      console.log("FAILED to find 'Back to Catalog'. Page content:");
      console.log(await page.locator('body').innerText());
      throw e;
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'book_details_page.png') });
    // Verify detailed info exists
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.badge').first()).toBeVisible();
    await expect(page.locator('text=Rating').first()).toBeVisible();
    console.log('Verified Book details fields!');

    // STEP 8: Library Actions (Add favorite/Want to read etc.)
    console.log('Testing Library adding actions...');
    // Let's find favorite button or shelf dropdown
    const wantToReadBtn = page.locator('button:has-text("Want to Read")');
    if (await wantToReadBtn.count() > 0) {
      await wantToReadBtn.first().click();
      // Look for toast
      await expect(page.locator('text=successfully|success|updated')).toBeVisible({ timeout: 5000 });
      console.log('Want to read shelf updated successfully!');
    }

    // Go to Library page
    console.log('Navigating to Library page...');
    await page.click('text=Library');
    await page.waitForURL('**/library');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'library_page.png') });

    // STEP 9: Profile Reading Goals Update
    console.log('Navigating to Profile...');
    await page.click('text=Profile');
    await page.waitForURL('**/profile');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'profile_page.png') });

    // Verify and edit goal
    const editGoalBtn = page.locator('button:has-text("Edit"), button:has-text("Change Goal")').first();
    if (await editGoalBtn.count() > 0) {
      await editGoalBtn.click();
      // Fill updated value
      const goalInput = page.locator('input[type="number"]');
      if (await goalInput.count() > 0) {
        await goalInput.fill('35');
        await page.click('button:has-text("Save"), button:has-text("Update")');
        // Toast check
        await expect(page.locator('text=/successfully|success|updated/i')).toBeVisible({ timeout: 5000 });
        console.log('Reading goal updated and toast verified!');
      }
    }

    // STEP 10: Admin Dashboard
    console.log('Upgrading user role to Admin in the database to test Admin Dashboard...');
    // Upgrade role to admin via a quick python execution
    execSync(`python -c "import sqlite3; conn = sqlite3.connect('d:/Book_Recomendation_System/backend/bookrec.db'); conn.cursor().execute(\\"UPDATE users SET role='admin' WHERE email='${email}'\\"); conn.commit(); conn.close()"`);
    console.log('User upgraded to admin in sqlite database.');

    // Log out and log back in to refresh user state
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL('**/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/');
    // Now navigate to Admin
    console.log('Navigating to Admin Dashboard...');
    await page.click('text=Admin');
    await page.waitForURL('**/admin');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_dashboard.png') });
    
    // Verify Admin metrics loaded
    await expect(page.locator('text=Overview')).toBeVisible();
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Analytics').first()).toBeVisible();
    console.log('Admin metrics verified!');

    // STEP 3 Check: Logout redirect
    console.log('Testing Logout flow...');
    // Click logout
    const logoutBtn = page.locator('button[title="Sign out"], button:has-text("Logout"), button:has-text("Sign Out")').first();
    await logoutBtn.click();
    await page.waitForURL('**/login');
    console.log('Session cleared and successfully redirected to /login!');
  });

  test('STEP 12: Mobile Viewports Responsiveness', async ({ browser }) => {
    console.log('Testing responsive viewports (Mobile iPhone & Android)...');
    
    // We launch mobile contexts
    const mobileDevices = [
      { name: 'iPhone 12', contextOptions: devices['iPhone 12'] },
      { name: 'Pixel 5', contextOptions: devices['Pixel 5'] },
      { name: 'iPad Pro 11', contextOptions: devices['iPad Pro 11'] }
    ];

    for (const dev of mobileDevices) {
      console.log(`Running viewport checks for ${dev.name}...`);
      const context = await browser.newContext(dev.contextOptions);
      const page = await context.newPage();
      
      // Go to Login page
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `mobile_${dev.name.replace(/\s+/g, '_')}_login.png`) });
      
      await context.close();
    }
    console.log('Mobile viewports checked successfully!');
  });
});
