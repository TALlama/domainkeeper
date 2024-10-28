import { RxElement } from "./rx_element.js";
import { DomainMap } from "./domain_map.js";

export class DomainMapLegend extends RxElement {
  connectedCallback() {    
    this.addEventListener("domains:marker-placed", () => this.showPositions())
    this.addEventListener("domains:marker-selected", () => this.showPositions())
    this.render();
  }
  
  get map() { return this.$("domain-map"); }
  get markers() { return this.map?.markers ?? [] }

  render() {
    const prompt = this.getAttribute("prompt") || "";

    this.attachShadow({mode: 'open'});
    this.shadowRoot.innerHTML = `
      <style>
        header {
          display: flex;
          gap: var(--external-margin);
          align-items: baseline;
          justify-items: stretch;
          background: black;
          color: white;
        }

        .prompt {
          padding: var(--internal-margin);
        }

        dl {
          display: flex;
          flex-wrap: wrap;
          margin: 0;
          font-size: var(--step--2);
          z-index: 1;

          dt, dd { padding: var(--internal-margin); }

          dt { padding-inline-end: var(--small-margin) }
          dt { text-shadow: 0 0 2px var(--marker-glow), 0 0 2px var(--marker-glow), 0 0 2px var(--marker-glow), 0 0 2px var(--marker-glow); }
          dt:not(:first-child) { margin-left: auto; }
          dd { margin-inline-start: 0; padding-inline-start: var(--small-margin) }

          dt.current, dt.current + dd { background: var(--color-selected-bg); color: black; }
          dt.locked, dt.locked + dd { cursor: not-allowed; }
        }
      </style>
      <header>
        ${prompt ? `<span class="prompt">${prompt}</span>` : ""}
        <dl id="positions"></dl>
      </header>
      <slot></slot>
    `;
  }

  showPositions(positions = this.shadowRoot.getElementById('positions')) {
    positions.innerHTML = '';
    this.markers.forEach((info, index) => {
      const label = document.createElement('dt');
      label.classList.toggle("current", index === this.map.ixCurrentMarker);
      label.classList.toggle("locked", info.editable === false);
      label.textContent = info.icon ?? DomainMap.defaultIcon;
      positions.appendChild(label);
      const coordinates = document.createElement('dd');
      const hexCode = info.position ? this.getHexCode(...info.position) : null;
      const percents = info.position ? `${Number(info.position[0]).toFixed(1)}%, ${Number(info.position[1]).toFixed(1)}%` : "…";
      coordinates.textContent = hexCode ? `${hexCode} (${percents})` : percents;
      positions.appendChild(coordinates);

      let makeCurrent = (event) => { this.map.ixCurrentMarker = index }
      label.addEventListener("click", makeCurrent);
      coordinates.addEventListener("click", makeCurrent);
    });
  }

  getHexCode(x, y) {
    const hexesHigh = 10;
    const hexesWide = 29;
    let row = Number(y / 100 * hexesHigh).toFixed(0);
    let col = Number(x / 100 * (row % 2 === 0 ? hexesWide : hexesWide-1)).toFixed(0);
    return `${row}, ${col}`;
  }
}
DomainMapLegend.define('domain-map-legend');
