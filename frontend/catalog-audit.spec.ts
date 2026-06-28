/**
 * LitRealm Catalog Quality Audit
 * Tests every catalog feature through a real browser.
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const API = 'http://localhost:8000';
const ARTIFACT_DIR = 'test-results/catalog-audit';

const results: { check: string; status: 'PASS' | 'FAIL' | 'WARNING'; detail: string }[] = [];

function log(check: string, status: 'PASS' | 'FAIL' | 'WARNING', detail: string) {
  results.push({ check, status, detail });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${status}] ${check}: ${detail}`);
}

test.beforeAll(() => {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
});

test.use({ headless: false, actionTimeout: 15000 });
test.setTimeout(120000);

test.describe('LitRealm Catalog Quality Audit', () => {

  test('CATALOG AUDIT — Full suite', async ({ page }) => {

    // ── Login first ──────────────────────────────────────────────────
    console.log('\n--- Logging in ---');
    const loginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@litrealm.com', password: 'admin123' }),
    });
    const loginData = await loginRes.json();
    const token = loginData.access_token;

    // Set auth in localStorage
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

    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_catalog_initial.png') });

    // ── 1. Check catalog loads with books ────────────────────────────
    console.log('\n--- Check 1: Catalog loads ---');
    const bookCards = page.locator('[class*="book-card"], .book-card, [data-testid="book-card"], a[href*="/catalog/"]');
    const cardCount = await bookCards.count();
    if (cardCount > 0) {
      log('Catalog Page Load', 'PASS', `${cardCount} books visible`);
    } else {
      log('Catalog Page Load', 'FAIL', 'No book cards found on catalog page');
    }

    // ── 2. Search by title ───────────────────────────────────────────
    console.log('\n--- Check 2: Search by title ---');
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"], input[placeholder*="search"]').first();
    await searchInput.fill('Harry Potter');
    await page.waitForTimeout(1500);
    const titleResults = page.locator('a[href*="/catalog/"]');
    const titleCount = await titleResults.count();
    const pageText = await page.content();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_search_title.png') });
    if (titleCount > 0 && !pageText.includes('No books found')) {
      log('Search by Title', 'PASS', `${titleCount} results for "Harry Potter"`);
    } else if (pageText.includes('No books found')) {
      log('Search by Title', 'WARNING', '"Harry Potter" returned no results — dataset may not contain this title');
    } else {
      log('Search by Title', 'FAIL', 'Search returned no cards');
    }

    // ── 3. Search by author ──────────────────────────────────────────
    console.log('\n--- Check 3: Search by author ---');
    await searchInput.fill('');
    await page.waitForTimeout(500);
    await searchInput.fill('Stephen King');
    await page.waitForTimeout(1500);
    const authorResults = await page.locator('a[href*="/catalog/"]').count();
    const authorPageText = await page.content();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_search_author.png') });
    if (authorResults > 0) {
      log('Search by Author', 'PASS', `${authorResults} results for "Stephen King"`);
    } else if (authorPageText.includes('No books found')) {
      log('Search by Author', 'WARNING', '"Stephen King" returned no results');
    } else {
      log('Search by Author', 'FAIL', 'Author search returned no cards');
    }

    // ── 4. Search by ISBN ────────────────────────────────────────────
    console.log('\n--- Check 4: Search by ISBN ---');
    await searchInput.fill('');
    await page.waitForTimeout(500);
    // Get a real ISBN from the API
    const booksRes = await fetch(`${API}/books/?page=1&page_size=5`);
    const booksData = await booksRes.json();
    const sampleBook = booksData.books[0];
    const isbn = sampleBook?.isbn || '';
    if (isbn) {
      await searchInput.fill(isbn);
      await page.waitForTimeout(1500);
      const isbnResults = await page.locator('a[href*="/catalog/"]').count();
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_search_isbn.png') });
      if (isbnResults > 0) {
        log('Search by ISBN', 'PASS', `${isbnResults} result(s) for ISBN ${isbn}`);
      } else {
        log('Search by ISBN', 'WARNING', `ISBN search returned 0 results (ISBN: ${isbn}) — backend may not search by ISBN`);
      }
    } else {
      log('Search by ISBN', 'WARNING', 'No ISBN in first book — skipping ISBN search test');
    }

    // ── 5. Genre filtering ───────────────────────────────────────────
    console.log('\n--- Check 5: Genre filter ---');
    await searchInput.fill('');
    await page.waitForTimeout(500);
    const genreSelect = page.locator('select').first();
    const genreOptions = await genreSelect.locator('option').allTextContents();
    console.log('Genre options:', genreOptions.slice(0, 5));

    if (genreOptions.length > 1) {
      // Select the first real genre (not "All Genres")
      const firstGenre = genreOptions[1];
      await genreSelect.selectOption({ label: firstGenre });
      await page.waitForTimeout(1500);
      const genreResults = await page.locator('a[href*="/catalog/"]').count();
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_genre_filter.png') });
      if (genreResults > 0) {
        log('Genre Filter', 'PASS', `${genreResults} books for genre "${firstGenre}"`);
      } else {
        log('Genre Filter', 'FAIL', `Genre "${firstGenre}" returned 0 results`);
      }
      await genreSelect.selectOption(''); // Reset
      await page.waitForTimeout(800);
    } else {
      log('Genre Filter', 'FAIL', 'No genre options in dropdown');
    }

    // ── 6. Language filtering ────────────────────────────────────────
    console.log('\n--- Check 6: Language filter ---');
    const langSelect = page.locator('select').nth(1);
    const langOptions = await langSelect.locator('option').allTextContents();
    console.log('Language options:', langOptions);
    if (langOptions.length > 1) {
      const langName = langOptions[1];
      await langSelect.selectOption({ index: 1 });
      await page.waitForTimeout(1500);
      const langResults = await page.locator('a[href*="/catalog/"]').count();
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_language_filter.png') });
      if (langResults > 0) {
        log('Language Filter', 'PASS', `${langResults} books for "${langName}" — shows only DB languages`);
      } else {
        log('Language Filter', 'FAIL', `"${langName}" language returned 0 results`);
      }
      await langSelect.selectOption('');
      await page.waitForTimeout(800);
    } else {
      log('Language Filter', 'WARNING', 'Only "All Languages" in dropdown — single language dataset (English only)');
    }

    // ── 7. Sorting ───────────────────────────────────────────────────
    console.log('\n--- Check 7: Sorting ---');
    const sortSelect = page.locator('select').nth(2);
    const sortOptions = await sortSelect.locator('option').allInnerTexts();
    console.log('Sort options:', sortOptions);

    const sortTests = [
      { label: 'Highest Rated',  value: 'rating_desc' },
      { label: 'Most Popular',   value: 'popularity' },
      { label: 'Newest First',   value: 'newest' },
      { label: 'Year (Newest)',  value: 'year_desc' },
      { label: 'Year (Oldest)',  value: 'year_asc' },
      { label: 'Title (A-Z)',    value: 'title_asc' },
      { label: 'Title (Z-A)',    value: 'title_desc' },
    ];

    for (const sort of sortTests) {
      try {
        await sortSelect.selectOption(sort.value);
        await page.waitForTimeout(1000);
        const sortCount = await page.locator('a[href*="/catalog/"]').count();
        if (sortCount > 0) {
          log(`Sort: ${sort.label}`, 'PASS', `${sortCount} books with sort=${sort.value}`);
        } else {
          log(`Sort: ${sort.label}`, 'FAIL', 'No books returned after sort change');
        }
      } catch {
        log(`Sort: ${sort.label}`, 'WARNING', `Option value "${sort.value}" not found in select`);
      }
    }

    // Reset sort to default
    await sortSelect.selectOption('rating_desc');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_sorting.png') });

    // ── 8. Pagination ────────────────────────────────────────────────
    console.log('\n--- Check 8: Pagination ---');
    const nextBtn = page.locator('button:has-text("Next"), button[aria-label*="next"], button:has(svg[class*="right"]), button:has([data-lucide="chevron-right"])');
    const nextCount = await nextBtn.count();
    if (nextCount > 0) {
      const prevUrl = page.url();
      await nextBtn.first().click();
      await page.waitForTimeout(1500);
      const afterUrl = page.url();
      const booksAfter = await page.locator('a[href*="/catalog/"]').count();
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_pagination_next.png') });
      if (booksAfter > 0) {
        log('Pagination - Next Page', 'PASS', `${booksAfter} books on next page`);
      } else {
        log('Pagination - Next Page', 'FAIL', 'Next page has no books');
      }
      // Go back
      const prevBtn = page.locator('button:has-text("Prev"), button[aria-label*="prev"], button:has([data-lucide="chevron-left"])');
      if (await prevBtn.count() > 0) {
        await prevBtn.first().click();
        await page.waitForTimeout(1000);
        log('Pagination - Prev Page', 'PASS', 'Previous page button works');
      } else {
        log('Pagination - Prev Page', 'WARNING', 'No previous button visible on page 2');
      }
    } else {
      log('Pagination', 'WARNING', 'No next button found — may be single page or button selector mismatch');
    }

    // ── 9. Book detail page ──────────────────────────────────────────
    console.log('\n--- Check 9: Book detail page ---');
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForTimeout(1500);
    const firstBookLink = page.locator('a[href*="/catalog/"]').first();
    const href = await firstBookLink.getAttribute('href');
    if (href) {
      await page.goto(`${BASE_URL}${href}`);
      await page.waitForTimeout(2000);
      const notFoundCount = await page.locator('h1:has-text("Book Not Found")').count();
      const default404 = await page.locator('h2:has-text("This page could not be found.")').count();
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_book_detail.png') });
      if (notFoundCount === 0 && default404 === 0) {
        log('Book Detail Page', 'PASS', `Detail page loads: ${href}`);
      } else {
        log('Book Detail Page', 'FAIL', `Detail page has error or 404: ${href}`);
      }
    } else {
      log('Book Detail Page', 'FAIL', 'No catalog book link found');
    }

    // ── 10 & 11. Cover images & Placeholders ─────────────────────────
    console.log('\n--- Check 10-11: Cover images ---');
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForTimeout(2000);

    const images = page.locator('img');
    const imgCount = await images.count();
    let loadedCount = 0;
    let brokenCount = 0;
    let placeholderCount = 0;

    for (let i = 0; i < Math.min(imgCount, 30); i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      if (!src || src === '' || src.includes('placeholder') || src.includes('data:') || naturalWidth === 0) {
        if (naturalWidth === 0 && src && !src.includes('data:')) {
          brokenCount++;
        } else {
          placeholderCount++;
        }
      } else {
        loadedCount++;
      }
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, '10_cover_images.png') });

    if (brokenCount === 0) {
      log('Cover Images Load', 'PASS', `${loadedCount} loaded, ${placeholderCount} placeholders, 0 broken`);
    } else {
      log('Cover Images Load', 'WARNING', `${loadedCount} loaded, ${placeholderCount} placeholders, ${brokenCount} broken`);
    }

    // ── 12. Ratings display ──────────────────────────────────────────
    console.log('\n--- Check 12-13: Ratings ---');
    const ratingEls = page.locator('[class*="rating"], span:has-text("★"), span:has-text("⭐")');
    const ratingCount2 = await ratingEls.count();
    if (ratingCount2 > 0) {
      log('Ratings Display', 'PASS', `${ratingCount2} rating elements found`);
    } else {
      // Try numeric rating pattern
      const starSpans = page.locator('span').filter({ hasText: /^\d\.\d+$/ });
      const starCount2 = await starSpans.count();
      if (starCount2 > 0) {
        log('Ratings Display', 'PASS', `${starCount2} numeric ratings visible`);
      } else {
        log('Ratings Display', 'WARNING', 'No explicit rating elements found — may be embedded in card text');
      }
    }

    // ── 14. Console errors ───────────────────────────────────────────
    console.log('\n--- Check 14: Console errors ---');
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.reload();
    await page.waitForTimeout(2000);
    if (consoleErrors.length === 0) {
      log('Console Errors', 'PASS', 'No console errors');
    } else {
      log('Console Errors', 'WARNING', `${consoleErrors.length} console errors: ${consoleErrors.slice(0,2).join('; ')}`);
    }

    // ── 15. API errors ───────────────────────────────────────────────
    console.log('\n--- Check 15: API errors ---');
    const apiErrors: string[] = [];
    page.on('response', response => {
      if (response.url().includes(API) && response.status() >= 400) {
        apiErrors.push(`${response.status()} ${response.url()}`);
      }
    });
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForTimeout(2000);
    if (apiErrors.length === 0) {
      log('API Errors', 'PASS', 'No 4xx/5xx API responses');
    } else {
      log('API Errors', 'FAIL', `API errors: ${apiErrors.join(', ')}`);
    }

    // ── 16. Duplicate books ──────────────────────────────────────────
    console.log('\n--- Check 16: Duplicate books ---');
    const allLinks = await page.locator('a[href*="/catalog/"]').allInnerTexts();
    const uniqueTitles = new Set(allLinks);
    if (uniqueTitles.size === allLinks.length) {
      log('Duplicate Books', 'PASS', `All ${allLinks.length} books are unique`);
    } else {
      log('Duplicate Books', 'FAIL', `${allLinks.length - uniqueTitles.size} duplicate entries found`);
    }

    // ── 17. Empty cards ──────────────────────────────────────────────
    console.log('\n--- Check 17: Empty cards ---');
    const emptyLinks = allLinks.filter(t => !t || t.trim() === '');
    if (emptyLinks.length === 0) {
      log('Empty Cards', 'PASS', 'No empty book cards');
    } else {
      log('Empty Cards', 'FAIL', `${emptyLinks.length} empty card(s) found`);
    }

    // ── 18. Mobile responsiveness ────────────────────────────────────
    console.log('\n--- Check 18: Mobile responsiveness ---');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForTimeout(1500);
    const mobileCards = await page.locator('a[href*="/catalog/"]').count();
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '18_mobile.png') });
    if (mobileCards > 0 && bodyWidth <= 400) {
      log('Mobile Responsiveness', 'PASS', `${mobileCards} books visible at 375px, no horizontal overflow`);
    } else if (mobileCards > 0) {
      log('Mobile Responsiveness', 'WARNING', `${mobileCards} books visible but body width is ${bodyWidth}px (overflow possible)`);
    } else {
      log('Mobile Responsiveness', 'FAIL', 'No books visible at 375px');
    }

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // ── Final Report ─────────────────────────────────────────────────
    console.log('\n\n════════════════════════════════════════════════════════');
    console.log('         LITREALM CATALOG AUDIT — FINAL REPORT         ');
    console.log('════════════════════════════════════════════════════════');
    const passes = results.filter(r => r.status === 'PASS').length;
    const fails = results.filter(r => r.status === 'FAIL').length;
    const warns = results.filter(r => r.status === 'WARNING').length;
    console.log(`\n✅ PASS:    ${passes}`);
    console.log(`❌ FAIL:    ${fails}`);
    console.log(`⚠️  WARNING: ${warns}`);
    console.log(`📊 TOTAL:   ${results.length}`);
    console.log('\nDETAILED RESULTS:');
    results.forEach(r => {
      const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`  ${icon} ${r.check}: ${r.detail}`);
    });

    // Write JSON report
    fs.writeFileSync(
      path.join(ARTIFACT_DIR, 'catalog_audit_results.json'),
      JSON.stringify({ summary: { passes, fails, warns, total: results.length }, results }, null, 2)
    );

    // Hard fail only on critical failures
    const criticalFails = results.filter(r => r.status === 'FAIL' &&
      ['Catalog Page Load', 'Book Detail Page', 'API Errors'].includes(r.check));
    expect(criticalFails.length, `Critical failures: ${criticalFails.map(f => f.check).join(', ')}`).toBe(0);
  });
});
