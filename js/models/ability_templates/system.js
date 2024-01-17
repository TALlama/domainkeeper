import { withDiffs } from "../../helpers.js";

import { Ability } from "../abilities.js";

export var systemTemplates = [{
  icon: "👑",
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
  icon: "🌱",
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
  decisionResolved(decision) {
    if (this.resolved) { document.querySelector("domain-activity-log").newTurn() }
  },
}, {
  icon: "💥",
  name: "Event",
  summary: `Time marches on`,
  description: () => `The GM has an event to read.`,
  decisions: [{
    name: "Roll",
    description(context) { return `
      <p>You probably need to roll to avoid something bad happening, or to make sure something good happens.</p>
      <p>Need an idea? I think <em>${Ability.all.random()}</em> looks good today.</p>
      ${context.decision.difficultyClass(context)}`;
    },
  }, {
    name: "Outcome",
  }, {
    name: "Resolution",
    options() { return Object.keys(this.resolutions) },
    resolutions: {
      ...Ability.all.toDictionary(ability => [`Lower ${ability}`, ({activity}) => activity.reduce(ability)]),
      "Lower random ability": ({activity}) => activity.reduce(Ability.random),
      "1d4 Unrest": ({activity}) => activity.boost({by: [1, 2, 3, 4].random()}, "Unrest"),
      "Lose 1 Fame": ({activity}) => activity.domainSheet.useConsumable({name: "Fame"}),
      "Nothing happened": ({activity}) => {},
    },
    picked(resolution, context) {
      let {activity, decision} = context;
      decision.resolutions[resolution](context);
      activity.domainSheet.useAllConsumables({useBy: "end-of-turn"});
      document.querySelector("domain-activity-log").newTurn(); // TODO should this be an event?
    },
  }],
}, {
  icon: "🗺️",
  name: "Domain Summary",
  summary: `A report on the state of your domain`,
  decisions: [],
  description() {
    let lastSummary = this.domainSheet.previousTurn?.activities?.find(e => e.name === this.name);
    let abilityScores = this.abilityScores = this.domainSheet.abilityScores;
    let statScores = this.statScores = this.domainSheet.statScores;
    
    // TODO style
    // TODO add smoothScroll action
    return `
      <p>💾 Domain saved</p>
      <header>What Happened</header>
      <div class="activity-summaries">
        ${(this.domainSheet.currentTurn?.activities || []).map(activity =>
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
  icon: "😢",
  name: "Ruin",
  summary: "If Unrest is too high, random stats get reduced",
  decisions: [5, 10, 15].map(threshold => {
    return {
      name: `Threshold ${threshold}`,
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
    let unrest = this.domainSheet.data.unrest;
    this.decisions.forEach(decision => {
      decision.resolution = unrest >= decision.threshold ? "Met" : "Unmet";
    });
  },
}, {
  icon: "🔧",
  name: "Nudge",
  summary: "You tweaked something",
  decisions: [],
}].map(a => { return {type: "system", actorId: "system", ...a}});
