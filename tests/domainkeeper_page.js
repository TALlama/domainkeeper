const { expect } = require('@playwright/test');

class LocatorLike {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {import('@playwright/test').Locator} root
   */
  constructor(page, root) {
    this.page = page;
    this.root = root;
  }

  locator(...args) { return this.root.locator(...args) }
  getByRole(...args) { return this.root.getByRole(...args) }
  getByText(...args) { return this.root.getByText(...args) }

  toHaveAttribute(...args) { return this.root.toHaveAttribute(...args) }
}

export class DomainkeeperPage extends LocatorLike {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page, page);

    "Culture Economy Loyalty Stability Unrest Size XP Level".split(" ").forEach(stat =>
      this[stat.toLowerCase()] = this.getByRole('spinbutton', {name: stat})
    );
  }

  // Parts of the page
  get currentActorName() { return this.locator(".actor.current .name").textContent }
  get activityPicker() { return new ActivityPicker(this.page, this.locator('activity-picker')) }
  get consumables() { return new Consumables(this.page, this.locator('ul.consumables')) }
  get currentActivity() { return new ActivitySheet(this.page, this.locator('activity-sheet:not([resolved])')) }
  activity(name) { return new ActivitySheet(this.page, this.locator(`activity-sheet[name="${name}"]`)) }
  decisionPanel(name, opts={}) { return (opts.within || this.currentActivity).decisionPanel(name) }

  // Actions
  makeDecision(option, opts={}) {
    (opts.within || this.currentActivity).getByRole('radio', {name: option, includeHidden: true}).click({force: true});
  }

  async setDomainConcept(opts = {}) {
    let {heartland, charter, charterFree, govt, govtFree} = {
      heartland: "Forest",
      charter: "Exploration",
      charterFree: "Loyalty",
      govt: "Republic",
      govtFree: "Loyalty",
      ...opts};

    this.makeDecision(heartland);
    await expect(this.getByText(`Heartland ${heartland}`)).toBeVisible();
    this.makeDecision(charter);
    await expect(this.getByText(`Charter ${charter}`)).toBeVisible();
    this.decisionPanel('Free Charter Boost').decide(charterFree);
    await expect(this.getByText(`Free Charter Boost ${charterFree}`)).toBeVisible();
    this.makeDecision(govt);
    await expect(this.getByText(`Government ${govt}`)).toBeVisible();
    this.decisionPanel('Free Government Boost').decide(govtFree);
    await expect(this.getByText('Turn 1')).toBeVisible();
  }

  // Expectations
  async shouldHaveStats(stats) {
    for (const [stat, value] of Object.entries(stats)) {
      let locator = this[stat];
      expect(locator, `Stat ${stat} should be ${value}`).toBeDefined();
      await expect(locator).toHaveValue(value.toString());
    }
  }
}

export class ActivityPicker extends LocatorLike {
  get availableActvities() { return this.locator(".activities-list").getByRole("button") }
}

export class Consumables extends LocatorLike {
  get items() { return this.getByRole('listitem') }
  withName(name) { return this.items.filter({has: this.page.getByText(name)}) }

  get names() { return this.items.locator(".name").allTextContents() }
}

export class ActivitySheet extends LocatorLike {
  // Parts
  decisionPanel(name) { return new DecisionPanel(this.page, this.locator(`activity-decision-panel[name="${name}"]`)) }
}

export class DecisionPanel extends LocatorLike {
  // Parts
  optionButton(option) { return this.getByRole('radio', {name: option, includeHidden: true}) }

  // Actions
  decide(option) { this.optionButton(option).click({force: true}) }
}
