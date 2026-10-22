(() => {
  "use strict";
  let tasks = new Set();
  const completed = new Set();
  const progress = document.getElementById("loading-progress");
  const percentage = document.getElementById("loading-percentage");
  const message = document.getElementById("loading-message");
  let previousValue = 0;
  let failed = false;

  function update() {
    const value = tasks.size ? Math.floor(completed.size / tasks.size * 100) : 0;
    previousValue = Math.max(previousValue, Math.min(100, value));
    progress.value = previousValue;
    percentage.textContent = `${previousValue}%`;
  }

  window.ufoLoading = Object.freeze({
    plan(names) { tasks = new Set(names); update(); },
    complete(name, label) {
      if (failed || !tasks.has(name) || completed.has(name)) return;
      completed.add(name);
      if (label) message.textContent = label;
      update();
    },
    finish() {
      if (failed) throw new Error("Game resource loading failed");
      if (completed.size !== tasks.size) throw new Error("Game resources are still loading");
      message.textContent = "Ready for liftoff";
      update();
    },
    fail(label) {
      failed = true;
      message.textContent = label;
    },
  });
})();
