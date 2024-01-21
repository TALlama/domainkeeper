import { domainConcepts, ruin } from "./activities";

export const onTurnOne = {
  name: "Founded Yesterday",
  turns: [{
    turn: 0,
    name: "Domain Creation",
    activities: [domainConcepts.complete],
  }]
};
export const inTurnOne = {
  name: "Founded Yesterday",
  turns: [{
    number: 0,
    activities: [domainConcepts.complete],
  }, {
    number: 1,
    activities: [ruin.allGood],
  }]
};
