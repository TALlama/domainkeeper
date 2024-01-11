import {callOrReturn, errorMessage, mod} from "../helpers.js";

import {Activity} from "../models/activity.js";

import {RxElement} from "./rx_element.js";
import {DifficultyClass} from "./difficulty_class.js";
import {AbilityRoll} from "./ability_roll.js";

import { debugJSON } from "../helpers.js";

export class ActivitySheet extends RxElement {
  connectedCallback() {
    let activityId = this.getAttribute("activity-id");
    let initWith = activityId || this.getAttribute("name") || JSON.parse(this.getAttribute("properties") || "{}");

    this.activity = activityId
      ? this.domainSheet.activity(activityId)
      : reef.signal(new Activity(initWith));

    reef.component(this, () => this.render());
    this.addEventListener("click", this);
  }

  get domainSheet() { return document.querySelector("domain-sheet") }
  get currentTurn() { return this.domainSheet.currentTurn }
  get actor() { return this.domainSheet.actor(this.activity.actorId) }

  get inCurrentTurn() { return this.currentTurn?.entries?.find(e => e.id === this.id) }
  get canCancel() { return this.actor && this.inCurrentTurn && this.mutableDecisionsCount == (this.activity.decisions || []).length }
  get mutableDecisionsCount() { return (this.activity.decisions || []).count(d => d.mutable) }

  /////////////////////////////////////////////// Actions

  cancelActivity() {
    let entries = this.currentTurn.entries;
    let ixThis = entries.findIndex(e => e.id == this.activity.id);
    ixThis > -1 && entries.splice(ixThis, 1);
  }

  /////////////////////////////////////////////// Rendering

  render() {
    this.setAttributeBoolean("resolved", this.activity.resolved);
    this.setAttribute("name", this.activity.name);
    this.setAttribute("data-type", this.activity.type); // TODO make this just "type"
    this.setAttribute("data-outcome", this.activity.outcome); // TODO make this just "outcome"

    return `
      <header>
        ${this.activity.name}
        <small class="byline">${this.actor ? `by ${this.actor.name}` : ""}</small>
        ${debugJSON(this.activity.id)}
        ${this.renderCancelLink()}
      </header>
      <span class="icon">${this.activity.icon}</span>
      <blockquote class="summary">${this.activity.summary}</blockquote>
      <section class="body">
        <blockquote class="description">${callOrReturn(this.activity.description || "", this)}</blockquote>
        ${this.renderDecisions()}
        <section class="log">
          <header>Log</header>
          <ol class="log-entries list-unstyled">${this.renderLog()}</ol>
        </section>
      </section>`;
  }

  renderCancelLink() {
    return this.canCancel
      ? `<a href="#" class="cancel-activity" data-action="cancelActivity">Cancel</a>`
      : ``;
  }

  renderDecisions() {
    return this.activity.decisions.map(decision =>
      `<activity-decision-panel name="${decision.name}"></activity-decision-panel>`
    ).join("");
  }

  renderLog() {
    return this.activity.log.map(entry =>
      `<li class="log-entry ${entry.level}">${entry.html}</li>`
    ).join("");
  }
}
ActivitySheet.define("activity-sheet");

export class ActivityDecisionPanel extends RxElement {
  connectedCallback() {
    reef.component(this, () => this.render());
    this.addEventListener("click", this);
  }

  get activitySheet() { return this.closest("activity-sheet") }
  get domainSheet() { return this.activitySheet?.domainSheet }

  get activity() { return this.activitySheet?.activity }
  get decision() { return this.activity.decision(this.getAttribute("name")) }

  render() {
    let activity = this.activity;
    let decision = this.decision;
    if (!decision) { return `` }

    decision.resolved && this.setAttribute("resolved", "");

    return `
      <header>
        <span class='name'>${decision.name}</span>
        ${decision.resolved ? this.renderResolved(activity, decision) : ``}
        ${this.renderUndoLink()}
      </header>
      ${decision.resolved ? `` : this.renderPending(activity, decision)}`;
  }

  renderResolved(activity, decision) {
    return `<span class="picked">${decision.displayValue(decision.resolutionValue)}</span>`;
  }

  renderUndoLink(css="") {
    return this.decision.resolution && this.decision.mutable ? `<a href="#" class="pick-again ${css}" data-action="undoPick"> ⤺ Pick again…</a>` : ``;
  }

  renderPending(activity, decision) {
    if (!decision.options) {
      return errorMessage(`Cannot render pending decision "${decision.name}" in "${activity.name}" [${activity.id}] because it has no options`, decision, activity);
    }

    return `
      <div class="description">${callOrReturn(decision.description || "", this, {decision, activity})}</div>
      <fieldset class='pickable-group'>
        ${decision.options.map(option => {
          let value = decision.saveValue(option);
          let name = `${activity.id}__${decision.name}`;
          let id = `${name}__${value}`;

          return `<label class='btn pickable' for="${id}">
            <input type=radio id="${id}" name="${name}" value="${value}" class="sr-only" @checked=false data-action="doPick" />
            ${decision.displayValue(option)}
            ${this.renderSummary(activity, decision, option)}
          </label>`
        }).join("")}
      </fieldset>`;
  }

  renderSummary(activity, decision, option) {
    let summary = decision.summaryValue(option);
    return summary ? `<small class="metadata">${summary}</small>` : ``;
  }

  doPick(event) {
    this.decision.resolution = event.target.value;
  }

  undoPick(event) {
    this.decision.resolution = null;
  }
}
ActivityDecisionPanel.define("activity-decision-panel");

/*
  // TODO move this to Activity
  get currentTurn() { return this.domainSheet.data.turns.last() }
  get peerActivities() { return this.currentTurn.entries.filter(e => e.name === this.name) || [] }
  get peerActivityAbilityUsers() { return this.peerActivities.toDictionary(a => [a.usedAbility, this.domainSheet.actor(a.actorId)]) }

  // TODO move this to Activity
  get bonuses() { return this.domainSheet.findBonuses({activity: this.name}).sortBy("ability") }
  bonusesForAbility(ability) { return this.bonuses.filter(b => !b.ability || b.ability === ability).sortBy("-value") }
  itemBonus(ability) { return this.bonusesForAbility(ability).first()?.value || 0 }

  // TODO move this to helpers
  renderBonus(bonus, {includeAbility, used}={}) {
    let whenRolling = includeAbility ? `when rolling ${bonus.ability || "any ability"} ` : "";
    let string = `${mod(bonus.value)} ${whenRolling}<span class='metadata'>from ${bonus.structure.name}</span>`;
    return used === false ? `<del>${string}</del>` : string;
  }

  // TODO move this to Activity
  rollParts(ability) {
    let abilityMod = this.domainSheet.data[ability.toLowerCase()];
    let itemMod = this.itemBonus(ability);

    let modifierBreakdown = "";
    if (itemMod) {
      modifierBreakdown = Maker.tag("div", {
        class: "modifier-breakdown",
        html: [
          this.renderBonus({value: abilityMod, structure: {name: "Ability"}}),
          ...this.bonusesForAbility(ability).map((b, ix) => this.renderBonus(b, {used: ix === 0})),
        ].join(`<br/>`),
      });
    }

    return [
      ability,
      Maker.tag("span", `${mod(abilityMod + itemMod)}`, {class: "modifier"}),
      {
        class: "pick-ability",
        "data-set-used-ability": ability,
        change: () => this.domainSheet.roll({modifier: ability, itemBonus: itemMod, dc: this.difficulty}),
      },
      {class: this.peerActivityAbilityUsers[ability] ? "looks-disabled" : ""},
      modifierBreakdown,
    ];
  }

        Maker.tag("difficulty-class", {base: this.domainSheet.controlDC, ...this.difficultyClassOptions}),
            let usedBy = this.peerActivityAbilityUsers[ability];
            if (usedBy) {
              return blockedTooltip(`${usedBy.name} already used this ability for this activity this turn`, html);
            } else {
              return html;
            }
  get difficulty() { return this.$(".prompt difficulty-class")?.total }

  pickOne(items, options) {
    let {prompt, appendTo, beforeItems, afterItems} = options;
    beforeItems ??= [];
    afterItems ??= [];

    return Maker.tag("section", {appendTo: appendTo || this.logElement},
      Maker.tag("h5", options.prompt || `Pick one:`),
      new PickableGroup({
        options: [
          ...beforeItems,
          ...items.map(item => this.pickOneItem(item, options)),
          ...afterItems,
        ]
      }),
    );
  }

  pickOneItem(item, {format, andThen} = {}) {
    let text = (format || ((i) => i.toString())).call(item, item);
    return [text, {change: (event) => andThen(item, {event})}];
  }

  modAndThen({ability, by, andThen} = {}) {
    by ??= -1;
    andThen ??= () => {};

    return () => {
      this[by > 0 ? "boost" : "reduce"]({by}, ability);
      return andThen();
    }
  }

  modOneAnd(format, options = {}) {
    let by = options.by ?? 1;
    let text = (ability) => format.replace("{ability}", ability).replace("{by}", Math.abs(by));

    return this.pickOne([], {...options, beforeItems: Ability.all.map(ability =>
      this.pickOneItem(text(ability), {...options, andThen: this.modAndThen({...options, ability: ability})}),
    )});
  }

        type: "leadership",
        icon: "🔮",
        name: "Prognostication",
        description: "You use the mystic arts to forsee future events and prepare for them.",
        preprompt: p(`Your domain’s spellcasters read the omens and provide advice on how best to prepare for near-future events. Attempt a basic check.`),
        abilities: ["Culture"],
        summaries: {
          criticalSuccess: `+2 bonus to resolve event`,
          success: `+1 bonus to resolve event`,
          failure: `Fail`,
          criticalFailure: `-1 penalty to resolve event`,
        },
        criticalSuccess() {
          this.info(`🧿 Gain a +2 circumstance bonus to the check to resolve the event.`);
          this.addConsumable({name: "Status: Prepared 2", description: "+2 Event Resolution (Circumstance bonus)"});
        },
        success() {
          this.info(`🎴 Gain a +1 circumstance bonus to the check to resolve the event.`);
          this.addConsumable({name: "Status: Prepared 1", description: "+1 Event Resolution (Circumstance bonus)"});
        },
        failure() {
          this.warning(`❌ Your spellcasters divine no aid.`);
        },
        criticalFailure() {
          this.error(`💥 Your spellcasters provide inaccurate readings of the future. Take a -1 circumstance penalty to the check to resolve the event`);
          this.addConsumable({name: "Status: Ill-Prepared", description: "-1 Event Resolution (Circumstance bonus)"});
        },
      }),
      new ActivitySheet({
        type: "leadership",
        icon: "🎨",
        name: "Create A Masterpiece",
        description: "You use the mystic arts to forsee future events and prepare for them.",
        // TODO limit to 1/turn
        abilities: ["Culture"],
        preprompt: p(`You encourage your domain’s artists to create and display a masterful work of art to bolster your domain’s reputation. Attempt a basic check; the result affects either Fame or Infamy (depending on the type of domain you’re running). Create a Masterpiece may be attempted only once per domain turn regardless of the number of leaders pursuing activities.`),
        summaries: {
          criticalSuccess: `Gain Fame; Boost random Ability by 1`,
          success: `Gain Fame`,
          failure: `Fail`,
          criticalFailure: `Fail; Lose Fame OR 1d4 Unrest`,
        },
        criticalSuccess() {
          this.success();
          this.info(`💰 There is a constant stream of people coming to see it for themselves.`);
          this.boost(Ability.random);
        },
        success() {
          this.info(`🗿 A stunning work of art is created, and people speak of it far and wide.`);
          this.addFame();
        },
        failure() {
          this.warning(`❌ Your attempt to create a masterpiece fails`);
        },
        criticalFailure() {
          this.error(`💥 Not only does your attempt to create a masterpiece fail, it does so in a dramatic and humiliating way. Lose 1 Fame or Infamy point; if you have no Fame or Infamy points to lose, instead gain 1d4 Unrest.`);
          let consumed = this.domainSheet.useConsumable({name: "Fame"});
          if (consumed) {
            this.error("🤡 Fame reduced by 1");
          } else {
            this.boost({by: [1, 2, 3, 4].random()}, "Unrest");
          }
        },
      }),
    ]
  }
*/
