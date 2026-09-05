# <img width="128" height="128" alt="gemini-svg" src="https://github.com/user-attachments/assets/086c7295-7f14-4aeb-91a9-de31416e6ca1" /> Portal Auto-Login 




A zero-touch, minimalist captive portal bypass and auto-authentication browser extension built for security researchers and power users.

---

## Features

* **Autonomous Intercept & Auto-Ping**: Silently probes network connectivity on browser startup and automatically intercepts 302 captive portal redirections.
* **Hybrid Authentication Engine**:
  * **Universal DOM Parser**: Intelligently identifies visible credential fields, simulates native keystrokes to bypass client-side validation, and triggers authentication.
  * **Raw Request Override**: Directly fires configured HTTP `POST` or `GET` payloads for heavily obfuscated or non-standard gateways.
* **Profile Management**: Save and switch between multiple network targets and credentials via a cyberpunk-styled neon dashboard.
* **Manifest V3 Compliant**: Lightweight, fast, and fully sandboxed.

---

## Project Structure

```text
├── manifest.json     # Manifest V3 extension configuration
├── background.js     # Network sniffer, redirect interceptor, and auto-pinger
├── content.js        # Universal DOM parser and virtual keystroke engine
├── popup.html/js/css # Cyberpunk dashboard and profile manager
├── help.html         # Technical documentation & usage instructions
├── welcome.html      # First-run onboarding screen
└── icon*.svg         # Scalable vector interface icons
