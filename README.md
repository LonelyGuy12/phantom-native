# 🌙 PHANTOM-NATIVE  
### _A Browser-Based React Native Virtual Machine_  
**Version:** `1.0.0-alpha`  
**Status:** Architecture Design  
**Target:** Modern Browsers with **WASM** support 🚀  

---

# ✨ Overview

**Phantom-Native** is a magical in-browser IDE that compiles and executes **React Native apps** with **zero servers** involved.  
Everything — Metro, Node.js, layout, rendering — happens inside your browser tab 💖📱

Unlike Expo Snack, Phantom-Native **does not convert React Native → DOM**.  
Instead, it uses:

- **Metro Bundler** (running inside WebContainers)  
- **A custom JS runtime** (mocking NativeModules)  
- **Yoga WASM** for layout  
- **Skia (CanvasKit)** for pixel-perfect rendering  

This recreates a tiny native mobile phone *inside your browser*.

---

# 💜 Core Philosophy

### 📴 Zero-Server Architecture  
After initial load, everything works offline — bundling, execution, rendering.

### 🧩 Containerized Build  
WebContainers emulate a micro-Node.js OS inside the tab.

### 🎨 Native Rendering  
Skia renders pixels exactly like Android/Chrome. No HTML. No CSS weirdness.

### 🔐 Fully Sandboxed  
User code cannot break out of the VM or access the browser’s environment.

---

# 🧠 High-Level Architecture

```mermaid
graph TD
    A[👩‍💻 Monaco Editor] --> B[📁 Virtual File System]
    B --> C[🛠️ WebContainer (Metro)]
    C -- bundle.js --> D[📱 Runtime Worker]
    D --> E[🔗 RN Bridge]
    E --> F[📐 Yoga WASM]
    E --> G[🎨 Skia CanvasKit]
    G --> H[🖼️ HTML5 Canvas Renderer]
```

---

# 🪄 Layer Breakdown

## **1️⃣ IDE Shell (Host)**
**Tech:** React + Vite + Monaco  
Handles: UI, state, VM lifecycle, and Canvas preview.

## **2️⃣ Virtual Machine (Compiler)**
**Tech:** WebContainers + Metro  
Responsibilities:
- Boots Node.js inside browser  
- Installs deps  
- Runs Metro  
- Produces the React Native bundle

## **3️⃣ Runtime (Virtual Phone)**
Executes JS bundle, mocks RN’s NativeModules, and communicates with WASM modules.

## **4️⃣ Graphics Pipeline**
**Yoga WASM** → Calculates flexbox layout  
**Skia CanvasKit** → Draws all UI elements (text, view, shadow, border, etc.)

---

# 🧩 Full Tech Stack

| Component | Selected | Rationale |
|----------|----------|-----------|
| **Bundler** | Metro | 1:1 compatibility with RN |
| **OS Virtualization** | WebContainers | Only in-browser Node.js |
| **Renderer** | Skia (CanvasKit) | Same engine as Android/Chrome |
| **Layout Engine** | Yoga WASM | Used by React Native internally |
| **State Mgmt** | Zustand | Lightweight, perfect for VM orchestration |
| **File System** | OPFS | Persistent and fast |

---

# 🔄 Lifecycle

## 🌼 Initialization
- Load IDE  
- Boot WebContainer  
- Load Yoga + Skia  
- Mount template project  

## 🔥 Build Cycle (Hot Reload)
- User updates file  
- FS writes  
- Metro rebuilds delta  
- Bundle sent to runtime worker  

## 🎬 Render Cycle
1. Runtime evaluates bundle  
2. React reconciler builds virtual view tree  
3. Yoga computes layout  
4. Skia paints everything to `<canvas>`  
5. Runs at ~60fps  

## 👆 Event Cycle
- User taps/clicks canvas  
- Engine performs hit-testing  
- Dispatches RN `onPress` or other events  

---

# 🗺️ Implementation Roadmap

### **Phase 0: Setup**
- Configure Vite with CORP/COEP  
- Monaco integration  

### **Phase 1: Graphics Engine**
- Initialize CanvasKit + Yoga  
- Implement RenderNode  
- 🎉 Milestone: Render first static layout  

---
### **Phase 2: Virtual Machine**
- Boot WebContainer  
- Build terminal/Metro logs UI  
- 🎉 Milestone: Run Node.js inside browser  

---
### **Phase 3: Integration**
- Wire Metro → Runtime → Renderer  
- 🎉 Milestone: Type React → See Canvas output  

---
### **Phase 4: Interactivity**
- Hit-testing  
- Implement events (`onPress`, input events)  

---

# 📁 Directory Structure

```
src/
├── core/
│   ├── runtime/        # JS Runtime (Worker)
│   ├── renderer/       # Yoga + Skia logic
│   ├── vm/             # WebContainer + Metro scripts
│   └── bridge/         # Worker <-> main thread messaging
│
├── components/
│   ├── editor/         # Monaco-based Editor UI
│   ├── preview/        # Canvas preview window
│   └── filesystem/     # File tree/sidebar
│
├── templates/          # Starter RN project
└── main.tsx
```

---

# ⚠️ Limitations (For Now)

- **Heavy RAM usage** — Node.js + Skia + browser = thicc  
- **Not all RN modules supported** — APIs like camera/maps need custom mocks  
- **High initial load (~50–100MB)** due to WASM + node_modules (cached afterward)

---

# 🌟 Final Thoughts

Phantom-Native is a bold attempt to bring a complete mobile dev environment directly into the browser — fast, portable, magical.  
A real React Native engine, no servers, no DOM, no compromises.  

If you want:
- A cute project banner  
- A matching logo  
- GitHub badges  
- A "Getting Started" section  

Just tell me and I’ll generate them!
