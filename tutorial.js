// =====================
// Tips (מדריכים קצרים): כל אחד קופץ פעם אחת ונשמר שנראה
// 1. welcome: איך משחקים, כולל זום - בתחילת המשחק
// 2. rotate:  רמז עם אנימציה לסובב את הטלפון - בשלב הרחב הראשון
// 3. boss:    פתיחת המנעול של הבוס הראשון והסבר על שלב בוס - אחרי שלב 10
// =====================

const TIPS_KEY = "marvelPuzzle.tips";

const TIPS = {
  welcome: {
    title: "HOW TO PLAY",
    anim: "pinch",
    lines: [
      "Drag a piece onto another one to swap them.",
      "Pieces that fit together join up and move as one.",
      "Zoom in or out with + and −, or pinch with two fingers."
    ]
  },
  rotate: {
    title: "TURN YOUR PHONE",
    anim: "rotate",
    lines: ["This picture is wide. Turn your phone sideways to get a bigger board."]
  },
  boss: {
    title: "BOSS LEVEL",
    anim: "shards",
    lines: [
      "The picture is broken into shards, each one turned a different way.",
      "Drag a shard to move it. Tap it to turn it.",
      "Shards that fit together join up. A shard in its right place on the board locks in."
    ]
  }
};

const tipModal = document.getElementById("tipModal");
const tipTitle = document.getElementById("tipTitle");
const tipAnim = document.getElementById("tipAnim");
const tipText = document.getElementById("tipText");
const tipOkBtn = document.getElementById("tipOkBtn");

let openTipKey = null;
let tipDelayTimer = null;

function tipsSeen() {
  try {
    return JSON.parse(localStorage.getItem(TIPS_KEY)) || {};
  } catch {
    return {};
  }
}

function markTipSeen(key) {
  try {
    localStorage.setItem(TIPS_KEY, JSON.stringify({ ...tipsSeen(), [key]: true }));
  } catch {
    // אחסון חסום - המדריך יחזור בטעינה הבאה
  }
}

function showTip(key) {
  const tip = TIPS[key];
  if (!tip || tipsSeen()[key] || openTipKey) return false;

  openTipKey = key;
  markTipSeen(key);
  tipTitle.textContent = tip.title;
  tipAnim.className = `tip-anim tip-anim--${tip.anim}`;
  tipAnim.innerHTML = tip.anim === "pinch" ? "<i></i><i></i>" : "<i></i>";
  tipText.replaceChildren(...tip.lines.map(line => {
    const p = document.createElement("p");
    p.textContent = line;
    return p;
  }));
  tipModal.classList.remove("hidden");
  return true;
}

function closeTip() {
  openTipKey = null;
  tipModal.classList.add("hidden");
}

tipOkBtn?.addEventListener("click", closeTip);

// הטלפון הסתובב לרוחב בזמן שהרמז פתוח - הוא כבר לא נחוץ
window.addEventListener("resize", () => {
  if (openTipKey === "rotate" && window.innerWidth > window.innerHeight) closeTip();
});

// כל פעם שעוזבים את מסך המשחק, מדריך שחיכה להופיע מתבטל
function cancelPendingTip() {
  clearTimeout(tipDelayTimer);
}

window.tutorialHook = {
  // נקרא כששלב רגיל נטען (aspect = רוחב/גובה התמונה)
  levelStarted(aspect) {
    cancelPendingTip();
    tipDelayTimer = setTimeout(() => {
      if (gameScreen.classList.contains("hidden")) return;
      if (!tipsSeen().welcome) {
        showTip("welcome");
      } else if (aspect >= 1.3 && window.innerWidth <= 700 && window.innerHeight > window.innerWidth) {
        showTip("rotate");
      }
    }, 450);
  },

  // נקרא כששלב בוס מתחיל: אם עוד לא הוסבר המצב, מסבירים
  bossStarted() {
    cancelPendingTip();
    tipDelayTimer = setTimeout(() => {
      if (!gameScreen.classList.contains("hidden")) showTip("boss");
    }, 450);
  },

  // אנימציית פתיחת המנעול על כרטיס הבוס, ואחריה ההסבר. מחזיר false אם כבר הוצג
  bossReveal(card) {
    if (tipsSeen().boss) return false;

    const veil = document.createElement("span");
    veil.className = "boss-veil";
    veil.innerHTML =
      `<svg viewBox="0 0 24 24" aria-hidden="true">` +
      `<path class="lock-shackle" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" d="M8 10V7a4 4 0 0 1 8 0v3"/>` +
      `<rect class="lock-body" x="5" y="10" width="14" height="11" rx="2.2" fill="#fff" stroke="#000" stroke-width="1.2"/>` +
      `</svg>`;
    card.appendChild(veil);

    // רטט וצליל בשיא הפתיחה
    setTimeout(() => { playSound("snap"); vibrate(30); }, 700);
    setTimeout(() => { playSound("star", 2); }, 1100);
    setTimeout(() => {
      veil.remove();
      showTip("boss");
    }, 2300);
    return true;
  },

  // לכפתור "הצג מדריכים שוב" בהגדרות
  reset() {
    try {
      localStorage.removeItem(TIPS_KEY);
    } catch {
      // לא נתמך
    }
  }
};
