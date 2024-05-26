export function twist(el) {
  return addAnimationClass(el, "animation---twist");
}

export function useUp(el) {
  return addAnimationClass(el, "animation---use-up");
}

export function denyUse(el) {
  return addAnimationClass(el, "animation---deny-use");
}

export function addAnimationClass(el, className) {
  if (!el) { return }

  return new Promise((resolve) => {
    el.addEventListener("animationend", (event) => {
      let {animationName} = event;
      el.classList.remove(className);
      clearTimeout(timeout);
      resolve(el);
    }, {once: true});
  
    el.classList.add(className);
    let timeout = setTimeout(() => resolve(el), 1000);
  })
}
