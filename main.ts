import { createCanvas } from "https://deno.land/x/canvas@v1.4.1/mod.ts";
import { drawPoints, drawSegments } from "./draw.ts";
import { readLines } from "https://deno.land/std@0.133.0/io/buffer.ts";
import { comparePoint, isCollinear, Point, slope } from "./point.ts";
import { LineSegment } from "./line-segment.ts";

function slopeSortedBasedSearch(points: Point[]): LineSegment[] {
  const lineSegments: LineSegment[] = [];
  for (let i = 0; i < points.length -1; i++) {
    const arr: { s: number; point: Point }[] = [];
    const p = points[i];
    for (let j = i+1; j < points.length; j++) {
        arr.push({ s: slope(p, points[j]), point: points[j] });
    }
    arr.sort((a, b) => {
      if (a.s > b.s) {
        return -1;
      } else if (a.s < b.s) {
        return 1;
      }
      return 0;
    });
    const [first, ...rest] = arr;
    const last = rest.reduce(
      (acc, item) => {
        if (item.s === acc.slope) {
          acc.points.push(item.point);
        } else { // 斜率变化了
          if (acc.points.length >= 3) {
            acc.points.push(p);
            acc.points.sort(comparePoint);
            lineSegments.push([
              acc.points[0],
              acc.points[acc.points.length - 1],
            ]);
          }
          acc.slope = item.s;
          acc.points = [item.point];
        }
        return acc;
      },
      {
        slope: first.s,
        points: [first.point],
      },
    );
    if (last.points.length >= 3) {
      last.points.push(p)
      last.points.sort(comparePoint);
      lineSegments.push(
        [
          last.points[0],
          last.points[last.points.length - 1],
        ],
      );
    }
  }
  return mergeLineSegments(lineSegments);
}

function mapBasedSearch(points: readonly Point[]) {
  const lines: LineSegment[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    // 搜集相同斜率对应的点
    const slopes = new Map<number, Point[]>();
    for (let j = i + 1; j < points.length; j++) {
      const q = points[j];
      const s = slope(p, q);

      if (slopes.has(s)) {
        slopes.get(s)?.push(q);
      } else {
        slopes.set(s, [q]);
      }
    }
    for (const ps of slopes.values()) {
      if (ps.length >= 3) {
        ps.push(p);
        ps.sort(comparePoint);
        lines.push([ps[0], ps[ps.length - 1]]);
      }
    }
  }
  return mergeLineSegments(lines);
}

function bruteforceSearch(points: Point[]): LineSegment[] {
  const lineSegments: LineSegment[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      for (let k = j + 1; k < points.length; k++) {
        for (let l = k + 1; l < points.length; l++) {
          if (isCollinear(points[i], points[j], points[k], points[l])) {
            const arr = [points[i], points[j], points[k], points[l]].sort(
              comparePoint,
            );
            lineSegments.push([arr[0], arr[3]]);
          }
        }
      }
    }
  }
  return mergeLineSegments(lineSegments);
}

async function drawToFile(
  fileName: string,
  lines: LineSegment[],
  points: Point[],
) {
  const canvasSize = 500;
  // 最大的数据点
  const max = 32767;
  const canvas = createCanvas(canvasSize, canvasSize);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  function translatePoint(p: Point) {
    const [x, y] = p;
    return [
      (x / max) * (canvasSize - 1) + 1, // 将x变换到[1~canvasSize-1]
      canvasSize - ((y / max) * (canvasSize - 1) + 1), // 将y变换到[canvasSize-1,1]
    ] as Point;
  }

  drawPoints(ctx, points.map(translatePoint));
  drawSegments(
    ctx,
    lines.map((line) => {
      const [p, q] = line;
      return [translatePoint(p), translatePoint(q)];
    }),
  );
  ctx.fillStyle = "black";
  ctx.fillText("Lines:" + lines.length, 0, 10);
  await Deno.writeFile(fileName, canvas.toBuffer());
}

async function main() {
  const lines = readLines(Deno.stdin);

  const [num, filename] = (await lines.next()).value.split(/\s+/);
  console.log(`共:${num}个点`);
  let points: Point[] = [];
  for await (let line of lines) {
    let point = line.split(" ").filter((s) => s !== "");
    points.push([Number(point[0]), Number(point[1])]);
  }

  console.time("slope sorted based search");
  const segments1 = slopeSortedBasedSearch(points);
  console.timeEnd("slope sorted based search");

  console.time("map search");
  const segments2 = mapBasedSearch(points);
  console.timeEnd("map search");

  await drawToFile(`output/${filename}_1.png`, segments1, points);
  await drawToFile(`output/${filename}_2.png`, segments2, points);

  // 如果数据点较多就不使用暴力搜索了，太慢
  if (+num <= 200) {
    console.time("brute force search");
    const segments3 = bruteforceSearch(points);
    console.timeEnd("brute force search");
    await drawToFile(`output/${filename}_3.png`, segments3, points);
  }
}

/**
 * 计算线段所在直线在Y轴上的截距
 */
function interceptY(line: LineSegment) {
  const [p, q] = line;
  const s = slope(p, q);
  const [x, y] = p;
  return y - s * x;
}

/**
 * 合并线段
 */
function mergeSegment(a: LineSegment, b: LineSegment) {
  const [p1, p2] = a;
  const [p3, p4] = b;
  const points = [p1, p2, p3, p4];
  let min = p1;
  let max = p1;
  for (const p of points) {
    if (comparePoint(p, min) < 0) {
      min = p;
    }
    if (comparePoint(p, max) > 0) {
      max = p;
    }
  }
  return [min, max] as LineSegment;
}

/**
 * 合并共线的线段
 */
function mergeLineSegments(segments: LineSegment[]): LineSegment[] {
  const colinearLines: Record<string, LineSegment> = {};
  for (const seg of segments) {
    const s = slope(seg[0], seg[1]);
    let key = `${s}`;
    if (s === 0) {
      // 水平，y相同的线段才需要被合并
      const [[, y]] = seg;
      key += "-" + y;
    } else if (s === Number.POSITIVE_INFINITY) {
      // 垂直，x相同的线段才需要被合并
      const [[x]] = seg;
      key += "-" + x;
    } else {
      // 斜线，在y轴的截距相同的线才需要合并
      key = `${s}-${interceptY(seg)}`;
    }
    if (colinearLines[key] == null) {
      colinearLines[key] = seg;
    } else {
      colinearLines[key] = mergeSegment(seg, colinearLines[key]);
    }
  }
  return Object.values(colinearLines);
}

main();
