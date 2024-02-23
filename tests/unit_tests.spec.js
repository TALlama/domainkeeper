// @ts-check
const { test, expect } = require('@playwright/test');

test('all ', async ({ page }) => {
  await page.goto('/?test');
  await page.waitForFunction(() => {
    console.log("", JSON.stringify(window.erisResults?.suites));
    return JSON.stringify(window.erisResults?.suites) === JSON.stringify({
      "Eris": {runCount: 4, passCount: 4, failCount: 0, errorCount: 0, finished: true},
      "Maker": {runCount: 20, passCount: 16, failCount: 0, errorCount: 0, finished: true},
      "blockedTooltip": {runCount: 2, passCount: 2, failCount: 0, errorCount: 0, finished: true},
      "Activity": {runCount: 75, passCount: 107, failCount: 0, errorCount: 0, finished: true},
      "Powerups": {runCount: 17, passCount: 24, failCount: 0, errorCount: 0, finished: true},
    });
  });

  let resultsJSON = await page.evaluate(() => JSON.stringify(window.erisResults))
  let results = JSON.parse(resultsJSON);
  console.log("Results: ", results);
  expect.soft(results.runCount).toBe(118);
  expect(results.passCount).toBe(153);
  expect(results.failCount).toBe(0);
  expect(results.errorCount).toBe(0);
});
