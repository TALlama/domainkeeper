import { RxElement } from "./rx_element.js";

class SaveSlots extends RxElement {
  static observedAttributes = ["rootkey"];

  set root(value) { window.localStorage[this.rootKey] = JSON.stringify(value) }
  get root() { return JSON.parse(window.localStorage[this.rootKey] || "{}") }
  get rootKey() { return this.getAttribute("rootkey") || `saveSlots-${document.location.toString().split("?")[0]}` }
  
  load({key, defaultValue} = {}) { return this.root[key] || defaultValue }
  save(toSave) { this.root = {...this.root, ...toSave} }
  clear(...keys) {
    let toSave = this.root;
    keys.forEach(key => delete toSave[key])
    this.root = toSave;
  }
}
SaveSlots.define("save-slots");
