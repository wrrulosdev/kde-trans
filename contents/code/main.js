const DEFAULT_OPACITY = 0.7;

/**
 * Sets the opacity of a given window.
 * @param {Object} win - The window object to modify.
 * @param {number} opacity - The opacity value (0 to 1).
 */
function setTransparency(win, opacity) {
  if (!win) return;
  try {
    win.opacity = opacity;
  } catch (e) {
    print(`Error setting opacity for window: ${e}`);
  }
}

/**
 * Reads the user-configured opacity (percentage) from config,
 * clamps it between 10 and 100, then converts to 0–1.
 * Uses DEFAULT_OPACITY as fallback.
 * @returns {number}
 */
function getUserOpacity() {
  let raw = readConfig("windowOpacityPercentage", DEFAULT_OPACITY * 100);
  raw = Math.min(Math.max(raw, 10), 100);
  return raw / 100;
}

/**
 * Applies transparency to all existing windows according to user setting.
 */
function applyTransparencyToAll() {
  const wins = workspace.windowList();
  const opacity = getUserOpacity();
  
  for (const win of wins) {
    setTransparency(win, opacity);
  }
}

workspace.clientAdded.connect(win => {
  setTimeout(() => {
    setTransparency(win, getUserOpacity());
  }, 100);
});

applyTransparencyToAll();
