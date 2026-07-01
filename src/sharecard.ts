// Renders a spoiler-free 1080×1080 result image for sharing — the solve path as
// coloured tiles plus stars/score/time, but never the link word or the level
// title (which would give the answer away). Returns a PNG blob, or null if the
// canvas isn't available.

export interface ShareCardData {
  level: number;
  daily: boolean;
  won: boolean;
  stars: number;
  score: number;
  mistakes: number;
  linkCorrect: boolean;
  timeMs: number;
  colors: string[]; // tile tints in solve order
}

function fmtTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang) * rad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

export async function renderShareCard(d: ShareCardData): Promise<Blob | null> {
  try {
    const S = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, S, S);
    bg.addColorStop(0, "#faf5ea");
    bg.addColorStop(1, "#f1e6cf");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, S, S);

    // Soft glow
    const glow = ctx.createRadialGradient(S / 2, 360, 40, S / 2, 360, 520);
    glow.addColorStop(0, "rgba(217,72,43,0.10)");
    glow.addColorStop(1, "rgba(217,72,43,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, S, S);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Wordmark
    ctx.fillStyle = "#26221a";
    ctx.font = "700 64px Georgia, 'Times New Roman', serif";
    ctx.fillText("◆ WordGrid", S / 2, 120);

    ctx.fillStyle = "#6f6757";
    ctx.font = "600 36px Arial, sans-serif";
    ctx.fillText(d.daily ? "Daily Challenge" : `Level ${d.level}`, S / 2, 188);

    // Stars (or a cross for a loss)
    if (d.won) {
      const sr = 56;
      const gap = 150;
      const startX = S / 2 - gap;
      for (let i = 0; i < 3; i++) {
        star(ctx, startX + i * gap, 300, sr, i < d.stars ? "#eda820" : "rgba(38,34,26,0.15)");
      }
    } else {
      ctx.fillStyle = "#d9482b";
      ctx.font = "700 90px Arial, sans-serif";
      ctx.fillText("✕ ✕ ✕", S / 2, 300);
    }

    // Solve-path tiles
    const n = Math.max(1, d.colors.length);
    const tile = 150;
    const tgap = 28;
    const totalW = n * tile + (n - 1) * tgap;
    let tx = (S - totalW) / 2;
    const ty = 430;
    for (let i = 0; i < n; i++) {
      const c = d.colors[i] ?? "#64748b";
      ctx.save();
      ctx.shadowColor = c;
      ctx.shadowBlur = 28;
      roundRect(ctx, tx, ty, tile, tile, 30);
      ctx.fillStyle = c;
      ctx.fill();
      ctx.restore();
      tx += tile + tgap;
    }

    // Score pill
    roundRect(ctx, S / 2 - 220, 660, 440, 96, 48);
    ctx.fillStyle = "rgba(237,168,32,0.18)";
    ctx.fill();
    ctx.fillStyle = "#8a5c00";
    ctx.font = "800 52px Arial, sans-serif";
    ctx.fillText(`✦ ${d.score.toLocaleString()} pts`, S / 2, 710);

    // Detail line
    ctx.fillStyle = "#26221a";
    ctx.font = "600 40px Arial, sans-serif";
    const link = d.won ? (d.linkCorrect ? "🔑 link ✓" : "link ✗") : "so close";
    ctx.fillText(`${link}    ⏱ ${fmtTime(d.timeMs)}${d.mistakes ? `    ✕ ${d.mistakes}` : ""}`, S / 2, 800);

    // Footer
    ctx.fillStyle = "#d9482b";
    ctx.font = "600 34px Arial, sans-serif";
    ctx.fillText("Play free → wordgrid", S / 2, 980);

    return await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
  } catch {
    return null;
  }
}
