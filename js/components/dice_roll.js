import { Die, DicePool } from "../dice.js";

import { RxElement } from "./rx_element.js";

document.addEventListener("rig-next-die", ({detail}) => {
  Die.rig.push(detail.value);
});
document.addEventListener("rig-next-pool", ({detail}) => {
  DicePool.rig.push(detail.value);
});

let params = new URL(document.location).searchParams;
params.getAll("rig-die").forEach(value => Die.rig.push(value));
params.getAll("rig-pool").forEach(value => DicePool.rig.push(value));

export class DiceRoll extends RxElement {
  connectedCallback() {
    this.eventDetail ??= {};
    this.rollString = this.textContent;

    this.innerHTML = `
      <span class="value" data-action="reroll"></span>
      <button data-action="reroll" aria-label="Reroll">⟲</button>
      <span class="description"></span>
      <span class="summary"></span>
      <span class="summary-pending"></span>
      <span class="outcome"></span>
      <span class="outcome-pending"></span>
      <span class="diff"></span>
    `;
    this.addEventListener("click", this);

    this.updateUI();
    this.reroll();
  }

  reroll() {
    delete this.dataset.outcome;

    let start, previousTimestamp;
    let stepSize = this.rollTime / this.rollSteps;
    let lastStep = 0;
    let step = (timestamp, count) => {
      if (start === undefined) { start = timestamp }
      const elapsed = timestamp - start;

      if ((timestamp - start) > lastStep + stepSize) {
        this.pool.roll();
        this.querySelector('.value').textContent = this.value;
        lastStep += stepSize;
      }

      if (elapsed < this.rollTime) {
        previousTimestamp = timestamp;
        window.requestAnimationFrame(step);
      } else {
        let valueStr = this.getAttribute("value");
        if (valueStr) {
          this.pool.value = parseInt(valueStr);
          this.setAttribute("value", valueStr.split(",").slice(1).join(","));
        } else {
          this.pool.roll({rigged: true});
        }

        this.updateUI();
        this.fireRolledEvents();
      }
    };
    window.requestAnimationFrame(step);
  }

  updateUI() {
    this.querySelector('.value').textContent = this.value;
    this.querySelector('.description').textContent = `${this.description}${this.target ? ` vs ${this.target}` : ""}`;
    this.querySelector('.summary').textContent = this.summary;

    this.dataset.value = this.value;
    this.dataset.description = this.description;
    this.dataset.summary = this.summary;
    this.dataset.rolledAt = new Date().toISOString();
  }

  fireRolledEvents() {
    let detail = {pool: this.pool, target: this.target, ...this.dataset, ...this.eventDetail};

    this.fire("pool-rolled", {detail});
    if (this.target) {
      this.querySelector('.outcome').textContent = this.outcomeDisplay;
      this.querySelector('.diff').textContent = this.diff;

      this.dataset.succeeded = this.succeeded;
      this.dataset.outcome = this.outcome;
      this.dataset.diff = this.diff;
      detail = {...detail, ...this.dataset};

      this.fire("pool-outcome", {detail});
      this.fire(`pool-outcome-${this.outcome}`, {detail});
      if (this.succeeded) { this.fire("pool-succeeded", {detail}) }
      else { this.fire("pool-failed", {detail}) }
    }
  }

  get rollTime() { return parseInt(this.getAttribute("roll-time")) || 800 }
  get rollSteps() { return parseInt(this.getAttribute("roll-steps")) || 8 }
  get target() { return this.getAttribute("target") }
  get pool() { return this._pool = this._pool || DicePool.parse(this.rollString, {target: this.target}); }
  get description() { return this.pool.description }
  get value() { return this.pool.value; }
  get diff() { return this.pool.diff; }
  get summary() { return this.pool.summary; }
  get succeeded() { return this.pool.succeeded; }
  get outcome() { return this.pool.outcome; }
  get outcomeDisplay() {
    return {
      criticalSuccess: "Critical Success",
      success: "Success",
      failure: "Failure",
      criticalFailure: "Critical Failure",
    }[this.outcome];
  }
}
DiceRoll.define("dice-roll");
