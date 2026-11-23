/* Allons-y. Classic scripts, loaded in order. Shared vars use var so later files can see them. */
/* Save, schedule, and spaced-repetition helpers. */
/* Allons-y — Learn French. Vanilla JS, no build step. */
"use strict";

var STORAGE_KEY = (window.AllonsyConfig && window.AllonsyConfig.STORAGE_KEY) || "allonsy-v1";
var TZ = (window.AllonsyConfig && window.AllonsyConfig.TZ) || "America/Indianapolis";
var DAILY_GOAL_DEFAULT = (window.AllonsyConfig && window.AllonsyConfig.DAILY_GOAL_DEFAULT) || 10;
var QUIZ_LENGTH = (window.AllonsyConfig && window.AllonsyConfig.QUIZ_LENGTH) || 10;

var THEMES = window.ALLONSY_THEMES;
var CARDS = window.ALLONSY_CARDS;

var CARD_BY_ID = Object.fromEntries(CARDS.map((card) => [card.id, card]));

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function todayKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit"
  }).format(date);
}

function dayOffset(key, days) {
  const [y, m, d] = key.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d + days);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(utc);
  return parts;
}

function defaultSave() {
  return {
    version: 1,
    cards: {},
    day: todayKey(),
    reviewsToday: 0,
    streak: 0,
    lastGoalDay: null,
    dailyGoal: DAILY_GOAL_DEFAULT,
    settings: { direction: "mixed" }
  };
}

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    const base = defaultSave();
    return {
      ...base,
      ...parsed,
      cards: parsed.cards && typeof parsed.cards === "object" ? parsed.cards : {},
      settings: { ...base.settings, ...(parsed.settings || {}) }
    };
  } catch {
    return defaultSave();
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.save));
}

function rollDay() {
  const today = todayKey();
  const save = state.save;
  if (save.lastGoalDay && save.lastGoalDay !== today && dayOffset(save.lastGoalDay, 1) !== today) {
    save.streak = 0;
  }
  if (save.day !== today) {
    save.day = today;
    save.reviewsToday = 0;
  }
}

var state = {
  screen: "home",
  save: loadSave(),
  study: null,
  quiz: null,
  toast: null
};

rollDay();
persist();

function themeById(id) {
  return THEMES.find((theme) => theme.id === id);
}

function cardsFor(themeId) {
  return themeId ? CARDS.filter((card) => card.theme === themeId) : CARDS.slice();
}

function schedFor(id) {
  return state.save.cards[id] || { ef: 2.5, reps: 0, interval: 0, due: 0 };
}

function isLearned(id) {
  return (state.save.cards[id] || {}).reps > 0;
}

function isDue(id, now = Date.now()) {
  const sched = state.save.cards[id];
  if (!sched || !sched.due) return true;
  return sched.due <= now;
}

function countsFor(themeId) {
  const list = cardsFor(themeId);
  const now = Date.now();
  return {
    total: list.length,
    learned: list.filter((card) => isLearned(card.id)).length,
    due: list.filter((card) => isDue(card.id, now)).length
  };
}

function applyReview(id, quality) {
  const prev = schedFor(id);
  let ef = prev.ef || 2.5;
  let reps = prev.reps || 0;
  let interval = prev.interval || 0;
  ef = Math.max(1.3, +(ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))).toFixed(2));
  const now = Date.now();
  let due;
  if (quality < 3) {
    reps = 0;
    interval = 0;
    due = now + 60 * 1000;
  } else {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = quality === 5 ? 4 : 3;
    else interval = Math.max(1, Math.round(interval * ef * (quality === 5 ? 1.15 : 1)));
    reps += 1;
    due = now + interval * 24 * 60 * 60 * 1000;
  }
  state.save.cards[id] = { ef, reps, interval, due };
  rollDay();
  state.save.reviewsToday += 1;
  if (state.save.reviewsToday >= state.save.dailyGoal && state.save.lastGoalDay !== state.save.day) {
    state.save.streak += 1;
    state.save.lastGoalDay = state.save.day;
  }
  persist();
  return state.save.cards[id];
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDirection() {
  const mode = state.save.settings.direction || "mixed";
  if (mode === "mixed") return Math.random() < 0.5 ? "fr-en" : "en-fr";
  return mode;
}

