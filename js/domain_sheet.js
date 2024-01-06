import {RxElement} from "./rx_element.js";
import {DomainLeader} from "./domain_leader.js";
import {Ability} from "./abilities.js";

class DomainSheet extends RxElement {
  get saveSlots() { return document.querySelector("save-slots") }

  connectedCallback() {
    this.data = reef.signal(this.loadData());
    this.makeReactive();

    this.addEventListener("click", this);

    // For debugging; put `?actor=Seth` in the URL to make that one current
    let actorPicker = this.searchParams.get("actor");
    let actor = this.actors.find(a => a.name === actorPicker || a.id === actorPicker);
    if (actor) { this.data.currentActorId = actor.id }
  }

  doSaveData() {
    this.saveData();
    alert("Domain stats saved. We don't yet save action history.")
  }

  doClearData() {
    if (confirm("Really clear data? There is no undo")) {
      this.clearData();
      setTimeout(() => window.location.reload(), 0);
    }
  }

  clearData() {
    this.saveSlots.clear("domain");

    let newData = this.loadData();
    Object.keys(newData).forEach(key => this.data[key] = newData[key])
  }

  saveData() {
    this.saveSlots.save({domain: this.data});
  }

  loadData() {
    let saved = this.saveSlots.load({key: "domain", defaultValue: {
      name: "Anvilania",
      abilityBoosts: [
        ["stability"],
        ["stability", "culture"],
        ["stability", "culture", "economy"],
      ],
    }});
    let abilitiesStartAt = 2;

    saved.level ??= 1;
    saved.culture ??= abilitiesStartAt;
    saved.economy ??= abilitiesStartAt;
    saved.loyalty ??= abilitiesStartAt;
    saved.stability ??= abilitiesStartAt;
    saved.unrest ??= 0;
    saved.size ??= 1;
    saved.xp ??= 0;
    saved.level ??= 1;
    saved.leaders ??= [
      {type: "PC", name: "Seth"},
      {type: "PC", name: "Ben"},
      {type: "PC", name: "David"},
      {type: "PC", name: "Morgan"},
      {type: "PC", name: "Joe"},
      {type: "NPC", name: "Bertie", activitiesPerTurn: 1},
    ];
    saved.settlements ??= [
      {type: "Village", name: "Capital", activitiesPerTurn: 1, powerups: [{name: "Town Hall"}]},
    ]
    saved.consumables ??= {};
    saved.turns ??= [];

    "leaders settlements".split(" ").forEach(key => {
      saved[key] = saved[key].map(attrs => new DomainLeader(attrs));
    });

    return saved;
  }

  get activityLog() { return document.querySelector("domain-activity-log") }

  get abilitiesList() { return this.$(".abilities") }
  get statsList() { return this.$(".stats") }

  makeReactive() {
    this.fillName();
    this.fillLeaders();
    this.fillSettlements();

    Ability.all.forEach(ability => {
      let key = ability.toLocaleLowerCase();

      Maker.tag("article", {class: "ability", appendTo: this.abilitiesList},
        Maker.tag("a", {href: "#", class: "ability-roll", "data-ability": ability}, "🎲"),
        Maker.tag("label", ability, {for: `domain-${ability}`}),
        Maker.tag("span", {
          rx: () => `<input type="number" id="domain-${ability}" @value="${this.data[key]}" min="0" max="${this.max(key)}" /> / ${this.max(key)}`,
          change: (event) => this.data[key] = Number(event.target.value),
        }));
    });

    "Unrest Size XP Level".split(" ").forEach((stat) => {
      let key = stat.toLocaleLowerCase();
      let attrs = {Level: `min="1" max="20"`}[stat] || `min="0"`;

      Maker.tag("article", {class: "stat", appendTo: this.statsList,
        rx: () => `<label for="domain-${stat}">${stat}</label><input type="number" id="domain-${stat}" @value="${this.data[key]}" data-in="${stat}" ${attrs} />`,
        change: (event) => this.data[key] = Number(event.target.value),
      });
    })
    Maker.tag("article", {class: "stat", appendTo: this.statsList,
      rx: () => `<label for="domain-control-dc">Control DC</label><input type="number" id="domain-control-dc" @value="${this.controlDC}" readonly />`
    });
  }

  fillName() {
    reef.component(this.$(".domain-header"), () =>
      `<span class="domain-name">${this.data.name}</span>
        <span class="domain-data-management">
          <a href="#" data-action="doSaveData">💾</a>
          <a href="#" data-action="doClearData">❌</a>
        </span>
      `
    );
  }


  activitx(count) { return count == 1 ? "1 activity" : `${count} activities`};

  fillLeaders() {
    this.leadersComponent ||= reef.component(this.$(".leaders-section"), () =>
      `<h4>Leaders <span class="badge">${this.activitx(this.leadershipActivitiesLeft)} left</span></h4>
      <ul class="actors leaders list-unstyled">${this.actorList(this.data.leaders.sort((a, b) => a.initiative - b.initiative))}</ul>`
    );
  }

  fillSettlements() {
    this.settlementsComponent ||= reef.component(this.$(".settlements-section"), () =>
      `<h4>Settlements <span class="badge">${this.activitx(this.civicActivitiesLeft)} left</span></h4>
      <ul class="actors settlements list-unstyled">${this.actorList(this.data.settlements)}</ul>`
    );
  }

  actorList(actors, current = this.currentActor) {
    return actors.map(actor => {
      let total = actor.activitiesPerTurn;
      let left = actor.activitiesLeft;

      return `<li id="${actor.id}" class="actor ${(current == actor) ? "current" : ""}" data-action="setCurrentActor">
        ${actor.name}
        <span class="metadata">${actor.type}</span>
        <span class="badge">${actor.activitiesLeft}</span>
        </div>
      </li>`;
    }).join("");
  }

  setCurrentActor(event) {
    let actorId = event.target.closest(".actor[id]").id;
    if (actorId) { this.data.currentActorId = actorId }
  }

  max(ability) { return 5 }

  get leadershipActivitiesLeft() { return this.data.leaders.reduce((total, leader) => total + leader.activitiesLeft, 0) }
  get civicActivitiesLeft() { return this.data.settlements.reduce((total, settlement) => total + settlement.activitiesLeft, 0) }

  get controlDC() {
    let size = this.data.size;
    let sizeMod = size < 10 ? 0 : (size < 25 ? 1 : (size < 50 ? 2 : (size < 100 ? 3 : 4)));

    let baseControlDCByLevel = {
      1: 14, // Charter, government, heartland, initial proficiencies, favored land, settlement construction (village)
      2: 15, // Kingdom feat
      3: 16, // Settlement construction (town), skill increase
      4: 18, // Expansion expert, fine living, Kingdom feat
      5: 20, // Ability boosts, ruin resistance, skill increase
      6: 22, // Kingdom feat
      7: 23, // Skill increase
      8: 24, // Experienced leadership +2, Kingdom feat, ruin resistance
      9: 26, // Expansion expert (Claim Hex 3 times/turn), settlement construction (city), skill increase
      10: 27, // Ability boosts, Kingdom feat, life of luxury
      11: 28, // Ruin resistance, skill increase
      12: 30, // Civic planning, Kingdom feat
      13: 31, // Skill increase
      14: 32, // Kingdom feat, ruin resistance
      15: 34, // Ability boosts, settlement construction (metropolis), skill increase
      16: 35, // Experienced leadership +3, Kingdom feat
      17: 36, // Ruin resistance, skill increase
      18: 38, // Kingdom feat
      19: 39, // Skill increase
      20: 40, // Ability boosts, envy of the world, Kingdom feat, ruin resistance
    };

    return sizeMod + baseControlDCByLevel[this.data.level];
  }

  get currentTurn() { return this.data.turns.last() }
  get currentActor() { return this.readyActor(this.data.currentActorId) || this.readyActors.first() }
  actor(actorId) { return this.actors.find(a => a.id === actorId) }
  get actors() { return [...this.data.leaders, ...this.data.settlements] }
  readyActor(actorId) { return this.readyActors.find(a => a.id === actorId) }
  get readyActors() { return this.actors.filter(a => a.activitiesLeft > 0) }

  addFame() {
    let existing = this.findConsumables({name: "Fame"});
    if (existing.length < 3) {
      this.addConsumable({name: "Fame", description: "Reroll", action: "reroll", useBy: "end-of-time"});
    } else {
      this.log(`👨🏻‍🎤 Cannot have more than three Fame; added 100xp instead`);
      this.data.xp += 100;
    }
  }

  findConsumables(pattern) {
    return Object.values(this.data.consumables).filter(consumable =>
      Object.keys(pattern).reduce((all, key) => all && (pattern[key] === consumable[key]), true)
    );
  }

  addConsumable(attrs) {
    let id = attrs.id || crypto.randomUUID();
    this.data.consumables[id] = {name: "Consumable", description: "?", useBy: "end-of-turn", id, ...attrs};
  }

  useConsumable(pattern) {
    let matches = this.findConsumables(pattern);
    if (matches[0]) { delete this.data.consumables[matches[0].id] }
  }

  useAllConsumables(pattern) {
    this
      .findConsumables(pattern)
      .forEach(consumable => this.useConsumable({id: consumable.id}));
  }

  mod(ability) {
    let score = this.data[ability.toLocaleLowerCase()];
    return `${score >= 0 ? "+" : ""}${score}`;
  }

  get abilityScores() {
    return {
      Culture: this.data.culture,
      Economy: this.data.economy,
      Loyalty: this.data.loyalty,
      Stability: this.data.stability,
    };
  }

  abilityScoresWithDiffs(baseline, newValues = this.abilityScores) {
    let retval = {};
    Object.keys(newValues).forEach((ability) => {
      let value = newValues[ability];
      let diff = value - baseline[ability];
      let signClass = diff > 0 ? "diff-positive" : (diff < 0 ? "diff-negative" : "diff-flat");
      retval[ability] = [value, Maker.tag("span", {class: `metadata diff ${signClass}`}, `${diff >= 0 ? "+" : ""}${diff}`)];
    });
    return retval;
  }

  get statScores() {
    return {
      Unrest: this.data.unrest,
      Size: this.data.size,
      XP: this.data.xp,
      Level: this.data.level,
    };
  }

  log(message) {
    this.activityLog?.currentActivity?.log(message);
  }

  modify({by}, names) {
    names.forEach(name => {
      let key = name.toLocaleLowerCase();
      let current = this.data[key];
      let target = current + by;
      let max = this.max(name);
      let overage = target - max;
      this.data[key] = Math.min(max, target);
      if (overage > 0) {
        this.log(`🛑 ${name} cannot be above ${max}; added ${overage*50}xp instead`);
        this.data.xp += overage * 50;
      }
    })
  }
  boost(...names) {
    let {by} = names[0];
    by && names.shift();
    this.modify({by: by ?? 1}, names);
  }
  reduce(...names) {
    let {by} = names[0];
    by && names.shift();
    this.modify({by: by ?? -1}, names);
  }

  get unrestModifier() {
    let unrest = this.data.unrest;
    return unrest >= 15 ? -4 : (unrest >= 10 ? -3 : (unrest >= 5 ? -2 : (unrest >= 1 ? -1 : 0)));
  }

  get diceTray() { return this.$(".dice-tray") }

  roll({die, modifier, level, dc}) {
    let modifierValue = (modifier ? this.data[modifier.toLocaleLowerCase()] : 0);
    let levelValue = (level === false ? 0 : this.data.level);

    let components = [[modifier, modifierValue], ["Level", levelValue], ["Unrest", this.unrestModifier]];
    let modifierTotal = 0;

    let header = Maker.tag("h6");
    components.forEach((component) => {
      let [name, value] = component;
      if (value !== 0) {
        header.append(` ${value > 0 ? "+" : "-"} ${name} (${Math.abs(value)})`);
        modifierTotal += value;
      }
    })

    let roller = Maker.tag(
      "dice-roller",
      {dice: die || 20, modifier: modifierTotal},
    );
    if (dc !== false) {
      dc = dc || this.controlDC;
      header.append(` vs ${dc}`);
      dc -= modifierTotal; // see https://github.com/colinaut/dice-roller/issues/1
      roller.setAttribute("difficulty", Math.max(1, dc));
    }
    this.diceTray.prepend(roller);
    this.diceTray.prepend(header);
    roller.shadowRoot.querySelector("div").click(); // Ew
  }
}
DomainSheet.define("domain-sheet");

document.addEventListener("click", (event) => {
  let trigger = event.target.closest(".ability-roll");
  if (trigger) { document.querySelector("domain-sheet").roll({modifier: trigger.dataset.ability}) }
});
