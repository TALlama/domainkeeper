import { withTemplates } from "./with_templates.js";

export class Milestone {
  constructor(properties = {}) {
    let {template} = this.init(properties);

    this.name ??= "Milestone";
    this.icon ??= "🥉";
    this.xp ??= 0;
    this.trigger ??= "--none--";
    this.threshold ??= "--none--";
  }

  get message() { return `${this.icon} Milestone: ${this.name}; gained ${this.xp} xp.` }

  check(domain) { return domain[this.trigger] === this.threshold }

  static check(trigger, domain) {
    return this.milestones(trigger).filter(m => !domain.milestones[m.name] && m.check(domain));
  }

  static milestones(trigger) {
    return this.templates.filter(t => t.trigger === trigger).map(t => new this(t));
  }
}
withTemplates(Milestone, () => [
  ...[[2, 20], [10, 40], [25, 60], [50, 80], [100, 120]].map(([size, xp]) =>
    ({icon: "🏅", name: `Domain size ${size}`, xp, trigger: "size", threshold: size})
  ),

  {icon: "⭐", name: "Capital founded", xp: 40, trigger: "settlements",
    check(domain) { return domain.settlements.filter(s => s.position).length > 0 }},
  {icon: "🛰️", name: "Second settlement founded", xp: 40, trigger: "settlements",
    check(domain) { return domain.settlements.length === 2 }},
  {icon: "🛖", name: "First Town", xp: 60, trigger: "settlements",
    check(domain) { return domain.settlements.filter(s => s.hasTrait("Town")).length > 0 }},
  {icon: "🏢", name: "First City", xp: 80, trigger: "settlements",
    check(domain) { return domain.settlements.filter(s => s.hasTrait("City")).length > 0 }},
  {icon: "🌇", name: "First Metropolis", xp: 120, trigger: "settlements",
    check(domain) { return domain.settlements.filter(s => s.hasTrait("Metropolis")).length > 0 }},
]);
