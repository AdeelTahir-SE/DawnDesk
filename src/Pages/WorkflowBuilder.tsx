import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  Code2,
  Download,
  FileInput,
  FileOutput,
  FolderOpen,
  GitBranch,
  Image as ImageIcon,
  ListRestart,
  Maximize2,
  Minimize2,
  Play,
  Plus,
  Save,
  Search,
  Terminal,
  Trash2,
  Video,
  Workflow,
  X,
  XCircle,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import WelcomeScreen from "../components/WelcomeScreen";

type DataKind = "text" | "file" | "image" | "video" | "boolean" | "any";
type NodeKind = "input" | "tool" | "logic" | "output";
type NodeStatus = "idle" | "ready" | "running" | "success" | "error";

type Point = {
  x: number;
  y: number;
};

type WorkflowNode = {
  id: string;
  title: string;
  description: string;
  kind: NodeKind;
  input: DataKind[];
  output: DataKind;
  position: Point;
  value?: string;
  status?: NodeStatus;
};

type Connection = {
  id: string;
  from: string;
  to: string;
  fromPort?: string;
};

type NodeTemplate = Omit<WorkflowNode, "id" | "position" | "status">;

type DragState =
  | { type: "node"; nodeId: string; offset: Point }
  | { type: "pan"; origin: Point; panStart: Point };

type ResizeState =
  | { type: "palette"; originX: number; startWidth: number }
  | { type: "inspector"; originX: number; startWidth: number }
  | { type: "terminal"; originY: number; startHeight: number };

type PendingConnection = {
  from: string;
  fromPort: string;
  pointer: Point;
};

type RunLog = {
  nodeId: string;
  title: string;
  message: string;
  output: DataKind;
  status: Extract<NodeStatus, "success" | "error">;
};

type OutputPort = {
  id: string;
  label: string;
  kind: DataKind;
  offsetY: number;
};

type FunctionParam = {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  placeholder?: string;
  options?: string[];
};

type WorkflowFunction = {
  id: string;
  label: string;
  api: string;
  description: string;
  params: FunctionParam[];
};

type NodeFunctionConfig = {
  functionId: string;
  params: Record<string, string>;
};

type RouteConfig = {
  condition?: string;
  batchSize?: string;
  cases?: string[];
};

const nodeWidth = 232;
const nodeHeight = 124;
const collapsedPaletteWidth = 72;
const STORAGE_KEY = "dawndesk_workflow_graph";
const configurableKinds: DataKind[] = ["text", "file", "image", "video", "boolean"];
const workflowFunctions: Record<string, WorkflowFunction[]> = {
  "Photo Editor": [
    {
      id: "photo_export_file",
      label: "Export image file",
      api: "photo_export_file",
      description: "Save image bytes to a sanitized file name in Downloads.",
      params: [
        { key: "file_name", label: "File name", type: "text", placeholder: "edited-image.png" },
      ],
    },
    {
      id: "photo_resize",
      label: "Resize canvas",
      api: "photo-editor.resize",
      description: "Configure resize dimensions for a photo workflow step.",
      params: [
        { key: "width", label: "Width", type: "number", placeholder: "1080" },
        { key: "height", label: "Height", type: "number", placeholder: "1080" },
        { key: "fit", label: "Fit mode", type: "select", options: ["contain", "cover", "stretch"] },
      ],
    },
    {
      id: "photo_filter",
      label: "Apply filter",
      api: "photo-editor.filter",
      description: "Apply a named photo filter in the workflow.",
      params: [
        { key: "filter", label: "Filter", type: "select", options: ["grayscale", "sepia", "invert", "sharpen", "blur"] },
        { key: "amount", label: "Amount", type: "number", placeholder: "50" },
      ],
    },
  ],
  "Video Editor": [
    {
      id: "ve_check_ffmpeg",
      label: "Check FFmpeg",
      api: "ve_check_ffmpeg",
      description: "Verify that DawnDesk can access the bundled FFmpeg runtime.",
      params: [],
    },
    {
      id: "ve_probe_media",
      label: "Probe media",
      api: "ve_probe_media",
      description: "Read media duration, dimensions, codec, and stream metadata.",
      params: [{ key: "path", label: "Media path", type: "text", placeholder: "C:\\media\\clip.mp4" }],
    },
    {
      id: "ve_generate_thumbnail",
      label: "Generate thumbnail",
      api: "ve_generate_thumbnail",
      description: "Generate a thumbnail image from a video at a specific time.",
      params: [
        { key: "path", label: "Media path", type: "text", placeholder: "C:\\media\\clip.mp4" },
        { key: "time", label: "Time (seconds)", type: "number", placeholder: "1.5" },
      ],
    },
    {
      id: "ve_generate_waveform",
      label: "Generate waveform",
      api: "ve_generate_waveform",
      description: "Create waveform sample data for an audio or video file.",
      params: [{ key: "path", label: "Media path", type: "text", placeholder: "C:\\media\\clip.mp4" }],
    },
  ],
  "Dev Tool": [
    {
      id: "font-extractor",
      label: "Font Extractor",
      api: "dev-tools.font-extractor",
      description: "Extract fonts from a PDF or image.",
      params: [{ key: "path", label: "File path", type: "text", placeholder: "C:\\docs\\design.pdf" }],
    },
    {
      id: "color-extractor",
      label: "Color Palette Extractor",
      api: "dev-tools.color-extractor",
      description: "Extract a color palette from an image or screenshot.",
      params: [
        { key: "path", label: "Image path", type: "text", placeholder: "C:\\images\\screen.png" },
        { key: "count", label: "Color count", type: "number", placeholder: "8" },
      ],
    },
    {
      id: "regex-tester",
      label: "Regex Tester",
      api: "dev-tools.regex-tester",
      description: "Run a regex against text and return matches.",
      params: [
        { key: "pattern", label: "Pattern", type: "text", placeholder: "\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b" },
        { key: "flags", label: "Flags", type: "text", placeholder: "gi" },
      ],
    },
    {
      id: "base64-encode",
      label: "Base64 / URL Encode",
      api: "dev-tools.base64-encode",
      description: "Encode or decode common text formats.",
      params: [
        { key: "mode", label: "Mode", type: "select", options: ["base64 encode", "base64 decode", "url encode", "url decode"] },
        { key: "text", label: "Text", type: "text", placeholder: "Input text" },
      ],
    },
  ],
  "API Request": [
    {
      id: "http_request",
      label: "HTTP request",
      api: "workflow.http_request",
      description: "Send a request to an API endpoint and route the response forward.",
      params: [
        { key: "method", label: "Method", type: "select", options: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
        { key: "url", label: "URL", type: "text", placeholder: "https://api.example.com/items" },
        { key: "headers", label: "Headers JSON", type: "text", placeholder: "{\"Authorization\":\"Bearer ...\"}" },
        { key: "body", label: "Body JSON", type: "text", placeholder: "{\"name\":\"DawnDesk\"}" },
      ],
    },
  ],
  "Transform Data": [
    {
      id: "map_fields",
      label: "Map fields",
      api: "workflow.map_fields",
      description: "Rename, select, or reshape fields from incoming data.",
      params: [
        { key: "mapping", label: "Field mapping JSON", type: "text", placeholder: "{\"newName\":\"oldName\"}" },
      ],
    },
    {
      id: "extract_json_path",
      label: "Extract JSON path",
      api: "workflow.extract_json_path",
      description: "Extract a value from JSON-like data using a path.",
      params: [{ key: "path", label: "JSON path", type: "text", placeholder: "$.items[0].name" }],
    },
  ],
  "Code Function": [
    {
      id: "javascript_function",
      label: "JavaScript function",
      api: "workflow.javascript_function",
      description: "Configure a JavaScript-style function body for transforming input data.",
      params: [
        { key: "code", label: "Function body", type: "text", placeholder: "return input;" },
      ],
    },
  ],
  "File Operation": [
    {
      id: "read_file",
      label: "Read file",
      api: "workflow.read_file",
      description: "Read a file path from the workflow and pass contents forward.",
      params: [{ key: "path", label: "Path", type: "text", placeholder: "C:\\data\\input.txt" }],
    },
    {
      id: "write_file",
      label: "Write file",
      api: "workflow.write_file",
      description: "Write configured text to a file path.",
      params: [
        { key: "path", label: "Path", type: "text", placeholder: "C:\\data\\output.txt" },
        { key: "contents", label: "Contents", type: "text", placeholder: "Workflow output" },
      ],
    },
  ],
};

const templates: NodeTemplate[] = [
  {
    title: "Input",
    description: "Configurable workflow input for text, files, images, video, or booleans.",
    kind: "input",
    input: [],
    output: "text",
    value: "Write a clean caption for this output.",
  },
  {
    title: "Photo Editor",
    description: "Image operations through DawnDesk photo APIs.",
    kind: "tool",
    input: ["file", "image"],
    output: "image",
  },
  {
    title: "Video Editor",
    description: "Trim, render, convert, and process media.",
    kind: "tool",
    input: ["file", "video", "image"],
    output: "video",
  },
  {
    title: "Dev Tool",
    description: "Formatter, parser, converter, or validator.",
    kind: "tool",
    input: ["text", "file"],
    output: "text",
  },
  {
    title: "API Request",
    description: "Call APIs with method, URL, headers, and body parameters.",
    kind: "tool",
    input: ["text", "any"],
    output: "text",
  },
  {
    title: "Transform Data",
    description: "Map fields, extract paths, and reshape workflow data.",
    kind: "tool",
    input: ["text", "any"],
    output: "text",
  },
  {
    title: "Code Function",
    description: "Run a configurable function-style transform step.",
    kind: "tool",
    input: ["text", "any"],
    output: "text",
  },
  {
    title: "File Operation",
    description: "Read or write file-based workflow data.",
    kind: "tool",
    input: ["file", "text", "any"],
    output: "file",
  },
  {
    title: "For Each",
    description: "Repeat connected steps for each input item.",
    kind: "logic",
    input: ["text", "file", "any"],
    output: "any",
  },
  {
    title: "If / Else",
    description: "Branch by a text, file, or boolean condition.",
    kind: "logic",
    input: ["text", "file", "boolean", "any"],
    output: "any",
  },
  {
    title: "Switch",
    description: "Route data through multiple named cases with a fallback route.",
    kind: "logic",
    input: ["text", "file", "boolean", "any"],
    output: "any",
    value: JSON.stringify({ cases: ["case 1", "case 2"] }),
  },
  {
    title: "Merge",
    description: "Combine multiple incoming branches into one output route.",
    kind: "logic",
    input: ["any"],
    output: "any",
  },
  {
    title: "Try / Catch",
    description: "Route successful execution separately from errors.",
    kind: "logic",
    input: ["any"],
    output: "any",
  },
  {
    title: "Output",
    description: "Configurable workflow output that saves the run result to a chosen path.",
    kind: "output",
    input: ["any"],
    output: "text",
    value: "",
  },
];

const templateIcons: Record<string, React.ReactNode> = {
  Input: <FileInput className="h-4 w-4" />,
  "Photo Editor": <ImageIcon className="h-4 w-4" />,
  "Video Editor": <Video className="h-4 w-4" />,
  "Dev Tool": <Code2 className="h-4 w-4" />,
  "API Request": <Workflow className="h-4 w-4" />,
  "Transform Data": <GitBranch className="h-4 w-4" />,
  "Code Function": <Code2 className="h-4 w-4" />,
  "File Operation": <FileOutput className="h-4 w-4" />,
  "For Each": <ListRestart className="h-4 w-4" />,
  "If / Else": <GitBranch className="h-4 w-4" />,
  Switch: <GitBranch className="h-4 w-4" />,
  Merge: <GitBranch className="h-4 w-4" />,
  "Try / Catch": <GitBranch className="h-4 w-4" />,
  Output: <FileOutput className="h-4 w-4" />,
};

const kindIcons: Record<NodeKind, React.ReactNode> = {
  input: <FileInput className="h-4 w-4" />,
  logic: <GitBranch className="h-4 w-4" />,
  output: <FileOutput className="h-4 w-4" />,
  tool: <Code2 className="h-4 w-4" />,
};

const kindStyles: Record<DataKind, string> = {
  any: "border-white/20 bg-white/10 text-white/70",
  boolean: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  file: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  image: "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200",
  text: "border-yellow-400/30 bg-yellow-400/10 text-yellow-200",
  video: "border-orange-400/30 bg-orange-400/10 text-orange-200",
};

const statusStyles: Record<NodeStatus, string> = {
  error: "bg-red-400",
  idle: "bg-neutral-500",
  ready: "bg-sky-300",
  running: "bg-yellow-300 animate-pulse",
  success: "bg-green-300",
};

const initialNodes: WorkflowNode[] = [
  { ...templates[0], id: "file-input", output: "file", value: "", position: { x: 120, y: 160 }, status: "ready" },
  { ...templates[1], id: "photo-editor", position: { x: 430, y: 160 }, status: "idle" },
  { ...templates[13], id: "file-output", output: "image", position: { x: 740, y: 160 }, status: "idle" },
  { ...templates[0], id: "text-input", output: "text", position: { x: 120, y: 360 }, status: "ready" },
  { ...templates[3], id: "dev-tool", position: { x: 430, y: 360 }, status: "idle" },
  { ...templates[13], id: "text-output", output: "text", position: { x: 740, y: 360 }, status: "idle" },
];

const initialConnections: Connection[] = [
  { id: "file-input-photo-editor", from: "file-input", to: "photo-editor" },
  { id: "photo-editor-file-output", from: "photo-editor", to: "file-output" },
  { id: "text-input-dev-tool", from: "text-input", to: "dev-tool" },
  { id: "dev-tool-text-output", from: "dev-tool", to: "text-output" },
];

const workflowTemplates: Array<{ title: string; nodes: WorkflowNode[]; connections: Connection[] }> = [
  {
    title: "Image to output",
    nodes: initialNodes.slice(0, 3),
    connections: initialConnections.slice(0, 2),
  },
  {
    title: "Text transform",
    nodes: initialNodes.slice(3, 6),
    connections: initialConnections.slice(2, 4),
  },
  {
    title: "Batch branch",
    nodes: [
      { ...templates[0], id: "batch-file", output: "file", value: "", position: { x: 110, y: 170 }, status: "ready" as NodeStatus },
      { ...templates[8], id: "for-each", position: { x: 390, y: 170 }, status: "idle" as NodeStatus },
      { ...templates[9], id: "if-else", position: { x: 670, y: 170 }, status: "idle" as NodeStatus },
      { ...templates[13], id: "batch-output", output: "file", position: { x: 950, y: 170 }, status: "idle" as NodeStatus },
    ],
    connections: [
      { id: "batch-file-for-each", from: "batch-file", to: "for-each" },
      { id: "for-each-if-else", from: "for-each", to: "if-else" },
      { id: "if-else-batch-output", from: "if-else", to: "batch-output" },
    ],
  },
];

function acceptsKind(node: WorkflowNode, kind: DataKind) {
  return node.input.includes("any") || node.input.includes(kind);
}

function edgePath(from: Point, to: Point) {
  const curve = Math.max(80, Math.abs(to.x - from.x) / 2);
  return `M ${from.x} ${from.y} C ${from.x + curve} ${from.y}, ${to.x - curve} ${to.y}, ${to.x} ${to.y}`;
}

function getOutputPorts(node: WorkflowNode): OutputPort[] {
  if (node.title === "If / Else") {
    const offsets = distributePortOffsets(2);
    return [
      { id: "true", label: "true", kind: "any", offsetY: offsets[0] },
      { id: "false", label: "false", kind: "any", offsetY: offsets[1] },
    ];
  }

  if (node.title === "For Each") {
    const offsets = distributePortOffsets(2);
    return [
      { id: "item", label: "item", kind: "any", offsetY: offsets[0] },
      { id: "done", label: "done", kind: "any", offsetY: offsets[1] },
    ];
  }

  if (node.title === "Try / Catch") {
    const offsets = distributePortOffsets(2);
    return [
      { id: "success", label: "success", kind: "any", offsetY: offsets[0] },
      { id: "error", label: "error", kind: "any", offsetY: offsets[1] },
    ];
  }

  if (node.title === "Switch") {
    const config = parseRouteConfig(node.value);
    const cases = config.cases?.length ? config.cases : ["case 1", "case 2"];
    const routes = [...cases, "default"];
    const offsets = distributePortOffsets(routes.length);
    return routes.map((route, index) => ({
      id: route === "default" ? "default" : `case-${index + 1}`,
      label: route,
      kind: "any",
      offsetY: offsets[index],
    }));
  }

  return [{ id: "main", label: "out", kind: node.output, offsetY: nodeHeight / 2 }];
}

function outputPoint(node: WorkflowNode, portId = "main") {
  const port = getOutputPorts(node).find((item) => item.id === portId) ?? getOutputPorts(node)[0];
  return { x: node.position.x + nodeWidth, y: node.position.y + port.offsetY };
}

function inputPoint(node: WorkflowNode) {
  return { x: node.position.x, y: node.position.y + nodeHeight / 2 };
}

function cloneTemplate(template: NodeTemplate, position: Point): WorkflowNode {
  return {
    ...template,
    id: `${template.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
    position,
    status: template.kind === "input" ? "ready" : "idle",
  };
}

function parseFunctionConfig(value?: string): NodeFunctionConfig {
  if (!value) return { functionId: "", params: {} };

  try {
    const parsed = JSON.parse(value) as Partial<NodeFunctionConfig>;
    if (typeof parsed.functionId === "string" && parsed.params && typeof parsed.params === "object") {
      return { functionId: parsed.functionId, params: parsed.params as Record<string, string> };
    }
  } catch {
    return { functionId: "", params: {} };
  }

  return { functionId: "", params: {} };
}

function serializeFunctionConfig(config: NodeFunctionConfig) {
  return JSON.stringify(config);
}

function parseRouteConfig(value?: string): RouteConfig {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as Partial<RouteConfig>;
    return {
      condition: typeof parsed.condition === "string" ? parsed.condition : "",
      batchSize: typeof parsed.batchSize === "string" ? parsed.batchSize : "",
      cases: Array.isArray(parsed.cases) ? parsed.cases.filter((item): item is string => typeof item === "string") : undefined,
    };
  } catch {
    return { condition: value };
  }
}

function serializeRouteConfig(config: RouteConfig) {
  return JSON.stringify(config);
}

function distributePortOffsets(count: number) {
  if (count <= 1) return [nodeHeight / 2];
  const step = nodeHeight / (count + 1);
  return Array.from({ length: count }, (_, index) => step * (index + 1));
}

export default function WorkflowBuilder() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [selectedEdgeId, setSelectedEdgeId] = useState("");
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.92);
  const [query, setQuery] = useState("");
  const [runLogs, setRunLogs] = useState<RunLog[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [paletteWidth, setPaletteWidth] = useState(278);
  const [inspectorWidth, setInspectorWidth] = useState(340);
  const [terminalHeight, setTerminalHeight] = useState(176);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const selectedEdge = connections.find((connection) => connection.id === selectedEdgeId);
  const hasInspectorSelection = Boolean(selectedNode || selectedEdge);

  useEffect(() => {
    const syncFullscreenState = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  useEffect(() => {
    if (!resizeState) return;

    const onPointerMove = (event: PointerEvent) => {
      if (resizeState.type === "palette") {
        setPaletteWidth(Math.min(420, Math.max(220, resizeState.startWidth + event.clientX - resizeState.originX)));
        return;
      }

      if (resizeState.type === "inspector") {
        setInspectorWidth(Math.min(520, Math.max(280, resizeState.startWidth - (event.clientX - resizeState.originX))));
        return;
      }

      setTerminalHeight(Math.min(360, Math.max(96, resizeState.startHeight - (event.clientY - resizeState.originY))));
    };

    const stopResize = () => setResizeState(null);

    document.body.style.cursor = resizeState.type === "terminal" ? "row-resize" : "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopResize);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopResize);
    };
  }, [resizeState]);

  const groupedTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return templates
      .filter((template) => {
        if (!normalizedQuery) return true;
        return `${template.title} ${template.description} ${template.output}`.toLowerCase().includes(normalizedQuery);
      })
      .reduce<Record<NodeKind, NodeTemplate[]>>(
        (acc, template) => {
          acc[template.kind].push(template);
          return acc;
        },
        { input: [], logic: [], output: [], tool: [] },
      );
  }, [query]);

  const canvasToScreen = (point: Point) => ({
    x: point.x * zoom + pan.x,
    y: point.y * zoom + pan.y,
  });

  const screenToCanvas = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  const addNode = (template: NodeTemplate, position?: Point) => {
    const nextPosition = position ?? { x: 160 + nodes.length * 26, y: 120 + nodes.length * 18 };
    const node = cloneTemplate(template, nextPosition);
    setNodes((current) => [...current, node]);
    setSelectedNodeId(node.id);
    setSelectedEdgeId("");
  };

  const onNodeDragStart = (event: React.PointerEvent, node: WorkflowNode) => {
    const pointer = screenToCanvas(event.clientX, event.clientY);
    setSelectedNodeId(node.id);
    setSelectedEdgeId("");
    setDragState({
      type: "node",
      nodeId: node.id,
      offset: { x: pointer.x - node.position.x, y: pointer.y - node.position.y },
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onCanvasPointerDown = (event: React.PointerEvent) => {
    if (event.target !== event.currentTarget) return;
    setSelectedNodeId("");
    setSelectedEdgeId("");
    setDragState({
      type: "pan",
      origin: { x: event.clientX, y: event.clientY },
      panStart: pan,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onCanvasPointerMove = (event: React.PointerEvent) => {
    const pointer = screenToCanvas(event.clientX, event.clientY);
    if (pendingConnection) {
      setPendingConnection((current) => (current ? { ...current, pointer } : null));
    }

    if (!dragState) return;

    if (dragState.type === "pan") {
      setPan({
        x: dragState.panStart.x + event.clientX - dragState.origin.x,
        y: dragState.panStart.y + event.clientY - dragState.origin.y,
      });
      return;
    }

    setNodes((current) =>
      current.map((node) =>
        node.id === dragState.nodeId
          ? {
              ...node,
              position: {
                x: Math.round((pointer.x - dragState.offset.x) / 14) * 14,
                y: Math.round((pointer.y - dragState.offset.y) / 14) * 14,
              },
            }
          : node,
      ),
    );
  };

  const onCanvasPointerUp = (event: React.PointerEvent) => {
    if (dragState) event.currentTarget.releasePointerCapture(event.pointerId);
    setDragState(null);
  };

  const startConnection = (event: React.PointerEvent, node: WorkflowNode, fromPort = "main") => {
    event.stopPropagation();
    setPendingConnection({ from: node.id, fromPort, pointer: outputPoint(node, fromPort) });
    setSelectedNodeId(node.id);
    setSelectedEdgeId("");
  };

  const finishConnection = (event: React.PointerEvent, target: WorkflowNode) => {
    event.stopPropagation();
    if (!pendingConnection || pendingConnection.from === target.id) return;
    const source = nodes.find((node) => node.id === pendingConnection.from);
    if (!source || !acceptsKind(target, source.output)) return;
    const id = `${source.id}-${pendingConnection.fromPort}-${target.id}`;
    const exists = connections.some(
      (connection) =>
        connection.from === source.id &&
        connection.to === target.id &&
        (connection.fromPort ?? "main") === pendingConnection.fromPort,
    );
    if (!exists) setConnections((current) => [...current, { id, from: source.id, fromPort: pendingConnection.fromPort, to: target.id }]);
    setPendingConnection(null);
  };

  const onWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pointer = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const canvasPoint = {
      x: (pointer.x - pan.x) / zoom,
      y: (pointer.y - pan.y) / zoom,
    };
    const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    const nextZoom = Math.min(1.6, Math.max(0.35, zoom - delta * 0.0012));

    setZoom(nextZoom);
    setPan({
      x: pointer.x - canvasPoint.x * nextZoom,
      y: pointer.y - canvasPoint.y * nextZoom,
    });
  };

  const chooseInputFile = async () => {
    if (!selectedNode) return;
    const selected = await open({ multiple: false, directory: false, title: "Select workflow input file" });
    if (typeof selected === "string") {
      updateNodeValue(selected);
      markNodeReady(selectedNode.id);
    }
  };

  const chooseOutputPath = async () => {
    if (!selectedNode) return;
    const selected = await save({ title: "Choose workflow output location", defaultPath: selectedNode.value || "workflow-output" });
    if (selected) updateNodeValue(selected);
  };

  const updateNodeValue = (value: string) => {
    if (!selectedNode) return;
    setNodes((current) => current.map((node) => (node.id === selectedNode.id ? { ...node, value } : node)));
  };

  const updateNodeOutputKind = (kind: DataKind) => {
    if (!selectedNode) return;
    setNodes((current) => current.map((node) => (node.id === selectedNode.id ? { ...node, output: kind } : node)));
  };

  const updateNodeFunction = (functionId: string) => {
    if (!selectedNode) return;
    const nextFunction = workflowFunctions[selectedNode.title]?.find((item) => item.id === functionId);
    const params = Object.fromEntries((nextFunction?.params ?? []).map((param) => [param.key, param.options?.[0] ?? ""]));
    setNodes((current) =>
      current.map((node) =>
        node.id === selectedNode.id
          ? { ...node, value: serializeFunctionConfig({ functionId, params }) }
          : node,
      ),
    );
  };

  const updateNodeFunctionParam = (key: string, value: string) => {
    if (!selectedNode) return;
    const currentConfig = parseFunctionConfig(selectedNode.value);
    setNodes((current) =>
      current.map((node) =>
        node.id === selectedNode.id
          ? { ...node, value: serializeFunctionConfig({ ...currentConfig, params: { ...currentConfig.params, [key]: value } }) }
          : node,
      ),
    );
  };

  const updateRouteConfig = (updates: RouteConfig) => {
    if (!selectedNode) return;
    const currentConfig = parseRouteConfig(selectedNode.value);
    setNodes((current) =>
      current.map((node) =>
        node.id === selectedNode.id
          ? { ...node, value: serializeRouteConfig({ ...currentConfig, ...updates }) }
          : node,
      ),
    );
  };

  const updateSwitchCase = (index: number, label: string) => {
    if (!selectedNode) return;
    const currentConfig = parseRouteConfig(selectedNode.value);
    const cases = currentConfig.cases?.length ? [...currentConfig.cases] : ["case 1", "case 2"];
    cases[index] = label;
    updateRouteConfig({ cases });
  };

  const addSwitchCase = () => {
    if (!selectedNode) return;
    const currentConfig = parseRouteConfig(selectedNode.value);
    const cases = currentConfig.cases?.length ? [...currentConfig.cases] : ["case 1", "case 2"];
    updateRouteConfig({ cases: [...cases, `case ${cases.length + 1}`] });
  };

  const removeSwitchCase = (index: number) => {
    if (!selectedNode) return;
    const currentConfig = parseRouteConfig(selectedNode.value);
    const cases = currentConfig.cases?.length ? [...currentConfig.cases] : ["case 1", "case 2"];
    if (cases.length <= 1) return;
    cases.splice(index, 1);
    updateRouteConfig({ cases });
  };

  const markNodeReady = (nodeId: string) => {
    setNodes((current) => current.map((node) => (node.id === nodeId ? { ...node, status: "ready" } : node)));
  };

  const deleteSelection = () => {
    if (selectedEdge) {
      setConnections((current) => current.filter((connection) => connection.id !== selectedEdge.id));
      setSelectedEdgeId("");
      return;
    }

    if (!selectedNode || nodes.length <= 1) return;
    setNodes((current) => current.filter((node) => node.id !== selectedNode.id));
    setConnections((current) =>
      current.filter((connection) => connection.from !== selectedNode.id && connection.to !== selectedNode.id),
    );
    setSelectedNodeId("");
  };

  const saveWorkflow = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, connections }));
  };

  const loadWorkflow = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved) as { nodes: WorkflowNode[]; connections: Connection[] };
    setNodes(parsed.nodes);
    setConnections(parsed.connections);
    setSelectedNodeId(parsed.nodes[0]?.id ?? "");
    setSelectedEdgeId("");
    setRunLogs([]);
  };

  const applyTemplate = (title: string) => {
    const template = workflowTemplates.find((item) => item.title === title);
    if (!template) return;
    setNodes(template.nodes.map((node) => ({ ...node })));
    setConnections(template.connections.map((connection) => ({ ...connection })));
    setSelectedNodeId(template.nodes[0]?.id ?? "");
    setSelectedEdgeId("");
    setRunLogs([]);
    setPan({ x: 0, y: 0 });
    setZoom(0.92);
  };

  const runWorkflow = async () => {
    setRunLogs([]);
    setNodes((current) => current.map((node) => ({ ...node, status: node.kind === "input" ? "ready" : "idle" })));

    const ordered = [...nodes].sort((a, b) => {
      const aIncoming = connections.filter((connection) => connection.to === a.id).length;
      const bIncoming = connections.filter((connection) => connection.to === b.id).length;
      return aIncoming - bIncoming;
    });

    const logs: RunLog[] = [];
    for (const node of ordered) {
      setNodes((current) => current.map((item) => (item.id === node.id ? { ...item, status: "running" } : item)));
      await new Promise((resolve) => setTimeout(resolve, 120));
      const inputNeedsPath = node.kind === "input" && ["file", "image", "video"].includes(node.output);
      const missingInputPath = inputNeedsPath && !node.value;
      const missingOutputPath = node.kind === "output" && !node.value;
      let status: Extract<NodeStatus, "success" | "error"> = missingInputPath || missingOutputPath ? "error" : "success";
      const functionConfig = parseFunctionConfig(node.value);
      const selectedFunction = workflowFunctions[node.title]?.find((item) => item.id === functionConfig.functionId);
      let message =
        node.kind === "input"
          ? inputNeedsPath
            ? node.value
              ? `Loaded ${node.output} input from ${node.value}`
              : `Choose a ${node.output} source before running.`
            : `Prepared ${node.output} input.`
          : node.kind === "output"
            ? node.value
              ? `Saved ${node.output} output to ${node.value}`
              : "Choose where the output should be saved."
            : node.title === "If / Else"
              ? `Evaluated condition and exposed true / false branch outputs.`
            : node.title === "Switch"
              ? `Matched switch value and exposed ${getOutputPorts(node).length} route outputs.`
            : node.title === "For Each"
              ? `Prepared item and done routes for loop execution.`
            : node.title === "Try / Catch"
              ? `Prepared success and error routes.`
            : node.title === "Merge"
              ? `Merged incoming branches into one output.`
            : node.kind === "logic"
                ? `Evaluated ${node.title.toLowerCase()} and passed ${node.output} forward.`
                : selectedFunction
                  ? `Executed ${selectedFunction.api} with ${selectedFunction.params.length} configured parameter${selectedFunction.params.length === 1 ? "" : "s"}.`
                  : `Select a function for ${node.title} before running.`;

      if (node.kind === "tool" && !selectedFunction) status = "error";

      if (node.kind === "output" && node.value && status === "success") {
        try {
          const artifact = [
            `DawnDesk workflow output`,
            `Node: ${node.title}`,
            `Output kind: ${node.output}`,
            `Saved at: ${new Date().toISOString()}`,
            "",
            "Execution log:",
            ...logs.map((log, index) => `${index + 1}. [${log.status}] ${log.title}: ${log.message}`),
          ].join("\n");
          await writeTextFile(node.value, artifact);
        } catch (error) {
          status = "error";
          message = error instanceof Error ? `Failed to save output: ${error.message}` : "Failed to save output.";
        }
      }
      logs.push({ nodeId: node.id, title: node.title, output: node.output, status, message });
      setRunLogs([...logs]);
      setNodes((current) => current.map((item) => (item.id === node.id ? { ...item, status } : item)));
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && rootRef.current?.requestFullscreen) {
      await rootRef.current.requestFullscreen();
      return;
    }
    if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
  };

  const renderNodeConfiguration = (node: WorkflowNode) => {
    if (node.kind === "input") {
      const pathBackedInput = ["file", "image", "video"].includes(node.output);
      return (
        <div className="space-y-3">
          <label className="block">
            <span className="dd-form-label">Input kind</span>
            <select
              value={node.output}
              onChange={(event) => updateNodeOutputKind(event.target.value as DataKind)}
              className="dd-select mt-2 w-full"
            >
              {configurableKinds.map((kind) => (
                <option key={kind} value={kind}>{kind}</option>
              ))}
            </select>
          </label>

          {pathBackedInput ? (
            <>
              <button onClick={chooseInputFile} className="dd-btn-secondary flex w-full items-center justify-center gap-2">
                <FileInput className="h-4 w-4" />
                Select {node.output === "file" ? "File" : node.output}
              </button>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">Current source</p>
                <p className="mt-2 break-all text-xs leading-relaxed text-white/58">{node.value || "No file selected yet."}</p>
              </div>
            </>
          ) : node.output === "boolean" ? (
            <label className="block">
              <span className="dd-form-label">Boolean value</span>
              <select value={node.value ?? "true"} onChange={(event) => updateNodeValue(event.target.value)} className="dd-select mt-2 w-full">
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </label>
          ) : (
            <label className="block">
              <span className="dd-form-label">Text payload</span>
              <textarea
                value={node.value ?? ""}
                onChange={(event) => updateNodeValue(event.target.value)}
                className="dd-input mt-2 min-h-32 w-full resize-none"
                placeholder="Type the text this workflow should start with..."
              />
            </label>
          )}
          <p className="text-xs leading-relaxed text-white/42">This single Input node can be retyped whenever the workflow needs a different source.</p>
        </div>
      );
    }

    if (node.kind === "output") {
      return (
        <div className="space-y-3">
          <label className="block">
            <span className="dd-form-label">Output kind</span>
            <select
              value={node.output}
              onChange={(event) => updateNodeOutputKind(event.target.value as DataKind)}
              className="dd-select mt-2 w-full"
            >
              {configurableKinds.map((kind) => (
                <option key={kind} value={kind}>{kind}</option>
              ))}
            </select>
          </label>
          <button onClick={chooseOutputPath} className="dd-btn-secondary flex w-full items-center justify-center gap-2">
            <Download className="h-4 w-4" />
            Choose Save Path
          </button>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">Target path</p>
            <p className="mt-2 break-all text-xs leading-relaxed text-white/58">{node.value || "No output path selected yet."}</p>
          </div>
          <p className="text-xs leading-relaxed text-white/42">When the workflow runs, this node writes a DawnDesk output artifact to the selected path.</p>
        </div>
      );
    }

    if (node.title === "If / Else") {
      const config = parseRouteConfig(node.value);
      return (
        <div className="space-y-4">
          <label className="block">
            <span className="dd-form-label">Condition</span>
            <textarea
              value={config.condition ?? ""}
              onChange={(event) => updateRouteConfig({ condition: event.target.value })}
              className="dd-input mt-2 min-h-24 w-full resize-none"
              placeholder="Example: file.size > 0, text contains approved, or status is true"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-green-400/25 bg-green-400/10 p-3">
              <p className="text-xs font-bold uppercase text-green-200">True output</p>
              <p className="mt-1 text-xs text-white/45">Use this port when the condition passes.</p>
            </div>
            <div className="rounded-lg border border-red-400/25 bg-red-400/10 p-3">
              <p className="text-xs font-bold uppercase text-red-200">False output</p>
              <p className="mt-1 text-xs text-white/45">Use this port when the condition fails.</p>
            </div>
          </div>
        </div>
      );
    }

    if (node.title === "For Each") {
      return (
        <div className="space-y-4">
          <label className="block">
            <span className="dd-form-label">Items source</span>
            <input
              value={parseRouteConfig(node.value).condition ?? ""}
              onChange={(event) => updateRouteConfig({ condition: event.target.value })}
              className="dd-input mt-2 w-full"
              placeholder="Example: $.items"
            />
          </label>
          <label className="block">
            <span className="dd-form-label">Batch size</span>
            <input
              type="number"
              value={parseRouteConfig(node.value).batchSize ?? ""}
              onChange={(event) => updateRouteConfig({ batchSize: event.target.value })}
              className="dd-input mt-2 w-full"
              placeholder="1"
            />
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-yellow-400/25 bg-yellow-400/10 p-3 text-yellow-100">Item route</div>
            <div className="rounded-lg border border-green-400/25 bg-green-400/10 p-3 text-green-100">Done route</div>
          </div>
        </div>
      );
    }

    if (node.title === "Switch") {
      const config = parseRouteConfig(node.value);
      const cases = config.cases?.length ? config.cases : ["case 1", "case 2"];
      return (
        <div className="space-y-4">
          <label className="block">
            <span className="dd-form-label">Value to match</span>
            <input
              value={config.condition ?? ""}
              onChange={(event) => updateRouteConfig({ condition: event.target.value })}
              className="dd-input mt-2 w-full"
              placeholder="Example: $.status"
            />
          </label>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="dd-form-label">Routes</span>
              <button type="button" onClick={addSwitchCase} className="dd-btn-secondary px-3 py-1.5 text-xs">
                Add route
              </button>
            </div>
            <div className="space-y-2">
              {cases.map((route, index) => (
                <div key={`${route}-${index}`} className="flex items-center gap-2">
                  <input
                    value={route}
                    onChange={(event) => updateSwitchCase(index, event.target.value)}
                    className="dd-input min-w-0 flex-1 py-2"
                    placeholder={`case ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeSwitchCase(index)}
                    className="dd-icon-btn shrink-0"
                    aria-label="Remove route"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 px-3 py-2 text-xs text-white/48">
                Default route is always available.
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (node.title === "Try / Catch") {
      return (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-green-400/25 bg-green-400/10 p-3 text-green-100">Success route</div>
          <div className="rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-red-100">Error route</div>
        </div>
      );
    }

    if (node.title === "Merge") {
      return (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3 text-xs leading-relaxed text-white/52">
          Connect multiple incoming branches to this node. It emits one merged output route.
        </div>
      );
    }

    if (workflowFunctions[node.title]) {
      const functions = workflowFunctions[node.title] ?? [];
      const config = parseFunctionConfig(node.value);
      const selectedFunction = functions.find((item) => item.id === config.functionId);
      return (
        <div className="space-y-4">
          <label className="block">
            <span className="dd-form-label">Function</span>
            <select
              value={config.functionId}
              onChange={(event) => updateNodeFunction(event.target.value)}
              className="dd-select mt-2 w-full"
            >
              <option value="" disabled>Select a function</option>
              {functions.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>

          {selectedFunction && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-yellow-300">{selectedFunction.api}</p>
              <p className="mt-2 text-xs leading-relaxed text-white/52">{selectedFunction.description}</p>
            </div>
          )}

          {selectedFunction?.params.length === 0 && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3 text-xs text-white/48">
              This function does not need additional input.
            </div>
          )}

          {selectedFunction?.params.map((param) => (
            <label key={param.key} className="block">
              <span className="dd-form-label">{param.label}</span>
              {param.type === "select" ? (
                <select
                  value={config.params[param.key] ?? param.options?.[0] ?? ""}
                  onChange={(event) => updateNodeFunctionParam(param.key, event.target.value)}
                  className="dd-select mt-2 w-full"
                >
                  {(param.options ?? []).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={param.type}
                  value={config.params[param.key] ?? ""}
                  onChange={(event) => updateNodeFunctionParam(param.key, event.target.value)}
                  className="dd-input mt-2 w-full"
                  placeholder={param.placeholder}
                />
              )}
            </label>
          ))}
        </div>
      );
    }

    return (
      <label className="block">
        <span className="dd-form-label">Value</span>
        <textarea
          value={node.value ?? ""}
          onChange={(event) => updateNodeValue(event.target.value)}
          className="dd-input mt-2 min-h-24 w-full resize-none"
          placeholder="Node configuration..."
        />
      </label>
    );
  };

  const workflowSurface = (
    <div
      ref={rootRef}
      data-workflow-root
      className={`${isFullscreen ? "fixed inset-0 z-[80] flex h-screen w-screen overflow-hidden" : "dd-page"} bg-neutral-950 text-white`}
    >
      <aside
        className="relative flex h-full shrink-0 flex-col border-r border-neutral-800 bg-neutral-950 transition-[width] duration-200"
        style={{ width: isPaletteCollapsed ? collapsedPaletteWidth : paletteWidth }}
      >
        {!isPaletteCollapsed && (
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setResizeState({ type: "palette", originX: event.clientX, startWidth: paletteWidth });
            }}
            className="absolute -right-1 top-0 z-30 h-full w-2 cursor-col-resize transition-colors hover:bg-yellow-400/25"
            aria-label="Resize node palette"
          />
        )}
        <div className="border-b border-neutral-800 p-4">
          <div className={`flex items-center ${isPaletteCollapsed ? "flex-col justify-center gap-2" : "gap-3"}`}>
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-neutral-800 bg-neutral-900 text-yellow-300">
              <Workflow className="h-5 w-5" />
            </div>
            {!isPaletteCollapsed && (
            <div>
              <h1 className="font-heading text-base font-bold text-white">Workflow</h1>
              <p className="text-xs text-white/45">Drag or click nodes</p>
            </div>
            )}
            <button
              type="button"
              onClick={() => setIsPaletteCollapsed((current) => !current)}
              className={`${isPaletteCollapsed ? "" : "ml-auto"} dd-icon-btn`}
              aria-label={isPaletteCollapsed ? "Expand node palette" : "Collapse node palette"}
              title={isPaletteCollapsed ? "Expand node palette" : "Collapse node palette"}
            >
              {isPaletteCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
          </div>
          {!isPaletteCollapsed && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
            <Search className="h-4 w-4 text-white/35" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search nodes..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
          </div>
          )}
        </div>

        <div className={`custom-scrollbar flex-1 overflow-y-auto ${isPaletteCollapsed ? "p-2" : "p-3"}`}>
          {(["input", "tool", "logic", "output"] as NodeKind[]).map((group) => (
            <section key={group} className="mb-5">
              {!isPaletteCollapsed && (
                <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">{group}</p>
              )}
              <div className="space-y-2">
                {groupedTemplates[group].map((template) => (
                  <button
                    key={template.title}
                    type="button"
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("application/dawndesk-node", template.title)}
                    onClick={() => addNode(template)}
                    className={`flex w-full items-center rounded-lg border border-neutral-800 bg-neutral-900/55 text-left transition-colors hover:border-yellow-400/45 hover:bg-neutral-900 ${
                      isPaletteCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
                    }`}
                    title={template.title}
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-neutral-950 text-yellow-300">
                      {templateIcons[template.title] ?? kindIcons[template.kind]}
                    </span>
                    {!isPaletteCollapsed && (
                    <>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-white">{template.title}</span>
                      <span className="block text-[11px] text-white/40">
                        {template.input.length ? template.input.join("/") : "start"} to {template.output}
                      </span>
                    </span>
                    <Plus className="ml-auto h-4 w-4 text-white/30" />
                    </>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-300">Canvas</p>
              <p className="truncate text-xs text-white/40">Drag nodes, drag output ports into compatible input ports.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              onChange={(event) => applyTemplate(event.target.value)}
              className="h-9 rounded-lg border border-neutral-800 bg-neutral-900 px-3 text-xs font-bold text-white/70 outline-none"
              defaultValue=""
            >
              <option value="" disabled>Templates</option>
              {workflowTemplates.map((item) => (
                <option key={item.title} value={item.title}>{item.title}</option>
              ))}
            </select>
            <button onClick={saveWorkflow} className="dd-icon-btn" aria-label="Save workflow"><Save className="h-4 w-4" /></button>
            <button onClick={loadWorkflow} className="dd-icon-btn" aria-label="Load workflow"><FolderOpen className="h-4 w-4" /></button>
            <button onClick={() => setZoom((current) => Math.max(0.55, current - 0.1))} className="dd-icon-btn" aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></button>
            <span className="w-12 text-center text-xs font-bold text-white/45">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((current) => Math.min(1.35, current + 0.1))} className="dd-icon-btn" aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></button>
            <button onClick={runWorkflow} className="dd-btn-primary py-2"><Play className="h-4 w-4" />Run</button>
            <button onClick={toggleFullscreen} className="dd-icon-btn" aria-label={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <div
          className="grid min-h-0 flex-1"
          style={{ gridTemplateColumns: hasInspectorSelection ? `minmax(0, 1fr) ${inspectorWidth}px` : "minmax(0, 1fr)" }}
        >
          <section
            ref={canvasRef}
            className="relative overflow-hidden bg-neutral-950"
            onWheel={onWheel}
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onPointerCancel={onCanvasPointerUp}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const title = event.dataTransfer.getData("application/dawndesk-node");
              const template = templates.find((item) => item.title === title);
              if (template) addNode(template, screenToCanvas(event.clientX, event.clientY));
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
                backgroundPosition: `${pan.x}px ${pan.y}px`,
                backgroundSize: `${28 * zoom}px ${28 * zoom}px`,
              }}
            />

            <div className="absolute left-4 top-4 z-20 rounded-lg border border-neutral-800 bg-neutral-950/85 px-3 py-2 text-xs text-white/50 backdrop-blur">
              {pendingConnection ? "Drop on a highlighted input port" : "Hold empty canvas and drag to pan"}
            </div>

            <svg className="absolute inset-0 z-10 h-full w-full">
              {connections.map((connection) => {
                const from = nodes.find((node) => node.id === connection.from);
                const to = nodes.find((node) => node.id === connection.to);
                if (!from || !to) return null;
                const start = canvasToScreen(outputPoint(from, connection.fromPort));
                const end = canvasToScreen(inputPoint(to));
                const isSelected = selectedEdgeId === connection.id;
                return (
                  <path
                    key={connection.id}
                    d={edgePath(start, end)}
                    fill="none"
                    stroke={isSelected ? "rgba(250,204,21,1)" : "rgba(250,204,21,0.62)"}
                    strokeWidth={isSelected ? 4 : 2}
                    className="cursor-pointer"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      setSelectedEdgeId(connection.id);
                      setSelectedNodeId("");
                    }}
                    style={{ pointerEvents: "stroke" }}
                  />
                );
              })}
              {pendingConnection && (() => {
                const source = nodes.find((node) => node.id === pendingConnection.from);
                if (!source) return null;
                return (
                  <path
                    d={edgePath(canvasToScreen(outputPoint(source, pendingConnection.fromPort)), canvasToScreen(pendingConnection.pointer))}
                    fill="none"
                    stroke="rgba(250,204,21,0.95)"
                    strokeDasharray="8 8"
                    strokeWidth="2"
                  />
                );
              })()}
            </svg>

            {nodes.map((node) => {
              const screen = canvasToScreen(node.position);
              const isSelected = selectedNode?.id === node.id;
              const sourceNode = pendingConnection ? nodes.find((item) => item.id === pendingConnection.from) : null;
              const canReceive = Boolean(sourceNode && sourceNode.id !== node.id && acceptsKind(node, sourceNode.output));
              const outputPorts = getOutputPorts(node);

              return (
                <article
                  key={node.id}
                  style={{
                    left: 0,
                    top: 0,
                    width: nodeWidth,
                    height: nodeHeight,
                    transform: `translate3d(${screen.x}px, ${screen.y}px, 0) scale(${zoom})`,
                    transformOrigin: "top left",
                  }}
                  onPointerDown={(event) => onNodeDragStart(event, node)}
                  className={`absolute z-20 cursor-grab rounded-xl border bg-neutral-900 shadow-xl shadow-black/25 transition-colors active:cursor-grabbing ${
                    isSelected ? "border-yellow-400/80" : "border-neutral-800 hover:border-white/20"
                  }`}
                >
                  {node.input.length > 0 && (
                    <button
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onPointerUp={(event) => finishConnection(event, node)}
                      className={`absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-neutral-950 ${
                        canReceive ? "bg-green-300 shadow-lg shadow-green-300/30" : "bg-neutral-600"
                      }`}
                      aria-label={`Connect into ${node.title}`}
                    />
                  )}

                  {outputPorts.map((port) => (
                    <button
                      key={port.id}
                      type="button"
                      onPointerDown={(event) => startConnection(event, node, port.id)}
                      className="absolute -right-2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-neutral-950 bg-yellow-400 shadow-lg shadow-yellow-400/20"
                      style={{ top: port.offsetY }}
                      aria-label={`Connect ${port.label} from ${node.title}`}
                      title={`${node.title} ${port.label}`}
                    >
                      {node.title === "If / Else" && (
                        <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 rounded border border-neutral-800 bg-neutral-950 px-1.5 py-0.5 text-[9px] font-bold uppercase text-yellow-200">
                          {port.label}
                        </span>
                      )}
                    </button>
                  ))}

                  <div className="flex h-full flex-col p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="grid h-5 w-5 place-items-center">
                        {node.status === "success" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-300" />
                        ) : node.status === "error" ? (
                          <XCircle className="h-5 w-5 text-red-300" />
                        ) : (
                          <span className={`h-2.5 w-2.5 rounded-full ${statusStyles[node.status ?? "idle"]}`} />
                        )}
                      </span>
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-950 text-yellow-300">
                        {templateIcons[node.title] ?? kindIcons[node.kind]}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-heading text-sm font-bold text-white">{node.title}</h3>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-white/32">{node.kind}</p>
                      </div>
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-white/45">{node.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {node.input.length > 0 && (
                        <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white/38">
                          in {node.input.join("/")}
                        </span>
                      )}
                      {outputPorts.map((port) => (
                        <span key={port.id} className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${kindStyles[port.kind]}`}>
                          {port.label} {port.kind}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {hasInspectorSelection && (
          <aside className="custom-scrollbar relative min-h-0 overflow-y-auto border-l border-neutral-800 bg-neutral-950">
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setResizeState({ type: "inspector", originX: event.clientX, startWidth: inspectorWidth });
              }}
              className="absolute -left-1 top-0 z-30 h-full w-2 cursor-col-resize transition-colors hover:bg-yellow-400/25"
              aria-label="Resize inspector"
            />
            <div className="border-b border-neutral-800 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                    {selectedEdge ? "Connection" : "Inspector"}
                  </p>
                  <h2 className="mt-1 font-heading text-lg font-bold text-white">
                    {selectedEdge ? "Selected Edge" : selectedNode?.title}
                  </h2>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={deleteSelection} className="dd-icon-btn" aria-label="Delete selection">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedNodeId("");
                      setSelectedEdgeId("");
                    }}
                    className="dd-icon-btn"
                    aria-label="Close inspector"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {selectedEdge ? (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-white/52">
                    This connection passes data from one node to another. Delete it if the workflow route should change.
                  </p>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3 text-xs text-white/52">
                    <p>
                      <span className="text-white/35">From:</span>{" "}
                      {nodes.find((node) => node.id === selectedEdge.from)?.title ?? selectedEdge.from}
                    </p>
                    <p className="mt-1">
                      <span className="text-white/35">Output:</span> {(selectedEdge.fromPort ?? "main").toUpperCase()}
                    </p>
                    <p className="mt-1">
                      <span className="text-white/35">To:</span>{" "}
                      {nodes.find((node) => node.id === selectedEdge.to)?.title ?? selectedEdge.to}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-white/52">{selectedNode?.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedNode?.input.map((kind) => (
                      <span key={kind} className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${kindStyles[kind]}`}>
                        in {kind}
                      </span>
                    ))}
                    {selectedNode && (
                      getOutputPorts(selectedNode).map((port) => (
                        <span key={port.id} className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${kindStyles[port.kind]}`}>
                          {port.label} {port.kind}
                        </span>
                      ))
                    )}
                  </div>

                  {selectedNode && (
                  <div className="mt-5">
                    {renderNodeConfiguration(selectedNode)}
                  </div>
                  )}
                </>
              )}
            </div>

            <div className="p-4">
            </div>
          </aside>
          )}
        </div>

        <section
          className="relative flex shrink-0 flex-col border-t border-neutral-800 bg-neutral-950"
          style={{ height: terminalHeight }}
        >
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setResizeState({ type: "terminal", originY: event.clientY, startHeight: terminalHeight });
            }}
            className="absolute -top-1 left-0 z-30 h-2 w-full cursor-row-resize transition-colors hover:bg-yellow-400/25"
            aria-label="Resize terminal"
          />
          <div className="flex h-10 items-center justify-between border-b border-neutral-800 px-4">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-yellow-300" />
              <h3 className="font-heading text-sm font-bold text-white">Terminal</h3>
              <span className="rounded-full border border-neutral-800 px-2 py-0.5 text-[10px] font-bold uppercase text-white/40">
                {runLogs.length} outputs
              </span>
            </div>
            <button onClick={() => setRunLogs([])} className="dd-icon-btn" aria-label="Clear terminal">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-6">
            {runLogs.length === 0 ? (
              <div className="text-white/38">
                <span className="text-yellow-300">dawndesk.workflow</span> Run the workflow to preview execution output.
              </div>
            ) : (
              <div className="space-y-1">
                {runLogs.map((log, index) => (
                  <div
                    key={`${log.nodeId}-${log.message}-${index}`}
                    className={`grid grid-cols-[88px_160px_1fr] gap-3 rounded px-2 ${
                      log.status === "error" ? "bg-red-400/10 text-red-200" : "bg-green-400/10 text-green-200"
                    }`}
                  >
                    <span className="text-white/32">[{String(index + 1).padStart(2, "0")}]</span>
                    <span className="truncate">{log.title}</span>
                    <span className="min-w-0 truncate">
                      <span
                        className={`mr-2 rounded border px-1.5 py-0.5 text-[10px] uppercase ${
                          log.status === "error" ? "border-red-400/30 text-red-100" : "border-green-400/30 text-green-100"
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="mr-2 rounded border border-neutral-800 px-1.5 py-0.5 text-[10px] uppercase text-white/35">{log.output}</span>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );

  return (
    <WelcomeScreen
      appKey="workflow"
      title="Workflow Builder"
      description="Create local typed workflows that connect DawnDesk tools without AI."
    >
      {workflowSurface}
    </WelcomeScreen>
  );
}
