import React from "react";
import {
    Type, Palette, Code, FileText, Bot, Shield, Copy, Binary, QrCode,
    AtSign, Subtitles, FileSpreadsheet, Clock, Key, RefreshCw, Wifi, 
    Link2, Calendar, Text, Image as ImageIcon, ImageMinus,
    Globe, Lock, Zap, Puzzle, Ghost, FolderTree 
} from "lucide-react";

export interface DevTool {
    id: string;
    title: string;
    description: string;
    category: "V1 - Core Tools" | "V2 - Workflow Tools" | "V3 - Advanced Tools";
    icon: React.ReactNode;
}

export const devTools: DevTool[] = [
    // V1
    {
        id: "font-extractor",
        title: "Font Extractor",
        description: "Scan text-based PDFs, SVGs, HTML, CSS, and pasted samples for font names.",
        category: "V1 - Core Tools",
        icon: <Type className="text-white/70" />,
    },
    {
        id: "color-extractor",
        title: "Color Palette Extractor",
        description: "Pull a dominant color palette from a local image or screenshot.",
        category: "V1 - Core Tools",
        icon: <Palette className="text-white/70" />,
    },
    {
        id: "regex-tester",
        title: "Regex Tester & Visualiser",
        description: "Write regex and see matches highlighted in real-time.",
        category: "V1 - Core Tools",
        icon: <Code className="text-white/70" />,
    },
    {
        id: "markdown-pdf",
        title: "Markdown to Styled PDF",
        description: "Preview Markdown, download styled HTML, or print it as a PDF.",
        category: "V1 - Core Tools",
        icon: <FileText className="text-white/70" />,
    },
    {
        id: "ai-renamer",
        title: "Local File Renamer",
        description: "Generate clean date-based rename suggestions from selected files.",
        category: "V1 - Core Tools",
        icon: <Bot className="text-white/70" />,
    },
    {
        id: "metadata-stripper",
        title: "Metadata Viewer & Stripper",
        description: "View and remove hidden metadata from any file.",
        category: "V1 - Core Tools",
        icon: <Shield className="text-white/70" />,
    },
    {
        id: "duplicate-finder",
        title: "Duplicate File Finder",
        description: "Hash selected files locally and find exact duplicate matches.",
        category: "V1 - Core Tools",
        icon: <Copy className="text-white/70" />,
    },
    {
        id: "hex-viewer",
        title: "Binary / Hex File Viewer",
        description: "Open any file in hex view with ASCII side-panel.",
        category: "V1 - Core Tools",
        icon: <Binary className="text-white/70" />,
    },
    {
        id: "qr-tools",
        title: "QR Preview & Decoder",
        description: "Preview a QR-style matrix and decode QR screenshots when the webview supports it.",
        category: "V1 - Core Tools",
        icon: <QrCode className="text-white/70" />,
    },
    {
        id: "unicode-browser",
        title: "Unicode & Symbol Browser",
        description: "Browse, search and copy any Unicode character.",
        category: "V1 - Core Tools",
        icon: <AtSign className="text-white/70" />,
    },

    // V2
    {
        id: "subtitle-editor",
        title: "Subtitle / SRT Editor",
        description: "Edit subtitle text, shift timings, and export an SRT file.",
        category: "V2 - Workflow Tools",
        icon: <Subtitles className="text-white/70" />,
    },
    {
        id: "csv-diff",
        title: "CSV Diff Tool",
        description: "Compare two pasted CSV snippets line-by-line.",
        category: "V2 - Workflow Tools",
        icon: <FileSpreadsheet className="text-white/70" />,
    },
    {
        id: "cron-builder",
        title: "Cron Expression Builder",
        description: "Visual UI to build and test cron schedule strings.",
        category: "V2 - Workflow Tools",
        icon: <Clock className="text-white/70" />,
    },
    {
        id: "jwt-decoder",
        title: "JWT Decoder & Inspector",
        description: "Paste a JWT token and decode header/payload/signature.",
        category: "V2 - Workflow Tools",
        icon: <Key className="text-white/70" />,
    },
    {
        id: "config-converter",
        title: "JSON / YAML / TOML",
        description: "Validate pasted JSON and convert it to JSON, YAML-like, or TOML output.",
        category: "V2 - Workflow Tools",
        icon: <RefreshCw className="text-white/70" />,
    },
    {
        id: "network-scanner",
        title: "Local Network Scanner",
        description: "Probe a short local subnet and port list from the webview.",
        category: "V2 - Workflow Tools",
        icon: <Wifi className="text-white/70" />,
    },
    {
        id: "base64-encode",
        title: "Base64 / URL Encode",
        description: "Encode and decode Base64, URL encoding, HTML entities.",
        category: "V2 - Workflow Tools",
        icon: <Link2 className="text-white/70" />,
    },
    {
        id: "exif-timeline",
        title: "Image Timeline",
        description: "Build a local photo timeline from available file modification dates.",
        category: "V2 - Workflow Tools",
        icon: <Calendar className="text-white/70" />,
    },
    {
        id: "fake-data",
        title: "Lorem Ipsum & Fake Data",
        description: "Generate placeholder text, emails, names, or JSON.",
        category: "V2 - Workflow Tools",
        icon: <Text className="text-white/70" />,
    },
    {
        id: "icon-extractor",
        title: "Icon & Favicon Extractor",
        description: "Extract favicons and icons from any website or app.",
        category: "V2 - Workflow Tools",
        icon: <ImageIcon className="text-white/70" />,
    },

    // V3
    {
        id: "visual-diff",
        title: "Visual Diff for Images",
        description: "Compare two images and highlight pixel-level differences.",
        category: "V3 - Advanced Tools",
        icon: <ImageMinus className="text-white/70" />,
    },
    {
        id: "link-rot",
        title: "Link Rot Checker",
        description: "Check pasted URLs and flag responses or webview/CORS failures.",
        category: "V3 - Advanced Tools",
        icon: <Globe className="text-white/70" />,
    },
    {
        id: "password-auditor",
        title: "Password Auditor",
        description: "Generate local passwords and audit pasted passwords for basic strength.",
        category: "V3 - Advanced Tools",
        icon: <Lock className="text-white/70" />,
    },
    {
        id: "timestamp-editor",
        title: "Timestamp Manifest Builder",
        description: "Create a timestamp manifest for selected files.",
        category: "V3 - Advanced Tools",
        icon: <Clock className="text-white/70" />,
    },
    {
        id: "dns-lookup",
        title: "DNS A Record Lookup",
        description: "Query DNS A records through DNS-over-HTTPS.",
        category: "V3 - Advanced Tools",
        icon: <Globe className="text-white/70" />,
    },
    {
        id: "api-tester",
        title: "API Request Tester",
        description: "Send HTTP requests and inspect responses.",
        category: "V3 - Advanced Tools",
        icon: <Zap className="text-white/70" />,
    },
    {
        id: "diff-patcher",
        title: "Diff Patcher",
        description: "Apply simple text diff additions and removals to pasted content.",
        category: "V3 - Advanced Tools",
        icon: <Puzzle className="text-white/70" />,
    },
    {
        id: "stegano-detector",
        title: "Steganography Detector",
        description: "Run a quick low-bit density heuristic against a file.",
        category: "V3 - Advanced Tools",
        icon: <Ghost className="text-white/70" />,
    },
    {
        id: "ai-organiser",
        title: "File Organiser",
        description: "Suggest a folder structure from selected file types and names.",
        category: "V3 - Advanced Tools",
        icon: <FolderTree className="text-white/70" />,
    }
];
