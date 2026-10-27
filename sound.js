// =====================
// Sound effects (נוצרים בקוד - בלי קבצי אודיו)
// =====================
// איזון: הצלילים והמוזיקה עוברים כל אחד דרך "ערוץ" עם עוצמה משלו
const SFX_VOLUME = 1.8;    // מגביר את כל צלילי המשחק
const MUSIC_VOLUME = 0.22; // מוזיקה ברקע, מתחת לצלילים

let audioCtx = null;
let sfxBus = null;

function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    sfxBus = audioCtx.createGain();
    sfxBus.gain.value = SFX_VOLUME;
    sfxBus.connect(audioCtx.destination);
  }
  // דפדפנים מתחילים את האודיו "מושהה" עד אינטראקציה ראשונה
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// פרץ רעש קצר (פיצוץ קונפטי): רעש לבן דרך מסנן, יורד מהר
function noiseBurst(ctx, start, duration, { gain = 0.25, freq = 1800, q = 0.8 } = {}) {
  const t0 = ctx.currentTime + start;
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(freq * 2, t0);
  filter.frequency.exponentialRampToValueAtTime(freq / 2, t0 + duration);
  filter.Q.value = q;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, t0);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  src.connect(filter).connect(amp).connect(sfxBus);
  src.start(t0);
}

function tone(ctx, freq, start, duration, { type = "sine", gain = 0.15, slideTo = null } = {}) {
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);

  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(amp).connect(sfxBus);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

const SOUNDS = {
  click:   (ctx) => tone(ctx, 700, 0, 0.06, { type: "square", gain: 0.08 }),
  pick:    (ctx) => tone(ctx, 420, 0, 0.09, { type: "triangle", gain: 0.12, slideTo: 640 }),
  drop:    (ctx) => tone(ctx, 520, 0, 0.1, { type: "triangle", gain: 0.12, slideTo: 300 }),
  snap:    (ctx) => {
    tone(ctx, 660, 0, 0.08, { type: "triangle", gain: 0.14 });
    tone(ctx, 990, 0.07, 0.14, { type: "triangle", gain: 0.14 });
  },
  star:    (ctx, i = 0) => {
    tone(ctx, 600 + i * 160, 0, 0.2, { type: "triangle", gain: 0.14 });
    tone(ctx, 1200 + i * 320, 0.02, 0.14, { type: "sine", gain: 0.06 });
  },
  rotate:  (ctx) => {
    tone(ctx, 520, 0, 0.05, { type: "square", gain: 0.07 });
    tone(ctx, 780, 0.04, 0.07, { type: "triangle", gain: 0.12, slideTo: 980 });
  },
  invalid: (ctx) => tone(ctx, 180, 0, 0.16, { type: "sawtooth", gain: 0.06, slideTo: 120 }),
  // קונפטי: פיצוץ + קול "פופ" נמוך
  pop:     (ctx) => {
    noiseBurst(ctx, 0, 0.22, { gain: 0.3, freq: 2200 });
    tone(ctx, 220, 0, 0.14, { type: "sine", gain: 0.25, slideTo: 70 });
  },
  // ניצחון: תרועה עולה ואקורד סיום מנצנץ, עם שלושה פיצוצי קונפטי (כל אחד עם הפרץ שלו על המסך)
  win:     (ctx) => {
    // תרועה: סול - דו - מי - סול
    [392, 523, 659, 784].forEach((f, i) => {
      tone(ctx, f, 0.08 + i * 0.13, 0.3, { type: "triangle", gain: 0.16 });
      tone(ctx, f / 2, 0.08 + i * 0.13, 0.3, { type: "sine", gain: 0.1 });
    });
    // אקורד דו מז'ור מלא ומחזיק
    [523, 659, 784, 1047].forEach((f) => {
      tone(ctx, f, 0.68, 1.5, { type: "triangle", gain: 0.13 });
      tone(ctx, f, 0.68, 1.5, { type: "sawtooth", gain: 0.03 });
    });
    tone(ctx, 131, 0.68, 1.5, { type: "sine", gain: 0.18 });
    // ניצנוצים גבוהים
    [1568, 2093, 2637, 3136, 2349, 3520].forEach((f, i) => {
      tone(ctx, f, 0.85 + i * 0.16, 0.35, { type: "sine", gain: 0.05 });
    });
    // שלושה פיצוצי קונפטי
    [0, 0.65, 1.3].forEach((t) => {
      noiseBurst(ctx, t, 0.22, { gain: 0.28, freq: 2200 });
      tone(ctx, 220, t, 0.14, { type: "sine", gain: 0.22, slideTo: 70 });
    });
  }
};

function playSound(name, arg) {
  if (!settings.sound) return;
  const ctx = getAudioCtx();
  if (!ctx || !SOUNDS[name]) return;
  SOUNDS[name](ctx, arg);
}

// =====================
// Vibration
// =====================
// אנדרואיד: navigator.vibrate. אייפון (iOS 18+): אין vibrate, אבל החלפת מתג
// "switch" נותנת תחושת רטט קצרה - משתמשים בזה כגיבוי.
const canVibrate = typeof navigator.vibrate === "function";
let hapticLabel = null;

function iosHapticTick() {
  try {
    if (!hapticLabel) {
      hapticLabel = document.createElement("label");
      hapticLabel.setAttribute("aria-hidden", "true");
      hapticLabel.style.cssText = "position:fixed;left:-100px;top:-100px;opacity:0;pointer-events:none;";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.setAttribute("switch", "");
      hapticLabel.appendChild(input);
      document.body.appendChild(hapticLabel);
    }
    hapticLabel.click();
  } catch {
    // לא נתמך
  }
}

function vibrate(pattern) {
  if (!settings.vibration) return;
  if (canVibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // נחסם
    }
    return;
  }
  iosHapticTick();
}

// =====================
// Music (מתנגנת בלולאה, אחרי לחיצה ראשונה - דפדפנים לא מאפשרים לנגן לפני זה)
// =====================
const music = new Audio("assets/audio/motif_hero.mp3");
music.loop = true;
music.volume = MUSIC_VOLUME;
music.preload = "auto";

let musicUnlocked = false;
let musicRouted = false;

// באייפון Safari מתעלם מ-music.volume ומנגן תמיד בעוצמה מלאה, ולכן המוזיקה
// "בלעה" את הצלילים. מעבירים אותה דרך Web Audio, שם העוצמה עובדת בכל מכשיר.
function routeMusic() {
  if (musicRouted) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const gain = ctx.createGain();
    gain.gain.value = MUSIC_VOLUME;
    ctx.createMediaElementSource(music).connect(gain).connect(ctx.destination);
    music.volume = 1; // העוצמה נקבעת עכשיו ב-gain
    musicRouted = true;
  } catch {
    // לא נתמך - נשארים עם music.volume
  }
}

function updateMusic() {
  const shouldPlay = settings.music && musicUnlocked && !document.hidden;
  if (shouldPlay && music.paused) {
    music.play().catch(() => {
      // נחסם (למשל בלי אינטראקציה) - ננסה שוב בלחיצה הבאה
      musicUnlocked = false;
    });
  } else if (!shouldPlay && !music.paused) {
    music.pause();
  }
}

function unlockMusic() {
  if (musicUnlocked) return;
  musicUnlocked = true;
  routeMusic();
  updateMusic();
}

document.addEventListener("pointerdown", unlockMusic);
document.addEventListener("keydown", unlockMusic);
// עוצרים כשהאפליקציה ברקע או שהמסך כבוי
document.addEventListener("visibilitychange", updateMusic);

// צליל לחיצה לכל כפתור במשחק. capture = נתפס לפני כל כפתור אחר,
// גם כפתורים שעוצרים את האירוע (כמו כפתורי Easy/Medium/Hard)
document.addEventListener("click", (e) => {
  if (e.target.closest("button")) {
    playSound("click");
    vibrate(15);
  }
}, true);
