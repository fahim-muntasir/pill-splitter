import React from "react";
import type { Pill as PillType } from "../types";
import { INITIAL_BORDER_RADIUS } from "../utils";

type PillProps = {
  pill: PillType;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, pill: PillType) => void;
}

export default function Pill({ pill, onPointerDown }: PillProps) {
  return (
    <div
      className="absolute border border-black/16 box-border select-none z-10 flex items-center justify-center opacity-60 cursor-grab"
      style={{
        left: pill.x,
        top: pill.y,
        width: pill.w,
        height: pill.h,
        backgroundColor: pill.color,
        borderTopLeftRadius: pill.radii?.tl ?? INITIAL_BORDER_RADIUS,
        borderTopRightRadius: pill.radii?.tr ?? INITIAL_BORDER_RADIUS,
        borderBottomRightRadius: pill.radii?.br ?? INITIAL_BORDER_RADIUS,
        borderBottomLeftRadius: pill.radii?.bl ?? INITIAL_BORDER_RADIUS,
      }}
      onPointerDown={(e) => onPointerDown(e, pill)}
    />
  );
}
