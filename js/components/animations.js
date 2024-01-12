export function bulge(el) {
  addAnimationClass(el, "animation---buldge");
}
window.bulge = bulge;

export function addAnimationClass(el, className) {
  el.addEventListener("animationend", (event) => {
    let {animationName} = event;
    el.classList.remove(className);
  }, {once: true});

  el.classList.add(className);
}
