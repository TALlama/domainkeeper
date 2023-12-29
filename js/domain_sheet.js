import {RxElement} from "./rx_element.js";
import {DomainLeader} from "./domain_leader.js";

class DomainSheet extends RxElement {
  get saveSlots() { return document.querySelector("save-slots") }

  connectedCallback() {
    this.data = reef.signal(this.loadData());
    this.makeReactive();

    this.addEventListener("click", this);
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
    saved.fame ??= 1;
    saved.size ??= 1;
    saved.xp ??= 0;
    saved.level ??= 1;
    saved.leaders ??= [
      new DomainLeader({type: "PC", name: "Seth"}),
      new DomainLeader({type: "PC", name: "Ben"}),
      new DomainLeader({type: "PC", name: "David"}),
      new DomainLeader({type: "PC", name: "Morgan"}),
      new DomainLeader({type: "PC", name: "Joe"}),
      new DomainLeader({type: "NPC", name: "Bertie", activitiesPerTurn: 1}),
    ];
    saved.settlements ??= [
      new DomainLeader({type: "Village", name: "Capital", activitiesPerTurn: 1}),
    ]
    saved.turns ??= [];

    return saved;
  }

  get abilitiesList() { return this.$(".abilities") }
  get statsList() { return this.$(".stats") }

  makeReactive() {
    this.fillName();
    this.fillLeaders();
    this.fillSettlements();

    "Stability Loyalty Economy Culture".split(" ").forEach((ability) => {
      Maker.tag("div", {prependTo: this.abilitiesList},
        Maker.tag("a", {href: "#", class: "ability-roll", "data-ability": ability}, "🎲"),
        Maker.tag("label", {rx: () => {
          let value = this.data[ability.toLocaleLowerCase()];
          return `<span class="ability-name">${ability}</span> <input type="number" @value="${value}" data-in="${ability}" min="0" /> `;
        }}));
    });

    "Unrest Fame Size XP".split(" ").forEach((stat) => {
      Maker.tag("label", {appendTo: this.statsList, rx: () => `<label>${stat} <input type="number" @value="${this.data[stat.toLocaleLowerCase()]}" data-in="${stat}" min="0" /></label>`})
    })
    Maker.tag("label", {appendTo: this.statsList, rx: () => `<label>Level <input type="number" @value="${this.data.level}" data-in="Level" min=1 max=20 /></label>`});
    Maker.tag("label", {appendTo: this.statsList, rx: () => `<label>Control DC <input type="number" @value="${this.controlDC}" readonly /></label>`});;

    this.addEventListener("change", (event) => {
      let input = event.target.closest("[data-in]");
      if (input) { this.data[input.dataset.in.toLocaleLowerCase()] = Number(input.value) }
    })
  }

  fillName() {
    reef.component(this.$(".domain-name"), () =>
      `${this.data.name}
        <span class="domain-data-management">
          <a href="#" data-action="doSaveData">💾</a>
          <a href="#" data-action="doClearData">❌</a>
        </span>
      `
    );
  }

  fillLeaders() {
    this.leadersComponent ||= reef.component(this.$(".leaders"), () =>
      this.data.leaders.map(leader => `<li key="${leader}">${leader.type}: ${leader.name} <span class='metadata'>${leader.activitiesPerTurn} ${leader.activitiesPerTurn == 1 ? "activity" : "activities"}</li>`).join("")
    )
  }

  fillSettlements() {
    reef.component(this.$(".settlements"), () =>
      this.data.settlements.map(settlement => `<li key="${settlement}">${settlement.type}: ${settlement.name} <span class='metadata'>${settlement.activitiesPerTurn} ${settlement.activitiesPerTurn == 1 ? "activity" : "activities"}</li>`).join("")
    )
  }

  get leadershipActivitiesPerTurn() { return this.data.leaders.reduce((total, leader) => total + leader.activitiesPerTurn, 0) }
  get civicActivitiesPerTurn() { return this.data.settlements.reduce((total, settlement) => total + settlement.activitiesPerTurn, 0) }

  get controlDC() {
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

    return this.data.size + baseControlDCByLevel[this.data.level];
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
      Fame: this.data.fame,
      Size: this.data.size,
      XP: this.data.xp,
      Level: this.data.level,
    };
  }

  modify({by}, names) { names.forEach(name => { this.data[name.toLocaleLowerCase()] += by }) }
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
customElements.define("domain-sheet", DomainSheet);

document.addEventListener("click", (event) => {
  let trigger = event.target.closest(".ability-roll");
  if (trigger) { document.querySelector("domain-sheet").roll({modifier: trigger.dataset.ability}) }
});
