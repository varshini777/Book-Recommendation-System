import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const API = 'http://localhost:8000';
const ARTIFACT_DIR = 'test-results/mobile-audit';

test.beforeAll(() => {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
});

test.use({ headless: false, actionTimeout: 10000 });
test.setTimeout(120000);

const viewports = [
  { width: 320, height: 568 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 1366 }
];

const paths = [
  '/',
  '/catalog',
  '/catalog/3590',
  '/library',
  '/profile',
  '/onboarding',
  '/admin'
];

test('Mobile Responsiveness Audit', async ({ page }) => {
  // Login first
  console.log('Logging in...');
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@litrealm.com', password: 'admin123' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.access_token;

  await page.goto(`${BASE_URL}/login`);
  await page.evaluate((tok) => {
    const store = {
      state: {
        token: tok,
        user: { id: 1, email: 'admin@litrealm.com', name: 'Admin', role: 'admin', is_active: true, is_verified: true, onboarded: true, avatar: '', created_at: '' },
        onboarded: true,
      },
      version: 0
    };
    localStorage.setItem('litrealm-store', JSON.stringify(store));
    document.cookie = 'litrealm_auth=true; path=/; max-age=86400';
  }, token);

  let overflowCount = 0;

  for (const vp of viewports) {
    await page.setViewportSize(vp);
    console.log(`\nTesting viewport: ${vp.width}x${vp.height}`);
    
    for (const p of paths) {
      console.log(`Checking path: ${p}`);
      await page.goto(`${BASE_URL}${p}`);
      await page.waitForTimeout(1000); // Allow render
      
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      if (bodyWidth > vp.width) {
        console.log(`⚠️ OVERFLOW DETECTED on ${p} at ${vp.width}px (Body width: ${bodyWidth}px)`);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, `overflow_${vp.width}_${p.replace(/\//g, '_')}.png`) });
        overflowCount++;
      } else {
        console.log(`✅ OK on ${p}`);
      }
    }
  }

  expect(overflowCount).toBe(0);
});
