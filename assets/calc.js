// Natural increase + doubling time calculator (reading 2.1-2.2).
// Loaded once in <head>; binds to the calculator on whichever page has one, and re-binds
// on turbo:load because Turbo Drive swaps pages without reloading this file. The "bound"
// mark is a JS property, not a data- attribute: Turbo restores Back/Forward pages from a
// cloned snapshot, which keeps attributes but drops listeners, so an attribute would make
// the restored copy look already set up when it isn't.

(function () {
  if (window.__calcInit) return;
  window.__calcInit = true;

  function fmt(n) {
    return (Math.round(n * 100) / 100).toLocaleString("en-US");
  }

  function setup() {
    const root = document.getElementById("nir-calc");
    if (!root || root._bound) return;
    root._bound = true;

    const cbrIn = document.getElementById("calc-cbr");
    const cdrIn = document.getElementById("calc-cdr");
    const nirOut = document.getElementById("calc-nir");
    const dtOut = document.getElementById("calc-dt");

    function update() {
      const cbr = parseFloat(cbrIn.value);
      const cdr = parseFloat(cdrIn.value);
      if (isNaN(cbr) || isNaN(cdr)) {
        nirOut.textContent = "–";
        dtOut.textContent = "–";
        return;
      }
      const perThousand = cbr - cdr;
      const pct = perThousand / 10;
      nirOut.textContent = fmt(perThousand) + " per 1,000 = " + fmt(pct) + "% a year";

      if (pct > 0) {
        dtOut.textContent = "about " + Math.round(70 / pct).toLocaleString("en-US") + " years";
      } else if (pct === 0) {
        dtOut.textContent = "never (zero population growth)";
      } else {
        dtOut.textContent = "never: shrinking, would halve in about " +
          Math.round(70 / -pct).toLocaleString("en-US") + " years";
      }
    }

    root.querySelectorAll(".calc-presets button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        cbrIn.value = btn.dataset.cbr;
        cdrIn.value = btn.dataset.cdr;
        update();
      });
    });
    cbrIn.addEventListener("input", update);
    cdrIn.addEventListener("input", update);
    update();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
  document.addEventListener("turbo:load", setup);
})();
