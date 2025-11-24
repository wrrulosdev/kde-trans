const DEFAULT_OPACITY = 0.7;
const DEFAULT_EXCLUDED_WINDOWS = "";
const PREFIX = "[kde-trans]"

// CACHE to avoid reparsing on every call
let _cachedRawExcluded = null;
let _cachedPatterns = { exactSet: new Set(), containsList: [] };

/**
 * Parses a raw comma-separated string of excluded window patterns into structured patterns.
 * Strictly validates each token for correct syntax:
 *  - [name]    → exact match enclosed in brackets
 *  - {substr}  → contains match enclosed in braces
 *  - name      → exact match without any brackets
 *
 * Detects and reports:
 *  - Consecutive commas (",,")
 *  - Trailing comma (",...," or ",...<spaces>")
 *  - Malformed tokens (unbalanced or unexpected characters)
 *
 * @param {string} raw - Raw input string from config
 * @returns {{ exactSet: Set<string>, containsList: string[], errors: string[] }}
 */
function parseExcludedPatternsStrict(raw) {
  const exactSet = new Set();
  const containsList = [];
  const errors = [];

  if (!raw || typeof raw !== "string") {
    return { exactSet, containsList, errors };
  }

  // Detect consecutive commas (e.g. ",,", ", ,")
  if (/,(\s*,)+/.test(raw)) {
    errors.push("Consecutive commas detected (empty tokens due to ',,').");
    return { exactSet, containsList, errors };
  }

  // Detect trailing comma (e.g. "foo,bar," or "foo,bar,   ")
  if (/,(\s*)$/.test(raw)) {
    errors.push("Trailing comma detected (empty token at the end).");
    return { exactSet, containsList, errors };
  }

  // Split by commas, trim, filter empty tokens (defensive)
  const tokens = raw.split(",").map(t => t.trim()).filter(t => t.length > 0);

  // Validation regexes
  const exactRe = /^\[([^\[\]]+)\]$/;   // [name]
  const containsRe = /^\{([^{}]+)\}$/;  // {substring}
  const plainRe = /^[^\[\]\{\}]+$/;     // plain token without brackets

  for (const tok of tokens) {
    if (exactRe.test(tok)) {
      const m = tok.match(exactRe);
      const val = m[1].trim().toLowerCase();
      if (val.length === 0) {
        errors.push(`Empty exact token ${tok}`);
      } else {
        exactSet.add(val);
      }
      continue;
    }

    if (containsRe.test(tok)) {
      const m = tok.match(containsRe);
      const val = m[1].trim().toLowerCase();
      if (val.length === 0) {
        errors.push(`Empty contains token ${tok}`);
      } else {
        containsList.push(val);
      }
      continue;
    }

    if (plainRe.test(tok)) {
      exactSet.add(tok.toLowerCase());
      continue;
    }

    errors.push(`Malformed token: "${tok}"`);
  }

  return { exactSet, containsList, errors };
}

/**
 * Read excluded patterns from config with caching. If parsing fails (syntax errors),
 * prints clear messages and returns empty patterns (so no windows are excluded).
 *
 * @returns {{ exactSet: Set<string>, containsList: string[] }}
 */
function getExcludedPatterns() {
  const raw = readConfig("excludedWindows", DEFAULT_EXCLUDED_WINDOWS);

  // Use cache when config hasn't changed
  if (raw === _cachedRawExcluded && _cachedPatterns) {
    debugCachePrint(`${PREFIX}: Using cached excluded patterns.`);
    return _cachedPatterns;
  }

  debugCachePrint(`${PREFIX}: Parsing excludedWindows config (changed or first read).`);
  const parsed = parseExcludedPatternsStrict(raw);

  if (parsed.errors.length > 0) {
    debugCachePrint(`${PREFIX}: invalid excludedWindows configuration detected.`);
    debugCachePrint(`${PREFIX}: please use syntax: [exact],{contains},plainExact (comma-separated).`);
    debugCachePrint(`${PREFIX}: current raw value: "${raw}"`);

    for (const err of parsed.errors) {
      debugCachePrint(`${PREFIX}: parse error: ${err}`);
    }

    debugCachePrint(`${PREFIX}: ignoring exclusion list (no windows will be excluded).`);

    // Cache empty to avoid spamming logs until config changes
    _cachedRawExcluded = raw;
    _cachedPatterns = { exactSet: new Set(), containsList: [] };
    return _cachedPatterns;
  }

  // Cache and return valid patterns
  _cachedRawExcluded = raw;
  _cachedPatterns = { exactSet: parsed.exactSet, containsList: parsed.containsList };
  debugCachePrint(`${PREFIX}: excluded patterns parsed and cached (exact=${_cachedPatterns.exactSet.size}, contains=${_cachedPatterns.containsList.length})`);
  return _cachedPatterns;
}

/**
 * Returns whether we should print new-window info (controlled by config).
 * Reads KConfig key "showNewWindowNames" (Bool).
 *
 * @returns {boolean}
 */
function shouldShowNewWindowNames() {
  // readConfig returns default if not present; normalize to boolean
  return !!readConfig("showNewWindowNames", false);
}

/**
 * Helper that prints cache-related debug lines only when the "showDebugLogs" config is true.
 *
 * @param {string} msg
 */
function debugCachePrint(msg) {
  const enabled = !!readConfig("showDebugLogs", false);
  if (enabled) {
    print(msg);
  }
}

/**
 * Determines if a window should be excluded from transparency.
 * Uses resourceClass, resourceName or caption (in that order).
 *
 * @param {KWin.AbstractClient} win
 * @returns {boolean}
 */
function isExcluded(win) {
  if (!win) return false;

  const candidate = (win.resourceClass || win.resourceName || win.caption || "").toLowerCase();
  if (!candidate) return false;

  const { exactSet, containsList } = getExcludedPatterns();

  if (exactSet.has(candidate)) return true;

  for (const substr of containsList) {
    if (candidate.indexOf(substr) !== -1) return true;
  }

  return false;
}

/**
 * Apply configured opacity to a window unless excluded or special-case.
 *
 * @param {KWin.AbstractClient} win
 * @param {number} opacity  // 0.0 - 1.0
 */
function setTransparency(win, opacity) {
  if (!win || !win.normalWindow || win.fullScreen) return;
  if (isExcluded(win)) return;

  try {
    win.opacity = opacity;
  } catch (e) {
    print(`${PREFIX}: error setting opacity for window ${win.resourceClass}: ${e}`);
  }
}

/**
 * Read user opacity percentage and normalize to 0..1 (clamped to 30-100%).
 *
 * @returns {number}
 */
function getUserOpacity() {
  let raw = readConfig("windowOpacityPercentage", DEFAULT_OPACITY * 100);
  raw = Math.min(Math.max(raw, 30), 100);
  return raw / 100;
}

/**
 * Print window identification line for a newly opened window (if enabled).
 *
 * @param {KWin.AbstractClient} win
 */
function logNewWindowInfo(win) {
  if (!win) return;
  const rc = win.resourceClass || "<no resourceClass>";
  const rn = win.resourceName || "<no resourceName>";
  const cap = win.caption || "<no caption>";
  print(`${PREFIX}: New window appeared — resourceClass="${rc}", resourceName="${rn}", caption="${cap}"`);
}

/**
 * Apply opacity to all current windows.
 */
function applyTransparencyToAll() {
  const wins = workspace.windowList();
  const opacity = getUserOpacity();
  for (const win of wins) setTransparency(win, opacity);
}

workspace.windowAdded.connect(win => {
  if (shouldShowNewWindowNames()) {
    logNewWindowInfo(win);
  }
  setTransparency(win, getUserOpacity());
});

applyTransparencyToAll();
