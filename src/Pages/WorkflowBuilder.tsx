import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BrainCircuit,
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  Code2,
  Database,
  Download,
  FileJson,
  FileInput,
  FileOutput,
  Filter as FilterIcon,
  FolderOpen,
  GitBranch,
  GitMerge,
  Image as ImageIcon,
  KeyRound,
  ListRestart,
  Maximize2,
  Minimize2,
  Play,
  Plus,
  Save,
  Search,
  Shell,
  Shuffle,
  SortAsc,
  Split,
  Table2,
  Terminal,
  Variable,
  Video,
  Webhook,
  Workflow,
  X,
  XCircle,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
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
  breakpoint?: boolean;
  pinned?: boolean;
  accentColor?: string;
  timeoutMs?: number;
  retryCount?: number;
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
  | { type: "terminal"; originY: number; startHeight: number };

type PendingConnection = {
  from: string;
  fromPort: string;
  pointer: Point;
};

type PinchState = {
  initialDistance: number;
  initialZoom: number;
  center: Point;
  canvasPoint: Point;
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
  type: "text" | "number" | "password" | "select";
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
  paramSources?: Record<string, string>;
};

type RouteConfig = {
  source?: string;
  condition?: string;
  field?: string;
  operator?: string;
  value?: string;
  batchSize?: string;
  direction?: string;
  cases?: string[];
};

type WorkflowMetadata = {
  name: string;
  description: string;
  tags: string;
};

type WorkflowDocument = {
  metadata: WorkflowMetadata;
  nodes: WorkflowNode[];
  connections: Connection[];
};

type NodeSettings = {
  alwaysOutputData: boolean;
  executeOnce: boolean;
  retryOnFail: boolean;
  displayNote: boolean;
  onError: string;
  notes: string;
};

const nodeWidth = 232;
const nodeHeight = 124;
const collapsedPaletteWidth = 72;
const STORAGE_KEY = "dawndesk_workflow_graph";
const defaultMetadata: WorkflowMetadata = {
  name: "Untitled workflow",
  description: "",
  tags: "",
};
const defaultNodeSettings: NodeSettings = {
  alwaysOutputData: false,
  executeOnce: false,
  retryOnFail: false,
  displayNote: false,
  onError: "Stop Workflow",
  notes: "",
};
const configurableKinds: DataKind[] = ["text", "file", "image", "video", "boolean", "any"];
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
        { key: "auth_type", label: "Auth type", type: "select", options: ["none", "bearer token", "api key header", "basic auth", "custom from upstream"] },
        { key: "api_key", label: "API key / token", type: "password", placeholder: "Secret value..." },
        { key: "content_type", label: "Content type", type: "select", options: ["application/json", "multipart/form-data", "application/x-www-form-urlencoded", "text/plain"] },
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
  ChatGPT: [
    {
      id: "chatgpt_response",
      label: "Generate chat response",
      api: "ai.openai.chatgpt",
      description: "Send text to a ChatGPT-compatible model and pass the text response forward.",
      params: [
        { key: "api_key", label: "OpenAI API key", type: "password", placeholder: "sk-..." },
        { key: "model", label: "Model", type: "select", options: ["default chat model", "fast chat model", "reasoning model", "vision-capable model", "custom from upstream"] },
        { key: "prompt", label: "Prompt", type: "text", placeholder: "Ask or transform something..." },
        { key: "system_style", label: "System style", type: "select", options: ["helpful", "concise", "technical", "creative", "strict JSON"] },
        { key: "temperature", label: "Temperature", type: "select", options: ["0", "0.2", "0.7", "1"] },
        { key: "max_tokens", label: "Max output tokens", type: "select", options: ["512", "1000", "2000", "4000"] },
      ],
    },
  ],
  Gemini: [
    {
      id: "gemini_response",
      label: "Generate Gemini response",
      api: "ai.google.gemini",
      description: "Send text to a Gemini model and pass the text response forward.",
      params: [
        { key: "api_key", label: "Gemini API key", type: "password", placeholder: "API key..." },
        { key: "model", label: "Model", type: "select", options: ["default Gemini model", "fast Gemini model", "pro Gemini model", "vision-capable Gemini model", "custom from upstream"] },
        { key: "prompt", label: "Prompt", type: "text", placeholder: "Ask or transform something..." },
        { key: "system_style", label: "System style", type: "select", options: ["helpful", "concise", "technical", "creative", "strict JSON"] },
        { key: "temperature", label: "Temperature", type: "select", options: ["0", "0.2", "0.7", "1"] },
      ],
    },
  ],
  Anthropic: [
    {
      id: "anthropic_response",
      label: "Generate Claude response",
      api: "ai.anthropic.claude",
      description: "Send text to an Anthropic Claude model and pass the text response forward.",
      params: [
        { key: "api_key", label: "Anthropic API key", type: "password", placeholder: "API key..." },
        { key: "model", label: "Model", type: "select", options: ["default Claude model", "fast Claude model", "reasoning Claude model", "large-context Claude model", "custom from upstream"] },
        { key: "prompt", label: "Prompt", type: "text", placeholder: "Ask or transform something..." },
        { key: "system_style", label: "System style", type: "select", options: ["helpful", "concise", "technical", "creative", "strict JSON"] },
        { key: "max_tokens", label: "Max output tokens", type: "select", options: ["512", "1000", "2000", "4000"] },
      ],
    },
  ],
  "OpenAI Image": [
    {
      id: "openai_image_generate",
      label: "Generate image",
      api: "ai.openai.image",
      description: "Generate an image from a text prompt using an OpenAI image model.",
      params: [
        { key: "api_key", label: "OpenAI API key", type: "password", placeholder: "sk-..." },
        { key: "model", label: "Image model", type: "select", options: ["default image model", "fast image model", "high quality image model", "custom from upstream"] },
        { key: "prompt", label: "Prompt", type: "text", placeholder: "Describe the image to create..." },
        { key: "size", label: "Size", type: "select", options: ["1024x1024", "1024x1536", "1536x1024", "auto"] },
        { key: "quality", label: "Quality", type: "select", options: ["auto", "standard", "high"] },
        { key: "count", label: "Image count", type: "select", options: ["1", "2", "4"] },
      ],
    },
  ],
  "Gemini Image": [
    {
      id: "gemini_image_generate",
      label: "Generate image",
      api: "ai.google.gemini.image",
      description: "Generate an image from a text prompt using a Gemini image model.",
      params: [
        { key: "api_key", label: "Gemini API key", type: "password", placeholder: "API key..." },
        { key: "model", label: "Image model", type: "select", options: ["default Gemini image model", "fast Gemini image model", "high quality Gemini image model", "custom from upstream"] },
        { key: "prompt", label: "Prompt", type: "text", placeholder: "Describe the image to create..." },
        { key: "aspect_ratio", label: "Aspect ratio", type: "select", options: ["1:1", "16:9", "9:16", "4:3", "3:4"] },
        { key: "count", label: "Image count", type: "select", options: ["1", "2", "4"] },
      ],
    },
  ],
  "Stable Diffusion": [
    {
      id: "stable_diffusion_generate",
      label: "Generate image",
      api: "ai.local.stable_diffusion",
      description: "Generate an image from a text prompt using a local Stable Diffusion-compatible endpoint.",
      params: [
        { key: "auth_token", label: "Auth token", type: "password", placeholder: "Optional token..." },
        { key: "endpoint", label: "Endpoint URL", type: "select", options: ["http://localhost:7860", "http://127.0.0.1:7860", "custom from upstream"] },
        { key: "model", label: "Checkpoint/model", type: "select", options: ["default checkpoint", "photoreal checkpoint", "illustration checkpoint", "custom from upstream"] },
        { key: "prompt", label: "Prompt", type: "text", placeholder: "Describe the image to create..." },
        { key: "negative_prompt", label: "Negative prompt", type: "text", placeholder: "Things to avoid..." },
        { key: "steps", label: "Steps", type: "select", options: ["20", "30", "40", "60"] },
        { key: "seed", label: "Seed", type: "number", placeholder: "-1" },
      ],
    },
  ],
};

function defaultFunctionValue(functionId: string) {
  return JSON.stringify({ functionId, params: {} });
}

function simpleWorkflowFunction(id: string, label: string, api: string, description: string): WorkflowFunction {
  return { id, label, api, description, params: [] };
}

Object.assign(workflowFunctions, {
  AI: [
    simpleWorkflowFunction("ai_tools", "Choose AI capability", "workflow.ai", "Build agents, summarize or search documents, and route AI output forward."),
  ],
  "Action in an app": [
    simpleWorkflowFunction("app_action", "Run app action", "workflow.app_action", "Send work to an app or service such as Google Sheets, Telegram, Notion, or Airtable."),
  ],
  Core: [
    simpleWorkflowFunction("core_action", "Run core action", "workflow.core", "Run code, make HTTP requests, set webhooks, or perform core workflow work."),
  ],
  "Human review": [
    simpleWorkflowFunction("human_review", "Request approval", "workflow.human_review", "Pause for human approval before continuing an automated workflow."),
  ],
  "Basic LLM Chain": [
    simpleWorkflowFunction("basic_llm_chain", "Prompt language model", "ai.chain.llm", "Prompt a large language model and pass the response forward."),
  ],
  "Information Extractor": [
    simpleWorkflowFunction("information_extractor", "Extract information", "ai.extract.structured", "Extract structured fields from unstructured text."),
  ],
  "Question and Answer Chain": [
    simpleWorkflowFunction("qa_chain", "Answer from retrieved context", "ai.chain.qa", "Answer questions using retrieved documents or upstream context."),
  ],
  "Sentiment Analysis": [
    simpleWorkflowFunction("sentiment_analysis", "Analyze sentiment", "ai.analysis.sentiment", "Detect sentiment in incoming text."),
  ],
  "Summarization Chain": [
    simpleWorkflowFunction("summarization_chain", "Summarize text", "ai.chain.summarize", "Condense incoming text into a concise summary."),
  ],
  "Text Classifier": [
    simpleWorkflowFunction("text_classifier", "Classify text", "ai.classify.text", "Sort incoming text into configured categories."),
  ],
  Evaluation: [
    simpleWorkflowFunction("ai_evaluation", "Evaluate output", "ai.evaluation", "Score or inspect AI output before continuing."),
  ],
});

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
    title: "Trigger manually",
    description: "Runs the flow when you click Run. Good for getting started quickly.",
    kind: "input",
    input: [],
    output: "any",
    value: "Manual trigger",
  },
  {
    title: "On app event",
    description: "Runs when something happens in an app like Telegram, Notion, or Airtable.",
    kind: "input",
    input: [],
    output: "any",
    value: "App event trigger",
  },
  {
    title: "On a schedule",
    description: "Runs every day, hour, or custom interval.",
    kind: "input",
    input: [],
    output: "any",
    value: "Every day",
  },
  {
    title: "On webhook call",
    description: "Runs when an HTTP request is received.",
    kind: "input",
    input: [],
    output: "text",
    value: "POST /workflow/webhook",
  },
  {
    title: "On form submission",
    description: "Generates a workflow form and passes submitted responses forward.",
    kind: "input",
    input: [],
    output: "text",
    value: "Form response",
  },
  {
    title: "When executed by another workflow",
    description: "Runs when called by another workflow.",
    kind: "input",
    input: [],
    output: "any",
    value: "Workflow call",
  },
  {
    title: "On chat message",
    description: "Runs when a user sends a chat message. Useful for AI workflows.",
    kind: "input",
    input: [],
    output: "text",
    value: "Incoming chat message",
  },
  {
    title: "When running evaluation",
    description: "Runs a dataset through the workflow to test performance.",
    kind: "input",
    input: [],
    output: "any",
    value: "Evaluation dataset",
  },
  {
    title: "Other ways...",
    description: "Runs on workflow errors, file changes, or other advanced events.",
    kind: "input",
    input: [],
    output: "any",
    value: "Advanced trigger",
  },
  {
    title: "Add another trigger",
    description: "Adds another workflow trigger. Workflows can have multiple triggers.",
    kind: "input",
    input: [],
    output: "any",
    value: "Additional trigger",
  },
  {
    title: "AI",
    description: "Build autonomous agents, summarize, or search documents.",
    kind: "tool",
    input: ["text", "any"],
    output: "text",
    value: defaultFunctionValue("ai_tools"),
  },
  {
    title: "Action in an app",
    description: "Do something in an app or service like Google Sheets, Telegram, or Notion.",
    kind: "tool",
    input: ["text", "any"],
    output: "any",
    value: defaultFunctionValue("app_action"),
  },
  {
    title: "Data transformation",
    description: "Manipulate, filter, or convert data.",
    kind: "logic",
    input: ["any"],
    output: "any",
  },
  {
    title: "Flow",
    description: "Branch, merge, or loop the flow.",
    kind: "logic",
    input: ["any"],
    output: "any",
  },
  {
    title: "Core",
    description: "Run code, make HTTP requests, set webhooks, and more.",
    kind: "tool",
    input: ["text", "any"],
    output: "any",
    value: defaultFunctionValue("core_action"),
  },
  {
    title: "Human review",
    description: "Request approval before making tool calls.",
    kind: "tool",
    input: ["any"],
    output: "any",
    value: defaultFunctionValue("human_review"),
  },
  {
    title: "Basic LLM Chain",
    description: "A simple chain to prompt a large language model.",
    kind: "tool",
    input: ["text", "any"],
    output: "text",
    value: defaultFunctionValue("basic_llm_chain"),
  },
  {
    title: "Information Extractor",
    description: "Extract information from text in a structured format.",
    kind: "tool",
    input: ["text", "any"],
    output: "text",
    value: defaultFunctionValue("information_extractor"),
  },
  {
    title: "Question and Answer Chain",
    description: "Answer questions about retrieved documents.",
    kind: "tool",
    input: ["text", "file", "any"],
    output: "text",
    value: defaultFunctionValue("qa_chain"),
  },
  {
    title: "Sentiment Analysis",
    description: "Analyze the sentiment of your text.",
    kind: "tool",
    input: ["text", "any"],
    output: "text",
    value: defaultFunctionValue("sentiment_analysis"),
  },
  {
    title: "Summarization Chain",
    description: "Transforms text into a concise summary.",
    kind: "tool",
    input: ["text", "any"],
    output: "text",
    value: defaultFunctionValue("summarization_chain"),
  },
  {
    title: "Text Classifier",
    description: "Classify text into distinct categories.",
    kind: "tool",
    input: ["text", "any"],
    output: "text",
    value: defaultFunctionValue("text_classifier"),
  },
  {
    title: "Evaluation",
    description: "Evaluate AI output or workflow performance.",
    kind: "tool",
    input: ["text", "any"],
    output: "text",
    value: defaultFunctionValue("ai_evaluation"),
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
    title: "Filter",
    description: "Drop items that do not match a condition.",
    kind: "logic",
    input: ["any"],
    output: "any",
  },
  {
    title: "While Loop",
    description: "Repeat downstream work while a condition remains true.",
    kind: "logic",
    input: ["any"],
    output: "any",
  },
  {
    title: "Random Router",
    description: "Send execution to one of multiple branches randomly.",
    kind: "logic",
    input: ["any"],
    output: "any",
    value: JSON.stringify({ cases: ["A", "B"] }),
  },
  {
    title: "Sort",
    description: "Sort an array by field and direction.",
    kind: "logic",
    input: ["any"],
    output: "any",
  },
  {
    title: "Deduplicate",
    description: "Remove duplicate items from an array by key.",
    kind: "logic",
    input: ["any"],
    output: "any",
  },
  {
    title: "ChatGPT",
    description: "Generate text with a ChatGPT-compatible OpenAI model.",
    kind: "tool",
    input: ["text", "any"],
    output: "text",
  },
  {
    title: "Gemini",
    description: "Generate text with a Google Gemini model.",
    kind: "tool",
    input: ["text", "any"],
    output: "text",
  },
  {
    title: "Anthropic",
    description: "Generate text with an Anthropic Claude model.",
    kind: "tool",
    input: ["text", "any"],
    output: "text",
  },
  {
    title: "OpenAI Image",
    description: "Generate image output from a prompt with an OpenAI image model.",
    kind: "tool",
    input: ["text", "any"],
    output: "image",
  },
  {
    title: "Gemini Image",
    description: "Generate image output from a prompt with a Gemini image model.",
    kind: "tool",
    input: ["text", "any"],
    output: "image",
  },
  {
    title: "Stable Diffusion",
    description: "Generate image output through a local Stable Diffusion-compatible endpoint.",
    kind: "tool",
    input: ["text", "any"],
    output: "image",
  },
  {
    title: "Variable Set",
    description: "Store a workflow-scoped variable.",
    kind: "tool",
    input: ["any"],
    output: "any",
  },
  {
    title: "Variable Get",
    description: "Read a workflow-scoped variable.",
    kind: "tool",
    input: ["any"],
    output: "any",
  },
  {
    title: "Delay",
    description: "Pause workflow execution before continuing.",
    kind: "tool",
    input: ["any"],
    output: "any",
  },
  {
    title: "Notification",
    description: "Configure a desktop notification step.",
    kind: "tool",
    input: ["any"],
    output: "any",
  },
  {
    title: "Shell Command",
    description: "Configure a shell command step and capture stdout.",
    kind: "tool",
    input: ["text", "any"],
    output: "text",
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

function LogoFrame({ children, tone = "#facc15" }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white text-neutral-950" style={{ color: tone }}>
      {children}
    </span>
  );
}

function IconFrame({ children, tone = "#facc15" }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-neutral-950/95 shadow-inner shadow-white/5"
      style={{ color: tone }}
    >
      {children}
    </span>
  );
}

function OpenAILogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.911 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.182a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.998-2.9 6.056 6.056 0 0 0-.748-7.073ZM13.26 22.43a4.476 4.476 0 0 1-2.876-1.041l.142-.08 4.778-2.758a.795.795 0 0 0 .393-.681v-6.737l2.02 1.169a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.495 4.493Zm-9.661-4.125a4.471 4.471 0 0 1-.535-3.014l.142.085 4.783 2.758a.771.771 0 0 0 .781 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.499 4.499 0 0 1-6.141-1.646ZM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.814 3.354-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896Zm16.598 3.855-5.843-3.373 2.025-1.164a.076.076 0 0 1 .071 0L20.02 10a4.505 4.505 0 0 1-.676 8.104v-5.678a.79.79 0 0 0-.406-.675Zm2.01-3.023-.142-.085-4.773-2.758a.775.775 0 0 0-.785 0L9.409 9.254V6.922a.08.08 0 0 1 .033-.061l4.83-2.791a4.5 4.5 0 0 1 6.675 4.659ZM8.306 12.863l-2.02-1.164a.08.08 0 0 1-.038-.066V6.056a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681l-.004 6.741Zm1.098-2.346L12 9.02l2.596 1.497v2.995L12 15.009l-2.596-1.497v-2.995Z"
      />
    </svg>
  );
}

function GeminiLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M24 4c2.7 10.7 8.6 16.6 20 20-11.4 3.4-17.3 9.3-20 20-2.7-10.7-8.6-16.6-20-20C15.4 20.6 21.3 14.7 24 4Z"
      />
      <path fill="white" fillOpacity="0.8" d="M31 5c1.1 4.2 3.4 6.5 8 8-4.6 1.5-6.9 3.8-8 8-1.1-4.2-3.4-6.5-8-8 4.6-1.5 6.9-3.8 8-8Z" />
    </svg>
  );
}

function AnthropicLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="currentColor" d="M19.1 8h7.4L39 40h-7.3l-2.5-6.9H16.3L13.8 40H7L19.1 8Zm8.1 19.3L22.8 15l-4.5 12.3h8.9Z" />
      <path fill="currentColor" d="M31.8 8h6.6L41 40h-6.2L31.8 8Z" opacity="0.45" />
    </svg>
  );
}

function StableDiffusionLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <defs>
        <linearGradient id="sd-node-logo" x1="8" x2="40" y1="8" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path fill="url(#sd-node-logo)" d="M24 4c9.8 0 18 7.8 18 17.4 0 12.8-12.7 20.3-29.3 22.6 4.2-4.3 5.7-7.4 5.7-10.2C11.2 31.6 6 25.7 6 18.8 6 10.6 13.7 4 24 4Z" />
      <path fill="white" fillOpacity="0.82" d="M29.4 14.2c-2.6-1.7-7.2-1.7-9.9.1-2.8 1.9-2.7 5 .2 6.8 1.4.9 3.2 1.3 5.1 1.7 2.2.4 4.5.9 5.5 2.1 1.2 1.4.2 3.3-2 4.2-2.6 1.1-6.2.6-8.1-1.1l-3.1 3.4c3.4 3 9.8 3.7 14.1 1.6 4.6-2.2 5.2-7.2 1.4-10.1-1.8-1.4-4.2-1.9-6.5-2.4-2-.4-4-.8-4.9-1.7-.8-.8-.3-1.8.9-2.3 1.6-.8 4.1-.6 5.6.4l1.7-2.7Z" />
    </svg>
  );
}

const templateIcons: Record<string, React.ReactNode> = {
  Input: <IconFrame tone="#60a5fa"><FileInput className="h-4 w-4" /></IconFrame>,
  "Trigger manually": <IconFrame tone="#facc15"><Play className="h-4 w-4" /></IconFrame>,
  "On app event": <IconFrame tone="#38bdf8"><Bell className="h-4 w-4" /></IconFrame>,
  "On a schedule": <IconFrame tone="#a78bfa"><Clock3 className="h-4 w-4" /></IconFrame>,
  "On webhook call": <IconFrame tone="#34d399"><Webhook className="h-4 w-4" /></IconFrame>,
  "On form submission": <IconFrame tone="#60a5fa"><FileInput className="h-4 w-4" /></IconFrame>,
  "When executed by another workflow": <IconFrame tone="#facc15"><Workflow className="h-4 w-4" /></IconFrame>,
  "On chat message": <IconFrame tone="#f472b6"><Terminal className="h-4 w-4" /></IconFrame>,
  "When running evaluation": <IconFrame tone="#22c55e"><CheckCircle2 className="h-4 w-4" /></IconFrame>,
  "Other ways...": <IconFrame tone="#94a3b8"><FolderOpen className="h-4 w-4" /></IconFrame>,
  "Add another trigger": <IconFrame tone="#facc15"><Plus className="h-4 w-4" /></IconFrame>,
  AI: <IconFrame tone="#facc15"><BrainCircuit className="h-4 w-4" /></IconFrame>,
  "Action in an app": <IconFrame tone="#38bdf8"><Workflow className="h-4 w-4" /></IconFrame>,
  "Data transformation": <IconFrame tone="#a78bfa"><Table2 className="h-4 w-4" /></IconFrame>,
  Flow: <IconFrame tone="#22c55e"><GitBranch className="h-4 w-4" /></IconFrame>,
  Core: <IconFrame tone="#facc15"><Code2 className="h-4 w-4" /></IconFrame>,
  "Human review": <IconFrame tone="#34d399"><CheckCircle2 className="h-4 w-4" /></IconFrame>,
  "Basic LLM Chain": <IconFrame tone="#facc15"><BrainCircuit className="h-4 w-4" /></IconFrame>,
  "Information Extractor": <IconFrame tone="#38bdf8"><Search className="h-4 w-4" /></IconFrame>,
  "Question and Answer Chain": <IconFrame tone="#60a5fa"><Workflow className="h-4 w-4" /></IconFrame>,
  "Sentiment Analysis": <IconFrame tone="#f472b6"><CheckCircle2 className="h-4 w-4" /></IconFrame>,
  "Summarization Chain": <IconFrame tone="#a78bfa"><ListRestart className="h-4 w-4" /></IconFrame>,
  "Text Classifier": <IconFrame tone="#34d399"><FilterIcon className="h-4 w-4" /></IconFrame>,
  Evaluation: <IconFrame tone="#22c55e"><CheckCircle2 className="h-4 w-4" /></IconFrame>,
  "Photo Editor": <IconFrame tone="#f472b6"><ImageIcon className="h-4 w-4" /></IconFrame>,
  "Video Editor": <IconFrame tone="#fb923c"><Video className="h-4 w-4" /></IconFrame>,
  "Dev Tool": <IconFrame tone="#facc15"><Code2 className="h-4 w-4" /></IconFrame>,
  "API Request": <IconFrame tone="#38bdf8"><Webhook className="h-4 w-4" /></IconFrame>,
  "Transform Data": <IconFrame tone="#a78bfa"><Table2 className="h-4 w-4" /></IconFrame>,
  "Code Function": <IconFrame tone="#facc15"><BrainCircuit className="h-4 w-4" /></IconFrame>,
  "File Operation": <IconFrame tone="#34d399"><FileJson className="h-4 w-4" /></IconFrame>,
  "For Each": <IconFrame tone="#facc15"><ListRestart className="h-4 w-4" /></IconFrame>,
  "If / Else": <IconFrame tone="#22c55e"><GitBranch className="h-4 w-4" /></IconFrame>,
  Switch: <IconFrame tone="#38bdf8"><Split className="h-4 w-4" /></IconFrame>,
  Merge: <IconFrame tone="#a78bfa"><GitMerge className="h-4 w-4" /></IconFrame>,
  "Try / Catch": <IconFrame tone="#f87171"><KeyRound className="h-4 w-4" /></IconFrame>,
  Filter: <IconFrame tone="#22c55e"><FilterIcon className="h-4 w-4" /></IconFrame>,
  "While Loop": <IconFrame tone="#facc15"><ListRestart className="h-4 w-4" /></IconFrame>,
  "Random Router": <IconFrame tone="#fb923c"><Shuffle className="h-4 w-4" /></IconFrame>,
  Sort: <IconFrame tone="#38bdf8"><SortAsc className="h-4 w-4" /></IconFrame>,
  Deduplicate: <IconFrame tone="#34d399"><Database className="h-4 w-4" /></IconFrame>,
  ChatGPT: <LogoFrame tone="#111827"><OpenAILogo /></LogoFrame>,
  Gemini: <LogoFrame tone="#8ab4f8"><GeminiLogo /></LogoFrame>,
  Anthropic: <LogoFrame tone="#111827"><AnthropicLogo /></LogoFrame>,
  "OpenAI Image": <LogoFrame tone="#111827"><OpenAILogo /></LogoFrame>,
  "Gemini Image": <LogoFrame tone="#8ab4f8"><GeminiLogo /></LogoFrame>,
  "Stable Diffusion": <LogoFrame><StableDiffusionLogo /></LogoFrame>,
  "Variable Set": <IconFrame tone="#facc15"><Variable className="h-4 w-4" /></IconFrame>,
  "Variable Get": <IconFrame tone="#facc15"><Variable className="h-4 w-4" /></IconFrame>,
  Delay: <IconFrame tone="#38bdf8"><Clock3 className="h-4 w-4" /></IconFrame>,
  Notification: <IconFrame tone="#f472b6"><Bell className="h-4 w-4" /></IconFrame>,
  "Shell Command": <IconFrame tone="#34d399"><Shell className="h-4 w-4" /></IconFrame>,
  Output: <IconFrame tone="#60a5fa"><FileOutput className="h-4 w-4" /></IconFrame>,
};

const kindIcons: Record<NodeKind, React.ReactNode> = {
  input: <IconFrame tone="#60a5fa"><FileInput className="h-4 w-4" /></IconFrame>,
  logic: <IconFrame tone="#22c55e"><GitBranch className="h-4 w-4" /></IconFrame>,
  output: <IconFrame tone="#60a5fa"><FileOutput className="h-4 w-4" /></IconFrame>,
  tool: <IconFrame tone="#facc15"><Code2 className="h-4 w-4" /></IconFrame>,
};

const kindStyles: Record<DataKind, string> = {
  any: "border-neutral-200 bg-neutral-100 text-neutral-500",
  boolean: "border-sky-200 bg-sky-50 text-sky-700",
  file: "border-emerald-200 bg-emerald-50 text-emerald-700",
  image: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  text: "border-yellow-200 bg-yellow-50 text-yellow-700",
  video: "border-orange-200 bg-orange-50 text-orange-700",
};

const statusStyles: Record<NodeStatus, string> = {
  error: "bg-red-400",
  idle: "bg-neutral-500",
  ready: "bg-sky-300",
  running: "bg-yellow-300 animate-pulse",
  success: "bg-green-300",
};

const templateByTitle = (title: string) => {
  const template = templates.find((item) => item.title === title);
  if (!template) throw new Error(`Missing workflow template: ${title}`);
  return template;
};

const initialNodes: WorkflowNode[] = [
  { ...templateByTitle("Input"), id: "file-input", output: "file", value: "", position: { x: 120, y: 160 }, status: "ready" },
  { ...templateByTitle("Photo Editor"), id: "photo-editor", position: { x: 430, y: 160 }, status: "idle" },
  { ...templateByTitle("Output"), id: "file-output", output: "image", position: { x: 740, y: 160 }, status: "idle" },
  { ...templateByTitle("Input"), id: "text-input", output: "text", position: { x: 120, y: 360 }, status: "ready" },
  { ...templateByTitle("Dev Tool"), id: "dev-tool", position: { x: 430, y: 360 }, status: "idle" },
  { ...templateByTitle("Output"), id: "text-output", output: "text", position: { x: 740, y: 360 }, status: "idle" },
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
      { ...templateByTitle("Input"), id: "batch-file", output: "file", value: "", position: { x: 110, y: 170 }, status: "ready" as NodeStatus },
      { ...templateByTitle("For Each"), id: "for-each", position: { x: 390, y: 170 }, status: "idle" as NodeStatus },
      { ...templateByTitle("If / Else"), id: "if-else", position: { x: 670, y: 170 }, status: "idle" as NodeStatus },
      { ...templateByTitle("Output"), id: "batch-output", output: "file", position: { x: 950, y: 170 }, status: "idle" as NodeStatus },
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

  if (node.title === "Filter") {
    const offsets = distributePortOffsets(2);
    return [
      { id: "pass", label: "pass", kind: "any", offsetY: offsets[0] },
      { id: "fail", label: "fail", kind: "any", offsetY: offsets[1] },
    ];
  }

  if (node.title === "While Loop") {
    const offsets = distributePortOffsets(2);
    return [
      { id: "loop", label: "loop", kind: "any", offsetY: offsets[0] },
      { id: "done", label: "done", kind: "any", offsetY: offsets[1] },
    ];
  }

  if (node.title === "Switch" || node.title === "Random Router") {
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
      return {
        functionId: parsed.functionId,
        params: parsed.params as Record<string, string>,
        paramSources: parsed.paramSources && typeof parsed.paramSources === "object" ? parsed.paramSources as Record<string, string> : {},
      };
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
      source: typeof parsed.source === "string" ? parsed.source : "",
      condition: typeof parsed.condition === "string" ? parsed.condition : "",
      field: typeof parsed.field === "string" ? parsed.field : "",
      operator: typeof parsed.operator === "string" ? parsed.operator : "",
      value: typeof parsed.value === "string" ? parsed.value : "",
      batchSize: typeof parsed.batchSize === "string" ? parsed.batchSize : "",
      direction: typeof parsed.direction === "string" ? parsed.direction : "asc",
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

function parseWorkflowDocument(value: string): WorkflowDocument {
  const parsed = JSON.parse(value) as Partial<WorkflowDocument> & { nodes?: WorkflowNode[]; connections?: Connection[] };
  return {
    metadata: { ...defaultMetadata, ...(parsed.metadata ?? {}) },
    nodes: Array.isArray(parsed.nodes) ? parsed.nodes : initialNodes,
    connections: Array.isArray(parsed.connections) ? parsed.connections : initialConnections,
  };
}

export default function WorkflowBuilder() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState("");
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.92);
  const [query, setQuery] = useState("");
  const [runLogs, setRunLogs] = useState<RunLog[]>([]);
  const [terminalQuery, setTerminalQuery] = useState("");
  const [logFilter, setLogFilter] = useState<"all" | "success" | "error">("all");
  const [metadata, setMetadata] = useState<WorkflowMetadata>(defaultMetadata);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [paletteWidth, setPaletteWidth] = useState(278);
  const [terminalHeight, setTerminalHeight] = useState(176);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const snapToGrid = true;
  const [configNodeId, setConfigNodeId] = useState("");
  const [configTab, setConfigTab] = useState<"parameters" | "settings">("parameters");
  const [nodeSettings, setNodeSettings] = useState<Record<string, NodeSettings>>({});
  const activePointersRef = useRef<Map<number, Point>>(new Map());
  const pinchStateRef = useRef<PinchState | null>(null);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const configNode = nodes.find((node) => node.id === configNodeId);
  const selectedEdge = connections.find((connection) => connection.id === selectedEdgeId);
  const selectedNodes = nodes.filter((node) => selectedNodeIds.includes(node.id));
  const filteredRunLogs = runLogs.filter((log) => {
    const matchesLevel = logFilter === "all" || log.status === logFilter;
    const normalizedQuery = terminalQuery.trim().toLowerCase();
    const matchesQuery = !normalizedQuery || `${log.title} ${log.message} ${log.output} ${log.status}`.toLowerCase().includes(normalizedQuery);
    return matchesLevel && matchesQuery;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = parseWorkflowDocument(saved);
      setMetadata(parsed.metadata);
      setNodes(parsed.nodes);
      setConnections(parsed.connections);
    } catch {
      // Ignore invalid legacy saves and keep the starter graph.
    }
  }, []);

  useEffect(() => {
    const autosave = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ metadata, nodes, connections }));
    }, 500);

    return () => window.clearTimeout(autosave);
  }, [metadata, nodes, connections]);

  useEffect(() => {
    if (!resizeState) return;

    const onPointerMove = (event: PointerEvent) => {
      if (resizeState.type === "palette") {
        setPaletteWidth(Math.min(420, Math.max(220, resizeState.startWidth + event.clientX - resizeState.originX)));
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        Boolean(target?.isContentEditable);
      if (isTyping) return;

      const isModifier = event.ctrlKey || event.metaKey;

      if (isModifier && event.key.toLowerCase() === "a") {
        event.preventDefault();
        setSelectedNodeIds(nodes.map((node) => node.id));
        setSelectedNodeId(nodes[0]?.id ?? "");
        setSelectedEdgeId("");
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && (selectedNodeIds.length > 0 || selectedNode || selectedEdge)) {
        event.preventDefault();
        if (selectedNodeIds.length > 0) {
          const ids = new Set(selectedNodeIds);
          setNodes((current) => current.filter((node) => !ids.has(node.id)));
          setConnections((current) => current.filter((connection) => !ids.has(connection.from) && !ids.has(connection.to)));
          setSelectedNodeIds([]);
          setSelectedNodeId("");
          setSelectedEdgeId("");
          return;
        }
        deleteSelection();
        return;
      }

      if (!isModifier) return;

      if (event.key.toLowerCase() === "c" && (selectedNodeIds.length > 0 || selectedNode)) {
        event.preventDefault();
        const copyNodes = selectedNodeIds.length > 0 ? selectedNodes : selectedNode ? [selectedNode] : [];
        localStorage.setItem("dawndesk_workflow_clipboard", JSON.stringify(copyNodes));
        return;
      }

      if (event.key.toLowerCase() === "v") {
        const copied = localStorage.getItem("dawndesk_workflow_clipboard");
        if (!copied) return;
        event.preventDefault();
        try {
          const parsed = JSON.parse(copied) as WorkflowNode | WorkflowNode[];
          const sourceNodes = Array.isArray(parsed) ? parsed : [parsed];
          const pastedNodes = sourceNodes.map((node, index) => ({
            ...node,
            id: `${node.id}-copy-${Date.now()}-${index}`,
            position: { x: node.position.x + 42, y: node.position.y + 42 },
            status: node.kind === "input" ? "ready" as NodeStatus : "idle" as NodeStatus,
          }));
          setNodes((current) => [...current, ...pastedNodes]);
          setSelectedNodeIds(pastedNodes.map((node) => node.id));
          setSelectedNodeId(pastedNodes[0]?.id ?? "");
          setSelectedEdgeId("");
        } catch {
          // Ignore invalid clipboard payloads.
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [connections, nodes, selectedEdge, selectedNode, selectedNodeIds, selectedNodes]);

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

  const getCanvasPointer = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const beginPinchIfReady = () => {
    if (activePointersRef.current.size !== 2) return;
    const [first, second] = Array.from(activePointersRef.current.values());
    const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
    const initialDistance = Math.hypot(second.x - first.x, second.y - first.y);
    if (initialDistance <= 0) return;
    pinchStateRef.current = {
      initialDistance,
      initialZoom: zoom,
      center,
      canvasPoint: {
        x: (center.x - pan.x) / zoom,
        y: (center.y - pan.y) / zoom,
      },
    };
    setDragState(null);
  };

  const updatePinchZoom = () => {
    const pinch = pinchStateRef.current;
    if (!pinch || activePointersRef.current.size !== 2) return false;
    const [first, second] = Array.from(activePointersRef.current.values());
    const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
    const distance = Math.hypot(second.x - first.x, second.y - first.y);
    const nextZoom = Math.min(1.6, Math.max(0.35, pinch.initialZoom * (distance / pinch.initialDistance)));
    setZoom(nextZoom);
    setPan({
      x: center.x - pinch.canvasPoint.x * nextZoom,
      y: center.y - pinch.canvasPoint.y * nextZoom,
    });
    return true;
  };

  const addNode = (template: NodeTemplate, position?: Point) => {
    const nextPosition = position ?? { x: 160 + nodes.length * 26, y: 120 + nodes.length * 18 };
    const node = cloneTemplate(template, nextPosition);
    setNodes((current) => [...current, node]);
    setSelectedNodeId(node.id);
    setSelectedNodeIds([node.id]);
    setSelectedEdgeId("");
  };

  const openNodeConfiguration = (node: WorkflowNode) => {
    setSelectedNodeId(node.id);
    setSelectedNodeIds([node.id]);
    setSelectedEdgeId("");
    setConfigNodeId(node.id);
    setConfigTab("parameters");
  };

  const updateConfigNodeSetting = (nodeId: string, updates: Partial<NodeSettings>) => {
    setNodeSettings((current) => ({
      ...current,
      [nodeId]: {
        ...defaultNodeSettings,
        ...(current[nodeId] ?? {}),
        ...updates,
      },
    }));
  };

  const zoomToFit = (items = nodes) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || items.length === 0) return;

    const minX = Math.min(...items.map((node) => node.position.x));
    const minY = Math.min(...items.map((node) => node.position.y));
    const maxX = Math.max(...items.map((node) => node.position.x + nodeWidth));
    const maxY = Math.max(...items.map((node) => node.position.y + nodeHeight));
    const graphWidth = Math.max(1, maxX - minX);
    const graphHeight = Math.max(1, maxY - minY);
    const padding = 96;
    const availableWidth = Math.max(1, rect.width - padding * 2);
    const availableHeight = Math.max(1, rect.height - padding * 2);
    const nextZoom = Math.min(1.35, Math.max(0.35, Math.min(availableWidth / graphWidth, availableHeight / graphHeight)));
    const centerX = minX + graphWidth / 2;
    const centerY = minY + graphHeight / 2;

    setZoom(nextZoom);
    setPan({
      x: rect.width / 2 - centerX * nextZoom,
      y: rect.height / 2 - centerY * nextZoom,
    });
  };

  const tidyWorkflow = () => {
    const kindDepth: Record<NodeKind, number> = { input: 0, tool: 1, logic: 2, output: 3 };
    const depthById = new Map(nodes.map((node) => [node.id, kindDepth[node.kind]]));

    for (let pass = 0; pass < nodes.length; pass += 1) {
      connections.forEach((connection) => {
        const fromDepth = depthById.get(connection.from);
        const toDepth = depthById.get(connection.to);
        if (fromDepth === undefined || toDepth === undefined) return;
        depthById.set(connection.to, Math.max(toDepth, fromDepth + 1));
      });
    }

    const columns = new Map<number, WorkflowNode[]>();
    nodes.forEach((node) => {
      const depth = depthById.get(node.id) ?? kindDepth[node.kind];
      columns.set(depth, [...(columns.get(depth) ?? []), node]);
    });

    columns.forEach((column) => {
      column.sort((a, b) => a.position.y - b.position.y || a.title.localeCompare(b.title));
    });

    const orderedDepths = [...columns.keys()].sort((a, b) => a - b);
    const depthToColumn = new Map(orderedDepths.map((depth, index) => [depth, index]));
    const nextNodes = nodes.map((node) => {
      const depth = depthById.get(node.id) ?? kindDepth[node.kind];
      const column = columns.get(depth) ?? [];
      const columnIndex = depthToColumn.get(depth) ?? 0;
      const rowIndex = Math.max(0, column.findIndex((item) => item.id === node.id));
      return {
        ...node,
        position: {
          x: 120 + columnIndex * 300,
          y: 110 + rowIndex * 170,
        },
      };
    });

    setNodes(nextNodes);
    zoomToFit(nextNodes);
  };

  const onNodeDragStart = (event: React.PointerEvent, node: WorkflowNode) => {
    if (node.pinned) {
      setSelectedNodeId(node.id);
      setSelectedNodeIds([node.id]);
      setSelectedEdgeId("");
      return;
    }
    const pointer = screenToCanvas(event.clientX, event.clientY);
    setSelectedNodeId(node.id);
    setSelectedNodeIds([node.id]);
    setSelectedEdgeId("");
    setDragState({
      type: "node",
      nodeId: node.id,
      offset: { x: pointer.x - node.position.x, y: pointer.y - node.position.y },
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onCanvasPointerDown = (event: React.PointerEvent) => {
    activePointersRef.current.set(event.pointerId, getCanvasPointer(event.clientX, event.clientY));
    if (activePointersRef.current.size === 2) {
      beginPinchIfReady();
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (event.target !== event.currentTarget) return;
    setSelectedNodeId("");
    setSelectedNodeIds([]);
    setSelectedEdgeId("");
    setDragState({
      type: "pan",
      origin: { x: event.clientX, y: event.clientY },
      panStart: pan,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onCanvasPointerMove = (event: React.PointerEvent) => {
    if (activePointersRef.current.has(event.pointerId)) {
      activePointersRef.current.set(event.pointerId, getCanvasPointer(event.clientX, event.clientY));
      if (updatePinchZoom()) return;
    }

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
                x: snapToGrid ? Math.round((pointer.x - dragState.offset.x) / 14) * 14 : pointer.x - dragState.offset.x,
                y: snapToGrid ? Math.round((pointer.y - dragState.offset.y) / 14) * 14 : pointer.y - dragState.offset.y,
              },
            }
          : node,
      ),
    );
  };

  const onCanvasPointerUp = (event: React.PointerEvent) => {
    activePointersRef.current.delete(event.pointerId);
    if (activePointersRef.current.size < 2) pinchStateRef.current = null;
    if (dragState) event.currentTarget.releasePointerCapture(event.pointerId);
    setDragState(null);
  };

  const startConnection = (event: React.PointerEvent, node: WorkflowNode, fromPort = "main") => {
    event.stopPropagation();
    setPendingConnection({ from: node.id, fromPort, pointer: outputPoint(node, fromPort) });
    setSelectedNodeId(node.id);
    setSelectedNodeIds([node.id]);
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

    const normalizeWheelDelta = (value: number) => (event.deltaMode === 1 ? value * 16 : value);

    if (!event.ctrlKey && !event.metaKey) {
      setPan((current) => ({
        x: current.x - normalizeWheelDelta(event.deltaX),
        y: current.y - normalizeWheelDelta(event.deltaY),
      }));
      return;
    }

    const pointer = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const canvasPoint = {
      x: (pointer.x - pan.x) / zoom,
      y: (pointer.y - pan.y) / zoom,
    };
    const delta = normalizeWheelDelta(event.deltaY);
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

  const updateNodeFunctionParamSource = (key: string, value: string) => {
    if (!selectedNode) return;
    const currentConfig = parseFunctionConfig(selectedNode.value);
    setNodes((current) =>
      current.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              value: serializeFunctionConfig({
                ...currentConfig,
                paramSources: { ...(currentConfig.paramSources ?? {}), [key]: value },
              }),
            }
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

    if (selectedNodeIds.length > 0) {
      const ids = new Set(selectedNodeIds);
      setNodes((current) => current.filter((node) => !ids.has(node.id)));
      setConnections((current) => current.filter((connection) => !ids.has(connection.from) && !ids.has(connection.to)));
      setSelectedNodeIds([]);
      setSelectedNodeId("");
      return;
    }

    if (!selectedNode || nodes.length <= 1) return;
    setNodes((current) => current.filter((node) => node.id !== selectedNode.id));
    setConnections((current) =>
      current.filter((connection) => connection.from !== selectedNode.id && connection.to !== selectedNode.id),
    );
    setSelectedNodeId("");
    setSelectedNodeIds([]);
  };

  const saveWorkflow = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ metadata, nodes, connections }));
  };

  const loadWorkflow = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const parsed = parseWorkflowDocument(saved);
    setMetadata(parsed.metadata);
    setNodes(parsed.nodes);
    setConnections(parsed.connections);
    setSelectedNodeId(parsed.nodes[0]?.id ?? "");
    setSelectedNodeIds(parsed.nodes[0]?.id ? [parsed.nodes[0].id] : []);
    setSelectedEdgeId("");
    setRunLogs([]);
  };

  const exportWorkflow = async () => {
    const selected = await save({
      title: "Export workflow JSON",
      defaultPath: `${metadata.name.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "workflow"}.json`,
      filters: [{ name: "Workflow JSON", extensions: ["json"] }],
    });
    if (!selected) return;
    await writeTextFile(selected, JSON.stringify({ metadata, nodes, connections }, null, 2));
  };

  const importWorkflow = async () => {
    const selected = await open({
      multiple: false,
      directory: false,
      title: "Import workflow JSON",
      filters: [{ name: "Workflow JSON", extensions: ["json"] }],
    });
    if (typeof selected !== "string") return;
    const contents = await readTextFile(selected);
    const parsed = parseWorkflowDocument(contents);
    setMetadata(parsed.metadata);
    setNodes(parsed.nodes);
    setConnections(parsed.connections);
    setSelectedNodeId(parsed.nodes[0]?.id ?? "");
    setSelectedNodeIds(parsed.nodes[0]?.id ? [parsed.nodes[0].id] : []);
    setSelectedEdgeId("");
    setRunLogs([]);
  };

  const applyTemplate = (title: string) => {
    const template = workflowTemplates.find((item) => item.title === title);
    if (!template) return;
    setMetadata({ ...defaultMetadata, name: template.title });
    setNodes(template.nodes.map((node) => ({ ...node })));
    setConnections(template.connections.map((connection) => ({ ...connection })));
    setSelectedNodeId(template.nodes[0]?.id ?? "");
    setSelectedNodeIds(template.nodes[0]?.id ? [template.nodes[0].id] : []);
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

  const dryRunWorkflow = () => {
    const logs: RunLog[] = [];
    nodes.forEach((node) => {
      const inputNeedsPath = node.kind === "input" && ["file", "image", "video"].includes(node.output);
      const missingInputPath = inputNeedsPath && !node.value;
      const missingOutputPath = node.kind === "output" && !node.value;
      const selectedFunction = workflowFunctions[node.title]?.find((item) => item.id === parseFunctionConfig(node.value).functionId);
      const missingFunction = node.kind === "tool" && !selectedFunction;
      const incomingCount = connections.filter((connection) => connection.to === node.id).length;
      const disconnected = node.kind !== "input" && incomingCount === 0;
      const status: Extract<NodeStatus, "success" | "error"> =
        missingInputPath || missingOutputPath || missingFunction || disconnected ? "error" : "success";
      const message =
        missingInputPath
          ? `Missing ${node.output} input path.`
          : missingOutputPath
            ? "Missing output save path."
            : missingFunction
              ? "Missing selected function."
              : disconnected
                ? "Node has no incoming connection."
                : "Dry-run validation passed.";
      logs.push({ nodeId: node.id, title: node.title, output: node.output, status, message });
    });
    setRunLogs(logs);
    setNodes((current) => current.map((node) => {
      const log = logs.find((item) => item.nodeId === node.id);
      return log ? { ...node, status: log.status } : node;
    }));
  };

  const exportRunLog = async () => {
    const selected = await save({
      title: "Export workflow run log",
      defaultPath: `${metadata.name.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "workflow"}-run-log.txt`,
      filters: [{ name: "Text", extensions: ["txt"] }],
    });
    if (!selected) return;
    const contents = runLogs
      .map((log, index) => `${index + 1}. [${log.status.toUpperCase()}] ${log.title} (${log.output}) - ${log.message}`)
      .join("\n");
    await writeTextFile(selected, contents || "No workflow logs yet.");
  };

  const getIncomingOptions = (node: WorkflowNode) =>
    connections
      .filter((connection) => connection.to === node.id)
      .map((connection) => {
        const from = nodes.find((item) => item.id === connection.from);
        const port = connection.fromPort ?? "main";
        return {
          value: `${connection.from}:${port}`,
          label: `${from?.title ?? connection.from} / ${port}`,
        };
      });

  const renderSourceSelect = (node: WorkflowNode, value: string | undefined, onChange: (value: string) => void, label = "Input source") => {
    const options = getIncomingOptions(node);
    return (
      <label className="block">
        <span className="dd-form-label">{label}</span>
        <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="dd-select mt-2 w-full">
          <option value="">Manual / no upstream value</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
    );
  };

  const renderConditionBuilder = (node: WorkflowNode, title = "Condition") => {
    const config = parseRouteConfig(node.value);
    const operator = config.operator || "equals";
    const hidesValue = ["exists", "not_exists", "is_true", "is_false"].includes(operator);
    return (
      <div className="space-y-3">
        {renderSourceSelect(node, config.source, (value) => updateRouteConfig({ source: value }))}
        <label className="block">
          <span className="dd-form-label">{title} field</span>
          <input
            value={config.field ?? ""}
            onChange={(event) => updateRouteConfig({ field: event.target.value })}
            className="dd-input mt-2 w-full"
            placeholder="status, file.size, $.items[0].name"
          />
        </label>
        <label className="block">
          <span className="dd-form-label">Operator</span>
          <select value={operator} onChange={(event) => updateRouteConfig({ operator: event.target.value })} className="dd-select mt-2 w-full">
            <option value="equals">equals</option>
            <option value="not_equals">does not equal</option>
            <option value="contains">contains</option>
            <option value="greater_than">greater than</option>
            <option value="less_than">less than</option>
            <option value="exists">exists</option>
            <option value="not_exists">does not exist</option>
            <option value="is_true">is true</option>
            <option value="is_false">is false</option>
          </select>
        </label>
        {!hidesValue && (
          <label className="block">
            <span className="dd-form-label">Compare value</span>
            <input
              value={config.value ?? ""}
              onChange={(event) => updateRouteConfig({ value: event.target.value })}
              className="dd-input mt-2 w-full"
              placeholder="approved, 100, true"
            />
          </label>
        )}
      </div>
    );
  };

  const toggleFullscreen = async () => {
    setIsFullscreen((current) => !current);
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
              <button onClick={chooseInputFile} className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-semibold text-neutral-600 transition-colors hover:text-neutral-950">
                <FileInput className="h-4 w-4" />
                Select {node.output === "file" ? "File" : node.output}
              </button>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">Current source</p>
                <p className="mt-2 break-all text-xs leading-relaxed text-neutral-600">{node.value || "No file selected yet."}</p>
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
          <p className="text-xs leading-relaxed text-neutral-500">This single Input node can be retyped whenever the workflow needs a different source.</p>
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
          <button onClick={chooseOutputPath} className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-semibold text-neutral-600 transition-colors hover:text-neutral-950">
            <Download className="h-4 w-4" />
            Choose Save Path
          </button>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">Target path</p>
            <p className="mt-2 break-all text-xs leading-relaxed text-neutral-600">{node.value || "No output path selected yet."}</p>
          </div>
          <p className="text-xs leading-relaxed text-neutral-500">When the workflow runs, this node writes a DawnDesk output artifact to the selected path.</p>
        </div>
      );
    }

    if (node.title === "If / Else") {
      return (
        <div className="space-y-4">
          {renderConditionBuilder(node)}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-green-400/25 bg-green-400/10 p-3">
              <p className="text-xs font-bold uppercase text-green-700">True output</p>
              <p className="mt-1 text-xs text-neutral-500">Use this port when the condition passes.</p>
            </div>
            <div className="rounded-lg border border-red-400/25 bg-red-400/10 p-3">
              <p className="text-xs font-bold uppercase text-red-700">False output</p>
              <p className="mt-1 text-xs text-neutral-500">Use this port when the condition fails.</p>
            </div>
          </div>
        </div>
      );
    }

    if (node.title === "For Each") {
      const config = parseRouteConfig(node.value);
      return (
        <div className="space-y-4">
          {renderSourceSelect(node, config.source, (value) => updateRouteConfig({ source: value }))}
          <label className="block">
            <span className="dd-form-label">Items field/path</span>
            <input
              value={config.field ?? ""}
              onChange={(event) => updateRouteConfig({ field: event.target.value })}
              className="dd-input mt-2 w-full"
              placeholder="items, rows, $.items"
            />
          </label>
          <label className="block">
            <span className="dd-form-label">Batch size</span>
            <input
              type="number"
              value={config.batchSize ?? ""}
              onChange={(event) => updateRouteConfig({ batchSize: event.target.value })}
              className="dd-input mt-2 w-full"
              placeholder="1"
            />
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-yellow-400/25 bg-yellow-400/10 p-3 text-yellow-700">Item route</div>
            <div className="rounded-lg border border-green-400/25 bg-green-400/10 p-3 text-green-700">Done route</div>
          </div>
        </div>
      );
    }

    if (node.title === "Switch") {
      const config = parseRouteConfig(node.value);
      const cases = config.cases?.length ? config.cases : ["case 1", "case 2"];
      return (
        <div className="space-y-4">
          {renderSourceSelect(node, config.source, (value) => updateRouteConfig({ source: value }))}
          <label className="block">
            <span className="dd-form-label">Field/path to match</span>
            <input
              value={config.field ?? ""}
              onChange={(event) => updateRouteConfig({ field: event.target.value })}
              className="dd-input mt-2 w-full"
              placeholder="status, type, $.payload.kind"
            />
          </label>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="dd-form-label">Routes</span>
              <button type="button" onClick={addSwitchCase} className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-bold text-neutral-600 transition-colors hover:text-neutral-950">
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
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
                    aria-label="Remove route"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                Default route is always available.
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (node.title === "Filter" || node.title === "While Loop") {
      return (
        <div className="space-y-4">
          {renderConditionBuilder(node, node.title === "Filter" ? "Filter" : "Loop")}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-green-400/25 bg-green-400/10 p-3 text-green-700">
              {node.title === "Filter" ? "Pass route" : "Loop route"}
            </div>
            <div className="rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-red-700">
              {node.title === "Filter" ? "Fail route" : "Done route"}
            </div>
          </div>
        </div>
      );
    }

    if (node.title === "Sort") {
      const config = parseRouteConfig(node.value);
      return (
        <div className="space-y-4">
          {renderSourceSelect(node, config.source, (value) => updateRouteConfig({ source: value }))}
          <label className="block">
            <span className="dd-form-label">Sort field</span>
            <input
              value={config.field ?? ""}
              onChange={(event) => updateRouteConfig({ field: event.target.value })}
              className="dd-input mt-2 w-full"
              placeholder="createdAt, name, priority"
            />
          </label>
          <label className="block">
            <span className="dd-form-label">Direction</span>
            <select
              value={config.direction ?? "asc"}
              onChange={(event) => updateRouteConfig({ direction: event.target.value })}
              className="dd-select mt-2 w-full"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
        </div>
      );
    }

    if (node.title === "Deduplicate") {
      const config = parseRouteConfig(node.value);
      return (
        <div className="space-y-4">
          {renderSourceSelect(node, config.source, (value) => updateRouteConfig({ source: value }))}
          <label className="block">
            <span className="dd-form-label">Unique key field</span>
            <input
              value={config.field ?? ""}
              onChange={(event) => updateRouteConfig({ field: event.target.value })}
              className="dd-input mt-2 w-full"
              placeholder="id, email, slug"
            />
          </label>
        </div>
      );
    }

    if (node.title === "Try / Catch") {
      return (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-green-400/25 bg-green-400/10 p-3 text-green-700">Success route</div>
          <div className="rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-red-700">Error route</div>
        </div>
      );
    }

    if (node.title === "Merge") {
      return (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-500">
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
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-yellow-700">{selectedFunction.api}</p>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">{selectedFunction.description}</p>
            </div>
          )}

          {selectedFunction?.params.length === 0 && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-500">
              This function does not need additional input.
            </div>
          )}

          {selectedFunction?.params.map((param) => {
            const source = config.paramSources?.[param.key] ?? "";
            return (
              <div key={param.key} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                {renderSourceSelect(node, source, (value) => updateNodeFunctionParamSource(param.key, value), `${param.label} source`)}
                {!source && (
                  <label className="mt-3 block">
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
                )}
              </div>
            );
          })}
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

  const renderConfigSwitch = (checked: boolean, onChange: (checked: boolean) => void) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-10 rounded-full transition-colors ${checked ? "bg-yellow-400" : "bg-neutral-400"}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );

  const renderConfigInputPanel = (node: WorkflowNode) => {
    const incomingConnections = connections.filter((connection) => connection.to === node.id);
    return (
      <section className="flex min-h-0 flex-col bg-neutral-950 text-white">
        <div className="border-b border-neutral-800 px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/40">Input</p>
        </div>
        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          {incomingConnections.length > 0 ? (
            <div className="space-y-2">
              {incomingConnections.map((connection) => {
                const relatedNode = nodes.find((item) => item.id === connection.from);
                return (
                  <div key={connection.id} className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-3 text-sm text-white/80">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-yellow-300">
                      {(connection.fromPort ?? "main").toUpperCase()} output
                    </p>
                    <p className="mt-1 truncate">{relatedNode?.title ?? "Connected node"}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <span className="text-3xl text-white/35">-&gt;</span>
              <p className="mt-5 text-base font-semibold text-white/70">No input data</p>
              <button
                type="button"
                onClick={dryRunWorkflow}
                className="mt-5 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-neutral-950 transition-colors hover:bg-yellow-300"
              >
                Execute previous nodes
              </button>
              <p className="mt-4 text-sm text-white/40">to view input data</p>
            </div>
          )}

          <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">Accepted input</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(node.input.length ? node.input : ["start"]).map((kind) => (
                <span key={kind} className="rounded-full border border-neutral-700 bg-neutral-950 px-2 py-1 text-[10px] font-bold uppercase text-white/50">
                  {kind}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderConfigSettings = (node: WorkflowNode) => {
    const settings = nodeSettings[node.id] ?? defaultNodeSettings;
    return (
      <div className="space-y-5">
        {[
          ["Always Output Data", "alwaysOutputData"],
          ["Execute Once", "executeOnce"],
          ["Retry On Fail", "retryOnFail"],
        ].map(([label, key]) => (
          <label key={key} className="block">
            <span className="mb-2 block text-sm text-white/70">{label}</span>
            {renderConfigSwitch(Boolean(settings[key as keyof NodeSettings]), (checked) =>
              updateConfigNodeSetting(node.id, { [key]: checked } as Partial<NodeSettings>),
            )}
          </label>
        ))}

        <label className="block">
          <span className="mb-2 block text-sm text-white/70">On Error</span>
          <select
            value={settings.onError}
            onChange={(event) => updateConfigNodeSetting(node.id, { onError: event.target.value })}
            className="h-10 w-full rounded border border-neutral-800 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-yellow-400/60"
          >
            <option>Stop Workflow</option>
            <option>Continue</option>
            <option>Continue Using Error Output</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-white/70">Notes</span>
          <textarea
            value={settings.notes}
            onChange={(event) => updateConfigNodeSetting(node.id, { notes: event.target.value })}
            className="min-h-28 w-full resize-none rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/60"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-white/70">Display Note in Flow?</span>
          {renderConfigSwitch(settings.displayNote, (checked) => updateConfigNodeSetting(node.id, { displayNote: checked }))}
        </label>
      </div>
    );
  };

  const workflowSurface = (
    <div
      ref={rootRef}
      data-workflow-root
      className={`${isFullscreen ? "fixed inset-0 z-[80] flex h-screen w-screen overflow-hidden" : "dd-page"} relative bg-neutral-950 text-white`}
    >
      <aside
        className="relative flex h-full shrink-0 flex-col border-r border-neutral-800 bg-neutral-950 text-white transition-[width] duration-200"
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
        <header className="grid h-14 shrink-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-neutral-800 bg-neutral-950 px-5 text-white">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="text-white/45">Personal</span>
            <span className="text-white/25">/</span>
            <input
              value={metadata.name}
              onChange={(event) => setMetadata((current) => ({ ...current, name: event.target.value }))}
              className="min-w-0 max-w-[260px] truncate bg-transparent font-semibold text-white outline-none"
              aria-label="Workflow name"
            />
            <button
              type="button"
              onClick={() => setMetadata((current) => ({ ...current, tags: current.tags ? current.tags : "workflow" }))}
              className="ml-2 hidden text-xs font-semibold text-white/45 transition-colors hover:text-yellow-300 xl:inline"
            >
              + Add tag
            </button>
          </div>

          <div className="hidden justify-self-center rounded-md border border-neutral-800 bg-neutral-900 p-1 text-xs font-semibold text-white/45 shadow-sm 2xl:flex">
            <button type="button" className="rounded bg-neutral-800 px-4 py-1.5 text-yellow-300 shadow-sm">Editor</button>
            <button type="button" className="rounded px-4 py-1.5 transition-colors hover:text-white">Executions</button>
            <button type="button" className="rounded px-4 py-1.5 transition-colors hover:text-white">Evaluations</button>
          </div>

          <div className="flex min-w-0 items-center justify-end gap-2">
            <span className="hidden rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs font-semibold text-white/45 xl:inline">0 / 1</span>
            <select
              onChange={(event) => applyTemplate(event.target.value)}
              className="hidden h-9 max-w-36 rounded-lg border border-neutral-800 bg-neutral-900 px-3 text-xs font-bold text-white/60 outline-none xl:block"
              defaultValue=""
            >
              <option value="" disabled>Templates</option>
              {workflowTemplates.map((item) => (
                <option key={item.title} value={item.title}>{item.title}</option>
              ))}
            </select>
            <button onClick={saveWorkflow} className="hidden h-9 w-9 place-items-center rounded-lg text-white/45 transition-colors hover:bg-neutral-800 hover:text-white lg:grid" aria-label="Save workflow"><Save className="h-4 w-4" /></button>
            <button onClick={loadWorkflow} className="hidden h-9 w-9 place-items-center rounded-lg text-white/45 transition-colors hover:bg-neutral-800 hover:text-white lg:grid" aria-label="Load workflow"><FolderOpen className="h-4 w-4" /></button>
            <button onClick={importWorkflow} className="hidden h-9 w-9 place-items-center rounded-lg text-white/45 transition-colors hover:bg-neutral-800 hover:text-white 2xl:grid" aria-label="Import workflow"><FileInput className="h-4 w-4" /></button>
            <button onClick={exportWorkflow} className="hidden h-9 w-9 place-items-center rounded-lg text-white/45 transition-colors hover:bg-neutral-800 hover:text-white 2xl:grid" aria-label="Export workflow"><FileOutput className="h-4 w-4" /></button>
            <button onClick={dryRunWorkflow} className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-bold text-white/60 transition-colors hover:text-white">Dry Run</button>
            <button onClick={runWorkflow} className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-neutral-950 transition-colors hover:bg-yellow-300"><Play className="h-4 w-4" />Run</button>
            <button onClick={toggleFullscreen} className="grid h-9 w-9 place-items-center rounded-lg text-white/45 transition-colors hover:bg-neutral-800 hover:text-white" aria-label={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1">
          <section
            ref={canvasRef}
            className="relative h-full overflow-hidden bg-[#080808]"
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
                  "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
                backgroundPosition: `${pan.x}px ${pan.y}px`,
                backgroundSize: `${18 * zoom}px ${18 * zoom}px`,
              }}
            />

            <div className="absolute left-4 top-4 z-20 rounded-lg border border-neutral-800 bg-neutral-950/85 px-3 py-2 text-xs font-medium text-white/50 shadow-sm backdrop-blur">
              {pendingConnection ? "Drop on a highlighted input port" : "Hold empty canvas and drag to pan"}
            </div>

            <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2">
              <button onClick={() => zoomToFit()} className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-800 bg-neutral-950 text-white/60 shadow-sm transition-colors hover:border-neutral-700 hover:bg-neutral-900 hover:text-white" aria-label="Zoom to fit" title="Zoom to fit"><Maximize2 className="h-4 w-4" /></button>
              <button onClick={() => setZoom((current) => Math.max(0.55, current - 0.1))} className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-800 bg-neutral-950 text-white/60 shadow-sm transition-colors hover:border-neutral-700 hover:bg-neutral-900 hover:text-white" aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></button>
              <button onClick={() => setZoom((current) => Math.min(1.35, current + 0.1))} className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-800 bg-neutral-950 text-white/60 shadow-sm transition-colors hover:border-neutral-700 hover:bg-neutral-900 hover:text-white" aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></button>
              <button onClick={tidyWorkflow} className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-800 bg-neutral-950 text-white/60 shadow-sm transition-colors hover:border-neutral-700 hover:bg-neutral-900 hover:text-white" aria-label="Tidy workflow" title="Tidy workflow"><GitMerge className="h-4 w-4" /></button>
              <span className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-bold text-white/50 shadow-sm">{Math.round(zoom * 100)}%</span>
            </div>

            <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
              <button onClick={runWorkflow} className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-bold text-neutral-950 shadow-lg shadow-yellow-500/20 transition-colors hover:bg-yellow-300">
                <Play className="h-4 w-4" />
                Execute workflow
              </button>
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
                    stroke={isSelected ? "rgba(250,204,21,0.95)" : "rgba(212,212,216,0.45)"}
                    strokeWidth={isSelected ? 4 : 2}
                    className="cursor-pointer"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      setSelectedEdgeId(connection.id);
                      setSelectedNodeId("");
                      setSelectedNodeIds([]);
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
              const isSelected = selectedNode?.id === node.id || selectedNodeIds.includes(node.id);
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
                  onDoubleClick={(event) => {
                    event.stopPropagation();
                    openNodeConfiguration(node);
                  }}
                  className={`absolute z-20 cursor-grab rounded-md border bg-neutral-950 shadow-lg shadow-black/30 transition-colors active:cursor-grabbing ${
                    isSelected ? "border-yellow-400 shadow-lg shadow-yellow-500/15" : "border-neutral-800 hover:border-neutral-600"
                  }`}
                >
                  {node.input.length > 0 && (
                    <button
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onPointerUp={(event) => finishConnection(event, node)}
                      className={`absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-neutral-950 ${
                        canReceive ? "bg-green-400 shadow-lg shadow-green-300/30" : "bg-neutral-950 ring-1 ring-neutral-600"
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
                        <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 rounded border border-neutral-800 bg-neutral-950 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white/60 shadow-sm">
                          {port.label}
                        </span>
                      )}
                    </button>
                  ))}

                  <div className="flex h-full flex-col p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="grid h-5 w-5 place-items-center">
                        {node.status === "success" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : node.status === "error" ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <span className={`h-2.5 w-2.5 rounded-full ${statusStyles[node.status ?? "idle"]}`} />
                        )}
                      </span>
                      <span className="grid h-8 w-8 place-items-center rounded-md border border-neutral-800 bg-neutral-900 text-yellow-400">
                        {templateIcons[node.title] ?? kindIcons[node.kind]}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-white">{node.title}</h3>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-white/35">{node.kind}</p>
                      </div>
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-white/50">{node.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {node.input.length > 0 && (
                        <span className="rounded-full border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white/35">
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
        </div>

        <section
          className="relative flex shrink-0 flex-col border-t border-neutral-800 bg-neutral-950 text-white"
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
          <div className="flex h-10 items-center justify-between gap-3 border-b border-neutral-800 px-4">
            <div className="flex h-full items-center gap-5 text-sm font-semibold">
              <h3 className="h-full border-b-2 border-yellow-400 px-1 pt-2.5 text-white">Logs</h3>
              <span className="rounded-full border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white/40">
                {filteredRunLogs.length}/{runLogs.length} outputs
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <input
                value={terminalQuery}
                onChange={(event) => setTerminalQuery(event.target.value)}
                className="h-8 w-44 rounded-lg border border-neutral-800 bg-neutral-900 px-3 text-xs text-white outline-none placeholder:text-white/35"
                placeholder="Search logs..."
              />
              <select
                value={logFilter}
                onChange={(event) => setLogFilter(event.target.value as "all" | "success" | "error")}
                className="h-8 rounded-lg border border-neutral-800 bg-neutral-900 px-2 text-xs text-white/70 outline-none"
              >
                <option value="all">All</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>
              <button onClick={exportRunLog} className="grid h-8 w-8 place-items-center rounded-lg text-white/45 transition-colors hover:bg-neutral-800 hover:text-white" aria-label="Export terminal log">
                <Download className="h-4 w-4" />
              </button>
              <button onClick={() => setRunLogs([])} className="grid h-8 w-8 place-items-center rounded-lg text-white/45 transition-colors hover:bg-neutral-800 hover:text-white" aria-label="Clear terminal">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-6">
              {runLogs.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center font-sans text-sm text-white/40">
                  Nothing to display yet. Execute the workflow to see execution logs.
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredRunLogs.map((log, index) => (
                    <div
                      key={`${log.nodeId}-${log.message}-${index}`}
                      className={`grid grid-cols-[88px_160px_1fr] gap-3 rounded px-2 py-1 ${
                        log.status === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                      }`}
                    >
                      <span className="text-neutral-400">[{String(index + 1).padStart(2, "0")}]</span>
                      <span className="truncate">{log.title}</span>
                      <span className="min-w-0 truncate">
                        <span
                          className={`mr-2 rounded border px-1.5 py-0.5 text-[10px] uppercase ${
                            log.status === "error" ? "border-red-200 text-red-700" : "border-green-200 text-green-700"
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

      {configNode && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 text-neutral-900 backdrop-blur-sm">
          <div className="flex h-[min(720px,100%)] w-[min(1080px,100%)] min-w-0 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/50">
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="flex h-11 shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-3 text-white">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-md border border-neutral-800 bg-neutral-900 text-yellow-300">
                    {templateIcons[configNode.title] ?? kindIcons[configNode.kind]}
                  </span>
                  <h2 className="truncate text-sm font-semibold text-white">{configNode.title}</h2>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/55">
                  <button type="button" className="font-medium hover:text-white">Docs</button>
                  <button
                    type="button"
                    onClick={() => setConfigNodeId("")}
                    className="grid h-7 w-7 place-items-center rounded hover:bg-neutral-800 hover:text-white"
                    aria-label="Close node configuration"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </header>

              <div className="grid min-h-0 flex-1 grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
                {renderConfigInputPanel(configNode)}

                <section className="flex min-h-0 flex-col border-l border-neutral-800 bg-neutral-950 text-white">
                  <div className="flex h-11 shrink-0 items-center justify-between border-b border-neutral-800 px-4">
                    <div className="flex h-full items-end gap-4">
                      {(["parameters", "settings"] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setConfigTab(tab)}
                          className={`h-full border-b-2 px-1 text-sm font-semibold capitalize ${
                            configTab === tab
                              ? "border-yellow-400 text-yellow-300"
                              : "border-transparent text-white/45 hover:text-white"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={runWorkflow}
                      className="rounded bg-yellow-400 px-4 py-2 text-sm font-bold text-neutral-950 transition-colors hover:bg-yellow-300"
                    >
                      Execute step
                    </button>
                  </div>

                  <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-neutral-950 px-5 py-5">
                    {configTab === "parameters" ? (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-3 py-3 text-xs leading-relaxed text-yellow-100">
                          Tip: configure this node, connect upstream data, then execute the step to preview output.
                        </div>
                        <div className="text-white [&_.bg-green-400\\/10]:bg-green-400/10 [&_.bg-neutral-50]:bg-neutral-900 [&_.bg-red-400\\/10]:bg-red-400/10 [&_.bg-yellow-400\\/10]:bg-yellow-400/10 [&_.border-neutral-200]:border-neutral-800 [&_.dd-form-label]:text-white/65 [&_.dd-input]:border-neutral-800 [&_.dd-input]:bg-neutral-900 [&_.dd-input]:text-white [&_.dd-input]:placeholder:text-white/25 [&_.dd-select]:border-neutral-800 [&_.dd-select]:bg-neutral-900 [&_.dd-select]:text-white [&_.text-green-700]:text-green-300 [&_.text-neutral-500]:text-white/45 [&_.text-neutral-600]:text-white/60 [&_.text-red-700]:text-red-300 [&_.text-yellow-700]:text-yellow-300">
                          {renderNodeConfiguration(configNode)}
                        </div>
                      </div>
                    ) : (
                      renderConfigSettings(configNode)
                    )}
                  </div>
                </section>

              </div>
            </div>
          </div>
        </div>
      )}
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
