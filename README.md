# kde-trans

A lightweight KWin script that applies transparency to all windows, with user-adjustable opacity.

## Features

- Set window opacity between **30% and 100%**.  
- Automatically applies to all existing and newly opened windows.  
- Fully configurable through KDE System Settings.  
- Clean, simple, and easy to modify.

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
