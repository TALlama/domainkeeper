import { callOrReturn } from "../helpers.js";

import { addTransient } from "./utils.js";
import { Ability } from "./abilities.js";

export class ActivityDecision {
  constructor(properties, activity) {
    addTransient(this, {value: {activity}});
    Object.defineProperty(this, "activity", {enumerable: false,
      get() { return this.transient.activity },
      set(value) { this.transient.activity = value },
    });
    Object.defineProperty(this, "options", {enumerable: true,
      get() { return callOrReturn(this.transient.options, this) || [] },
      set(value) { this.transient.options = value },
    });

    let templateName = properties.template || properties.name || properties;
    let template = {
      Roll: {
        saveAs: "ability",
        options: Ability.all,
        displayValue: (ability) => `<ability-roll ability="${ability}">${ability}</ability-roll>`,
        displayResolvedValue: (ability) => ability,
        optionDisableReason(ability) {
          let usedBy = this.abilityAlreadyUsedBy(ability);
          return usedBy.length ? `Already used or this activity this turn by ${usedBy.map(a => a.name).join(" & ")}` : null;
        },
        description(context) { return context.decision.difficultyClass(context) },
        difficultyClass({decision}) {
          return Maker.tag("difficulty-class", {base: this.domainSheet?.controlDC || 15, ...(decision?.difficultyClassOptions || {})}).outerHTML;
        },
      },
      Outcome: {
        saveAs: "outcome",
        options: ["criticalSuccess", "success", "failure", "criticalFailure"],
        displayValues: {
          criticalSuccess: `Critical Success`,
          success: `Success`,
          failure: `Failure`,
          criticalFailure: `Critical Failure`,
        },
        picked: (outcome) => {
          activity[outcome]?.call(activity);
        }
      },
      Payment: {
        options: Ability.all,
        otherDisplayValues: {},
        abilityDisplayValue(ability) {
          return this.amount < 0 ? `Boost ${ability} by ${Math.abs(this.amount)}` : `Reduce ${ability} by ${this.amount} to proceed`;
        },
        displayValue(payment) {
          return {
            abandoned: `Abandon the attempt and pay nothing`,
            free: `No payment was necessary`,
            ...this.otherDisplayValues,
          }[payment] || this.abilityDisplayValue(payment);
        },
        amount: 1,
        abilityPaid(ability, {activity, decision}) {},
        nonAbilityPaid(payment, {activity, decision}) {},
        picked(payment, {activity, decision}) {
          if (Ability.all.includes(payment)) {
            activity.reduce({by: -decision.amount}, payment);
            decision.abilityPaid(payment, {activity, decision});
          } else {
            decision.nonAbilityPaid(payment, {activity, decision});
          }
        },
      },
    }[templateName] || {};
    let props = {
      name: templateName,
      saveAs: templateName.toLowerCase(),
      saveValue: (value) => value,
      unsaveValue(value) { return this.options.find(o => this.saveValue(o) === value) },
      displayValue: (value) => (this.displayValues || {})[value] || value,
      displayResolvedValue: (value) => this.displayValue(value),
      summaryValue: (value) => (this.summaries || {})[value],
      optionDisableReason: (value) => null,
      mutable: () => !this.resolved,
      ...template,
      ...properties};
    Object.assign(this, props);

    this.#addSaveAsProperty(activity, props.saveAs);
    this.#addValueProperty(activity, props.valueMethod || `${props.saveAs}Value`);
    this.#addDisplayProperty(activity, props.displayMethod || `${props.saveAs}Display`);
    this.#addDisplayResolvedProperty(activity, props.displayResolvedMethod || `${props.saveAs}DisplayResolved`);
    this.#addSummaryProperty(activity, props.summaryMethod || `${props.saveAs}Summary`);
  }

  #addSaveAsProperty(activity, saveAs) {
    let decision = this;

    Object.defineProperty(activity, saveAs, {
      configurable: true,
      enumerable: true,
      get() { return activity.transient[`_${saveAs}`] },
      set(value) {
        let validOptions = decision.optionValues;
        if (validOptions.length && ![...validOptions, null, undefined].includes(value)) {
          throw TypeError(`Canot set ${saveAs} to ${value}; try one of ${JSON.stringify(decision.options)}`)
        }
        if (activity.transient[`_${saveAs}`] === value) { return }

        activity.transient[`_${saveAs}`] = value;
        activity.callbacksEnabled && decision.picked?.call(activity, value, {decision, activity});
      },
    });
  }

  #addValueProperty(activity, saveAsValue) {
    let decision = this;

    Object.defineProperty(activity, saveAsValue, {
      configurable: true,
      get() { return decision.unsaveValue(decision.resolution) },
      set(value) { decision.resolution = decision.saveValue(value) },
    });
  }

  #addDisplayProperty(activity, saveAsDisplay) {
    let decision = this;

    Object.defineProperty(activity, saveAsDisplay, {
      configurable: true,
      get() { return decision.displayValue(decision.resolution) },
      set(value) { decision.resolution = decision.options.find(option => decision.displayValue(option) === value) },
    });
  }

  #addDisplayResolvedProperty(activity, saveAsDisplayResolved) {
    let decision = this;

    Object.defineProperty(activity, saveAsDisplayResolved, {
      configurable: true,
      get() { return decision.displayResolvedValue(decision.resolution) },
      set(value) { decision.resolution = decision.options.find(option => decision.displayResolvedValue(option) === value) },
    });
  }

  #addSummaryProperty(activity, saveAsSummary) {
    let decision = this;

    Object.defineProperty(activity, saveAsSummary, {
      configurable: true,
      get() { return decision.summaryValue(decision.resolution) },
    });
  }

  get domainSheet() { return this.activity.domainSheet }
  get actor() { return this.activity.actor }

  get dictionary() { return this.options.toDictionary(o => [this.saveValue(o), this.displayValue(o)]) }
  get enabledOptions() { return this.options.filter(o => !this.optionDisableReason(o)) }
  get disabledOptions() { return this.options.filter(o => this.optionDisableReason(o)) }
  get optionValues() { return this.options.map(o => this.saveValue(o)) }

  get resolution() { return this.activity[this.saveAs] }
  set resolution(value) { this.activity[this.saveAs] = value }

  get resolutionValue() { return this.unsaveValue(this.resolution) }
  set resolutionValue(value) { this.resolution = this.saveValue(value) }

  get mutable() { return callOrReturn(this._mutable, this.activity, this.activity, this) }
  set mutable(value) { this._mutable = value }

  get resolved() { return this.options.length === 0 || !!this.resolution }
  get displayResolutionValue() { return this.displayResolvedValue(this.resolutionValue) }

  abilityAlreadyUsedBy(ability) {
    return this.activity.peerActivities().filter(a => a.ability === ability).map(a => a.actor);
  }
}