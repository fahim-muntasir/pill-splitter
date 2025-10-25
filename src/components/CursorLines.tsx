// import React from "react";

type CursorLinesProps = {
  cursorX: number;
  cursorY: number;
}

export default function CursorLines({ cursorX, cursorY }: CursorLinesProps) {
  return (
    <>
      <div
        className="absolute top-0 bottom-0 bg-black/12 pointer-events-none z-[100]"
        style={{ left: cursorX - 1, width: 2 }}
      />
      <div
        className="absolute left-0 right-0 bg-black/12 pointer-events-none z-[100]"
        style={{ top: cursorY - 1, height: 2 }}
      />
    </>
  );
}
