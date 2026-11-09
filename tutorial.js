// =====================
// Tips (מדריכים קצרים): כל אחד קופץ פעם אחת ונשמר שנראה
// 1. welcome: איך משחקים, כולל זום - בתחילת המשחק
// 2. rotate:  רמז עם אנימציה לסובב את הטלפון - בשלב הרחב הראשון
// 3. boss:    מנעול הבוס הראשון נשבר בברק, והסבר על שלב בוס - אחרי שלב 10 (עוברים אליו ישר)
// 4. group:   כשמסיימים את השלב האחרון בקבוצה נפתחת גם הקבוצה הבאה, ובפעם הבאה שרואים את בחירת השלב יש אנימציה (כל קבוצה פעם אחת)
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

  // האם עוד לא ראו את אנימציית הפתיחה של הבוס של הקבוצה group (אחרי שלב 10, 20...).
  // מי שכבר ראה את הבוס הראשון (לפני שהאנימציה נשמרה לכל בוס) לא יראה אותו שוב
  bossRevealPending(group) {
    const seen = tipsSeen();
    return !seen[`bossReveal${group}`] && !(group === 0 && seen.boss);
  },

  // המנעול של הבוס נשבר בברק על הכרטיס, ואחריו ההסבר. מחזיר false אם כבר הוצג
  bossReveal(card, group) {
    if (!this.bossRevealPending(group)) return false;
    markTipSeen(`bossReveal${group}`);

    // המנעול מתפצל לשני חצאים (אותו ציור, שני חיתוכים), וברק מכה בו
    const lock =
      `<path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>` +
      `<rect x="5" y="10" width="14" height="11" rx="2.2" fill="#fff" stroke="#000" stroke-width="1.2"/>`;
    const veil = document.createElement("span");
    veil.className = "boss-veil";
    veil.innerHTML =
      `<svg viewBox="0 0 24 24" aria-hidden="true"><defs>` +
      `<clipPath id="lockClipL"><polygon points="-2,-2 13.2,-2 10.6,9 13.6,15 11.4,26 -2,26"/></clipPath>` +
      `<clipPath id="lockClipR"><polygon points="26,-2 13.2,-2 10.6,9 13.6,15 11.4,26 26,26"/></clipPath></defs>` +
      `<g class="lock-half lock-half--l" clip-path="url(#lockClipL)">${lock}</g>` +
      `<g class="lock-half lock-half--r" clip-path="url(#lockClipR)">${lock}</g></svg>` +
      `<svg class="lock-bolt" viewBox="0 0 24 24" aria-hidden="true">` +
      `<polyline points="15,-3 9,6 14.5,8.5 7.5,17 12,19 8,27" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>` +
      `<polyline points="15,-3 9,6 14.5,8.5 7.5,17 12,19 8,27" fill="none" stroke="#9fd8ff" stroke-width="3.4" stroke-linejoin="round" opacity="0.55"/></svg>`;
    card.appendChild(veil);

    // הבזק ברק על כל המסך, ואחריו הצליל והרטט (תואם לאנימציה ב-CSS)
    const flash = document.createElement("div");
    flash.className = "lightning-flash";
    document.body.appendChild(flash);
    setTimeout(() => { playSound("lockBreak"); vibrate([60, 30, 120, 40, 60]); }, 450);
    setTimeout(() => flash.remove(), 1400);
    setTimeout(() => {
      veil.remove();
      showTip("boss");
    }, 2500);
    return true;
  },

  // האם כבר הוצגה האנימציה שהקבוצה group נפתחה
  groupRevealPending(group) {
    return !tipsSeen()[`group${group}`];
  },

  // קבוצת שלבים חדשה נפתחה (אחרי שסיימו את השלב האחרון בקבוצה שלפניה): מגללים אליה, באנר, קונפטי וצליל,
  // והכרטיסים קופצים אחד אחרי השני
  groupReveal(section, name, group) {
    if (!this.groupRevealPending(group)) return;
    markTipSeen(`group${group}`);

    section.classList.add("group-reveal");
    section.querySelectorAll(".level-card").forEach((card, i) => card.style.setProperty("--i", i));

    const banner = document.createElement("div");
    banner.className = "unlock-banner";
    banner.innerHTML = `<span>NEW LEVELS UNLOCKED</span><b></b>`;
    banner.querySelector("b").textContent = name;

    setTimeout(() => {
      if (levelScreen.classList.contains("hidden")) return;
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      document.body.appendChild(banner);
      playSound("unlock");
      vibrate([30, 40, 30, 40, 90]);
      startConfetti();
      setTimeout(() => banner.remove(), 2700);
    }, 250);
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
