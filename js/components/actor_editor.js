import { nudge } from "./event_helpers.js";
import { EditorDialog } from "./editor_dialog.js";

export class ActorEditor extends EditorDialog {
  static observedAttributes = ["actorId"];

  initialData(data) {
    return {...data, name: this.actor.name, traits: this.listToToggle(this.actor.traits)};
  }

  /////////////////////////////////////////////// Models 
  get actor() { return this.domain.actor(this.getAttribute("actorId")) }

  /////////////////////////////////////////////// Rendering

  renderDialogContents() {
    return `
      ${this.renderFormField("name")}
      <br/>
      ${this.renderTraitEditor()}`;
  }

  /////////////////////////////////////////////// Event handling

  update(event) {
    if (this.actor.name !== this.data.name) {
      nudge(this, (activity) => activity.info(`⚔️ Kneel, ${this.actor.name}. Rise, ${this.data.name}!`));
      this.actor.name = this.data.name;
    }

    let newTraits = this.toggleToList(this.data.traits);
    if (this.actor.traits.sort().join() !== newTraits.sort().join()) {
      nudge(this, (activity) => activity.info(`🥉 ${this.actor.name} now has traits: ${newTraits.join(", ")}`));
      this.actor.traits = newTraits;
    }
  }
}
ActorEditor.define("actor-editor");
