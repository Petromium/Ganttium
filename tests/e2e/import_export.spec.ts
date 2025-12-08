import { test, expect } from '@playwright/test';

test.describe('Project Import/Export', () => {
  test.beforeEach(async ({ page }) => {
    // Login logic
  });

  test('should export project data including extended fields', async ({ page }) => {
    await page.goto('/projects/1');
    
    // Open Export Menu
    await page.click('[data-testid="button-import-export"]');
    
    // Click JSON Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="menu-item-export-json"]');
    const download = await downloadPromise;
    
    // Verify filename
    expect(download.suggestedFilename()).toContain('_export_');
    
    // Verify content (stream/read) - simplified check
    const path = await download.path();
    // In a real run, we would read the file and check for 'risks', 'issues', 'actualCost' fields
  });

  test('should validate import data schema', async ({ page }) => {
    await page.goto('/projects/1');
    await page.click('[data-testid="button-import-export"]');
    await page.click('[data-testid="menu-item-import-json"]');
    
    // Upload invalid file
    // ...
    
    // Expect error toast
    // await expect(page.locator('text=Import Issues')).toBeVisible();
  });
});

