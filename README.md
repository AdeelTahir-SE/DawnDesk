<div align="center">

<img src="./public/realistic_logo.png" alt="DawnDesk Logo" width="200"/>

# DawnDesk

**Your All-in-One Productivity Powerhouse**

*One Tab. Full Stack. Complete Control.*

[![GitHub Stars](https://img.shields.io/github/stars/yourusername/DawnDesk?style=flat-square&color=DAA520)](https://github.com)
[![GitHub Watchers](https://img.shields.io/github/watchers/yourusername/DawnDesk?style=flat-square)](https://github.com)
[![GitHub Forks](https://img.shields.io/github/forks/yourusername/DawnDesk?style=flat-square)](https://github.com)
[![Status](https://img.shields.io/badge/Status-Early%20Access-orange?style=flat-square)](#)

[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?style=flat-square&logo=discord&logoColor=white)](http://discord.gg)
[![Twitter](https://img.shields.io/badge/Twitter-Follow-000000?style=flat-square&logo=x&logoColor=white)](https://twitter.com)

</div>

---

## ⚡ Overview

**DawnDesk** is an all-in-one productivity platform built for professionals and teams tired of context-switching. Stop juggling between a dozen apps — bring everything together in one unified workspace. 

Our philosophy is **"one tab, full stack."** We've engineered a seamless experience where task management, calendar scheduling, messaging, notes, files, and high-performance sub-apps work together intelligently.

> **Stop switching apps. Start shipping faster.**

---

## 🚀 Core Features

### 🛠️ Built-in Tools
- **Task & Project Management**: Organize work with lists, boards, and timelines. Track progress in real-time.
- **Notes & Docs**: Rich text editor with formatting, code blocks, and embedded media.
- **Calendar & Scheduling**: Unified calendar view. Never miss a deadline or meeting again.
- **Analytics & Productivity Insights**: Visualize your output. See where your time goes and optimize your workflow.

### 🧩 Dynamic Sub-App Architecture (New!)
To ensure a lightning-fast experience and keep the initial application bundle size minimal, DawnDesk utilizes an **On-Demand Dynamic Sub-App Loading System**.
- **Download What You Need**: Sub-apps are not bundled by default. Users can download and install individual sub-apps only when required.
- **Persistent Storage**: Once downloaded, sub-apps are stored locally for immediate offline access in the future.

### 🎬 Featured Sub-Apps
- **Video Editor** *(Active Development)*: A high-performance timeline editor featuring media import, trim, split, transitions, and local rendering utilizing FFmpeg. 
- **Photo Editor** *(Planned)*: Layer-based image editing with crop, resize, filters, and export presets.
- **AI Assistant** *(Planned)*: Task suggestions, content drafting, and productivity insights right inside your workspace.
- **Workflow Automation** *(Planned)*: Visual workflow builder for recurring automations and rule-based actions.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, Framer Motion
- **Backend / Desktop**: Tauri 2.0, Rust
- **Build Tool**: Vite
- **Media Processing**: FFmpeg & FFprobe (dynamically managed)
- **Database**: Supabase / Local Storage
- **Drag & Drop**: @dnd-kit

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn**
- **Rust** (for Tauri desktop builds)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/DawnDesk.git
   cd DawnDesk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server (Web)**
   ```bash
   npm run dev
   ```

### Build Desktop App (Tauri)

To run the full desktop experience with native permissions and sub-app support:

```bash
# Development mode
npm run tauri dev

# Production build
npm run tauri build
```

---

## 🔒 Permissions & Security
DawnDesk is built with Tauri, leveraging a secure-by-default architecture. The app requests explicit permissions for:
- `dialog:open`: To allow media and file selection.
- `fs:write` / `fs:read`: To save project files, export videos, and manage dynamic sub-apps.

---

## 📸 Screenshots

<div align="center">
<table>
<tr>
<td><img src="./public/screenshot1.png" alt="Dashboard" width="100%"/></td>
<td><img src="./public/screenshot2.png" alt="Task Management" width="100%"/></td>
</tr>
<tr>
<td><img src="./public/screenshot3.png" alt="Calendar" width="100%"/></td>
<td><img src="./public/screenshot4.png" alt="Analytics" width="100%"/></td>
</tr>
</table>
</div>

---

## 🤝 Contributing

We're just getting started and love community contributions!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🐛 Support & Feedback

Found a bug? Have a feature request?

- 📧 Email: support@dawndesk.com
- 💬 Discord: [Join our community](http://discord.gg)
- 🐙 GitHub Issues: [Report bugs here](https://github.com)
- 𝕏 Twitter: [@DawnDesk](https://twitter.com)

---

<div align="center">
Made with ❤️ for productivity enthusiasts
</div>
