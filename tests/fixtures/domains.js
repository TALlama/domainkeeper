import { domainConcepts, ruin, buildUp, prognostication, contribute } from "./activities";

export const domainCreationTurn = {
  number: 0,
  name: "Domain Creation",
  activities: [domainConcepts.complete],
};

export const onTurnOne = {
  name: "Founded Yesterday",
  turns: [domainCreationTurn]
};

export const inTurnOne = {
  name: "Founded Yesterday",
  turns: [domainCreationTurn, {
    number: 1,
    activities: [ruin.allGood],
  }]
};

export const endTurnOne = {
  name: "Founded Yesterday",
  leaders: [{id: "leader-anne", name: "Anne", traits: ["PC"]}],
  settlements: [{id: "settlement-starter", name: "Starter", traits: ["Village"]}],
  turns: [domainCreationTurn, {
    number: 1,
    activities: [ruin.allGood, {
      ...buildUp.cultureFailure, actorId: "leader-anne",
    }, {
      ...prognostication.success, actorId: "leader-anne",
    }, {
      ...contribute.culture, actorId: "settlement-starter",
    }],
  }]
};
