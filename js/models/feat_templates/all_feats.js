const maxStat = (maxAbility, value) => { return {maxAbility, value} };
const investedIn = (ability) => maxStat(ability, 7);

const withTrait = (list, ...traits) => list.map(feat => { return {...feat, traits: [...(feat.traits || []), ...traits]} });

///////////////////////////////////////////////// General Feats
export const generalFeats = withTrait([
  {
    name: "Civil Service",
    level: 1,
    description: "An active citizenry gives one settlement a bonus each turn.",
    effects: "Your domain is administered by its citizens, who keep things moving even when the leaders are otherwise occupied. Each turn, one settlement can add a +2 circumstance bonus to its first activity.",
    newTurn({domain}) {
      domain.addRollBonus({name: this.name, value: +2, actorType: `settlement`});
    },
  }, {
    name: "Cooperative Leadership",
    level: 1,
    description: "The domain effectively plans ahead to give one leader a bonus each turn.",
    effects: "Your leaders are skilled at working with one another. Each turn, one leader can add a +2 circumstance bonus to their first activity.",
    // WAS: focused attention is +3 instead of +2; later avoids crit fails
    newTurn({domain}) {
      domain.addRollBonus({name: this.name, value: +2, actorType: `leader`});
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
  },
], "General");

///////////////////////////////////////////////// Culture Feats
export const cultureFeats = withTrait([
], "Culture");

///////////////////////////////////////////////// Economy Feats
export const economyFeats = withTrait([
], "Economy");

///////////////////////////////////////////////// Loyalty Feats
export const loyaltyFeats = withTrait([
], "Loyalty");

///////////////////////////////////////////////// Stability Feats
export const stabilityFeats = withTrait([
], "Stability");

///////////////////////////////////////////////// Summary Feat List
export const allFeats = [
  ...generalFeats,
  ...cultureFeats,
  ...economyFeats,
  ...loyaltyFeats,
  ...stabilityFeats,
].sortBy("level");
