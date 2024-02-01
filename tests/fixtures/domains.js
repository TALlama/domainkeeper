import { domainConcepts, ruin, buildUp, prognostication, contribute } from "./activities";
import { leaders } from "./leaders";

export const domainCreationTurn = {
  number: 0,
  name: "Domain Creation",
  activities: [domainConcepts.complete],
};

export const onTurnOne = {
  name: "Founded Yesterday",
  leaders: leaders.threePack,
  turns: [domainCreationTurn],
};

export const inTurnOne = {
  name: "Founded Yesterday",
  leaders: leaders.threePack,
  turns: [domainCreationTurn, {
    number: 1,
    activities: [ruin.allGood],
  }],
};

export const endTurnOne = {
  name: "Founded Yesterday",
  leaders: [leaders.anne],
  settlements: [{id: "settlement-starter", name: "Starter", traits: ["Village"]}],
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
