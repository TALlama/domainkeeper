const { expect } = require('@playwright/test');

export async function monitor({shouldChange, shouldNotChange, when}) {
  let before = {};
  if (shouldChange) { before.shouldChange = await shouldChange() }
  if (shouldNotChange) { before.shouldNotChange = await shouldNotChange() }
  await when();
  shouldChange && expect(await shouldChange()).not.toEqual(before.shouldChange);
  shouldNotChange && expect(await shouldNotChange()).toEqual(before.shouldNotChange);
};
