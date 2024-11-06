import { withDiffs } from "../../helpers.js";
import { Die } from "../../dice.js";

import { Ability } from "../abilities.js";
import { Feat } from "../feat.js";

export var systemTemplates = [{
  icon: "👑",
  name: "Welcome, Domainkeeper",
  summary: "You've got a new domain. Let's see how it goes.",
  decisions: [{
    name: "Ready?",
    saveAs: "ready",
    options: ["Let's go!"],
    picked(option, {activity}) {
      const name = prompt("What's the name of your domain?", activity.domain.name || "Anvilania");
      activity.domain.name = name;
    },
  }],
  description: () => `
    <p>👑 This is a simplified version of <a href="https://2e.aonprd.com/Rules.aspx?ID=1739">Kingmaker 2E's Kingdom rules</a>. Skills, Feats, RP, Commodities, Consumption, Influence, and Roles are all removed.</p>
    <p>📈 The domain has four Abilities: Culture, Economy, Loyalty, and Stability. It also has four Stats: Unrest, Size, XP, Level. Build up the Ability scores and Stats by doing activities. Spend down the Ability scores to build stuff that helps your domain run and grow.</p>
    <p>🏙️ You start with one settlement, but can build more later. Each turn, every settlement does one activity. You roll one of the domain's Abilities to see how well the activity goes. Settlements can build Structures, which cost Ability points but offer a variety of long-term benefits.</p>
    <p>👥 The PCs are the leaders of the domain (they don't have specific roles). Each turn, every leader does two activities. You roll one of the domain's Abilities to see how well the activity goes. A leader can't take the same activity twice, and no two leaders can use the same ability for the same activity in a turn.</p>
    <p>♻️ When all activities are complete, an event occurs (there's no roll; an event occurs every turn). You roll one of the Abilities to see how the event plays out. Then you'll start the next turn with a summary of what's changed.</p>
    <p>🎯 Your goal is to keep your Domain running and expanding. If any Ability drops to 0, the Domain will fall into Ruin and you lose control. Similarly, if Unrest ever climbs to 20, the Domain falls into Anarchy.</p>
    <p>💾 Domains save at the end of every turn, or any time you hit the icon. Click 🔀 to manage your saves.</p>
  `,
  onResolved() { this.turn.addUniqueActivity({name: "Place Capital"}) },
}, {
  icon: "⭐",
  name: "Place Capital",
  summary: "You've got a domain. Where's the capital?",
  decisions: [{
    name: "Location",
    prompt: "Choose a hex to start in",
    placeMarker() { return {icon: "⭐"} },
    contextMarkers: () => [],
    picked(picked, {decision, activity}) {
      let pos = decision.position();
      this.position = pos;
      if (picked && pos) {
        let settlement = this.domain.settlements[0];
        settlement.position = pos;

        let name = prompt("And what will you name your capital?", "Capital");
        if (name) { settlement.name = name }

        this.domain.checkMilestones("settlements", activity);
      } else {
        this.location = null;
      }
    },
    mutable: (activity, decision) => activity.domain.currentTurn.number === 0,
  }],
  onResolved() { this.turn.addUniqueActivity({name: "Domain Concept"}) },
}, {
  icon: "🌱",
  name: "Domain Concept",
  summary: "Let's pick some starting stats",
  description: () => `
    <p>Use the buttons below to assign the Domain's stats.</p>
    <ol>
      <li>Each ability starts at 2. No stat can go above 5 yet; you have to build Structures to increase capacity first.</li>
      <li>Heartland will boost a stat by 1.</li>
      <li>Charter will boost a stat by 1.</li>
      <li>Governments will boost two different stats by 1 each.</li>
      <li>You can choose one stat to boost by 1.</li>
    </ol>
    <p>I'd suggest a 5/4/3/2 spread, but you can also manage 5/5/2/2, or 5/3/3/3, or 4/4/3/3, or other possibilities.</p>
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

      // Governments
      Despotism: ["Stability", "Economy"],
      Feudalism: ["Stability", "Culture"],
      Oligarchy: ["Loyalty", "Economy"],
      Republic: ["Stability", "Loyalty"],
      Thaumacracy: ["Economy", "Culture"],
      Yeomanry: ["Loyalty", "Culture"],

      ...Ability.all.toDictionary(a => [a, [a]]),
    };
    let recalculate = (activity) => {
      activity.domain.culture = activity.domain.economy = activity.domain.loyalty = activity.domain.stability = 2;
      activity.log = [];
      activity.decisions.forEach(decision => {
        (boosts[decision.resolution] || []).forEach(ability => {
          activity.boost(ability);
        });
      });
    };
    let shared = {
      summaryValue: (option) => {
        let abilities = boosts[option] || [];
        return abilities.length === 0 ? `Free boost` : `Boost ${abilities.join(" and ")}`;
      },
      optionDisableReason: (option, {activity}) => {
        let domain = activity.domain;
        let abilities = boosts[option] || [];
        let over = abilities.find(a => domain[a.toLocaleLowerCase()] >= 5);
        return over ? `${over} is already maxed` : null;
      },
      picked: (option, {activity}) => recalculate(activity),
      unpicked: (option, {activity}) => recalculate(activity),
      mutable: (activity, decision) => {
        return activity.domain.currentTurn.number === 0;
      },
    }

    return [{
      name: "Heartland",
      saveAs: "heartland",
      options: "Forest Swamp Hill Plain Lake River Mountain Ruins".split(" "),
      ...shared,
    }, {
      name: "Charter",
      saveAs: "charter",
      options: "Conquest Expansion Exploration Grant".split(" "),
      ...shared,
    }, {
      name: "Free Charter Boost",
      saveAs: "freeCharterBoost",
      options: Ability.all,
      ...shared,
    }, {
      name: "Government",
      saveAs: "government",
      options: "Despotism Feudalism Oligarchy Republic Thaumacracy Yeomanry".split(" "),
      ...shared,
    }, {
      name: "Free Government Boost",
      saveAs: "freeGovernmentBoost",
      options: Ability.all,
      ...shared,
    }];
  })(),
  onResolved() { this.turn.addUniqueActivity({name: "Domain Leadership"}) },
}, {
  icon: "👥",
  name: "Domain Leadership",
  summary: `Let's make clear who's in charge around here`,
  decisions: [{
  //   name: "Role",
  //   options: "Ruler Councilor General Emissary Magister Treasurer Viceroy Warden".split(" "),
  //   mutable: (activity, decision) => !activity.decision("PC or NPC").resolved,
  // }, {
    name: "Type",
    saveAs: "leaderType",
    options: ["PC", "NPC"],
    picked(option, {activity}) {
      const name = activity.leaderName = prompt("What's their name?", "Leader");
      activity.domain.leaders.push({name, role: activity.role, traits: [activity.leaderType]});
    },
  }, {
    name: "Done?",
    saveAs: "done",
    options: ["Add another leader", "That's all"],
    picked(option, {activity}) {
      if (option === "Add another leader") {
        activity.domain.currentTurn.addActivity({name: "Domain Leadership"});
      }
    },
  }],
}, {
  icon: "💥",
  name: "Event",
  summary: `Time marches on`,
  description: () => `The GM has an event to read.`,
  decisions: [{
    name: "Roll",
    options: [...Ability.all, "Skip"],
    description(context) { return `
      <p>You probably need to roll to avoid something bad happening, or to make sure something good happens.</p>
      <p>Does the event tell you to roll a skill? Convert that…</p>
      <dl style="display: grid; grid-template-columns: auto 1fr; gap: 0 1em;">
        <dt>Culture</dt>
        <dd>Arts, Folklore, Magic, Scholarship</dd>
        <dt>Economy</dt>
        <dd>Boating, Exploration, Industry, Trade</dd>
        <dt>Loyalty</dt>
        <dd>Intrigue, Politics, Statecraft, Warfare</dd>
        <dt>Stability</dt>
        <dd>Agriculture, Defense, Engineering, Wilderness</dd>
      </dl>
      <p>Need an idea? I think <em>${Ability.all.random()}</em> looks good today.</p>
      `;
    },
    picked(ability, {activity}) {
      if (ability === "Skip") { activity.decision("Outcome").resolution = "success" }
    },
  }, {
    name: "Outcome",
  }, {
    name: "Resolution",
    description(context) { return `
      <p>Convert results with…</p>
      <dl style="display: grid; grid-template-columns: auto 1fr; gap: 0 1em;">
        <dt>Ruin</dt><dd>Half and reduce the relevant ability: Corruption ➭ Culture; Crime ➭ Economy; Strife ➭ Loyalty; Decay ➭ Stability</dd>
        <dt>RP / Resource Dice</dt><dd>Increase or Reduce a random ability by 1 for every die, or for every 3 RP</dd>
      </dl>
      `;
    },
    options() { return Object.keys(this.resolutions) },
    resolutions: {
      ...Ability.all.toDictionary(ability => [`Lower ${ability}`, ({activity}) => activity.reduce(ability)]),
      "Lower random ability": ({activity}) => activity.reduce(Ability.random),
      "1d4 Unrest": ({activity}) => activity.boost("Unrest", {by: Die.d4()}),
      "Lose 1 Fame": ({activity}) => activity.domain.useConsumable({name: "Fame"}),
      "No effect": ({activity}) => {},
    },
    picked(resolution, context) {
      let {activity, decision} = context;
      decision.resolutions[resolution](context);
      activity.boost("XP", {by: 30});
    },
  }, {
    name: "Next",
    options: ["End turn", "Add another event"],
    picked(resolution, {activity}) {
      if (resolution === "End turn") {
        activity.domain.endTurn({turn: activity.turn});
      } else if (resolution === "Add another event") {
        activity.domain.currentTurn.addActivity({name: "Additional Event", template: "Event"});
      }
    },
  }],
}, {
  icon: "🗺️",
  name: "Domain Summary",
  summary: `A report on the state of your domain`,
  decisions: [],
  description() {
    let lastSummary = this.domain.previousTurn?.activities?.find(e => e.name === this.name);
    let abilityScores = this.abilityScores = {
      Culture: this.domain.culture,
      Economy: this.domain.economy,
      Loyalty: this.domain.loyalty,
      Stability: this.domain.stability,
    };
    let statScores = this.statScores = {
      Unrest: this.domain.unrest,
      Size: this.domain.size,
      XP: this.domain.xp,
      Level: this.domain.level,
    };
    
    return `
      <header>What Happened</header>
      <div class="activity-summaries">
        ${(this.domain.currentTurn?.activities || []).map(activity =>
          `<a
            href="#${activity.id}"
            title="${activity.name}"
            class="activity-summary icon-link"
            data-type="${activity.type}"
            data-used-ability="${activity.ability}"
            data-outcome="${activity.outcome}"
            data-action="smoothScroll"
            >${activity.icon}</a>`
        ).join("")}
      </div>
      <header>Stats Snapshot</header>
      ${Maker.dl(withDiffs(abilityScores, lastSummary?.abilityScores), {class: "dl-oneline"}).outerHTML}
      ${Maker.dl(withDiffs(statScores, lastSummary?.statScores), {class: "dl-oneline"}).outerHTML}
    `;
  },
}, {
  icon: "📜",
  name: "News",
  summary: "What's the situation in the domain?",
  decisions: [5, 10, 15].map(threshold => {
    return {
      name: `Ruin - threshold ${threshold}`,
      options: ["Unmet", "Met"],
      threshold,
      saveAs: `ruin${threshold}`,
      picked(metOrNot, {activity}) {
        if (metOrNot === "Met") {
          activity.error(`🤬 Unrest is higher than ${threshold}.`);
          let ability = Ability.random;
          activity.error({
            "Culture": "💸 Corruption is rampant, and no one trusts the domain.",
            "Economy": "🥷🏻 Crime is everywhere, making it hard on honest citizens.",
            "Loyalty": "🧟‍♂️ Decay pervades the domain; only fools would depend on tomorrow.",
            "Stability": "🧟‍♂️ Strife pits neighbors against each other, and everyone is on edge.",
          }[ability]);
          activity.reduce(ability);
        } else {
          activity.info(`😌 Unrest is not ${threshold} or higher.`);
        }
      },
    };
  }),
  added() {
    let unrest = this.domain.unrest;
    this.decisions.forEach(decision => {
      decision.resolution = unrest >= decision.threshold ? "Met" : "Unmet";
    });
  },
}, {
  icon: "🔧",
  name: "Nudge",
  summary: "You tweaked something",
  decisions: [],
}, {
  icon: "👑",
  name: "Level Up",
  summary: "The domain grows in renown and stature",
  decisions: [{
    name: "Kingdon Feat",
    options() { return Feat.names },
    picked(feat, {activity}) {
      activity.domain.addFeat({name: feat});
      activity.info(`🤯 The domain gained the ${feat} feat`);
    },
    groupOptionsBy: featName => `Level ${Feat.template(featName).level}`,
    optionDisableReason(featName) {
      let feat = Feat.template(featName);

      let levelRequirement = {ability: "Level", value: feat.level};
      let prereqs = feat.prerequisites || [];

      let reqs = this.domain.checkRequirements(levelRequirement, ...prereqs);
      if (reqs.met) { return null }

      return reqs.children.filter(r => !r.met).map(r => r.description).join(".\n");
    },
    
    displayValue: featName => `<feat-description name="${featName}"></feat-description>`,
    displayTitleValue: featName => featName,
  }],
  added() {
    this.domain.level += 1;
    this.domain.xp -= 1000;
    this.info(`🎉 The domain is now level ${this.domain.level}!`);
    this.warning(`🎯 The Control DC has increased to ${this.domain.controlDC}`);
  },
  onResolved() {
    this.domain.endTurn({turn: this.turn});
  },
}].map(a => { return {type: "system", actorId: "system", ...a}});
