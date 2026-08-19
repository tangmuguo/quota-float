export interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export const BOTTOM_RIGHT_MARGIN: number;
export function targetFrame(hostFrame: Frame, widgetFrame: Frame, margin?: number): Position;
export function needsMove(currentFrame: Pick<Frame, "x" | "y">, target: Position): boolean;
