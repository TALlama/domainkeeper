document.addEventListener("click", (event) => {
  let trigger = event.target.closest(".pickable");
  if (trigger) { trigger.classList.toggle("picked") }
});
