import { callOrReturn, withDiffs } from "../helpers.js";

import { addTransient } from "./utils.js";
import { Actor } from "./actor.js";
import { Ability } from "./abilities.js";
import { Structure } from "./structure.js";

import { AvalableStructures } from "../components/available_structures.js";
import { StructureDescription } from "../components/structure_description.js";

class ActivityDecision {
  constructor(properties, activity) {
    Object.defineProperty(this, "activity", {enumerable: false, value: activity});
    addTransient(this, {value: {}});
    Object.defineProperty(this, "options", {enumerable: true,
      get() { return callOrReturn(this.transient.options, this) || [] },
      set(value) { this.transient.options = value },
    });

    let templateName = properties.template || properties.name || properties;
    let template = {
      Roll: {
        saveAs: "ability",
        options: Ability.all,
        displayValue: (ability) => `<ability-roll ability="${ability}">${ability}</ability-roll>`,
        description({decision}) {
          return Maker.tag("difficulty-class", {base: this.domainSheet?.controlDC || 15, ...(decision?.difficultyClassOptions || {})}).outerHTML;
        },
      },
      Outcome: {
        saveAs: "outcome",
        options: ["criticalSuccess", "success", "failure", "criticalFailure"],
        displayValues: {
          criticalSuccess: `Critical Success`,
          success: `Success`,
          failure: `Failure`,
          criticalFailure: `Critical Failure`,
        },
        picked: (outcome) => {
          activity[outcome]?.call(activity);
        }
      },
      Payment: {
        options: Ability.all,
        displayValue(ability) { return `Reduce ${ability} by ${this.amount} to integrate the group`},
        amount: 1,
        abilityPaid(ability, {activity, decision}) {},
        nonAbilityPaid(payment, {activity, decision}) {},
        picked(payment, {activity, decision}) {
          if (Ability.all.includes(payment)) {
            activity.reduce({by: -decision.amount}, payment);
            decision.abilityPaid(payment, {activity, decision});
          } else {
            decision.nonAbilityPaid(payment, {activity, decision});
          }
        },
      },
    }[templateName] || {};
    let props = {
      name: templateName,
      saveAs: templateName.toLowerCase(),
      saveValue: (value) => value,
      displayValue: (value) => (this.displayValues || {})[value] || value,
      summaryValue: (value) => (this.summaries || {})[value],
      mutable: () => !this.resolved,
      ...template,
      ...properties};
    Object.assign(this, props);

    this.displayValues ||= this.options.toDictionary(o => [o, this.displayValue(o)]);
    this.summaries ||= this.options.toDictionary(o => [o, this.summaryValue(o)]);

    this.#addSaveAsProperty(activity, props.saveAs);
    this.#addValueProperty(activity, `${props.saveAs}Value`);
    this.#addDisplayProperty(activity, `${props.saveAs}Display`);
    this.#addSummaryProperty(activity, `${props.saveAs}Summary`);
  }

  #addSaveAsProperty(activity, saveAs) {
    let decision = this;

    Object.defineProperty(activity, saveAs, {
      configurable: true,
      enumerable: true,
      get() { return activity.transient[`_${saveAs}`] },
      set(value) {
        if (![...decision.options, null, undefined].includes(value)) {
          throw TypeError(`Canot set ${saveAs} to ${value}; try one of ${JSON.stringify(decision.options)}`)
        }
        if (activity.transient[`_${saveAs}`] === value) { return }

        activity.transient[`_${saveAs}`] = value;
        activity.callbacksEnabled && decision.picked?.call(activity, value, {decision, activity});
      },
    });
  }

  #addValueProperty(activity, saveAsValue) {
    let decision = this;

    Object.defineProperty(activity, saveAsValue, {
      configurable: true,
      get() { return decision.saveValue(decision.resolution) },
      set(value) { decision.resolution = decision.options.find(option => decision.saveValue(option) === value) },
    });
  }

  #addDisplayProperty(activity, saveAsDisplay) {
    let decision = this;

    Object.defineProperty(activity, saveAsDisplay, {
      configurable: true,
      get() { return decision.displayValue(decision.resolution) },
      set(value) { decision.resolution = decision.options.find(option => decision.displayValue(option) === value) },
    });
  }

  #addSummaryProperty(activity, saveAsSummary) {
    let decision = this;

    Object.defineProperty(activity, saveAsSummary, {
      configurable: true,
      get() { return decision.summaryValue(decision.resolution) },
    });
  }

  get dictionary() { return this.options.toDictionary(o => [this.saveValue(o), this.displayValue(o)]) }

  get resolution() { return this.activity[this.saveAs] }
  set resolution(value) { this.activity[this.saveAs] = value }

  get mutable() { return callOrReturn(this._mutable, this.activity, this.activity, this) }
  set mutable(value) { this._mutable = value }

  get resolved() { return this.options.length === 0 || !!this.resolution }
}

export class Activity {
  constructor(properties) {
    this.log = [];
    addTransient(this, {value: {}});

    let [templateName, props] = ("string" === typeof properties) ? [properties, {}] : [properties.name, properties];
    props = {
      decisions: [{name: "Roll"}, {name: "Outcome"}],
      ...Activity.template(templateName),
      ...props};
    Object.assign(this, props);

    // evaluate the template's lazy-loaded properties
    "description".split(" ").forEach(prop =>
      this[prop] && this[prop].call && (this[prop] = this[prop]())
    );

    this.name ||= templateName;
    this.id ||= `activity-${this.name}-${crypto.randomUUID()}`;

    Object.defineProperty(this, `callbacksEnabled`, {get() {return true}});
  }

  /////////////////////////////////////////////// Associations

  // TODO how can we do this without hitting the DOM?
  get domainSheet() { return document.querySelector("domain-sheet") }
  get actor() { return this.domainSheet.actor(this.actorId) }

  /////////////////////////////////////////////// Decisions & Resolution

  get decisions() { return this.transient.decisions }
  set decisions(value) {
    this.transient.decisions = value.map(v => v.constructor === ActivityDecision ? v : new ActivityDecision(v, this));
  }
  decision(name) { return this.decisions.find(d => d.name === name) }

  get resolved() { return this.decisions.reduce((all, d) => all && d.resolved, true) }
  
  /////////////////////////////////////////////// Actions

  boost(...abilities) {
    let {by} = abilities[0];
    by && abilities.shift();
    by ??= 1;
    abilities.forEach(ability => {
      this.domainSheet.boost({by}, ability);
      this.info(`📈 Boosted ${ability} by ${by} <small>, to ${this.domainSheet.data[ability.toLowerCase()]}</small>`);
    });
  }

  reduce(...abilities) {
    let {by} = abilities[0];
    by && abilities.shift();
    by ??= -1;
    abilities.forEach(ability => {
      this.domainSheet.boost({by}, ability);
      this.warning(`📉 Reduced ${ability} by ${Math.abs(by)} <small>, to ${this.domainSheet.data[ability.toLowerCase()]}</small>`);
    });
  }

  addConsumable(attrs, logMessage) {
    this.info(logMessage || `➕ Added ${attrs.name}`);
    this.domainSheet.addConsumable(attrs);
  }

  addFame() {
    this.info("👩🏻‍🎤 Add fame");
    this.domainSheet.addFame();
  }

  addBonusActivity(actor) {
    this.info(`🛟 Added bonus activity for ${actor.name}`);
    actor.bonusActivities += 1;
  }

  requirePayment(properties = {}) {
    this.decisions.push(new ActivityDecision({template: "Payment", ...properties}, this));
  }

  /////////////////////////////////////////////// Logging

  debug(html) { this.log.push({level: "debug", html}) }
  info(html) { this.log.push({level: "info", html}) }
  warning(html) { this.log.push({level: "warning", html}) }
  error(html) { this.log.push({level: "error", html}) }
  
  /////////////////////////////////////////////// Templates

  static template(name) { return this.templates.find(s => s.name === name) }
  
  static get names() { return this._names ||= this.templates.map(s => s.name) }
  static get templates() {
    let hexMods = `<p>Additional modifier based on the hex's worst terrain: Mountains: -4; Swamps: -3; Forests: -2; Hills: -1; Plains: -0.</p>`;
    let hexDCOptions = [
      {name: "Mountains", value: 4},
      {name: "Swamps", value: 3},
      {name: "Forests", value: 2},
      {name: "Hills", value: 1},
      {name: "Plains", value: 0},
    ];
    
    return this._templates ||= [{
      type: "system",
      icon: "👑",
      actorId: "system",
      name: "Welcome, Domainkeeper",
      summary: "You've got a new domain. Let's see how it goes.",
      decisions: [],
      description: () => `
        <p>💡 Here's a little app to do the math so we can see if this system works. Is it too easy? Too hard? Do these activities make sense? Poke around and play to find out!</p>
        <p>👑 Click the buttons above to do activities. You can cancel activities until you click buttons to roll or spend, so feel free to explore.</p>
        <p>♻️ When you're out of activities each turn, click "End turn" to see a summary of what's changed and start the next turn.</p>
        <p>💾 Warning! At the end of every turn, we auto-save domain stats (the sidebar) but not the action history (the main content). So keep that tab open if you care about the details! If you want to start again, click the ❌ at the top of the domain sidebar!</p>
        <p>🎯 Your goal is to keep running and expanding the Kingdom while making sure no Ability drops to 0 and Unrest never gets to 20.</p>
      `,
    }, {
      type: "system",
      icon: "🌱",
      actorId: "system",
      name: "Domain Concept",
      summary: "Let's pick some starting stats",
      description: () => `
        <p>Use the buttons below to pick your stats, or allocate them as you like.</p>
        <ol>
          <li>Start each ability at 2</li>
          <li>Heartland will boost one stat by 1</li>
          <li>Charter will boost two different stats by 1 each</li>
          <li>Government will boost three different stats by 1 each</li>
        </ol>
        <p>This should end with a 5/4/3/2 spread if you want to max one stat.</p>
        <p>But maybe that makes things too hard or too easy! We ca adjust this!</p>
      `,
      decisions: (() => {
        let boosts = {
          // Heartlands
          Forest: ["Culture"],
          Swamp: ["Culture"],
          Hill: ["Loyalty"],
          Plain: ["Loyalty"],
          Lake: ["Economy"],
          River: ["Economy"],
          Mountain: ["Stability"],
          Ruins: ["Stability"],
    
          // Charters
          Conquest: ["Loyalty"],
          Expansion: ["Culture"],
          Exploration: ["Stability"],
          Grant: ["Economy"],
          Open: [],
    
          // Governments
          Despotism: ["Stability", "Economy"],
          Feudalism: ["Stability", "Culture"],
          Oligarchy: ["Loyalty", "Economy"],
          Republic: ["Stability", "Loyalty"],
          Thaumacracy: ["Economy", "Culture"],
          Yeomanry: ["Loyalty", "Culture"],
        };
        let summaryValue = (option) => {
          let abilities = boosts[option] || [];
          return abilities.length === 0 ? `Free boost` : `Boost ${abilities.join(" and ")}`;
        };
        let picked = (option, {activity}) => activity.boost(...boosts[option]);

        return [{
          name: "Heartland",
          saveAs: "heartland",
          options: "Forest Swamp Hill Plain Lake River Mountain Ruins".split(" "),
          picked,
          summaryValue,
        }, {
          name: "Charter",
          saveAs: "charter",
          options: "Conquest Expansion Exploration Grant Open".split(" "),
          picked,
          summaryValue,
        }, {
          name: "Free Charter Boost",
          saveAs: "freeCharterBoost",
          options: Ability.all,
          picked: (ability, {activity}) => activity.boost(ability),
        }, {
          name: "Government",
          saveAs: "government",
          options: "Despotism Feudalism Oligarchy Republic Thaumacracy Yeomanry".split(" "),
          picked,
          summaryValue,
        }, {
          name: "Free Government Boost",
          saveAs: "freeGovernmentBoost",
          options: Ability.all,
          picked: (ability, {activity}) => activity.boost(ability),
        }];
      })(),
    }, {
      type: "system",
      actorId: "system",
      icon: "🗺️",
      name: "Domain Summary",
      summary: `A report on the state of your domain`,
      decisions: [],
      description() {
        let lastSummary = this.domainSheet.previousTurn?.entries?.find(e => e.name === this.name);
        let abilityScores = this.abilityScores = this.domainSheet.abilityScores;
        let statScores = this.statScores = this.domainSheet.statScores;
        
        // TODO style
        // TODO add smoothScroll action
        return `
          <p>💾 Domain saved</p>
          <header>What Happened</header>
          <div class="entries-summary">
          ${(this.domainSheet.currentTurn?.entries || []).map(entry =>
            `<a
              href="#${entry.id}"
              title="${entry.name}"
              class="entry-summary icon-link"
              data-type="${entry.type}"
              data-used-ability="${entry.ability}"
              data-outcome="${entry.outcome}"
              data-action="smoothScroll"
              >${entry.icon}</a>`
          ).join("")}
          </div>
          <header>Stats Snapshot</header>
          ${Maker.dl(withDiffs(abilityScores, lastSummary?.abilityScores), {class: "dl-oneline"}).outerHTML}
          ${Maker.dl(withDiffs(statScores, lastSummary?.statScores), {class: "dl-oneline"}).outerHTML}
        `;
      },
    }, {
      type: "system",
      actorId: "system",
      icon: "🔧",
      name: "Nudge",
      summary: "You tweaked something",
      decisions: [],
    }, {
      type: "leadership",
      icon: "🧭",
      name: "Reconnoiter Hex",
      summary: "You hire a team to survey a particular hex.",
      // TODO limit to after you've built an appropriate structure?
      decisions: [{
        name: "Roll",
        options: ["Economy", "Stability"],
        difficultyClassOptions: {options: JSON.stringify(hexDCOptions)},
      }, {
        name: "Outcome",
        summaries: {
          criticalSuccess: `Reconnoiter hex and boost stability`,
          success: `Reconnoiter hex`,
          failure: `Fail`,
          criticalFailure: `Unrest`,
        },
      }],
      criticalSuccess() {
        this.success();
        this.info("🗺️ The world feels a wee bit safer now.");
        this.boost("Stability")
      },
      success() { this.info("🎉 You successfully reconnoiter the hex.") },
      failure() { this.warning("❌ You fail to reconnoiter the hex.") },
      criticalFailure() {
        this.error(`💀 You catastrophically fail to reconnoiter the hex and several members of the party lose their lives.`);
        this.boost("Unrest");
      },
    }, {
      type: "leadership",
      icon: "👷🏻‍♂️",
      name: "Clear Hex",
      summary: "You lead the effort to clear out the dangers in an already-reconnoitered hex.",
      description() {
        return `
          <p>Engineers and mercenaries attempt to prepare a hex to serve as the site for a settlement, or they work to remove an existing improvement, a dangerous hazard, or an encounter.</p>
          <ol>
            <li>If you’re trying to prepare a hex for a settlement or demolish an improvement you previously built (or that was already present in the hex), use Economy.</li>
            <li>If you’re trying to remove a hazard or encounter, use Stability. The DC of this check is set by the highest level creature or hazard in the hex (as set by Table 10–5: DCs by Level, on page 503 of the Pathfinder Core Rulebook).</li>
            <li>If the hex is outside your domain, increase the DC by 2.</li>
          </ol>
          ${hexMods}`;
      },
      decisions: [{
        name: "Roll",
        options: ["Economy", "Stability"],
        difficultyClassOptions: {
          selected: "Outside Domain",
          options: JSON.stringify([
            {name: "Outside Domain", value: 2},
            ...hexDCOptions,
          ]),
        },
      }, {
        name: "Outcome",
        summaries: {
          criticalSuccess: `Clear hex and boost economy`,
          success: `Clear hex`,
          failure: `Fail`,
          criticalFailure: `Unrest`,
        }
      }],
      criticalSuccess() { this.success(); this.info("🐻 You brought back spoils!"); this.boost("Economy") },
      success() { this.info("🎉 You successfully clear the hex.") },
      failure() { this.warning("❌ You fail to clear the hex.") },
      criticalFailure() { this.info("💀 You catastrophically fail to clear the hex and several workers lose their lives."); this.boost("Unrest") },
    }, {
      type: "leadership",
      icon: "🚩",
      name: "Claim Hex",
      summary: "You bring the cleared hex into the domain.",
      // TODO limit to 1/turn until level 4, then 2/turn until level 9, then 3/turn
      description() {
        return `
          <p><strong>Required:</strong> You have Reconnoitered the hex to be claimed during hexploration. This hex must be adjacent to at least one hex that’s already part of your domain. If the hex to be claimed contains dangerous hazards or monsters, they must first be cleared out—either via standard adventuring or the Clear Hex activity.</p>
          <p>Your surveyors fully explore the hex and attempt to add it into your domain.</p>
        `
      },
      decisions: [{
        name: "Roll",
        options: ["Economy", "Stability"]
      }, {
        name: "Outcome",
        summaries: {
          criticalSuccess: `Claim hex; Boost a random stat`,
          success: `Claim hex`,
          failure: `Fail`,
          criticalFailure: `-1 Stability for rest of turn`,
        }
      }],
      criticalSuccess() {
        this.success();
        let [ability, message] = [
          ["Culture", "🎵 The speed of your occupation becomes a popular folk song around the domain."],
          ["Economy", "🦌 A grand hunt in the new territory brings great wealth to the domain."],
          ["Loyalty", "🎖️ The pioneers tell of your exploits and spread word of your deeds across the domain ."],
          ["Stability", "🐴 The integration goes flawlessly thanks to your careful planning."],
        ].random();
        this.info(message);
        this.boost(ability);
      },
      success() {
        this.info(`🎉 You claim the hex and immediately add it to your territory, increasing Size by 1 (this affects all statistics determined by Size; see page 38).`);
        this.boost("Size");
      },
      failure() { this.warning(`❌ You fail to claim the hex`) },
      criticalFailure() {
        this.error(`💀 You fail to claim the hex, and a number of early settlers and explorers are lost, causing you to take a –1 circumstance penalty to Stability-based checks until the end of your next turn.`);
        this.addConsumable({name: "Status: Disaster", description: "-1 Stability (Circumstance penalty)"});
      },
    }, {
      type: "leadership",
      icon: "🏃‍♂️",
      name: "Abandon Hex",
      summary: "You renounce the domain's claim to a hex.",
      decisions: [{
        name: "Roll",
        options: ["Stability"],
      }, {
        name: "Outcome",
        summaries: {
          criticalSuccess: `Abandon Hex; Economy boost`,
          success: `Abandon hex; Unrest`,
          failure: `Abandon hex; Unrest + 2; Possible Squatters event`,
          criticalFailure: `Abandon hex; Unrest +3; Definite Bandit Activity Event`,
        },
      }],
      description() {
        return `<p><strong>Requirement:</strong> The hex to be abandoned must be controlled.</p>
          <p>After careful consideration, you decide that you would rather not hold onto a particular hex as part of your claimed territory. You renounce your claim to it and pull back any settlers or explorers.You can abandon more than one hex at a time, but each additional hex you abandon increases the DC of this check by 1.</p>
          <p><strong>Special:</strong> The Unrest gained from abandoning a hex doubles if it includes a settlement. A settlement in an abandoned hex becomes a Freehold (page 41).</p>
        `;
      },
      criticalSuccess() {
        this.success();
        this.info(`⚱️ Settlers and explorers return and resettle elsewhere in your domain, bringing with them bits of salvage from the abandoned hexes.`)
        this.boost("Economy"); // this is the old `Gain 1 RP per abandoned hex`
      },
      success() {
        this.info(`🎉 You abandon the hex or hexes, decreasing Size by 1 per hex abandoned (this affects all statistics determined by Size; see page 38).`);
        this.reduce("Size");
        this.boost("Unrest");
      },
      failure() {
        this.success();
        this.warning(`😠 Some citizens become disgruntled refugees who refuse to leave the hex. Increase Unrest by add additional point and then attempt a DC 6 flat check. If you fail, the refugees become bandits, and during your next Event phase, you experience a Squatters event automatically in addition to any other event that might occur.`);
        this.boost("Unrest");
      },
      criticalFailure() {
        this.failure();
        this.error(`🥷🏻 Automatically experience a Bandit Activity event instead of a Squatters event`);
        this.boost("Unrest");
      },
    }, {
      type: "leadership",
      icon: "🏙️",
      name: "Establish Settlement",
      summary: "You coordinate the group that founds a new settlement.",
      description() {
        return `<p><strong>Requirement:</strong> The hex in which you’re establishing the settlement has been Cleared and doesn’t currently have a settlement (including a Freehold) in it.</p>
          <p>You draw up plans, gather resources, entice citizens, and establish boundaries to found a brand new settlement in the hex. A settlement always starts as a village. See page 46 for further details about building settlements.</p>
        `;
      },
      decisions: [{
        name: "Roll",
      }, {
        name: "Outcome",
        summaries: {
          criticalSuccess: `Establish settlement`,
          success: `Establish settlement if you reduce 1 Ability by 1`,
          failure: `Establish settlement if you reduce 1 Ability by 2`,
          criticalFailure: `Fail`,
        },
      }, {
        name: "Payment",
        options: [...Ability.all, "abandoned"],
        displayValue(ability) {
          return {
            abandoned: `Abandon the attempt and pay nothing`,
            free: `Volunteers pick up the tab`,
          }[ability] || `Reduce ${ability} by ${this.amount} and establish the settlement`},
        abilityPaid(ability, {activity}) { activity.establish() },
        nonAbilityPaid(payment, {activity}) {
          if (payment === "abandoned") {
            activity.warning("🚫 You do not establish a settlement");
          } else if (payment === "free") {
            activity.establish();
          }
        },
      }],
      establish() {
        let name = prompt("What will you name the settlement?");
        this.info(`🎉 You establish the settlement of ${name}`);
        this.domainSheet.data.settlements.push(new Actor({type: "Village", name: name}));
      },
      conditionalSuccess(cost) {
        this.decision("Payment").amount = cost;
      },
      criticalSuccess() {
        this.info(`😃 You establish the settlement largely with the aid of enthusiastic volunteers.`);

        let payment = this.decision("Payment");
        payment.amount = 0;
        payment.options.push("free");
        payment.resolution = "free";
      },
      success() {
        this.conditionalSuccess(1);
      },
      failure() {
        this.conditionalSuccess(2);
      },
      criticalFailure() {
        this.decision("Payment").resolution = "abandoned";
      },
    }, {
      type: "leadership",
      icon: "🧎🏻‍♂️",
      name: "Pledge of Fealty",
      summary: "You diplomatically invite another group to join the domain.",
      description() { return `
        <p>When your representatives encounter freeholders, refugees, independent groups, or other bands of individuals gathered in the wilderness who aren’t already part of a nation, you can offer them a place in your domain, granting them the benefits of protection, security, and prosperity in exchange for their fealty. The benefits granted to your domain can vary wildly, but often manifest as one-time boons to your commodities or unique bonuses against certain types of events. The adventure text in this campaign offers numerous examples of groups who could accept a Pledge of Fealty. Certain groups will respond better (or worse) to specific approaches. The DC is the group’s Negotiation DC (see the sidebar on page 23).</p>
      `},
      decisions: [{
        name: "Roll",
        options: ["Loyalty"],
      }, {
        name: "Outcome",
        summaries: {
          criticalSuccess: `Integrate; Claim Hex`,
          success: `Integrate; Reduce 1 Ability by 1`,
          failure: `Fail; Increase Unrest`,
          criticalFailure: `Fail forever; Increase Unrest by 2`,
        },
      }],
      dc: "Group DC", // TODO make this work
      criticalSuccess() {
        this.info(`🤝🏻 The group becomes part of your domain, granting the specific boon or advantage listed in that group’s entry.`);
        this.info(`🗺️ If you haven’t already claimed the hex in which the group dwells, you immediately do so, gaining Domain XP and increasing Size by 1 (this affects all statistics determined by Size; see page 38). If the hex doesn’t share a border with your domain, it becomes a secondary territory and checks involving this location take a Control penalty.`);
      },
      success() {
        this.info(`🤝🏻 The group becomes part of your domain, granting the specific boon or advantage listed in that group’s entry.`);
        this.warning(`🗺️ You don’t claim the hex the group is in.`);
        this.requirePayment();
      },
      failure() {
        this.warning(`❌ The group refuses to pledge to you at this time. You can attempt to get them to Pledge Fealty next turn.`);
        this.boost("Unrest");
      },
      criticalFailure() {
        this.error(`🤬 The group refuses to pledge to you— furthermore, it will never Pledge Fealty to your domain, barring significant in-play changes or actions by the PCs (subject to the GM’s approval). The group’s potentially violent rebuff of your offer increases Unrest by 2.`);
        this.boost({by: 2}, "Unrest");
      },
    }, {
      type: "civic",
      icon: "💰",
      name: "Contribute",
      summary: "This settlement is hard at work.",
      decisions: [{
        name: "Contribution",
        saveAs: "contribution",
        options: () => Ability.all,
        picked: (ability, {activity}) => activity.boost(ability),
      }],
    }, {
      type: "civic",
      icon: "🚧",
      name: "Build Structure",
      summary: "Construct something in this settlement that will have long-term benefits",
      description: () => `Add building's cost to the DC`,
      decisions: [{
        name: "Pick a structure",
        description: "Choose a structure you want to build.",
        saveAs: "structureName",
        options: () => new AvalableStructures().names,
        displayValue: structureName => `<structure-description name="${structureName}"></structure-description>`,
        mutable: (activity, decision) => activity.decision("Roll").mutable,
      },
      {
        name: "Roll",
        options: ["Economy"]
      },
      {
        name: "Outcome",
        summaries: {
          criticalSuccess: `Build it; Boost a random Ability by 1`,
          success: `Build it`,
          failure: `Fail`,
          criticalFailure: `Fail; Reduce a random Ability by 1`,
        },
      },
      {
        name: "Pay with",
        saveAs: "paymentAbility",
        options: () => Ability.all,
      }],
      criticalSuccess() {
        this.info("😂 Everyone rallies to help.");
        this.boost(Ability.random);
        this.success();
      },
      success() {
        this.info(`🏛️ You built the ${this.structureName}!`);
        this.actor.powerups.push(new Structure(this.structureName));

        this.info("📈 If there are now 2+ buildings in the settlement, it's a town. Get Milestone XP!");
        this.info("📈 If there are now 4+ buildings in the settlement, it's a city. Get Milestone XP!");
        this.info("📈 If there are now 8+ buildings in the settlement, it's a metropolis. Get Milestone XP!");
      },
      failure() { this.warning("❌ You fail to build the building") },
      criticalFailure() {
        this.warning("💀 Some workers are killed in a construction accident");
        this.reduce(Ability.random);
        this.failure();
      },
    }];
  }
}
window.Activity = Activity;

import { Eris } from "../eris.js";
Eris.test("Activity", makeSure => {
  makeSure.it("remembers the properties given to it", ({assert}) => {
    let activity = new Activity({name: "Dance", prop: "value"});
    assert.equals(activity.name, "Dance");
    assert.equals(activity.prop, "value");
  });
  makeSure.it("pulls properties from the template", ({assert}) => {
    let activity = new Activity("Claim Hex");
    assert.equals(activity.name, "Claim Hex");
    assert.equals(activity.abilities, ["Economy", "Stability"]);
  });

  makeSure.describe("id", makeSure => {
    makeSure.it("gets a default if not set", ({assert}) => {
      let activity = new Activity("Dance");
      assert.defined(activity.id);
    });
    makeSure.it("accepts a property", ({assert}) => {
      let activity = new Activity({name: "Dance", id: "etcetc"});
      assert.equals(activity.id, "etcetc");
    });
  });

  makeSure.describe("description", makeSure => {
    makeSure.it("defaults to null", ({assert}) => {
      let activity = new Activity("Dance");
      assert.equals(activity.description, undefined);
    });
    makeSure.it("accepts a function parameter", ({assert}) => {
      let activity = new Activity({name: "Dance", description: () => "etcetc"});
      assert.equals(activity.description, "etcetc");
    });
  });

  makeSure.describe("log", makeSure => {
    makeSure.let("activity", () => new Activity("Dance"));

    makeSure.it("has no log entries by default, but can add them", ({assert, activity}) => {
      assert.equals(activity.log.length, 0);
    });

    makeSure.it("can log debug text to help programmers find bugs", ({assert, activity}) => {
      activity.debug("Internal state: THX-1138");
      assert.jsonEquals(activity.log, [{level: "debug", html: "Internal state: THX-1138"}]);
    });

    makeSure.it("can log informative text to track what happened", ({assert, activity}) => {
      activity.info("Something happened that we want to remember");
      assert.jsonEquals(activity.log, [{level: "info", html: "Something happened that we want to remember"}]);
    });

    makeSure.it("can log warning text to highlight bad stuf", ({assert, activity}) => {
      activity.warning("Pirates attacked");
      assert.jsonEquals(activity.log, [{level: "warning", html: "Pirates attacked"}]);
    });

    makeSure.it("can log error text to explain why something didn't work", ({assert, activity}) => {
      activity.error("You're all out of spoons");
      assert.jsonEquals(activity.log, [{level: "error", html: "You're all out of spoons"}]);
    });
  });

  makeSure.describe("decisions", makeSure => {
    let makeActivity = (decision) => new Activity({name: "Dance", decisions: [decision]});

    makeSure.it("configures the decision with the object I pass in", ({assert}) => {
      let activity = makeActivity({name: "Color", options: ["Red", "Green", "Blue"]});
      assert.equals(activity.decisions.length, 1);
      assert.equals(activity.decision("Color").options, ["Red", "Green", "Blue"]);
    });

    makeSure.it("accepts a property that's a function", ({assert}) => {
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
      assert.equals(activity.decision("Color").options, ["Red", "Green", "Blue"]);
    });

    makeSure.it("exposes an accessor for the parameter", ({assert}) => {
      let callbacks = [];
      let activity = makeActivity({
        name: "Color",
        options: () => ["Red", "Green", "Blue"],
        picked: (color, {decision, activity}) => callbacks.push(color),
      });
      activity.color = null;
      activity.color = "Blue";
      assert.equals(callbacks, [null, "Blue"]);
      assert.equals(activity.color, "Blue");
    });

    makeSure.it("causes an exception if you try to set something that's not an option", ({assert}) => {
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
      assert.expectError(() => activity.color = "Yellow", "TypeError");
    });

    makeSure.describe("savedValue allows you to work with objects but save IDs", makeSure => {
      let saveValue = (color) => color ? color[0].toLowerCase() : null;

      makeSure.it("by default, uses the value itself", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
        assert.equals(activity.decision("Color").saveValue("Red"), "Red");
      });

      makeSure.it("can be set via property", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], saveValue});
        assert.equals(activity.decision("Color").saveValue("Red"), "r");
        assert.jsonEquals(activity.decision("Color").dictionary, {r: "Red", g: "Green", b: "Blue"});
      });

      makeSure.it("exposes an accessor for the current save value", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], saveValue});
        
        assert.equals(activity.colorValue, null);
        
        activity.color = "Red";
        assert.equals(activity.colorValue, "r");

        activity.colorValue = "g";
        assert.equals(activity.color, "Green");
        assert.equals(activity.colorValue, "g");
      });
    });

    makeSure.describe("displayValue allows you to work with objects but show components or names", makeSure => {
      let displayValue = (color) => color ? color[0].toUpperCase() : null;

      makeSure.it("by default, uses the value itself", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
        assert.equals(activity.decision("Color").displayValue("Red"), "Red");
      });

      makeSure.it("can be set via property, using a function", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], displayValue});
        assert.equals(activity.decision("Color").displayValue("Red"), "R");
        assert.jsonEquals(activity.decision("Color").dictionary, {Red: "R", Green: "G", Blue: "B"});
      });

      makeSure.it("can be set via property, using a dictionary", ({assert}) => {
        let displayValues = {Red: "R", Green: "G", Blue: "B"};
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], displayValues});
        assert.equals(activity.decision("Color").displayValue("Red"), "R");
        assert.jsonEquals(activity.decision("Color").dictionary, displayValues);
      });

      makeSure.it("exposes an accessor for the current display value", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], displayValue});
        
        assert.equals(activity.colorDisplay, null);
        
        activity.color = "Red";
        assert.equals(activity.colorDisplay, "R");

        activity.colorDisplay = "G";
        assert.equals(activity.color, "Green");
        assert.equals(activity.colorDisplay, "G");
      });
    });

    makeSure.describe("summaryValue allow you to work with objects but show short descriptions", makeSure => {
      let summaries = {Red: "Like a fire truck", Green: "Like a plant", Blue: "Like the sky"};
      let summaryValue = (color) => summaries[color];

      makeSure.it("by default, no summary is given", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
        assert.equals(activity.decision("Color").summaryValue("Red"), undefined);
      });

      makeSure.it("can be set via property, using a function", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], summaryValue});
        assert.equals(activity.decision("Color").summaryValue("Red"), "Like a fire truck");
        assert.jsonEquals(activity.decision("Color").summaries, summaries);
      });

      makeSure.it("can be set via property, using a dictionary", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], summaries});
        assert.equals(activity.decision("Color").summaryValue("Red"), "Like a fire truck");
        assert.jsonEquals(activity.decision("Color").summaries, summaries);
      });

      makeSure.it("exposes a (read only) accessor for the current display value", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], summaryValue});
        
        assert.equals(activity.colorSummary, undefined);
        
        activity.color = "Red";
        assert.equals(activity.colorSummary, "Like a fire truck");
      });
    });

    makeSure.describe("mutability allows the user to edit their pick", makeSure => {
      makeSure.it("by default, is only mutable while pending", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
        let decision = activity.decision("Color");
        
        assert.true(decision.mutable);
        
        activity.color = "Red";
        assert.false(decision.mutable);
      });

      makeSure.it("can be overridden with properties", ({assert}) => {
        let whatever = true;
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], mutable: () => whatever});
        let decision = activity.decision("Color");
        
        assert.true(decision.mutable);
        
        whatever = false;
        assert.false(decision.mutable);
      });
    });
  });

  makeSure.describe("default decisions", makeSure => {
    makeSure.it("has two decisions: roll and outcome", ({assert}) => {
      let activity = new Activity("Dance");
      assert.equals(activity.decisions.map(d => d.name), ["Roll", "Outcome"]);
    });

    makeSure.describe("Roll decision", makeSure => {
      makeSure.describe("saveAs", makeSure => {
        makeSure.it("gets defaults if not set", ({assert}) => {
          let activity = new Activity({name: "Dance", ability: "Culture"});
          let decision = activity.decision("Roll");
          assert.equals(decision.saveAs, "ability");
          assert.equals(decision.resolution, "Culture");
        });

        makeSure.it("can be set by the properties", ({assert}) => {
          let activity = new Activity({name: "Dance", rolled: "Culture", decisions: [{name: "Roll", saveAs: "rolled"}]});
          let decision = activity.decision("Roll");
          assert.equals(decision.saveAs, "rolled");
          assert.equals(decision.resolution, "Culture");
        });
      });
      
      makeSure.describe("options", makeSure => {
        makeSure.it("gets defaults if not set", ({assert}) => {
          let activity = new Activity("Dance");
          let decision = activity.decision("Roll");
          assert.equals(decision.options, Ability.all);
          assert.equals(decision.displayValue("Culture"), `<ability-roll ability="Culture">Culture</ability-roll>`);
        });

        makeSure.it("can be set by the properties", ({assert}) => {
          let activity = new Activity({name: "Dance", decisions: [{name: "Roll", options: ["Culture"]}]});
          let decision = activity.decision("Roll");
          assert.equals(decision.options, ["Culture"]);
          assert.equals(decision.displayValue("Culture"), `<ability-roll ability="Culture">Culture</ability-roll>`);
        });
      });
    });

    makeSure.describe("Outcome decision", makeSure => {
      makeSure.describe("saveAs", makeSure => {
        makeSure.it("gets defaults if not set", ({assert}) => {
          let activity = new Activity({name: "Dance", outcome: "success"});
          let decision = activity.decision("Outcome");
          assert.equals(decision.saveAs, "outcome");
          assert.equals(decision.resolution, "success");
        });

        makeSure.it("can be set by the properties", ({assert}) => {
          let activity = new Activity({name: "Dance", successLevel: "success", decisions: [{name: "Outcome", saveAs: "successLevel"}]});
          let decision = activity.decision("Outcome");
          assert.equals(decision.saveAs, "successLevel");
          assert.equals(decision.resolution, "success");
        });
      });
      
      makeSure.describe("options", makeSure => {
        makeSure.it("gets defaults if not set", ({assert}) => {
          let activity = new Activity("Dance");
          let decision = activity.decision("Outcome");
          assert.equals(decision.options, "criticalSuccess success failure criticalFailure".split(" "));
          assert.equals(decision.displayValue("criticalSuccess"), `Critical Success`);
        });

        makeSure.it("can be set by the properties", ({assert}) => {
          let activity = new Activity({name: "Dance", decisions: [{name: "Outcome", options: ["criticalSuccess"]}]});
          let decision = activity.decision("Outcome");
          assert.equals(decision.options, ["criticalSuccess"]);
          assert.equals(decision.displayValue("criticalSuccess"), `Critical Success`);
        });
      });

      makeSure.it("setting the outcome calls outcome callbacks", ({assert}) => {
        let callbacks = {criticalSuccess: 0, success: 0, failure: 0, criticalFailure: 0};
        let activity = new Activity({
          criticalSuccess: () => callbacks.criticalSuccess++,
          success: () => callbacks.success++,
          failure: () => callbacks.failure++,
          criticalFailure: () => callbacks.criticalFailure++,
        });

        activity.outcome = "criticalSuccess";
        assert.equals(callbacks.criticalSuccess, 1);

        activity.outcome = "success";
        assert.equals(callbacks.success, 1);

        activity.outcome = "failure";
        assert.equals(callbacks.failure, 1);

        activity.outcome = "criticalFailure";
        assert.equals(callbacks.criticalFailure, 1);

        activity.outcome = null;
      });

      makeSure.it("does not hit callbacks when restoring state or setting the same value", ({assert}) => {
        let callbacks = {criticalSuccess: 0, success: 0, failure: 0, criticalFailure: 0};
        let activity = new Activity({
          criticalSuccess: () => callbacks.criticalSuccess++,
          outcome: "criticalSuccess",
        });

        assert.equals(callbacks.criticalSuccess, 0);
        activity.outcome = "criticalSuccess";
        assert.equals(callbacks.criticalSuccess, 0);
      });
    });
  });

  makeSure.describe("resolved", makeSure => {
    makeSure.it("is not resolved by default", ({assert}) => {
      let activity = new Activity("Dance");
      assert.false(activity.resolved);
    });

    makeSure.it("is resolved if all decisions are resolved", ({assert}) => {
      let activity = new Activity({name: "Dance", ability: "Economy", outcome: "success"});
      assert.equals(activity.ability, "Economy");
      assert.equals(activity.decision("Roll").resolved, true);
      assert.equals(activity.outcome, "success");
      assert.equals(activity.decision("Outcome").resolved, true);
      assert.true(activity.resolved);
    });
  });
});
