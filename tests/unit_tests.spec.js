// @ts-check
const { test, expect } = require('@playwright/test');

test('all ', async ({ page }) => {
  await page.goto('/?test');
  await page.waitForFunction(() => window.erisResults);

  let resultsJSON = await page.evaluate(() => JSON.stringify(window.erisResults))
  let results = JSON.parse(resultsJSON);
  console.log("Results: ", results);
  expect.soft(results.runCount).toBe(1539);
  expect(results.passCount).toBeGreaterThan(0);
  expect(results.failCount).toBe(0);
  expect(results.errorCount).toBe(0);
});
