/********************************************************************************/
// The structure names and details are based on Paizo's Kingmaker Players Guide //
// They are used here under Paizo's Community Use Policy                        //
// See https://paizo.com/community/communityuse for details                     //
/********************************************************************************/

import { Powerup } from "./powerup.js";

export class Structure extends Powerup {
  constructor(properties) {
    super(properties);

    this.addTrait(`Limit ${this.limit}`);
    // TODO some stuff should take more than one turn to build…
  }

  static type = "structure";

  static add({templateName, actor, activity, setup, added}) {
    Powerup.add({type: this, templateName, actor, setup, added, activity,
      makeContext(ctx) { return {...ctx, settlement: actor, structure: ctx.powerup} },
    });
  }

  /////////////////////////////////////////////// Templates

  static addTrait(to, ...traits) { to.traits = [...(to.traits || []), ...traits] }

  static #addTraitToAll(trait, ...templates) { templates.forEach(t => this.addTrait(t, trait)); return templates; }

  static get cultureStructures() {
    let ability = "Culture";
    /* Culture measures the interest and dedication of your nation and its people
      to the arts and sciences, to religion and reason, and to the subjects that
      your society chooses to learn about and to teach. Are your people well
      versed in rhetoric and philosophy? Do they value learning and research,
      music and dance? Do they embrace society in all its diverse splendor?
      If they do, your kingdom likely has a robust Culture score. */
    let maxBoosters = [{
      name: `Festival Hall`,
      level: 3,
      traits: ["Building"],
      description: `A festival hall is a small building that gives performers a venue to entertain and citizens a place to gather for celebrations or simply to relax.`,
      bonuses: [
        {max: ability, value: 1},
        {activity: "Celebrate Holiday", ability: "Culture", value: 1},
      ], // WAS +1 item bonus to Celebrate Holiday
    }, {
      name: `Museum`,
      level: 5,
      traits: ["Building", "Famous", "Infamous"],
      description: `A museum displays art, objects of important cultural note, wonders of the natural world, and other marvels in a place where citizens can observe and learn.`,
      bonuses: [
        {max: ability, value: 1},
        {activity: "Quell Unrest", ability, value: 1},
      ], // WAS +1 item bonus to Rest and Relax using Arts
      effects: `A magic item of level 6 or higher that has a particular import or bears significant historical or regional value (at the GM’s discretion) can be donated to a museum. Each time such an item is donated, reduce Unrest by 1. If that item is later removed from display, increase Unrest by 1.`,
    }, {
      name: `Boardwalk`,
      level: 8,
      traits: ["Yard"],
      description: `A section of the waterfront has been set aside for amusements and merriment.`,
      bonuses: [
        {max: ability, value: 1},
        {activity: "Quell Unrest", ability, value: 1},
      ], // WAS +1 item bonus to Go Fishing, and to Establish Trade Agreement and Rest and Relax using Boating
      effects: `A waterfront cannot be constructed unless the town is next to a river or lake.`,
    }, {
      name: `Theatre`,
      level: 9,
      traits: ["Building"],
      description: `A theater is a venue for concerts, plays, and dances, but can double as a place for debates or other events.`,
      bonuses: [
        {max: ability, value: 1},
        {activity: "Celebrate Holiday", ability: "Culture", value: 1},
      ], // WAS +2 item bonus to Celebrate Holiday.
      effects: `The first time you build a theater each Kingdom turn, reduce Unrest by 1. While in a settlement with a theater, you gain a +2 item bonus to Performance checks made to Earn Income.`,
      added({activity}) { activity.reduce("Unrest") }, // TODO limit to 1/turn
    }];

    return this.#addTraitToAll("Culture", ...maxBoosters);
  }

  static get economyStructures() {
    let ability = "Economy";
    /* Economy measures the practical day-to-day workings of your society as it
      comes together to do the work of making and building, buying and selling.
      How industrious are your citizenry? Are they devoted to building more,
      higher, and better, trading in goods, services, and ideas? If so, your
      kingdom likely has a robust Economy score. */
    let markets = [{
      name: `General Store`,
      level: 1,
      traits: ["Building"],
      bonuses: [{max: ability, value: 1}],
      effects: `A settlement without a general store or marketplace reduces its level for the purposes of determining what items can be purchased there by 2.`,
    }, {
      name: `Marketplace`,
      level: 4,
      traits: ["Building", "Residential"],
      description: `A marketplace is a large neighborhood of shops run by local vendors around an open area for traveling merchants and farmers to peddle their wares.`,
      bonuses: [{max: ability, value: 2}],
      effects: `A town without a general store or marketplace reduces its effective level for the purposes of determining what items can be purchased there by 2.`,
    }, {
      name: `Grand Bazaar`,
      level: 13,
      traits: ["Building", "Fame", "Infamy"],
      description: `This sprawling marketplace is a true hub of trade.`,
      bonuses: [{max: ability, value: 3}],
      effects: `A settlement with no general store, marketplace, or grand bazaar reduces its effective level for the purposes of determining what items can be purchased there by 2. The grand bazaar instead increases the settlement’s effective level for determining what items can be purchased by 2.`,
    }];

    let riverRoads = `This Settlement can use river networks as roads for connecting to other settlements and cities.`
    let boats = [{
      name: `Pier`,
      level: 3,
      traits: ["Yard"],
      description: `Several wooden piers allow easy access to fishing and provide a convenient place to moor boats.`,
      bonuses: [{max: ability, value: 1}],
      effects: riverRoads,
    }, {
      name: `Harbor`,
      level: 8,
      traits: ["Yard"],
      description: `A harbor serves as a bustling port for passengers and cargo. The harbor is supported by facilities for shipping and shipbuilding, but also features boardwalks for foot traffic and fishers to ply their trade.`,
      bonuses: [{max: ability, value: 2}],
      effects: [riverRoads, `A settlement with at least 1 harbor increases its effective level by 1 for the purposes of determining what level of items can be purchased in that settlement`].join("\n"),
    }, {
      name: `Port`,
      level: 12,
      traits: ["Yard"],
      description: `A port is a bustling hub of transport that is practically its own community.`,
      bonuses: [{max: ability, value: 3}],
      effects: [riverRoads, `A settlement with at least 1 port increases its effective level by 2 for the purposes of determining what level of items can be purchased in that settlement.`].join("\n"),
    }];
    let financials = [{
      name: `Bank`,
      level: 5,
      traits: ["Building"],
      description: `A bank is a secure building for storing valuables, granting loans, and collecting and transferring deposits.`,
      bonuses: [{max: ability, value: 1}, {max: "Stability", value: 1}],
    }, {
      name: `Mint`,
      level: 15,
      traits: ["Building"],
      description: `A mint allows the kingdom to produce its own coinage to augment its economy. It can also include fortified underground chambers to help serve as a treasury.`,
      newTurn: (domainSheet, settlement, structure) => { /* TODO add consumable */ },
      effects: `Once per turn, you may reroll an Economy roll.`,
    }];

    let maxBoosters = [...markets, ...financials, ...boats];

    return this.#addTraitToAll(
      "Economy",
      ...maxBoosters,
      {
        name: `Thieves' Guild`,
        level: 5,
        traits: ["Building", "Infamous"],
        description: `The government knows this group exists but allows it to continue doing its business as long as the guild doesn’t overstep its bounds.`,
        bonuses: [{max: ability, value: 2}, {max: "Stability", value: -1}],
        effects: `While in a settlement with a thieves’ guild, you gain a +1 item bonus to Create Forgeries.`,
      },
    );
  }

  static get loyaltyStructures() {
    let ability = "Loyalty";
    /* Loyalty measures the collective will, spirit, and sense of camaraderie
      the citizens of your nation possess. How much do they trust and depend
      on one another? How do they respond when you sound the call to arms
      or enact new laws? How do they react when other nations send spies or
      provocateurs into your lands to make trouble? If they support the
      kingdom’s leadership, the kingdom itself has a robust Loyalty score. */
    let maxBoosters = [{
      name: `Cemetery`,
      level: 1,
      traits: ["Yard"],
      limit: 2,
      description: `To bury the dead; can also include above-ground vaults or underground catacombs.`,
      bonuses: [{max: ability, value: 1}],
      effects: `Giving the citizens a place to bury and remember their departed loved ones helps to temper Unrest gained from dangerous events. If you have at least one cemetery in a settlement, reduce Unrest gained from any dangerous settlement events in that particular settlement by 1 (to a maximum of 4 for four cemeteries). The presence of a cemetery provides additional effects during certain kingdom events.`,
    }, {
      name: `Monument`,
      level: 4,
      traits: ["Yard"],
      limit: 2,
      description: `An impressive stone structure built to commemorate a historical event, honor a beloved leader, memorialize a tragedy, or simply serve as an artistic display.`,
      bonuses: [{max: ability, value: 2}],
    }, {
      name: `Court`,
      level: 9,
      traits: ["Building"],
      description: `Make your dedication to the rule of law concrete in a very real sense.`,
      bonuses: [
        {max: ability, value: 2},
        {activity: "Quell Unrest", ability, value: 1}
      ], // WAS +1 item bonus to Improve Lifestyle and to Quell Unrest using Politics
    }];

    return this.#addTraitToAll("Economy", ...maxBoosters);
  }

  static get stabilityStructures() {
    let ability = "Stability";
    /* Stability measures the physical health and well- being of your nation.
      This includes its infrastructure and buildings, the welfare of its people,
      and how well things are protected and maintained under your rule. How
      carefully do you maintain your stores and reserves, repair things that
      are broken, and provide for the necessities of life? How quickly can you
      mobilize to shield your citizens from harm? A kingdom that can handle both
      prosperity and disaster efficiently and effectively has a robust
      Stability score. */
    let builders = [{
      name: `Builders' Lot`,
      level: 3,
      traits: ["Yard"],
      description: `Dedicated builders live around and work from these lots, helping fix things up or keep new construction moving.`,
      bonuses: [{activity: "Build Structure", value: 1}, {max: ability, value: 1}], // WAS +1 to Build a Structure and to Repair Reputation (Decay)
    }, {
      name: `Construction Yard`,
      level: 10,
      traits: ["Yard"],
      description: `A construction yard supports the building of structures by providing a centralized place to gather supplies and craft components for larger projects.`,
      bonuses: [{activity: "Build Structure", value: 1}, {max: ability, value: 2}], // WAS +1 item bonus to Build Structure and to Repair Reputation (Decay)
    }];

    let lawAndOrder = [{
      name: `Jail`,
      level: 2,
      traits: ["Building"],
      description: `A jail is a fortified structure that houses criminals, prisoners, or dangerous monsters separate from the rest of society.`,
      bonuses: [{activity: "Quell Unrest", ability: "Loyalty", value: 1}, {max: ability, value: 1}], // WAS +1 item bonus to Quell Unrest using Intrigue
    }, {
      name: `Watchtower`,
      level: 3,
      traits: ["Building"],
      description: `A watchtower serves as a guard post that grants a settlement advance warning to upcoming dangerous events.`,
      bonuses: [{max: ability, value: 1}], // WAS +1 item bonus to checks to resolve events affecting the settlement.
      effects: `The first time you build a watchtower each Kingdom turn, decrease Unrest by 1.`,
      added({activity}) { activity.reduce("Unrest") }, // TODO limit to 1/turn
    }, {
      name: `Marshals Office`,
      level: 5,
      traits: ["Building"],
      description: `The central office for a Marshal, who will patrol the surrounding territory.`,
      bonuses: [{max: ability, value: 1}],
    }, {
      name: `Detective Agency`,
      level: 8,
      traits: ["Building"],
      description: `This building has both a holding cell and an office space in which detectives can do their work.`,
      bonuses: [{activity: "Quell Unrest", ability: "Loyalty", value: 1}, {max: ability, value: 2}], // WAS +2 to Quell Unrest (Intrigue) and to Repair Reputation (Crime)
      effects: `The first time you build a detective agency each turn, reduce Unrest by 1.`,
      added({activity}) { activity.reduce("Unrest") }, // TODO limit to 1/turn
    }];

    let maxBoosters = [...builders, ...lawAndOrder, {
      name: `Orphanage`,
      level: 2,
      traits: ["Building", "Residential"],
      description: `This sprawling residential building provides housing for orphans or even homeless citizens, but it can also help supply housing for refugees—but preferably not all at the same time, though!`,
      bonuses: [{max: ability, value: 1}],
      effects: `The first time you build an orphanage each turn, reduce Unrest by 1. Each time you would gain more than 1 Unrest due to citizen deaths or the destruction of residential structures or settlements, reduce the total Unrest gained by 1.`,
      added({activity}) { activity.reduce("Unrest") }, // TODO limit to 1/turn
    }];

    return this.#addTraitToAll("Stability", ...maxBoosters);
  }

  static get skillBoostStructures() {
    /* These exist primarily to provide skill bonuses for downtime activities */
    return [{
      name: `Trade Shop`,
      level: 3,
      traits: ["Building"],
      description: `A trade shop is a store that focuses on providing services.`,
      effects: `When you build a trade shop, indicate the kind of shop it is, such as a bakery, carpenter, tailor, and so on. While in a settlement with a trade shop, you gain a +1 item bonus to all associated Crafting checks.`,
      setup({settlement, structure, activity}) { this.name = prompt("What kind of shop is it?") },
    }, {
      name: `Trade Shop, Fine`,
      level: 6,
      traits: ["Building"],
      description: `A trade shop is a store that focuses on providing services.`,
      effects: `When you build a trade shop, indicate the kind of shop it is, such as a bakery, carpenter, tailor, and so on. While in a settlement with a trade shop, you gain a +2 item bonus to all associated Crafting checks.`,
      setup({settlement, structure, activity}) { this.name = prompt("What kind of shop is it?") },
    }, {
      name: `Trade Shop, World-Class`,
      level: 10,
      traits: ["Building"],
      description: `A trade shop is a store that focuses on providing services.`,
      effects: `When you build a trade shop, indicate the kind of shop it is, such as a bakery, carpenter, tailor, and so on. While in a settlement with a trade shop, you gain a +3 item bonus to all associated Crafting checks.`,
      setup({settlement, structure, activity}) { this.name = prompt("What kind of shop is it?") },
    }];
  }

  static get equipmentStructures() {
    /* These strucrures focus on giving the PCs purchasing options for their adventures */
    return [{ //////////////////////////////////////// Special shops let you buy equipment
      name: `Alchemy Laboratory`,
      level: 3,
      traits: ["Building"],
      limit: 3,
      description: `An alchemy laboratory serves as a factory for alchemists and their apprentices for the crafting of potions, elixirs, and all manner of alchemical items. An infamous kingdom’s laboratory might specialize in poisons as well.`,
      // TODO bonuses: [], // WAS +1 item bonus to Demolish
      effects: `Treat the settlement’s level as one level higher than its actual level for the purposes of determining which alchemical items are readily available for sale in that settlement. This effect stacks up to three times. Checks attempted to Identify Alchemy in any settlement with at least one alchemy laboratory gain a +1 item bonus.`,
    }, {
      name: `Illicit Market`,
      level: 6,
      traits: ["Building"],
      limit: 3,
      description: `An illicit market uses a facade of shops, homes, and other innocent-seeming buildings to cover the fact that unregulated and illegal trade takes place within its walls.`,
      effects: `When you build an Illicit Market, increase Unrest by 1.\nTreat the settlement’s level as one level higher than its actual level for the purposes of determining what items are readily available for sale in that settlement. This effect stacks up to three times.`,
      added({settlement, structure, activity}) { activity.boost("Unrest") },
    }, {
      name: `Luxury Store`,
      level: 6,
      traits: ["Building"],
      limit: 3,
      description: `This collection of stores specializes in expensive, rare, and exotic goods that cater to the wealthy.`,
      bonuses: [{activity: "Celebrate Holiday", ability: "Economy", value: 2}], // WAS +1 item bonus to Establish Trade Agreement
      effects: `Treat the settlement’s level as one level higher than its actual level for determining what luxury-themed magic items (subject to GM approval) are readily available for sale in that settlement. This effect stacks up to three times and overlaps with other stores that function in this way for more specific categories of magic items.`,
    }, {
      name: `Magic Shop`,
      level: 8,
      traits: ["Building"],
      limit: 3,
      description: `These shops specialize in magic items and in connecting buyers with sellers of magical goods and services.`,
      bonuses: [{activity: "Creative Solution", ability: "Culture", value: 2}], // WAS +1 item bonus to Supernatural Solution
      effects: `Treat the settlement’s level as one level higher than its actual level for the purposes of determining what magic items are readily available for sale in that settlement. This effect stacks up to three times and overlaps with other stores that function in this way for more specific categories of magic items.`,
    }];
  }

  static get settlementInfrastructure() {
    return [{ //////////////////////////////////////// Infrastructure improves hexes
      name: `Wall, Wooden`,
      level: 1,
      traits: ["Building", "Infrastructure"],
      description: `Wooden walls provide serviceable defenses to a settlement.`,
      effects: `A wooden wall is built along the border of your settlement. The first time you build a wooden wall in each settlement, reduce Unrest by 1.`,
      added({activity}) { activity.reduce({by: 1}, "Unrest") }, // TODO limit to 1/settlement
    }, {
      name: `Dump`,
      level: 2,
      traits: ["Yard"],
      description: `A dump is a centralized place for the disposal of refuse, often including a shack for a caretaker to live in.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Demolish
      effects: `Certain events have a more dangerous impact on settlements that don’t include a dump.`,
    }, {
      name: `Bridge`,
      level: 2,
      traits: ["Infrastructure"],
      description: `Bridges give settlements that have water borders a connection to land (but at the GM’s option, a border on a lake might not be able to use bridges).`,
      effects: `Bridges can only be built on Water Borders.`,
      setup() {
        this.crosses = prompt("What body of water does the bridge span?");
        this.name = `Bridge over ${this.crosses ?? 'the river'}`;
      },
    }, {
      name: `Paved Streets`,
      level: 4,
      traits: ["Infrastructure"],
      description: `Brick or cobblestone streets speed transportation and ease the passage of people, mounts, and vehicles.`,
      effects: `It takes a character only 5 minutes to move from one lot to an adjacent lot in an Urban Grid when moving on paved streets.`,
    }, {
      name: `Magical Streetlamps`,
      level: 5,
      traits: ["Infrastructure"],
      description: `Magical streetlamps are everburning torches that have been fitted within lampposts along the streets. At your option, these magical lights might even be free-floating spheres of light or other unusual forms of illumination.`,
      effects: `Magical streetlamps provide nighttime illumination for an entire settlement. The first time you build magical streetlamps in a Kingdom turn, reduce Unrest by 1.`,
      added({activity}) { activity.reduce({by: 1}, "Unrest") }, // TODO limit to 1/turn
    }, {
      name: `Wall, Stone`,
      level: 5,
      traits: ["Infrastructure"],
      description: `Stone walls provide solid defenses to a settlement’s borders.`,
      effects: `A stone wall is built along the border of your settlement. The first time you build a stone wall in each settlement, reduce Unrest by 1.`,
      added({activity}) { activity.reduce({by: 1}, "Unrest") }, // TODO limit to 1/settlement
    }, {
      name: `Sewer System`,
      level: 7,
      traits: ["Infrastructure"],
      description: `This underground sanitation system helps keep the settlement clean and disease-free.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Clandestine Business
      effects: `Having a sewer system can affect certain kingdom events.`,
    }];
  }

  static get abilityBoostHexStructures() {
    return [{
      name: `Hunters' Lodge`,
      level: 2,
      traits: ["Building"],
      description: `This lodge houses maps, training materials, and meat and hide processing areas for those who hunt game.`,
      bonuses: [
        {unlock: "Reconnoiter Hex"}, // TODO make activity unlocks work
      ], // WAS +2 to Hunt & Gather and to Rest & Relax (Wilderness)
      effects: `Hunters allow you to Reconnoiter Hexes as a Leadership Activity, but only within 3 hexes of this settlement.`,
    }, {
      name: `Explorers' Hall`,
      level: 4,
      traits: ["Building"],
      description: `In addition to being a meeting space, this hall contains maps and trophies from local explorers and adventurers.`,
      bonuses: [
        {unlock: "Reconnoiter Hex"}, // TODO make activity unlocks work
        {activity: "Hire Adventurers", value: 1},
        {activity: "Abandon Hex", value: 1},
        {activity: "Claim Hex", value: 1},
        {activity: "Clear Hex", value: 1},
        {activity: "Reconnoiter Hex", value: 1},
      ], // WAS +1 to Hire Adventurers and to Abandon, Claim, Clear, or Reconnoiter a Hex
      effects: `Hunters allow you to Reconnoiter Hexes as a Leadership Activity, but only within 3 hexes of this settlement.`,
    }, {
      name: `Explorers' Guild`,
      level: 8,
      traits: ["Building"],
      description: `This guild-hall boasts incredible trophies and luxurious interiors to suit even seasoned adventurers.`,
      bonuses: [
        {unlock: "Reconnoiter Hex"}, // TODO make activity unlocks work
        {activity: "Hire Adventurers", value: 2},
        {activity: "Abandon Hex", value: 2},
        {activity: "Claim Hex", value: 2},
        {activity: "Clear Hex", value: 2},
        {activity: "Reconnoiter Hex", value: 2},
      ], // WAS +2 to Hire Adventurers and to Abandon, Claim, Clear, or Reconnoiter a Hex
      effects: `The first time you build an exploration guild each turn, gain 1 Fame. Whenever you resolve a Monster Activity or similar kingdom event (at GM discretion), you gain 1 Fame at the start of the next kingdom turn.`,
      added({activity}) { activity.addFame() }, // TODO limit to 1/turn
    }];
  }

  static get activityBuildStructures() {
    return [{
      name: `Town Hall`,
      level: 2,
      traits: ["Building"],
      description: `A town hall is a public venue for town meetings and a repository for town history and records.`,
      bonuses: [{activity: "Establish Settlement", value: 1}],
      effects: `The first time you build a town hall each Kingdom turn, reduce Unrest by 1. A town hall in a capital allows PC leaders to take 3 Leadership activities during the Activity phase of a Kingdom turn rather than just 2.`,
      added({activity}) { activity.reduce("Unrest") }, // TODO limit to 1/turn
    }, {
      name: `Planning Bureau`,
      level: 5,
      traits: ["Building"],
      description: `An office stuffed full of bureaucrats and experience, plus records of past successes and failures.`,
      bonuses: [
        {activity: "Build Structure", value: 1},
        {activity: "Build Infrastructure", value: 1},
        {activity: "Establish Settlement", value: 1},
      ], // WAS +1 to all Stability-based checks, Establish Work Site, Build Roads, and Irrigation
      effects: `During the civic step of the Activity phase, declare one civic activity you plan to take during the next kingdom turn. At the start of the next kingdom turn’s Activity phase, you must perform the planned activity without using any standard activities; if for any reason you can’t perform the planned activity, gain 1d6 Unrest.`,
      added({activity}) { activity.reduce("Unrest") }, // TODO limit to 1/turn
      newTurn() { /* TODO add consumable plan */ },
    }];
  }

  // TODO should anything boost Pledge of Fealty?

  static get activityCreativeSolutionStructures() {
    let activity = "Creative Solution";
    let education = [{
      name: `School`,
      level: 5,
      traits: ["Building"],
      description: `A public school cares for children and teaches people a broad set of useful skills, educating the citizenry.`,
      bonuses: [{activity, value: 2}], // WAS +1 to all Culture-based checks and to Improve Lifestyle
      effects: `The educated populace can sometimes point out problems with higher-minded citizens’ solutions. If the kingdom fails or critically fails an attempt at a Creative Solution, roll a DC 11 flat check; on a success, the degree of success for the creative solution is improved by one step.`,
    }, {
      name: `Academy`,
      level: 10,
      traits: ["Building"],
      description: `An academy gives your citizens—and the PCs themselves— an institution where advanced study in many fields can be pursued, researched, and referenced.`,
      bonuses: [{activity, value: 2}], // WAS +2 item bonus to Creative Solution
      effects: `While in a settlement with an Academy, you gain a +2 item bonus to Lore checks made to Recall Knowledge while Investigating, to all checks made while Researching (Gamemastery Guide 154), and to Decipher Writing.`,
    }, {
      name: `Mystic Academy`,
      level: 12,
      traits: ["Building"],
      description: `A mystic academy is dedicated to the study of the mystic arts and the training of elite clerics, mages, and mystics.`,
      bonuses: [{activity, ability: "Culture", value: 2}], // WAS +2 to Supernatural Solution
      effects: `Once each each turn, you can choose to reduce Culture by 1 to increase any other Ability by 1.`,
      newTurn() { /* add consumable */ },
    }, {
      name: `University`,
      level: 15,
      traits: ["Building", "Famous"],
      description: `A university is a sprawling institution of higher learning.`,
      bonuses: [{activity, value: 3}], // WAS +3 item bonus to Creative Solution
      effects: `While in a settlement with a university, you gain a +3 item bonus to Lore checks made to Recall Knowledge while Investigating, to Research checks (Gamemastery Guide 154), and to Decipher Writing.`,
    }];

    return [...education];
  }

  static get activityWorkTheLandStructures() {
    let activity = "Work the Land";

    return [{
      name: `Lorekeeper`,
      level: 3,
      traits: ["Building"],
      description: `Lorekeepers weave stories into tradition.`,
      bonuses: [{activity: "Work the Land", ability: "Culture", value: 1}],
    }, {
      name: `Foundry`,
      level: 3,
      traits: ["Building"],
      description: `A foundry is a facility used to refine ore into finished metal.`,
      bonuses: [{activity: "Work the Land", ability: "Economy", value: 1}], // WAS +1 item bonus to Establish Work Site (mine)
    }, {
      name: `City Watch`,
      level: 3,
      traits: ["Building"],
      description: `Keep the streets safe and the gates open.`,
      bonuses: [{activity: "Work the Land", ability: "Loyalty", value: 1}],
    }, {
      name: `Lumberyard`,
      level: 3,
      traits: ["Yard"],
      description: `A lumberyard is an open area used to store additional lumber. The yard includes a lumber mill used to process lumber into timbers for construction purposes.`,
      bonuses: [{activity: "Work the Land", ability: "Stability", value: 1}], // WAS +1 item bonus to Establish Work Site (lumber camp)
    }]; // TODO it'd be nice to have one to boost culture & loyalty
  }

  static get activityCelebrateHolidayStructures() {
    let activity = "Celebrate Holiday";
    let religious = [{
      name: `Shrine`,
      level: 1,
      traits: ["Building"],
      limit: 3,
      description: `A shrine is a small building devoted to the worship of a deity or faith. It can be attended by resident priests or visiting clergy.`,
      bonuses: [{activity, value: 1}], // WAS +1 item bonus to Celebrate Holiday
      effects: `Treat the settlement’s level as one level higher than its actual level when determining what divine magic items are readily available for sale in that settlement. This effect stacks up to three times but does not stack with the same effect granted by temples or cathedrals.`,
    }, {
      name: `Temple`,
      level: 7,
      traits: ["Building", "Famous", "Infamous"],
      description: `A temple is a building devoted to worshipping a deity or faith.`,
      bonuses: [
        {activity, ability: "Culture", value: 1},
        {activity: "Quell Unrest", ability: "Culture", value: 1},
      ], // WAS +1 item bonus to Celebrate Holiday and Provide Care
      effects: `The first time you build a temple each Kingdom turn, reduce Unrest by 2. Treat the settlement’s level as one level higher than its actual level for the purposes of determining what divine magic items are readily available for sale in that settlement. This effect stacks up to three times but does not stack with the same effect granted by shrines or cathedrals.`,
      added({activity}) { activity.reduce({by: 2}, "Unrest") }, // TODO limit to 1/turn
    }, {
      name: `Cathedral`,
      level: 15,
      traits: ["Building", "Famous", "Infamous"],
      description: `A cathedral serves as a focal point of spiritual worship in the settlement and the seat of regional power for a religion. Most cathedrals are astounding works of art and eye-catching marvels of architecture.`,
      bonuses: [
        {activity, ability: "Culture", value: 2},
        {activity: "Quell Unrest", ability: "Culture", value: 2},
      ], // WAS +3 item bonus to Celebrate Holiday, Provide Care, and Repair Reputation (Corruption)
      effects: `The first time you build a cathedral in a turn, reduce Unrest by 4. While in a settlement with a cathedral, you gain a +3 item bonus to Lore and Religion checks made to Recall Knowledge while Investigating, and to all faith-themed checks made while Researching (Gamemastery Guide 154). Treat the settlement’s level as three levels higher than its actual level for the purposes of determining what divine magic items are available for sale in that settlement. This effect does not stack with the similar effect granted by shrines or temples.`,
      added({activity}) { activity.reduce({by: 4}, "Unrest") }, // TODO limit to 1/turn
    }];

    return [...religious];
  }

  static get activityRequestForeignAidStructures() {
    let activity = "Request Foreign Aid";

    return [{
      name: `Inn`,
      level: 1,
      traits: ["Building", "Residential"],
      description: `A safe and secure place for a settlement’s visitors to rest.`,
      bonuses: [{activity, value: 1}], // WAS +1 Item bonus to Hire Adventurers
    }, {
      name: `Expat District`,
      level: 4,
      traits: ["Yard"],
      description: `A section of this settlement houses a large population from elsewhere. They serve as a cultural connection between your lands.`,
      effects: `+1 Circumstance Bonus when using ${activity} with the associated group`,
      // TODO require naming the district when it's built to identify the group
      setup({settlement, structure, activity}) {
        this.groupName = prompt("What group is represented in the district?");
        this.name = `${this.groupName} ${this.name}`;
      },
    }, {
      name: `Embassy`,
      level: 8,
      traits: ["Building"],
      description: `An embassy gives a place for diplomatic visitors to your kingdom to stay and bolsters international relations.`,
      bonuses: [{activity, value: 2}], // TODO WAS +1 item bonus to Send Diplomatic Envoy and Request Foreign Aid
    }, {
      name: `Luxury Hotel`,
      level: 12,
      traits: ["Building", "Residential"],
      description: `Dedicated to making guests feel welcome, this structure is opulent and expensive.`,
      bonuses: [{activity, value: 2}],
    }];
  }

  static get activityQuellUnrestStructures() {
    let activity = "Quell Unrest";

    let usingCulture = [{
      name: `Library`,
      level: 2,
      traits: ["Building"],
      description: `A library contains collections of books, scrolls, writings, and records conducive to research. Some libraries specialize in certain topics, but it’s best to assume these libraries are well-rounded in what books they cover`,
      bonuses: [{activity, ability: "Culture", value: 1}], // WAS +1 item bonus to Rest and Relax using Scholarship checks
      effects: `While in a settlement with a library, you gain a +1 item bonus to Lore checks made to Recall Knowledge while Investigating, as well as to Researching (Gamemastery Guide 154), and to Decipher Writing.`,
    }, {
      name: `Arcanist's Tower`,
      level: 5,
      traits: ["Building"],
      limit: 2,
      description: `An arcanist’s tower is a home and laboratory for an arcane spellcaster (usually a wizard) and their apprentices, servants, and students.`,
      bonuses: [{activity, ability: "Culture", value: 1}], // WAS +1 item bonus to Quell Unrest using Magic
      effects: `Treat the settlement’s level as one level higher than its actual level for the purposes of determining which arcane magic items are readily available for sale in that settlement. This effect stacks up to three times. While in a settlement with an arcanist’s tower, you gain a +1 item bonus to checks made to Borrow an Arcane Spell or Learn a Spell.`,
    }, {
      name: `Printing House`,
      level: 10,
      traits: ["Building"],
      description: `A printing house gives your citizens – and the PCs themselves – a place to create newspapers and books.`,
      bonuses: [{activity, ability: "Culture", value: 2}], // WAS +2 to Quell Unrest and to Repair Reputation (Corruption, Strife)
      effects: `[Complete Linzi’s quest before this can be built] A PC in a settlement with a printing house gains a +2 item bonus to checks to Gather Information or to Research any topic which might appear in a library.`,
    }];
    let usingEconomy = []; // TODO these seem like they should exist. Circuses?
    let usingLoyalty = [{
      name: `Community Center`,
      level: 5,
      traits: ["Building"],
      description: `Unlike a town hall or other seat of governmental power, a community center is the center for the socialization and common activities of the populace.`,
      bonuses: [{activity, ability: "Loyalty", value: 1}], // WAS +1 to Quell Unrest and to all Loyalty-based kingdom skill checks
    }, {
      name: `Arena`,
      level: 9,
      traits: ["Yard"],
      description: `An Arena is a large public structure, traditionally open to the air, surrounded by seating and viewing areas. It’s used for staging competitions, athletics, gladiatorial combats, and elaborate entertainments and spectacles.`,
      bonuses: [
        {activity, ability: "Loyalty", value: 2},
        {activity: "Celebrate Holiday", ability: "Loyalty", value: 2},
      ], // WAS +2 item bonus to Celebrate Holiday and to Warfare checks made to Quell Unrest
      effects: `An arena lets you to retrain combat-themed feats more efficiently while in the settlement; doing so takes only 5 days rather than a week of downtime.`,
    }, {
      name: `Gladitorial Arena`,
      level: 15,
      traits: ["Yard", "Fame", "Infamy"],
      description: `A gladiatorial arena is a sprawling open-air field surrounded by seating and viewing areas. It also includes extensive underground barracks and training facilities for gladiators to use.`,
      bonuses: [
        {activity: "Quell Unrest", ability: "Loyalty", value: 3},
        {activity: "Celebrate Holiday", ability: "Loyalty", value: 3},
        {activity: "Hire Adventurers", value: 1},
      ], // WAS +3 to Celebrate Holiday, Hire Adventurers, or Quell Unrest (Warfare)
      effects: `A gladiatorial arena allows a PC in the settlement to retrain combat-themed feats (at the GM's discretion) more efficiently; doing so takes only 4 days rather than a week of downtime.`,
    }];
    let usingStability = [{
      name: `Herbalist`,
      level: 1,
      traits: ["Building"],
      description: `An herbalist consists of small medicinal gardens tended by those with knowledge of herbs and their uses to heal or to harm, as well as a storefront for customers.`,
      bonuses: [{activity, ability: "Stability", value: 1}], // WAS +1 item bonus to Provide Care
      effects: `Treat the settlement’s level as one higher than usual for the purpose of determining which alchemical healing items are available for sale; this effect stacks with similar effects to a max of three levels higher than usual. When in a settlement with an herbalist, you gain a +1 item bonus to Medicine checks to Treat Disease and Treat Wounds.`,
    }, {
      name: `Park`,
      level: 3,
      traits: ["Yard"],
      description: `A park is a plot of undeveloped land set aside for public use. This lot could be left as is, or the landscaping could be manipulated to have a specific look or type of terrain.`,
      bonuses: [{activity, ability: "Stability", value: 1}], // WAS +1 item bonus to Rest and Relax using Wilderness checks
      effects: `The first time you build a park each Kingdom turn, reduce Unrest by 1.`,
      added({activity}) { activity.reduce("Unrest") }, // TODO limit to 1/turn
    }, {
      name: `Sacred Grove`,
      level: 5,
      traits: ["Yard"],
      limit: 2,
      description: `This untouched land has been blessed by primal spirits, druids friendly with your settlement, or allied fey creatures.`,
      bonuses: [{activity, ability: "Stability", value: 1}], // WAS +1 item bonus to Quell Unrest using Folklore
      effects: `Treat the settlement’s level as one level higher than its actual level for the purposes of determining what primal magic items are readily available for sale in that settlement. This effect stacks up to three times.`,
    }, {
      name: `Managerie`,
      level: 12,
      traits: ["Building"],
      description: `A menagerie is a large zoo that contains numerous enclosures, exhibits, tanks, or open preserves meant to display wildlife.`,
      bonuses: [{activity, ability: "Stability", value: 2}], // WAS +2 item bonus to Rest and Relax using Wilderness
      effects: `A menagerie typically contains a selection of level 5 or lower animals. If your party captures a living creature of level 6 or higher and can transport the creature back to a settlement with a menagerie, you can add that creature to the menagerie as long as your kingdom level is at least 4 higher than the creature’s level. Each time such a creature is added to a menagerie, gain 1 Fame or Infamy point (as appropriate) or reduce Unrest by 1.\nOnly creatures with Intelligence modifiers of –4 or –5 are appropriate to place in a menagerie. A kingdom gains 1 Unrest at the start of a Kingdom turn for each sapient creature (anything with an Intelligence modifier of –3 or higher) on display in a menagerie.`,
    }];

    return [
      ...usingCulture,
      ...usingEconomy,
      ...usingLoyalty,
      ...usingStability,
      {
        name: `Hospital`,
        level: 9,
        traits: ["Building"],
        description: `A hospital is a building dedicated to healing the sick through both magical and mundane means.`,
        bonuses: [
          {activity, value: 1},
          {activity, ability: "Stability", value: 1},
        ], // WAS +2 to Provide Care; +1 to Quell Unrest
        effects: `Treat the settlement’s level as one higher than usual for the purpose of determining which healing items are available for sale; this effect stacks with similar effects to a max of three levels higher than usual. When in a settlement with a Hospital, you gain a +2 item bonus to Medicine checks to Treat Disease and Treat Wounds.`,
      }];
  }

  static get activityTakeChargeStructures() {
    let activity = "Take Charge";

    return [{
      name: `Rookery`,
      level: 3,
      traits: ["Building"],
      description: `A rookery is a fortified nesting ground for ravens or other birds often used to deliver messages.`,
      bonuses: [{activity, value: 1}], // WAS +1 to Focus Attention, Manage Trade Agreement, Request Foreign Aid, and Take Charge
      effects: `A rookery can be built in any claimed hex, rather than only in a settlement. A raven or other messenger bird can travel up to 8 hexes in a day (4 in inclement weather); if it cannot rest at a rookery each day on its path, you must succeed a DC 5 flat check or have the bird and its message be lost.`,
    }];
  }

  // TODO What boosts Train Lieutenant?

  static get activityHireAdventurersStructures() {
    let activity = "Hire Adventurers";
    let taverns = [{
      name: `Tavern, Dive`,
      level: 1,
      traits: ["Building"],
      description: `A dive tavern is a rough-and-tumble establishment for entertainment, eating, and drinking.`,
      effects: `The first time you build a dive tavern in a Kingdom turn, reduce Unrest by 1.`,
      added({activity}) { activity.reduce("Unrest") },
    }, {
      name: `Tavern, Popular`,
      level: 3,
      traits: ["Building"],
      description: `A popular tavern is a respectable establishment for entertainment, eating, and drinking.`,
      bonuses: [{activity, value: 1}], // WAS +1 item bonus to Hire Adventurers and to Rest and Relax using Trade
      effects: `The first time you build a popular tavern in a Kingdom turn, reduce Unrest by 2. If you attempt a Performance check to Earn Income in a settlement with a popular tavern, you gain a +1 item bonus to the check. All checks made to Gather Information in a settlement with at least one popular tavern gain a +1 item bonus.`,
      added({activity}) { activity.reduce({by: 2}, "Unrest") },
    }, {
      name: `Tavern, Luxury`,
      level: 9,
      traits: ["Building", "Famous"],
      description: `A luxury tavern is a high-class establishment for entertainment, eating, and drinking. It may even include a built-in stage for performers to use.`,
      bonuses: [{activity, value: 2}], // WAS +2 item bonus to Hire Adventurers and to Rest and Relax using Trade
      effects: `The first time you build a luxury tavern in a Kingdom turn, reduce Unrest by 1d4+1. If attempt a Performance check to Earn Income in a settlement with a luxury tavern, you gain a +2 item bonus to the check. All checks made to Gather Information in a settlement with at least one luxury tavern gain a +2 item bonus.`,
      added({activity}) { activity.reduce({by: [2, 3, 4, 5].random()}, "Unrest") },
    }, {
      name: `Tavern, World-Class`,
      level: 15,
      traits: ["Building", "Famous"],
      description: `A World-Class Tavern is a legendary establishment for entertainment, eating, and drinking. It has at least one venue for performances—perhaps multiple ones.`,
      bonuses: [{activity, value: 3}], // WAS +3 item bonus to Hire Adventurers, to Rest and Relax using Trade, and to Repair Reputation (Strife)
      effects: `The first time you build a world-class tavern in a turn, reduce Unrest by 2d4. If you try a Performance check to Earn Income in a settlement with a world-class tavern, you gain a +3 item bonus to the check. All checks made to Gather Information in a settlement with a world-class tavern gain a +3 item bonus.`,
      added({activity}) { activity.reduce({by: [1, 2, 3, 4].random() + [1, 2, 3, 4].random()}, "Unrest") },
    }];

    return [...taverns, {
      name: "Pathfinder Society Outpost",
      level: 9,
      traits: ["Building"],
      description: `When a Domain is as interesting as yours is, the Society takes notice`,
      bonuses: [{activity, value: 2}],
      effects: `Each turn, you may roll one die when using Clear A Hex or Claim A Hex.`,
      newTurn() { } // TODO add consumable
    }];
  }

  static get activityPrognosticationStructures() {
    let activity = "Prognostication";

    return [{
      name: `Harrow Reader`,
      level: 3,
      traits: ["Building"],
      description: `This business employs magic to read auras, predict the future, and provide magical assistance with curses and similar mystical maleficium.`,
      bonuses: [{activity, value: 1}], // WAS +1 item bonus to Prognostication
      effects: `While in a settlement with a harrow reader, you gain a +1 item bonus to checks made to Identify Magic, Learn a Spell, or Learn a Facet. This bonus is increased to +2 for divination magics and curses.`,
    }, {
      name: `Occult Shop`,
      level: 13,
      traits: ["Building"],
      description: `An occult shop is usually a sprawling, mysterious store that specializes in buying and selling obscure magic and strange curios. It often provides access to supernatural services like fortune-telling.`,
      bonuses: [{activity, value: 2}], // WAS +2 item bonus to Prognostication
      effects: `Treat the settlement's level as one higher than usual for the purposes of determining what magic items are available for sale in that settlement. This effect stacks up to three times and overlaps with other stores that function in this way. While in a settlement with an occult shop, you gain a +2 item bonus to checks made to Identify Magic, Learn a Spell, or Learn a Facet. This bonus is increased to +3 for divination magics and curses.`,
    }];
  }

  static get activityCreateAMasterpieceStructures() {
    let activity = "Create A Masterpiece";

    return [{
      name: `Art Studio`,
      level: 5,
      traits: ["Building"],
      description: `Artists appear in any sufficiently large settlement, but you have a special connection to this one, and you go here for inspiration.`,
      bonuses: [{activity, value: 1}],
      effects: `The first time you build an opera house each Kingdom turn, reduce Unrest by 1. `,
      added({activity}) { activity.reduce({by: 1}, "Unrest") },
    }, {
      name: `Artists' District`,
      level: 9,
      traits: ["Yard"],
      description: `A section of this settlement has become home to a variety of artists..`,
      bonuses: [{activity, value: 2}],
      effects: `The first time you build an opera house each Kingdom turn, reduce Unrest by 2. `,
      added({activity}) { activity.reduce({by: 2}, "Unrest") },
    }, {
      name: `Opera House`,
      level: 15,
      traits: ["Building", "Famous", "Infamous"],
      description: `An opera house functions well as a venue for operas, plays, and concerts, but also includes extensive facilities to aid in the training of all manner of bardic pursuits. Often, an opera house becomes a grandiose landmark, either due to its outlandish colors or eye-catching architecture.`,
      bonuses: [
        {activity: "Celebrate Holiday", ability: "Culture", value: 3},
        {activity, value: 3},
      ], // WAS +3 item bonus to Celebrate Holiday and Create a Masterpiece
      effects: `The first time you build an opera house each Kingdom turn, reduce Unrest by 4. While in a settlement with an opera house, you gain a +3 item bonus to Performance checks made to Earn Income.`,
      added({activity}) { activity.reduce({by: 4}, "Unrest") },
    }];
  }

  static get activityWarfareStructures() {
    return [{
      name: `Barracks`,
      level: 3,
      traits: ["Building", "Residential"],
      description: `Barracks are focused on housing and training guards, militia, soldiers, and military forces.`,
      bonuses: [
        {activity: "Garrison Army", ability: "Loyalty", value: 1},
        {activity: "Recover Army", ability: "Loyalty", value: 1},
        {activity: "Recruit Army", ability: "Loyalty", value: 1},
      ], // WAS +1 item bonus to Garrison Army, Recover Army, or Recruit Army (see the appendix starting on page 71)
      effects: `Barracks aid in the recruitment of armies and in helping soldiers recover from battle. The first time you build a barracks in any settlement, reduce Unrest by 1.`,
      added({activity}) { activity.reduce({by: 1}, "Unrest") }, // TODO limit to 1/turn
    }, {
      name: `Keep`,
      level: 3,
      traits: ["Building"],
      description: `A keep is a high-walled defensive structure that guards the heart of a settlement. It includes practice and marshaling yards as well as a refuge for your leaders should danger strike the settlement.`,
      bonuses: [
        {activity: "Deploy Army", value: 1},
        {activity: "Garrison Army", value: 1},
        {activity: "Train Army", value: 1},
      ], // WAS +1 item bonus to Deploy Army, Garrison Army, or Train Army (see the appendix starting on page 71)
      effects: `The first time you build a keep each Kingdom turn, reduce Unrest by 1.`,
      added({activity}) { activity.reduce({by: 1}, "Unrest") }, // TODO limit to 1/turn
    }, {
      name: `Garrison`,
      level: 5,
      traits: ["Building", "Residential"],
      description: `A garrison is a complex of barracks, training yards, and weapons storage and repair for maintaining your military.`,
      bonuses: [
        {activity: "Outfit Army", value: 1},
        {activity: "Train Army", value: 1},
      ], // WAS +1 item bonus to Outfit Army or Train Army (see the appendix starting on page 71)
      effects: `A garrison helps outfit armies with new gear or trains them. When you build a garrison, reduce Unrest by 1.`,
      added({activity}) { activity.reduce({by: 1}, "Unrest") },
    }, {
      name: `Castle`,
      level: 9,
      traits: ["Building", "Famous", "Infamous"],
      description: `A castle is a fortified structure that often serves as the seat of government for a kingdom.`,
      bonuses: [
        {activity: "Pledge of Fealty", value: 2},
        {activity: "Garrison Army", value: 2},
        {activity: "Recover Army", value: 2},
        {activity: "Recruit Army", value: 2},
      ], // TODO WAS +2 item bonus to New Leadership, Pledge of Fealty, Send Diplomatic Envoy, and +2 item bonus to Garrison Army, Recover Army, or Recruit Army (see the appendix starting on page 71)
      effects: `The first time you build a castle each Kingdom turn, reduce Unrest by 1d4.`,
      added({activity}) { activity.reduce({by: [1, 2, 3, 4].random()}, "Unrest") }, // TODO limit to 1/turn
    }, {
      name: `Military Academy`,
      level: 12,
      traits: ["Building"],
      description: `A military academy is dedicated to the study of war and the training of elite soldiers and officers.`,
      bonuses: [
        {activity: "Pledge of Fealty", ability: "Loyalty", value: 2},
        {activity: "Train Army", value: 2},
      ], // WAS +2 item bonus to Pledge of Fealty using Warfare, +2 item bonus to Train Army (see the appendix starting on page 71)
    }, {
      name: `Palace`,
      level: 15,
      traits: ["Building", "Famous", "Infamous"],
      description: `A palace is a grand and splendid seat of government for your leaders and other political functionaries.`,
      bonuses: [
        {activity: "Pledge of Fealty", value: 3},
        {activity: "Garrison Army", value: 3},
        {activity: "Recover Army", value: 3},
        {activity: "Recruit Army", value: 3},
      ], // WAS +3 item bonus to New Leadership, Pledge of Fealty, and Send Diplomatic Envoy, and +3 item bonus to Garrison Army, Recover Army, or Recruit Army (see the appendix starting on page 71)
      effects: `A palace can only be built in your capital. The first time you build a palace, reduce Unrest by 10.\nOnce your kingdom has a palace, a PC in the Ruler leadership role gains a +3 item bonus to checks made to resolve Leadership activities.`,
      added({activity}) { activity.reduce({by: 10}, "Unrest") }, // TODO limit to 1/ever
    }];
  }

  static get names() { return this._names ||= this.templates.map(s => s.name) }
  static template(name) { return this.templates.find(s => s.name === name) }
  static get templates() {
    return this._templates ||= [
      ...this.cultureStructures,
      ...this.economyStructures,
      ...this.loyaltyStructures,
      ...this.stabilityStructures,

      ...this.skillBoostStructures,
      ...this.equipmentStructures,
      ...this.settlementInfrastructure,
      
      ...this.abilityBoostHexStructures,
      ...this.activityBuildStructures,
      ...this.activityCreativeSolutionStructures,
      ...this.activityWorkTheLandStructures,
      ...this.activityCelebrateHolidayStructures,
      ...this.activityRequestForeignAidStructures,
      ...this.activityQuellUnrestStructures,
      ...this.activityTakeChargeStructures,
      ...this.activityHireAdventurersStructures,
      ...this.activityPrognosticationStructures,
      ...this.activityCreateAMasterpieceStructures,
      ...this.activityCreateAMasterpieceStructures,
      ...this.activityWarfareStructures,
    ]
      .map(template => {
        template.traits ??= [];
        template.description ??= ``;
        template.bonuses ??= [];
        template.effects ??= ``;
        template.dc ??= (template.level || 99) * 2 + 10;
        template.limit ??= 1;

        return template;
      })
      .sortBy("name")
      .sortBy("-level") }
}
