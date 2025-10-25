// import React from "react";
import { INITIAL_BORDER_RADIUS } from "../utils";
import type { Pill as PillType } from "../types";

type DrawPreviewProps = {
  preview: PillType;
}

export default function DrawPreview({ preview }: DrawPreviewProps) {
  return (
    <div
      className="absolute opacity-60 border-2 border-dashed border-black/20 z-50"
      style={{
        left: preview.x,
        top: preview.y,
        width: preview.w,
        height: preview.h,
        backgroundColor: preview.color,
        borderRadius: INITIAL_BORDER_RADIUS,
      }}
    />
  );
}
