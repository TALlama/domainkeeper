export function twist(el) {
  addAnimationClass(el, "animation---twist");
}

export function addAnimationClass(el, className) {
  el.addEventListener("animationend", (event) => {
    let {animationName} = event;
    el.classList.remove(className);
  }, {once: true});

  el.classList.add(className);
}
