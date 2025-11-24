/**
 * Default opacity value used when user configuration is unavailable.
 */
const DEFAULT_OPACITY = 0.7;

/**
 * Applies the specified opacity to a given window, 
 * excluding non-normal windows and fullscreen windows to prevent visual issues.
 *
 * @param {KWin.AbstractClient} win - The window object to modify.
 * @param {number} opacity - The opacity level to set (range 0.0 to 1.0).
 */
function setTransparency(win, opacity) {
  if (!win || !win.normalWindow || win.fullScreen) return;

  try {
    win.opacity = opacity;
  } catch (e) {
    print(`Error setting opacity for window ${win.resourceClass}: ${e}`);
  }
}

/**
 * Retrieves the user-configured opacity percentage from settings,
 * clamps the value between 30% and 100%, then converts it to a normalized decimal.
 *
 * @returns {number} Normalized opacity value between 0.3 and 1.0
 */
function getUserOpacity() {
  let raw = readConfig("windowOpacityPercentage", DEFAULT_OPACITY * 100);
  raw = Math.min(Math.max(raw, 30), 100);
  return raw / 100;
}

/**
 * Applies the current user-configured transparency to all existing windows.
 */
function applyTransparencyToAll() {
  const wins = workspace.windowList();
  const opacity = getUserOpacity();

  for (const win of wins) {
    setTransparency(win, opacity);
  }
}

workspace.windowAdded.connect(win => {
  setTransparency(win, getUserOpacity());
});

applyTransparencyToAll();
