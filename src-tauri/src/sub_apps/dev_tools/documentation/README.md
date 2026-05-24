# DawnDesk — Rare & High-Value Tool Roadmap
> 30 tools that are either scattered across the internet, require multiple paid apps, or flat-out don't exist as a unified desktop experience. Ordered within each version from highest to lowest user value.

---

## V1 — Foundational Gaps *(tools people Google every week)*

| # | Tool | Why It's Rare / Valuable |
|---|------|--------------------------|
| 01 | **Font Extractor from PDF/Image** | Extract the exact font used in any PDF or image. Currently requires Adobe Acrobat Pro or shady online tools. No clean offline desktop solution exists. |
| 02 | **Color Palette Extractor** | Pull a full color palette (hex/RGB/HSL) from any image, PDF, or screenshot. Tools exist online but none are integrated into a productivity suite. |
| 03 | **Regex Tester & Visualiser** | Write regex and see matches highlighted in real-time with a visual breakdown of each group. regex101 is the only good one — and it's browser-only. |
| 04 | **Markdown → Styled PDF Exporter** | Convert Markdown to a beautiful typeset PDF with custom themes, not just raw html → pdf. Pandoc does it but requires CLI knowledge. |
| 05 | **Local AI File Renamer** | Rename hundreds of files intelligently using AI-generated names based on file content (reads the doc/image and suggests a name). Nothing like this exists offline. |
| 06 | **Metadata Viewer & Stripper** | View and remove hidden metadata (author, GPS, timestamps) from any file — EXIF from images, document properties from DOCX/PDF. Scattered across 5 different tools today. |
| 07 | **Duplicate File Finder** | Scans a folder and finds exact or near-duplicate files by content hash, not just filename. No mainstream app does this well for free. |
| 08 | **Binary / Hex File Viewer** | Open any file in hex view with ASCII side-panel. Essential for developers and forensics. Only available in niche dev tools. |
| 09 | **QR Code Generator & Decoder** | Generate QR from any text/URL and decode QR from screenshots/images. Both in one place — currently split across multiple sites. |
| 10 | **Unicode & Symbol Browser** | Browse, search and copy any Unicode character, emoji, or symbol by name. Charmap on Windows is ancient; no modern equivalent exists natively. |

---

## V2 — Workflow Tools *(require a browser or subscription today)*

| # | Tool | Why It's Rare / Valuable |
|---|------|--------------------------|
| 11 | **Subtitle / SRT Editor** | Edit, shift timing, merge and re-export .srt/.vtt subtitle files. Barely any desktop tools exist; most users go to online editors. |
| 12 | **CSV Diff Tool** | Compare two CSV files and highlight row/column-level changes like a spreadsheet diff. Nothing in this space is good or free. |
| 13 | **Cron Expression Builder** | Visual UI to build and test cron schedule strings. crontab.guru exists but it's a website; no desktop equivalent. |
| 14 | **JWT Decoder & Inspector** | Paste a JWT token and decode header/payload/signature with expiry info. jwt.io is the go-to — browser only, and privacy-sensitive. |
| 15 | **JSON ↔ YAML ↔ TOML Converter** | Convert between config file formats with validation. Requires multiple online tools or CLI commands today. |
| 16 | **Local Network Scanner** | Scan your WiFi network to see all connected devices, IPs, and open ports. Only available via Angry IP Scanner or nmap CLI — both intimidating for non-devs. |
| 17 | **Base64 / URL Encode-Decode** | Encode and decode Base64, URL encoding, HTML entities in one panel. Used constantly by developers — browser-only today. |
| 18 | **Image EXIF Timeline** | Load a folder of photos and plot them on a timeline by EXIF date taken. No tool exists that does this well offline. |
| 19 | **Lorem Ipsum & Fake Data Generator** | Generate placeholder text, emails, names, addresses, or JSON with one click. fakerjs/lipsum are websites — no desktop tool bundles all fake data types. |
| 20 | **Icon & Favicon Extractor** | Extract favicons and icons from any website or app bundle. No clean tool exists — people do it manually via browser dev tools. |

---

## V3 — Ahead of the Curve *(tools that barely exist anywhere)*

| # | Tool | Why It's Rare / Valuable |
|---|------|--------------------------|
| 21 | **Visual Diff for Images** | Compare two images side by side and highlight pixel-level differences. Used in design QA and testing. Barely any offline tools exist. |
| 22 | **AI Handwriting Decoder** | Upload a photo of handwritten notes and get clean typed text. Google Lens does it — but only on mobile, not integrated into a desktop workflow. |
| 23 | **Link Rot Checker** | Paste a document or URL list and check which hyperlinks are dead (404). No desktop tool does this — SEO sites charge for it. |
| 24 | **Local Password Generator & Auditor** | Generate strong passwords and audit a pasted list for strength, reuse, or breach exposure (via HaveIBeenPwned API). All offline except the API call. |
| 25 | **File Timestamp Editor** | Change created/modified/accessed timestamps on any file. Used in forensics, backups and file organisation. Only possible via CLI on most systems. |
| 26 | **DNS Lookup & WHOIS Tool** | Query DNS records and WHOIS for any domain. Currently scattered across dozens of websites with ads. No clean offline/desktop equivalent. |
| 27 | **API Request Tester (Lite Postman)** | Send HTTP requests, set headers/auth/body and inspect responses. Postman exists but is heavy. A lightweight built-in version inside a productivity suite is unique. |
| 28 | **Diff Patcher** | Apply a .patch or .diff file to a text document visually, with accept/reject per chunk. Only exists in code editors like VS Code — not accessible to non-devs. |
| 29 | **Steganography Detector** | Detect or embed hidden data inside image files. Used in digital forensics and security. No consumer-friendly tool exists. |
| 30 | **AI File Organiser** | Analyse an entire messy folder, suggest a folder structure, and reorganise files by type/topic/date with one click using local AI. This tool does not exist anywhere yet. |

---

## Strategic Notes

- **V1** targets tools people search for weekly — replacing bookmarked websites with native, private, offline alternatives.
- **V2** captures developer and power-user workflows that are stuck behind browser tabs or paid subscriptions.
- **V3** is DawnDesk's moat — tools that require AI or real engineering investment and have no existing competition in a desktop productivity suite.

> *All 30 tools work locally. No subscriptions, no data sent to servers unless the tool explicitly calls an API (flagged above).*
