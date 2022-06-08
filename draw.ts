import { Point } from "./point.ts";
import { CanvasRenderingContext2D } from "https://deno.land/x/canvas@v1.4.1/mod.ts";
import { LineSegment } from "./line-segment.ts";
export function drawPoints(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.save();
  ctx.fillStyle = "red";

  for (const [x, y] of points) {
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      2,
      2,
      0,
      0,
      2 * Math.PI,
    );
    ctx.fill();
  }

  ctx.restore();
}

export function drawSegments(
  ctx: CanvasRenderingContext2D,
  segments: LineSegment[],
) {
  ctx.save();
  ctx.beginPath();
  for (const [p, q] of segments) {
    ctx.moveTo(p[0], p[1]);
    ctx.lineTo(q[0], q[1]);
  }
  ctx.strokeStyle = "blue";
  ctx.stroke();
  ctx.restore();
}
