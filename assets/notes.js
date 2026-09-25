// Click-to-explain panel for study guide pages.
// Any element with data-note="id" opens the <template id="note-id"> in the panel.
// Chart marks with data-tip="text" also show a small hover tooltip.

(function () {
  const panel = document.getElementById("panel");
  const panelTitle = document.getElementById("panel-title");
  const panelBody = document.getElementById("panel-body");
  const closeBtn = panel.querySelector(".panel-close");
  let lastTrigger = null;

  function openNote(id, trigger) {
    const tpl = document.getElementById("note-" + id);
    if (!tpl) return;
    panelTitle.textContent = tpl.dataset.title || "";
    panelBody.replaceChildren(tpl.content.cloneNode(true));
    panelBody.scrollTop = 0;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    lastTrigger = trigger;
    closeBtn.focus({ preventScroll: true });
  }

  function closeNote() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
  }

  document.addEventListener("click", function (e) {
    const trigger = e.target.closest("[data-note]");
    if (trigger) {
      e.preventDefault();
      openNote(trigger.dataset.note, trigger);
      return;
    }
    if (panel.classList.contains("open") && !panel.contains(e.target)) closeNote();
  });

  // Keyboard: Enter/Space on SVG marks and figure cards, Esc closes.
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("open")) {
      closeNote();
      return;
    }
    const t = e.target;
    if ((e.key === "Enter" || e.key === " ") && t.matches && t.matches("[data-note]:not(button)")) {
      e.preventDefault();
      openNote(t.dataset.note, t);
    }
  });

  closeBtn.addEventListener("click", closeNote);

  // Hover tooltips on chart marks
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.setAttribute("aria-hidden", "true");
  document.body.appendChild(tip);

  document.addEventListener("pointermove", function (e) {
    const mark = e.target.closest && e.target.closest("[data-tip]");
    if (!mark || e.pointerType === "touch") {
      tip.classList.remove("show");
      return;
    }
    tip.textContent = mark.dataset.tip;
    const x = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8);
    tip.style.left = x + "px";
    tip.style.top = e.clientY + 16 + "px";
    tip.classList.add("show");
  });

  // Checklist: remember ticked boxes in this browser only
  const key = "checklist:" + location.pathname;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch (err) { saved = {}; }
  document.querySelectorAll(".checklist input[type=checkbox]").forEach(function (box) {
    if (saved[box.id]) box.checked = true;
    box.addEventListener("change", function () {
      saved[box.id] = box.checked;
      try { localStorage.setItem(key, JSON.stringify(saved)); } catch (err) { /* storage unavailable */ }
    });
  });
})();
