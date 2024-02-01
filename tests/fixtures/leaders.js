export const leaders = {
  anne: {name: "Anne", id: "leader-anne", traits: ["PC"], initiative: 20},
  ned: {name: "Ned", id: "leader-zed", traits: ["NPC"], initiative: 10},
  zack: {name: "Zack", id: "leader-zed", traits: ["PC"], initiative: 1},
};
leaders.twoPack = [leaders.anne, leaders.ned];
leaders.threePack = [leaders.anne, leaders.ned, leaders.ned];
