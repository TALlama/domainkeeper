import { nudge } from "./event_helpers.js";
import { EditorDialog } from "./editor_dialog.js";
import { Milestone } from "../models/milestone.js";

export class DomainEditor extends EditorDialog {
  initialData(data) {
    return {
      ...data,
      name: this.domain.name,
      traits: this.listToToggle(this.domain.traits),
    };
  }

  /////////////////////////////////////////////// Rendering

  renderDialogContents() {
    return `
      ${this.renderFormField("name", "domain")}
      <br/>
      ${this.renderTraitEditor()}
      <br/>
      ${this.renderFeats()}
      <br/>
      ${this.renderMilestones()}
    `;
  }

  renderFeats() {
    return `
      <h3>Feats</h3>
      <ul>
        ${this.domain.feats.map(feat => `
          <li>
            ${feat.name}
            <span class='metadata'>${feat.description}</span>
          </li>
        `).join("")}
        ${this.domain.feats.length === 0 ? "<li class='zero-state'>None</li>" : ""}
      </ul>
    `;
  }

  renderMilestones() {
    return `
      <h3>Milestones</h3>
      <ul>
        ${Milestone.templates.map(milestone => `
          <li>
          <label>
            ${this.domain.milestones[milestone.name] ? "☑️" : "▪️"}
            ${milestone.name}
            <span class='metadata'>(${milestone.xp} XP)</span>
          </label>
          </li>
        `).join("")}
      </ul>
    `;
  }

  /////////////////////////////////////////////// Event handling

  update(event) {
    this.updateProperty("name", "domain");

    if (this.domain.name !== this.data.name) {
      nudge(this, (activity) => activity.info(`🎉 Long Live ${this.data.name}!`));
      this.domain.name = this.data.name;
    }

    let newTraits = this.toggleToList(this.data.traits);
    if (this.domain.traits.sort().join() !== newTraits.sort().join()) {
      nudge(this, (activity) => activity.info(`🥉 ${this.domain.name} now has traits: ${newTraits.join(", ")}`));
      this.domain.traits = newTraits;
    }
  }
}
DomainEditor.define("domain-editor");
