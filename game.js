// לוח הפאזל, הודעת ניצחון וכפתור NEXT LEVEL
const puzzle = document.getElementById("puzzle");
const winMessage = document.getElementById("winMessage");
const nextLevelBtn = document.getElementById("nextLevelBtn");

// הגדרת השלבים
// שים לב: ודא שקיימים הקבצים האלה בתיקייה ליד index.html
const levels = [
  { image: "level3.jpeg", grid: 3 }, // Level 1 - 3x3
  { image: "level4.jpg",  grid: 4 }  // Level 2 - 4x4 (יותר חלקים)
];

let currentLevelIndex = 0;
let currentImageSrc = levels[0].image;
let gridSize = levels[0].grid;

// גודל מקסימלי לפאזל על המסך
const maxPuzzleSize = 360;

// מערך החלקים (DOM elements)
const tiles = [];
let gameOver = false; // אם ניצחנו - חוסם גרירות

// לגרירה מותאמת אישית
let dragSourceTile = null;   // מאיזה חלק התחלנו לגרור
let dragGhost = null;        // האלמנט שרודף אחרי האצבע
let lastClientX = 0;
let lastClientY = 0;

// נשמור את גודל הלוח כדי להשתמש ביצירת חלקים
let puzzleWidth = 0;
let puzzleHeight = 0;

// ------------------ טעינת שלב ------------------

function loadLevel(index) {
  currentLevelIndex = index;
  currentImageSrc = levels[index].image;
  gridSize = levels[index].grid;
  gameOver = false;
  dragSourceTile = null;
  removeGhost();
  tiles.length = 0;

  if (winMessage) winMessage.style.display = "none";
  if (nextLevelBtn) nextLevelBtn.style.display = "none";

  const img = new Image();
  img.src = currentImageSrc;

  img.onload = () => {
    const aspect = img.naturalWidth / img.naturalHeight;

    if (aspect >= 1) {
      // תמונה לרוחב
      puzzleWidth = maxPuzzleSize;
      puzzleHeight = maxPuzzleSize / aspect;
    } else {
      // תמונה לגובה
      puzzleHeight = maxPuzzleSize;
      puzzleWidth = maxPuzzleSize * aspect;
    }

    // הגדרת הלוח
    puzzle.style.width = puzzleWidth + "px";
    puzzle.style.height = puzzleHeight + "px";
    puzzle.style.margin = "20px auto";
    puzzle.style.display = "grid";
    puzzle.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    puzzle.style.border = "3px solid #ED1D24";

    createTiles(puzzleWidth, puzzleHeight);
    shuffleTiles();
    renderTiles();
  };
}

// ------------------ יצירת חלקים ------------------

function createTiles(pWidth, pHeight) {
  puzzle.innerHTML = "";
  tiles.length = 0;
  dragSourceTile = null;
  removeGhost();
  gameOver = false;

  const tileWidth = pWidth / gridSize;
  const tileHeight = pHeight / gridSize;

  for (let i = 0; i < gridSize * gridSize; i++) {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.style.border = "1px solid #ED1D24";
    tile.style.boxSizing = "border-box";
    tile.style.height = tileHeight + "px";
    tile.style.backgroundImage = `url('${currentImageSrc}')`;
    tile.style.backgroundSize = `${pWidth}px ${pHeight}px`;
    tile.style.cursor = "grab";

    const x = i % gridSize;
    const y = Math.floor(i / gridSize);
    tile.style.backgroundPosition = `-${x * tileWidth}px -${y * tileHeight}px`;

    // המיקום הנכון של החלק (0..N)
    tile.dataset.correctIndex = i;

    // התחלת גרירה – עכבר
    tile.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startDrag(tile, e.clientX, e.clientY);
    });

    // התחלת גרירה – טאץ' (נמנע משתי אצבעות)
    tile.addEventListener("touchstart", (e) => {
      if (e.touches.length > 1) return; // מתעלמים מ-multi-touch
      const touch = e.touches[0];
      startDrag(tile, touch.clientX, touch.clientY);
    }, { passive: true });

    tiles.push(tile);
  }
}

// ------------------ ערבוב ורינדור ------------------

function shuffleTiles() {
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
}

function renderTiles() {
  puzzle.innerHTML = "";
  tiles.forEach(tile => puzzle.appendChild(tile));
}

// ------------------ לוגיקת גרירה מותאמת ------------------

function startDrag(tile, clientX, clientY) {
  if (gameOver) return; // אם המשחק נגמר - לא מתחילים גרירה

  // אם כבר גוררים – לא יוצרים עוד רוח רפאים
  if (dragGhost) return;

  dragSourceTile = tile;
  lastClientX = clientX;
  lastClientY = clientY;

  const rect = tile.getBoundingClientRect();
  dragGhost = tile.cloneNode(true);
  dragGhost.style.position = "fixed";
  dragGhost.style.left = rect.left + "px";
  dragGhost.style.top = rect.top + "px";
  dragGhost.style.width = rect.width + "px";
  dragGhost.style.height = rect.height + "px";
  dragGhost.style.pointerEvents = "none";
  dragGhost.style.zIndex = 9999;
  dragGhost.style.opacity = "0.9";
  dragGhost.style.transform = "scale(1.05)";
  dragGhost.style.boxShadow = "0 0 12px #ffffff";
  document.body.appendChild(dragGhost);
}

function onPointerMove(e) {
  if (!dragGhost) return;
  lastClientX = e.clientX;
  lastClientY = e.clientY;
  moveGhost(lastClientX, lastClientY);
}

function onPointerUp(e) {
  if (!dragGhost || !dragSourceTile) {
    removeGhost();
    dragSourceTile = null;
    return;
  }

  const elem = document.elementFromPoint(lastClientX, lastClientY);
  const targetTile = elem && elem.closest(".tile");

  if (targetTile && targetTile !== dragSourceTile) {
    swapTiles(dragSourceTile, targetTile);
    renderTiles();
    checkWin();
  }

  removeGhost();
  dragSourceTile = null;
}

function onTouchMove(e) {
  if (!dragGhost) return;
  e.preventDefault();
  const touch = e.touches[0];
  lastClientX = touch.clientX;
  lastClientY = touch.clientY;
  moveGhost(lastClientX, lastClientY);
}

function onTouchEnd(e) {
  if (!dragGhost || !dragSourceTile) {
    removeGhost();
    dragSourceTile = null;
    return;
  }

  const elem = document.elementFromPoint(lastClientX, lastClientY);
  const targetTile = elem && elem.closest(".tile");

  if (targetTile && targetTile !== dragSourceTile) {
    swapTiles(dragSourceTile, targetTile);
    renderTiles();
    checkWin();
  }

  removeGhost();
  dragSourceTile = null;
}

function moveGhost(x, y) {
  if (!dragGhost) return;
  const rect = dragGhost.getBoundingClientRect();
  dragGhost.style.left = (x - rect.width / 2) + "px";
  dragGhost.style.top = (y - rect.height / 2) + "px";
}

function removeGhost() {
  if (dragGhost && dragGhost.parentNode) {
    dragGhost.parentNode.removeChild(dragGhost);
  }
  dragGhost = null;
}

// ------------------ החלפה + ניצחון ------------------

function swapTiles(tileA, tileB) {
  const indexA = tiles.indexOf(tileA);
  const indexB = tiles.indexOf(tileB);
  if (indexA === -1 || indexB === -1) return;

  [tiles[indexA], tiles[indexB]] = [tiles[indexB], tiles[indexA]];
}

function checkWin() {
  let win = true;
  for (let i = 0; i < tiles.length; i++) {
    const correctIndex = parseInt(tiles[i].dataset.correctIndex, 10);
    if (correctIndex !== i) {
      win = false;
      break;
    }
  }

  if (win && winMessage) {
    gameOver = true;

    // הופכים את הפאזל לתמונה חלקה
    tiles.forEach(tile => {
      tile.style.border = "none";
      tile.style.boxShadow = "none";
      tile.style.cursor = "default";
    });

    winMessage.style.display = "block";

    // כפתור NEXT LEVEL – רק אם יש שלב נוסף
    if (nextLevelBtn) {
      if (currentLevelIndex < levels.length - 1) {
        nextLevelBtn.style.display = "inline-block";
      } else {
        nextLevelBtn.style.display = "none";
      }
    }
  }
}

// ------------------ מאזינים גלובליים + כפתור NEXT LEVEL ------------------

document.addEventListener("mousemove", onPointerMove);
document.addEventListener("mouseup", onPointerUp);
document.addEventListener("touchmove", onTouchMove, { passive: false });
document.addEventListener("touchend", onTouchEnd);

if (nextLevelBtn) {
  nextLevelBtn.addEventListener("click", () => {
    if (currentLevelIndex < levels.length - 1) {
      loadLevel(currentLevelIndex + 1);
    }
  });
}

// ------------------ התחלת המשחק ------------------

loadLevel(0);
