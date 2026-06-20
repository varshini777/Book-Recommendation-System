/**
 * LitRealm Security Audit Test
 * Tests RBAC enforcement: Admin-only routes (admin, analytics, demo)
 * are inaccessible to normal users, and fully accessible to admins.
 */
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const API = 'http://localhost:8000';
const ARTIFACT_DIR = 'test-results/security-audit';

const normalEmail = `normal_${Date.now()}@test.com`;
const normalPass = 'SecurePass123!';
const adminEmail = 'admin@litrealm.com';
const adminPass = 'admin123';

test.beforeAll(() => {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
});

test.use({ headless: false });

test.describe('LitRealm RBAC Security Audit', () => {

  test('SECURITY-1: Normal user cannot see or access admin-only routes', async ({ page }) => {
    // --- Register Normal User ---
    console.log('Registering normal user...');
    const regRes = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Normal User', email: normalEmail, password: normalPass }),
    });

    console.log('Bypassing onboarding for normal user in database...');
    execSync(`python -c "import sqlite3; conn = sqlite3.connect('d:/Book_Recomendation_System/backend/bookrec.db'); conn.cursor().execute(\\"UPDATE users SET onboarded=1 WHERE email='${normalEmail}'\\"); conn.commit(); conn.close()"`);

    // --- Login as normal user ---
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', normalEmail);
    await page.fill('input[type="password"]', normalPass);
    await page.click('button:has-text("Sign In")');
    await page.waitForFunction(() => window.location.pathname !== '/login', { timeout: 15000 });
    
    await page.waitForLoadState('networkidle');
    const urlAfterLogin = page.url();
    console.log('URL after normal login:', urlAfterLogin);


    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '1_normal_user_home.png') });

    // --- Check NavBar does NOT show Analytics, Demo, Admin ---
    console.log('Checking NavBar for admin links...');
    const navbarHTML = await page.locator('nav').first().innerHTML();

    const hasAnalyticsLink = navbarHTML.includes('href="/analytics"');
    const hasDemoLink = navbarHTML.includes('href="/demo"');
    const hasAdminLink = navbarHTML.includes('href="/admin"');

    console.log('NavBar Analytics visible:', hasAnalyticsLink);
    console.log('NavBar Demo visible:', hasDemoLink);
    console.log('NavBar Admin visible:', hasAdminLink);

    expect(hasAnalyticsLink, 'Analytics link should NOT be visible to normal user').toBe(false);
    expect(hasDemoLink, 'Demo link should NOT be visible to normal user').toBe(false);
    expect(hasAdminLink, 'Admin link should NOT be visible to normal user').toBe(false);
    console.log('✅ NavBar check PASSED — no admin links visible to normal user');

    // --- Test direct URL navigation: /admin ---
    console.log('Testing manual URL /admin for normal user...');
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(1500);
    const adminUrl = page.url();
    const adminContent = await page.content();
    const isBlockedAdmin = adminUrl.includes('access-denied') || adminContent.includes('Access Denied') || adminContent.includes('access denied');
    console.log('URL after /admin visit:', adminUrl);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '2_normal_user_admin_blocked.png') });
    expect(isBlockedAdmin, '/admin should be blocked for normal users').toBe(true);
    console.log('✅ /admin blocked PASSED');

    // --- Test direct URL navigation: /analytics ---
    console.log('Testing manual URL /analytics for normal user...');
    await page.goto(`${BASE_URL}/analytics`);
    await page.waitForTimeout(1500);
    const analyticsUrl = page.url();
    const analyticsContent = await page.content();
    const isBlockedAnalytics = analyticsUrl.includes('access-denied') || analyticsContent.includes('Access Denied') || analyticsContent.includes('access denied');
    console.log('URL after /analytics visit:', analyticsUrl);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '3_normal_user_analytics_blocked.png') });
    expect(isBlockedAnalytics, '/analytics should be blocked for normal users').toBe(true);
    console.log('✅ /analytics blocked PASSED');

    // --- Test direct URL navigation: /demo ---
    console.log('Testing manual URL /demo for normal user...');
    await page.goto(`${BASE_URL}/demo`);
    await page.waitForTimeout(1500);
    const demoUrl = page.url();
    const demoContent = await page.content();
    const isBlockedDemo = demoUrl.includes('access-denied') || demoContent.includes('Access Denied') || demoContent.includes('access denied');
    console.log('URL after /demo visit:', demoUrl);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '4_normal_user_demo_blocked.png') });
    expect(isBlockedDemo, '/demo should be blocked for normal users').toBe(true);
    console.log('✅ /demo blocked PASSED');

    // --- Backend: Test /recommendations/analytics returns 403 for normal user ---
    console.log('Testing backend /recommendations/analytics for normal user (403 expected)...');
    const loginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalEmail, password: normalPass }),
    });
    const loginData = await loginRes.json();
    const normalToken = loginData.access_token;

    const analyticsApiRes = await fetch(`${API}/recommendations/analytics`, {
      headers: { 'Authorization': `Bearer ${normalToken}` }
    });
    console.log(`/recommendations/analytics status for normal user: ${analyticsApiRes.status}`);
    expect(analyticsApiRes.status, 'Analytics API should return 403 for normal users').toBe(403);
    console.log('✅ Backend /recommendations/analytics → 403 PASSED');

    const metricsApiRes = await fetch(`${API}/recommendations/metrics`, {
      headers: { 'Authorization': `Bearer ${normalToken}` }
    });
    console.log(`/recommendations/metrics status for normal user: ${metricsApiRes.status}`);
    expect(metricsApiRes.status, 'Metrics API should return 403 for normal users').toBe(403);
    console.log('✅ Backend /recommendations/metrics → 403 PASSED');

    const adminApiRes = await fetch(`${API}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${normalToken}` }
    });
    console.log(`/admin/stats status for normal user: ${adminApiRes.status}`);
    expect(adminApiRes.status, 'Admin API should return 403 for normal users').toBe(403);
    console.log('✅ Backend /admin/stats → 403 PASSED');
  });

  test('SECURITY-2: Admin user can see and access all admin-only routes', async ({ page }) => {
    // --- Login as admin ---
    // --- Register and Upgrade Admin User ---
    console.log('Registering admin user...');
    const regRes = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Admin User', email: adminEmail, password: adminPass }),
    });
    // Ignore if already exists (400)
    
    console.log('Upgrading user role to Admin in the database...');
    execSync(`python -c "import sqlite3; conn = sqlite3.connect('d:/Book_Recomendation_System/backend/bookrec.db'); conn.cursor().execute(\\"UPDATE users SET role='admin' WHERE email='${adminEmail}'\\"); conn.commit(); conn.close()"`);

    console.log('Logging in as admin user...');
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPass);
    await page.click('button:has-text("Sign In")');
    await page.waitForFunction(() => window.location.pathname !== '/login', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '5_admin_home.png') });

    // --- Check NavBar DOES show Analytics, Demo, Admin ---
    console.log('Checking NavBar for admin links as admin user...');
    const navbarHTML = await page.locator('nav').first().innerHTML();

    const hasAnalyticsLink = navbarHTML.includes('href="/analytics"');
    const hasDemoLink = navbarHTML.includes('href="/demo"');
    const hasAdminLink = navbarHTML.includes('href="/admin"');

    console.log('NavBar Analytics visible to admin:', hasAnalyticsLink);
    console.log('NavBar Demo visible to admin:', hasDemoLink);
    console.log('NavBar Admin visible to admin:', hasAdminLink);

    expect(hasAnalyticsLink, 'Analytics link SHOULD be visible to admin').toBe(true);
    expect(hasDemoLink, 'Demo link SHOULD be visible to admin').toBe(true);
    expect(hasAdminLink, 'Admin link SHOULD be visible to admin').toBe(true);
    console.log('✅ Admin NavBar check PASSED — all links visible');

    // --- Test admin can access /analytics ---
    await page.goto(`${BASE_URL}/analytics`);
    await page.waitForTimeout(1500);
    const analyticsUrl = page.url();
    console.log('Admin /analytics URL:', analyticsUrl);
    expect(analyticsUrl, 'Admin should be able to access /analytics').not.toContain('access-denied');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '6_admin_analytics.png') });
    console.log('✅ /analytics accessible for admin PASSED');

    // --- Test admin can access /demo ---
    await page.goto(`${BASE_URL}/demo`);
    await page.waitForTimeout(1500);
    const demoUrl = page.url();
    console.log('Admin /demo URL:', demoUrl);
    expect(demoUrl, 'Admin should be able to access /demo').not.toContain('access-denied');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '7_admin_demo.png') });
    console.log('✅ /demo accessible for admin PASSED');

    // --- Test admin can access /admin ---
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(1500);
    const adminUrl = page.url();
    console.log('Admin /admin URL:', adminUrl);
    expect(adminUrl, 'Admin should be able to access /admin').not.toContain('access-denied');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '8_admin_dashboard.png') });
    console.log('✅ /admin accessible for admin PASSED');

    // --- Backend: Test /recommendations/analytics returns 200 for admin ---
    console.log('Testing backend /recommendations/analytics for admin (200 expected)...');
    const loginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPass }),
    });
    const loginData = await loginRes.json();
    const adminToken = loginData.access_token;

    const analyticsApiRes = await fetch(`${API}/recommendations/analytics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`/recommendations/analytics status for admin: ${analyticsApiRes.status}`);
    expect(analyticsApiRes.status, 'Analytics API should return 200 for admin').toBe(200);
    console.log('✅ Backend /recommendations/analytics → 200 for admin PASSED');

    console.log('\n🛡️ All Security Audit Tests PASSED!');
  });
});
