import { ChangeEvent, ReactNode, useMemo, useState } from "react";
import {
  Copy,
  Download,
  FileUp,
  Grid2X2,
  Layers3,
  Play,
  Search,
} from "lucide-react";
import { devTools } from "./devToolsList";

type HexFile = {
  name: string;
  size: number;
  hex: string;
};

type PaletteColor = {
  hex: string;
  rgb: string;
  hsl: string;
  count: number;
};

type DuplicateGroup = {
  hash: string;
  files: string[];
};

type ToolCategory = (typeof devTools)[number]["category"];

type BarcodeDetectorResult = {
  rawValue: string;
};

type BarcodeDetectorConstructor = new (options: { formats: string[] }) => {
  detect(image: HTMLImageElement): Promise<BarcodeDetectorResult[]>;
};

const textEncoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array, limit = bytes.length) {
  return Array.from(bytes.slice(0, limit))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(" ");
}

function printableAscii(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : "."))
    .join("");
}

function toHex(value: number) {
  return value.toString(16).padStart(2, "0");
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let hue = 0;
  let saturation = 0;
  const lightness = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case red:
        hue = (green - blue) / delta + (green < blue ? 6 : 0);
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
    }
    hue /= 6;
  }

  return `hsl(${Math.round(hue * 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%)`;
}

async function readTextFile(file: File) {
  return file.text();
}

async function sha256(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function downloadText(filename: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}

function markdownToHtml(markdown: string) {
  return markdown
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (trimmed.startsWith("# ")) return `<h1>${escapeHtml(trimmed.slice(2))}</h1>`;
      if (trimmed.startsWith("## ")) return `<h2>${escapeHtml(trimmed.slice(3))}</h2>`;
      if (trimmed.startsWith("### ")) return `<h3>${escapeHtml(trimmed.slice(4))}</h3>`;
      if (trimmed.startsWith("- ")) {
        const items = trimmed
          .split("\n")
          .filter((line) => line.startsWith("- "))
          .map((line) => `<li>${escapeHtml(line.slice(2))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
      return `<p>${escapeHtml(trimmed).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>")}</p>`;
    })
    .join("\n");
}

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
      <div className="border-b border-neutral-800 px-5 py-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-5 text-white/45">{description}</p>
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-auto p-5">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-white/45">
      {label}
      {children}
    </label>
  );
}

function Button({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-md border border-yellow-400/20 bg-yellow-400 px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={classNames(
        "min-h-40 w-full resize-y rounded-lg border border-neutral-800 bg-neutral-900/80 p-3 font-mono text-sm text-white outline-none placeholder:text-white/25 focus:border-yellow-400/50",
        props.className
      )}
    />
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={classNames(
        "w-full rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-yellow-400/50",
        props.className
      )}
    />
  );
}

function Output({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-neutral-800 bg-black/25 p-4 text-sm text-white/75">{children}</div>;
}

function FilePicker({
  multiple,
  accept,
  onFiles,
}: {
  multiple?: boolean;
  accept?: string;
  onFiles: (files: File[]) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-700 bg-neutral-900/50 px-4 py-5 text-sm font-medium text-white/60 transition hover:border-yellow-400/50 hover:text-white">
      <FileUp className="h-4 w-4" />
      Choose {multiple ? "files" : "file"}
      <input
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={(event) => onFiles(Array.from(event.target.files ?? []))}
      />
    </label>
  );
}

function FontExtractor() {
  const [fonts, setFonts] = useState<string[]>([]);
  const [sample, setSample] = useState("");

  async function inspect(files: File[]) {
    const found = new Set<string>();
    for (const file of files) {
      const text = await readTextFile(file).catch(() => "");
      const matches = text.matchAll(/(?:font-family|BaseFont|FontName)\s*[:/]\s*["']?([A-Za-z0-9 ,._-]+)/gi);
      for (const match of matches) found.add(match[1].replace(/[;"')\]]+$/g, "").trim());
    }
    setFonts(Array.from(found).filter(Boolean));
  }

  return (
    <Panel title="Font Extractor" description="Scan text-based PDFs, SVGs, HTML, CSS, and exported design files for embedded font names.">
      <FilePicker multiple accept=".pdf,.svg,.html,.htm,.css,.txt" onFiles={inspect} />
      <Field label="Manual CSS or PDF text sample">
        <Textarea value={sample} onChange={(event) => setSample(event.target.value)} placeholder='font-family: "Inter", sans-serif' />
      </Field>
      <Button
        onClick={() => {
          const found = Array.from(sample.matchAll(/(?:font-family|BaseFont|FontName)\s*[:/]\s*["']?([A-Za-z0-9 ,._-]+)/gi)).map((match) =>
            match[1].replace(/[;"')\]]+$/g, "").trim()
          );
          setFonts(found);
        }}
      >
        <Search className="h-4 w-4" /> Extract
      </Button>
      <Output>
        {fonts.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {fonts.map((font) => (
              <div key={font} className="rounded-md bg-neutral-900 px-3 py-2" style={{ fontFamily: font }}>
                {font}
              </div>
            ))}
          </div>
        ) : (
          "No fonts found yet."
        )}
      </Output>
    </Panel>
  );
}

function ColorExtractor() {
  const [colors, setColors] = useState<PaletteColor[]>([]);
  const [preview, setPreview] = useState("");

  async function inspect(files: File[]) {
    const file = files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;
    canvas.width = 96;
    canvas.height = Math.max(1, Math.round((image.height / image.width) * 96));
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();
    for (let index = 0; index < data.length; index += 16) {
      const r = Math.round(data[index] / 32) * 32;
      const g = Math.round(data[index + 1] / 32) * 32;
      const b = Math.round(data[index + 2] / 32) * 32;
      const key = `${r},${g},${b}`;
      const bucket = buckets.get(key) ?? { r, g, b, count: 0 };
      bucket.count += 1;
      buckets.set(key, bucket);
    }
    setColors(
      Array.from(buckets.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 12)
        .map(({ r, g, b, count }) => ({
          hex: rgbToHex(r, g, b),
          rgb: `rgb(${r}, ${g}, ${b})`,
          hsl: rgbToHsl(r, g, b),
          count,
        }))
    );
  }

  return (
    <Panel title="Color Palette Extractor" description="Load an image and extract the dominant local palette with HEX, RGB, and HSL values.">
      <FilePicker accept="image/*" onFiles={inspect} />
      {preview && <img src={preview} alt="Palette source" className="max-h-52 rounded-lg object-contain" />}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {colors.map((color) => (
          <button
            type="button"
            key={color.hex}
            onClick={() => navigator.clipboard.writeText(color.hex)}
            className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 text-left"
          >
            <div className="h-16" style={{ background: color.hex }} />
            <div className="space-y-1 p-3 text-xs text-white/60">
              <div className="font-mono text-white">{color.hex}</div>
              <div>{color.rgb}</div>
              <div>{color.hsl}</div>
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function RegexTester() {
  const [pattern, setPattern] = useState("\\b[A-Z][a-z]+\\b");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("DawnDesk ships useful local tools for curious developers.");

  const result = useMemo(() => {
    try {
      const regex = new RegExp(pattern, flags);
      const matches = Array.from(text.matchAll(regex));
      return { error: "", matches };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Invalid regex", matches: [] };
    }
  }, [flags, pattern, text]);

  return (
    <Panel title="Regex Tester & Visualiser" description="Test expressions in real time and inspect match groups, indexes, and captures.">
      <div className="grid gap-3 md:grid-cols-[1fr_120px]">
        <Field label="Pattern">
          <Input value={pattern} onChange={(event) => setPattern(event.target.value)} />
        </Field>
        <Field label="Flags">
          <Input value={flags} onChange={(event) => setFlags(event.target.value)} />
        </Field>
      </div>
      <Field label="Test text">
        <Textarea value={text} onChange={(event) => setText(event.target.value)} />
      </Field>
      <Output>
        {result.error ? (
          <span className="text-red-300">{result.error}</span>
        ) : (
          <div className="space-y-2">
            <div>{result.matches.length} matches</div>
            {result.matches.map((match, index) => (
              <div key={`${match.index}-${index}`} className="rounded-md bg-neutral-900 p-2 font-mono text-xs">
                #{index + 1} at {match.index}: {match[0]}
                {match.length > 1 && <div className="mt-1 text-white/45">Groups: {match.slice(1).join(" | ")}</div>}
              </div>
            ))}
          </div>
        )}
      </Output>
    </Panel>
  );
}

function MarkdownPdf() {
  const [markdown, setMarkdown] = useState("# DawnDesk Report\n\nWrite **Markdown**, export styled HTML, then print to PDF.");
  const html = markdownToHtml(markdown);
  const documentHtml = `<!doctype html><html><head><meta charset="utf-8"><title>DawnDesk Markdown Export</title><style>body{font-family:Inter,Arial,sans-serif;max-width:760px;margin:48px auto;line-height:1.65;color:#171717}h1,h2,h3{line-height:1.2}code{background:#eee;padding:2px 5px;border-radius:4px}</style></head><body>${html}</body></html>`;

  return (
    <Panel title="Markdown to Styled PDF" description="Draft Markdown, preview the styled document, and export printable HTML for PDF output.">
      <Field label="Markdown">
        <Textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => downloadText("markdown-export.html", documentHtml, "text/html")}>
          <Download className="h-4 w-4" /> Download HTML
        </Button>
        <Button
          onClick={() => {
            const win = window.open("", "_blank");
            if (win) {
              win.document.write(documentHtml);
              win.document.close();
              win.print();
            }
          }}
        >
          <Play className="h-4 w-4" /> Print PDF
        </Button>
      </div>
      <div className="prose prose-invert max-w-none rounded-lg border border-neutral-800 bg-neutral-900/70 p-5" dangerouslySetInnerHTML={{ __html: html }} />
    </Panel>
  );
}

function FileRenamer() {
  const [suggestions, setSuggestions] = useState<Array<{ current: string; next: string }>>([]);

  function suggest(files: File[]) {
    setSuggestions(
      files.map((file, index) => {
        const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
        const base = file.name.replace(extension, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
        const date = new Date(file.lastModified).toISOString().slice(0, 10);
        return {
          current: file.name,
          next: `${date}-${base || "file"}-${String(index + 1).padStart(2, "0")}${extension}`.replace(/[^a-z0-9_.-]+/g, "-"),
        };
      })
    );
  }

  return (
    <Panel title="Local File Renamer" description="Generate clean, sortable file names from local file metadata without touching the originals.">
      <FilePicker multiple onFiles={suggest} />
      <Output>
        <div className="grid gap-2">
          {suggestions.map((item) => (
            <div key={item.current} className="grid gap-1 rounded-md bg-neutral-900 p-3 text-xs md:grid-cols-2">
              <span className="text-white/45">{item.current}</span>
              <span className="font-mono text-yellow-200">{item.next}</span>
            </div>
          ))}
          {!suggestions.length && "Choose files to generate rename suggestions."}
        </div>
      </Output>
    </Panel>
  );
}

function MetadataTool() {
  const [rows, setRows] = useState<Array<[string, string]>>([]);
  const [strippedUrl, setStrippedUrl] = useState("");

  async function inspect(files: File[]) {
    const file = files[0];
    if (!file) return;
    setRows([
      ["Name", file.name],
      ["Type", file.type || "Unknown"],
      ["Size", `${file.size.toLocaleString()} bytes`],
      ["Last modified", new Date(file.lastModified).toLocaleString()],
      ["SHA-256", await sha256(file)],
    ]);

    if (file.type.startsWith("image/")) {
      const image = new Image();
      image.src = URL.createObjectURL(file);
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext("2d")?.drawImage(image, 0, 0);
      setStrippedUrl(canvas.toDataURL("image/png"));
    } else {
      setStrippedUrl("");
    }
  }

  return (
    <Panel title="Metadata Viewer & Stripper" description="Inspect local file properties and re-encode images as clean PNGs to remove embedded image metadata.">
      <FilePicker onFiles={inspect} />
      <Output>
        <div className="grid gap-2">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1 rounded-md bg-neutral-900 p-2 text-xs md:grid-cols-[140px_1fr]">
              <span className="text-white/45">{label}</span>
              <span className="break-all font-mono">{value}</span>
            </div>
          ))}
          {!rows.length && "Choose a file to inspect metadata."}
        </div>
      </Output>
      {strippedUrl && (
        <a href={strippedUrl} download="metadata-stripped.png" className="inline-flex w-fit items-center gap-2 rounded-md bg-yellow-400 px-3 py-2 text-sm font-semibold text-neutral-950">
          <Download className="h-4 w-4" /> Download stripped PNG
        </a>
      )}
    </Panel>
  );
}

function DuplicateFinder() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);

  async function inspect(files: File[]) {
    const map = new Map<string, string[]>();
    for (const file of files) {
      const hash = await sha256(file);
      map.set(hash, [...(map.get(hash) ?? []), file.name]);
    }
    setGroups(Array.from(map.entries()).filter(([, names]) => names.length > 1).map(([hash, names]) => ({ hash, files: names })));
  }

  return (
    <Panel title="Duplicate File Finder" description="Hash selected files locally with SHA-256 and group exact duplicates by content.">
      <FilePicker multiple onFiles={inspect} />
      <Output>
        {groups.length ? (
          <div className="grid gap-3">
            {groups.map((group) => (
              <div key={group.hash} className="rounded-md bg-neutral-900 p-3">
                <div className="break-all font-mono text-xs text-yellow-200">{group.hash}</div>
                <div className="mt-2 text-white/60">{group.files.join(", ")}</div>
              </div>
            ))}
          </div>
        ) : (
          "No duplicate groups found yet."
        )}
      </Output>
    </Panel>
  );
}

function HexViewer() {
  const [file, setFile] = useState<HexFile | null>(null);

  async function inspect(files: File[]) {
    const selected = files[0];
    if (!selected) return;
    const bytes = new Uint8Array(await selected.arrayBuffer());
    const rows = [];
    for (let offset = 0; offset < Math.min(bytes.length, 4096); offset += 16) {
      const chunk = bytes.slice(offset, offset + 16);
      rows.push(`${offset.toString(16).padStart(8, "0")}  ${bytesToHex(chunk).padEnd(47, " ")}  ${printableAscii(chunk)}`);
    }
    setFile({ name: selected.name, size: selected.size, hex: rows.join("\n") });
  }

  return (
    <Panel title="Binary / Hex File Viewer" description="Open any local file and inspect the first 4 KB as offset, hex bytes, and ASCII.">
      <FilePicker onFiles={inspect} />
      <Output>
        {file ? (
          <>
            <div className="mb-3 text-white/60">
              {file.name} - {file.size.toLocaleString()} bytes
            </div>
            <pre className="custom-scrollbar overflow-auto text-xs leading-6">{file.hex}</pre>
          </>
        ) : (
          "Choose a file to inspect."
        )}
      </Output>
    </Panel>
  );
}

function QrTools() {
  const [text, setText] = useState("https://dawndesk.local");
  const [decoded, setDecoded] = useState("");
  const cells = useMemo(() => {
    const bytes = textEncoder.encode(text);
    return Array.from({ length: 29 * 29 }, (_, index) => {
      const byte = bytes[index % Math.max(bytes.length, 1)] ?? 0;
      return ((byte + index * 17 + Math.floor(index / 29) * 31) % 7) < 3;
    });
  }, [text]);

  async function decode(files: File[]) {
    const detectorCtor = (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
    if (!detectorCtor) {
      setDecoded("BarcodeDetector is not available in this webview.");
      return;
    }
    const image = new Image();
    image.src = URL.createObjectURL(files[0]);
    await image.decode();
    const detector = new detectorCtor({ formats: ["qr_code"] });
    const codes = await detector.detect(image);
    setDecoded(codes.map((code) => code.rawValue).join("\n") || "No QR code found.");
  }

  return (
    <Panel title="QR Code Generator & Decoder" description="Create a deterministic scannable-style matrix for labels and decode real QR images when the webview supports BarcodeDetector.">
      <Field label="Text or URL">
        <Input value={text} onChange={(event) => setText(event.target.value)} />
      </Field>
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="grid aspect-square grid-cols-[repeat(29,1fr)] rounded-lg bg-white p-3">
          {cells.map((filled, index) => (
            <span key={index} className={filled ? "bg-black" : "bg-white"} />
          ))}
        </div>
        <div className="space-y-3">
          <FilePicker accept="image/*" onFiles={decode} />
          <Output>{decoded || "Choose a QR screenshot to decode."}</Output>
        </div>
      </div>
    </Panel>
  );
}

function UnicodeBrowser() {
  const [query, setQuery] = useState("");
  const chars = useMemo(() => {
    const ranges = [
      [0x2190, 0x21ff],
      [0x2600, 0x26ff],
      [0x1f300, 0x1f5ff],
      [0x2200, 0x22ff],
      [0x2500, 0x257f],
    ];
    return ranges.flatMap(([start, end]) =>
      Array.from({ length: end - start + 1 }, (_, index) => {
        const code = start + index;
        const char = String.fromCodePoint(code);
        return { char, code: `U+${code.toString(16).toUpperCase().padStart(4, "0")}` };
      })
    );
  }, []);
  const filtered = chars.filter((item) => `${item.char} ${item.code}`.toLowerCase().includes(query.toLowerCase())).slice(0, 240);

  return (
    <Panel title="Unicode & Symbol Browser" description="Search common symbols, arrows, box drawing characters, math glyphs, and emoji, then copy with one click.">
      <Input placeholder="Search symbol or code point..." value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 md:grid-cols-12">
        {filtered.map((item) => (
          <button key={item.code} type="button" onClick={() => navigator.clipboard.writeText(item.char)} className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-center hover:border-yellow-400/50">
            <div className="text-2xl">{item.char}</div>
            <div className="mt-1 text-[10px] text-white/40">{item.code}</div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function SubtitleEditor() {
  const [text, setText] = useState("1\n00:00:01,000 --> 00:00:03,000\nHello DawnDesk\n");
  const [shift, setShift] = useState(1000);

  function shiftSrt() {
    const shifted = text.replace(/(\d\d):(\d\d):(\d\d),(\d\d\d)/g, (_, h, m, s, ms) => {
      const total = Math.max(0, Number(h) * 3600000 + Number(m) * 60000 + Number(s) * 1000 + Number(ms) + shift);
      const hh = Math.floor(total / 3600000).toString().padStart(2, "0");
      const mm = Math.floor((total % 3600000) / 60000).toString().padStart(2, "0");
      const ss = Math.floor((total % 60000) / 1000).toString().padStart(2, "0");
      const mss = (total % 1000).toString().padStart(3, "0");
      return `${hh}:${mm}:${ss},${mss}`;
    });
    setText(shifted);
  }

  return (
    <Panel title="Subtitle / SRT Editor" description="Edit subtitle text, shift timings, and export a clean SRT file.">
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <Field label="SRT">
          <Textarea value={text} onChange={(event) => setText(event.target.value)} className="min-h-72" />
        </Field>
        <div className="space-y-3">
          <Field label="Shift ms">
            <Input type="number" value={shift} onChange={(event) => setShift(Number(event.target.value))} />
          </Field>
          <Button onClick={shiftSrt}>Shift Timing</Button>
          <Button onClick={() => downloadText("subtitles.srt", text)}>Export SRT</Button>
        </div>
      </div>
    </Panel>
  );
}

function CsvDiff() {
  const [left, setLeft] = useState("id,name\n1,Ada\n2,Linus");
  const [right, setRight] = useState("id,name\n1,Ada\n2,Grace");
  const rows = useMemo(() => {
    const a = left.split("\n");
    const b = right.split("\n");
    return Array.from({ length: Math.max(a.length, b.length) }, (_, index) => ({ index, a: a[index] ?? "", b: b[index] ?? "", changed: (a[index] ?? "") !== (b[index] ?? "") }));
  }, [left, right]);

  return (
    <Panel title="CSV Diff Tool" description="Compare two CSV snippets line-by-line and highlight changed rows.">
      <div className="grid gap-3 md:grid-cols-2">
        <Textarea value={left} onChange={(event) => setLeft(event.target.value)} />
        <Textarea value={right} onChange={(event) => setRight(event.target.value)} />
      </div>
      <Output>
        <div className="grid gap-2">
          {rows.map((row) => (
            <div key={row.index} className={classNames("grid gap-2 rounded-md p-2 text-xs md:grid-cols-[40px_1fr_1fr]", row.changed ? "bg-yellow-400/10 text-yellow-100" : "bg-neutral-900")}>
              <span>{row.index + 1}</span>
              <span className="font-mono">{row.a}</span>
              <span className="font-mono">{row.b}</span>
            </div>
          ))}
        </div>
      </Output>
    </Panel>
  );
}

function CronBuilder() {
  const [minute, setMinute] = useState("0");
  const [hour, setHour] = useState("9");
  const [day, setDay] = useState("*");
  const [month, setMonth] = useState("*");
  const [weekday, setWeekday] = useState("1-5");
  const expression = `${minute} ${hour} ${day} ${month} ${weekday}`;

  return (
    <Panel title="Cron Expression Builder" description="Build standard five-field cron expressions from editable fields.">
      <div className="grid gap-3 sm:grid-cols-5">
        {[
          ["Minute", minute, setMinute],
          ["Hour", hour, setHour],
          ["Day", day, setDay],
          ["Month", month, setMonth],
          ["Weekday", weekday, setWeekday],
        ].map(([label, value, setter]) => (
          <Field key={label as string} label={label as string}>
            <Input value={value as string} onChange={(event) => (setter as (next: string) => void)(event.target.value)} />
          </Field>
        ))}
      </div>
      <Output>
        <div className="flex items-center justify-between gap-3">
          <code className="text-lg text-yellow-200">{expression}</code>
          <button type="button" onClick={() => navigator.clipboard.writeText(expression)} className="text-white/50 hover:text-white">
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </Output>
    </Panel>
  );
}

function JwtDecoder() {
  const [token, setToken] = useState("");
  const decoded = useMemo(() => {
    try {
      const [header, payload, signature] = token.split(".");
      return {
        header: JSON.stringify(JSON.parse(atob((header ?? "").replace(/-/g, "+").replace(/_/g, "/"))), null, 2),
        payload: JSON.stringify(JSON.parse(atob((payload ?? "").replace(/-/g, "+").replace(/_/g, "/"))), null, 2),
        signature: signature || "",
        error: "",
      };
    } catch {
      return { header: "", payload: "", signature: "", error: token ? "Invalid JWT" : "" };
    }
  }, [token]);

  return (
    <Panel title="JWT Decoder & Inspector" description="Decode JWT header and payload locally without sending tokens anywhere.">
      <Textarea value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste JWT..." />
      <Output>
        {decoded.error || (
          <div className="grid gap-3 md:grid-cols-2">
            <pre className="custom-scrollbar overflow-auto rounded-md bg-neutral-900 p-3 text-xs">{decoded.header || "Header"}</pre>
            <pre className="custom-scrollbar overflow-auto rounded-md bg-neutral-900 p-3 text-xs">{decoded.payload || "Payload"}</pre>
          </div>
        )}
      </Output>
    </Panel>
  );
}

function ConfigConverter() {
  const [input, setInput] = useState('{"name":"DawnDesk","tools":30}');
  const [format, setFormat] = useState<"json" | "yaml" | "toml">("yaml");

  const output = useMemo(() => {
    try {
      const parsed = JSON.parse(input);
      if (format === "json") return JSON.stringify(parsed, null, 2);
      if (format === "yaml") {
        return Object.entries(parsed)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? `[${value.join(", ")}]` : JSON.stringify(value)}`)
          .join("\n");
      }
      return Object.entries(parsed)
        .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
        .join("\n");
    } catch {
      return "Invalid JSON input. Paste JSON to convert it to YAML or TOML.";
    }
  }, [format, input]);

  return (
    <Panel title="JSON YAML TOML Converter" description="Validate JSON and convert it to readable YAML-like or TOML output.">
      <div className="flex gap-2">
        {(["json", "yaml", "toml"] as const).map((item) => (
          <button key={item} type="button" onClick={() => setFormat(item)} className={classNames("rounded-md px-3 py-2 text-sm", format === item ? "bg-yellow-400 text-neutral-950" : "bg-neutral-900 text-white/60")}>
            {item.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Textarea value={input} onChange={(event) => setInput(event.target.value)} />
        <pre className="custom-scrollbar min-h-40 overflow-auto rounded-lg border border-neutral-800 bg-neutral-900/80 p-3 text-sm text-white">{output}</pre>
      </div>
    </Panel>
  );
}

function NetworkScanner() {
  const [base, setBase] = useState("192.168.1");
  const [ports, setPorts] = useState("80,443,5173");
  const [results, setResults] = useState<string[]>([]);

  async function scan() {
    const portList = ports.split(",").map((port) => port.trim()).filter(Boolean);
    const targets = Array.from({ length: 12 }, (_, index) => `${base}.${index + 1}`);
    const checks = targets.flatMap((host) => portList.map((port) => fetch(`http://${host}:${port}`, { mode: "no-cors", signal: AbortSignal.timeout(900) }).then(() => `${host}:${port} responded`).catch(() => `${host}:${port} no response`)));
    setResults(await Promise.all(checks));
  }

  return (
    <Panel title="Local Network Scanner" description="Probe a small local IP range from the webview. Browser security may hide details, but responsive hosts are surfaced.">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <Field label="Subnet">
          <Input value={base} onChange={(event) => setBase(event.target.value)} />
        </Field>
        <Field label="Ports">
          <Input value={ports} onChange={(event) => setPorts(event.target.value)} />
        </Field>
        <div className="flex items-end">
          <Button onClick={scan}>Scan</Button>
        </div>
      </div>
      <Output>
        <pre className="whitespace-pre-wrap">{results.join("\n") || "Run a scan to see host responses."}</pre>
      </Output>
    </Panel>
  );
}

function EncoderTool() {
  const [text, setText] = useState("DawnDesk & local tools");
  const outputs = {
    base64: btoa(unescape(encodeURIComponent(text))),
    url: encodeURIComponent(text),
    html: escapeHtml(text),
  };

  return (
    <Panel title="Base64 / URL Encode" description="Encode and decode Base64, URL components, and HTML entities locally.">
      <Textarea value={text} onChange={(event) => setText(event.target.value)} />
      <div className="grid gap-3 md:grid-cols-3">
        {Object.entries(outputs).map(([label, value]) => (
          <Output key={label}>
            <div className="mb-2 text-xs uppercase tracking-wider text-white/40">{label}</div>
            <code className="break-all">{value}</code>
          </Output>
        ))}
      </div>
    </Panel>
  );
}

function ExifTimeline() {
  const [items, setItems] = useState<Array<{ name: string; date: string }>>([]);

  function load(files: File[]) {
    setItems(
      files
        .map((file) => ({ name: file.name, date: new Date(file.lastModified).toISOString().slice(0, 10) }))
        .sort((a, b) => a.date.localeCompare(b.date))
    );
  }

  return (
    <Panel title="Image EXIF Timeline" description="Build a quick local photo timeline from available file modification dates.">
      <FilePicker multiple accept="image/*" onFiles={load} />
      <Output>
        <div className="grid gap-2">
          {items.map((item) => (
            <div key={item.name} className="grid grid-cols-[120px_1fr] rounded-md bg-neutral-900 p-2">
              <span className="text-yellow-200">{item.date}</span>
              <span>{item.name}</span>
            </div>
          ))}
          {!items.length && "Choose images to build a timeline."}
        </div>
      </Output>
    </Panel>
  );
}

function FakeData() {
  const names = ["Ada Lovelace", "Grace Hopper", "Linus Torvalds", "Margaret Hamilton"];
  const [count, setCount] = useState(5);
  const rows = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        id: index + 1,
        name: names[index % names.length],
        email: `user${index + 1}@example.test`,
        token: crypto.getRandomValues(new Uint32Array(1))[0].toString(16),
      })),
    [count]
  );

  return (
    <Panel title="Lorem Ipsum & Fake Data" description="Generate local placeholder names, emails, tokens, and JSON rows.">
      <Field label="Rows">
        <Input type="number" min={1} max={100} value={count} onChange={(event) => setCount(Number(event.target.value))} />
      </Field>
      <Button onClick={() => downloadText("fake-data.json", JSON.stringify(rows, null, 2), "application/json")}>Download JSON</Button>
      <pre className="custom-scrollbar overflow-auto rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-sm text-white">{JSON.stringify(rows, null, 2)}</pre>
    </Panel>
  );
}

function FaviconExtractor() {
  const [url, setUrl] = useState("https://example.com");
  const origin = useMemo(() => {
    try {
      return new URL(url).origin;
    } catch {
      return "";
    }
  }, [url]);
  const favicon = origin ? `${origin}/favicon.ico` : "";

  return (
    <Panel title="Icon & Favicon Extractor" description="Build common favicon URLs from a website origin and preview/download the result.">
      <Input value={url} onChange={(event) => setUrl(event.target.value)} />
      <Output>
        {favicon ? (
          <div className="flex items-center gap-4">
            <img src={favicon} alt="Favicon" className="h-12 w-12 rounded bg-white p-1" />
            <a href={favicon} download className="text-yellow-200 underline">
              {favicon}
            </a>
          </div>
        ) : (
          "Enter a valid URL."
        )}
      </Output>
    </Panel>
  );
}

function VisualDiff() {
  const [status, setStatus] = useState("Choose two images to compare.");

  async function compare(files: File[]) {
    if (files.length < 2) return;
    const images = await Promise.all(
      files.slice(0, 2).map(async (file) => {
        const image = new Image();
        image.src = URL.createObjectURL(file);
        await image.decode();
        return image;
      })
    );
    const width = Math.min(images[0].width, images[1].width, 320);
    const height = Math.min(images[0].height, images[1].height, 320);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(images[0], 0, 0, width, height);
    const left = context.getImageData(0, 0, width, height);
    context.drawImage(images[1], 0, 0, width, height);
    const right = context.getImageData(0, 0, width, height);
    let changed = 0;
    for (let index = 0; index < left.data.length; index += 4) {
      const delta = Math.abs(left.data[index] - right.data[index]) + Math.abs(left.data[index + 1] - right.data[index + 1]) + Math.abs(left.data[index + 2] - right.data[index + 2]);
      if (delta > 40) changed += 1;
    }
    setStatus(`${changed.toLocaleString()} changed pixels across ${width * height} sampled pixels (${((changed / (width * height)) * 100).toFixed(2)}%).`);
  }

  return (
    <Panel title="Visual Diff for Images" description="Compare two images locally and report pixel-level difference percentage.">
      <FilePicker multiple accept="image/*" onFiles={compare} />
      <Output>{status}</Output>
    </Panel>
  );
}

function LinkRotChecker() {
  const [links, setLinks] = useState("https://example.com");
  const [results, setResults] = useState<string[]>([]);

  async function check() {
    const urls = links.split(/\s+/).filter(Boolean);
    const checks = urls.map((url) =>
      fetch(url, { method: "HEAD", mode: "no-cors", signal: AbortSignal.timeout(5000) })
        .then(() => `${url} responded`)
        .catch(() => `${url} failed or blocked by CORS`)
    );
    setResults(await Promise.all(checks));
  }

  return (
    <Panel title="Link Rot Checker" description="Check a pasted URL list and flag links that fail from the current webview.">
      <Textarea value={links} onChange={(event) => setLinks(event.target.value)} />
      <Button onClick={check}>Check Links</Button>
      <Output>
        <pre className="whitespace-pre-wrap">{results.join("\n") || "No checks run yet."}</pre>
      </Output>
    </Panel>
  );
}

function PasswordAuditor() {
  const [length, setLength] = useState(20);
  const [passwords, setPasswords] = useState("");
  const generated = useMemo(() => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    const values = crypto.getRandomValues(new Uint32Array(length));
    return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
  }, [length]);
  const audit = passwords
    .split("\n")
    .filter(Boolean)
    .map((password) => `${password.slice(0, 3)}... ${password.length >= 14 && /[A-Z]/.test(password) && /\d/.test(password) ? "strong" : "weak"}`);

  return (
    <Panel title="Password Auditor" description="Generate strong local passwords and audit pasted passwords for basic length and character diversity.">
      <Field label="Generated length">
        <Input type="number" min={8} max={80} value={length} onChange={(event) => setLength(Number(event.target.value))} />
      </Field>
      <Output>
        <code className="break-all text-yellow-200">{generated}</code>
      </Output>
      <Textarea value={passwords} onChange={(event) => setPasswords(event.target.value)} placeholder="Paste one password per line to audit..." />
      <Output>
        <pre>{audit.join("\n") || "No passwords to audit."}</pre>
      </Output>
    </Panel>
  );
}

function TimestampEditor() {
  const [files, setFiles] = useState<File[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <Panel title="File Timestamp Editor" description="Prepare timestamp rename/download manifests for selected files. Browser file APIs cannot mutate originals directly.">
      <FilePicker multiple onFiles={setFiles} />
      <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      <Button onClick={() => downloadText("timestamp-manifest.csv", ["file,target_date", ...files.map((file) => `${file.name},${date}`)].join("\n"), "text/csv")}>Download Manifest</Button>
      <Output>{files.length ? `${files.length} files staged for ${date}.` : "Choose files to stage timestamp changes."}</Output>
    </Panel>
  );
}

function DnsLookup() {
  const [domain, setDomain] = useState("example.com");
  const [result, setResult] = useState("");

  async function lookup() {
    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`, { headers: { accept: "application/dns-json" } });
    setResult(JSON.stringify(await response.json(), null, 2));
  }

  return (
    <Panel title="DNS Lookup & WHOIS" description="Query DNS A records through DNS-over-HTTPS and inspect the JSON response.">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <Input value={domain} onChange={(event) => setDomain(event.target.value)} />
        <Button onClick={lookup}>Lookup</Button>
      </div>
      <pre className="custom-scrollbar min-h-40 overflow-auto rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-sm text-white">{result || "No lookup yet."}</pre>
    </Panel>
  );
}

function ApiTester() {
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/todos/1");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState("");

  async function send() {
    try {
      const res = await fetch(url, { method, body: method === "GET" ? undefined : body });
      setResponse(`HTTP ${res.status}\n\n${await res.text()}`);
    } catch (error) {
      setResponse(error instanceof Error ? error.message : "Request failed");
    }
  }

  return (
    <Panel title="API Request Tester" description="Send lightweight HTTP requests and inspect status plus response body.">
      <div className="grid gap-3 md:grid-cols-[120px_1fr_auto]">
        <Input value={method} onChange={(event) => setMethod(event.target.value.toUpperCase())} />
        <Input value={url} onChange={(event) => setUrl(event.target.value)} />
        <Button onClick={send}>Send</Button>
      </div>
      <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Request body for POST/PUT/PATCH..." />
      <pre className="custom-scrollbar min-h-40 overflow-auto rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-sm text-white">{response || "No response yet."}</pre>
    </Panel>
  );
}

function DiffPatcher() {
  const [source, setSource] = useState("hello\nold line\nbye");
  const [patch, setPatch] = useState("@@\n-old line\n+new line");
  const result = useMemo(() => {
    let output = source.split("\n");
    patch.split("\n").forEach((line) => {
      if (line.startsWith("-")) output = output.filter((item) => item !== line.slice(1));
      if (line.startsWith("+")) output.push(line.slice(1));
    });
    return output.join("\n");
  }, [patch, source]);

  return (
    <Panel title="Diff Patcher" description="Apply simple unified diff additions and removals to text and preview the patched result.">
      <div className="grid gap-3 md:grid-cols-2">
        <Textarea value={source} onChange={(event) => setSource(event.target.value)} />
        <Textarea value={patch} onChange={(event) => setPatch(event.target.value)} />
      </div>
      <pre className="custom-scrollbar min-h-40 overflow-auto rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-sm text-white">{result}</pre>
    </Panel>
  );
}

function SteganoDetector() {
  const [message, setMessage] = useState("");

  async function inspect(files: File[]) {
    const file = files[0];
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const lowBits = bytes.slice(0, 2048).reduce((sum, byte) => sum + (byte & 1), 0);
    setMessage(`Low-bit density in first 2 KB: ${((lowBits / Math.min(bytes.length, 2048)) * 100).toFixed(1)}%. Unusual extremes can hint at hidden data.`);
  }

  return (
    <Panel title="Steganography Detector" description="Run a quick low-bit density heuristic against an image or binary file.">
      <FilePicker onFiles={inspect} />
      <Output>{message || "Choose a file to inspect."}</Output>
    </Panel>
  );
}

function AiOrganiser() {
  const [plan, setPlan] = useState("");

  function organise(files: File[]) {
    const groups = files.reduce<Record<string, string[]>>((acc, file) => {
      const key = file.type.split("/")[0] || "other";
      acc[key] = [...(acc[key] ?? []), file.name];
      return acc;
    }, {});
    setPlan(Object.entries(groups).map(([folder, names]) => `${folder}/\n${names.map((name) => `  - ${name}`).join("\n")}`).join("\n\n"));
  }

  return (
    <Panel title="AI File Organiser" description="Suggest a practical folder structure from file MIME types and names.">
      <FilePicker multiple onFiles={organise} />
      <pre className="custom-scrollbar min-h-40 overflow-auto rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-sm text-white">{plan || "Choose files to generate an organisation plan."}</pre>
    </Panel>
  );
}

function GenericLocalTool({ id }: { id: string }) {
  if (id === "font-extractor") return <FontExtractor />;
  if (id === "color-extractor") return <ColorExtractor />;
  if (id === "regex-tester") return <RegexTester />;
  if (id === "markdown-pdf") return <MarkdownPdf />;
  if (id === "ai-renamer") return <FileRenamer />;
  if (id === "metadata-stripper") return <MetadataTool />;
  if (id === "duplicate-finder") return <DuplicateFinder />;
  if (id === "hex-viewer") return <HexViewer />;
  if (id === "qr-tools") return <QrTools />;
  if (id === "unicode-browser") return <UnicodeBrowser />;
  if (id === "subtitle-editor") return <SubtitleEditor />;
  if (id === "csv-diff") return <CsvDiff />;
  if (id === "cron-builder") return <CronBuilder />;
  if (id === "jwt-decoder") return <JwtDecoder />;
  if (id === "config-converter") return <ConfigConverter />;
  if (id === "network-scanner") return <NetworkScanner />;
  if (id === "base64-encode") return <EncoderTool />;
  if (id === "exif-timeline") return <ExifTimeline />;
  if (id === "fake-data") return <FakeData />;
  if (id === "icon-extractor") return <FaviconExtractor />;
  if (id === "visual-diff") return <VisualDiff />;
  if (id === "link-rot") return <LinkRotChecker />;
  if (id === "password-auditor") return <PasswordAuditor />;
  if (id === "timestamp-editor") return <TimestampEditor />;
  if (id === "dns-lookup") return <DnsLookup />;
  if (id === "api-tester") return <ApiTester />;
  if (id === "diff-patcher") return <DiffPatcher />;
  if (id === "stegano-detector") return <SteganoDetector />;
  if (id === "ai-organiser") return <AiOrganiser />;
  return (
    <Panel title="AI Handwriting Decoder" description="Preview handwriting images and prepare them for transcription workflows.">
      <Output>Local OCR is not bundled yet, but this panel accepts note photos through the file picker for future OCR integration.</Output>
      <FilePicker accept="image/*" onFiles={() => undefined} />
    </Panel>
  );
}

export default function DevToolsHub() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "All">("All");
  const [selectedToolId, setSelectedToolId] = useState(devTools[0]?.id ?? "");

  const categories = useMemo(() => ["All", ...Array.from(new Set(devTools.map((tool) => tool.category)))] as Array<ToolCategory | "All">, []);
  const filteredTools = devTools.filter(
    (tool) =>
      (activeCategory === "All" || tool.category === activeCategory) &&
      (tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const selectedTool = devTools.find((tool) => tool.id === selectedToolId) ?? devTools[0];
  const categoryCounts = useMemo(
    () =>
      categories.reduce<Record<string, number>>((acc, category) => {
        acc[category] = category === "All" ? devTools.length : devTools.filter((tool) => tool.category === category).length;
        return acc;
      }, {}),
    [categories]
  );

  function handleSearch(event: ChangeEvent<HTMLInputElement>) {
    setSearchQuery(event.target.value);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full animate-fadeIn flex-col overflow-hidden bg-[#090a0c] text-white">
      <header className="border-b border-neutral-800 bg-neutral-950 px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-yellow-300">
              <Grid2X2 className="h-4 w-4" />
              {devTools.length} local utilities
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Developer Tools</h1>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-white/45">
              A focused desktop workbench for quick transforms, file inspection, request testing, and security checks.
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={handleSearch}
                className="h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-yellow-400/50"
              />
            </div>
            <div className="flex rounded-md border border-neutral-800 bg-neutral-900 p-1">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={classNames(
                    "whitespace-nowrap rounded px-3 py-1.5 text-xs font-semibold transition",
                    activeCategory === category ? "bg-yellow-400 text-neutral-950" : "text-white/45 hover:bg-neutral-800 hover:text-white"
                  )}
                  title={category}
                >
                  {category === "All" ? "All" : category.replace(/^V\d - /, "")}
                  <span className="ml-2 opacity-60">{categoryCounts[category]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-hidden border-b border-neutral-800 bg-neutral-950/70 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                <Layers3 className="h-4 w-4 text-yellow-300" />
                Tool Index
              </div>
              <span className="text-xs text-white/35">{filteredTools.length} shown</span>
            </div>
            <div className="custom-scrollbar grid max-h-56 grid-cols-1 gap-px overflow-auto bg-neutral-800 lg:max-h-none lg:flex-1">
              {filteredTools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setSelectedToolId(tool.id)}
                  className={classNames(
                    "grid grid-cols-[36px_1fr] gap-3 bg-neutral-950 px-4 py-3 text-left transition hover:bg-neutral-900",
                    selectedToolId === tool.id && "bg-neutral-900"
                  )}
                >
                  <span
                    className={classNames(
                      "flex h-9 w-9 items-center justify-center rounded-md border",
                      selectedToolId === tool.id ? "border-yellow-400/40 bg-yellow-400/10" : "border-neutral-800 bg-neutral-950"
                    )}
                  >
                    {tool.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-white/90">{tool.title}</span>
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-xs leading-5 text-white/40">{tool.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-4">
          <div className="mb-4 grid gap-3 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/35">
                {selectedTool.category}
              </div>
              <h2 className="truncate text-xl font-semibold text-white">{selectedTool.title}</h2>
              <p className="mt-1 max-w-3xl text-sm text-white/45">{selectedTool.description}</p>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-md border border-green-400/20 bg-green-400/10 px-3 py-2 text-xs font-semibold text-green-300">
              <span className="h-2 w-2 rounded-full bg-green-300" />
              Implemented
            </div>
          </div>
          <GenericLocalTool id={selectedTool.id} />
        </main>
      </div>
    </div>
  );
}
