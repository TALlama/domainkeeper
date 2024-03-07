import { makeId } from "../models/with_id.js";
import { RxElement } from "./rx_element.js";

// This is based closely on https://dev.to/ndesmic/how-to-make-a-pan-and-zoom-control-with-web-components-4ji6
export class DomainMap extends RxElement {
  static observedAttributes = ["markers", "editable", "zoom", "min-zoom", "max-zoom", "focus-x", "focus-y"];
  static defaultIcon = "🚩";

  #dragStarted = null;
  #lastPointer = null
  #lastScroll = null;
  #zoom = .19;
  #minZoom = 0.1;
  #maxZoom = 10;
  #focusX = 50;
  #focusY = 50;

  constructor() {
    super();
    this.bind(this);
  }

  get editable() { return this.hasAttribute("editable") }
  set editable(value) { this.setAttributeBoolean("editable") }
  set zoom(val){
    this.#zoom = Math.min(Math.max(parseFloat(val), this.#minZoom), this.#maxZoom);
    if (this.dom && this.dom.viewport) { this.dom.viewport.style.zoom = this.#zoom }
  }
  get zoom() { return this.#zoom }
  set ["min-zoom"](val) { this.#minZoom = val }
  get ["min-zoom"]() { return this.#minZoom }
  set ["max-zoom"](val) { this.#maxZoom = val }
  get ["max-zoom"]() { return this.#maxZoom }
  get ["focus-x"]() { return this.#focusX; }
  set ["focus-x"](val) { this.#focusX = parseFloat(val); }
  get ["focus-y"]() { return this.#focusY; }
  set ["focus-y"](val) { this.#focusY = parseFloat(val); }
  get initialFocus() {
    let fallback = [50, 50];
    if (this.hasAttribute("focus-x") || this.hasAttribute("focus-y")) { return [focusX, focusY] }
    if (this.markers.filter(m => m.editable !== false).length === 1) { return JSON.parse(this._markers[0].dataset.properties).position || fallback }
    return fallback
  }
  get markers() { return JSON.parse(this.getAttribute('markers') || "[]") }
  set markers(value) {
    let oldValue = this.getAttribute('markers');
    let newValue = ("string" === typeof(value)) ? value : JSON.stringify(value || []);
    if (oldValue !== newValue) {
      this.setAttribute('markers', newValue);
      this.initMarkers();
    }
  }

  get marker() { return this._markers[this.ixCurrentMarker] }
  nextMarker() { this.ixCurrentMarker++ }
  get ixCurrentMarker() { return this._ixCurrentMarker }
  set ixCurrentMarker(value) {
    if (this.markers.filter(i => i.editable !== false).length === 0) { return }

    this.marker?.classList.remove('current');
    this._ixCurrentMarker = value % this._markers.length;
    if (JSON.parse(this.marker.dataset.properties).editable === false) {
      this.ixCurrentMarker += 1;
    } else {
      this.marker.classList.add('current');
      if (this.ghostMarker) { this.ghostMarker.textContent = this.marker.textContent }
      this.fire("domains:marker-selected", {detail: {marker: this.marker.dataset.properties, element: this.marker}});
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) { return }

    this[name] = newValue;
  }

  bind(element) {
    element.attachEvents = element.attachEvents.bind(element);
    element.render = element.render.bind(element);
    element.cacheDom = element.cacheDom.bind(element);
    element.dragTrack = element.dragTrack.bind(element);
    element.dragStop = element.dragStop.bind(element);
  }

  connectedCallback() {
    if (this._alreadyConnected) {
      this.focus({position: this.initialFocus, behavior: "instant"});
    } else {
      this._alreadyConnected = true;

      this.render();
      this.dom.image.addEventListener("load", () => {
        this.naturalSize();
        this.initMarkers();
        this.focus({position: this.initialFocus, behavior: "instant"});
      });
      this.addEventListener("domains:marker-placed", event => this.updateMarkerInfo());
    }
  }

  render() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --marker-glow: hsla(0, 0%, 0%, 0.3);

          display: block;
          overflow: hidden;
          border: 1px solid black;
          box-sizing: border-box;
        }

        :host([square]) {
          aspect-ratio: 1;
        }

        #viewport {
          height: 100%;
          width: 100%;
          overflow: hidden;
          cursor: grab;
          position: relative;
          
          &.manipulating { cursor: grabbing; }
        }

        .marker {
          aspect-ratio: 1;
          text-align: center;
          position: absolute;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1px solid var(--marker-glow);
          box-shadow: inset 0 0 2px var(--marker-glow);
          background: var(--marker-glow);
          font-size: 3rem;

          &.ghost {
            opacity: 0.5;
            pointer-events: none;
          }
        }

        .hidden {
          display: none;
        }
      </style>
      <div id="viewport" style="zoom: ${this.#zoom};">
        <slot><img src="images/map.webp"/></slot>
      </div>
    `;
    this.cacheDom();
    this.attachEvents();
  }

  cacheDom() {
    this.dom = {
      viewport: this.shadowRoot.querySelector("#viewport"),
      image: this.shadowRoot.querySelector("slot > :first-child"),
    };
  }

  attachEvents() {
    this.dom.viewport.addEventListener("pointerdown", this.dragStart.bind(this));

    if (this.editable) {
      this.dom.viewport.addEventListener("pointerup", this.dropMarker.bind(this));

      this.dom.image.addEventListener("pointermove", this.ghostCursorTrack.bind(this));
      this.dom.image.addEventListener("pointerenter", this.ghostCursorShow.bind(this));
      this.dom.image.addEventListener("pointerleave", this.ghostCursorHide.bind(this));
    }
  }

  naturalSize() {
    const nw = this.dom.image.naturalWidth, nh = this.dom.image.naturalHeight;
    if (!this.hasAttribute("square")) { this.style.aspectRatio = `${nw} / ${nh}` }
    if (!this.hasAttribute("zoom")) {
      let el = this, width = 0;
      let inset = 0;
      while (width === 0 && el) {
        var cs = getComputedStyle(el);
        inset += (parseInt(cs.borderInlineStartWidth) || 0) + (parseInt(cs.borderInlineEndWidth) || 0);
        width = el.clientWidth;
        el = el.parentElement;
      }
      width -= inset;
      this.zoom = Math.trunc(width * 1000) / 1000 / nw;
    }
  }

  imgOffsetToPosition(event) {
    if (event.target === this.dom.viewport) { return this.viewportOffsetToPosition(event) }
    if (this.dom.image !== event.target) { throw new Error("Event target is not the image")}

    const viewport = this.dom.viewport;
    let x = event.offsetX / this.#zoom, xTotal = viewport.scrollWidth, xPercent = x * 100 / xTotal;
    let y = event.offsetY / this.#zoom, yTotal = viewport.scrollHeight, yPercent = y * 100 / yTotal;
    return [xPercent, yPercent];
  }

  viewportOffsetToPosition(event) {
    if (event.target === this.dom.image) { return this.imgOffsetToPosition(event) }

    const viewport = this.dom.viewport;
    if (viewport !== event.target) { throw new Error("Event target is not the viewport")}

    let x = viewport.scrollLeft + event.offsetX / this.#zoom, xTotal = viewport.scrollWidth, xPercent = x * 100 / xTotal;
    let y = viewport.scrollTop + event.offsetY / this.#zoom, yTotal = viewport.scrollHeight, yPercent = y * 100 / yTotal;
    return [xPercent, yPercent];
  }

  constrainPosition(position) {
    return position.map(n => parseFloat(Number(n).toFixed(2)));
  }

  focus({position, behavior}={}) {
    const viewport = this.dom.viewport;
    if (viewport.clientWidth === 0 && !this._observer) {
      this._observer = new IntersectionObserver(entries => {
        if (entries.find(e => e.isIntersecting)) {
          this.focus({position, behavior});
          this._observer.unobserve(viewport);
          this._observer.disconnect();
        }
      });
      this._observer.observe(viewport);
    } else {
      const percentX = position[0] / 100;
      const percentY = position[1] / 100;
      viewport.scroll({
        top: viewport.scrollHeight * percentY - viewport.clientHeight / 2,
        left: viewport.scrollWidth * percentX - viewport.clientWidth / 2,
        behavior: behavior || "smooth",
      });
    }
  }

  /////////////////////////////////////////////// Markers
  
  initMarkers() {
    if (!this.dom?.viewport) { return }

    this.holdEvents("domains:marker-placed", () => {
      this._markers?.forEach(marker => marker.remove());
      this._markers = this.markers.map(info => this.makeMarker(info));
      if (this._markers.length === 0) { this._markers = [this.makeMarker()] }
      this.ixCurrentMarker = 0;
      
      this.ghostMarker?.remove();
      this.ghostMarker = this.makeMarker();
      this.ghostMarker.classList.add('ghost');

      this.nextMarker();
    });
  }

  makeMarker(properties={}) {
    let marker = document.createElement('div');
    marker.classList.add('marker');
    marker.classList.add('hidden');
    marker.append(properties.icon ?? DomainMap.defaultIcon);
    marker.dataset.properties = JSON.stringify(properties);
    if (properties.position) { this.placeMarker(properties.position, marker) }
    this.dom.viewport.appendChild(marker);
    return marker;
  }

  placeMarker(position, marker = this.marker) {
    const maxWidth = this.dom.viewport.scrollWidth || this.dom.image.naturalWidth,
      maxHeight = this.dom.viewport.scrollHeight || this.dom.image.naturalHeight;

    marker.style.left = `${position[0] / 100 * maxWidth}px`;
    marker.style.top = `${position[1] / 100 * maxHeight}px`;
    marker.classList.remove('hidden');

    if (marker !== this.ghostMarker) {
      marker.dataset.properties = JSON.stringify({...JSON.parse(marker.dataset.properties), position});
      this.fire("domains:marker-placed", {detail: {marker: marker.dataset.properties, position, element: marker}});
    }
  }

  /////////////////////////////////////////////// Event Handling

  ghostCursorTrack(event) { this.placeMarker(this.imgOffsetToPosition(event), this.ghostMarker) }
  ghostCursorShow(event) { this.ghostMarker.classList.remove('hidden') }
  ghostCursorHide(event) { this.ghostMarker.classList.add('hidden') }

  dropMarker(event) {
    const lag = event.timeStamp - this.#dragStarted;
    if (lag > 500) { return }

    this.placeMarker(this.constrainPosition(this.viewportOffsetToPosition(event)));
    this.nextMarker();
  }

  dragStart(event) {
    if (event.shiftKey || event.ctrlKey || event.altKey) { return }

    event.preventDefault();
    this.#dragStarted = event.timeStamp;

    this.dom.viewport.classList.add("manipulating");
    this.#lastPointer = [event.offsetX, event.offsetY];
    this.#lastScroll = [this.dom.viewport.scrollLeft, this.dom.viewport.scrollTop];
    this.dom.viewport.setPointerCapture(event.pointerId);
    this.dom.viewport.addEventListener("pointermove", this.dragTrack);
    this.dom.viewport.addEventListener("pointerup", this.dragStop);
  }

  dragTrack(event) {
    const currentPointer = [event.offsetX, event.offsetY];
    const delta = [
      currentPointer[0] + this.#lastScroll[0] - this.#lastPointer[0],
      currentPointer[1] + this.#lastScroll[1] - this.#lastPointer[1]
    ];
    this.dom.viewport.scroll(this.#lastScroll[0] / this.#zoom - delta[0] / this.#zoom, this.#lastScroll[1] / this.#zoom - delta[1] / this.#zoom, { behavior: "instant" });
  }

  dragStop(event) {
    this.dom.viewport.classList.remove("manipulating");
    this.dom.viewport.removeEventListener("pointermove", this.dragTrack);
    this.dom.viewport.removeEventListener("pointerup", this.dragStop);
    this.dom.viewport.releasePointerCapture(event.pointerId);
  }

  updateMarkerInfo() {
    if (!this._markers) { return }
    this.markers = this._markers.map(marker => JSON.parse(marker.dataset.properties));
  }
}
DomainMap.define('domain-map');
