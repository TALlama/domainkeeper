/********************************************************************************/
// The structure names and details are based on Paizo's Kingmaker Players Guide //
// They are used here under Paizo's Community Use Policy                        //
// See https://paizo.com/community/communityuse for details                     //
/********************************************************************************/

export class Structure {
  constructor(templateName, properties) {
    Object.assign(this, Structure.template(templateName));
    Object.assign(this, properties);

    this.id ??= `structure-${templateName}-${crypto.randomUUID()}`;
    this.traits ??= [];
    this.description ??= ``;
    this.bonuses ??= [];
    this.effects ??= ``;
  }

  static template(name) { return this.templates.find(s => s.name === name) }

  static get names() { return this._names ||= this.templates.map(s => s.name) }
  static get templates() { return this._templates ||= [
    {
      name: `Academy`,
      level: 10,
      traits: ["Building", "Ediface"],
      description: `An academy gives your citizens—and the PCs themselves— an institution where advanced study in many fields can be pursued, researched, and referenced.`,
      bonuses: [{activity: "Creative Solution", value: 2}], // WAS +2 item bonus to Creative Solution
      effects: `While in a settlement with an Academy, you gain a +2 item bonus to Lore checks made to Recall Knowledge while Investigating, to all checks made while Researching (Gamemastery Guide 154), and to Decipher Writing.`,
    },
    {
      name: `Alchemy Laboratory`,
      level: 3,
      traits: ["Building"],
      description: `An alchemy laboratory serves as a factory for alchemists and their apprentices for the crafting of potions, elixirs, and all manner of alchemical items. An infamous kingdom’s laboratory might specialize in poisons as well.`,
      // TODO bonuses: [], // WAS +1 item bonus to Demolish
      effects: `Treat the settlement’s level as one level higher than its actual level for the purposes of determining which alchemical items are readily available for sale in that settlement. This effect stacks up to three times. Checks attempted to Identify Alchemy in any settlement with at least one alchemy laboratory gain a +1 item bonus.`,
    },
    {
      name: `Arcanist's Tower`,
      level: 5,
      traits: ["Building"],
      description: `An arcanist’s tower is a home and laboratory for an arcane spellcaster (usually a wizard) and their apprentices, servants, and students.`,
      bonuses: [{activity: "Quell Unrest", ability: "Culture", value: 1}], // WAS +1 item bonus to Quell Unrest using Magic
      effects: `Treat the settlement’s level as one level higher than its actual level for the purposes of determining which arcane magic items are readily available for sale in that settlement. This effect stacks up to three times. While in a settlement with an arcanist’s tower, you gain a +1 item bonus to checks made to Borrow an Arcane Spell or Learn a Spell.`,
    },
    {
      name: `Arena`,
      level: 9,
      traits: ["Ediface", "Yard"],
      description: `An Arena is a large public structure, traditionally open to the air, surrounded by seating and viewing areas. It’s used for staging competitions, athletics, gladiatorial combats, and elaborate entertainments and spectacles.`,
      bonuses: [
        {activity: "Quell Unrest", ability: "Loyalty", value: 2},
        {activity: "Celebrate Holiday", ability: "Loyalty", value: 2},
      ], // WAS +2 item bonus to Celebrate Holiday and to Warfare checks made to Quell Unrest
      effects: `An arena lets you to retrain combat-themed feats more efficiently while in the settlement; doing so takes only 5 days rather than a week of downtime.`,
    },
    {
      name: `Bank`,
      level: 5,
      traits: ["Building"],
      description: `A bank is a secure building for storing valuables, granting loans, and collecting and transferring deposits.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Tap Treasury
      effects: `The Capital Investment Leadership activity can be used only within the influence area of a settlement with a bank.`,
    },
    {
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
    },
    {
      name: `Brewery`,
      level: 1,
      traits: ["Building"],
      description: `A brewery is devoted to crafting alcohol, be it beer, wine, or spirits. This building can represent bottlers, vineyards, or even structures that produce non-alcoholic drinks.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Establish Trade Agreement
      effects: `When you build a brewery, reduce Unrest by 1 as long as you have fewer than 4 breweries in the settlement at that time.`,
    },
    {
      name: `Bridge`,
      level: 2,
      traits: ["Infrastructure"],
      description: `Bridges give settlements that have water borders a connection to land (but at the GM’s option, a border on a lake might not be able to use bridges).`,
      effects: `A bridge allows an island settlement to provide influence (see Influence on page 47), negates the Trade penalty for island settlements (see Land Borders on page 46), and allows travel over its associated Water Border with ease (see Navigating an Urban Grid on page 46). Bridges can only be built on Water Borders. When you build a bridge, check the “Bridge” box on one of the Water Borders on your Urban Grid to indicate its location.`,
    },
    {
      name: `Builders' Lot`,
      level: 3,
      traits: ["Yard"],
      description: `Dedicated builders live around and work from these lots, helping fix things up or keep new construction moving.`,
      bonuses: [{activity: "Build Structure", value: 1}], // WAS +1 to Build a Structure and to Repair Reputation (Decay)
    },
    {
      name: `Castle`,
      level: 9,
      traits: ["Building", "Ediface", "Famous", "Infamous"],
      description: `A castle is a fortified structure that often serves as the seat of government for a kingdom.`,
      bonuses: [
        {activity: "Pledge of Fealty", value: 2},
        {activity: "Garrison Army", value: 2},
        {activity: "Recover Army", value: 2},
        {activity: "Recruit Army", value: 2},
      ], // TODO WAS +2 item bonus to New Leadership, Pledge of Fealty, Send Diplomatic Envoy, and +2 item bonus to Garrison Army, Recover Army, or Recruit Army (see the appendix starting on page 71)
      effects: `The first time you build a castle each Kingdom turn, reduce Unrest by 1d4. A castle in a capital allows PC leaders to take 3 Leadership activities during the Activity phase of a Kingdom turn rather than 2.`,
    },
    {
      name: `Cathedral`,
      level: 15,
      traits: ["Building", "Ediface", "Famous", "Infamous"],
      description: `A cathedral serves as a focal point of spiritual worship in the settlement and the seat of regional power for a religion. Most cathedrals are astounding works of art and eye-catching marvels of architecture.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +3 item bonus to Celebrate Holiday, Provide Care, and Repair Reputation (Corruption)
      effects: `The first time you build a cathedral in a turn, reduce Unrest by 4. While in a settlement with a cathedral, you gain a +3 item bonus to Lore and Religion checks made to Recall Knowledge while Investigating, and to all faith-themed checks made while Researching (Gamemastery Guide 154). Treat the settlement’s level as three levels higher than its actual level for the purposes of determining what divine magic items are available for sale in that settlement. This effect does not stack with the similar effect granted by shrines or temples.`,
    },
    {
      name: `Cemetery`,
      level: 1,
      traits: ["Yard"],
      description: `A cemetery sets aside a plot of land to bury the dead and can also include above-ground vaults or underground catacombs.`,
      effects: `Giving the citizens a place to bury and remember their departed loved ones helps to temper Unrest gained from dangerous events. If you have at least one cemetery in a settlement, reduce Unrest gained from any dangerous settlement events in that particular settlement by 1 (to a maximum of 4 for four cemeteries). The presence of a cemetery provides additional effects during certain kingdom events.`,
    },
    {
      name: `Community Center`,
      level: 5,
      traits: ["Building", "Ediface"],
      description: `Unlike a town hall or other seat of governmental power, a community center is the center for the socialization and common activities of the populace.`,
      bonuses: [{activity: "Quell Unrest", ability: "Loyalty", value: 1}], // WAS +1 to Quell Unrest and to all Loyalty-based kingdom skill checks
    },
    {
      name: `Construction Yard`,
      level: 10,
      traits: ["Yard"],
      description: `A construction yard supports the building of structures by providing a centralized place to gather supplies and craft components for larger projects.`,
      bonuses: [{activity: "Build Structure", value: 1}], // WAS +1 item bonus to Build Structure and to Repair Reputation (Decay)
    },
    {
      name: `Detective Agency`,
      level: 8,
      traits: ["Building"],
      description: `This building has both a holding cell and an office space in which detectives can do their work.`,
      bonuses: [{activity: "Quell Unrest", ability: "Loyalty", value: 1}], // WAS +2 to Quell Unrest (Intrigue) and to Repair Reputation (Crime)
      effects: `The first time you build a detective agency each turn, reduce Crime by 1.`,
    },
    {
      name: `Dump`,
      level: 2,
      traits: ["Yard"],
      description: `A dump is a centralized place for the disposal of refuse, often including a shack for a caretaker to live in.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Demolish
      effects: `Certain events have a more dangerous impact on settlements that don’t include a dump. A dump can’t be located in a block with any Residential structures.`,
    },
    {
      name: `Embassy`,
      level: 8,
      traits: ["Building"],
      description: `An embassy gives a place for diplomatic visitors to your kingdom to stay and bolsters international relations.`,
      bonuses: [{activity: "Request Foreign Aid", value: 1}], // TODO WAS +1 item bonus to Send Diplomatic Envoy and Request Foreign Aid
    },
    {
      name: `Explorer's Guild`,
      level: 10,
      traits: ["Building"],
      description: `This guild-hall boasts incredible trophies and luxurious interiors to suit even seasoned adventurers.`,
      bonuses: [
        {activity: "Hire Adventurers", value: 2},
        {activity: "Abandon Hex", value: 2},
        {activity: "Claim Hex", value: 2},
        {activity: "Clear Hex", value: 2},
        {activity: "Reconnoiter Hex", value: 2},
      ], // TODO WAS +2 to Hire Adventurers and to Abandon, Claim, Clear, or Reconnoiter a Hex
      effects: `The first time you build an exploration guild each turn, gain 1 Fame. Whenever you resolve a Monster Activity or similar kingdom event (at GM discretion), you gain 1 Fame at the start of the next kingdom turn.`,
    },
    {
      name: `Explorer's Hall`,
      level: 3,
      traits: ["Building"],
      description: `In addition to being a meeting space, this hall contains maps and trophies from local explorers and adventurers.`,
      bonuses: [
        {activity: "Hire Adventurers", value: 1},
        {activity: "Abandon Hex", value: 1},
        {activity: "Claim Hex", value: 1},
        {activity: "Clear Hex", value: 1},
        {activity: "Reconnoiter Hex", value: 1},
      ], // TODO WAS +1 to Hire Adventurers and to Abandon, Claim, Clear, or Reconnoiter a Hex
      effects: `The first time you build an exploration guild each turn, gain 1 Fame.`,
    },
    {
      name: `Festival Hall`,
      level: 3,
      traits: ["Building"],
      description: `A festival hall is a small building that gives performers a venue to entertain and citizens a place to gather for celebrations or simply to relax.`,
      bonuses: [{activity: "Celebrate Holiday", ability: "Culture", value: 1}], // WAS +1 item bonus to Celebrate Holiday
    },
    {
      name: `Foundry`,
      level: 3,
      traits: ["Building"],
      description: `A foundry is a facility used to refine ore into finished metal.`,
      bonuses: [{activity: "Work the Land", ability: "Economy", value: 1}], // WAS +1 item bonus to Establish Work Site (mine)
      effects: `By processing ore in a foundry, your settlements grow more efficient at storing your kingdom’s Commodities. Each foundry in your kingdom increases your maximum Ore Commodity capacity by 1. A foundry cannot share a block with a Residential structure.`,
    },
    {
      name: `Garrison`,
      level: 5,
      traits: ["Building", "Residential"],
      description: `A garrison is a complex of barracks, training yards, and weapons storage and repair for maintaining your military.`,
      bonuses: [
        {activity: "Outfit Army", value: 1},
        {activity: "Train Army", value: 1},
      ], // WAS +1 item bonus to Outfit Army or Train Army (see the appendix starting on page 71)
      effects: `A garrison helps outfit armies with new gear or trains them. When you build a garrison, reduce Unrest by 1.`,
    },
    {
      name: `General Store`,
      level: 1,
      traits: ["Building"],
      effects: `A settlement without a general store or marketplace reduces its level for the purposes of determining what items can be purchased there by 2.`,
    },
    {
      name: `Gladitorial Arena`,
      level: 15,
      traits: ["Ediface", "Yard", "Fame", "Infamy"],
      description: `A gladiatorial arena is a sprawling open-air field surrounded by seating and viewing areas. It also includes extensive underground barracks and training facilities for gladiators to use.`,
      bonuses: [
        {activity: "Quell Unrest", ability: "Loyalty", value: 3},
        {activity: "Celebrate Holiday", ability: "Loyalty", value: 3},
        {activity: "Hire Adventurers", value: 1},
      ], // WAS +3 to Celebrate Holiday, Hire Adventurers, or Quell Unrest (Warfare)
      effects: `A gladiatorial arena allows a PC in the settlement to retrain combat-themed feats (at the GM's discretion) more efficiently; doing so takes only 4 days rather than a week of downtime.`,
    },
    {
      name: `Granary`,
      level: 1,
      traits: ["Building"],
      description: `A granary consists of silos and warehouses for the storage of grain and other preserved foodstuffs.`,
      effects: `Each granary in your kingdom increases your maximum Food Commodity capacity by 1.`,
    },
    {
      name: `Grand Bazaar`,
      level: 13,
      traits: ["Building", "Ediface", "Fame", "Infamy"],
      description: `This sprawling marketplace is a true hub of trade.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +3 to Establish Trade Agreement, Trade Commodities, or Purchase Commodities
      effects: `A settlement with no general store, marketplace, or grand bazaar reduces its effective level for the purposes of determining what items can be purchased there by 2. The grand bazaar instead increases the settlement’s effective level for determining what items can be purchased by 2.`,
    },
    {
      name: `Guidhall`,
      level: 5,
      traits: ["Building"],
      description: `A guildhall serves as the headquarters for a trade guild or similar organization. It includes offices for its leaders and functionaries as well as workshops for its craftspeople and a storefront for customers. Guildhalls always specialize in a certain type of trade or pursuit, but typically, only the largest cities have multiple guildhalls. Smaller settlements tend to focus on one particular trade.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Economy skill checks associated with the guildhall’s specific trade focus
      effects: `While in a settlement with a guildhall, you gain a +1 item bonus to skill checks to Earn Income or to Repair. In addition, increase the settlement’s effective level by 1 for the purpose of determining what level of items are available for sale.`,
    },
    {
      name: `Harbor`,
      level: 8,
      traits: ["Yard"],
      description: `A harbor serves as a bustling port for passengers and cargo. The harbor is supported by facilities for shipping and shipbuilding, but also features boardwalks for foot traffic and fishers to ply their trade.`,
      // TODO bonuses: [{activity: "…", ability: "…", value: 1}], // WAS +2 to Go Fishing, Rest & Relax (Boating), and Establish Trade Agreement (Boating)
      effects: `A harbor must be constructed next to a water border. A settlement with at least 1 harbor increases its effective level by 1 for the purposes of determining what level of items can be purchased in that settlement; this bonus stacks with similar bonuses in the settlement.`,
    },
    {
      name: `Harrow Reader`,
      level: 3,
      traits: ["Building"],
      description: `This business employs magic to read auras, predict the future, and provide magical assistance with curses and similar mystical maleficium.`,
      bonuses: [{activity: "Prognostication", value: 1}], // WAS +1 item bonus to Prognostication
      effects: `While in a settlement with a harrow reader, you gain a +1 item bonus to checks made to Identify Magic, Learn a Spell, or Learn a Facet. This bonus is increased to +2 for divination magics and curses.`,
    },
    {
      name: `Herbalist`,
      level: 1,
      traits: ["Building"],
      description: `An herbalist consists of small medicinal gardens tended by those with knowledge of herbs and their uses to heal or to harm, as well as a storefront for customers.`,
      bonuses: [{activity: "Quell Unrest", ability: "Stability", value: 1}], // WAS +1 item bonus to Provide Care
      effects: `Treat the settlement’s level as one higher than usual for the purpose of determining which alchemical healing items are available for sale; this effect stacks with similar effects to a max of three levels higher than usual. When in a settlement with an herbalist, you gain a +1 item bonus to Medicine checks to Treat Disease and Treat Wounds.`,
    },
    {
      name: `Hospital`,
      level: 9,
      traits: ["Building"],
      description: `A hospital is a building dedicated to healing the sick through both magical and mundane means.`,
      bonuses: [
        {activity: "Quell Unrest", value: 1},
        {activity: "Quell Unrest", ability: "Stability", value: 1},
      ], // WAS +2 to Provide Care; +1 to Quell Unrest
      effects: `Treat the settlement’s level as one higher than usual for the purpose of determining which healing items are available for sale; this effect stacks with similar effects to a max of three levels higher than usual. When in a settlement with an herbalist, you gain a +2 item bonus to Medicine checks to Treat Disease and Treat Wounds.`,
    },
    { // TODO remove
      name: `Houses`,
      level: 1,
      traits: ["Building", "Residential"],
      description: `Houses provide a neighborhood of single and multi-family dwellings for your citizens.`,
      effects: `The first time you build houses each Kingdom turn, reduce Unrest by 1.`,
    },
    {
      name: `Hunter's Lodge`,
      level: 8,
      traits: ["Building"],
      description: `This lodge houses maps, training materials, and meat and hide processing areas for those who hunt game.`,
      // TODO bonuses: [{activity: "…", value: 1}], // WAS +2 to Hunt & Gather and to Rest & Relax (Wilderness)
      effects: `The hunter’s lodge must be built adjacent to a settlement border. Each time you successfully Hunt & Gather within the area of influence of a hunter’s lodge, you also gain 2 RP, or 2d4 RP if you critically succeed.`,
    },
    {
      name: `Illicit Market`,
      level: 6,
      traits: ["Building"],
      description: `An illicit market uses a facade of shops, homes, and other innocent-seeming buildings to cover the fact that unregulated and illegal trade takes place within its walls.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Clandestine Business
      // TODO Ruin +1 crime
      effects: `Treat the settlement’s level as one level higher than its actual level for the purposes of determining what items are readily available for sale in that settlement. This effect stacks up to three times.`,
    },
    {
      name: `Inn`,
      level: 1,
      traits: ["Building", "Residential"],
      description: `An inn provides a safe and secure place for a settlement’s visitors to rest.`,
      bonuses: [{activity: "Hire Adventurers", value: 1}], // WAS +1 Item bonus to Hire Adventurers
    },
    {
      name: `Jail`,
      level: 2,
      traits: ["Building"],
      description: `A jail is a fortified structure that houses criminals, prisoners, or dangerous monsters separate from the rest of society.`,
      bonuses: [{activity: "Quell Unrest", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Quell Unrest using Intrigue
      effects: `The first time you build a jail each a Kingdom turn, reduce Crime by 1.`,
    },
    {
      name: `Keep`,
      level: 3,
      traits: ["Building", "Ediface"],
      description: `A keep is a high-walled defensive structure that guards the heart of a settlement. It includes practice and marshaling yards as well as a refuge for your leaders should danger strike the settlement.`,
      bonuses: [
        {activity: "Deploy Army", value: 1},
        {activity: "Garrison Army", value: 1},
        {activity: "Train Army", value: 1},
      ], // WAS +1 item bonus to Deploy Army, Garrison Army, or Train Army (see the appendix starting on page 71)
      effects: `The first time you build a keep each Kingdom turn, reduce Unrest by 1.`,
    },
    {
      name: `Library`,
      level: 2,
      traits: ["Building"],
      description: `A library contains collections of books, scrolls, writings, and records conducive to research. Some libraries specialize in certain topics, but it’s best to assume these libraries are well-rounded in what books they cover`,
      bonuses: [{activity: "Quell Unrest", ability: "Culture", value: 1}], // WAS +1 item bonus to Rest and Relax using Scholarship checks
      effects: `While in a settlement with a library, you gain a +1 item bonus to Lore checks made to Recall Knowledge while Investigating, as well as to Researching (Gamemastery Guide 154), and to Decipher Writing.`,
    },
    {
      name: `Lumberyard`,
      level: 3,
      traits: ["Yard"],
      description: `A lumberyard is an open area used to store additional lumber. The yard includes a lumber mill used to process lumber into timbers for construction purposes.`,
      bonuses: [{activity: "Work the Land", ability: "Stability", value: 1}], // WAS +1 item bonus to Establish Work Site (lumber camp)
      effects: `Each lumberyard in your kingdom increases maximum Lumber Commodity capacity by 1. A lumberyard must be built in a lot next to a Water border, both to give the yard a source of power to run saws to process timber, but more importantly to facilitate the shipment of trees to the yard.`,
    },
    {
      name: `Luxury Store`,
      level: 6,
      traits: ["Building"],
      description: `This collection of stores specializes in expensive, rare, and exotic goods that cater to the wealthy.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Establish Trade Agreement
      effects: `A luxury store must be built on a block that
      has either a mansion or a noble villa. Treat the settlement’s level as one level higher than its actual level for determining what luxury-themed magic items (subject to GM approval) are readily available for sale in that settlement. This effect stacks up to three times and overlaps with other stores that function in this way for more specific categories of magic items.`,
    },
    {
      name: `Magic Shop`,
      level: 8,
      traits: ["Building"],
      description: `These shops specialize in magic items and in connecting buyers with sellers of magical goods and services.`,
      bonuses: [{activity: "Creative Solution", ability: "Culture", value: 1}], // WAS +1 item bonus to Supernatural Solution
      effects: `Treat the settlement’s level as one level higher than its actual level for the purposes of determining what magic items are readily available for sale in that settlement. This effect stacks up to three times and overlaps with other stores that function in this way for more specific categories of magic items.`,
    },
    {
      name: `Magical Streetlamps`,
      level: 5,
      traits: ["Infrastructure"],
      description: `Magical streetlamps are everburning torches that have been fitted within lampposts along the streets. At your option, these magical lights might even be free-floating spheres of light or other unusual forms of illumination.`,
      effects: `Magical streetlamps provide nighttime illumination for an entire Urban Grid. When you build magical streetlamps, check the magical streetlamps checkbox on your Urban Grid. The first time you build magical streetlamps in a Kingdom turn, reduce Crime by 1.`,
    },
    { // TODO remove?
      name: `Mansion`,
      level: 5,
      traits: ["Building", "Residential"],
      description: `This larger manor house houses a wealthy family.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Improve Lifestyle
    },
    {
      name: `Marketplace`,
      level: 4,
      traits: ["Building", "Residential"],
      description: `A marketplace is a large neighborhood of shops run by local vendors around an open area for traveling merchants and farmers to peddle their wares.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Establish Trade Agreement
      effects: `A town without a general store or marketplace reduces its effective level for the purposes of determining what items can be purchased there by 2.`,
    },
    {
      name: `Managerie`,
      level: 12,
      traits: ["Building", "Ediface"],
      description: `A menagerie is a large zoo that contains numerous enclosures, exhibits, tanks, or open preserves meant to display wildlife.`,
      bonuses: [{activity: "Quell Unrest", ability: "Stability", value: 2}], // WAS +2 item bonus to Rest and Relax using Wilderness
      effects: `A menagerie typically contains a selection of level 5 or lower animals. If your party captures a living creature of level 6 or higher and can transport the creature back to a settlement with a menagerie, you can add that creature to the menagerie as long as your kingdom level is at least 4 higher than the creature’s level. Each time such a creature is added to a menagerie, gain 1 Fame or Infamy point (as appropriate) or reduce one Ruin of your choice by 1.\nOnly creatures with Intelligence modifiers of –4 or –5 are appropriate to place in a menagerie. A kingdom gains 1 Unrest at the start of a Kingdom turn for each sapient creature (anything with an Intelligence modifier of –3 or higher) on display in a menagerie.`,
    },
    {
      name: `Military Academy`,
      level: 12,
      traits: ["Building", "Ediface"],
      description: `A military academy is dedicated to the study of war and the training of elite soldiers and officers.`,
      bonuses: [
        {activity: "Pledge of Fealty", ability: "Loyalty", value: 2},
        {activity: "Train Army", value: 2},
      ], // WAS +2 item bonus to Pledge of Fealty using Warfare, +2 item bonus to Train Army (see the appendix starting on page 71)
    },
    {
      name: `Mill`,
      level: 2,
      traits: ["Building"],
      description: `A mill grinds grain using the power of wind, water, or beasts of burden.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Harvest Crops
      effects: `If a settlement includes at least one mill built on a lot adjacent to a Water border, the increased efficiency of these mills reduces the settlement’s Consumption by 1 (to a minimum of 0).`,
    },
    {
      name: `Mint`,
      level: 15,
      traits: ["Building", "Ediface"],
      description: `A mint allows the kingdom to produce its own coinage to augment its economy. It can also include fortified underground chambers to help serve as a treasury.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +3 item bonus to Capital Investment, Collect Taxes, and to Repair Reputation (Crime)
    },
    {
      name: `Monument`,
      level: 3,
      traits: ["Building", "Ediface"],
      description: `A monument is an impressive stone structure built to commemorate a historical event, honor a beloved leader, memorialize a tragedy, or simply serve as an artistic display.`,
      effects: `The first time you build a monument each Kingdom turn, reduce Unrest by 1 and reduce one Ruin of your choice by 1.`,
    },
    {
      name: `Museum`,
      level: 5,
      traits: ["Building", "Famous", "Infamous"],
      description: `A museum displays art, objects of important cultural note, wonders of the natural world, and other marvels in a place where citizens can observe and learn.`,
      bonuses: [{activity: "Quell Unrest", ability: "Culture", value: 1}], // WAS +1 item bonus to Rest and Relax using Arts
      effects: `A magic item of level 6 or higher that has a particular import or bears significant historical or regional value (at the GM’s discretion) can be donated to a museum. Each time such an item is donated, reduce Unrest by 1. If that item is later removed from display, increase Unrest by 1.`,
    },
    {
      name: `Mystic Academy`,
      level: 12,
      traits: ["Building", "Ediface"],
      description: `A mystic academy is dedicated to the study of the mystic arts and the training of elite clerics, mages, and mystics.`,
      bonuses: [{activity: "Creative Solution", ability: "Culture", value: 2}], // WAS +2 to Supernatural Solution
      effects: `At the start of the Activity phase of the kingdom turn, you may spend 6 RP to perform a free Supernatural Solution; although this is a leadership activity, it is not rolled by a leader and gains no leader benefits. If the military academy is built on the same lot as a mystic academy, both can be used simultaneously to upgrade to a university.`,
    },
    { // TODO remove?
      name: `Noble Villa`,
      level: 9,
      traits: ["Building", "Residential"],
      description: `This sprawling manor has luxurious grounds. It houses a noble family and their staff, and includes several smaller support structures such as servant’s quarters, stables, and groundskeeper’s cottages in addition to a manor.`,
      bonuses: [{activity: "Quell Unrest", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Improve Lifestyle and to Quell Unrest using Politics
      effects: `The first time you build a noble villa each Kingdom turn, reduce Unrest by 2.`,
    },
    {
      name: `Occult Shop`,
      level: 13,
      traits: ["Building"],
      description: `An occult shop is usually a sprawling, mysterious store that specializes in buying and selling obscure magic and strange curios. It often provides access to supernatural services like fortune-telling.`,
      bonuses: [{activity: "Prognostication", value: 2}], // WAS +2 item bonus to Prognostication
      effects: `Treat the settlement's level as one higher than usual for the purposes of determining what magic items are available for sale in that settlement. This effect stacks up to three times and overlaps with other stores that function in this way. While in a settlement with an occult shop, you gain a +2 item bonus to checks made to Identify Magic, Learn a Spell, or Learn a Facet. This bonus is increased to +3 for divination magics and curses.`,
    },
    {
      name: `Opera House`,
      level: 15,
      traits: ["Building", "Ediface", "Famous", "Infamous"],
      description: `An opera house functions well as a venue for operas, plays, and concerts, but also includes extensive facilities to aid in the training of all manner of bardic pursuits. Often, an opera house becomes a grandiose landmark, either due to its outlandish colors or eye-catching architecture.`,
      bonuses: [
        {activity: "Celebrate Holiday", ability: "Culture", value: 3},
        {activity: "Create A Masterpiece", value: 3},
      ], // WAS +3 item bonus to Celebrate Holiday and Create a Masterpiece
      effects: `The first time you build an opera house each Kingdom turn, reduce Unrest by 4. While in a settlement with an opera house, you gain a +3 item bonus to Performance checks made to Earn Income.`,
    },
    { // TODO remove?
      name: `Orphanage`,
      level: 2,
      traits: ["Building", "Residential"],
      description: `This sprawling residential building provides housing for orphans or even homeless citizens, but it can also help supply housing for refugees—but preferably not all at the same time, though!`,
      effects: `The first time you build an orphanage each turn, reduce Unrest by 1. Each time you would gain more than 1 Unrest due to citizen deaths or the destruction of residential structures or settlements, reduce the total Unrest gained by 1.`,
    },
    {
      name: `Palace`,
      level: 15,
      traits: ["Building", "Ediface", "Famous", "Infamous"],
      description: `A palace is a grand and splendid seat of government for your leaders and other political functionaries.`,
      bonuses: [
        {activity: "Pledge of Fealty", value: 3},
        {activity: "Garrison Army", value: 3},
        {activity: "Recover Army", value: 3},
        {activity: "Recruit Army", value: 3},
      ], // WAS +3 item bonus to New Leadership, Pledge of Fealty, and Send Diplomatic Envoy, and +3 item bonus to Garrison Army, Recover Army, or Recruit Army (see the appendix starting on page 71)
      effects: `A palace can only be built in your capital. The first time you build a palace, reduce Unrest by 10.\nIf you Relocate your Capital, a palace left behind in that capital instead functions as a noble villa that takes up 4 lots. (If you represent this by placing two noble villas in these lots, make sure to note that they constitute a single building and aren’t two separate structures.)\nA palace in a capital allows PC leaders to take 3 Leadership activities during the Activity phase of a Kingdom turn rather than just 2. In addition, once your kingdom has a palace, a PC in the Ruler leadership role gains a +3 item bonus to checks made to resolve Leadership activities.`,
    },
    {
      name: `Park`,
      level: 3,
      traits: ["Yard"],
      description: `A park is a plot of undeveloped land set aside for public use. This lot could be left as is, or the landscaping could be manipulated to have a specific look or type of terrain.`,
      bonuses: [{activity: "Quell Unrest", ability: "Stability", value: 1}], // WAS +1 item bonus to Rest and Relax using Wilderness checks
      effects: `The first time you build a park each Kingdom turn, reduce Unrest by 1.`,
    },
    {
      name: `Paved Streets`,
      level: 4,
      traits: ["Infrastructure"],
      description: `Brick or cobblestone streets speed transportation and ease the passage of people, mounts, and vehicles.`,
      effects: `It takes a character only 5 minutes to move from one lot to an adjacent lot in an Urban Grid when moving on paved streets. When you build paved streets, check the paved streets checkbox on your Urban Grid.`,
    },
    {
      name: `Pier`,
      level: 3,
      traits: ["Yard"],
      description: `Several wooden piers allow easy access to fishing and provide a convenient place to moor boats.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Go Fishing
      effects: `A pier must be built in a lot next to a Water border.`,
    },
    {
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
    },
    {
      name: `Port`,
      level: 12,
      traits: ["Yard"],
      description: `A port is a bustling hub of transport that is practically its own community.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +3 to Go Fishing, Rest & Relax (Boating), and Establish Trade Agreement (Boating)
      effects: `A port must be constructed next to a water border. A settlement with at least 1 port increases its effective level by 1 for the purposes of determining what level of items can be purchased in that settlement; this bonus stacks with similar bonuses in the settlement.`,
    },
    {
      name: `Printing House`,
      level: 10,
      traits: ["Building", "Ediface"],
      description: `A printing house gives your citizens – and the PCs themselves – a place to create newspapers and books.`,
      bonuses: [{activity: "Quell Unrest", ability: "Culture", value: 2}], // WAS +2 to Quell Unrest and to Repair Reputation (Corruption, Strife)
      effects: `[Complete Linzi’s quest before this can be built] A PC in a settlement with a printing house gains a +2 item bonus to checks to Gather Information or to Research any topic which might appear in a library.`,
    },
    {
      name: `Rookery`,
      level: 3,
      traits: ["Building", "Ediface"],
      description: `A rookery is a fortified nesting ground for ravens or other birds often used to deliver messages.`,
      bonuses: [{activity: "Take Charge", value: 1}], // WAS +1 to Focus Attention, Manage Trade Agreement, Request Foreign Aid, and Take Charge
      effects: `A rookery can be built in any claimed hex, rather than only in a settlement. A raven or other messenger bird can travel up to 8 hexes in a day (4 in inclement weather); if it cannot rest at a rookery each day on its path, you must succeed a DC 5 flat check or have the bird and its message be lost.`,
    },
    {
      name: `Sacred Grove`,
      level: 5,
      traits: ["Yard"],
      description: `This untouched land has been blessed by primal spirits, druids friendly with your settlement, or allied fey creatures.`,
      bonuses: [{activity: "Quell Unrest", ability: "Culture", value: 1}], // WAS +1 item bonus to Quell Unrest using Folklore
      effects: `Treat the settlement’s level as one level higher than its actual level for the purposes of determining what primal magic items are readily available for sale in that settlement. This effect stacks up to three times.`,
    },
    {
      name: `School`,
      level: 5,
      traits: ["Building", "Ediface"],
      description: `A public school cares for children and teaches people a broad set of useful skills, educating the citizenry.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 to all Culture-based checks and to Improve Lifestyle
      effects: `The educated populace can sometimes point out problems with higher-minded citizens’ solutions. If the kingdom fails or critically fails an attempt at a Creative Solution, roll a DC 11 flat check; on a success, the degree of success for the creative solution is improved by one step.`,
    },
    {
      name: `Secure Warehouse`,
      level: 6,
      traits: ["Building"],
      description: `Secure warehouses are used to store valuables.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Craft Luxuries
      effects: `Each secure warehouse in your kingdom increases your maximum Luxuries Commodity capacity by 1.`,
    },
    {
      name: `Sewer System`,
      level: 7,
      traits: ["Infrastructure"],
      description: `This underground sanitation system helps keep the settlement clean and disease-free.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Clandestine Business
      effects: `A sewer system reduces the settlement’s Consumption by 1. Having a sewer system can also affect certain kingdom events. When you build a sewer system, check the sewer system checkbox on its Urban Grid. (For metropolises, this infrastructure automatically applies to all of its Urban Grids.)`,
    },
    {
      name: `Shrine`,
      level: 1,
      traits: ["Building"],
      description: `A shrine is a small building devoted to the worship of a deity or faith. It can be attended by resident priests or visiting clergy.`,
      bonuses: [{activity: "Celebrate Holiday", value: 1}], // WAS +1 item bonus to Celebrate Holiday
      effects: `Treat the settlement’s level as one level higher than its actual level when determining what divine magic items are readily available for sale in that settlement. This effect stacks up to three times but does not stack with the same effect granted by temples or cathedrals.`,
    },
    {
      name: `Smithy`,
      level: 3,
      traits: ["Building"],
      description: `A smithy consists of workshops and forges.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Trade Commodities, +1 item bonus to Outfit Army (see the appendix starting on page 71)
      effects: `While in a settlement with a smithy, you gain a +1 item bonus to Craft checks made to work with metal.`,
    },
    {
      name: `Specialized Artisan`,
      level: 4,
      traits: ["Building"],
      description: `These shops and homes are devoted to crafters who create fine jewelry, glassware, clockworks, and the like.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Craft Luxuries
      effects: `While in a settlement with a specialized artisan, you gain a +1 item bonus to Craft checks made to craft specialized goods like jewelry.`,
    },
    {
      name: `Stable`,
      level: 3,
      traits: ["Yard"],
      description: `A stable consists of a yard and smaller structures to house, train, and sell mounts.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Establish Trade Agreement
    },
    {
      name: `Stockyard`,
      level: 3,
      traits: ["Yard"],
      description: `A stockyard includes several barns and pens used to house livestock and prepare them for slaughter.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Gather Livestock
      effects: `A settlement with at least one stockyard reduces its Consumption by 1.`,
    },
    {
      name: `Stonemason`,
      level: 3,
      traits: ["Building"],
      description: `A stonemason is a large building used to store and work quarried stone for preparation in building.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Establish Work Site (quarry).
      effects: `Each stonemason in your kingdom increases your maximum Stone Commodity capacity by 1.`,
    },
    { // TODO remove
      name: `Tannery`,
      level: 3,
      traits: ["Building"],
      description: `A tannery is a factory outfitted with racks, vats and tools for the preparation of hides and leather.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 to Trade Commodities
      effects: `A tannery cannot share a block with any Residential structure except tenements.`,
    },
    {
      name: `Tavern, Dive`,
      level: 1,
      traits: ["Building"],
      description: `A dive tavern is a rough-and-tumble establishment for entertainment, eating, and drinking.`,
      effects: `The first time you build a dive tavern in a Kingdom turn, reduce Unrest by 1 but increase Crime by 1.`,
    },
    {
      name: `Tavern, Popular`,
      level: 3,
      traits: ["Building"],
      description: `A popular tavern is a respectable establishment for entertainment, eating, and drinking.`,
      bonuses: [{activity: "Hire Adventurers", value: 1}], // WAS +1 item bonus to Hire Adventurers and to Rest and Relax using Trade
      effects: `The first time you build a popular tavern in a Kingdom turn, reduce Unrest by 2. If you attempt a Performance check to Earn Income in a settlement with a popular tavern, you gain a +1 item bonus to the check. All checks made to Gather Information in a settlement with at least one popular tavern gain a +1 item bonus.`,
    },
    {
      name: `Tavern, Luxury`,
      level: 9,
      traits: ["Building", "Famous"],
      description: `A luxury tavern is a high-class establishment for entertainment, eating, and drinking. It may even include a built-in stage for performers to use.`,
      bonuses: [{activity: "Hire Adventurers", value: 2}], // WAS +2 item bonus to Hire Adventurers and to Rest and Relax using Trade
      effects: `The first time you build a luxury tavern in a Kingdom turn, reduce Unrest by 1d4+1. If attempt a Performance check to Earn Income in a settlement with a luxury tavern, you gain a +2 item bonus to the check. All checks made to Gather Information in a settlement with at least one luxury tavern gain a +2 item bonus.`,
    },
    {
      name: `Tavern, World-Class`,
      level: 15,
      traits: ["Building", "Ediface", "Famous"],
      description: `A World-Class Tavern is a legendary establishment for entertainment, eating, and drinking. It has at least one venue for performances—perhaps multiple ones.`,
      bonuses: [{activity: "Hire Adventurers", value: 3}], // WAS +3 item bonus to Hire Adventurers, to Rest and Relax using Trade, and to Repair Reputation (Strife)
      effects: `The first time you build a world-class tavern in a turn, reduce Unrest by 2d4. If you try a Performance check to Earn Income in a settlement with a world-class tavern, you gain a +3 item bonus to the check. All checks made to Gather Information in a settlement with a world-class tavern gain a +3 item bonus.`,
    },
    {
      name: `Temple`,
      level: 7,
      traits: ["Building", "Famous", "Infamous"],
      description: `A temple is a building devoted to worshipping a deity or faith.`,
      bonuses: [
        {activity: "Celebrate Holiday", ability: "Culture", value: 1},
        {activity: "Quell Unrest", ability: "Culture", value: 1},
      ], // WAS +1 item bonus to Celebrate Holiday and Provide Care
      effects: `The first time you build a temple each Kingdom turn, reduce Unrest by 2. Treat the settlement’s level as one level higher than its actual level for the purposes of determining what divine magic items are readily available for sale in that settlement. This effect stacks up to three times but does not stack with the same effect granted by shrines or cathedrals.`,
    },
    { // TODO remove
      name: `Tenement`,
      level: 9,
      traits: ["Building", "Residential"],
      description: `Tenements are hastily built shantytowns of tightly packed, multi-family dwellings that are cheap and fast to build.`,
      // TODO Ruin +1 to a Ruin of your choice
      effects: `The first time you build tenements each Kingdom turn, reduce Unrest by 1.`,
    },
    {
      name: `Theatre`,
      level: 9,
      traits: ["Building"],
      description: `A theater is a venue for concerts, plays, and dances, but can double as a place for debates or other events.`,
      bonuses: [{activity: "Celebrate Holiday", ability: "Culture", value: 2}], // WAS +2 item bonus to Celebrate Holiday.
      effects: `The first time you build a theater each Kingdom turn, reduce Unrest by 1. While in a settlement with a theater, you gain a +2 item bonus to Performance checks made to Earn Income.`,
    },
    {
      name: `Thieves' Guild`,
      level: 5,
      traits: ["Building", "Infamous"],
      description: `The government knows this group exists but allows it to continue doing its business as long as the guild doesn’t overstep its bounds.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Infiltration
      // TODO Ruin +1 Crime
      effects: `While in a settlement with a thieves’ guild, you gain a +1 item bonus to Create Forgeries.`,
    },
    {
      name: `Town Hall`,
      level: 2,
      traits: ["Building", "Ediface"],
      description: `A town hall is a public venue for town meetings and a repository for town history and records.`,
      bonuses: [{activity: "Establish Settlement", value: 1}],
      effects: `The first time you build a town hall each Kingdom turn, reduce Unrest by 1. A town hall in a capital allows PC leaders to take 3 Leadership activities during the Activity phase of a Kingdom turn rather than just 2.`
    },
    {
      name: `Trade Shop`,
      level: 3,
      traits: ["Building"],
      description: `A trade shop is a store that focuses on providing services.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Purchase Commodities
      effects: `When you build a trade shop, indicate the kind of shop it is, such as a bakery, carpenter, tailor, and so on. While in a settlement with a trade shop, you gain a +1 item bonus to all associated Crafting checks.`,
    },
    {
      name: `University`,
      level: 15,
      traits: ["Building", "Ediface", "Famous"],
      description: `A university is a sprawling institution of higher learning.`,
      bonuses: [{activity: "Creative Solution", value: 3}], // WAS +3 item bonus to Creative Solution
      effects: `While in a settlement with a university, you gain a +3 item bonus to Lore checks made to Recall Knowledge while Investigating, to Research checks (Gamemastery Guide 154), and to Decipher Writing.`,
    },
    {
      name: `Wall, Stone`,
      level: 5,
      traits: ["Infrastructure"],
      description: `Stone walls provide solid defenses to a settlement’s borders.`,
      effects: `A stone wall is built along the border of your settlement. The first time you build a stone wall in each settlement, reduce Unrest by 1. When you build a stone wall, choose a border on your Urban Grid and check the appropriate checkbox; if you’re upgrading from a wooden wall, uncheck that box.`,
    },
    {
      name: `Wall, Wooden`,
      level: 1,
      traits: ["Building"],
      description: `Wooden walls provide serviceable defenses to a settlement.`,
      effects: `A wooden wall is built along the border of your settlement. The first time you build a wooden wall in each settlement, reduce Unrest by 1. When you build a wooden wall, choose a border on your Urban Grid and check the appropriate checkbox.`,
    },
    {
      name: `Watchtower`,
      level: 3,
      traits: ["Building"],
      description: `A watchtower serves as a guard post that grants a settlement advance warning to upcoming dangerous events.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to checks to resolve events affecting the settlement.
      effects: `The first time you build a watchtower each Kingdom turn, decrease Unrest by 1.`,
    },
    {
      name: `Waterfront`,
      level: 8,
      traits: ["Building"],
      description: `A waterfront serves as a bustling port for waterborne passengers and cargo. It’s supported by facilities for shipping and shipbuilding, but also features boardwalks for foot traffic and fishers to ply their trade as well.`,
      // TODO bonuses: [{activity: "…", ability: "Loyalty", value: 1}], // WAS +1 item bonus to Go Fishing, and to Establish Trade Agreement and Rest and Relax using Boating
      effects: `A waterfront must be constructed next to a Water Border. A settlement with at least 1 waterfront increases its effective level by 1 for the purposes of determining what level of items can be purchased in that settlement; this bonus stacks with similar bonuses in the settlement.`,
    },
  ] }
}
