# MarkdownForge

A high-performance, open-source WYSIWYG editor built with **Tauri 2.0** and **React**.

## Quick Start (No Setup Required)

### 1. Build and Download Binaries
We use GitHub Actions to automatically build the application for Windows, macOS, and Linux.
- Push your changes to the `main` branch.
- Go to the **Actions** tab in your GitHub repository.
- Select the latest **Build MarkdownForge** workflow run.
- Download the artifacts for your operating system from the bottom of the page.

### 2. Cloud Development (GitHub Codespaces)
To edit the code and run the development server in the cloud:
- Click the **Code** button on your repository.
- Switch to the **Codespaces** tab and click **Create codespace on main**.
- Once the environment loads, run:
  ```bash
  cd markdown-forge
  npm run dev
  ```
- *Note: To see the GUI in Codespaces, you may need to use a VNC extension or preview the web frontend part.*

## Local Development

If you prefer to build locally, ensure you have **Rust** and **Node.js** installed.

```bash
cd markdown-forge
npm install
npm run tauri dev
```

## Features
- **Dual Modes:** Toggle between WYSIWYG (ProseMirror) and Source Mode (CodeMirror 6).
- **Native I/O:** Fast file opening and saving via Rust.
- **Auto-Save:** Configurable debounced background saving.
- **3-Column Layout:** Sidebar, Editor, and live Outline.
- **Export:** Export your work to HTML with one click.
