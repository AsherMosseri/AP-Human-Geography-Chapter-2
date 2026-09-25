// Click-to-explain panel for study guide pages.
// Any element with data-note="id" opens the <template id="note-id"> in the panel.
// Chart marks with data-tip="text" also show a small hover tooltip.
//
// Turbo Drive swaps the <body> without reloading, and this file (in <head>) runs only once.
// So: document-level listeners are added once, page elements are looked up fresh every time
// (never cached), and per-page setup re-runs on turbo:load. "Bound" marks are JS properties,
// not data- attributes: Back/Forward restores a cloned snapshot that keeps attributes but
// drops listeners.

(function () {
  if (window.__notesInit) return;
  window.__notesInit = true;

  let lastTrigger = null;

  function panel() { return document.getElementById("panel"); }

  function openNote(id, trigger) {
    const p = panel();
    const tpl = document.getElementById("note-" + id);
    if (!p || !tpl) return;
    document.getElementById("panel-title").textContent = tpl.dataset.title || "";
    const body = document.getElementById("panel-body");
    body.replaceChildren(tpl.content.cloneNode(true));
    body.scrollTop = 0;
    p.classList.add("open");
    p.setAttribute("aria-hidden", "false");
    lastTrigger = trigger;
    p.querySelector(".panel-close").focus({ preventScroll: true });
  }

  function closeNote(restoreFocus) {
    const p = panel();
    if (!p || !p.classList.contains("open")) return;
    p.classList.remove("open");
    p.setAttribute("aria-hidden", "true");
    if (restoreFocus && lastTrigger && document.contains(lastTrigger)) {
      lastTrigger.focus({ preventScroll: true });
    }
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest(".panel-close")) { closeNote(true); return; }
    const trigger = e.target.closest("[data-note]");
    if (trigger) {
      e.preventDefault();
      openNote(trigger.dataset.note, trigger);
      return;
    }
    const p = panel();
    if (p && p.classList.contains("open") && !p.contains(e.target)) closeNote(true);
  });

  // Keyboard: Enter/Space on SVG marks and figure cards, Esc closes.
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeNote(true); return; }
    const t = e.target;
    if ((e.key === "Enter" || e.key === " ") && t.matches && t.matches("[data-note]:not(button)")) {
      e.preventDefault();
      openNote(t.dataset.note, t);
    }
  });

  // Hover tooltips on chart marks. The element is re-attached if Turbo replaced the body.
  let tip = null;
  function tipEl() {
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "tip";
      tip.setAttribute("aria-hidden", "true");
    }
    if (!document.body.contains(tip)) document.body.appendChild(tip);
    return tip;
  }

  document.addEventListener("pointermove", function (e) {
    const mark = e.target.closest && e.target.closest("[data-tip]");
    if (!mark || e.pointerType === "touch") {
      if (tip) tip.classList.remove("show");
      return;
    }
    const t = tipEl();
    t.textContent = mark.dataset.tip;
    const x = Math.min(e.clientX + 14, window.innerWidth - t.offsetWidth - 8);
    t.style.left = x + "px";
    t.style.top = e.clientY + 16 + "px";
    t.classList.add("show");
  });

  // Before Turbo snapshots a page for its back/forward preview, put it back to rest.
  document.addEventListener("turbo:before-cache", function () {
    closeNote(false);
    if (tip) tip.classList.remove("show");
  });
})();
