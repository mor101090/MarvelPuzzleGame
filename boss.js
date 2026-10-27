// =====================
// Boss levels
// תמונה שבורה לשברים. השברים מפוזרים על במה, לחיצה על שבר מסובבת אותו,
// גרירה מזיזה אותו, ושברים שמתחברים נכון אחד לשני מתאחדים לחלק אחד.
// אין נעילה למקום קבוע: ההדבקה היא רק בין שבר לשבר.
// =====================

// בוס אחד לכל קבוצה של 10 שלבים. cols = כמה עמודות בסיס לחיתוך (השורות לפי יחס התמונה)
const bosses = [
  { id: "1", cols: 3 }
].map(b => ({
  ...b,
  image: `assets/bosses/${b.id}.webp`,
  thumb: `assets/bosses/thumbs/${b.id}.webp`
}));

const bossWrap = document.getElementById("bossWrap");
const bossStage = document.getElementById("bossStage");
const bossMovesEl = document.getElementById("bossMoves");
const bossPiecesEl = document.getElementById("bossPieces");
const bossStarsEl = document.getElementById("bossStars");
const bossNextBtn = document.getElementById("bossNextBtn");

const SPLIT_PROBABILITY = 0.35;   // כמה מהתאים מתפצלים לשני משולשים
const TAP_SLOP = 6;               // פיקסלים: פחות מזה = לחיצה (סיבוב), יותר = גרירה
const SNAP_FACTOR = 0.28;         // טווח ההדבקה, ביחס לגודל תא
const BLEED_PX = 0.6;             // שבר מורחב קצת כדי שלא יישארו קווים בין חלקים מאוחדים
const BOSS_STAGE_FILL = 0.74;     // כמה מהבמה תופסת התמונה כשהיא מושלמת

let boss = null;                  // מצב הבוס הפעיל
let boss_loadToken = 0;           // מבטל טעינת תמונה ישנה כשעוברים בוס מהר

// =====================
// Geometry
// =====================
const rnd = (amount) => (Math.random() - 0.5) * 2 * amount;

// חותך את התמונה (x: 0..aspect, y: 0..1) לשברים משוננים שחולקים קצוות מדויקים
function buildShards(cols, rows, aspect) {
  const cw = aspect / cols;
  const ch = 1 / rows;

  // נקודות הרשת, כשהפנימיות מוזזות
  const V = [];
  for (let r = 0; r <= rows; r++) {
    V[r] = [];
    for (let c = 0; c <= cols; c++) {
      const inner = r > 0 && r < rows && c > 0 && c < cols;
      V[r][c] = [c * cw + (inner ? rnd(0.22 * cw) : 0), r * ch + (inner ? rnd(0.22 * ch) : 0)];
    }
  }
  const mid = (a, b, dx, dy) => [(a[0] + b[0]) / 2 + dx, (a[1] + b[1]) / 2 + dy];

  // נקודת שבירה באמצע כל קצה (מוזזת רק בקצוות פנימיים)
  const H = [];   // H[r][c]: בין V[r][c] ל-V[r][c+1]
  for (let r = 0; r <= rows; r++) {
    H[r] = [];
    for (let c = 0; c < cols; c++) {
      const inner = r > 0 && r < rows;
      H[r][c] = mid(V[r][c], V[r][c + 1], 0, inner ? rnd(0.16 * ch) : 0);
    }
  }
  const Vm = [];  // Vm[r][c]: בין V[r][c] ל-V[r+1][c]
  for (let r = 0; r < rows; r++) {
    Vm[r] = [];
    for (let c = 0; c <= cols; c++) {
      const inner = c > 0 && c < cols;
      Vm[r][c] = mid(V[r][c], V[r + 1][c], inner ? rnd(0.16 * cw) : 0, 0);
    }
  }

  const polys = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tl = V[r][c], tr = V[r][c + 1], br = V[r + 1][c + 1], bl = V[r + 1][c];
      const top = H[r][c], bottom = H[r + 1][c], left = Vm[r][c], right = Vm[r][c + 1];

      if (Math.random() < SPLIT_PROBABILITY) {
        if (Math.random() < 0.5) {
          const d = mid(tl, br, rnd(0.1 * cw), rnd(0.1 * ch));
          polys.push([tl, top, tr, right, br, d]);
          polys.push([br, bottom, bl, left, tl, d]);
        } else {
          const d = mid(tr, bl, rnd(0.1 * cw), rnd(0.1 * ch));
          polys.push([tr, right, br, bottom, bl, d]);
          polys.push([bl, left, tl, top, tr, d]);
        }
      } else {
        polys.push([tl, top, tr, right, br, bottom, bl, left]);
      }
    }
  }
  return polys;
}

function polygonCentroid(poly) {
  let area = 0, cx = 0, cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    const f = x0 * y1 - x1 * y0;
    area += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  area /= 2;
  if (Math.abs(area) < 1e-9) return { x: poly[0][0], y: poly[0][1], area: 0 };
  return { x: cx / (6 * area), y: cy / (6 * area), area: Math.abs(area) };
}

const pointKey = (p) => `${Math.round(p[0] * 1e5)},${Math.round(p[1] * 1e5)}`;
const edgeKey = (a, b) => {
  const ka = pointKey(a), kb = pointKey(b);
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
};

// בונה את מודל הבוס: שברים, שכנים (שברים שחולקים קצה) וקבוצות
function buildBossModel(def, aspect) {
  const rows = Math.max(3, Math.round(def.cols / aspect));
  const polys = buildShards(def.cols, rows, aspect);

  const pieces = polys.map((poly, id) => {
    const c = polygonCentroid(poly);
    const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
    return {
      id, poly, cx: c.x, cy: c.y, area: c.area,
      x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys),
      neighbors: [], group: null, el: null
    };
  });

  // שכנים: שברים שחולקים קטע קצה זהה
  const edges = new Map();
  pieces.forEach(p => {
    p.poly.forEach((a, i) => {
      const b = p.poly[(i + 1) % p.poly.length];
      const key = edgeKey(a, b);
      if (!edges.has(key)) edges.set(key, []);
      edges.get(key).push({ id: p.id, point: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] });
    });
  });
  edges.forEach(list => {
    if (list.length !== 2) return;
    const [a, b] = list;
    pieces[a.id].neighbors.push({ id: b.id, point: a.point });
    pieces[b.id].neighbors.push({ id: a.id, point: a.point });
  });

  const cell = Math.min(aspect / def.cols, 1 / rows);
  return { rows, pieces, cell };
}

// =====================
// Layout + render
// =====================
function bossStageSize() {
  const wrapStyle = getComputedStyle(bossWrap);
  const availW = bossWrap.clientWidth - parseFloat(wrapStyle.paddingLeft) - parseFloat(wrapStyle.paddingRight) - 6;
  const top = bossStage.getBoundingClientRect().top + window.scrollY;
  const availH = window.innerHeight - top - 16 - 6;
  return { w: Math.max(200, Math.floor(availW)), h: Math.max(240, Math.floor(availH)) };
}

function layoutBossScale() {
  const { w, h } = bossStageSize();
  boss.stageW = w;
  boss.stageH = h;
  // S = גובה התמונה השלמה בפיקסלים
  boss.S = Math.min(h * BOSS_STAGE_FILL, (w * BOSS_STAGE_FILL) / boss.aspect);
  bossStage.style.width = w + "px";
  bossStage.style.height = h + "px";
}

// נקודת הבמה (בפיקסלים) של נקודה u בקואורדינטות התמונה, בהינתן מצב הקבוצה
function stagePoint(g, u) {
  const S = boss.S;
  const a = g.rot * Math.PI / 180;
  const dx = (u[0] - g.pivot[0]) * S, dy = (u[1] - g.pivot[1]) * S;
  return [
    g.nx * boss.stageW + dx * Math.cos(a) - dy * Math.sin(a),
    g.ny * boss.stageH + dx * Math.sin(a) + dy * Math.cos(a)
  ];
}

function makePieceEl(p) {
  const S = boss.S;
  const el = document.createElement("div");
  el.className = "shard";
  el.dataset.piece = p.id;
  const bx = p.x0 * S, by = p.y0 * S;
  el.style.left = bx + "px";
  el.style.top = by + "px";
  el.style.width = (p.x1 - p.x0) * S + "px";
  el.style.height = (p.y1 - p.y0) * S + "px";
  el.style.backgroundImage = `url('${boss.def.image}')`;
  el.style.backgroundSize = `${boss.aspect * S}px ${S}px`;
  el.style.backgroundPosition = `${-bx}px ${-by}px`;

  // קצת הרחבה החוצה כדי שלא יישארו תפרים בין חלקים מאוחדים
  const c = [p.cx * S, p.cy * S];
  const pts = p.poly.map(([x, y]) => {
    const px = x * S, py = y * S;
    const len = Math.hypot(px - c[0], py - c[1]) || 1;
    return [px + ((px - c[0]) / len) * BLEED_PX - bx, py + ((py - c[1]) / len) * BLEED_PX - by];
  });
  el.style.clipPath = `polygon(${pts.map(([x, y]) => `${x.toFixed(2)}px ${y.toFixed(2)}px`).join(",")})`;
  return el;
}

function applyGroupTransform(g, animate) {
  const S = boss.S;
  const px = g.pivot[0] * S, py = g.pivot[1] * S;
  g.el.classList.toggle("is-turning", !!animate);
  g.el.style.transformOrigin = `${px}px ${py}px`;
  g.el.style.transform =
    `translate(${g.nx * boss.stageW - px}px, ${g.ny * boss.stageH - py}px) rotate(${g.rot}deg)`;
  g.el.style.zIndex = g.z;
}

// בונה מחדש את כל ה-DOM מהמודל (בהתחלה ובשינוי גודל המסך)
function renderBoss() {
  bossStage.innerHTML = "";
  boss.groups.forEach(g => {
    g.el = document.createElement("div");
    g.el.className = "shard-group";
    g.el.style.width = boss.aspect * boss.S + "px";
    g.el.style.height = boss.S + "px";
    g.pieces.forEach(id => {
      const p = boss.pieces[id];
      p.el = makePieceEl(p);
      g.el.appendChild(p.el);
    });
    bossStage.appendChild(g.el);
    applyGroupTransform(g, false);
  });
}

// =====================
// Groups
// =====================
function groupCentroid(g) {
  let area = 0, x = 0, y = 0;
  g.pieces.forEach(id => {
    const p = boss.pieces[id];
    area += p.area; x += p.cx * p.area; y += p.cy * p.area;
  });
  return [x / area, y / area];
}

function newGroup(pieceIds) {
  const g = { id: boss.nextGroupId++, pieces: pieceIds, nx: 0.5, ny: 0.5, rot: 0, pivot: [0, 0], z: ++boss.zTop, el: null };
  g.pivot = groupCentroid(g);
  pieceIds.forEach(id => { boss.pieces[id].group = g; });
  return g;
}

// מרכז את הציר בעוצמה של הקבוצה בלי להזיז אותה על המסך
function recenterPivot(g) {
  const next = groupCentroid(g);
  const at = stagePoint(g, next);
  g.pivot = next;
  g.nx = at[0] / boss.stageW;
  g.ny = at[1] / boss.stageH;
}

// פיזור התחלתי: רשת מעורבבת עם סטייה, וסיבוב אקראי
function scatterBoss() {
  const n = boss.groups.length;
  const gx = Math.ceil(Math.sqrt(n * boss.stageW / boss.stageH));
  const gy = Math.ceil(n / gx);
  const cells = [];
  for (let r = 0; r < gy; r++) for (let c = 0; c < gx; c++) cells.push([c, r]);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  boss.groups.forEach((g, i) => {
    const [c, r] = cells[i];
    // רדיוס השבר (מהמרכז לקודקוד הרחוק ביותר), כדי שישאר כולו בתוך הבמה
    const p = boss.pieces[g.pieces[0]];
    const radius = Math.max(...p.poly.map(([x, y]) => Math.hypot(x - g.pivot[0], y - g.pivot[1]))) * boss.S;
    const mx = Math.min(0.45, radius / boss.stageW), my = Math.min(0.45, radius / boss.stageH);
    g.nx = Math.min(1 - mx, Math.max(mx, (c + 0.5 + rnd(0.3)) / gx));
    g.ny = Math.min(1 - my, Math.max(my, (r + 0.5 + rnd(0.3)) / gy));
    g.rot = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
  });
  // לפחות שבר אחד מסובב, כדי שלא יתחיל פתור
  if (boss.groups.every(g => g.rot === 0)) boss.groups[0].rot = 90;
}

// האם הקבוצה g יכולה להתאחד עם שכנה כרגע? מחזיר את השכנה והסטייה הנדרשת
function findMerge(g) {
  const tol = Math.max(12, SNAP_FACTOR * boss.cell * boss.S);
  for (const id of g.pieces) {
    for (const nb of boss.pieces[id].neighbors) {
      const h = boss.pieces[nb.id].group;
      if (h === g || ((g.rot - h.rot) % 360 + 360) % 360 !== 0) continue;
      const a = stagePoint(g, nb.point), b = stagePoint(h, nb.point);
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) <= tol) return { h, dx: b[0] - a[0], dy: b[1] - a[1] };
    }
  }
  return null;
}

// מאחד את g לתוך h (אחרי שמקבעים את g בדיוק למקום)
function mergeGroups(g, h, dx, dy) {
  g.nx += dx / boss.stageW;
  g.ny += dy / boss.stageH;
  g.pieces.forEach(id => {
    const p = boss.pieces[id];
    h.pieces.push(id);
    p.group = h;
    h.el.appendChild(p.el);
  });
  g.el.remove();
  boss.groups = boss.groups.filter(x => x !== g);
  recenterPivot(h);
  applyGroupTransform(h, false);
}

// מאחד כל מה שאפשר סביב g. מחזיר את הקבוצה שהתקבלה, ואם הייתה הדבקה
function settleGroup(g) {
  let merged = false;
  for (let guard = 0; guard < 64; guard++) {
    const m = findMerge(g);
    if (!m) break;
    // הקבוצה הגדולה נשארת במקומה והקטנה מתיישרת אליה
    const [keep, join, dx, dy] = g.pieces.length >= m.h.pieces.length
      ? [g, m.h, -m.dx, -m.dy]
      : [m.h, g, m.dx, m.dy];
    mergeGroups(join, keep, dx, dy);
    g = keep;
    merged = true;
  }
  if (merged) {
    g.el.classList.add("flash");
    setTimeout(() => g.el.classList.remove("flash"), 450);
  }
  return { group: g, merged };
}

// =====================
// Stars by moves (לפי בוט שמשחק כמעט מושלם: ראו CHANGELOG)
// =====================
// נמדד: בוט שמשחק כמעט מושלם פותר ב-1.43 מהלכים לשבר (120 ניסיונות, כולם נפתרו).
// בלי רשת לעזרה אדם צריך יותר, ולכן המרווחים כאן רחבים יותר משלבים רגילים:
// 3 כוכבים עד כ-2.75 מהלכים לשבר, 2 כוכבים עד כ-4.4
const BOSS_PAR_PER_PIECE = 1.45;
const BOSS_STAR3_FACTOR = 1.9, BOSS_STAR3_SLACK = 3;
const BOSS_STAR2_FACTOR = 3.0, BOSS_STAR2_SLACK = 5;

function bossLimits() {
  const par = Math.round(boss.pieces.length * BOSS_PAR_PER_PIECE);
  return {
    par,
    three: Math.ceil(par * BOSS_STAR3_FACTOR) + BOSS_STAR3_SLACK,
    two: Math.ceil(par * BOSS_STAR2_FACTOR) + BOSS_STAR2_SLACK
  };
}

function bossStarsForMoves(count) {
  const { three, two } = bossLimits();
  return count <= three ? 3 : count <= two ? 2 : 1;
}

function updateBossHud() {
  if (!boss) return;
  bossMovesEl.textContent = boss.moves;
  bossPiecesEl.textContent = boss.groups.length;
  bossStarsEl.innerHTML = starsHtml(bossStarsForMoves(boss.moves));
}

// =====================
// Start / leave
// =====================
function startBoss(index = 0) {
  const def = bosses[index];
  if (!def) return;

  showGame();            // (מנקה בוס קודם דרך showScreen)
  setGameMode(true);
  bossNextBtn.classList.add("hidden");
  levelLabel.innerHTML = `BOSS ${index + 1}<small>${categories[index]?.name || ""}</small>`;

  const token = ++boss_loadToken;
  const img = new Image();
  img.onload = () => {
    if (token !== boss_loadToken) return;
    const aspect = img.naturalWidth / img.naturalHeight;
    const model = buildBossModel(def, aspect);
    boss = {
      def, index, aspect,
      pieces: model.pieces, cell: model.cell,
      groups: [], moves: 0, done: false, zTop: 0, nextGroupId: 1,
      stageW: 0, stageH: 0, S: 0, drag: null
    };
    boss.groups = boss.pieces.map(p => newGroup([p.id]));
    layoutBossScale();

    // מפזרים עד שאין הדבקה מקרית כבר בהתחלה
    for (let attempt = 0; attempt < 30; attempt++) {
      scatterBoss();
      if (!boss.groups.some(g => findMerge(g))) break;
    }
    renderBoss();
    updateBossHud();
  };
  img.onerror = () => {
    if (token !== boss_loadToken) return;
    console.error("Boss image not found:", def.image);
  };
  img.src = def.image;
}
function replayBoss() {
  startBoss(boss ? boss.index : 0);
}

// נקרא כשעוזבים את מסך המשחק (מ-showScreen דרך window.leaveBossHook)
function leaveBoss() {
  boss_loadToken++;
  if (boss) {
    boss.done = true;
    boss.drag = null;
  }
  boss = null;
  bossStage.innerHTML = "";
}

// =====================
// Input: drag = move, tap = rotate
// =====================
bossStage.addEventListener("pointerdown", (e) => {
  if (!boss || boss.done || boss.drag) return;
  if (e.pointerType === "mouse" && e.button !== 0) return;
  const el = e.target.closest(".shard");
  if (!el) return;
  e.preventDefault();

  const g = boss.pieces[+el.dataset.piece].group;
  g.z = ++boss.zTop;
  g.el.style.zIndex = g.z;
  g.el.classList.add("is-dragging");

  boss.drag = {
    pointerId: e.pointerId, g,
    startX: e.clientX, startY: e.clientY,
    nx: g.nx, ny: g.ny, moved: false
  };
  playSound("pick");
  vibrate(10);
});

document.addEventListener("pointermove", (e) => {
  const d = boss?.drag;
  if (!d || e.pointerId !== d.pointerId) return;
  const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
  if (!d.moved && Math.hypot(dx, dy) < TAP_SLOP) return;
  d.moved = true;
  d.g.nx = Math.min(0.97, Math.max(0.03, d.nx + dx / boss.stageW));
  d.g.ny = Math.min(0.97, Math.max(0.03, d.ny + dy / boss.stageH));
  applyGroupTransform(d.g, false);
});

function finishBossDrag(e, cancelled) {
  const d = boss?.drag;
  if (!d || e.pointerId !== d.pointerId) return;
  boss.drag = null;
  d.g.el.classList.remove("is-dragging");
  if (cancelled) {
    d.g.nx = d.nx; d.g.ny = d.ny;
    applyGroupTransform(d.g, false);
    return;
  }

  if (!d.moved) bossTap(d.g);
  else bossDropped(d.g);
}

// לחיצה: מסובבים את כל הקבוצה ב-90 מעלות סביב המרכז שלה
function bossTap(g) {
  g.rot += 90;
  applyGroupTransform(g, true);
  playSound("rotate");
  vibrate(8);
  bossAfterMove(g);
}

// שחרור אחרי גרירה
function bossDropped(g) {
  playSound("drop");
  bossAfterMove(g);
}

// כל פעולה (סיבוב או הזזה) היא מהלך. אחריה בודקים הדבקה וניצחון
function bossAfterMove(g) {
  boss.moves++;
  const { group, merged } = settleGroup(g);
  if (merged) {
    playSound("snap");
    vibrate(30);
  }
  updateBossHud();
  checkBossWin(group);
}

document.addEventListener("pointerup", (e) => finishBossDrag(e, false));
document.addEventListener("pointercancel", (e) => finishBossDrag(e, true));

// =====================
// Win
// =====================
function checkBossWin(g) {
  if (!boss || boss.done || boss.groups.length !== 1) return;
  if (((g.rot % 360) + 360) % 360 !== 0) return;   // צריך גם להעמיד את התמונה ישר

  boss.done = true;
  const earned = bossStarsForMoves(boss.moves);
  const id = boss.def.id;
  if (earned > (progress.boss[id] || 0)) {
    progress.boss[id] = earned;
    saveProgress();
  }

  // התמונה המושלמת נעה למרכז הבמה בזמן שנהנים ממנה
  boss.groups[0].nx = 0.5;
  boss.groups[0].ny = 0.5;
  boss.groups[0].el.classList.add("is-turning");
  applyGroupTransform(boss.groups[0], true);

  playSound("win");
  vibrate([40, 60, 40, 60, 120]);
  startConfetti();

  clearTimeout(winTimer);
  winTimer = setTimeout(() => openBossWinScreen(earned), WIN_SCREEN_DELAY);
}

function openBossWinScreen(stars) {
  if (!boss) return;
  const { three, two } = bossLimits();

  winTitle.textContent = `BOSS ${boss.index + 1} COMPLETE`;
  winStars.innerHTML = starsHtml(stars);
  winStats.innerHTML =
    `<span>MOVES <b>${boss.moves}</b></span>` +
    (stars < 3 ? `<span class="win-hint">${stars === 2 ? "3" : "2"} STARS: ${stars === 2 ? three : two} OR FEWER</span>` : "");
  winNextBtn.textContent = "BOSSES";
  winHarderBtn.classList.add("hidden");
  winModal.classList.remove("hidden");

  winStarTimers.forEach(clearTimeout);
  winStarTimers = [];
  for (let i = 0; i < stars; i++) {
    winStarTimers.push(setTimeout(() => {
      playSound("star", i);
      vibrate(12);
    }, 350 + i * 300));
  }
}

// סוגרים את חלון הניצחון כדי להסתכל על התמונה: מופיע כפתור להמשך מתחת לבמה
function dismissBossWin() {
  closeWinScreen();
  winMessage.textContent = "";
  bossNextBtn.classList.remove("hidden");
}
bossNextBtn?.addEventListener("click", () => showBoss());

// סידור מחדש כשמסובבים את הטלפון או משנים גודל חלון
let bossResizeTimer = null;
function relayoutBoss() {
  if (!boss || gameScreen.classList.contains("hidden")) return;
  layoutBossScale();
  renderBoss();
}
window.addEventListener("resize", () => {
  relayoutBoss();
  clearTimeout(bossResizeTimer);
  bossResizeTimer = setTimeout(relayoutBoss, 250);
});

// רושמים את הניקוי רק בסוף הקובץ, אחרי שכל המשתנים כאן הוגדרו
// (אחרת, כשכל הקבצים מחוברים לקובץ אחד, ניקוי מוקדם נוגע במשתנה שעוד לא הוגדר)
window.leaveBossHook = leaveBoss;
