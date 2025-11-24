# KDE-Trans v1.1.0

A lightweight KWin script that applies transparency to all windows, with user-adjustable opacity.

## Features

- Adjusts the overall opacity of windows between **30% and 100%**.
- Automatically applies to all existing windows and those opened subsequently.
- Configurable from **System Settings → Window Management → KWin Scripts → Configure…**.
- Supports exclusions by name (comma-separated list with flexible syntax).

### Excluding applications from transparency

You can exclude apps from KDE-Trans using the `excludedWindows` config key (comma-separated). The script accepts three token styles:

- **Exact match (brackets):** `[name]` — matches the window `resourceClass` / `resourceName` exactly (case-insensitive).  
  Example: `[dolphin]`

- **Contains match (braces):** `{substring}` — matches when the candidate string *contains* `substring` (case-insensitive).  
  Example: `{steam_app}` — useful for many Steam/Proton-launched games which commonly include `steam_app` or similar identifiers in the process/launcher name. Use this if the window identifiers contain a predictable substring rather than an exact class.

- **Plain exact (no brackets):** `name` — same as `[name]`, but without brackets.  
  Example: `firefox`

#### Example `excludedWindows` values
- Exclude Dolphin and Firefox exactly:

```
[dolphin],firefox
```

- Exclude anything whose identifier contains `steam_app` (Proton games), plus VLC exactly:

```
{steam_app},vlc
```


## How Window Identification Works

KDE-Trans attempts to identify each window by checking these fields **in order**:

1. **`resourceClass`** — Most reliable and almost always present  
2. **`resourceName`** — Used if resourceClass is empty  
3. **`caption`** — The window title (may change dynamically)

The first non-empty value becomes the *candidate name*, then it is lowercased and compared against the exclusion list.

Examples of real window identifiers:

- `steam`
- `steam_app_123456`
- `org.kde.dolphin`
- `firefox`
- `code`
- `vlc`

In most cases, applications expose a stable `resourceClass`, which is the value used by the script.

---

## How to Inspect Window Names (Debug Logging)


To inspect the identifiers used by applications (resourceClass, resourceName, caption), enable the option **“Show new window names in logs”** in the script configuration.

Then run the following command to view only KDE-Trans messages:

```bash
journalctl --user -f | grep "\[kde-trans\]"
```

When a new window appears, KDE-Trans prints debug entries such as:

```bash
[kde-trans] New window appeared — resourceClass="steam", resourceName="steam_app_123456", caption="Game Title"
```

This helps in determining the correct identifiers to use in the exclusion list.

---

## Installation

The easiest way to install **kde-trans** is through the built-in KWin Script Store:

1. Open **System Settings**.  
2. Go to **Window Management → KWin Scripts**.  
3. Click **"Get New Scripts…"**.  
4. Search for **“kde-trans”**.  
5. Install and enable the script.  
6. (Optional) Open **Configure…** to adjust the opacity.

> **Important:** After changing the opacity in the configuration, you need to **disable and re-enable** the script in KWin Scripts for the changes to take effect without restarting your session.

## Project Structure

- **code/main.js** → Main script logic (window handling and opacity system).  
- **metadata.desktop** → Script metadata recognized by KWin.  
- **ui/config.ui** → User interface for adjusting opacity.  
- **contents/config/main.xml** → Configuration schema exposed to KDE.

## License

GPL-3.0-or-later
