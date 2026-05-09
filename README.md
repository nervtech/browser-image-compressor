# Image Compressor

A browser-based image compression tool built with React + TypeScript + Vite. Supports drag-and-drop, batch processing, quality/size control, and multilingual UI.

> Try it online: [nervtech.github.io/browser-image-compressor](https://nervtech.github.io/browser-image-compressor/)

> [中文文档](docs/README.zh-CN.md) | [日本語](docs/README.ja.md)

## Demo

![Demo](docs/demo.gif)

## Features

- **Drag & Drop** — Drop images or folders directly onto the page
- **Two Compression Modes** — Quality control (slider) or target file size (KB)
- **Lock Resolution** — Optional setting to preserve original image dimensions
- **Batch Processing** — Compress multiple images with 4 concurrent workers
- **Live Preview** — Thumbnail cards with compression ratio badges
- **Output Formats** — JPEG, WebP, PNG
- **Multilingual** — English, 中文, 日本語 (auto-detected from browser)

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Build for Production

```bash
npm run build
```

The output is in `dist/`. Serve it with any static file server:

```bash
npx serve dist
```

### Deploy to GitHub Pages

1. Push the repo to GitHub
2. Go to Settings → Pages → Source: GitHub Actions, or set branch to `main` with folder `/docs`
3. If using manual deploy: build locally and push `dist/` to a `gh-pages` branch

## Usage

1. Open the app in a browser
2. Configure compression settings in the toolbar
3. Drag and drop images or folders onto the drop zone
4. Click **Compress Images** to process all files
5. Download individual files or all as a ZIP

## Project Structure

```
src/
  i18n/           — Locale context and translation dictionaries
  utils/          — Image processing, ZIP creation
  App.tsx         — Main application component
  App.css         — Styles
  main.tsx        — Entry point
docs/             — Documentation in multiple languages
```

## Tech Stack

- React 19 + TypeScript
- Vite 8
- JSZip for ZIP packaging

## License

MIT
