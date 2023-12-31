import {RxElement} from "../rx_element.js";
import {Ability} from "../abilities.js";
import {DomainLeader} from "../domain_leader.js";

export class Activity extends RxElement {
  constructor(properties) {
    super();

    Object.assign(this, properties);
    this.id ||= crypto.randomUUID();
    this.abilities ||= this.abilities || ["Culture", "Economy", "Loyalty", "Stability"];

    Maker.tag(this, {id: this.id, class: "entry activity"},
      {"data-type": this.tagName.toLowerCase()},
      {class: (LeadershipActivity === this.constructor ? "leadership-activity" : "")},
      {class: (CivicActivity === this.constructor ? "civic-activity" : "")},
      Maker.tag("header", this.name, Maker.tag("a", "Cancel", {href: "#", class: "cancel-activity", click: () => this.cancel()})),
      Maker.tag("span", {class: "icon"}, this.icon),
      Maker.tag("blockquote", {class: "description"}, this.description),
      Maker.tag("section", {class: "body"}, (el) => this.body(el, this)),
    );
  }

  connectedCallback() {
    this.addEventListener("click", this);
  }

  handleEvent(event) {
    let setUsedAbility = event.target.closest("[data-set-used-ability]")?.dataset?.setUsedAbility;
    if (setUsedAbility) { this.usedAbility = setUsedAbility }

    let setOutcome = event.target.closest("[data-set-outcome]")?.dataset?.setOutcome;
    if (setOutcome) { this.outcome = setOutcome }
  }

  body(into) {
    Maker.tag(into, this.callOrReturn(this.preprompt), this.promptSection, this.preoutcome, this.outcomeSection, Maker.tag("section", {class: "log"}));
  }

  callOrReturn(value) { return value?.call ? value.call(this, this) : value }

  get activityLog() { return this.closest("domain-activity-log") }
  get domainSheet() { return document.querySelector("domain-sheet") }
  get promptSection() { return Maker.tag("section", {class: "prompt pickable-group"}, this.prompt) }
  set prompt(value) { this._prompt = value }
  get prompt() {
    return this.callOrReturn(this._prompt) ?? [
      Maker.tag("h4", this.promptText),
      Maker.pickableGroup(this.abilities.toDictionary(ability => [
        ability,
        [
          ability,
          Maker.tag("span", ` ${this.domainSheet.mod(ability)}`, {class: "modifier"}),
          {"class": "pickable", "data-set-used-ability": ability, change: () => this.domainSheet.roll({modifier: ability})},
        ],
      ])),
    ];
  }
  set promptText(value) { this._promptText = value }
  get promptText() { return this.callOrReturn(this._promptText) ?? (this.abilities.length === 1 ? "Roll:" : "Roll one:") }

  get usedAbility() { return this.dataset.usedAbility }
  set usedAbility(value) {
    this.dataset.usedAbility = this.record.usedAbility = value;
    this.$(`.prompt [data-set-used-ability="${value}"]`)?.classList?.add("picked");
  }
  get belowAbility() { return Ability.next(this.usedAbility) }
  get aboveAbility() { return Ability.previous(this.usedAbility) }

  get outcomeSection() { return Maker.tag("section", {class: "outcome"}, this.possibleOutcomes) }
  set possibleOutcomes(value) { this._possibleOutcomes = value }
  get possibleOutcomes() {
    return this.callOrReturn(this._possibleOutcomes) ?? [
      Maker.tag("h4", "Result:"),
      Maker.pickableGroup({
        "critical-success": [`Critical Success`, Maker.tag("small", this.criticalSuccessDescription), {class: "outcome outcome-critical-success", "data-set-outcome": "critical-success", change: () => { this.criticalSuccess() }}],
        "success": [`Success`, Maker.tag("small", this.successDescription), {class: "outcome outcome-success", "data-set-outcome": "success", change: () => { this.success() }}],
        "failure": [`Failure`, Maker.tag("small", this.failureDescription), {class: "outcome outcome-failure", "data-set-outcome": "failure", change: () => { this.failure() }}],
        "critical-failure": [`Critical Failure`, Maker.tag("small", this.criticalFailureDescription), {class: "outcome outcome-critical-failure", "data-set-outcome": "critical-failure", change: () => { this.criticalFailure() }}],
      }),
    ];
  }
  get outcome() { return this.dataset.outcome }
  set outcome(value) {
    this.dataset.outcome = this.record.outcome = value;
    this.$(`.outcome [data-set-outcome="${value}"]`)?.classList?.add("picked");
  }

  criticalSuccess() { this.success() }
  success() { this.log('Good job!') }
  failure() { this.log('Oh no!') }
  criticalFailure() { this.failure() }

  cancel() {
    let entries = this.domainSheet.data.turns.last().entries;
    let ixThis = entries.findIndex(r => r == this.record);
    entries.splice(ixThis, 1);
    this.activityLog.countRemainingActivities();

    this.remove();
  }

  get logElement() { return this.$('.log') }
  log(...parts) {
    let newEntry = Maker.tag("p", ...parts, {appendTo: this.logElement});
    this.record.log.push(newEntry.innerHTML);
    return newEntry;
  }

  get record() {
    return this._record ||= reef.signal({
      id: this.id,
      type: this.constructor.name.replace(/^./, l => l.toLowerCase()).replaceAll(/[A-Z]/g, l => `-${l.toLowerCase()}`),
      name: this.name,
      usedAbility: this.usedAbility,
      outcome: this.outcome,
      log: [],
    });
  }

  boost(...abilities) {
    let {by} = abilities[0];
    by && abilities.shift();
    by ??= 1;
    abilities.forEach(ability => {
      this.domainSheet.boost({by}, ability);
      this.log(`📈 Boosted ${ability} by ${by}`, Maker.tag("span", {class: "metadata"}, `, to ${this.domainSheet.data[ability.toLowerCase()]}`));
    });
  }

  reduce(...abilities) {
    let {by} = abilities[0];
    by && abilities.shift();
    by ??= -1;
    abilities.forEach(ability => {
      this.domainSheet.boost({by}, ability);
      this.log(`📉 Reduced ${ability} by ${Math.abs(by)}`, Maker.tag("span", {class: "metadata"}, `, to ${this.domainSheet.data[ability.toLowerCase()]}`));
    });
  }

  addConsumable(attrs) {
    this.domainSheet.addConsumable(attrs);
  }

  addFame() {
    this.log("👩🏻‍🎤 Add fame");
    this.domainSheet.addFame();
  }

  // Formatting options
  static tagged(tag, ...parts) { return Maker.tag("li", Maker.tag("strong", `${tag} `), ...parts) }
  static prereq(...parts) { return Activity.tagged("Requirements", ...parts) }
  static special(...parts) { return Activity.tagged("Special", ...parts) }

  pickOne(items, options) {
    let {prompt, appendTo, beforeItems, afterItems} = options;
    beforeItems ??= [];
    afterItems ??= [];

    return Maker.tag("section", {class: "pickable-group", appendTo: appendTo || this.logElement},
      Maker.tag("h5", options.prompt || `Pick one:`),
      [
        ...beforeItems,
        ...items.map(item => this.pickOneItem(item, options)),
        ...afterItems,
      ].map(item => Maker.tag("button", {class: "pickable"}, ...item)),
    );
  }

  pickOneItem(item, {format, andThen} = {}) {
    let text = (format || ((i) => i.toString())).call(item, item);
    return [text, {click: (event) => andThen(item, {event})}];
  }

  modAndThen({ability, by, andThen} = {}) {
    by ??= -1;
    andThen ??= () => {};

    return () => {
      this[by > 0 ? "boost" : "reduce"]({by}, ability);
      return andThen();
    }
  }

  modOneAnd(format, options = {}) {
    let by = options.by ?? 1;
    let text = (ability) => format.replace("{ability}", ability).replace("{by}", Math.abs(by));

    return this.pickOne([], {...options, beforeItems: Ability.all.map(ability =>
      this.pickOneItem(text(ability), {...options, andThen: this.modAndThen({...options, ability: ability})}),
    )});
  }

  button({disabled} = {}) {
    return `<button title="${this.description}" data-action="doActivity" data-activity="${this.name}" ${disabled ? "disabled" : ""}>
      <span class="icon">${this.icon}</span>
      <span class="name">${this.name}</span>
    </button>`
  }

  static get all() { return [...LeadershipActivity.all, ...CivicActivity.all] }
  static icon(name) {
    this._allActivities ??= this.all;
    return this._allActivities.find(a => a.name === name)?.icon ?? {
      "Ruin": "😢",
      "Initial Boosts": "🌱",
    }[name] ?? "❓";
  }
}

export class SystemActivity extends Activity {
}
customElements.define("system-activity", SystemActivity);

export class LeadershipActivity extends Activity {
  static get all() {
    let {p, ol} = Maker;
    let {tagged, prereq, special} = Activity;
    let hexMods = `Additional Modifier (not factored in): Mountains: -4; Swamps: -3; Forests: -2; Hills: -1; Plains: -0. `;

    return [
      new LeadershipActivity({
        icon: "👷🏻‍♂️",
        name: "Clear Hex",
        description: "You lead the effort to clear out the dangers in an already-reconnoitered hex.",
        abilities: ["Economy", "Stability"],
        preprompt: [
          p(`Engineers and mercenaries attempt to prepare a hex to serve as the site for a settlement, or they work to remove an existing improvement, a dangerous hazard, or an encounter.`),
          ol(
            `If you’re trying to prepare a hex for a settlement or demolish an improvement you previously built (or that was already present in the hex), use Economy.`,
            `If you’re trying to remove a hazard or encounter, use Stability. The DC of this check is set by the highest level creature or hazard in the hex (as set by Table 10–5: DCs by Level, on page 503 of the Pathfinder Core Rulebook).`,
            `If the hex is outside your domain, increase the DC by 2.`,
            hexMods,
          )],
        criticalSuccessDescription: `Clear hex and boost economy`,
        successDescription: `Clear hex`,
        failureDescription: `Fail`,
        criticalFailureDescription: `Unrest`,
        criticalSuccess() { this.success(); this.log("🐻 You brought back spoils!"); this.boost("Economy") },
        success() { this.log("🎉 You successfully clear the hex.") },
        failure() { this.log("❌ You fail to clear the hex.") },
        criticalFailure() { this.log("💀 You catastrophically fail to clear the hex and several workers lose their lives."); this.boost("Unrest") },
      }),
      new LeadershipActivity({
        icon: "🎏",
        name: "Claim Hex",
        description: "You bring the cleared hex into the domain.",
        preprompt: [
          prereq(`You have Reconnoitered the hex to be claimed during hexploration. This hex must be adjacent to at least one hex that’s already part of your domain. If the hex to be claimed contains dangerous hazards or monsters, they must first be cleared out—either via standard adventuring or the Clear Hex activity.`),
          p(`Your surveyors fully explore the hex and attempt to add it into your domain.`),
        ],
        abilities: ["Economy", "Stability"],
        criticalSuccessDescription: `Claim hex; Boost a random stat`,
        successDescription: `Claim hex`,
        failureDescription: `Fail`,
        criticalFailureDescription: `-1 Stability for rest of turn`,
        criticalSuccess() {
          this.success();
          let [ability, message] = [
            ["Culture", "🎵 The speed of your occupation becomes a popular folk song around the domain."],
            ["Economy", "🦌 A grand hunt in the new territory brings great wealth to the domain."],
            ["Loyalty", "🎖️ The pioneers tell of your exploits and spread word of your deeds across the domain ."],
            ["Stability", "🐴 The integration goes flawlessly thanks to your careful planning."],
          ].random();
          this.log(message);
          this.boost(ability);
        },
        success() {
          this.log(`🎉 You claim the hex and immediately add it to your territory, increasing Size by 1 (this affects all statistics determined by Size; see page 38). Your occupation of the hex goes so smoothly that you can immediately attempt another Region activity.`);
          this.boost("Size");
        },
        failure() { this.log(`❌ You fail to claim the hex`) },
        criticalFailure() {
          this.log(`💀 You fail to claim the hex, and a number of early settlers and explorers are lost, causing you to take a –1 circumstance penalty to Stability-based checks until the end of your next turn.`);
          this.addConsumable({name: "Status: Disaster", description: "-1 Stability (Circumstance penalty)"});
        },
      }),
      new LeadershipActivity({
        icon: "🏃‍♂️",
        name: "Abandon Hex",
        description: "You renounce the domain's claim to a hex.",
        abilities: ["Stability"],
        preprompt: [
          prereq(`The hex to be abandoned must be controlled.`),
          p(`After careful consideration, you decide that you would rather not hold onto a particular hex as part of your claimed territory. You renounce your claim to it and pull back any settlers or explorers. Attempt a basic Exploration or Wilderness check. You can abandon more than one hex at a time, but each additional hex you abandon increases the DC of this check by 1.`),
          special(`The Unrest gained from abandoning a hex doubles if it includes a settlement. A settlement in an abandoned hex becomes a Freehold (page 41).`),
        ],
        criticalSuccessDescription: `Abandon Hex; Economy boost`,
        successDescription: `Abandon hex; Unrest`,
        failureDescription: `Abandon hex; Unrest + 2; Possible Squatters event`,
        criticalFailureDescription: `Abandon hex; Unrest +3; Definite Bandit Activity Event`,
        criticalSuccess() {
          this.success();
          this.log(`⚱️ Settlers and explorers return and resettle elsewhere in your domain, bringing with them bits of salvage from the abandoned hexes.`)
          this.boost("Economy"); // this is the old `Gain 1 RP per abandoned hex`
        },
        success() {
          this.log(`🎉 You abandon the hex or hexes, decreasing Size by 1 per hex abandoned (this affects all statistics determined by Size; see page 38).`);
          this.reduce("Size");
          this.boost("Unrest");
        },
        failure() {
          this.success();
          this.log(`😠 Some citizens become disgruntled refugees who refuse to leave the hex. Increase Unrest by add additional point and then attempt a DC 6 flat check. If you fail, the refugees become bandits, and during your next Event phase, you experience a Squatters event automatically in addition to any other event that might occur.`);
          this.boost("Unrest");
        },
        criticalFailure() {
          this.failure();
          this.log(`🥷🏻 Automatically experience a Bandit Activity event instead of a Squatters event`);
          this.boost("Unrest");
        },
      }),
      new LeadershipActivity({
        icon: "🏙️",
        name: "Establish Settlement",
        description: "You coordinate the group that founds a new settlement.",
        preprompt: [
          prereq(`The hex in which you’re establishing the settlement has been Cleared and doesn’t currently have a settlement (including a Freehold) in it.`),
          p(`You draw up plans, gather resources, entice citizens, and establish boundaries to found a brand new settlement in the hex. A settlement always starts as a village. See page 46 for further details about building settlements.`),
        ],
        criticalSuccessDescription: `Establish settlement`,
        successDescription: `Establish settlement if you reduce 1 Ability by 1`,
        failureDescription: `Establish settlement if you reduce 1 Ability by 2`,
        criticalFailureDescription: `Fail`,
        establish() {
          let namer = Maker.tag("input", {value: `Outpost ${this.domainSheet.data.settlements.length}`});

          this.log(
            "🎉 You establish the settlement. What'll you name it?",
            namer,
            Maker.tag("button", "Do it!", {click: (event) => {
              let name = namer.value;
              this.domainSheet.data.settlements.push(new DomainLeader({type: "Village", name: name}));
              event.target.disabled = true;
            }})
          );
        },
        conditionalSuccess(cost) {
          this.modOneAnd(
            `Reduce {ability} by {by} and establish the settlement`,
            {by: -cost, afterItems: [`Do not establish the settlement right now`], andThen: () => this.establish()});
        },
        criticalSuccess() {
          this.log(`😃 You establish the settlement largely with the aid of enthusiastic volunteers.`);
          this.establish();
        },
        success() {
          this.conditionalSuccess(1);
        },
        failure() {
          this.conditionalSuccess(2);
        },
        criticalFailure() { this.log(`❌ You fail to establish the settlement`) },
      }),
      new LeadershipActivity({
        icon: "🧎🏻‍♂️",
        name: "Pledge of Fealty",
        description: "You diplomatically invite another group to join the domain.",
        preprompt: [
          p(`When your representatives encounter freeholders, refugees, independent groups, or other bands of individuals gathered in the wilderness who aren’t already part of a nation, you can offer them a place in your domain, granting them the benefits of protection, security, and prosperity in exchange for their fealty. The benefits granted to your domain can vary wildly, but often manifest as one-time boons to your commodities or unique bonuses against certain types of events. The adventure text in this campaign offers numerous examples of groups who could accept a Pledge of Fealty. Certain groups will respond better (or worse) to specific approaches. The DC is the group’s Negotiation DC (see the sidebar on page 23).`),
        ],
        abilities: ["Loyalty"],
        dc: "Group DC", // TODO make this work
        criticalSuccessDescription: `Integrate; Claim Hex`,
        successDescription: `Integrate; Reduce 1 Ability by 1`,
        failureDescription: `Fail; Increase Unrest`,
        criticalFailureDescription: `Fail forever; Increase Unrest by 2`,
        criticalSuccess() {
          this.log(`🤝🏻 The group becomes part of your domain, granting the specific boon or advantage listed in that group’s entry.`);
          this.log(`🗺️ If you haven’t already claimed the hex in which the group dwells, you immediately do so, gaining Domain XP and increasing Size by 1 (this affects all statistics determined by Size; see page 38). If the hex doesn’t share a border with your domain, it becomes a secondary territory and checks involving this location take a Control penalty.`);
        },
        success() {
          this.log(`🤝🏻 The group becomes part of your domain, granting the specific boon or advantage listed in that group’s entry.`);
          this.log(`🗺️ You don’t claim the hex the group is in.`);
          this.modOneAnd(`Reduce {ability} by 1 to integrate the group into your domain`);
        },
        failure() {
          this.log(`❌ The group refuses to pledge to you at this time. You can attempt to get them to Pledge Fealty next turn.`);
          this.boost("Unrest");
        },
        criticalFailure() {
          this.log(`🤬 The group refuses to pledge to you— furthermore, it will never Pledge Fealty to your domain, barring significant in-play changes or actions by the PCs (subject to the GM’s approval). The group’s potentially violent rebuff of your offer increases Unrest by 2.`);
          this.boost({by: 2}, "Unrest");
        },
      }),
      new LeadershipActivity({
        icon: "🛣️",
        name: "Build Infrastructure",
        description: "You organize the effort to tame the land.",
        preprompt: p(hexMods),
        criticalSuccessDescription: `Build it; Boost 1 Ability you pick`,
        successDescription: `Build it`,
        failureDescription: `Build it if you Reduce 1 Ability by 1`,
        criticalFailureDescription: `Fail`,
        criticalSuccess() {
          this.log(`🚀 The whole domain rallies around this project.`);
          this.modOneAnd(`Boost {ability}`, {by: 1});
        },
        success() {
          this.log("🛣️ The target hex gains a road, bridge, fort, irrigation system, etc");
        },
        failure() {
          this.log("😰 Construction is unexpectedly difficult.");
          this.modOneAnd(`Reduce {ability} and build the feature`, {afterItems: [`Do not build`]});
        },
        criticalFailure() {
          this.log("❌ The construction process is a failure.");
        },
      }),
      new LeadershipActivity({
        icon: "💡",
        name: "Creative Solution",
        description: "You plan ahead to make the next action more successful.",
        preprompt: p(`You work with your domain’s scholars, thinkers, and practitioners of magical and mundane experimentation to come up with new ways to resolve issues when business as usual is just not working. Attempt a basic check.`),
        criticalSuccessDescription: `Bank a Reroll+2 for this turn, and if you don't use it get XP`,
        successDescription: `Bank a Reroll+2 for this turn`,
        failureDescription: `Fail`,
        criticalFailureDescription: `-1 penalty to Culture checks this + next turn`,
        criticalSuccess() {
          this.success();
          this.log(`⚙️ If you don’t use your Creative Solution by the end of this turn, you lose this benefit and gain 10 Domain XP instead.`);
        },
        success() {
          this.log(`🎉 You can call upon the solution to aid in resolving any Domain check made during the remainder of this turn. Do so when a check is rolled, but before you learn the result. Immediately reroll that check with a +2 circumstance bonus; you must take the new result.`);
          this.domainSheet.addConsumable({name: "Creative Solution", action: "reroll", description: "Reroll +2"});
        },
        failure() { this.log("❌ You spend time thinking the problem through, but no solution shows itself.") },
        criticalFailure() {
          this.log(`Your scholars and thinkers are so frustrated that you take a –1 circumstance penalty to Culture checks until the end of the NEXT Domain turn.`)
          this.addConsumable({name: "Status: Frustrated", description: "-1 Culture (Circumstance penalty)"});
        },
      }),
      new LeadershipActivity({
        icon: "👨🏻‍🌾",
        name: "Work the Land",
        description: "You lead a party to harvest the bounty of this realm.",
        preprompt: [
          p(`This boosts the ability above the one you roll:`),
          ol(`Rolling Stability will increase Loyalty`, `Rolling Loyalty will increase Economy`, `Rolling Economy will increase Culture`, `Rolling Culture will increase Stability`),
        ],
        criticalSuccessDescription: `Boost Ability by 2`,
        successDescription: `Boost Ability by 1`,
        failureDescription: `Fail`,
        criticalFailureDescription: `Unrest`,
        criticalSuccess() {
          this.log("🎁 You make good time and find plentiful resources!");
          this.boost({by: 2}, this.aboveAbility);
        },
        success() {
          this.log("🎉 A fruitful expedition");
          this.boost(this.aboveAbility);
        },
        failure() { this.log("❌ Your expedition yields naught") },
        criticalFailure() {
          this.log("💀 The expedition is a fiasco; some members do not return alive");
          this.boost("Unrest");
        },
      }),
      new LeadershipActivity({
        icon: "🎄",
        name: "Celebrate Holiday",
        description: "You organize a festival where the populace can enjoy themselves.",
        preprompt: [
          p(`You declare a day of celebration. Holidays may be religious, historical, martial, or simply festive, but all relieve your citizens from their labors and give them a chance to make merry at the domain’s expense.`),
          p(`This boosts the ability below the one you roll:`),
          ol(`Rolling Culture will increase Economy`, `Rolling Economy will increase Loyalty`, `Rolling Loyalty will increase Stability`, `Rolling Stability will increase Culture`),
        ],
        criticalSuccessDescription: `Boost Ability by 2`,
        successDescription: `Boost Ability by 1`,
        failureDescription: `Fail`,
        criticalFailureDescription: `Unrest`,
        criticalSuccess() {
          this.log(`🎁 Your holiday is a delight to your people. The event is expensive, but incidental income from the celebrants covers the cost.`);
          this.boost({by: 2}, this.belowAbility);
        },
        success() {
          this.log(`🎉 Your holiday is a success.`);
          this.boost(this.belowAbility)
        },
        failure() {
          this.log("❌ The holiday passes with little enthusiasm, but is still expensive.");
          this.modOneAnd(`Pay for the events with {ability}`);
        },
        criticalFailure() {
          this.log("🃏 Your festival days are poorly organized, and the citizens actively mock your failed attempt to celebrate. A random ability is reduced.")
          this.reduce(Ability.random);
        },
      }),
      new LeadershipActivity({
        icon: "🥺",
        name: "Request Foreign Aid",
        description: "You entreat aid from a nation you already have diplomatic relations with.",
        preprompt: [
          prereq(`You have diplomatic relations with the group you are requesting aid from`),
          p(`When disaster strikes, you send out a call for help to another nation with whom you have diplomatic relations. The DC of this check is equal to the other group’s Negotiation DC +2 (see the sidebar on page 23).`),
        ],
        dc: "Group DC", // TODO make this work
        criticalSuccessDescription: `Boost an Ability you pick by 2; +4 bonus to future roll`,
        successDescription: `Boost an Ability you pick by 2`,
        failureDescription: `Boost a random Ability by 1`,
        criticalFailureDescription: `1d4 Unrest`,
        criticalSuccess() {
          this.success();
          this.log(`🎁 In addition, your ally’s aid grants a +4 circumstance bonus to any one Domain check attempted during the remainder of this turn. You can choose to apply this bonus to any Domain check after the die is rolled, but must do so before the result is known.`);
        },
        success() {
          this.log(`🎉 Your ally sends the aid you need.`);
          this.modOneAnd(`Boost {ability} by 2`, {by: 2});
        },
        failure() {
          this.log(`🥡 Your ally sends what aid they can.`);
          this.boost(Ability.random);
        },
        criticalFailure() {
          this.log(`💥 Your ally is tangled up in its own problems and is unable to assist you, is insulted by your request for aid, or might even have an interest in seeing your domain struggle against one of your ongoing events. Whatever the case, your pleas for aid make your domain look desperate. You gain no aid, but you do increase Unrest by 1d4.`);
          this.boost({by: [1, 2, 3, 4].random()}, "Unrest");
        },
      }),
      new LeadershipActivity({
        icon: "🎪",
        name: "Bread and Circuses",
        description: "You entertain the populace.",
        criticalSuccessDescription: `Reduce Unrest; Gain Fame`,
        successDescription: `Reduce Unrest`,
        failureDescription: `Reduce Unrest; Reduce an Ability you pick by 1`,
        criticalFailureDescription: `Reduce a random Ability by 1`,
        criticalSuccess() {
          this.success();
          this.log("🗣️ People come from far and wide to join the festivities, and carry work back to their own lands.")
          this.addFame();
        },
        success() {
          this.log(`🎉 The people enjoy the distraction.`);
          this.reduce("Unrest");
        },
        failure() {
          this.log(`💸 The people enjoy the distraction, but it's not cheap.`);
          this.modOneAnd(`Pay with {ability}`, {andThen: () => this.reduce("Unrest")});
        },
        criticalFailure() {
          this.log(`🔥 The merriment gets out of hand and riots ensue.`);
          this.reduce(Ability.random);
        },
      }),
      new LeadershipActivity({
        icon: "👀",
        name: "Oversee",
        description: "You visit a settlement to ensure vital work gets done.",
        criticalSuccessDescription: `Do a Civic Activity; Increase Stability or Loyalty by 1`,
        successDescription: `Do a Civic Activity`,
        failureDescription: `Do a Civic Activity; Increase Unrest`,
        criticalFailureDescription: `Increase Unrest; Decrease Stability or Loyalty by 1`,
        bumpCivicActivities() {
          this.closest("domain-activity-log").addBonusCivicActivity();
        },
        criticalSuccess() {
          this.success();
          this.log(`👍🏻 Your vigilant oversight of this successful project inspires the domain.`);
          this.boost(["Stability", "Loyalty"].random());
        },
        success() {
          this.log(`🎉 You oversee the project to completion.`);
          this.bumpCivicActivities();
        },
        failure() {
          this.log(`😠 The project is completed, but the settlement is annoyed by your methods.`);
          this.bumpCivicActivities();
          this.boost("Unrest");
        },
        criticalFailure() {
          this.log(`🤬 The citizenry revolt at your heavy-handedness and refuse to help.`);
          this.boost("Unrest");
          this.boost(["Stability", "Loyalty"].random());
        },
      }),
      new LeadershipActivity({
        icon: "🚋",
        name: "Train Lieutenant",
        description: "You work with an NPC leader to increase their capacity.",
        abilities: ["Loyalty"],
        criticalSuccessDescription: `NPC Leader gets 2 activitys/turn, or success`,
        successDescription: `Leader adds 2 activities to their repertiore`,
        failureDescription: `Fail`,
        criticalFailureDescription: `Leader abandons their post`,
        criticalSuccess() {
          let eligibleLeaders = this.domainSheet.data.leaders.filter(l => l.activitiesPerTurn < 2);
          if (eligibleLeaders.length > 0) {
            this.log(`🧠 An apt pupil! They gain a second activity per turn.`);
            this.pickOne(eligibleLeaders, {
              format: (leader) => leader.name,
              andThen: (picked) => {
                this.log(`${picked.name} can now do 2 activities per turn`);
                picked.activitiesPerTurn = 2;
                this.domainSheet.leadersComponent.render();

              },
            });
          } else { this.success() }
        },
        success() {
          this.log(`🤯 You teach them more about leadership. Add two actions to those available to them.`);
          this.log(`🎗️ TODO we should actually track that.`);
        },
        failure() {
          this.log(`😪 You might not be a great teacher or they might not be a good student, but this didn't work.`);
        },
        criticalFailure() {
          this.log(`🤬 You alientate your pupil and they leave their post. They will not return until you apologize.`);
        },
      }),
      new LeadershipActivity({
        icon: "🛡️",
        name: "Hire Adventurers",
        description: "You pay people to tackle an ongoing event.",
        abilities: ["Loyalty"],
        preprompt: (activity) => {return Maker.tag("p",
          p(`While the PCs can strike out themselves to deal with ongoing events, it’s often more efficient to Hire Adventurers. When you Hire Adventurers to help end an ongoing event, the DC is equal to your Control DC adjusted by the event’s level modifier.`),
          activity.modOneAnd(`Pay them with {ability}`, {prompt: "Before you roll, pay the mercs:"}),
        )},
        criticalSuccessDescription: `Continuous Event ends`,
        successDescription: `+2 bonus to end event`,
        failureDescription: `Fail`,
        criticalFailureDescription: `Fail; Can't Hire Adventurers for this Event`,
        criticalSuccess() {
          this.log(`⚔️ You end the continuous event.`);
        },
        success() {
          this.log(`🔪 The continuous event doesn’t end, but you gain a +2 circumstance bonus to resolve the event during the next Event phase`);
          this.addConsumable({name: "Status: Hired Hands", description: "+2 Event Resolution (Circumstance bonus)"});
        },
        failure() {
          this.log(`❌ You fail to end the continuous event`);
        },
        criticalFailure() {
          this.failure();
          this.log(`🙊 Word spreads quickly through the region—you can no longer attempt to end this continuous event by Hiring Adventurers.`);
        },
      }),
      new LeadershipActivity({
        icon: "🔮",
        name: "Prognostication",
        description: "You use the mystic arts to forsee future events and prepare for them.",
        preprompt: p(`Your domain’s spellcasters read the omens and provide advice on how best to prepare for near-future events. Attempt a basic check.`),
        abilities: ["Culture"],
        criticalSuccessDescription: `+2 bonus to resolve event`,
        successDescription: `+1 bonus to resolve event`,
        failureDescription: `Fail`,
        criticalFailureDescription: `-1 penalty to resolve event`,
        criticalSuccess() {
          this.log(`🧿 Gain a +2 circumstance bonus to the check to resolve the event.`);
          this.addConsumable({name: "Status: Prepared 2", description: "+2 Event Resolution (Circumstance bonus)"});
        },
        success() {
          this.log(`🎴 Gain a +1 circumstance bonus to the check to resolve the event.`);
          this.addConsumable({name: "Status: Prepared 1", description: "+1 Event Resolution (Circumstance bonus)"});
        },
        failure() {
          this.log(`❌ Your spellcasters divine no aid.`);
        },
        criticalFailure() {
          this.log(`💥 Your spellcasters provide inaccurate readings of the future. Take a -1 circumstance penalty to the check to resolve the event`);
          this.addConsumable({name: "Status: Ill-Prepared", description: "-1 Event Resolution (Circumstance bonus)"});
        },
      }),
      new LeadershipActivity({
        icon: "🎨",
        name: "Create Masterpiece",
        description: "You use the mystic arts to forsee future events and prepare for them.",
        abilities: ["Culture"],
        preprompt: p(`You encourage your domain’s artists to create and display a masterful work of art to bolster your domain’s reputation. Attempt a basic check; the result affects either Fame or Infamy (depending on the type of domain you’re running). Create a Masterpiece may be attempted only once per domain turn regardless of the number of leaders pursuing activities.`),
        criticalSuccessDescription: `Gain Fame; Boost random Ability by 1`,
        successDescription: `Gain Fame`,
        failureDescription: `Fail`,
        criticalFailureDescription: `Fail; Lose Fame OR 1d4 Unrest`,
        criticalSuccess() {
          this.success();
          this.log(`💰 There is a constant stream of people coming to see it for themselves.`);
          this.boost(Ability.random);
        },
        success() {
          this.log(`🗿 A stunning work of art is created, and people speak of it far and wide.`);
          this.addFame();
        },
        failure() {
          this.log(`❌ Your attempt to create a masterpiece fails`);
        },
        criticalFailure() {
          this.log(`💥 Not only does your attempt to create a masterpiece fail, it does so in a dramatic and humiliating way. Lose 1 Fame or Infamy point; if you have no Fame or Infamy points to lose, instead gain 1d4 Unrest.`);
          let consumed = this.domainSheet.useConsumable({name: "Fame"});
          if (consumed) {
            this.log("🤡 Fame reduced by 1");
          } else {
            this.boost({by: [1, 2, 3, 4].random()}, "Unrest");
          }
        },
      }),
    ]
  }
}
customElements.define("leadership-activity", LeadershipActivity);

export class CivicActivity extends Activity {
  static get all() {
    let {p, ol} = Maker;

    return [
      new CivicActivity({
        icon: "💰",
        name: "Contribute",
        description: "This settlement is hard at work.",
        prompt: "",
        possibleOutcomes: (ability) => ability.modOneAnd(`Increase {ability}`, {by: 1}),
      }),
      new CivicActivity({
        icon: "🚧",
        name: "Build Structure",
        description: "This settlement has an idea!",
        preprompt: p(`Add building's cost to the DC`),
        abilities: ["Economy"],
        criticalSuccessDescription: `Build it; Boost a random Ability by 1`,
        successDescription: `Build it`,
        failureDescription: `Fail`,
        criticalFailureDescription: `Fail; Reduce a random Ability by 1`,
        criticalSuccess() {
          this.log("😂 Everyone rallies to help.");
          this.boost(Ability.random);
          this.success();
        },
        success() {
          this.log("🏛️ You built that thing!");
          this.log("📈 If there are now 2+ buildings in the settlement, it's a town. Get Milestone XP!");
          this.log("📈 If there are now 4+ buildings in the settlement, it's a city. Get Milestone XP!");
          this.log("📈 If there are now 8+ buildings in the settlement, it's a metropolis. Get Milestone XP!");
        },
        failure() { this.log("❌ You fail to build the building") },
        criticalFailure() {
          this.log("💀 Some workers are killed in a construction accident");
          this.reduce(Ability.random);
          this.failure();
        },
      }),
    ];
  }
}
customElements.define("civic-activity", CivicActivity);

