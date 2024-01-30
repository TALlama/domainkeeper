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
  getByLabel(...args) { return this.root.getByLabel(...args) }
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

    this.saveSlots = new SaveSlots(this.page, this.page);

    this.name = this.locator(".domain-name");
    this.renameLink = this.getByLabel("Rename domain");

    this.saveLink = this.getByRole('link', {name: '💾'});
    this.swapLink = this.getByRole('link', {name: '🔀'});
    this.restartLink = this.getByRole('link', {name: '✨'});

    this.readyEventButton = this.getByRole("button", {name: "Begin event"});
    this.earlyEventButton = this.getByRole("button", {name: "Start event early"});
  }

  // Parts of the page
  statInput(label) { return this[label.toLowerCase()] }
  async stat(label) { return Number(await this.statInput(label).inputValue()) }

  get leadersList() { return this.locator(".leaders-section") }
  get currentActorName() { return this.locator(".actor.current .name").textContent() }
  get currentActorActivitiesLeft() { return this.locator(".actor.current .badge") }
  actorActivitiesLeft(actorName) { return this.locator(`.actor:has(.name:has-text("${actorName}")) .badge`) }

  get rolls() { return this.locator("dice-roller") }
  get lastRoll() { return this.rolls.nth(0) }
  async rollText(roll) { return roll.evaluate(r => r.shadowRoot?.textContent) }

  get activityPicker() { return new ActivityPicker(this.page, this.locator('activity-picker')) }
  get consumables() { return new Consumables(this.page, this.locator('ul.consumables')) }

  turn(name) { return new Turn(this.page, this.locator((typeof name) === "number" ? `article.turn[data-turn-number="${name}"]` : `article.turn[data-turn-name="${name}"]`)) }

  get currentActivity() { return new ActivitySheet(this.page, this.locator('activity-sheet:not([resolved])')) }
  activity(name) { return new ActivitySheet(this.page, this.locator(`activity-sheet[name="${name}"]`)) }
  decisionPanel(name, opts={}) { return (opts.within || this.currentActivity).decisionPanel(name) }

  // Actions
  async rename(name) {
    this.page.once('dialog', async dialog => { await dialog.accept(name) });
    await this.renameLink.click();
    return expect(this.name).toHaveText(name);
  }

  async setCurrentActor(value) { this.locator(`.leaders-section .actor:has-text("${value}")`).click() }
  currentActorTraits() { return this.locator(`actor-sheet trait-list li.trait`) }

  async addStructure(settlementName, properties) {
    return this.page.evaluate((opts) =>
      document.querySelector("domain-sheet").settlement(opts.settlementName).addPowerup(opts.properties),
      {settlementName, properties});
  }

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

    if (!opts.within) {
      opts = {...opts, within: this.currentActivity};
      await opts.within.retargetWithId();
    }

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
    await this.decisionPanel('Free Charter Boost').makeDecision(charterFree);
    await expect(this.getByText(`Free Charter Boost ${charterFree}`)).toBeVisible();
    await this.makeDecision(govt);
    await expect(this.getByText(`Government ${govt}`)).toBeVisible();
    await this.decisionPanel('Free Government Boost').makeDecision(govtFree);
    await expect(this.getByText('Turn 1')).toBeVisible();
  }

  async loadDomain(data, expectTurn = "Turn 1") {
    await this.page.evaluate((data) => document.querySelector("domain-sheet").load(data), data);
    await expect(this.getByText(expectTurn, {exact: true})).toBeVisible();
  }

  async swapToDomain(domainName) {
    await this.swapLink.click();
    let dialog = this.page.locator("sl-dialog[open]");
    await dialog.getByLabel(domainName).click();
    return dialog.getByRole("button", {name: "Load"}).click();
  }

  async clearDomain() {
    await this.swapLink.click();
    
    this.page.once('dialog', async dialog => { await dialog.accept() });
    let dialog = this.page.locator("sl-dialog[open]");
    await dialog.getByRole('button', { name: 'Delete' }).click();
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

export class SaveSlots extends LocatorLike {
  // Actions
  async add(slot, properties) {
    return this.page.evaluate((m) => document.querySelector("save-slots").save(m), {[slot]: properties});
  }

  async raw() {
    return this.page.evaluate(() => {
      let key = document.querySelector("domain-sheet").domainKey;
      return document.querySelector("save-slots").load({key});
    });
  }
}

export class ActivityPicker extends LocatorLike {
  get availableActvities() { return this.locator(".activities-list").getByRole("button") }
}

export class Consumables extends LocatorLike {
  get items() { return this.getByRole('listitem') }
  withName(name) { return this.items.filter({has: this.page.getByText(name)}) }

  get names() { return this.items.locator(".name") }
}

export class Turn extends LocatorLike {
  constructor(page, root) {
    super(page, root);

    this.name = this.locator(".turn-name");
    this.activities = this.locator("activity-sheet");
  }

  activity(name) { return new ActivitySheet(this.page, this.locator(`activity-sheet[name="${name}"]`)) }

  async rename(name) {
    this.page.once('dialog', async dialog => { await dialog.accept(name) });
    await this.name.click();
    return expect(this.name).toHaveText(name);
  }
}

export class ActivitySheet extends LocatorLike {
  constructor(page, root) {
    super(page, root);
    this.retargetWithId();
  }

  get summary() { return this.locator(".summary .value") }

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
  name() { return this.locator(".activity-name") }
  decisionPanel(name) { return new DecisionPanel(this.page, this.locator(`activity-decision-panel[name="${name}"]`)) }

  // Actions
  async updateSummary(value) {
    this.page.on('dialog', async dialog => { await dialog.accept(value) });
    await this.getByLabel("Edit summary").click();
    return expect(this.summary).toHaveText(value);
  }

  async makeDecisions(options, opts={}) {
    if (options.length === 0) { return Promise.resolve() }

    await this.makeDecision(options[0], opts);
    return this.makeDecisions(options.slice(1), opts);
  }

  async makeDecision(option, opts={}) {
    await this.locator(`label[data-display-title-value="${option}"]`).click({force: true});

    return Promise.any([
      expect(this.root).toHaveAttribute("resolved"),
      expect(this.locator(`.picked[data-display-title-value="${option}"]`)).toBeVisible(),
    ]);
  }
}

export class DecisionPanel extends LocatorLike {
  // Parts
  optionButton(option) { return this.getByRole('radio', {name: option, includeHidden: true}) }

  // Actions
  makeDecision(option) { this.optionButton(option).click({force: true}) }
}
