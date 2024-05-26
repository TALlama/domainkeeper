const maxStat = (maxAbility, value) => { return {maxAbility, value} };
const investedIn = (ability) => maxStat(ability, 7);
const minStat = (ability, value) => { return {ability, value} };
const trainedIn = (ability) => minStat(ability, 4);
const expertIn = (ability) => minStat(ability, 7);
const masterIn = (ability) => minStat(ability, 10);
const legendaryIn = (ability) => minStat(ability, 13);

const withTrait = (list, ...traits) => list.map(feat => { return {...feat, traits: [...(feat.traits || []), ...traits]} });

///////////////////////////////////////////////// General Feats
export const generalFeats = withTrait([
  {
    name: "Civil Service",
    level: 1,
    description: "An active citizenry gives one settlement a bonus each turn.",
    effects: "Your domain is administered by its citizens, who keep things moving even when the leaders are otherwise occupied. Each turn, one settlement can add a +2 circumstance bonus to its first activity.",
    newTurn({domain, activity}) {
      activity.addRollBonus({name: this.name, value: +2, actorType: `settlement`});
    },
  }, {
    name: "Cooperative Leadership",
    level: 1,
    description: "The domain effectively plans ahead to give one leader a bonus each turn.",
    effects: "Your leaders are skilled at working with one another. Each turn, one leader can add a +2 circumstance bonus to their first activity.",
    // WAS: focused attention is +3 instead of +2; later avoids crit fails
    newTurn({domain, activity}) {
      activity.addRollBonus({name: this.name, value: +2, actorType: `leader`});
    },
  }, {
    name: "Kingdom Assurance: Culture",
    level: 1,
    prerequisites: [investedIn("culture")], //WAS: trained in Culture
    description: "Receive a fixed result on any Culture check.",
    effects: "Even when things go poorly in other areas, you can count on consistency in carrying out activities using Culture. When you would attempt a check for that stat, you can forgo rolling and instead take a result equal to 10 + your proficiency bonus + any potency bonus; do not apply any other bonuses, penalties, or modifiers to this result.",
  }, {
    name: "Kingdom Assurance: Economy",
    level: 1,
    prerequisites: [investedIn("economy")], //WAS: trained in Economy
    description: "Receive a fixed result on any Economy check.",
    effects: "Even when things go poorly in other areas, you can count on consistency in carrying out activities using Economy. When you would attempt a check for that stat, you can forgo rolling and instead take a result equal to 10 + your proficiency bonus + any potency bonus; do not apply any other bonuses, penalties, or modifiers to this result.",
  }, {
    name: "Kingdom Assurance: Loyalty",
    level: 1,
    prerequisites: [investedIn("loyalty")], //WAS: trained in Loyalty
    description: "Receive a fixed result on any Loyalty check.",
    effects: "Even when things go poorly in other areas, you can count on consistency in carrying out activities using Loyalty. When you would attempt a check for that stat, you can forgo rolling and instead take a result equal to 10 + your proficiency bonus + any potency bonus; do not apply any other bonuses, penalties, or modifiers to this result.",
  }, {
    name: "Kingdom Assurance: Stability",
    level: 1,
    prerequisites: [investedIn("stability")], //WAS: trained in Stability
    description: "Receive a fixed result on any Stability check.",
    effects: "Even when things go poorly in other areas, you can count on consistency in carrying out activities using Stability. When you would attempt a check for that stat, you can forgo rolling and instead take a result equal to 10 + your proficiency bonus + any potency bonus; do not apply any other bonuses, penalties, or modifiers to this result.",
  }, {
  //   name: "Kingdom Skill Training",
  //   level: 1,
  //   description: "Gain a skill increase",
  //   // WAS: +2 to a skill, with normal level gates
  //   // PROPOSED: REMOVE - no skills to gain, and item bonus to activities is structures' job
  // }, {
    name: "Service Reform", // WAS: Endure Anarchy",
    level: 5,
    prerequisites: [investedIn("loyalty")], //WAS: "Loyalty 14",
    description: "Continual reform staves off unrest.",
    // WAS: description: "Recover from Unrest more quickly",
    // WAS: when decreasing unrest from 6+, loyalty/2 bonus to delta; anarchy @ unrest 24+
    effects: "The administrators of your domain are selected by merit and are known for their integrity. At the start of each turn, reduce unrest by 1/5 of your Loyalty score.",
    newTurn({domain, activity}) {
      activity.reduce({by: -Math.ceil(domain.loyalty / 5)}, "unrest");
    },
  }, {
    name: "Inspiring Entertainment",
    level: 5,
    prerequisites: [investedIn("culture")], //WAS: Culture 14
    description: "An active art scene lets people safely vent unrest.",
    // WAS: description: "Use Culture on checks to determine Unrest",
    // WAS: when gaining unrest, culture check reduces gain  by culture score; +1 culture bonus when unrest > 0
    effects: "A tradition of satire and truthtelling allows your domain to address hard problems. At the start of each turn, reduce unrest by 1/5 of your Culture score.",
    newTurn({domain, activity}) {
      activity.reduce({by: -Math.ceil(domain.culture / 5)}, "unrest");
    },
  },
], "General");

///////////////////////////////////////////////// Culture Feats
export const artFeats = [
  {
    name: "Impressive Accoutrements",
    level: 1,
    prerequisites: [trainedIn("culture")], //WAS: trained in Arts
    description: "A refined culture makes diplomacy easier.",
    // WAS: description: "Cultural refinement aids in diplomatic relations",
    // WAS: new activity burns luxury goods to boost Send Diplomatic Envoy, Request Foreign Aid, and Establish Trade Agreement
    effects: "You supply your diplomats with extravagant yet tasteful accoutrements which project power and position to those they speak to on your domain’s behalf. Once per turn, you can add a +2 circumstance bonus any check using Loyalty.",
    newTurn({activity}) {
      activity.addRollBonus({name: this.name, value: 2, ability: "Loyalty"});
    },
  }, {
    name: "Art Festivals",
    level: 2,
    prerequisites: [trainedIn("culture")],
    description: "Your domain sets aside time from work to enjoy the fruits of their labor.",
    effects: "Most citizens perform at the festivals, but everyone attends. Once per turn, you may reduce Economy by 1 to boost Culture by 1.",
    newTurn({activity}) {
      activity.addTrade({name: this.name, reduce: "Economy", boost: "Culture"});
    },
  }, {
    name: "National Specialty",
    level: 1,
    prerequisites: [trainedIn("culture")], //WAS: trained in Arts
    description: "The domain is renowned for a specific artform, which is broadly useful.",
    // WAS: description: "Artists produce better specific luxury goods",
    // WAS: +1 to Rest and Relax and to Create a Masterpiece & two more activities
    effects: "Your domain is known for its mastery of a particular artform, which is widely appreciated and sought after. You gain a +1 circumstance bonus to several abilities using Culture.",
    bonuses: [
      {type: "circumstance", activity: "Cool Down", ability: "Culture", value: 1},
      {type: "circumstance", activity: "Create A Masterpiece", ability: "Culture", value: 1},
    ],
  },
];

export const faithFeats = [
  {
    name: "Unifying Faith",
    level: 1,
    prerequisites: [trainedIn("loyalty")], //WAS: trained in Folklore
    description: "A national faith unifies your people’s values",
    // WAS: bonus to Celebrate Holiday, Quell Unrest, and Repair Reputation
    effects: "Your people share a collective faith, whether of a single deity or a particular national pantheon. The first time Culture would be reduced each turn, prevent 1 point of the reduction.",
    newTurn({activity}) {
      activity.addRollBonus({name: this.name, value: 2, ability: "Culture"});
    },
  },
];

export const magicFeats = [
  {
    name: "Conjure Commodities",
    level: 2,
    prerequisites: [expertIn("culture")], //WAS: trained in Magic
    description: "Use magic to conjure the commodities you need",
    // WAS: description: "Use Luxuries to conjure other commodities",
    // WAS: new activity burns 1 luxury to make 2 other commodities
    effects: "You lead your spellcasters in a coordinated ritual to produce the commodities your domain needs. Once per turn, you can reduce Culture by 1 to boost Economy by 1.",
    newTurn({activity}) {
      activity.addTrade({name: this.name, reduce: "Culture", boost: "Economy"});
    },
  },
];

export const scholarlyFeats = [
];

export const statecraftFeats = [
  {
    name: "Folk Stories",
    level: 2,
    prerequisites: [trainedIn("loyalty")],
    description: "There is a rich array of stories valorizing your domain's history and accomplishments.",
    effects: "A shared story helps people feel connected to their community. Once per turn, you may reduce Culture by 1 to boost Loyalty by 1.",
    newTurn({activity}) {
      activity.addTrade({name: this.name, reduce: "Culture", boost: "Loyalty"});
    },
  },
];

export const cultureFeats = withTrait([
  ...artFeats,
  ...faithFeats,
  ...magicFeats,
  ...scholarlyFeats,
  ...statecraftFeats,
], "Culture");

///////////////////////////////////////////////// Economy Feats
export const boatingFeats = [
];

export const explorationFeats = [
];

export const industryFeats = [
  {
    name: "Frugal",
    level: 1,
    prerequisites: [trainedIn("economy")],
    description: "Once per turn, gain a bonus to a stabiity check",
    effects: "The domain is known for its frugality and careful planning. Once per turn, add a +2 circumstance bonus to a stability check.",
    newTurn({activity}) {
      activity.addRollBonus({name: this.name, value: 2, ability: "Stability"});
    },
  }, {
    name: "Supply Chain",
    level: 2,
    prerequisites: [expertIn("economy")], //WAS: expert in Industry
    description: "Keep commodities moving to where they're most needed",
    // WAS: description: "Keep commodities moving to where they're most needed",
    // WAS: if commodities are gathered, bonus to Build Structure, Build Roads, Craft Luxuries, Create Masterpiece, Establish Settlement, and Trade Commodities
    effects: "Your domain has methods in place to quickly move raw materials where they need to be for the economy to function smoothly. Once per turn, you can reduce Economy by 1 to boost Stability by 1.",
    newTurn({activity}) {
      activity.addTrade({name: this.name, reduce: "Stability", boost: "Economy"});
    },
  },
];

export const tradeFeats = [
  {
    name: "County Fairs",
    level: 5,
    prerequisites: [expertIn("economy")], //WAS: expert in Trade
    description: "County fairs bring the domain together, reducing unrest and benefiting the economy.",
    effects: "Your domain’s county fairs are a time of celebration and commerce, where the rural and urban economies come together. Once per turn, you can reduce Stability by 1 to boost Economy by 1.",
    newTurn({activity}) {
      activity.addTrade({name: this.name, reduce: "Unrest", boost: "Economy"});
    },
  },
];

export const economyFeats = withTrait([
  ...boatingFeats,
  ...explorationFeats,
  ...industryFeats,
  ...tradeFeats,
], "Economy");

///////////////////////////////////////////////// Loyalty Feats
export const infiltrationFeats = [
  {
    name: "Patronage System",
    level: 2,
    prerequisites: [trainedIn("loyalty")],
    description: "The wealthy members of your society compete to patronize the arts.",
    effects: "Conspicuous consumption makes the arts grow, but fuels quiet fueds. Once per turn, you may reduce Loyalty by 1 to boost Culture by 1.",
    newTurn({activity}) {
      activity.addTrade({name: this.name, reduce: "Loyalty", boost: "Culture"});
    }
    }, {
    name: "Covert Collusion",
    level: 2,
    prerequisites: [trainedIn("loyalty")], //WAS: expert in Intrigue
    description: "Turning a blind eye to certain activities can be beneficial.",
    // WAS: description: "Reduce difficulty of continual clandestine business",
    // WAS: subsequent attempt at Clandestine Business only increases the DC by 1; no unrest on success
    effects: "In the shadows, your people are able to conduct business without the prying eyes of the law. Once per turn, you may boost Unrest by 1 to boost Economy by 1.",
    newTurn({activity}) {
      activity.addTrade({name: this.name, description: "Increase Economy and Unrest", reduce: "Unrest", reduceBy: 1, boost: "Economy"});
    }
  },
];

export const politicsFeats = [
  {
    name: "Appeal to Tradition",
    level: 2,
    prerequisites: [trainedIn("loyalty")], //WAS: trained in Politics
    description: "You adhere to tradition to inspire your citizens",
    // WAS: description: "You adhere to tradition to inspire your citizens",
    // WAS: +1 status bonus to Celebrate Holiday, New Leadership, and Quell Unrest when not using Warfare. This bonus increases to +2 if the domain’s at least master in Politics.
    effects: "Your leaders are well-versed in the values and traditions of your people, which grants them an exceptional ability to inspire the public to come together. Once per turn, you can reduce Stability by 1 to boost Loyalty by 1.",
    newTurn({activity}) {
      activity.addTrade({name: this.name, reduce: "Stability", boost: "Loyalty"});
    },
  },
];

export const warfareFeats = [
  {
    name: "Crush Dissent",
    level: 1,
    prerequisites: [trainedIn("loyalty")], //WAS: trained in Warfare
    description: "Stifle dissent before it has a chance to spread",
    // WAS: description: "Stifle dissent before it has a chance to spread",
    // WAS: use Warfare to avoid unrest
    effects: "Your rule brooks no dissent and stamps out traitors, making harsh examples of them.",
    bonuses: [
      {type: "circumstance", activity: "Quell Unrest", ability: "Loyalty", value: 1},
      {type: "circumstance", activity: "Take Charge", ability: "Loyalty", value: 1},
    ],
  }, {
    name: "Militant Peace-Keeping",
    level: 1,
    prerequisites: [trainedIn("loyalty")], //WAS: trained in Warfare
    description: "The threat of force keeps the peace.",
    // WAS: description: "Use Warfare for some Defense-related checks",
    // WAS: use Warfare instead of Defense for Fortify Hex and Repair Reputation (Crime); use Warfare on criminal events
    effects: "Your people know that your military is always ready to act, and this readiness helps to keep the peace.",
    bonuses: [
      {type: "circumstance", activity: "Build Up", ability: "Loyalty", value: 1},
      {type: "circumstance", activity: "Cool Down", ability: "Loyalty", value: 1},
    ],
  },
]

export const loyaltyFeats = withTrait([
  ...infiltrationFeats,
  ...politicsFeats,
  ...warfareFeats,
], "Loyalty");

///////////////////////////////////////////////// Stability Feats
export const agrictultureFeats = [
  {
    name: "Beasts of Burden",
    level: 1,
    prerequisites: [trainedIn("stability")], //WAS: trained in Agriculture
    description: "Use domestic animals to make work easier",
    // WAS: description: "Use domestic animals to make work easier",
    // WAS: bonus to Agriculture, Engineering, and Wilderness checks
    effects: "Your people use domesticated animals like horses, oxen, and the like to make their work easier. With animals serving as transport for people and goods, powering mills and towing plows, the domain gains a +1 circumstance bonus to a number of activities.",
    bonuses: [
      {type: "circumstance", activity: "Build Up", ability: "Stability", value: 1},
      {type: "circumstance", activity: "Build Infrastructure", ability: "Stability", value: 1},
    ],
  }, {
    name: "Medicinal Crops",
    level: 1,
    prerequisites: [trainedIn("stability")], //WAS: trained in Agriculture
    description: "Enhance your domain’s healing skills",
    effects: "Your farmers and other agricultural producers dedicate a portion of their efforts to medicinal crops, making sure your healers are always stocked with what they need." +
      "Additionally, you gain a +2 circumstance bonus to any event regarding disease or curses, such as the Plague and Undead Uprising random events.",
    bonuses: [
      {type: "circumstance", activity: "Cool Down", ability: "Stability", value: 1},
      {type: "circumstance", activity: "Quell Unrest", ability: "Stability", value: 1},
    ],
  }, {
    name: "Subsidize Agriculture",
    level: 2,
    prerequisites: [expertIn("stability")], //WAS: expert in Agriculture
    description: "Pay to keep farms growing sustainably.",
    // WAS: description: "Spend RP to improve crop harvests",
    // WAS: new free activity that burns RP to make food
    effects: "Your nation’s farmers are more willing to take risks and support the kingdom’s need for food if they have some assurance that they won’t have to rely on the whims of weather and crop yield. Once per turn, you can reduce Economy by 1 to boost Stability by 1.",
    newTurn({activity}) {
      activity.addTrade({name: this.name, reduce: "Economy", boost: "Stability"});
    },
  },
];

export const defenseFeats = [
  {
    name: "Continual Care",
    level: 5,
    prerequisites: [investedIn("stability")], //WAS: expert in Defense
    description: "Healers and mystics care for the people, reducing unrest.",
    // WAS: can Provide Care 1/leader/turn; later free action/turn
    effects: "The citizens of your domain value hospitality, and readily aid one another. At the start of each turn, reduce unrest by 1/5 of your Stability score.",
    newTurn({domain, activity}) {
      activity.reduce({by: -Math.ceil(domain.stability / 5)}, "unrest");
    },
  },
];

export const constructionFeats = [
  {
    name: "Dedicated Builders",
    level: 1,
    prerequisites: [trainedIn("stability")], //WAS: trained in Engineering
    description: "Gain a bonus to all attempts to build",
    effects: "Expansion and upgrades to structures and infrastructure are a constant feature of your people’s lives, and they are always ready to lend a hand in the construction of new buildings and roads. The domain gains a +1 circumstance bonus to all stability checks to Build Structures and Build Infrastructure.",
    bonuses: [
      {type: "circumstance", activity: "Build Structure", ability: "Stability", value: 1},
      {type: "circumstance", activity: "Build Infrastructure", ability: "Stability", value: 1},
    ],
  }, {
    name: "National Service",
    level: 2,
    prerequisites: [expertIn("stability")],
    description: "Citizens continually work to make the nation a better place.",
    effects: "The populace has organized to prioritize upkeep and modernization for their fellow citizens. Once per turn, you can reduce Loyalty by 1 to boost Stability by 1.",
    newTurn({activity}) {
      activity.addTrade({name: this.name, reduce: "Loyalty", boost: "Stability"});
    },
  },
];

export const wildernessFeats = [
  {
    name: "Friends of the Wild",
    level: 1,
    prerequisites: [trainedIn("stability")],
    description: "Your people identify and make use of the natural resources all around them.",
    effects: "The settlements of your domain incorporate the riches of the land. Once per turn, you can add a +2 circumstance bonus any check using Economy.",
    newTurn({activity}) {
      activity.addRollBonus({name: this.name, value: 2, ability: "Economy"});
    },
  },
];

export const stabilityFeats = withTrait([
  ...agrictultureFeats,
  ...defenseFeats,
  ...constructionFeats,
  ...wildernessFeats,
], "Stability");

///////////////////////////////////////////////// Summary Feat List
export const allFeats = [
  ...generalFeats,
  ...cultureFeats,
  ...economyFeats,
  ...loyaltyFeats,
  ...stabilityFeats,
].sortBy("level");
