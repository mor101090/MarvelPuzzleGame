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

// =====================
// Levels
// =====================
// IMPORTANT: GitHub Pages case-sensitive
const levels = [
  { image: "level3.jpeg", grid: 3 },
  { image: "level4.jpg",  grid: 4 } // אם הקובץ שלך באמת level4.JPG תשנה כאן ל-"level4.JPG"
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
let dragGhost = null;
let dragPointerId = null;
let lastClientX = 0;
let lastClientY = 0;

// Board size
let puzzleWidth = 0;
let puzzleHeight = 0;

// Navigation
let started = false;

// מונע מטעינת תמונה ישנה לדרוס שלב חדש (למשל לחיצה מהירה על NEXT LEVEL)
let loadToken = 0;

// =====================
// Screen Navigation
// =====================
function showHome() {
  cancelDrag();
  homeScreen?.classList.remove("hidden");
  gameScreen?.classList.add("hidden");
}

function showGame() {
  homeScreen?.classList.add("hidden");
  gameScreen?.classList.remove("hidden");
}

playBtn?.addEventListener("click", () => {
  showGame();
  if (!started) {
    started = true;
    loadLevel(0);
  } else {
    layoutPuzzle();
  }
});

backBtn?.addEventListener("click", () => {
  showHome();
});

chooseLevelBtn?.addEventListener("click", () => {
  // כרגע לא פעיל - נשאיר להמשך
});

// =====================
// Level Loader
// =====================
function loadLevel(index) {
  currentLevelIndex = index;
  currentImageSrc = levels[index].image;
  gridSize = levels[index].grid;

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

    // קו פנימי במקום border - כדי שהתמונה לא תזוז פיקסל בכל אריח
    tile.style.boxShadow = "inset 0 0 0 1px #ED1D24";
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
}

// =====================
// Drag Logic
// =====================
function startDrag(tile, pointerId, clientX, clientY) {
  if (gameOver) return;
  if (dragGhost) return; // כבר גוררים (למשל אצבע שנייה)

  dragSourceTile = tile;
  dragPointerId = pointerId;
  lastClientX = clientX;
  lastClientY = clientY;

  const rect = tile.getBoundingClientRect();
  dragGhost = tile.cloneNode(true);
  dragGhost.style.position = "fixed";
  dragGhost.style.left = "0px";
  dragGhost.style.top = "0px";
  dragGhost.style.width = rect.width + "px";
  dragGhost.style.height = rect.height + "px";
  dragGhost.style.pointerEvents = "none";
  dragGhost.style.zIndex = 9999;
  dragGhost.style.opacity = "0.92";
  dragGhost.style.transform = "scale(1.05)";
  dragGhost.style.boxShadow = "0 0 12px rgba(255,255,255,0.9)";
  dragGhost.dataset.halfW = rect.width / 2;
  dragGhost.dataset.halfH = rect.height / 2;
  document.body.appendChild(dragGhost);

  tile.style.opacity = "0.35";
  moveGhost(clientX, clientY);
}

function onPointerMove(e) {
  if (!dragGhost || e.pointerId !== dragPointerId) return;
  lastClientX = e.clientX;
  lastClientY = e.clientY;
  moveGhost(lastClientX, lastClientY);
}

function onPointerUp(e) {
  if (!dragGhost || e.pointerId !== dragPointerId) return;

  lastClientX = e.clientX;
  lastClientY = e.clientY;

  const elem = document.elementFromPoint(lastClientX, lastClientY);
  const targetTile = elem && elem.closest("#puzzle .tile");
  const sourceTile = dragSourceTile;

  cancelDrag();

  if (targetTile && sourceTile && targetTile !== sourceTile) {
    swapTiles(sourceTile, targetTile);
    renderTiles();
    checkWin();
  }
}

function moveGhost(x, y) {
  if (!dragGhost) return;
  dragGhost.style.left = (x - parseFloat(dragGhost.dataset.halfW)) + "px";
  dragGhost.style.top = (y - parseFloat(dragGhost.dataset.halfH)) + "px";
}

function removeGhost() {
  if (dragGhost && dragGhost.parentNode) {
    dragGhost.parentNode.removeChild(dragGhost);
  }
  dragGhost = null;
}

// מבטל גרירה פעילה בלי להחליף אריחים
function cancelDrag() {
  if (dragSourceTile) dragSourceTile.style.opacity = "";
  removeGhost();
  dragSourceTile = null;
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

  tiles.forEach(tile => {
    tile.style.boxShadow = "none";
    tile.style.cursor = "default";
  });

  if (winMessage) winMessage.style.display = "block";

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
