// =====================
// Settings (נשמר במכשיר)
// =====================
const SETTINGS_KEY = "marvelPuzzle.settings";

const settings = {
  sound: true,
  music: true,
  vibration: true,
  unlockAll: true,   // זמני: פותח את כל השלבים והרמות כדי לעבור על הכל
  ...loadSettings()
};

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // אחסון חסום (חלון פרטי וכו') - ההגדרות יחזיקו רק עד רענון
  }
}

// =====================
// Settings Modal
// =====================
const settingsModal = document.getElementById("settingsModal");
const settingsToggles = {
  sound: document.getElementById("soundToggle"),
  music: document.getElementById("musicToggle"),
  vibration: document.getElementById("vibrationToggle"),
  unlockAll: document.getElementById("unlockToggle")
};

function openSettings() {
  Object.entries(settingsToggles).forEach(([key, input]) => {
    if (input) input.checked = settings[key];
  });
  settingsModal?.classList.remove("hidden");
}

function closeSettings() {
  settingsModal?.classList.add("hidden");
}

Object.entries(settingsToggles).forEach(([key, input]) => {
  input?.addEventListener("change", () => {
    settings[key] = input.checked;
    saveSettings();
    playSound("click");
    if (key === "vibration" && input.checked) vibrate(20);
    // מרענן את מסך בחירת השלב אם הוא פתוח מאחורי ההגדרות
    if (key === "unlockAll" && typeof renderLevelSelect === "function") renderLevelSelect();
    if (key === "music") updateMusic();
  });
});

document.querySelectorAll("[data-open-settings]").forEach(btn => {
  btn.addEventListener("click", openSettings);
});

document.getElementById("closeSettingsBtn")?.addEventListener("click", closeSettings);

// לחיצה על הרקע הכהה סוגרת
settingsModal?.addEventListener("click", (e) => {
  if (e.target === settingsModal) closeSettings();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSettings();
});
