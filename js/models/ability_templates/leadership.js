import { Ability } from "../abilities.js";
import { Actor } from "../actor.js";

let hexMods = `<p>Additional modifier based on the hex's worst terrain: Mountains: -4; Swamps: -3; Forests: -2; Hills: -1; Plains: -0.</p>`;
let hexDCOptions = [
  {name: "Mountains", value: 4},
  {name: "Swamps", value: 3},
  {name: "Forests", value: 2},
  {name: "Hills", value: 1},
  {name: "Plains", value: 0},
];

export var leadershipTemplates = [{
  icon: "🧭",
  name: "Reconnoiter Hex",
  summary: "You hire a team to survey a particular hex.",
  whyDisabled(domain, leader) {
    if (!domain.bonuses.find(p => p.unlock === "Reconnoiter Hex")) {
      return "Build a Hunters' Lodge first";
    }
  },
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
  icon: "🏃‍♂️",
  name: "Abandon Hex",
  summary: "You renounce the domain's claim to a hex.",
  whyDisabled(domain, leader) {
    if (domain.size < 2) { return "Cannot abandon your last hex" }
  },
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

    let settlement = new Actor({type: "Village", name: name});
    this.settlementId = settlement.id;
    this.domainSheet.domain.settlements.push(settlement);
  },
  criticalSuccess() {
    this.info(`😃 You establish the settlement largely with the aid of enthusiastic volunteers.`);
    this.skipPayment();
  },
  success() { this.requirePayment() },
  failure() { this.requirePayment({amount: 2}) },
  criticalFailure() { this.abandonPayment() },
}, {
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
  icon: "🛣️",
  name: "Build Infrastructure",
  summary: "You organize the effort to tame the land.",
  description() { return hexMods },
  decisions: [{
    name: "Roll",
    difficultyClassOptions: {options: JSON.stringify(hexDCOptions)},
  }, {
    name: "Outcome",
    summaries: {
      criticalSuccess: `Build it`,
      success: `Build it if you Reduce 1 Ability by 1`,
      failure: `Build it if you Reduce 1 Ability by 2`,
      criticalFailure: `Fail`,
    },
  }, {
    name: "Payment",
    options: [...Ability.all, "abandoned"],
  }],
  criticalSuccess() {
    this.info(`🚀 The whole domain rallies around this project, and it is complete without cost.`);
    this.skipPayment();
  },
  success() {
    this.info("😓 Construction is always costly.");
    this.requirePayment();
  },
  failure() {
    this.warning("😰 Construction is unexpectedly difficult.");
    this.requirePayment({amount: 2});
  },
  criticalFailure() {
    this.error("❌ The construction process is a failure.");
    this.abandonPayment();
  },
}, {
  icon: "💡",
  name: "Creative Solution",
  summary: "You plan ahead to make the next action more successful.",
  description() { return `<p>You work with your domain’s scholars, thinkers, and practitioners of magical and mundane experimentation to come up with new ways to resolve issues when business as usual is just not working. Attempt a basic check.</p>`},
  decisions: [{
    name: "Roll",
  }, {
    name: "Outcome",
    summaries: {
      criticalSuccess: `Bank a Reroll+2 for this turn, and if you don't use it get XP`,
      success: `Bank a Reroll+2 for this turn`,
      failure: `Fail`,
      criticalFailure: `-1 penalty to Culture checks this + next turn`,
    },
  }],
  criticalSuccess() {
    this.success();
    this.info(`⚙️ If you don’t use your Creative Solution by the end of this turn, you lose this benefit and gain 10 Domain XP instead.`);
  },
  success() {
    this.info(`🎉 You can call upon the solution to aid in resolving any Domain check made during the remainder of this turn. Do so when a check is rolled, but before you learn the result. Immediately reroll that check with a +2 circumstance bonus; you must take the new result.`);
    this.addConsumable({name: "Creative Solution", action: "reroll", description: "Reroll +2"});
  },
  failure() { this.warning("❌ You spend time thinking the problem through, but no solution shows itself.") },
  criticalFailure() {
    this.error(`Your scholars and thinkers are so frustrated that you take a –1 circumstance penalty to Culture checks until the end of the NEXT Domain turn.`)
    this.addConsumable({name: "Status: Frustrated", description: "-1 Culture (Circumstance penalty)"});
  },
}, {
  icon: "🛠️",
  name: "Build Up",
  summary: "You lead a party to harvest the bounty of this realm.",
  description() { return `
    <p>This boosts the ability above the one you roll:</p>
    <ol>
      <li>Rolling Stability will increase Loyalty</li>
      <li>Rolling Loyalty will increase Economy</li>
      <li>Rolling Economy will increase Culture</li>
      <li>Rolling Culture will increase Stability</li>
    </ol>`;
  },
  decisions: [{
    name: "Roll",
  }, {
    name: "Outcome",
    summaries: {
      criticalSuccess: `Boost Ability by 2`,
      success: `Boost Ability by 1`,
      failure: `Fail`,
      criticalFailure: `Unrest`,
    },
  }],
  criticalSuccess() {
    this.info("🎁 You make good time and find plentiful resources!");
    this.boost({by: 2}, Ability.previous(this.ability));
  },
  success() {
    this.info("🎉 A fruitful expedition");
    this.boost(Ability.previous(this.ability));
  },
  failure() { this.warning("❌ Your expedition yields naught") },
  criticalFailure() {
    this.error("💀 The expedition is a fiasco; some members do not return alive");
    this.boost("Unrest");
  },
}, {
  icon: "🍹",
  name: "Cool Down",
  summary: "You organize a festival where the populace can enjoy themselves.",
  description() { return `
    <p>You declare a day of celebration. Holidays may be religious, historical, martial, or simply festive, but all relieve your citizens from their labors and give them a chance to make merry at the domain’s expense.</p>
    <p>This boosts the ability below the one you roll:</p>
    <ol>
      <li>Rolling Culture will increase Economy</li>
      <li>Rolling Economy will increase Loyalty</li>
      <li>Rolling Loyalty will increase Stability</li>
      <li>Rolling Stability will increase Culture</li>
    </ol>`;
  },
  decisions: [{
    name: "Roll",
  }, {
    name: "Outcome",
    summaries: {
      criticalSuccess: `Boost Ability by 2`,
      success: `Boost Ability by 1`,
      failure: `Fail`,
      criticalFailure: `Unrest`,
    },
  }],
  criticalSuccess() {
    this.info(`🎁 Your holiday is a delight to your people. The event is expensive, but incidental income from the celebrants covers the cost.`);
    this.boost({by: 2}, Ability.next(this.ability));
  },
  success() {
    this.info(`🎉 Your holiday is a success.`);
    this.boost(Ability.next(this.ability))
  },
  failure() {
    this.warning("❌ The holiday passes with little enthusiasm, but is still expensive.");
  },
  criticalFailure() {
    this.error("🃏 Your festival days are poorly organized, and the citizens actively mock your failed attempt to celebrate..")
    this.boost("Unrest");
  },
}, {
  icon: "🥺",
  name: "Request Foreign Aid",
  summary: "You entreat aid from a nation you already have diplomatic relations with.",
  description() { return `
    <p><strong>Requirement:</strong> You have diplomatic relations with the group you are requesting aid from</p>
    <p>When disaster strikes, you send out a call for help to another nation with whom you have diplomatic relations. The DC of this check is equal to the other group’s Negotiation DC +2 (see the sidebar on page 23).</p>
    `;
  },
  decisions: [{
    name: "Roll",
    dc: "Group DC", // TODO make this work
  }, {
    name: "Outcome",
    summaries: {
      criticalSuccess: `Boost an Ability you pick by 1; +4 bonus to future roll`,
      success: `Boost an Ability you pick by 1`,
      failure: `Boost a random Ability by 1`,
      criticalFailure: `1d4 Unrest`,
    },
  }],
  criticalSuccess() {
    this.success();
    this.info(`🎁 In addition, your ally’s aid grants a +4 circumstance bonus to any one Domain check attempted during the remainder of this turn. You can choose to apply this bonus to any Domain check after the die is rolled, but must do so before the result is known.`);
    this.addConsumable({name: "Foregin Aid", description: "+4 on any roll, after you roll it.", action: "expire"});
  },
  success() {
    this.info(`🎉 Your ally sends the aid you need.`);
    this.requirePayment({name: "Benefit", amount: -1});
  },
  failure() {
    this.warning(`🥡 Your ally sends what aid they can.`);
    this.boost(Ability.random);
  },
  criticalFailure() {
    this.error(`💥 Your ally is tangled up in its own problems and is unable to assist you, is insulted by your request for aid, or might even have an interest in seeing your domain struggle against one of your ongoing events. Whatever the case, your pleas for aid make your domain look desperate. You gain no aid, but you do increase Unrest by 1d4.`);
    this.boost({by: [1, 2, 3, 4].random()}, "Unrest");
  },
}, {
  icon: "🎪",
  name: "Quell Unrest",
  summary: "You entertain the populace.",
  description() { return `
    <p>You organize and encourage your citizens' efforts on bringing the domain together.</p>
    <p>Depending on the ability used, this might take the form of a festival, competition, market day, circus, or other cooperative endeavor that brings people together. Perhaps your agents disperse through the citizenry to suppress dissent, or you hold a public trial. You could participate in baby-kissing and ribbon-cutting. Be creative!</p>`;
  },
  decisions: [{
    name: "Roll",
  }, {
    name: "Outcome",
    summaries: {
      criticalSuccess: `Reduce Unrest; Gain Fame`,
      success: `Reduce Unrest`,
      failure: `Reduce Unrest; Reduce an Ability you pick by 1`,
      criticalFailure: `Reduce a random Ability by 1`,
    },
  }],
  criticalSuccess() {
    this.success();
    this.info("🗣️ People come from far and wide to join the festivities, and carry work back to their own lands.")
    this.addFame();
  },
  success() {
    this.info(`🎉 The people enjoy the distraction.`);
    this.reduce("Unrest");
  },
  failure() {
    this.warning(`💸 The people enjoy the distraction, but it's not cheap.`);
    this.requirePayment({picked: (ability) => {
      this.reduce(ability);
      this.reduce("Unrest");
    }});
  },
  criticalFailure() {
    this.error(`🔥 The merriment gets out of hand and riots ensue.`);
    this.reduce(Ability.random);
  },
}, {
  icon: "👀",
  name: "Take Charge",
  summary: "You visit a settlement to ensure vital work gets done.",
  decisions: [{
    name: "Settlement",
    saveAs: "settlementId",
    valueMethod: "settlement",
    description: "Which settlement will get your attention - and an extra action?",
    options() { return this.domainSheet?.domain?.settlements || [] },
    saveValue(settlement) { return settlement?.id },
    displayValue(settlement) { return settlement?.name },
  }, {
    name: "Roll",
  }, {
    name: "Outcome",
    summaries: {
      criticalSuccess: `Do a Civic Activity; Increase Stability or Loyalty by 1`,
      success: `Do a Civic Activity`,
      failure: `Do a Civic Activity; Increase Unrest`,
      criticalFailure: `Increase Unrest; Decrease Stability or Loyalty by 1`,
    },  
  }],
  criticalSuccess() {
    this.success();
    this.info(`👍🏻 Your vigilant oversight of this successful project inspires the domain.`);
    this.boost(["Stability", "Loyalty"].random());
  },
  success() {
    this.info(`🎉 You oversee the project to completion.`);
    this.addBonusActivity(this.settlement);
  },
  failure() {
    this.warning(`😠 The project is completed, but the settlement is annoyed by your methods.`);
    this.addBonusActivity(this.settlement);
    this.boost("Unrest");
  },
  criticalFailure() {
    this.error(`🤬 The citizenry revolt at your heavy-handedness and refuse to help.`);
    this.boost("Unrest");
    this.reduce(["Stability", "Loyalty"].random());
  },
}, {
  icon: "🚋",
  name: "Train Lieutenant",
  summary: "You work with an NPC leader to increase their capacity.",
  decisions: [{
    name: "Trainee",
    saveAs: "traineeId",
    valueMethod: "trainee",
    description: "Which leader will you be tutoring?",
    options() {
      let npcs = this.domain.leaders.filter(l => l.hasTrait("NPC"));
      return npcs.length ? npcs : [{name: "There's no one to train"}];
    },
    optionDisableReason(trainee) {
      return trainee.id
        ? (trainee.id === this.activity.actorId ? "Cannot train yourself" : null)
        : "All NPCs in Leadership roles have 2 activities per turn" },
    saveValue(trainee) { return trainee?.id },
    displayValue(trainee) { return trainee?.name },
    mutable: (activity, decision) => activity.decision("Roll").mutable,
  }, {
    name: "Roll",
    options: ["Loyalty"],
  }, {
    name: "Outcome",
    summaries: {
      criticalSuccess: `NPC Leader gets 2 activitys/turn, or success`,
      success: `Leader adds 2 activities to their repertiore`,
      failure: `Fail`,
      criticalFailure: `Leader abandons their post`,
    },
  }],
  criticalSuccess() {
    if (this.trainee.activitiesPerTurn < 2) {
      this.info(`🧠 ${this.trainee.name} is an apt pupil! They can now perform ${++this.trainee.activitiesPerTurn} action${this.trainee.activitiesPerTurn == 1 ? "" : "s"} per turn.`);
    } else { this.success() }
  },
  success() {
    this.info(`🤯 You teach ${this.trainee.name} more about leadership. Add two actions to those available to them.`);
    this.info(`🎗️ TODO we should actually track that.`);
  },
  failure() {
    this.warning(`😪 You might not be a great teacher or they might not be a good student, but this didn't work.`);
  },
  criticalFailure() {
    this.error(`🤬 You alientate your pupil and they leave their post. They will not return until you apologize.`);
  },
}, {
  icon: "🛡️",
  name: "Hire Adventurers",
  summary: "You pay people to tackle an ongoing event.",
  description() { return `
    <p>While the PCs can strike out themselves to deal with ongoing events, it’s often more efficient to Hire Adventurers. When you Hire Adventurers to help end an ongoing event, the DC is equal to your Control DC adjusted by the event’s level modifier.</p>
    `;
  },
  decisions: [{
    name: "Payment",
    description: "Before you roll, you must pay the mercenaries."
  }, {
    name: "Roll",
    abilities: ["Loyalty"],
  }, {
    name: "Outcome",
    summaries: {
      criticalSuccess: `Continuous Event ends`,
      success: `+2 bonus to end event`,
      failure: `Fail`,
      criticalFailure: `Fail; Can't Hire Adventurers for this Event`,
    },
  }],
  criticalSuccess() {
    this.info(`⚔️ You end the continuous event.`);
  },
  success() {
    this.info(`🔪 The continuous event doesn’t end, but you gain a +2 circumstance bonus to resolve the event during the next Event phase`);
    this.addConsumable({name: "Status: Hired Hands", description: "+2 Event Resolution (Circumstance bonus)"});
  },
  failure() {
    this.warning(`❌ You fail to end the continuous event`);
  },
  criticalFailure() {
    this.failure();
    this.error(`🙊 Word spreads quickly through the region—you can no longer attempt to end this continuous event by Hiring Adventurers.`);
  },
}, {
  icon: "🔮",
  name: "Prognostication",
  summary: "You use the mystic arts to forsee future events and prepare for them.",
  description() { return `<p>Your domain’s spellcasters read the omens and provide advice on how best to prepare for near-future events. Attempt a basic check.</p>` },
  decisions: [{
    name: "Roll",
    options: ["Culture"],
  }, {
    name: "Outcome",
    summaries: {
      criticalSuccess: `+2 bonus to resolve event`,
      success: `+1 bonus to resolve event`,
      failure: `Fail`,
      criticalFailure: `-1 penalty to resolve event`,
    },
  }],
  criticalSuccess() {
    this.info(`🧿 Gain a +2 circumstance bonus to the check to resolve the event.`);
    this.addConsumable({name: "Status: Prepared 2", description: "+2 Event Resolution (Circumstance bonus)"});
  },
  success() {
    this.info(`🎴 Gain a +1 circumstance bonus to the check to resolve the event.`);
    this.addConsumable({name: "Status: Prepared 1", description: "+1 Event Resolution (Circumstance bonus)"});
  },
  failure() {
    this.warning(`❌ Your spellcasters divine no aid.`);
  },
  criticalFailure() {
    this.error(`💥 Your spellcasters provide inaccurate readings of the future. Take a -1 circumstance penalty to the check to resolve the event`);
    this.addConsumable({name: "Status: Ill-Prepared", description: "-1 Event Resolution (Circumstance bonus)"});
  },
}, {
  icon: "🎨",
  name: "Create A Masterpiece",
  summary: "You use the mystic arts to forsee future events and prepare for them.",
  // TODO limit to 1/turn
  description() { return `<p>You encourage your domain’s artists to create and display a masterful work of art to bolster your domain’s reputation. Attempt a basic check; the result affects either Fame or Infamy (depending on the type of domain you’re running). Create a Masterpiece may be attempted only once per domain turn regardless of the number of leaders pursuing activities.</p>`},
  decisions: [{
    name: "Roll",
    options: ["Culture"],
  }, {
    name: "Outcome",
    summaries: {
      criticalSuccess: `Gain Fame; Boost random Ability by 1`,
      success: `Gain Fame`,
      failure: `Fail`,
      criticalFailure: `Fail; Lose Fame OR 1d4 Unrest`,
    },
  }],
  
  criticalSuccess() {
    this.success();
    this.info(`💰 There is a constant stream of people coming to see it for themselves.`);
    this.boost(Ability.random);
  },
  success() {
    this.info(`🗿 A stunning work of art is created, and people speak of it far and wide.`);
    this.addFame();
  },
  failure() {
    this.warning(`❌ Your attempt to create a masterpiece fails`);
  },
  criticalFailure() {
    this.error(`💥 Not only does your attempt to create a masterpiece fail, it does so in a dramatic and humiliating way. Lose 1 Fame or Infamy point; if you have no Fame or Infamy points to lose, instead gain 1d4 Unrest.`);
    let consumed = this.domain.useConsumable({name: "Fame"}); // TODO make this the default when losing fame
    if (consumed) {
      this.error("🤡 Fame reduced by 1");
    } else {
      this.boost({by: [1, 2, 3, 4].random()}, "Unrest");
    }
  },
}].map(a => { return {type: "leadership", ...a}});
