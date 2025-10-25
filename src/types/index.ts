export type Radii = {
  tl: number;
  tr: number;
  br: number;
  bl: number;
}

export type Pill = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  radii?: Radii;
}

export type Cursor = {
  x: number;
  y: number;
}

export type DraggingState = {
  id: string;
  offsetX: number;
  offsetY: number;
}