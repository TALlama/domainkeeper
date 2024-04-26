import { welcomeDomainkeeper, domainConcepts, ruin, buildUp, prognostication, contribute, placeCapital, domainSummary } from "./activities";
import { leaders } from "./leaders";

export const settlements = {
  forks: {
    icon: "⭐",
    name: "Capital",
    position: [85, 20],
    traits: ["Village"],
    powerups: [{name: "Town Hall"}],
  },
}

export const domainCreationTurn = {
  number: 0,
  name: "Domain Creation",
  settlements: [settlements.forks],
  activities: [
    welcomeDomainkeeper.complete,
    placeCapital.forks,
    domainConcepts.complete,
    domainSummary.auto,
  ],
};

export const onTurnOne = {
  name: "Founded Yesterday",
  settlements: [settlements.forks],
  leaders: leaders.threePack,
  turns: [domainCreationTurn],
};

export const inTurnOne = {
  name: "Founded Yesterday",
  settlements: [settlements.forks],
  leaders: leaders.threePack,
  turns: [domainCreationTurn, {
    number: 1,
    activities: [ruin.allGood],
  }],
};

export const endTurnOne = {
  name: "Founded Yesterday",
  settlements: [{id: "settlement-starter", name: "Starter", traits: ["Village"]}],
  leaders: [leaders.anne],
  turns: [domainCreationTurn, {
    number: 1,
    activities: [ruin.allGood, {
      ...buildUp.cultureFailure, actorId: leaders.anne.id,
    }, {
      ...prognostication.success, actorId: leaders.anne.id,
    }, {
      ...contribute.culture, actorId: "settlement-starter",
    }],
  }]
};

export const unSaved = {...inTurnOne};
export const allSaved = {...endTurnOne};
