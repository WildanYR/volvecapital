# Bot2 Setup Guide

Before starting the app, prepare the target machine first.

## Requirements

1. Install Node.js on your operating system.
2. Install Google Chrome on your operating system.
3. Make sure you have internet access for `npm install`.

## Setup

1. Open a terminal in this folder.
2. Review and update `config.toml` before running the app. Set `[app].api_base_url` to a hostname or `host:port` only, without `https://`, `wss://`, or any path.
3. Install dependencies:

```bash
npm install
```

4. Start the app:

```bash
npm run start
```

## Notes

- Install Node.js using the official installer for Windows, macOS, or Linux.
- Install Google Chrome before starting the app because Playwright is configured to use Chrome.
- If you move this package to another machine or operating system, run `npm install` again on that target machine.
