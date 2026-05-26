import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GitFork, Circle, Unlink } from "lucide-react";

interface NoteItem {
  id: number;
  title: string;
  content: string;
  notebook_id: number | null;
  is_pinned: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  color: string;
  word_count: number;
  char_count: number;
  reading_time_minutes: number;
  is_daily_note: boolean;
  daily_date: string | null;
  created_at: string;
  updated_at: string;
}

interface NoteLinkItem {
  id: number;
  source_note_id: number;
  target_note_id: number;
  created_at: string;
}

interface GraphNode {
  id: number;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
}

interface GraphEdge {
  source: number;
  target: number;
}

interface Props {
  notes: NoteItem[];
  links: NoteLinkItem[];
  onNoteSelect: (noteId: number) => void;
}

const PASTEL_COLORS = [
  "#F7C948", "#4ADE80", "#60A5FA", "#F472B6", "#A78BFA",
  "#FB923C", "#2DD4BF", "#E879F9", "#FCA5A5", "#93C5FD",
];

function getNotebookColor(notebookId: number | null): string {
  if (notebookId === null) return "#a3a3a3";
  return PASTEL_COLORS[notebookId % PASTEL_COLORS.length];
}

export default function GraphView({ notes, links, onNoteSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Camera state
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, camStartX: 0, camStartY: 0 });
  const nodeDragRef = useRef<{ node: GraphNode | null; offsetX: number; offsetY: number }>({
    node: null,
    offsetX: 0,
    offsetY: 0,
  });

  // Build nodes & edges
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);

  const noteIdSet = useMemo(() => new Set(notes.map((n) => n.id)), [notes]);

  // Initialize graph data
  useEffect(() => {
    const w = containerRef.current?.clientWidth ?? 800;
    const h = containerRef.current?.clientHeight ?? 600;

    nodesRef.current = notes.map((n) => ({
      id: n.id,
      title: n.title || "Untitled",
      x: w / 2 + (Math.random() - 0.5) * Math.min(w, 600),
      y: h / 2 + (Math.random() - 0.5) * Math.min(h, 400),
      vx: 0,
      vy: 0,
      color: n.color && n.color !== "" ? n.color : getNotebookColor(n.notebook_id),
      radius: 8 + Math.min(n.word_count / 100, 12),
    }));

    edgesRef.current = links
      .filter((l) => noteIdSet.has(l.source_note_id) && noteIdSet.has(l.target_note_id))
      .map((l) => ({ source: l.source_note_id, target: l.target_note_id }));

    // Center camera
    cameraRef.current = { x: 0, y: 0, zoom: 1 };
  }, [notes, links, noteIdSet]);

  // Stats
  const stats = useMemo(() => {
    const connectedIds = new Set<number>();
    const validLinks = links.filter(
      (l) => noteIdSet.has(l.source_note_id) && noteIdSet.has(l.target_note_id)
    );
    validLinks.forEach((l) => {
      connectedIds.add(l.source_note_id);
      connectedIds.add(l.target_note_id);
    });
    const orphans = notes.filter((n) => !connectedIds.has(n.id)).length;
    return {
      totalNodes: notes.length,
      totalConnections: validLinks.length,
      orphans,
    };
  }, [notes, links, noteIdSet]);

  // Screen coords → world coords
  const screenToWorld = useCallback((sx: number, sy: number) => {
    const cam = cameraRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return { x: sx, y: sy };
    return {
      x: (sx - canvas.width / 2) / cam.zoom + cam.x,
      y: (sy - canvas.height / 2) / cam.zoom + cam.y,
    };
  }, []);

  // Find node at position
  const findNodeAt = useCallback(
    (wx: number, wy: number): GraphNode | null => {
      const nodes = nodesRef.current;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const dx = wx - n.x;
        const dy = wy - n.y;
        if (dx * dx + dy * dy <= (n.radius + 4) * (n.radius + 4)) return n;
      }
      return null;
    },
    []
  );

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const tick = () => {
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const cam = cameraRef.current;

      if (nodes.length === 0) {
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#525252";
        ctx.font = "14px Manrope, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("No notes to visualize", canvas.width / 2, canvas.height / 2);
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      // Build adjacency for quick lookup
      const adjMap = new Map<number, number[]>();
      for (const n of nodes) adjMap.set(n.id, []);
      for (const e of edges) {
        adjMap.get(e.source)?.push(e.target);
        adjMap.get(e.target)?.push(e.source);
      }

      // Force simulation
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Repulsion (nodes push each other away)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const repulse = 800 / (dist * dist);
          const fx = (dx / dist) * repulse;
          const fy = (dy / dist) * repulse;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }

      // Attraction (linked nodes pull toward each other)
      const springLen = 120;
      const springK = 0.01;
      for (const e of edges) {
        const a = nodes.find((n) => n.id === e.source);
        const b = nodes.find((n) => n.id === e.target);
        if (!a || !b) continue;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - springLen) * springK;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }

      // Center gravity
      for (const n of nodes) {
        const dx = centerX - n.x;
        const dy = centerY - n.y;
        n.vx += dx * 0.0003;
        n.vy += dy * 0.0003;
      }

      // Apply velocity with damping
      for (const n of nodes) {
        if (nodeDragRef.current.node?.id === n.id) {
          n.vx = 0;
          n.vy = 0;
          continue;
        }
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x += n.vx;
        n.y += n.vy;
      }

      // Render
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x, -cam.y);

      // Edges
      const hovId = hoveredNode?.id ?? -1;
      const hovConnected = new Set(adjMap.get(hovId) ?? []);

      for (const e of edges) {
        const a = nodes.find((n) => n.id === e.source);
        const b = nodes.find((n) => n.id === e.target);
        if (!a || !b) continue;

        const isHighlight =
          hovId >= 0 && (e.source === hovId || e.target === hovId);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = isHighlight ? "#F7C948" : "rgba(82,82,82,0.4)";
        ctx.lineWidth = isHighlight ? 2 : 1;
        ctx.stroke();
      }

      // Nodes
      for (const n of nodes) {
        const isHovered = n.id === hovId;
        const isConnected = hovConnected.has(n.id);
        const dim = hovId >= 0 && !isHovered && !isConnected;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = dim ? `${n.color}44` : n.color;
        ctx.fill();

        if (isHovered) {
          ctx.strokeStyle = "#F7C948";
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Title label
        const fontSize = Math.max(10, 12 / cam.zoom);
        ctx.font = `600 ${fontSize}px Manrope, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = dim ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.8)";
        const label =
          n.title.length > 16 ? n.title.slice(0, 14) + "…" : n.title;
        ctx.fillText(label, n.x, n.y + n.radius + fontSize + 2);
      }

      ctx.restore();

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [hoveredNode]);

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const w = screenToWorld(sx, sy);
      const node = findNodeAt(w.x, w.y);

      if (node) {
        nodeDragRef.current = {
          node,
          offsetX: w.x - node.x,
          offsetY: w.y - node.y,
        };
      } else {
        dragRef.current = {
          isDragging: true,
          startX: sx,
          startY: sy,
          camStartX: cameraRef.current.x,
          camStartY: cameraRef.current.y,
        };
      }
    },
    [screenToWorld, findNodeAt]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      // Node drag
      if (nodeDragRef.current.node) {
        const w = screenToWorld(sx, sy);
        nodeDragRef.current.node.x = w.x - nodeDragRef.current.offsetX;
        nodeDragRef.current.node.y = w.y - nodeDragRef.current.offsetY;
        return;
      }

      // Pan drag
      if (dragRef.current.isDragging) {
        const dx = sx - dragRef.current.startX;
        const dy = sy - dragRef.current.startY;
        const cam = cameraRef.current;
        cam.x = dragRef.current.camStartX - dx / cam.zoom;
        cam.y = dragRef.current.camStartY - dy / cam.zoom;
        return;
      }

      // Hover detection
      const w = screenToWorld(sx, sy);
      const node = findNodeAt(w.x, w.y);
      setHoveredNode(node);
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [screenToWorld, findNodeAt]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (nodeDragRef.current.node) {
        // Detect click vs drag
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const sx = e.clientX - rect.left;
          const sy = e.clientY - rect.top;
          const w = screenToWorld(sx, sy);
          const nodeAtPos = findNodeAt(w.x, w.y);
          if (
            nodeAtPos &&
            nodeAtPos.id === nodeDragRef.current.node.id &&
            Math.abs(nodeDragRef.current.offsetX) < 2 &&
            Math.abs(nodeDragRef.current.offsetY) < 2
          ) {
            onNoteSelect(nodeAtPos.id);
          }
        }
        nodeDragRef.current = { node: null, offsetX: 0, offsetY: 0 };
        return;
      }
      dragRef.current.isDragging = false;
    },
    [screenToWorld, findNodeAt, onNoteSelect]
  );

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const cam = cameraRef.current;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    cam.zoom = Math.max(0.2, Math.min(5, cam.zoom * factor));
  }, []);


  return (
    <div className="flex h-full flex-col bg-neutral-950 animate-in fade-in zoom-in-95 duration-300">
      {/* Stats Bar */}
      <div className="flex items-center gap-6 border-b border-neutral-800 bg-neutral-900/60 px-6 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Circle className="h-4 w-4 text-yellow-400" />
          <span className="font-semibold text-white">{stats.totalNodes}</span>
          <span className="text-white/50">nodes</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <GitFork className="h-4 w-4 text-blue-400" />
          <span className="font-semibold text-white">{stats.totalConnections}</span>
          <span className="text-white/50">connections</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Unlink className="h-4 w-4 text-red-400" />
          <span className="font-semibold text-white">{stats.orphans}</span>
          <span className="text-white/50">orphans</span>
        </div>
        <div className="ml-auto text-xs text-white/40">
          Scroll to zoom · Drag to pan · Click node to open
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            dragRef.current.isDragging = false;
            nodeDragRef.current = { node: null, offsetX: 0, offsetY: 0 };
            setHoveredNode(null);
          }}
          onWheel={handleWheel}
        />

        {/* Tooltip */}
        {hoveredNode && (
          <div
            className="pointer-events-none absolute z-50 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-semibold text-white shadow-xl"
            style={{
              left: tooltipPos.x + 12,
              top: tooltipPos.y - 8,
            }}
          >
            {hoveredNode.title}
          </div>
        )}
      </div>
    </div>
  );
}
