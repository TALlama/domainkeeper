export function activityRecord(name, ability, outcome) {
  return {name, ability, outcome};
}

export const welcomeDomainkeeper = {
  complete: {
    name: "Welcome, Domainkeeper",
    ready: "Let's go!",
  },
};

export const placeCapital = {
  forks: {
    name: "Place Capital",
    actorId: "system",
    position: [85, 20],
    location: "OK",
  },
};

export const domainConcepts = {
  complete: {
    name:"Domain Concept",
    heartland: "Forest",
    charter: "Conquest",
    freeCharterBoost: "Culture",
    government: "Despotism",
    freeGovernmentBoost: "Culture",
  },
};

export const news = {
  allGood: {
    name: "News",
    ruin5: "Unmet",
    ruin10: "Unmet",
    ruin15: "Unmet",
  },
};

export const buildUp = {
  cultureFailure: activityRecord("Build Up", "Culture", "failure"),
};

export const prognostication = {
  success: activityRecord("Prognostication", "Culture", "success"),
  failure: activityRecord("Prognostication", "Culture", "failure"),
};

export const contribute = {
  culture: {...activityRecord("Contribute"), contribution: "Culture"},
  economy: {...activityRecord("Contribute"), contribution: "Economy"},
  loyalty: {...activityRecord("Contribute"), contribution: "Loyalty"},
  stability: {...activityRecord("Contribute"), contribution: "Stability"},
};

export const domainSummary = {
  auto: {name: "Domain Summary"},
};
