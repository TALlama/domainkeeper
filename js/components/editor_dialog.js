import { humanize } from "./forms.js";
import { RxElement } from "./rx_element.js";

export class EditorDialog extends RxElement {
  connectedCallback() {
    this.open = true;
    this.data = reef.signal(this.initialData({}), "modal-data");

    this.innerHTML = this.render();
    document.addEventListener("reef:signal-modal-data", () => {
      this.$(".modal-contents").innerHTML = this.renderDialogContents();
    });

    this.addEventListener("click", this);
    this.addEventListener("input", this);

    this.setupTraitEditor(this.data.traits);
  }

  handleEvent(event) {
    if (event.type === "sl-show") {
      this.open = true;
    } else if (event.type === "sl-hide") {
      this.open = false;
      this.remove();
    } else {
      super.handleEvent(event);
    }
  }

  /////////////////////////////////////////////// Trait Handling

  listToToggle(list) {
    return (list || []).map(t => t.name || t).toDictionary(t => [t, true]);
  }

  toggleToList(toggle) {
    return Object.entries(this.data.traits).filter(([t, current]) => current).map(([t]) => t)
  }

  setupTraitEditor(toggles) {
    this.addEventListener("keyup", (event) => {
      let newTag = event.target.closest(".new-tag");
      if (newTag && event.key === "Enter") {
        toggles[newTag.value] = true;
        newTag.value = "";
      }
    });
    this.addEventListener("sl-remove", (event) => {
      const trait = event.target.getAttribute("key");
      toggles[trait] = !toggles[trait];
    });
  }

  /////////////////////////////////////////////// Models 
  get domainSheet() { return document.querySelector("domain-sheet") }
  get domain() { return this.domainSheet.domain }

  /////////////////////////////////////////////// Parts
  get dialog() { return this.$("sl-dialog") }

  /////////////////////////////////////////////// Rendering

  render() {
    return `<sl-dialog label="${this.getAttribute("label")}" ${this.open ? "open" : ""}>
      <div class="modal-contents">${this.renderDialogContents()}</div>
      <sl-button slot="footer" variant="primary" data-action="finish">Update</sl-button>
    </sl-dialog>`;
  }

  renderDialogContents() {
    return `<sl-spinner></sl-spinner>`;
  }

  renderFormField(property) {
    return `<sl-input name="${property}" label="${humanize(property)}" value="${this.data[property]}" data-action="updateProperty"></sl-input>`;
  }

  renderTraitEditor(property = "traits") {
    return `<article class="trait-editor">
      ${Object.entries(this.data[property]).map(([trait, current]) => this.renderTrait(trait, current)).join("")}
      <sl-input size="small" class="new-tag" label="Add a trait">
        <sl-icon name="plus-circle" slot="prefix"></sl-icon>
      </sl-input>
      </article>`;
  }
  
  renderTrait(trait, current) {
    return `<sl-tag class="trait ${current ? "current" : "removed"}" variant="${current ? "success" : "danger"}" key="${trait}" removable>
      ${trait}
    </sl-tag>`;
  }

  /////////////////////////////////////////////// Event handling

  show() { return this.dialog.show() }
  hide() { return this.dialog.hide() }

  updateProperty(event) {
    let formControl = event.target.closest("[name]");
    let property = formControl?.name
    if (property) {
      this.data[property] = this.propertyValue({property, formControl, event});
    }
  }

  propertyValue({property, formControl, event}) { return formControl.value }

  finish(event) {
    this.update(event);
    this.hide();
  }
}
