// ============================================================================
// High-Performance Math Utilities & Zero-Allocation Spatial Hash Grid
// ============================================================================

const TAU = Math.PI * 2;
const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

function angleDiff(a, b) {
  let d = (b - a + Math.PI) % TAU;
  if (d < 0) d += TAU;
  return d - Math.PI;
}

function distSq(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

// Distance squared from point (px, py) to line segment (x1,y1)-(x2,y2)
function pointToSegmentDistSq(px, py, x1, y1, x2, y2) {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const wx = px - x1;
  const wy = py - y1;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return wx * wx + wy * wy;
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) {
    const dx = px - x2;
    const dy = py - y2;
    return dx * dx + dy * dy;
  }
  const b = c1 / c2;
  const bx = x1 + b * vx;
  const by = y1 + b * vy;
  const dx = px - bx;
  const dy = py - by;
  return dx * dx + dy * dy;
}

function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m < 10 ? '0' + m : m}:${r < 10 ? '0' + r : r}`;
}

// Fast swap-and-pop removal from array in O(1) without GC splice shifts
function swapPop(arr, idx) {
  const last = arr.length - 1;
  if (idx < last) arr[idx] = arr[last];
  arr.pop();
}

// Zero-allocation Int32Array Spatial Hash Grid
class SpatialHashGrid {
  constructor(cellSize = 96, bucketCount = 4096, maxEntities = 4096) {
    this.cellSize = cellSize;
    this.invCell = 1 / cellSize;
    this.mask = bucketCount - 1; // bucketCount MUST be power of 2
    this.heads = new Int32Array(bucketCount);
    this.next = new Int32Array(maxEntities);
    this.cellX = new Int32Array(maxEntities);
    this.cellY = new Int32Array(maxEntities);
    this.queryBuf = [];
    this.visitedStamp = new Int32Array(maxEntities);
    this.stamp = 1;
  }

  ensureCapacity(count) {
    if (count <= this.next.length) return;
    let cap = this.next.length;
    while (cap < count) cap *= 2;
    this.next = new Int32Array(cap);
    this.cellX = new Int32Array(cap);
    this.cellY = new Int32Array(cap);
    this.visitedStamp = new Int32Array(cap);
  }

  clear() {
    this.heads.fill(-1);
  }

  _hash(cx, cy) {
    return ((cx * 73856093) ^ (cy * 19349663)) & this.mask;
  }

  insert(index, x, y) {
    const cx = Math.floor(x * this.invCell);
    const cy = Math.floor(y * this.invCell);
    const h = this._hash(cx, cy);
    this.cellX[index] = cx;
    this.cellY[index] = cy;
    this.next[index] = this.heads[h];
    this.heads[h] = index;
  }

  // Populates and returns internal reusable buffer of entity indices near (x, y) within radius r
  queryCircle(entities, x, y, r) {
    const out = this.queryBuf;
    out.length = 0;
    const minCx = Math.floor((x - r) * this.invCell);
    const maxCx = Math.floor((x + r) * this.invCell);
    const minCy = Math.floor((y - r) * this.invCell);
    const maxCy = Math.floor((y + r) * this.invCell);
    this.stamp = (this.stamp + 1) | 0;
    if (this.stamp === 0) {
      this.visitedStamp.fill(0);
      this.stamp = 1;
    }
    const stamp = this.stamp;

    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const h = this._hash(cx, cy);
        for (let i = this.heads[h]; i !== -1; i = this.next[i]) {
          if (this.visitedStamp[i] === stamp) continue;
          if (this.cellX[i] !== cx || this.cellY[i] !== cy) continue;
          this.visitedStamp[i] = stamp;
          const e = entities[i];
          if (!e || e.dead) continue;
          const rr = r + (e.radius || 0);
          const dx = e.x - x;
          const dy = e.y - y;
          if (dx * dx + dy * dy <= rr * rr) {
            out.push(e);
          }
        }
      }
    }
    return out;
  }

  findNearest(entities, x, y, maxRange, excludeSet = null) {
    const candidates = this.queryCircle(entities, x, y, maxRange);
    let best = null;
    let bestD2 = maxRange * maxRange;
    for (let i = 0; i < candidates.length; i++) {
      const e = candidates[i];
      if (excludeSet && excludeSet.has(e.uid)) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = e;
      }
    }
    return best;
  }
}
