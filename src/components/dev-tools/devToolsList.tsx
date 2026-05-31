import React from "react";
import { 
    Type, Palette, Code, FileText, Bot, Shield, Copy, Binary, QrCode, 
    AtSign, Subtitles, FileSpreadsheet, Clock, Key, RefreshCw, Wifi, 
    Link2, Calendar, Text, Image as ImageIcon, ImageMinus, PenTool, 
    Globe, Lock, Zap, Puzzle, Ghost, FolderTree 
} from "lucide-react";

export interface DevTool {
    id: string;
    title: string;
    description: string;
    category: "V1 - Core Tools" | "V2 - Workflow Tools" | "V3 - Advanced Tools";
    icon: React.ReactNode;
    isImplemented?: boolean;
}

export const devTools: DevTool[] = [
    // V1
    {
        id: "font-extractor",
        title: "Font Extractor",
        description: "Extract the exact font used in any PDF or image.",
        category: "V1 - Core Tools",
        icon: <Type className="text-white/70" />,
        isImplemented: true,
    },
    {
        id: "color-extractor",
        title: "Color Palette Extractor",
        description: "Pull a full color palette from any image, PDF, or screenshot.",
        category: "V1 - Core Tools",
        icon: <Palette className="text-white/70" />,
        isImplemented: true,
    },
    {
        id: "regex-tester",
        title: "Regex Tester & Visualiser",
        description: "Write regex and see matches highlighted in real-time.",
        category: "V1 - Core Tools",
        icon: <Code className="text-white/70" />,
        isImplemented: true,
    },
    {
        id: "markdown-pdf",
        title: "Markdown to Styled PDF",
        description: "Convert Markdown to a beautiful typeset PDF.",
        category: "V1 - Core Tools",
        icon: <FileText className="text-white/70" />,
    },
    {
        id: "ai-renamer",
        title: "Local AI File Renamer",
        description: "Rename hundreds of files intelligently using AI.",
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
        description: "Scans a folder and finds exact or near-duplicate files.",
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
        title: "QR Code Generator & Decoder",
        description: "Generate and decode QR codes easily.",
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
        description: "Edit, shift timing, merge and re-export subtitles.",
        category: "V2 - Workflow Tools",
        icon: <Subtitles className="text-white/70" />,
    },
    {
        id: "csv-diff",
        title: "CSV Diff Tool",
        description: "Compare two CSV files and highlight row/column changes.",
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
        description: "Convert between config file formats with validation.",
        category: "V2 - Workflow Tools",
        icon: <RefreshCw className="text-white/70" />,
    },
    {
        id: "network-scanner",
        title: "Local Network Scanner",
        description: "Scan your WiFi network to see all connected devices.",
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
        title: "Image EXIF Timeline",
        description: "Load photos and plot them on a timeline by EXIF date.",
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
        id: "ai-handwriting",
        title: "AI Handwriting Decoder",
        description: "Upload a photo of handwritten notes and get text.",
        category: "V3 - Advanced Tools",
        icon: <PenTool className="text-white/70" />,
    },
    {
        id: "link-rot",
        title: "Link Rot Checker",
        description: "Check which hyperlinks in a document/URL are dead.",
        category: "V3 - Advanced Tools",
        icon: <Globe className="text-white/70" />,
    },
    {
        id: "password-auditor",
        title: "Password Auditor",
        description: "Generate passwords and audit for strength/exposure.",
        category: "V3 - Advanced Tools",
        icon: <Lock className="text-white/70" />,
    },
    {
        id: "timestamp-editor",
        title: "File Timestamp Editor",
        description: "Change created/modified/accessed timestamps.",
        category: "V3 - Advanced Tools",
        icon: <Clock className="text-white/70" />,
    },
    {
        id: "dns-lookup",
        title: "DNS Lookup & WHOIS",
        description: "Query DNS records and WHOIS for any domain.",
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
        description: "Apply a .patch or .diff file to a text document.",
        category: "V3 - Advanced Tools",
        icon: <Puzzle className="text-white/70" />,
    },
    {
        id: "stegano-detector",
        title: "Steganography Detector",
        description: "Detect or embed hidden data inside image files.",
        category: "V3 - Advanced Tools",
        icon: <Ghost className="text-white/70" />,
    },
    {
        id: "ai-organiser",
        title: "AI File Organiser",
        description: "Analyse a folder and suggest a folder structure.",
        category: "V3 - Advanced Tools",
        icon: <FolderTree className="text-white/70" />,
    }
];
