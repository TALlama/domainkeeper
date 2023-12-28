import {RxElement} from "./rx_element.js";

export class DomainLeader extends RxElement {
  constructor(properties) {
    super();
    Object.assign(this, properties);
    this.activitiesPerTurn ??= this.type == "PC" ? 2 : 1;
  }
}
customElements.define("domain-leader", DomainLeader);
