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
  getAttribute(...args) { return this.root.getAttribute(...args) }

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
  get leadersList() { return this.locator(".leaders-section") }
  get currentActorName() { return this.locator(".actor.current .name").textContent() }
  get currentActorActivitiesLeft() { return this.locator(".actor.current .badge").textContent() }

  get rolls() { return this.locator("dice-roller") }
  get lastRoll() { return this.rolls.nth(0) }
  async rollText(roll) { return roll.evaluate(r => r.shadowRoot?.textContent) }

  get activityPicker() { return new ActivityPicker(this.page, this.locator('activity-picker')) }
  get consumables() { return new Consumables(this.page, this.locator('ul.consumables')) }

  get currentActivity() { return new ActivitySheet(this.page, this.locator('activity-sheet:not([resolved])')) }
  activity(name) { return new ActivitySheet(this.page, this.locator(`activity-sheet[name="${name}"]`)) }
  decisionPanel(name, opts={}) { return (opts.within || this.currentActivity).decisionPanel(name) }

  // Actions
  async setCurrentActor(value) { this.locator(`.leaders-section .actor:has-text("${value}")`).click() }

  rollAbility(name) {
    this.page.getByRole("link", {name: `Roll ${name}`}).click();
  }

  async pickActivity(name, ...decisions) {
    await this.activityPicker.getByRole("button", {name}).click();
    await this.page.waitForFunction(() => document.querySelector("activity-sheet:not([resolved])"));
    let activityId = await this.currentActivity.getAttribute("id");
    let activitySheet = this.locator(`#${activityId}`);

    return this.makeDecisions(decisions, {within: activitySheet});
  }

  async cancelActivity() {
    return this.currentActivity.getByRole("link", {name: "Cancel"}).click();
  }

  async makeDecisions(options, opts={}) {
    if (options.length === 0) { return Promise.resolve() }

    await this.makeDecision(options[0], opts);
    return this.makeDecisions(options.slice(1), opts);
  }

  async makeDecision(option, opts={}) {
    let within = (opts.within || this.currentActivity);
    await within.locator(`label[data-display-title-value="${option}"]`).click({force: true})
    return expect(within.locator(`.picked[data-display-title-value="${option}"]`)).toBeVisible();
  }

  async setDomainConcept(opts = {}) {
    let {heartland, charter, charterFree, govt, govtFree} = {
      heartland: "Forest",
      charter: "Exploration",
      charterFree: "Loyalty",
      govt: "Republic",
      govtFree: "Loyalty",
      ...opts};

    await this.makeDecision(heartland);
    await expect(this.getByText(`Heartland ${heartland}`)).toBeVisible();
    await this.makeDecision(charter);
    await expect(this.getByText(`Charter ${charter}`)).toBeVisible();
    await this.decisionPanel('Free Charter Boost').decide(charterFree);
    await expect(this.getByText(`Free Charter Boost ${charterFree}`)).toBeVisible();
    await this.makeDecision(govt);
    await expect(this.getByText(`Government ${govt}`)).toBeVisible();
    await this.decisionPanel('Free Government Boost').decide(govtFree);
    await expect(this.getByText('Turn 1')).toBeVisible();
  }

  async loadDomain(data, expectTurn = "Turn 1") {
    this.page.evaluate((data) => document.querySelector("domain-sheet").load(data), data);
    await expect(this.getByText(expectTurn, {exact: true})).toBeVisible();
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
  constructor(page, root) {
    super(page, root);
    this.retargetWithId();
  }

  async retargetWithId() {
    if (this.id) return;

    console.log(`-- acquiring id…`);
    let id = await this.root.getAttribute("id");
    console.log(`-- acquired id: ${id}`);
    this.root = this.page.locator(`#${id}`);
    this.id = id;
    console.log(`-- retargetted with id: ${id}`);
    return id;
  }

  // Parts
  decisionPanel(name) { return new DecisionPanel(this.page, this.locator(`activity-decision-panel[name="${name}"]`)) }

  // Actions
  decide(...options) {
    return Promise.all(options.map(async option => {
      console.log(`-- gonna decide on ${option} next`);
      await this.makeDecision(option, {within: activitySheet});
    }));
  }
}

export class DecisionPanel extends LocatorLike {
  // Parts
  optionButton(option) { return this.getByRole('radio', {name: option, includeHidden: true}) }

  // Actions
  decide(option) { this.optionButton(option).click({force: true}) }
}
