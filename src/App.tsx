import React, { useState, useRef, useEffect } from "react";
import type { Cursor, DraggingState, Pill } from "./types/";
import {
  INITIAL_BORDER_RADIUS,
  MIN_PILL,
  MIN_PART,
  rndColor,
  uid,
  intersectsV,
  intersectsH,
  computeRadii,
} from "./utils";
import CursorLines from "./components/CursorLines";
import SinglePill from "./components/Pill";
import DrawPreview from "./components/DrawPreview";

export default function App() {
  const [pills, setPills] = useState<Pill[]>([]);
  const [cursor, setCursor] = useState<Cursor>({ x: 200, y: 200 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Cursor | null>(null);
  const [drawPreview, setDrawPreview] = useState<Pill | null>(null);
  const [dragging, setDragging] = useState<DraggingState | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const movedRef = useRef(false);
  const clickPosRef = useRef<Cursor | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCursor({ x, y });
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const CLICK_MOVE_THRESHOLD = 5;

  /* ---------- POINTER HANDLERS ON CONTAINER ---------- */

  const onPointerDownContainer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    clickPosRef.current = { x, y };
    setDrawStart({ x, y });
    setIsDrawing(true);
    setDrawPreview({
      id: uid(),
      x,
      y,
      w: 0,
      h: 0,
      color: rndColor(),
    });
    movedRef.current = false;
  };

  const onPointerMoveContainer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - drawStart.x;
    const dy = y - drawStart.y;
    if (!movedRef.current && (Math.abs(dx) > CLICK_MOVE_THRESHOLD || Math.abs(dy) > CLICK_MOVE_THRESHOLD)) {
      movedRef.current = true;
    }

    if (movedRef.current) {
      const w = dx;
      const h = dy;
      setDrawPreview((prev) => (prev ? { ...prev, w, h } : null));
    }
  };

  const onPointerUpContainer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!movedRef.current) {
      performSplit(x, y);
    } else if (isDrawing && drawPreview) {
      if (Math.abs(drawPreview.w) >= MIN_PILL && Math.abs(drawPreview.h) >= MIN_PILL) {
        const newPill: Pill = {
          id: uid(),
          x: Math.round(drawPreview.w < 0 ? drawPreview.x + drawPreview.w : drawPreview.x),
          y: Math.round(drawPreview.h < 0 ? drawPreview.y + drawPreview.h : drawPreview.y),
          w: Math.abs(Math.round(drawPreview.w)),
          h: Math.abs(Math.round(drawPreview.h)),
          color: drawPreview.color,
          radii: {
            tl: INITIAL_BORDER_RADIUS,
            tr: INITIAL_BORDER_RADIUS,
            br: INITIAL_BORDER_RADIUS,
            bl: INITIAL_BORDER_RADIUS,
          },
        };
        setPills((s) => [...s, newPill]);
      }
    }

    // Reset drawing state
    setIsDrawing(false);
    setDrawStart(null);
    setDrawPreview(null);
    movedRef.current = false;
  };

  /* ---------- DRAG HANDLERS ---------- */

  const onPointerDownPart = (e: React.PointerEvent<HTMLDivElement>, part: Pill) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    setDragging({
      id: part.id,
      offsetX: clientX - part.x,
      offsetY: clientY - part.y,
    });
    setPills((prev) => {
      const without = prev.filter((p) => p.id !== part.id);
      const found = prev.find((p) => p.id === part.id);
      return found ? [...without, found] : prev;
    });
    movedRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMoveWindow = (e: PointerEvent) => {
    if (!dragging || !containerRef.current) return;
    movedRef.current = true;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    setPills((prev) =>
      prev.map((p) =>
        p.id === dragging.id
          ? {
            ...p,
            x: Math.max(0, Math.round(clientX - dragging.offsetX)),
            y: Math.max(0, Math.round(clientY - dragging.offsetY)),
          }
          : p
      )
    );
  };

  const onPointerUpPart = (e: PointerEvent) => {
    if (dragging) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        console.error("onPointerUpPart error");
      }
      setDragging(null);
    }
  };

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMoveWindow);
    window.addEventListener("pointerup", onPointerUpPart);
    return () => {
      window.removeEventListener("pointermove", onPointerMoveWindow);
      window.removeEventListener("pointerup", onPointerUpPart);
    };
  }, [dragging]);

  /* ---------- SPLIT LOGIC ---------- */
  function performSplit(vx: number, hy: number) {
    setPills((prev) => {
      const next: Pill[] = [];
      for (const p of prev) {
        const hitV = intersectsV(p, vx);
        const hitH = intersectsH(p, hy);

        if (!hitV && !hitH) {
          next.push(p);
          continue;
        }

        if (hitV && hitH) {
          const leftW = Math.round(vx - p.x);
          const rightW = Math.round(p.x + p.w - vx);
          const topH = Math.round(hy - p.y);
          const bottomH = Math.round(p.y + p.h - hy);

          const partsWouldBe = [
            { w: leftW, h: topH },
            { w: rightW, h: topH },
            { w: leftW, h: bottomH },
            { w: rightW, h: bottomH },
          ];
          const anyTooSmall = partsWouldBe.some(
            (pp) => pp.w < MIN_PART || pp.h < MIN_PART
          );
          if (anyTooSmall) {
            const moveToRight = rightW > leftW;
            const moveToBottom = bottomH > topH;
            const newX = moveToRight ? vx + 2 : Math.max(0, vx - p.w - 2);
            const newY = moveToBottom ? hy + 2 : Math.max(0, hy - p.h - 2);
            next.push({ ...p, x: newX, y: newY });
            continue;
          }

          const parts: Pill[] = [
            { id: uid(), x: p.x, y: p.y, w: leftW, h: topH, color: p.color },
            { id: uid(), x: vx, y: p.y, w: rightW, h: topH, color: p.color },
            { id: uid(), x: p.x, y: hy, w: leftW, h: bottomH, color: p.color },
            { id: uid(), x: vx, y: hy, w: rightW, h: bottomH, color: p.color },
          ];
          for (const prt of parts) {
            prt.radii = computeRadii(p, prt);
            next.push(prt);
          }
          continue;
        }

        if (hitV) {
          const leftW = Math.round(vx - p.x);
          const rightW = Math.round(p.x + p.w - vx);
          if (leftW < MIN_PART || rightW < MIN_PART) {
            const moveToRight = rightW > leftW;
            const newX = moveToRight ? vx + 2 : Math.max(0, vx - p.w - 2);
            next.push({ ...p, x: newX });
            continue;
          }
          const left: Pill = {
            id: uid(),
            x: p.x,
            y: p.y,
            w: leftW,
            h: p.h,
            color: p.color,
            radii: computeRadii(p, { id: "", x: p.x, y: p.y, w: leftW, h: p.h, color: p.color }),
          };
          const right: Pill = {
            id: uid(),
            x: vx,
            y: p.y,
            w: rightW,
            h: p.h,
            color: p.color,
            radii: computeRadii(p, { id: "", x: vx, y: p.y, w: rightW, h: p.h, color: p.color }),
          };
          next.push(left, right);
          continue;
        }

        if (hitH) {
          const topH = Math.round(hy - p.y);
          const bottomH = Math.round(p.y + p.h - hy);
          if (topH < MIN_PART || bottomH < MIN_PART) {
            const moveToBottom = bottomH > topH;
            const newY = moveToBottom ? hy + 2 : Math.max(0, hy - p.h - 2);
            next.push({ ...p, y: newY });
            continue;
          }
          const top: Pill = {
            id: uid(),
            x: p.x,
            y: p.y,
            w: p.w,
            h: topH,
            color: p.color,
            radii: computeRadii(p, { id: "", x: p.x, y: p.y, w: p.w, h: topH, color: p.color }),
          };
          const bottom: Pill = {
            id: uid(),
            x: p.x,
            y: hy,
            w: p.w,
            h: bottomH,
            color: p.color,
            radii: computeRadii(p, { id: "", x: p.x, y: hy, w: p.w, h: bottomH, color: p.color }),
          };
          next.push(top, bottom);
          continue;
        }

        next.push(p);
      }
      return next;
    });
  }

  return (
    <div className="min-h-screen w-full">
      <div
        ref={containerRef}
        className="relative bg-gray-50 border overflow-hidden w-screen h-screen"
        style={{
          cursor: dragging ? "pointer" : "crosshair",
          backgroundImage: `
      radial-gradient(circle 1px at center, #cbd5e15d 1px, transparent 1px),
      radial-gradient(circle 1px at center, #cbd5e15d 1px, transparent 1px)
    `,
          backgroundPosition: '0 0, 20px 20px',
          backgroundSize: '20px 20px, 20px 20px',
        }}
        onPointerDown={onPointerDownContainer}
        onPointerMove={onPointerMoveContainer}
        onPointerUp={onPointerUpContainer}
      >
        <CursorLines cursorX={cursor.x} cursorY={cursor.y} />

        {pills.map((p) => (
          <SinglePill key={p.id} pill={p} onPointerDown={onPointerDownPart} />
        ))}


        {isDrawing && drawPreview && <DrawPreview preview={drawPreview} />}
      </div>
    </div>
  );
}
