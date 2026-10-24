// =====================
// DOM
// =====================
const puzzle = document.getElementById("puzzle");
const winMessage = document.getElementById("winMessage");
const nextLevelBtn = document.getElementById("nextLevelBtn");

const homeScreen = document.getElementById("homeScreen");
const gameScreen = document.getElementById("gameScreen");
const playBtn = document.getElementById("playBtn");
const backBtn = document.getElementById("backBtn");
const chooseLevelBtn = document.getElementById("chooseLevelBtn");
const levelScreen = document.getElementById("levelScreen");
const levelList = document.getElementById("levelList");
const levelsBackBtn = document.getElementById("levelsBackBtn");
const levelLabel = document.getElementById("levelLabel");

// =====================
// Levels
// =====================
// IMPORTANT: GitHub Pages case-sensitive
// קטגוריות: כדי להוסיף קטגוריה קשה יותר - מוסיפים כאן ומסמנים category בשלבים
const categories = [
  { id: "easy", name: "Easy" }
];

const levels = [
  { image: "level3.jpeg", grid: 3, category: "easy" },
  { image: "level4.jpg",  grid: 4, category: "easy" } // אם הקובץ שלך באמת level4.JPG תשנה כאן ל-"level4.JPG"
];

let currentLevelIndex = 0;
let currentImageSrc = levels[0].image;
let gridSize = levels[0].grid;
let imageAspect = 1;

// Puzzle sizing
const maxPuzzleSize = 360;
const boardBorder = 3;   // גבול אדום סביב הלוח
const sideGutter = 12;   // ריווח מהצדדים במסך צר

// Tiles
const tiles = [];
let gameOver = false;

// Drag
let dragSourceTile = null;
let dragGroup = [];        // מיקומים (אינדקסים) של כל החלקים שנגררים ביחד
let dragGhost = null;
let dragPointerId = null;
let dragGrab = null;       // איפה בתוך החלק תפסנו + גודל חלק
let hoverCellKey = null;   // התא שמעליו הגרירה נמצאת (לרטט "טיק" במעבר בין תאים)
let lastClientX = 0;
let lastClientY = 0;

const EDGE_COLOR = "#ED1D24";
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// Board size
let puzzleWidth = 0;
let puzzleHeight = 0;

// Navigation
let started = false;

// מונע מטעינת תמונה ישנה לדרוס שלב חדש (למשל לחיצה מהירה על NEXT LEVEL)
let loadToken = 0;

// =====================
// Progress (נשמר במכשיר)
// =====================
const PROGRESS_KEY = "marvelPuzzle.progress";

// completed = רשימת אינדקסים של שלבים שנפתרו
const progress = { completed: [], ...loadProgress() };

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    return Array.isArray(saved?.completed) ? { completed: saved.completed } : {};
  } catch {
    return {};
  }
}

function saveProgress() {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // אחסון חסום - ההתקדמות תחזיק עד רענון
  }
}

function isCompleted(index) {
  return progress.completed.includes(index);
}

// שלב נפתח אם הוא הראשון, או שהקודם לו נפתר
function isUnlocked(index) {
  return index === 0 || isCompleted(index - 1);
}

// השלב הראשון שעוד לא נפתר (או האחרון אם סיימו הכל)
function nextPlayableLevel() {
  const i = levels.findIndex((_, idx) => !isCompleted(idx));
  return i === -1 ? levels.length - 1 : i;
}

// =====================
// Screen Navigation
// =====================
function showScreen(screen) {
  cancelDrag();
  [homeScreen, levelScreen, gameScreen].forEach(el => {
    el?.classList.toggle("hidden", el !== screen);
  });
}

function showHome() {
  showScreen(homeScreen);
}

function showLevels() {
  renderLevelSelect();
  showScreen(levelScreen);
}

function showGame() {
  showScreen(gameScreen);
}

playBtn?.addEventListener("click", () => {
  showGame();
  if (!started) {
    started = true;
    loadLevel(nextPlayableLevel());
  } else {
    layoutPuzzle();
  }
});

backBtn?.addEventListener("click", () => {
  showHome();
});

chooseLevelBtn?.addEventListener("click", showLevels);
levelsBackBtn?.addEventListener("click", showHome);

// =====================
// Level Select
// =====================
const LOCK_SVG = `
  <svg class="level-lock" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#fff" stroke="#000" stroke-width="1.2" stroke-linejoin="round"
      d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3H9z"/>
  </svg>`;

const CHECK_SVG = `
  <span class="level-check" aria-hidden="true">
    <svg viewBox="0 0 24 24"><path fill="none" stroke="#1a9a4a" stroke-width="4"
      stroke-linecap="round" stroke-linejoin="round" d="M5 12.5l4.5 4.5L19 7.5"/></svg>
  </span>`;

function renderLevelSelect() {
  levelList.innerHTML = "";

  categories.forEach(category => {
    const section = document.createElement("section");

    const title = document.createElement("h2");
    title.className = "category-title";
    title.textContent = category.name;
    section.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "level-grid";

    levels.forEach((level, index) => {
      if (level.category !== category.id) return;

      const locked = !isUnlocked(index);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "level-card" + (locked ? " is-locked" : "");
      card.dataset.index = index;
      card.setAttribute("aria-label",
        `Level ${index + 1}` + (locked ? ", locked" : isCompleted(index) ? ", completed" : ""));
      card.innerHTML =
        `<span class="level-card-num">${index + 1}</span>` +
        (locked ? LOCK_SVG : isCompleted(index) ? CHECK_SVG : "");

      card.addEventListener("click", () => {
        if (locked) {
          playSound("invalid");
          vibrate([15, 40, 15]);
          card.classList.remove("shake");
          void card.offsetWidth; // מאתחל את האנימציה
          card.classList.add("shake");
          return;
        }
        started = true;
        showGame();
        loadLevel(index);
      });

      grid.appendChild(card);
    });

    section.appendChild(grid);
    levelList.appendChild(section);
  });
}

// =====================
// Level Loader
// =====================
function loadLevel(index) {
  currentLevelIndex = index;
  currentImageSrc = levels[index].image;
  gridSize = levels[index].grid;
  if (levelLabel) levelLabel.textContent = `LEVEL ${index + 1}`;

  gameOver = false;
  cancelDrag();
  tiles.length = 0;
  puzzle.innerHTML = "";

  if (winMessage) winMessage.style.display = "none";
  if (nextLevelBtn) nextLevelBtn.style.display = "none";

  const token = ++loadToken;
  const img = new Image();

  img.onload = () => {
    if (token !== loadToken) return;

    imageAspect = img.naturalWidth / img.naturalHeight;

    createTiles();
    shuffleTiles();
    renderTiles();
    layoutPuzzle();
  };

  img.onerror = () => {
    if (token !== loadToken) return;
    console.error("Image not found:", currentImageSrc);
    alert(`Image not found: ${currentImageSrc}\nCheck filename (case-sensitive on GitHub Pages).`);
  };

  img.src = currentImageSrc;
}

// =====================
// Layout (responsive)
// =====================
function layoutPuzzle() {
  if (!tiles.length) return;

  // הלוח לא יחרוג מרוחב המסך בטלפונים צרים
  const available = Math.max(120, window.innerWidth - 2 * sideGutter - 2 * boardBorder);
  const size = Math.min(maxPuzzleSize, available);

  if (imageAspect >= 1) {
    puzzleWidth = size;
    puzzleHeight = size / imageAspect;
  } else {
    puzzleHeight = size;
    puzzleWidth = size * imageAspect;
  }

  const tileWidth = puzzleWidth / gridSize;
  const tileHeight = puzzleHeight / gridSize;

  // content-box: הגבול נוסף מסביב ולא "אוכל" מהאריחים
  puzzle.style.boxSizing = "content-box";
  puzzle.style.width = puzzleWidth + "px";
  puzzle.style.height = puzzleHeight + "px";
  puzzle.style.margin = "12px auto";
  puzzle.style.display = "grid";
  puzzle.style.gridTemplateColumns = `repeat(${gridSize}, ${tileWidth}px)`;
  puzzle.style.gridAutoRows = `${tileHeight}px`;
  puzzle.style.border = `${boardBorder}px solid #ED1D24`;

  tiles.forEach(tile => {
    const i = parseInt(tile.dataset.correctIndex, 10);
    const x = i % gridSize;
    const y = Math.floor(i / gridSize);
    tile.style.width = tileWidth + "px";
    tile.style.height = tileHeight + "px";
    tile.style.backgroundSize = `${puzzleWidth}px ${puzzleHeight}px`;
    tile.style.backgroundPosition = `-${x * tileWidth}px -${y * tileHeight}px`;
  });
}

window.addEventListener("resize", layoutPuzzle);

// =====================
// Create Tiles
// =====================
function createTiles() {
  puzzle.innerHTML = "";
  tiles.length = 0;
  cancelDrag();
  gameOver = false;

  for (let i = 0; i < gridSize * gridSize; i++) {
    const tile = document.createElement("div");
    tile.className = "tile";

    tile.style.backgroundImage = `url('${currentImageSrc}')`;
    tile.style.backgroundRepeat = "no-repeat";
    tile.style.cursor = "grab";
    tile.style.userSelect = "none";

    tile.dataset.correctIndex = i;

    // Pointer Events: עכבר + מגע + עט במקום אחד
    tile.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      startDrag(tile, e.pointerId, e.clientX, e.clientY);
    });

    tiles.push(tile);
  }
}

// =====================
// Shuffle / Render
// =====================
function isSolved() {
  return tiles.every((tile, i) => parseInt(tile.dataset.correctIndex, 10) === i);
}

function shuffleTiles() {
  // ערבוב חוזר עד שהלוח לא פתור כבר מההתחלה
  do {
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
  } while (tiles.length > 1 && isSolved());
}

function renderTiles() {
  puzzle.innerHTML = "";
  tiles.forEach(tile => puzzle.appendChild(tile));
  updateTileEdges();
}

// =====================
// Connected pieces
// =====================
function cellOf(index) {
  return { r: Math.floor(index / gridSize), c: index % gridSize };
}

function correctCellOf(tile) {
  return cellOf(parseInt(tile.dataset.correctIndex, 10));
}

function inBounds(r, c) {
  return r >= 0 && r < gridSize && c >= 0 && c < gridSize;
}

// האם החלק במיקום index מחובר נכון לשכן שלו בכיוון (dr, dc)
function isJoined(index, dr, dc) {
  const { r, c } = cellOf(index);
  if (!inBounds(r + dr, c + dc)) return false;

  const a = correctCellOf(tiles[index]);
  const b = correctCellOf(tiles[(r + dr) * gridSize + (c + dc)]);
  return b.r === a.r + dr && b.c === a.c + dc;
}

// כל החלקים שמחוברים (ישירות או דרך שכנים) לחלק במיקום index
function getGroup(index) {
  const group = [index];
  const seen = new Set(group);

  for (let k = 0; k < group.length; k++) {
    const { r, c } = cellOf(group[k]);
    DIRS.forEach(([dr, dc]) => {
      const next = (r + dr) * gridSize + (c + dc);
      if (!seen.has(next) && isJoined(group[k], dr, dc)) {
        seen.add(next);
        group.push(next);
      }
    });
  }
  return group;
}

function countJoins() {
  let joins = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (isJoined(i, 0, 1)) joins++;
    if (isJoined(i, 1, 0)) joins++;
  }
  return joins;
}

// קו אדום רק בצדדים שלא מחוברים - ככה רואים אילו חלקים "נדבקו"
function updateTileEdges() {
  tiles.forEach((tile, i) => {
    const lines = [];
    if (!isJoined(i, -1, 0)) lines.push(`inset 0 1px 0 0 ${EDGE_COLOR}`);
    if (!isJoined(i, 1, 0))  lines.push(`inset 0 -1px 0 0 ${EDGE_COLOR}`);
    if (!isJoined(i, 0, -1)) lines.push(`inset 1px 0 0 0 ${EDGE_COLOR}`);
    if (!isJoined(i, 0, 1))  lines.push(`inset -1px 0 0 0 ${EDGE_COLOR}`);
    tile.style.boxShadow = lines.join(", ") || "none";
  });
}

// =====================
// Drag Logic
// =====================
function startDrag(tile, pointerId, clientX, clientY) {
  if (gameOver) return;
  if (dragGhost) return; // כבר גוררים (למשל אצבע שנייה)

  const sourceIndex = tiles.indexOf(tile);
  if (sourceIndex === -1) return;

  dragSourceTile = tile;
  dragGroup = getGroup(sourceIndex);
  dragPointerId = pointerId;
  lastClientX = clientX;
  lastClientY = clientY;

  const rect = tile.getBoundingClientRect();
  const tileW = rect.width;
  const tileH = rect.height;

  // גבולות הקבוצה ברשת
  const cells = dragGroup.map(cellOf);
  const minR = Math.min(...cells.map(p => p.r));
  const maxR = Math.max(...cells.map(p => p.r));
  const minC = Math.min(...cells.map(p => p.c));
  const maxC = Math.max(...cells.map(p => p.c));
  const src = cellOf(sourceIndex);

  dragGrab = {
    x: clientX - rect.left,
    y: clientY - rect.top,
    tileW,
    tileH,
    // המרחק מפינת ה"רוח" לנקודה שתפסנו
    ghostX: (src.c - minC) * tileW + (clientX - rect.left),
    ghostY: (src.r - minR) * tileH + (clientY - rect.top)
  };

  dragGhost = document.createElement("div");
  dragGhost.style.position = "fixed";
  dragGhost.style.left = "0px";
  dragGhost.style.top = "0px";
  dragGhost.style.width = (maxC - minC + 1) * tileW + "px";
  dragGhost.style.height = (maxR - minR + 1) * tileH + "px";
  dragGhost.style.pointerEvents = "none";
  dragGhost.style.zIndex = 9999;
  dragGhost.style.opacity = "0.92";
  dragGhost.style.filter = "drop-shadow(0 0 8px rgba(255,255,255,0.85))";

  dragGroup.forEach(index => {
    const { r, c } = cellOf(index);
    const clone = tiles[index].cloneNode(true);
    clone.style.position = "absolute";
    clone.style.left = (c - minC) * tileW + "px";
    clone.style.top = (r - minR) * tileH + "px";
    dragGhost.appendChild(clone);
    tiles[index].style.opacity = "0.35";
  });

  document.body.appendChild(dragGhost);
  moveGhost(clientX, clientY);

  hoverCellKey = (src.r) + "," + (src.c);
  playSound("pick");
  vibrate(20);
}

function onPointerMove(e) {
  if (!dragGhost || e.pointerId !== dragPointerId) return;
  lastClientX = e.clientX;
  lastClientY = e.clientY;
  moveGhost(lastClientX, lastClientY);

  // טיק קצר בכל מעבר לתא חדש
  const cell = cellUnderGrabbedTile();
  const key = cell ? cell.r + "," + cell.c : null;
  if (key !== hoverCellKey) {
    hoverCellKey = key;
    if (key) vibrate(6);
  }
}

function onPointerUp(e) {
  if (!dragGhost || e.pointerId !== dragPointerId) return;

  lastClientX = e.clientX;
  lastClientY = e.clientY;

  const group = dragGroup;
  const sourceIndex = tiles.indexOf(dragSourceTile);
  const target = cellUnderGrabbedTile();

  cancelDrag();

  // שוחרר מחוץ ללוח או באותו מקום
  if (!target || sourceIndex === -1) return;
  const src = cellOf(sourceIndex);
  const dr = target.r - src.r;
  const dc = target.c - src.c;
  if (dr === 0 && dc === 0) return;

  const joinsBefore = countJoins();

  if (!moveGroup(group, dr, dc)) {
    // הקבוצה לא נכנסת שם (יוצאת מהלוח)
    playSound("invalid");
    vibrate([15, 40, 15]);
    return;
  }

  renderTiles();

  if (countJoins() > joinsBefore) {
    playSound("snap");
    vibrate(30);
  } else {
    playSound("drop");
    vibrate(8);
  }

  checkWin();
}

// התא בלוח שמתחת למרכז החלק שתפסנו (לא מתחת לאצבע - כך זה מרגיש טבעי יותר)
function cellUnderGrabbedTile() {
  const rect = puzzle.getBoundingClientRect();
  const left = rect.left + puzzle.clientLeft;
  const top = rect.top + puzzle.clientTop;

  const centerX = lastClientX - dragGrab.x + dragGrab.tileW / 2;
  const centerY = lastClientY - dragGrab.y + dragGrab.tileH / 2;

  const c = Math.floor((centerX - left) / dragGrab.tileW);
  const r = Math.floor((centerY - top) / dragGrab.tileH);
  return inBounds(r, c) ? { r, c } : null;
}

// מזיז קבוצה ב-(dr, dc). החלקים שהיו ביעד עוברים למקומות שהקבוצה פינתה.
function moveGroup(group, dr, dc) {
  const groupSet = new Set(group);
  const destOf = (index) => {
    const { r, c } = cellOf(index);
    return inBounds(r + dr, c + dc) ? (r + dr) * gridSize + (c + dc) : -1;
  };

  const dests = group.map(destOf);
  if (dests.includes(-1)) return false;
  const destSet = new Set(dests);

  const next = tiles.slice();
  group.forEach((index, k) => { next[dests[k]] = tiles[index]; });

  // חלק שהיה ביעד "נדחף" אחורה עד שהוא מגיע לתא שהתפנה
  destSet.forEach(dest => {
    if (groupSet.has(dest)) return;
    let cell = dest;
    do {
      const { r, c } = cellOf(cell);
      cell = (r - dr) * gridSize + (c - dc);
    } while (destSet.has(cell));
    next[cell] = tiles[dest];
  });

  tiles.splice(0, tiles.length, ...next);
  return true;
}

function moveGhost(x, y) {
  if (!dragGhost) return;
  dragGhost.style.left = (x - dragGrab.ghostX) + "px";
  dragGhost.style.top = (y - dragGrab.ghostY) + "px";
}

function removeGhost() {
  if (dragGhost && dragGhost.parentNode) {
    dragGhost.parentNode.removeChild(dragGhost);
  }
  dragGhost = null;
}

// מבטל גרירה פעילה בלי להחליף אריחים
function cancelDrag() {
  tiles.forEach(tile => { tile.style.opacity = ""; });
  removeGhost();
  dragSourceTile = null;
  dragGroup = [];
  dragGrab = null;
  hoverCellKey = null;
  dragPointerId = null;
}

// Global listeners
document.addEventListener("pointermove", onPointerMove);
document.addEventListener("pointerup", onPointerUp);
document.addEventListener("pointercancel", cancelDrag);
window.addEventListener("blur", cancelDrag);

// =====================
// Swap + Win
// =====================
function swapTiles(tileA, tileB) {
  const indexA = tiles.indexOf(tileA);
  const indexB = tiles.indexOf(tileB);
  if (indexA === -1 || indexB === -1) return;

  [tiles[indexA], tiles[indexB]] = [tiles[indexB], tiles[indexA]];
}

function checkWin() {
  if (!isSolved()) return;

  gameOver = true;

  if (!isCompleted(currentLevelIndex)) {
    progress.completed.push(currentLevelIndex);
    saveProgress();
  }

  tiles.forEach(tile => {
    tile.style.boxShadow = "none";
    tile.style.cursor = "default";
  });

  if (winMessage) winMessage.style.display = "block";

  playSound("win");
  vibrate([40, 60, 40, 60, 120]);

  if (nextLevelBtn) {
    const isLastLevel = currentLevelIndex >= levels.length - 1;
    nextLevelBtn.textContent = isLastLevel ? "PLAY AGAIN" : "NEXT LEVEL";
    nextLevelBtn.style.display = "inline-block";
  }
}

nextLevelBtn?.addEventListener("click", () => {
  if (currentLevelIndex < levels.length - 1) {
    loadLevel(currentLevelIndex + 1);
  } else {
    loadLevel(0); // סיימת את כל השלבים - מתחילים מחדש
  }
});

// =====================
// Start state
// =====================
showHome(); // חשוב: מתחילים בדף בית, לא במשחק
