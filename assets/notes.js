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

  // Checklist: questions you answer in your head, reveal, then mark "got" or "review".
  // Marks live in this browser only, under the key in the page's data-store. Clicks are
  // delegated from the document, so a page restored by Back/Forward needs no re-binding;
  // render() just redraws from storage on every load.
  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (err) { return {}; }
  }
  function save(key, marks) {
    try { localStorage.setItem(key, JSON.stringify(marks)); } catch (err) { /* storage unavailable */ }
  }

  // One-time carry-over from the old tick-box lists (data-legacy names their keys): a ticked
  // box marks every question that grew out of it as "got". Skipped once the new key exists,
  // which is why "Start over" saves {} rather than removing the key.
  function migrate(page) {
    const key = page.dataset.store;
    try { if (localStorage.getItem(key) !== null) return; } catch (err) { return; }
    const ticked = {};
    (page.dataset.legacy || "").split(/\s+/).filter(Boolean).forEach(function (k) {
      const old = load(k);
      Object.keys(old).forEach(function (id) { if (old[id]) ticked[id] = true; });
    });
    if (!Object.keys(ticked).length) return;
    const marks = {};
    page.querySelectorAll(".ck[data-legacy]").forEach(function (q) {
      if (ticked[q.dataset.legacy]) marks[q.id] = "got";
    });
    save(key, marks);
  }

  const EMPTY = {
    none: "You've marked every question. Switch to To review to go over the ones you missed.",
    review: "Nothing to review. Mark a question Review and it shows up here.",
    got: "Nothing marked Got it yet.",
  };

  function render(page) {
    const marks = load(page.dataset.store);
    const filter = page.dataset.show || "all";
    const counts = { got: 0, review: 0, none: 0 };
    let shown = 0;
    page.querySelectorAll(".ck-sec").forEach(function (sec) {
      let secShown = 0, secGot = 0;
      const qs = sec.querySelectorAll(".ck");
      qs.forEach(function (q) {
        const m = marks[q.id] === "got" || marks[q.id] === "review" ? marks[q.id] : "none";
        counts[m]++;
        if (m === "got") secGot++;
        q.classList.toggle("is-got", m === "got");
        q.classList.toggle("is-review", m === "review");
        q.querySelector(".ck-tag").textContent = m === "got" ? "Got it" : m === "review" ? "Review" : "";
        q.querySelectorAll(".ck-mark").forEach(function (b) {
          b.setAttribute("aria-pressed", String(b.dataset.mark === m));
        });
        q.hidden = !(filter === "all" || filter === m);
        if (!q.hidden) secShown++;
      });
      sec.hidden = !secShown;
      shown += secShown;
      sec.querySelector(".ck-sec-count").textContent = secGot + " of " + qs.length + " got it";
    });
    const total = counts.got + counts.review + counts.none;
    page.querySelectorAll("[data-count]").forEach(function (el) { el.textContent = counts[el.dataset.count]; });
    page.querySelector(".m-got").style.width = (100 * counts.got / total) + "%";
    page.querySelector(".m-review").style.width = (100 * counts.review / total) + "%";
    page.querySelectorAll("[data-filter]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.filter === filter));
    });
    const empty = page.querySelector(".ck-empty");
    empty.hidden = shown > 0;
    empty.textContent = shown ? "" : EMPTY[filter] || "";
  }

  function openAnswer(q, open) {
    q.querySelector(".ck-a").hidden = !open;
    q.querySelector(".ck-q").setAttribute("aria-expanded", String(open));
  }

  document.addEventListener("click", function (e) {
    const page = e.target.closest && e.target.closest(".ck-page");
    if (!page) return;
    const key = page.dataset.store;

    const qBtn = e.target.closest(".ck-q");
    if (qBtn) {
      const q = qBtn.closest(".ck");
      openAnswer(q, q.querySelector(".ck-a").hidden);
      return;
    }

    const mark = e.target.closest(".ck-mark");
    if (mark) {
      const q = mark.closest(".ck");
      const marks = load(key);
      // Pressing the mark a question already has clears it.
      if (marks[q.id] === mark.dataset.mark) delete marks[q.id];
      else marks[q.id] = mark.dataset.mark;
      save(key, marks);
      if (page.dataset.reveal !== "1") openAnswer(q, false);
      const list = Array.prototype.slice.call(page.querySelectorAll(".ck"));
      render(page);
      // If the filter just hid this question, hand focus to the next one still showing, so a
      // keyboard user can work straight down the list.
      const target = q.hidden ? list.slice(list.indexOf(q) + 1).find(function (n) { return !n.hidden; }) : q;
      if (target) target.querySelector(".ck-q").focus({ preventScroll: !q.hidden });
      return;
    }

    const f = e.target.closest("[data-filter]");
    if (f) {
      page.dataset.show = f.dataset.filter;
      render(page);
      return;
    }

    const tool = e.target.closest("[data-ck]");
    if (!tool) return;
    if (tool.dataset.ck === "reveal") {
      const on = page.dataset.reveal !== "1";
      page.dataset.reveal = on ? "1" : "";
      tool.setAttribute("aria-pressed", String(on));
      tool.textContent = on ? "Hide answers" : "Show answers";
      page.querySelectorAll(".ck").forEach(function (q) { openAnswer(q, on); });
    } else if (tool.dataset.ck === "reset") {
      if (!window.confirm("Clear all your marks on this checklist?")) return;
      save(key, {});
      page.dataset.show = "all";
      render(page);
    }
  });

  // Progress line on an options-page card: "12 of 109 got it · 5 to review".
  function progress() {
    document.querySelectorAll("[data-progress]").forEach(function (el) {
      const marks = load(el.dataset.progress);
      let got = 0, review = 0;
      Object.keys(marks).forEach(function (id) {
        if (marks[id] === "got") got++;
        else if (marks[id] === "review") review++;
      });
      el.hidden = !(got || review);
      el.textContent = got + " of " + el.dataset.total + " got it" + (review ? " · " + review + " to review" : "");
    });
  }

  function setupPage() {
    document.querySelectorAll(".ck-page").forEach(function (page) {
      migrate(page);
      render(page);
    });
    progress();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setupPage);
  else setupPage();
  document.addEventListener("turbo:load", setupPage);
})();
