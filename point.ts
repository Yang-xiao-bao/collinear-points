export type Point = [x: number, y: number];

export function comparePoint(p0: Point, p1: Point): number {
  const [x0, y0] = p0;
  const [x1, y1] = p1;
  if (x0 === x1 && y0 === y1) {
    return 0;
  }
  if (y0 < y1 || (y0 === y1 && x0 < x1)) {
    return -1;
  }
  return 1;
}

export function slope(p0: Point, p1: Point): number {
  const [x0, y0] = p0;
  const [x1, y1] = p1;
  if (x0 === x1 && y0 === y1) {
    return Number.NEGATIVE_INFINITY;
  }
  if (x0 - x1 === 0) {
    return Number.POSITIVE_INFINITY;
  }
  return (y1 - y0) / (x1 - x0);
}
/** 是否共线，假设参数中的4点各不相同 */
export function isCollinear(p: Point, q: Point, r: Point, s: Point): boolean {
  const s1 = slope(p, q);
  const s2 = slope(p, r);
  const s3 = slope(p, s);
  return s1 === s2 && s1 === s3;
}
