// =====================
// DOM
// =====================
const puzzle = document.getElementById("puzzle");
const boardViewport = document.getElementById("boardViewport");
const puzzleWrap = document.getElementById("puzzleWrap");
const hud = document.querySelector(".hud");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const zoomResetBtn = document.getElementById("zoomResetBtn");
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
const bossScreen = document.getElementById("bossScreen");
const bossList = document.getElementById("bossList");
const bossBtn = document.getElementById("bossBtn");
const bossBackBtn = document.getElementById("bossBackBtn");
const levelLabel = document.getElementById("levelLabel");
const movesCount = document.getElementById("movesCount");
const hudStars = document.getElementById("hudStars");
const viewerModal = document.getElementById("viewerModal");
const viewerImg = document.getElementById("viewerImg");
const viewerCaption = document.getElementById("viewerCaption");
const viewerLevels = document.getElementById("viewerLevels");
const winModal = document.getElementById("winModal");
const winTitle = document.getElementById("winTitle");
const winStars = document.getElementById("winStars");
const winStats = document.getElementById("winStats");
const winNextBtn = document.getElementById("winNextBtn");
const winReplayBtn = document.getElementById("winReplayBtn");
const winLevelsBtn = document.getElementById("winLevelsBtn");
const winHarderBtn = document.getElementById("winHarderBtn");

// =====================
// Levels
// =====================
// IMPORTANT: GitHub Pages case-sensitive
// רמות קושי לכל שלב: מספר החלקים בבינוני הוא פי 2 מהקל, ובקשה פי 2 מהבינוני.
// הכוכבים של השלב = הרמה הגבוהה ביותר שנפתרה (1 קל, 2 בינוני, 3 קשה).
const DIFFICULTIES = [
  { name: "Easy",   factor: 1 },
  { name: "Medium", factor: 2 },
  { name: "Hard",   factor: 4 }
];
// כל 10 שלבים = קבוצה חדשה עם יותר חלקים: הרשת בקל גדלה ב-1 (3x3, אחר כך 4x4, 5x5...)
const LEVELS_PER_GROUP = 10;
const FIRST_GRID = 3;
const GROUP_NAMES = ["Rookie", "Hero", "Avenger", "Legend", "Cosmic"];

// שלב N = הקובץ assets/levels/N.webp (סדר השלבים הוא סדר המספרים בשם הקובץ).
// כדי להוסיף שלבים: tools/add_level.py ואז מעלים את LEVEL_COUNT.
// thumb = גרסה קטנה לכרטיסים במסך בחירת השלב (נטענת מהר)
const LEVEL_COUNT = 30;
const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => {
  const id = String(index + 1);
  const group = Math.floor(index / LEVELS_PER_GROUP);
  return {
    id,
    grid: FIRST_GRID + group,
    category: group,
    image: `assets/levels/${id}.webp`,
    thumb: `assets/levels/thumbs/${id}.webp`
  };
});

// קבוצה לכל 10 שלבים. מראים את כל הקבוצות, גם כאלה שעוד אין בהן שלבים (נעולות)
const categories = Array.from(
  { length: Math.max(GROUP_NAMES.length, Math.ceil(levels.length / LEVELS_PER_GROUP)) },
  (_, group) => ({
    id: group,
    name: GROUP_NAMES[group] || `Group ${group + 1}`,
    grid: FIRST_GRID + group
  })
);

let currentLevelIndex = 0;
let currentImageSrc = levels[0].image;
let currentDifficulty = 1;   // 1 קל, 2 בינוני, 3 קשה
let cols = levels[0].grid;
let rows = levels[0].grid;
let imageAspect = 1;

// Puzzle sizing
// הלוח ממלא את המקום הפנוי במסך (גם לרוחב), עד הגבול הזה בצלע הארוכה
const maxPuzzleSize = 900;
const boardBorder = 3;    // גבול אדום סביב הלוח
const boardBottomGap = 16;

// Zoom
const MAX_ZOOM = 3;
let zoom = 1;

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
let puzzleWidth = 0;   // גודל הלוח בפועל (כולל זום)
let puzzleHeight = 0;
let baseWidth = 0;     // גודל הלוח בלי זום (מה שנכנס במסך)
let baseHeight = 0;

// Navigation
let started = false;

// מונע מטעינת תמונה ישנה לדרוס שלב חדש (למשל לחיצה מהירה על NEXT LEVEL)
let loadToken = 0;

// השהיה קצרה אחרי הניצחון כדי ליהנות מהתמונה המושלמת לפני מסך הניצחון
const WIN_SCREEN_DELAY = 900;
let winTimer = null;
let winStarTimers = [];

// =====================
// Progress (נשמר במכשיר)
// =====================
const PROGRESS_KEY = "marvelPuzzle.progress";

// level = { "9": 2 } - הרמה הגבוהה ביותר שנפתרה בכל שלב (0 = עוד לא נפתר)
// שלב N = assets/levels/N.webp. השלבים הקיימים נשארים במקומם והחדשים נוספים אחריהם.
// שמירות ישנות: version 1 לפי אינדקס, 2 לפי id עם כוכבי מהלכים, 3 ו-5 לפי מספר שלב
// (אותו מספור), ו-4 לפי שם קובץ התמונה (נוצר לרגע בגרסה 0.21.0 ובוטל).
const LEGACY_IDS = ["9", "10"];                    // השלבים הראשונים בשמירה לפי אינדקס
const RENAMED_IDS = { level3: "9", level4: "10" }; // שלבים ששינינו להם שם (לפני version 3)
const renameId = (id) => RENAMED_IDS[id] || id;

// שם קובץ התמונה המקורי של כל שלב (שלב N = ORDER[N-1]) - להמרת שמירות version 4
const V4_ORDER = [1, 5, 2, 14, 11, 10, 26, 19, 3, 4, 6, 7, 8, 9, 12, 13, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 27, 28, 29, 30];
const fromV4Id = (id) => String(V4_ORDER.indexOf(Number(id)) + 1);

// stars = { "9": [3, 2, 0] } - כוכבים (1-3, לפי מספר המהלכים) בכל רמה: קל, בינוני, קשה (0 = עוד לא נפתרה)
const progress = { stars: {}, ...loadProgress() };

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    if (!saved) return {};

    const stars = {};
    const add = (id, perDifficulty) => {
      if (id === "0") return;
      const current = stars[id] || [0, 0, 0];
      stars[id] = current.map((v, i) => Math.max(v, perDifficulty[i] || 0));
    };

    // version 6 (הנוכחי): כוכבים לכל רמה
    if (saved.version === 6 && saved.stars && typeof saved.stars === "object") {
      Object.entries(saved.stars).forEach(([id, list]) => add(id, list));
      return { stars };
    }

    // גרסאות 3-5: הרמה הגבוהה ביותר שנפתרה. כל רמה עד אליה נחשבת כנפתרה עם כוכב אחד
    const fromLevel = (id, topDifficulty) =>
      add(id, [0, 1, 2].map(i => (i < topDifficulty ? 1 : 0)));

    if (saved.level && typeof saved.level === "object" && [3, 4, 5].includes(saved.version)) {
      Object.entries(saved.level).forEach(([id, top]) => {
        fromLevel(saved.version === 4 ? fromV4Id(id) : renameId(id), top);
      });
      return { stars };
    }

    // המרה מהפורמט הישן: כל שלב שנפתר נחשב כקל שנפתר
    if (Array.isArray(saved.completed)) {
      const legacy = !saved.version;
      saved.completed.forEach(key => {
        fromLevel(renameId((legacy && LEGACY_IDS[key]) || String(key)), 1);
      });
      return { stars };
    }
    return {};
  } catch {
    return {};
  }
}

function saveProgress() {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ version: 6, ...progress }));
  } catch {
    // אחסון חסום - ההתקדמות תחזיק עד רענון
  }
}

// זמני, לבדיקות: כל השלבים והרמות פתוחים, והתמונות מוצגות, כאילו סיימת את המשחק.
// הכוכבים בכל זאת אמיתיים (לפי איך ששיחקת). כדי לחזור להתקדמות רגילה - משנים ל-false.
const UNLOCK_ALL_LEVELS = true;

// כוכבים אמיתיים (0-3) של רמה בשלב
function diffStars(index, difficulty) {
  return (progress.stars[levels[index].id] || [])[difficulty - 1] || 0;
}

// סך הכוכבים בשלב (מתוך 9)
function totalStars(index) {
  return [1, 2, 3].reduce((sum, d) => sum + diffStars(index, d), 0);
}

// השלב נפתר אם נפתרה בו לפחות רמה אחת
function isCompleted(index) {
  return totalStars(index) > 0;
}

// מראים את התמונה של שלב שנפתר (או כשהכל פתוח)
function showsPicture(index) {
  return UNLOCK_ALL_LEVELS || isCompleted(index);
}

// רמה נפתחת אחרי שהרמה שלפניה נפתרה
function isDifficultyUnlocked(index, difficulty) {
  return UNLOCK_ALL_LEVELS || difficulty === 1 || diffStars(index, difficulty - 1) >= 1;
}

function recordResult(index, difficulty, stars) {
  const id = levels[index].id;
  const list = progress.stars[id] || [0, 0, 0];
  if (stars > list[difficulty - 1]) {
    list[difficulty - 1] = stars;
    progress.stars[id] = list;
    saveProgress();
  }
}

// מספר החלקים ברמה (הקל = רשת בגודל grid x grid)
function pieceCount(index, difficulty) {
  const base = levels[index].grid * levels[index].grid;
  return base * DIFFICULTIES[difficulty - 1].factor;
}

// בוחר cols x rows שמכפלתם בדיוק מספר החלקים, כך שהחלקים יהיו הכי קרובים לריבוע
function gridFor(index, difficulty, aspect) {
  const n = pieceCount(index, difficulty);
  if (difficulty === 1) return { cols: levels[index].grid, rows: levels[index].grid };

  let best = null;
  for (let c = 2; c <= n / 2; c++) {
    if (n % c) continue;
    const r = n / c;
    const tileAspect = aspect * r / c; // רוחב/גובה של חלק
    const score = Math.abs(Math.log(tileAspect));
    if (!best || score < best.score) best = { cols: c, rows: r, score };
  }
  return best || { cols: levels[index].grid, rows: levels[index].grid };
}

// =====================
// Moves + Stars
// =====================
let moves = 0;
let par = 0;   // מספר המהלכים המינימלי להחלפות בלבד, לפי הערבוב הנוכחי

// מספר החלפות מינימלי לפתרון הערבוב = חלקים פחות מספר המעגלים בתמורה
function computePar() {
  const n = tiles.length;
  const seen = new Array(n).fill(false);
  let cycles = 0;
  for (let i = 0; i < n; i++) {
    if (seen[i]) continue;
    cycles++;
    for (let j = i; !seen[j]; j = parseInt(tiles[j].dataset.correctIndex, 10)) seen[j] = true;
  }
  return n - cycles;
}

// כוכבים לפי מהלכים, ביחס לערבוב עצמו - כך שכל ערבוב הוגן באותה מידה.
// 3 כוכבים: עד STAR3_FACTOR x par (+ מרווח), 2 כוכבים: עד STAR2_FACTOR x par (+ מרווח)
const STAR3_FACTOR = 1.5, STAR3_SLACK = 2;
const STAR2_FACTOR = 2.5, STAR2_SLACK = 4;

function starLimits() {
  return {
    three: Math.ceil(par * STAR3_FACTOR) + STAR3_SLACK,
    two: Math.ceil(par * STAR2_FACTOR) + STAR2_SLACK
  };
}

function starsForMoves(count) {
  const { three, two } = starLimits();
  return count <= three ? 3 : count <= two ? 2 : 1;
}

const STAR_PATH = "M12 2.3l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.4l-6 3.3 1.3-6.7-5-4.7 6.8-.8z";

function starsHtml(count, total = 3) {
  let html = "";
  for (let i = 0; i < total; i++) {
    html += `<svg class="star${i < count ? " is-on" : ""}" viewBox="0 0 24 24" aria-hidden="true">` +
            `<path d="${STAR_PATH}"/></svg>`;
  }
  return html;
}

function updateHud() {
  if (movesCount) movesCount.textContent = moves;
  if (hudStars) hudStars.innerHTML = starsHtml(starsForMoves(moves));
  if (levelLabel) {
    levelLabel.innerHTML =
      `LEVEL ${currentLevelIndex + 1}<small>${DIFFICULTIES[currentDifficulty - 1].name}</small>`;
  }
}

// שלב נפתח אם הוא הראשון, שהקודם לו נפתר, או שכבר נפתר בעצמו
function isUnlocked(index) {
  return UNLOCK_ALL_LEVELS || index === 0 || isCompleted(index) || isCompleted(index - 1);
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
  closeWinScreen();
  closeViewer();
  [homeScreen, levelScreen, bossScreen, gameScreen].forEach(el => {
    el?.classList.toggle("hidden", el !== screen);
  });
}

function showHome() {
  showScreen(homeScreen);
}

function showBoss() {
  renderBossSelect();
  showScreen(bossScreen);
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
    loadLevel(nextPlayableLevel(), 1);
  } else {
    layoutPuzzle();
  }
});

backBtn?.addEventListener("click", () => {
  showHome();
});

chooseLevelBtn?.addEventListener("click", showLevels);
levelsBackBtn?.addEventListener("click", showHome);
bossBtn?.addEventListener("click", showBoss);
bossBackBtn?.addEventListener("click", showLevels);

// =====================
// Level Select
// =====================
const LOCK_SVG = `
  <svg class="level-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#fff" stroke="#000" stroke-width="1.2" stroke-linejoin="round"
      d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3H9z"/>
  </svg>`;

const PLAY_SVG = `
  <svg class="level-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#fff" stroke="#000" stroke-width="1.4" stroke-linejoin="round" d="M7 3.5v17l14-8.5z"/>
  </svg>`;

function startLevel(index, difficulty = 1) {
  started = true;
  showGame();
  loadLevel(index, difficulty);
}

function renderLevelSelect() {
  levelList.innerHTML = "";

  categories.forEach(category => {
    const section = document.createElement("section");

    const title = document.createElement("h2");
    title.className = "category-title";
    title.textContent = category.name;
    section.appendChild(title);

    // כמה חלקים בקבוצה הזו: קל / בינוני / קשה
    const base = category.grid * category.grid;
    const sub = document.createElement("p");
    sub.className = "category-sub";
    sub.textContent = `${base} · ${base * 2} · ${base * 4} pieces`;
    section.appendChild(sub);

    const grid = document.createElement("div");
    grid.className = "level-grid";

    // קבוצה שעוד אין בה שלבים
    if (!levels.some(level => level.category === category.id)) {
      const soon = document.createElement("div");
      soon.className = "group-soon";
      soon.innerHTML = LOCK_SVG + `<span>Coming soon</span>`;
      section.appendChild(soon);
      levelList.appendChild(section);
      return;
    }

    levels.forEach((level, index) => {
      if (level.category !== category.id) return;

      const locked = !isUnlocked(index);
      const card = document.createElement("button");
      card.type = "button";
      const solved = !locked && showsPicture(index);
      const stars = totalStars(index);
      card.className = "level-card" + (locked ? " is-locked" : solved ? " has-picture" : " is-open");
      card.dataset.index = index;
      card.setAttribute("aria-label",
        `Level ${index + 1}` + (locked ? ", locked" : isCompleted(index) ? `, ${stars} of 9 stars` : ""));

      if (solved) {
        // שלב שנפתר: התמונה עצמה, עם מספר השלב והכוכבים
        card.style.backgroundImage = `url('${level.thumb}')`;
        card.innerHTML =
          `<span class="level-tag">LEVEL ${index + 1}` +
          `<span class="card-stars">${starsHtml(1, 1)}<b>${stars}/9</b></span>` +
          `</span>`;
      } else if (locked) {
        card.innerHTML = LOCK_SVG + `<span class="level-tag">LEVEL ${index + 1}</span>`;
      } else {
        // שלב פתוח שעוד לא נפתר: בלי תמונה - לא רואים איך הפאזל נראה עד שפותרים
        card.innerHTML = PLAY_SVG + `<span class="level-tag">LEVEL ${index + 1}</span>`;
      }

      card.addEventListener("click", () => {
        if (locked) {
          playSound("invalid");
          vibrate([15, 40, 15]);
          card.classList.remove("shake");
          void card.offsetWidth; // מאתחל את האנימציה
          card.classList.add("shake");
          return;
        }
        // שלב שנפתר: מציגים את התמונה בגדול עם אפשרות לשחק שוב
        if (solved) {
          openViewer(index);
          return;
        }
        startLevel(index);
      });

      grid.appendChild(card);
    });

    section.appendChild(grid);
    levelList.appendChild(section);
  });
}

// =====================
// Boss select (שלב בוס אחרי כל 10 שלבים, לפני שעולים רמה - בקרוב)
// =====================
function renderBossSelect() {
  bossList.innerHTML = "";

  const section = document.createElement("section");
  section.innerHTML =
    `<h2 class="category-title">Boss</h2>` +
    `<p class="category-sub">Shattered pieces · rotate and join</p>` +
    `<div class="group-soon">${LOCK_SVG}<span>Coming soon</span></div>`;

  // בוס אחד לסוף כל קבוצה של 10 שלבים
  const grid = document.createElement("div");
  grid.className = "level-grid boss-grid";
  categories.forEach((category, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "level-card is-locked";
    card.setAttribute("aria-label", `Boss ${index + 1}, ${category.name}, coming soon`);
    card.innerHTML =
      LOCK_SVG +
      `<span class="level-tag">BOSS ${index + 1}<small>after ${category.name}</small></span>`;
    card.addEventListener("click", () => {
      playSound("invalid");
      vibrate([15, 40, 15]);
      card.classList.remove("shake");
      void card.offsetWidth;
      card.classList.add("shake");
    });
    grid.appendChild(card);
  });
  section.appendChild(grid);
  bossList.appendChild(section);
}

// =====================
// Picture viewer (תמונת שלב שנפתר)
// =====================
let viewerIndex = -1;

function openViewer(index) {
  viewerIndex = index;
  viewerImg.src = levels[index].image;
  viewerImg.alt = `Level ${index + 1}`;
  viewerCaption.innerHTML =
    `<span>LEVEL ${index + 1}</span><span class="card-stars">${starsHtml(1, 1)}<b>${totalStars(index)}/9</b></span>`;

  // כפתורי רמות: קל / בינוני / קשה (נפתחות לפי הסדר)
  viewerLevels.innerHTML = "";
  DIFFICULTIES.forEach((d, i) => {
    const difficulty = i + 1;
    const unlocked = isDifficultyUnlocked(index, difficulty);
    const btn = document.createElement("button");
    btn.type = "button";
    const earned = diffStars(index, difficulty);
    btn.className = "diff-btn" + (unlocked ? "" : " is-locked") + (earned >= 1 ? " is-done" : "");
    btn.innerHTML =
      `<span class="diff-name">${d.name}</span>` +
      `<small>${pieceCount(index, difficulty)} pieces</small>` +
      (unlocked ? `<span class="stars diff-stars">${starsHtml(earned)}</span>` : LOCK_SVG);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!unlocked) {
        playSound("invalid");
        vibrate([15, 40, 15]);
        btn.classList.remove("shake");
        void btn.offsetWidth;
        btn.classList.add("shake");
        return;
      }
      closeViewer();
      startLevel(index, difficulty);
    });
    viewerLevels.appendChild(btn);
  });

  viewerModal.classList.remove("hidden");
}

function closeViewer() {
  viewerModal?.classList.add("hidden");
}

viewerModal?.addEventListener("click", closeViewer);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeViewer();
});

// =====================
// Level Loader
// =====================
function loadLevel(index, difficulty = 1) {
  currentLevelIndex = index;
  currentDifficulty = difficulty;
  currentImageSrc = levels[index].image;

  gameOver = false;
  zoom = 1;
  moves = 0;
  updateHud();
  closeWinScreen();
  cancelDrag();
  tiles.length = 0;
  puzzle.innerHTML = "";

  if (winMessage) winMessage.style.display = "none";
  if (nextLevelBtn) nextLevelBtn.style.display = "none";

  const token = ++loadToken;
  if (levels[index + 1]) new Image().src = levels[index + 1].image; // מטעינים מראש את השלב הבא
  const img = new Image();

  img.onload = () => {
    if (token !== loadToken) return;

    imageAspect = img.naturalWidth / img.naturalHeight;
    ({ cols, rows } = gridFor(index, difficulty, imageAspect));

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
  if (!tiles.length || gameScreen.classList.contains("hidden")) return;

  // המקום הפנוי: רוחב האזור ועד תחתית המסך (עובד גם כשהטלפון לרוחב)
  const wrapStyle = getComputedStyle(puzzleWrap);
  const availW = puzzleWrap.clientWidth
    - parseFloat(wrapStyle.paddingLeft) - parseFloat(wrapStyle.paddingRight) - 2 * boardBorder;
  const top = boardViewport.getBoundingClientRect().top + window.scrollY;
  const availH = window.innerHeight - top - boardBottomGap - 2 * boardBorder;

  const maxW = Math.max(120, Math.min(availW, maxPuzzleSize));
  const maxH = Math.max(160, Math.min(availH, maxPuzzleSize));

  if (maxW / maxH > imageAspect) {
    baseHeight = maxH;
    baseWidth = maxH * imageAspect;
  } else {
    baseWidth = maxW;
    baseHeight = maxW / imageAspect;
  }

  boardViewport.style.width = baseWidth + "px";
  boardViewport.style.height = baseHeight + "px";
  boardViewport.style.border = `${boardBorder}px solid #ED1D24`;
  if (hud) hud.style.width = Math.max(baseWidth + 2 * boardBorder, 280) + "px";

  sizeBoard();
}

// מגדיר את גודל הלוח והחלקים לפי הזום הנוכחי
function sizeBoard() {
  puzzleWidth = baseWidth * zoom;
  puzzleHeight = baseHeight * zoom;

  const tileWidth = puzzleWidth / cols;
  const tileHeight = puzzleHeight / rows;

  puzzle.style.width = puzzleWidth + "px";
  puzzle.style.height = puzzleHeight + "px";
  puzzle.style.display = "grid";
  puzzle.style.gridTemplateColumns = `repeat(${cols}, ${tileWidth}px)`;
  puzzle.style.gridAutoRows = `${tileHeight}px`;

  tiles.forEach(tile => {
    const i = parseInt(tile.dataset.correctIndex, 10);
    const x = i % cols;
    const y = Math.floor(i / cols);
    tile.style.width = tileWidth + "px";
    tile.style.height = tileHeight + "px";
    tile.style.backgroundSize = `${puzzleWidth}px ${puzzleHeight}px`;
    tile.style.backgroundPosition = `-${x * tileWidth}px -${y * tileHeight}px`;
  });

  if (zoomResetBtn) zoomResetBtn.textContent = `${Math.round(zoom * 10) / 10}×`;
  if (zoomOutBtn) zoomOutBtn.disabled = zoom <= 1;
  if (zoomInBtn) zoomInBtn.disabled = zoom >= MAX_ZOOM;
}

// =====================
// Zoom (צביטה בשתי אצבעות, כפתורים, או Ctrl+גלגלת)
// =====================
// מחשב נקודה במסך לקואורדינטות בתוך הלוח (בלי זום)
function boardPointAt(clientX, clientY) {
  const rect = boardViewport.getBoundingClientRect();
  const x = clientX - rect.left - boardViewport.clientLeft;
  const y = clientY - rect.top - boardViewport.clientTop;
  return {
    x, y,
    contentX: (boardViewport.scrollLeft + x) / zoom,
    contentY: (boardViewport.scrollTop + y) / zoom
  };
}

// משנה זום כך שהנקודה contentX/Y תישאר מתחת ל-screenX/Y (קואורדינטות בתוך החלון)
function setZoom(newZoom, contentX, contentY, screenX, screenY) {
  newZoom = Math.min(MAX_ZOOM, Math.max(1, newZoom));
  if (!tiles.length) { zoom = newZoom; return; }

  zoom = newZoom;
  sizeBoard();
  boardViewport.scrollLeft = contentX * zoom - screenX;
  boardViewport.scrollTop = contentY * zoom - screenY;
}

function zoomAroundCenter(factor) {
  const rect = boardViewport.getBoundingClientRect();
  const p = boardPointAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
  setZoom(zoom * factor, p.contentX, p.contentY, p.x, p.y);
}

zoomInBtn?.addEventListener("click", () => zoomAroundCenter(1.5));
zoomOutBtn?.addEventListener("click", () => zoomAroundCenter(1 / 1.5));
zoomResetBtn?.addEventListener("click", () => setZoom(1, 0, 0, 0, 0));

// Ctrl + גלגלת (וצביטה במשטח מגע של מחשב נייד)
boardViewport?.addEventListener("wheel", (e) => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  const p = boardPointAt(e.clientX, e.clientY);
  setZoom(zoom * Math.exp(-e.deltaY * 0.005), p.contentX, p.contentY, p.x, p.y);
}, { passive: false });

// צביטה: שתי אצבעות על הלוח מגדילות/מקטינות ומזיזות, אצבע אחת גוררת חלק
const activeTouches = new Map();
let pinch = null;

function touchPair() {
  const [a, b] = [...activeTouches.values()];
  return {
    dist: Math.hypot(a.x - b.x, a.y - b.y),
    midX: (a.x + b.x) / 2,
    midY: (a.y + b.y) / 2
  };
}

boardViewport?.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "touch") return;
  activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (activeTouches.size === 2) {
    cancelDrag(); // האצבע הראשונה התחילה לגרור - מבטלים, זו צביטה
    const t = touchPair();
    const p = boardPointAt(t.midX, t.midY);
    pinch = { dist: t.dist || 1, zoom, contentX: p.contentX, contentY: p.contentY };
  }
}, { capture: true });

document.addEventListener("pointermove", (e) => {
  if (!activeTouches.has(e.pointerId)) return;
  activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (!pinch || activeTouches.size < 2) return;

  const t = touchPair();
  const p = boardPointAt(t.midX, t.midY);
  setZoom(pinch.zoom * (t.dist / pinch.dist), pinch.contentX, pinch.contentY, p.x, p.y);
});

function endTouch(e) {
  activeTouches.delete(e.pointerId);
  if (activeTouches.size < 2) pinch = null;
}
document.addEventListener("pointerup", endTouch);
document.addEventListener("pointercancel", endTouch);

// סיבוב הטלפון: מסדרים מיד ושוב רגע אחרי (בחלק מהטלפונים הגודל מתעדכן באיחור)
let resizeTimer = null;
window.addEventListener("resize", () => {
  layoutPuzzle();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(layoutPuzzle, 250);
});

// =====================
// Create Tiles
// =====================
function createTiles() {
  puzzle.innerHTML = "";
  tiles.length = 0;
  cancelDrag();
  gameOver = false;

  for (let i = 0; i < cols * rows; i++) {
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
  par = computePar();
  updateHud();
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
  return { r: Math.floor(index / cols), c: index % cols };
}

function correctCellOf(tile) {
  return cellOf(parseInt(tile.dataset.correctIndex, 10));
}

function inBounds(r, c) {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}

// האם החלק במיקום index מחובר נכון לשכן שלו בכיוון (dr, dc)
function isJoined(index, dr, dc) {
  const { r, c } = cellOf(index);
  if (!inBounds(r + dr, c + dc)) return false;

  const a = correctCellOf(tiles[index]);
  const b = correctCellOf(tiles[(r + dr) * cols + (c + dc)]);
  return b.r === a.r + dr && b.c === a.c + dc;
}

// כל החלקים שמחוברים (ישירות או דרך שכנים) לחלק במיקום index
function getGroup(index) {
  const group = [index];
  const seen = new Set(group);

  for (let k = 0; k < group.length; k++) {
    const { r, c } = cellOf(group[k]);
    DIRS.forEach(([dr, dc]) => {
      const next = (r + dr) * cols + (c + dc);
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
  if (dragGhost || pinch) return; // כבר גוררים או צובטים (אצבע שנייה)

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
  updateAutoScroll();

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
  moves++;
  updateHud();

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
  const left = rect.left;
  const top = rect.top;

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
    return inBounds(r + dr, c + dc) ? (r + dr) * cols + (c + dc) : -1;
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
      cell = (r - dr) * cols + (c - dc);
    } while (destSet.has(cell));
    next[cell] = tiles[dest];
  });

  tiles.splice(0, tiles.length, ...next);
  return true;
}

// כשיש זום וגוררים חלק לקצה החלון - הלוח גולל לבד לכיוון הזה
const AUTO_SCROLL_EDGE = 40;
const AUTO_SCROLL_SPEED = 10;
let autoScrollFrame = null;
let autoScrollX = 0;
let autoScrollY = 0;

function updateAutoScroll() {
  autoScrollX = autoScrollY = 0;
  if (zoom > 1 && dragGhost) {
    const r = boardViewport.getBoundingClientRect();
    if (lastClientX < r.left + AUTO_SCROLL_EDGE) autoScrollX = -AUTO_SCROLL_SPEED;
    else if (lastClientX > r.right - AUTO_SCROLL_EDGE) autoScrollX = AUTO_SCROLL_SPEED;
    if (lastClientY < r.top + AUTO_SCROLL_EDGE) autoScrollY = -AUTO_SCROLL_SPEED;
    else if (lastClientY > r.bottom - AUTO_SCROLL_EDGE) autoScrollY = AUTO_SCROLL_SPEED;
  }
  if ((autoScrollX || autoScrollY) && !autoScrollFrame) {
    autoScrollFrame = requestAnimationFrame(autoScrollStep);
  }
}

function autoScrollStep() {
  autoScrollFrame = null;
  if (!dragGhost || (!autoScrollX && !autoScrollY)) return;
  boardViewport.scrollLeft += autoScrollX;
  boardViewport.scrollTop += autoScrollY;
  autoScrollFrame = requestAnimationFrame(autoScrollStep);
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
  autoScrollX = autoScrollY = 0;
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

  const earned = starsForMoves(moves);
  recordResult(currentLevelIndex, currentDifficulty, earned);
  setZoom(1, 0, 0, 0, 0); // מראים את כל התמונה המושלמת

  tiles.forEach(tile => {
    tile.style.boxShadow = "none";
    tile.style.cursor = "default";
  });

  playSound("win");
  vibrate([40, 60, 40, 60, 120]);

  clearTimeout(winTimer);
  winTimer = setTimeout(() => openWinScreen(earned), WIN_SCREEN_DELAY);
}

// =====================
// Win Screen
// =====================
function isLastLevel() {
  return currentLevelIndex >= levels.length - 1;
}

// הרמה הבאה באותו שלב (אם יש), אחרי שהנוכחית נפתרה
function nextDifficulty() {
  return currentDifficulty < DIFFICULTIES.length ? currentDifficulty + 1 : 0;
}

function openWinScreen(stars) {
  const harder = nextDifficulty();
  const { three, two } = starLimits();

  winTitle.textContent = `LEVEL ${currentLevelIndex + 1} COMPLETE`;
  winStars.innerHTML = starsHtml(stars);
  winStats.innerHTML =
    `<span>${DIFFICULTIES[currentDifficulty - 1].name.toUpperCase()}</span>` +
    `<span>MOVES <b>${moves}</b></span>` +
    (stars < 3 ? `<span class="win-hint">${stars === 2 ? "3" : "2"} STARS: ${stars === 2 ? three : two} OR FEWER</span>` : "");
  winNextBtn.textContent = isLastLevel() ? "LEVELS" : "NEXT LEVEL";

  // כפתור לרמה הקשה יותר (מופיע רק אם יש רמה הבאה)
  winHarderBtn.classList.toggle("hidden", !harder);
  if (harder) winHarderBtn.textContent = `▲ ${DIFFICULTIES[harder - 1].name}`;

  winModal.classList.remove("hidden");

  // הכוכבים "קופצים" אחד אחרי השני, עם צליל ורטט
  winStarTimers.forEach(clearTimeout);
  winStarTimers = [];
  for (let i = 0; i < stars; i++) {
    winStarTimers.push(setTimeout(() => {
      playSound("star", i);
      vibrate(12);
    }, 350 + i * 300));
  }
}

function closeWinScreen() {
  clearTimeout(winTimer);
  winStarTimers.forEach(clearTimeout);
  winStarTimers = [];
  winModal?.classList.add("hidden");
}

function goNext() {
  if (isLastLevel()) {
    showLevels();
  } else {
    loadLevel(currentLevelIndex + 1, 1);
  }
}

winNextBtn?.addEventListener("click", goNext);
winReplayBtn?.addEventListener("click", () => loadLevel(currentLevelIndex, currentDifficulty));
winHarderBtn?.addEventListener("click", () => loadLevel(currentLevelIndex, nextDifficulty()));
winLevelsBtn?.addEventListener("click", showLevels);

// לחיצה על הרקע סוגרת את המסך כדי לראות את התמונה - נשאר כפתור להמשך מתחת ללוח
winModal?.addEventListener("click", (e) => {
  if (e.target !== winModal) return;
  closeWinScreen();
  if (winMessage) {
    winMessage.textContent = `LEVEL ${currentLevelIndex + 1} COMPLETE`;
    winMessage.style.display = "block";
  }
  if (nextLevelBtn) {
    nextLevelBtn.textContent = isLastLevel() ? "LEVELS" : "NEXT LEVEL";
    nextLevelBtn.style.display = "inline-block";
  }
});

nextLevelBtn?.addEventListener("click", goNext);

// =====================
// Start state
// =====================
showHome(); // חשוב: מתחילים בדף בית, לא במשחק
