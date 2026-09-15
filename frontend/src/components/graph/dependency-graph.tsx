"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { GraphNode, type NodeEmphasis } from "@/components/graph/graph-node";
import { IconButton } from "@/components/ui/button";
import { FitIcon, MinusIcon, PlusIcon } from "@/components/ui/icons";
import { ancestors } from "@/lib/graph";
import { layoutGraph, NODE_HEIGHT, NODE_WIDTH } from "@/lib/graph-layout";
import type { Workspace } from "@/lib/derive";

const MIN_SCALE = 0.4;
const MAX_SCALE = 1.8;
/** Fitting a long chain to the viewport can shrink labels past readability. */
const MIN_FIT_SCALE = 0.62;
const MIN_FIT_SCALE_NARROW = 0.5;
/** Breathing room so a fitted graph starts just under the legend, not centered
 *  in whatever vertical space happens to be left. */
const TOP_ANCHOR = 24;
const EDGE_MARGIN = 20;

interface Viewport {
  scale: number;
  x: number;
  y: number;
}

export function DependencyGraph({
  workspace,
  selectedTaskId,
  onSelect,
  className,
}: {
  workspace: Workspace;
  selectedTaskId: string | null;
  onSelect: (taskId: string | null) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport>({ scale: 1, x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [panning, setPanning] = useState(false);
  const panRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );
  const selectedFromCanvas = useRef(false);

  const layout = useMemo(() => layoutGraph(workspace.graph), [workspace.graph]);

  const { downstreamIds, upstreamIds } = useMemo(() => {
    if (!selectedTaskId) return { downstreamIds: new Set<string>(), upstreamIds: new Set<string>() };
    const selected = workspace.byId.get(selectedTaskId);
    return {
      downstreamIds: new Set(selected?.downstream ?? []),
      upstreamIds: new Set(ancestors(workspace.graph, selectedTaskId)),
    };
  }, [selectedTaskId, workspace]);

  const fit = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { clientWidth, clientHeight } = container;
    if (clientWidth === 0 || clientHeight === 0) return;
    const floor = clientWidth < 640 ? MIN_FIT_SCALE_NARROW : MIN_FIT_SCALE;
    // Prefer a scale that fits both dimensions with nothing cropped. Only fall
    // back to the readability floor (and accept panning) when the graph is
    // genuinely too big to fit at a legible size.
    const naturalScale = Math.min(1.1, clientWidth / layout.width, clientHeight / layout.height);
    const scale = Math.max(floor, naturalScale);
    const overflowX = layout.width * scale > clientWidth - EDGE_MARGIN * 2;
    // Anchored near the top rather than centered: a short, wide graph should sit
    // just under the legend with room to pan below it, not float in the middle
    // of an otherwise empty canvas.
    setViewport({
      scale,
      x: overflowX ? EDGE_MARGIN : (clientWidth - layout.width * scale) / 2,
      y: TOP_ANCHOR,
    });
  }, [layout]);

  useLayoutEffect(() => {
    fit();
  }, [fit]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => fit());
    observer.observe(container);
    return () => observer.disconnect();
  }, [fit]);

  const zoomBy = useCallback((factor: number, originX?: number, originY?: number) => {
    setViewport((current) => {
      const container = containerRef.current;
      const centerX = originX ?? (container ? container.clientWidth / 2 : 0);
      const centerY = originY ?? (container ? container.clientHeight / 2 : 0);
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale * factor));
      const ratio = scale / current.scale;
      return {
        scale,
        x: centerX - (centerX - current.x) * ratio,
        y: centerY - (centerY - current.y) * ratio,
      };
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = container.getBoundingClientRect();
      if (event.ctrlKey || event.metaKey) {
        zoomBy(event.deltaY < 0 ? 1.08 : 0.93, event.clientX - rect.left, event.clientY - rect.top);
      } else {
        setViewport((current) => ({ ...current, x: current.x - event.deltaX, y: current.y - event.deltaY }));
      }
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  // Bring an externally selected node into view; clicking a node in view must not move it.
  useEffect(() => {
    const container = containerRef.current;
    const node = selectedTaskId ? layout.positions.get(selectedTaskId) : null;
    if (selectedFromCanvas.current) {
      selectedFromCanvas.current = false;
      return;
    }
    if (!container || !node) return;
    setViewport((current) => {
      const screenX = node.x * current.scale + current.x;
      const screenY = node.y * current.scale + current.y;
      const visible =
        screenX > 0 &&
        screenY > 0 &&
        screenX + NODE_WIDTH * current.scale < container.clientWidth &&
        screenY + NODE_HEIGHT * current.scale < container.clientHeight;
      if (visible) return current;
      return {
        ...current,
        x: container.clientWidth / 2 - (node.x + NODE_WIDTH / 2) * current.scale,
        y: container.clientHeight / 2 - (node.y + NODE_HEIGHT / 2) * current.scale,
      };
    });
  }, [selectedTaskId, layout]);

  const selectFromCanvas = (taskId: string) => {
    selectedFromCanvas.current = true;
    onSelect(taskId);
  };

  const edgeEmphasis = (from: string, to: string): "downstream" | "upstream" | "muted" | "normal" => {
    if (hoveredId && !selectedTaskId) {
      return from === hoveredId || to === hoveredId ? "normal" : "muted";
    }
    if (!selectedTaskId) return "normal";
    if ((from === selectedTaskId || downstreamIds.has(from)) && downstreamIds.has(to)) return "downstream";
    if ((to === selectedTaskId || upstreamIds.has(to)) && upstreamIds.has(from)) return "upstream";
    return "muted";
  };

  const nodeEmphasis = (id: string): NodeEmphasis => {
    if (!selectedTaskId) return "normal";
    if (id === selectedTaskId) return "selected";
    if (downstreamIds.has(id)) return "downstream";
    if (upstreamIds.has(id)) return "upstream";
    return "muted";
  };

  // A permanent, functional edge fade so a node that ends up flush against the
  // pane boundary (from the initial fit or from panning) reads as "canvas
  // continues here" rather than as a clipped/broken card.
  const edgeFadeStyle = {
    maskImage:
      "linear-gradient(to right, transparent 0, black 28px, black calc(100% - 28px), transparent 100%)",
    WebkitMaskImage:
      "linear-gradient(to right, transparent 0, black 28px, black calc(100% - 28px), transparent 100%)",
  };

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-base", className)}>
      <div
        ref={containerRef}
        className="h-full w-full touch-none"
        onPointerDown={(event) => {
          if (event.target !== event.currentTarget && !(event.target as Element).closest("[data-graph-surface]")) {
            return;
          }
          panRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originX: viewport.x,
            originY: viewport.y,
          };
          (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
          setPanning(true);
        }}
        onPointerMove={(event) => {
          const pan = panRef.current;
          if (!pan || pan.pointerId !== event.pointerId) return;
          setViewport((current) => ({
            ...current,
            x: pan.originX + (event.clientX - pan.startX),
            y: pan.originY + (event.clientY - pan.startY),
          }));
        }}
        onPointerUp={(event) => {
          if (panRef.current?.pointerId !== event.pointerId) return;
          panRef.current = null;
          setPanning(false);
        }}
        onPointerCancel={() => {
          panRef.current = null;
          setPanning(false);
        }}
        style={{ cursor: panning ? "grabbing" : "grab" }}
      >
        <svg width="100%" height="100%" role="presentation" style={edgeFadeStyle}>
          <rect data-graph-surface width="100%" height="100%" fill="transparent" onClick={() => onSelect(null)} />
          <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}>
            <g fill="none">
              {layout.edges.map((edge) => {
                const emphasis = edgeEmphasis(edge.from, edge.to);
                return (
                  <g key={edge.id}>
                    <path
                      d={edge.path}
                      className={cn(
                        "transition-[stroke,opacity] duration-150",
                        emphasis === "downstream"
                          ? "stroke-atrisk/70"
                          : emphasis === "upstream"
                            ? "stroke-ink-faint/70"
                            : emphasis === "muted"
                              ? "stroke-line/70"
                              : "stroke-line-strong",
                      )}
                      strokeWidth={emphasis === "downstream" ? 1.4 : 1}
                    />
                    <circle
                      cx={edge.endX}
                      cy={edge.endY}
                      r={1.8}
                      className={cn(
                        emphasis === "downstream"
                          ? "fill-atrisk/70"
                          : emphasis === "muted"
                            ? "fill-line"
                            : "fill-line-strong",
                      )}
                    />
                  </g>
                );
              })}
            </g>
            {layout.nodes.map((node) => {
              const task = workspace.byId.get(node.id);
              if (!task) return null;
              return (
                <GraphNode
                  key={node.id}
                  task={task}
                  x={node.x}
                  y={node.y}
                  emphasis={nodeEmphasis(node.id)}
                  hovered={hoveredId === node.id}
                  onSelect={selectFromCanvas}
                  onHover={setHoveredId}
                />
              );
            })}
          </g>
        </svg>
      </div>

      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <IconButton label="Zoom in" onClick={() => zoomBy(1.15)}>
          <PlusIcon width={13} height={13} />
        </IconButton>
        <IconButton label="Zoom out" onClick={() => zoomBy(0.87)}>
          <MinusIcon width={13} height={13} />
        </IconButton>
        <IconButton label="Fit graph to view" onClick={fit}>
          <FitIcon width={13} height={13} />
        </IconButton>
      </div>

      <p className="pointer-events-none absolute bottom-3 left-3 hidden pr-14 text-micro text-ink-faint sm:block">
        Drag to pan · ⌘ + scroll to zoom · click a task to trace its blast radius
      </p>
      <p className="pointer-events-none absolute bottom-3 left-3 pr-14 text-micro text-ink-faint sm:hidden">
        Drag to pan · pinch to zoom
      </p>
    </div>
  );
}
