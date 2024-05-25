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
