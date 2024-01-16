export function twist(el) {
  addAnimationClass(el, "animation---twist");
}

export function addAnimationClass(el, className) {
  if (!el) { return }

  el.addEventListener("animationend", (event) => {
    let {animationName} = event;
    el.classList.remove(className);
  }, {once: true});

  el.classList.add(className);
}
