const { test, expect } = require('@playwright/test');

test.describe("escapeHtml", () => {
  async function escape(page, string) {
    await page.goto("/");
    let handle = await page.waitForFunction((s) => s.escapeHtml(), string);
    return handle.jsonValue();
  }

  test("does not change normal strings", async ({page}) => {
    expect(await escape(page, "foo bar")).toEqual("foo bar")
  });

  test("escapes angle brackets", async ({page}) => {
    expect(await escape(page, "<foo-bar>")).toEqual("&lt;foo-bar&gt;")
  });

  test("escapes ampersands", async ({page}) => {
    expect(await escape(page, "foo & bar")).toEqual("foo &amp; bar")
  });
});
