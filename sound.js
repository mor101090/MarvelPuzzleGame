// =====================
// Sound effects (נוצרים בקוד - בלי קבצי אודיו)
// =====================
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  // דפדפנים מתחילים את האודיו "מושהה" עד אינטראקציה ראשונה
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
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

  osc.connect(amp).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

const SOUNDS = {
  click:   (ctx) => tone(ctx, 700, 0, 0.06, { type: "square", gain: 0.05 }),
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
  invalid: (ctx) => tone(ctx, 180, 0, 0.16, { type: "sawtooth", gain: 0.06, slideTo: 120 }),
  win:     (ctx) => {
    [523, 659, 784, 1047].forEach((f, i) => tone(ctx, f, i * 0.11, 0.22, { type: "triangle", gain: 0.14 }));
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

// צליל לחיצה לכל כפתור במשחק
document.addEventListener("click", (e) => {
  if (e.target.closest("button")) {
    playSound("click");
    vibrate(15);
  }
});
