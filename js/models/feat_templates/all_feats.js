import { Die } from "../../dice.js";

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
  }, {
    name: "Quick Recovery",
    level: 3,
    prerequisites: [investedIn("stability")], //WAS: Stability 14
    description: "Harmful events are easier to end.",
    effects: "Your domain is known for its resilience. When you attempt to end an ongoing event, reduce the DC by 4.",
    bonuses: [
      {type: "dcModifier", value: -4, activity: "Event", label: "Ongoing Event"},
    ],
  }, {
    name: "Fame and Fortune",
    level: 11,
    description: "Success is celebrated with additional Fame.",
    // WAS: description: "Gain RP when you critically succeed using skills",
    // WAS: crit success -> +1 FIP + 1d RP
    effects: "Your domain's reputation has spread far and wide, bringing in visitors to behold the spectacle of your greatness and pay their respects. Whenever you critically succeed at an activity, gain 1 Fame.",
    decisionPicked({domain, activity, decision}) {
      console.log({name: decision.name, outcome: activity.outcome, decision});

      if (decision.name !== "Outcome") { return }
      if (activity.outcome !== "criticalSuccess") { return }

      activity.info("👨🏻‍🎤 News of this deed spreads far and wide!");
      domain.addFame({activity});
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
  }, {
    name: "Root Work",
    level: 1,
    prerequisites: [trainedIn("culture")], //WAS: trained in Folklore
    description: "Folk magics protect against unexpected misfortune",
    // WAS: description: "Folk magics protect against unexpected misfortune",
    // WAS: new activity can give bonus to avoid events
    effects: "You lead your people in protective folk magic practices, spurring on mass practice of these simple rituals. Each turn, roll a DC 11 check. On a success, your sages see danger coming: gain a +2 circumstance bonus to resolve an event.",
    newTurn({activity}) {
      if (Die.flatCheck(11)) {
        activity.info("🧿 Root Work offers protection this turn");
        activity.addRollBonus({name: this.name, value: 2, activity: "Event"});
      } else {
        activity.info("🥀 Root Work provides no insight this turn");
      }
    },
  }, {
    name: "Sanctified Settlements",
    level: 15,
    prerequisites: [legendaryIn("culture"), {feat: "Unifying Faith"}], //WAS: legendary in Folklore; Unifying Faith
    description: "Your people’s faith is strong enough to resonate within the very streets and halls of their homes",
    // WAS: description: "Your people’s faith is strong enough to resonate within the very streets and halls of their homes",
    // WAS: all land is consecrated; can burn rp to enhance to 8th level
    effects: "Your people’s faith echoes throughout the land. All land or other areas within the influence of one or more of your settlements is constantly under the effects of the consecrate ritual. Each domain turn, you may choose to reduce one ability score to instead grant the effects of an 8th-rank consecrate.",
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
  }, {
    name: "Practical Magic",
    level: 1,
    prerequisites: [trainedIn("culture")], //WAS: trained in Magic
    description: "Commonplace magic improves practical skills",
    effects: "Magic has an honored place in your society, and your people incorporate it into their everyday work to make life easier. At the start of each turn, roll vs DC 11. On a success, gain a Creative Solution consumable.",
    // WAS: +1 circumstance bonus to Agriculture, Defense, Engineering, and Wilderness checks; if your kingdom is a master in Magic, this bonus increases to +2
    newTurn({domain, activity}) {
      let dc = 11;
      if (domain.hasFeat("Mystic Utopia")) { dc = 6 }
      if (Die.flatCheck(dc)) {
        activity.info("🪄 Practical Magic offers intriguing possibilities");
        domain.addReroll({name: "Magical Solution", description: "Reroll +2"});
      } else {
        activity.info("🐇 Practical Magic is always nice, but can't help this turn");
      }
    },
  }, {
    name: "Mage Corps",
    level: 2,
    prerequisites: [expertIn("culture")], //WAS: expert in Magic
    description: "Recruit special units of mages into your armies",
    effects: "Some of your domain's mages are studied in the application of war magics. You can add Mage Corps special units to your armies",
    bonuses: [
      {unlock: "Recruit Army", unit: "Mage Corps"},
    ],
  }, {
    name: "Mystic Utopia",
    level: 15,
    prerequisites: [legendaryIn("culture"), {feat: "Practical Magic"}], //WAS: legendary in Magic; Practical Magic
    description: "Magic suffuses the entire domain, making it a shining paragon of mystic power.",
    // WAS: description: "Magic suffuses the entire kingdom, making it a shining paragon of mystic power",
    // WAS: practical magic bonus is +3 now; advantage on Supernatural Solution checks
    effects: "The domain is a thoroughly mystic society. The DC for Practical Magic checks is now 5. When you make a Creative Solution check, roll twice and take the better result; this is a fortune effect.",
    // TODO bonuses: [
    // TODO   {type: "advantage", activity: "Creative Solution"},
    // TODO ],
  },
];

export const scholarlyFeats = [
  {
    name: "Alchemy Corps",
    level: 2,
    prerequisites: [expertIn("culture")], //WAS: expert in Scholarship
    description: "Access special units which grant utility and healing",
    // WAS: description: "Access special units which grant utility and healing",
    // WAS: can recruit Alchemy Corps units
    effects: "A subset of your domain's alchemical scholars receive training to work with your armies, passing out bombs, elixirs, and mutagens to enhance the army’s effects. You can add Alchemy Corps special units to your armies.",
    bonuses: [
      {unlock: "Recruit Army", unit: "Alchemy Corps"},
    ],
  },
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
  }, {
    name: "Strong Reputation",
    level: 2,
    prerequisites: [expertIn("loyalty")], //WAS: expert in Statecraft
    description: "Establish diplomatic ties and fealty more easily",
    // WAS: description: "Establish diplomatic ties and fealty more easily",
    // WAS: reduces the Negotiation DCs of other groups
    effects: "Your reputation as a fair and amicable nation (whether or not true) makes others more willing to interact with you. Your kingdom reduces the Negotiation DCs of other groups by 2.",
    bonuses: [
      {type: "dcModifier", value: -2, activity: "Pledge of Fealty", enabledByDefault: true},
      {type: "dcModifier", value: -2, activity: "Request Foreign Aid", enabledByDefault: true},
    ],
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
  {
    name: "Naval Regiments",
    level: 1,
    prerequisites: [trainedIn("economy")], //WAS: trained in Boating
    description: "Your vessels are also make good war engines.",
    // WAS: description: "Your vessels are also make good war engines",
    // WAS: can build Naval Corps units; army deploy bonus
    effects: "Life on the water is a focus for your people, and they know how to leverage their naval skills during warfare. You can add Naval Corps special units to your armies.",
    bonuses: [
      {unlock: "Recruit Army", unit: "Naval Corps"},
    ],
  }, {
    name: "Unfettered Sails",
    level: 15,
    prerequisites: [legendaryIn("economy")], //WAS: legendary in Boating, master in Magic or in Scholarship
    description: "Through clever magics or ingenious invention, your people have learned the secrets to sailing the skies, no longer tied only to waterways",
    effects: "With a bit of help from magicians or scholars, your sea-faring folk have learned to sail the skies. Your kingdom treats any above-ground areas as if they were connected by navigable waterways.",
  }
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
  }, {
    name: "Strategic Sabotage",
    level: 2,
    prerequisites: [expertIn("loyalty")], //WAS: expert in Intrigue
    description: "Infiltrate enemy armies and sabotage their efforts",
    // WAS: description: "Infiltrate enemy armies and sabotage their efforts",
    // WAS: new army action to sabotage before attacking
    // PROPOSED: same
  }, {
    name: "Preternatural Precautions",
    level: 7,
    prerequisites: [masterIn("loyalty")], //WAS: master in Intrigue
    description: "Avoid magical inquiries into your operations",
    effects: "Your kingdom’s operatives are well-versed in avoiding even magical detections. When using Intrigue, the DC is never increased due to special circumstances which you may not have been aware of, such as the presence of detection or scrying magics.\n" +
      "In addition, your kingdom cannot be scried upon, and your leadership knows if someone has attempted to do so. The Emissary and Magister may choose a heavily- guarded secret means of overcoming this kingdom-wide protection against scrying, determining who has access to the method. If the kingdom is at least master in Magic, the Emissary and Magister may also choose for those attempting to scry on you to observe a false reality instead of simply blocking the effect.",
  }, {
    name: "Unceasing Infiltration",
    level: 15,
    prerequisites: [legendaryIn("loyalty")], //WAS: legendary in Intrigue
    description: "You have spies everywhere, keeping you appraised",
    effects: "Your nation’s network of spies is extensive and always on the look-out for new information that may be beneficial.\n" +
      "At the start of the Activity phase of each domain turn, you may choose to attempt up to three free Infiltrations. You may instead choose to attempt only a single free Infiltration; if you do, treat your result as one degree of success better.",
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
    name: "Beast Mounts",
    level: 1,
    prerequisites: [trainedIn("stability")], //WAS: trained in Agriculture
    description: "Domesticate powerful animals to serve as mounts",
    // WAS: description: "Domesticate powerful animals to serve as mounts",
    // WAS: cavalry units get +2 bonus on melee attacks OR varied weapons tactic
    effects: "Your ranchers are exceptionally talented, capable of taming and raising wilder animals, such as bears, lions, or wolves. When tamed, these beasts can serve as mounts for the armies.",
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
  }, {
    name: "Monstrous Husbandry",
    level: 7,
    prerequisites: [masterIn("stability"), {feat: "Beast Mounts"}], //WAS: master in Agriculture; Beast Mounts
    description: "Domesticate even more powerful creatures",
    // WAS: description: "Domesticate even more powerful creatures",
    // WAS: increase Beasts of Burden bonus by 1; cavalry units get a bonus tactic depending on the type of creature your domain has reared (GM discretion): Aerial Battalion, Aquatic Battalion, Darkvision, Merciless, or Tough Soldiers.
    effects: "Your kingdom has learned to rear more than just animals, raising and taming drakes, troll-hounds, or gorgons, or even living with and rearing more intelligent creatures such as dragons, pegasi, or even the elusive phoenix. The GM determines which monstrous creatures are available for your kingdom to raise.",
    bonuses: [
      {type: "circumstance", activity: "Build Up", ability: "Stability", value: 2},
      {type: "circumstance", activity: "Build Infrastructure", ability: "Stability", value: 2},
    ],
  },
];

export const defenseFeats = [
  {
    name: "Fortified Fiefs",
    level: 1,
    prerequisites: [trainedIn("stability")], //WAS: trained in Defense
    description: "Bonus to Build defensive features",
    // WAS: description: "Bonus to Fortify or to Build certain Structures",
    // WAS: reduced DCs for Fortify Hex activity and when you use Build a Structure for a Barracks, Castle, Garrison, Keep, Wall, or Watchtower
    effects: "Your vassals take their duty to protect those under their stewardship seriously, and your engineers emphasize the value of a strong defense when building settlements and fortifications, reducing their cost by combining them with the rest of the settlement seamlessly",
    bonuses: [
      {type: "dcModifier", value: -2, activity: "Build Structure", label: "Building Fortifications"},
      {type: "dcModifier", value: -2, activity: "Build Infrastructure", label: "Building Fortifications"},
    ],
  }, {
    name: "Medic Corps",
    level: 1,
    prerequisites: [trainedIn("stability")], //WAS: trained in Defense
    description: "Access special units which grant healing",
    // WAS: description: "Access special units which grant healing",
    // WAS: can recruit Medic Corps units
    effects: "Collections of physicians, surgeons, clerics, shamans, and other healers march with your armies to tend to their wounds in the fields of battle. You can add Medic Corps special units to your armies.",
    bonuses: [
      {unlock: "Recruit Army", unit: "Medic Corps"},
    ],
  }, {
    name: "Culture of Vigilance",
    level: 2,
    prerequisites: [expertIn("stability")], //WAS: expert in Defense
    description: "Bonus against Intrigue and dangerous events",
    effects: "Your people are constantly alert to potential threats of all kinds, and specifically to the threats posed by outsiders. The kingdom gains a +1 circumstance bonus against all dangerous events.\n" +
      "The circumstance bonus from this feat is increased by 1 for Assassination Attempt, Bandit Activity, Cult Activity, Drug Den, Sacrifices, Sensational Crime, Vandals, and any other dangerous event contingent on criminal or espionage activity",
  }, {
    name: "Siege Preparation",
    level: 2,
    prerequisites: [expertIn("stability")], //WAS: expert in Defense
    description: "Settlements can survive siege longer",
    effects: "Your settlements are set up to defend more easily from siege tactics, reinforcing any fortifications they possess and storing additional supplies. The fortification statistics for your settlements increase AC by 5 and increase HP by half (round up). In addition, armies garrisoned in a settlement gain the Increased Ammunition tactic as a bonus tactic, so long as they have a ranged attack.",
  }, {
    name: "Continual Care",
    level: 5,
    prerequisites: [investedIn("stability")], //WAS: expert in Defense
    description: "Healers and mystics care for the people, reducing unrest.",
    // WAS: can Provide Care 1/leader/turn; later free action/turn
    effects: "The citizens of your domain value hospitality, and readily aid one another. At the start of each turn, reduce unrest by 1/5 of your Stability score.",
    newTurn({domain, activity}) {
      activity.reduce({by: -Math.ceil(domain.stability / 5)}, "unrest");
    },
  }, {
    name: "Unconquerable",
    level: 15,
    prerequisites: [legendaryIn("stability")], //WAS: legendary in Defense; Culture of Vigilance
    description: "You might completely ignore dangerous events, find spies with ease, and rally defenses rapidly",
    effects: "Your people are truly prepared for anything. Whenever the kingdom is faced with a dangerous event, you may choose to attempt a DC 6 flat check: on a success, the kingdom automatically succeeds the check to resolve the event, or critically succeeds if the flat check is a critical success. If the flat check fails, roll to resolve the event normally.",
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
  }, {
    name: "Efficient Repairs",
    level: 1,
    prerequisites: [trainedIn("stability")], //WAS: trained in Engineering
    description: "Repair structures faster and with less resources",
    effects: "When the kingdom attempts to use Build Structure to repair a structure, you may choose to either attempt an additional Build Structure activity for free but only to repair a structure, or to ignore the cost of repairing the single structure.",
  }, {
    name: "With What You’ve Got",
    level: 1,
    prerequisites: [trainedIn("stability")], //WAS: trained in Engineering
    description: "Suit the land to your needs more efficiently",
    effects: "Your engineers and builders are quite skillful in working with the land they build upon. When the domain attempts to Build Structures or Build Infrastructure, ignore the DC penalty for working on rough terrain by 2.",
    bonuses: [
      {type: "dcModifier", value: -2, activity: "Build Infrastructure", label: "Difficult Terrain"},
    ],
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
  }, {
    name: "Harmonious Blending",
    level: 1,
    prerequisites: [trainedIn("stability")], //WAS: trained in Wilderness
    description: "Settlements blend right into the wilds",
    // WAS: description: "Settlements blend right into the wilds",
    // WAS: bonus against events dependent on the status of the wilderness; free walls
    effects: "Your people build their settlements such that they blend directly into the wilds, granting better guerrilla tactics in warfare and mitigating potential dangers environmental effects pose to structures that stand out more from natural terrain. The kingdom gains a +1 circumstance bonus against Food Shortage, Food Surplus, Good Weather, Natural Disaster, and other events dependent on the status of the wilderness.\n" +
      "In addition, your villages and towns count as having wooden walls for the purpose of fortifications, and your cities count as having stone walls for the purpose of fortifications.",
    // TODO add banner to events; dc -2
    // TODO when settlement added/upgraded, add walls
  }, {
    name: "Natural Almanac",
    level: 2,
    prerequisites: [expertIn("stability")], //WAS: expert in Wilderness
    description: "Meticulous records make it easier to predict and adapt to natural phenomena",
    // WAS: description: "Meticulous records make it easier to predict and adapt to natural phenomena",
    // WAS: bonus to Establish Farmland, Harvest Crops & Livestock, and Hunt & Forage; bonus vs weather events
    effects: "Rangers, farmers, druids, and others who are attuned to nature keep careful track of the turning of the seasons and other natural cycles in the area. The domain gains a +4 circumstance bonus to Good Weather, Natural Disaster, and other events dependent on the weather and other natural cycles (at GM discretion).",
    // TODO add banner to weather events
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
