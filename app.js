var toastTimer = null;
function showToast(message) {
  state.toast = message;
  render();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    state.toast = null;
    const node = document.getElementById("toast");
    if (node) node.remove();
  }, 2400);
}

function genderLabel(card) {
  if (card.gender === "m") return { text: "Masculine", cls: "m" };
  if (card.gender === "f") return { text: "Feminine", cls: "f" };
  if (card.gender === "fpl") return { text: "Feminine plural", cls: "f" };
  return null;
}

function go(screen) {
  if (window.speechSynthesis) speechSynthesis.cancel();
  state.screen = screen;
  if (screen === "home") {
    state.study = null;
    state.quiz = null;
  }
  render();
}

function exportSave() {
  const payload = {
    ...state.save,
    exportedAt: new Date().toISOString(),
    app: "language-app"
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "language-app-save.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
  showToast("Save file downloaded.");
}

function importSave(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || typeof data !== "object") throw new Error("bad");
      const next = defaultSave();
      state.save = {
        ...next,
        ...data,
        version: 1,
        cards: data.cards && typeof data.cards === "object" ? data.cards : {},
        settings: { ...next.settings, ...(data.settings || {}) }
      };
      rollDay();
      persist();
      showToast("Progress imported.");
      go("progress");
    } catch {
      showToast("That file couldn’t be read.");
    }
  };
  reader.readAsText(file);
}

function renderHome() {
  rollDay();
  const goal = state.save.dailyGoal;
  const today = Math.min(state.save.reviewsToday, goal);
  const pct = Math.min(100, Math.round((state.save.reviewsToday / goal) * 100));
  const dueAll = countsFor(null).due;
  return `
    <header class="brand">
      <div class="eyebrow">French for beginners</div>
      <h1>Language App</h1>
      <p>Flashcards, listening, and a quiz for English speakers — right on your phone.</p>
    </header>
    <div class="stats-row">
      <div class="stat-card">
        <div class="label">Streak</div>
        <div class="value">${state.save.streak} day${state.save.streak === 1 ? "" : "s"}</div>
        <div class="sub">Meet the daily goal</div>
      </div>
      <div class="stat-card">
        <div class="label">Today’s goal</div>
        <div class="value">${state.save.reviewsToday} / ${goal}</div>
        <div class="sub">${dueAll} card${dueAll === 1 ? "" : "s"} waiting</div>
        <div class="goal-track"><span style="width:${pct}%"></span></div>
      </div>
    </div>
    <div class="actions">
      <button class="btn btn-primary" data-act="study" data-theme="">Study cards</button>
      <button class="btn btn-secondary" data-act="quiz" data-theme="">Take a quiz</button>
      <button class="btn btn-ghost" data-act="progress">Progress &amp; backup</button>
    </div>
    <div class="section-label">Study a theme</div>
    <div class="theme-grid">
      ${THEMES.map((theme) => {
        const counts = countsFor(theme.id);
        return `<button class="theme-row" data-act="study" data-theme="${theme.id}">
          <span class="theme-dot" style="background:${theme.color}"></span>
          <span><strong>${esc(theme.name)}</strong><br><span class="sub" style="color:var(--muted);font-weight:400;font-size:0.82rem">${esc(theme.blurb)}</span></span>
          <span class="count">${counts.due} due · ${counts.total}</span>
        </button>`;
      }).join("")}
    </div>
    <p class="hint">Add this page to your home screen to use it like an app. Progress stays on this phone unless you export it.</p>
  `;
}

function renderStudy() {
  const study = state.study;
  const theme = themeById(study.themeId);
  const title = theme ? theme.name : "All cards";
  if (study.empty) {
    return `
      <div class="topbar">
        <button class="back-btn" data-act="home" aria-label="Back">←</button>
        <h2>${esc(title)}</h2>
      </div>
      <div class="empty-panel">
        <h2>You’re ahead</h2>
        <p>Nothing in this deck is due right now. You can still practice every card, and your ratings will reschedule them.</p>
        <button class="btn btn-primary" data-act="practice" data-theme="${esc(study.themeId || "")}">Practice anyway</button>
      </div>
    `;
  }
  if (study.done) {
    return `
      <div class="topbar">
        <button class="back-btn" data-act="home" aria-label="Back">←</button>
        <h2>${esc(title)}</h2>
      </div>
      <div class="done-panel">
        <h2>Nice work</h2>
        <p>You reviewed ${study.reviewed} card${study.reviewed === 1 ? "" : "s"}. Today’s total is ${state.save.reviewsToday} / ${state.save.dailyGoal}.</p>
        <div class="actions">
          <button class="btn btn-primary" data-act="study" data-theme="${esc(study.themeId || "")}">Study again</button>
          <button class="btn btn-secondary" data-act="quiz" data-theme="${esc(study.themeId || "")}">Quiz this deck</button>
          <button class="btn btn-ghost" data-act="home">Home</button>
        </div>
      </div>
    `;
  }
  const item = currentStudyItem();
  const card = CARD_BY_ID[item.id];
  const gender = genderLabel(card);
  const remaining = study.queue.length - study.index;
  const front = item.dir === "fr-en" ? card.fr : card.en;
  const back = item.dir === "fr-en" ? card.en : card.fr;
  const frontLang = item.dir === "fr-en" ? "fr" : "en";
  const backLang = item.dir === "fr-en" ? "en" : "fr";
  const longFront = front.length > 28;
  const longBack = back.length > 28;
  const prompt = item.dir === "fr-en" ? "What does this mean?" : "How do you say this in French?";
  return `
    <div class="topbar">
      <button class="back-btn" data-act="home" aria-label="Back">←</button>
      <h2>${esc(title)}</h2>
    </div>
    <div class="study-meta">
      <span>${study.index + 1} of ${study.queue.length} · ${remaining} left</span>
      <select class="dir-select" data-act="direction" aria-label="Card direction">
        <option value="mixed"${state.save.settings.direction === "mixed" ? " selected" : ""}>Mixed</option>
        <option value="fr-en"${state.save.settings.direction === "fr-en" ? " selected" : ""}>French → English</option>
        <option value="en-fr"${state.save.settings.direction === "en-fr" ? " selected" : ""}>English → French</option>
      </select>
    </div>
    <div class="card-stage">
      <div class="flashcard${study.flipped ? " flipped" : ""}" data-act="flip" role="button" tabindex="0" aria-label="Flashcard, tap to flip">
        <div class="face-front">
          ${gender && item.dir === "fr-en" ? `<span class="badge ${gender.cls}">${gender.text}</span>` : `<span class="badge">${prompt}</span>`}
          <div class="card-text${longFront ? " small" : ""}" lang="${frontLang}">${esc(front)}</div>
        </div>
        <div class="face-back">
          ${gender ? `<span class="badge ${gender.cls}">${gender.text}</span>` : ""}
          <div class="card-text${longBack ? " small" : ""}" lang="${backLang}">${esc(back)}</div>
          ${card.note ? `<p class="card-note">${esc(card.note)}</p>` : ""}
        </div>
        ${study.flipped ? "" : `<div class="flip-hint">Tap the card to flip</div>`}
      </div>
    </div>
    <div class="hear-wrap">
      <button class="hear-btn" data-act="speak" data-text="${esc(card.speak)}">Listen in French</button>
    </div>
    <div class="rate-row">
      <button class="rate-btn again" data-act="rate" data-q="1"${study.flipped ? "" : " disabled"}>Again<span>soon</span></button>
      <button class="rate-btn good" data-act="rate" data-q="4"${study.flipped ? "" : " disabled"}>Good<span>in a few days</span></button>
      <button class="rate-btn easy" data-act="rate" data-q="5"${study.flipped ? "" : " disabled"}>Easy<span>later on</span></button>
    </div>
  `;
}

function renderQuiz() {
  const quiz = state.quiz;
  const theme = themeById(quiz.themeId);
  const title = theme ? `${theme.name} quiz` : "Quiz";
  if (quiz.done) {
    const total = quiz.questions.length;
    const score = quiz.score;
    const line = score === total
      ? "Perfect score. Nice listening and reading."
      : score >= Math.ceil(total * 0.7)
        ? "Solid work. Retry the ones you missed in a study session."
        : "Keep going. A short study session will help these stick.";
    return `
      <div class="topbar">
        <button class="back-btn" data-act="home" aria-label="Back">←</button>
        <h2>${esc(title)}</h2>
      </div>
      <div class="quiz-result">
        <h2>${score} / ${total}</h2>
        <p>${line}</p>
        <div class="actions">
          <button class="btn btn-primary" data-act="quiz" data-theme="${esc(quiz.themeId || "")}">Try again</button>
          <button class="btn btn-secondary" data-act="study" data-theme="${esc(quiz.themeId || "")}">Study this deck</button>
          <button class="btn btn-ghost" data-act="home">Home</button>
        </div>
      </div>
    `;
  }
  const question = quiz.questions[quiz.index];
  const card = CARD_BY_ID[question.id];
  const prompt = question.dir === "fr-en" ? card.fr : card.en;
  const kicker = question.dir === "fr-en" ? "What does this mean?" : "How do you say this in French?";
  const pct = Math.round((quiz.index / quiz.questions.length) * 100);
  const picked = quiz.picked;
  const feedback = !picked
    ? ""
    : picked === question.answerId
      ? "Correct."
      : `It’s “${question.answer}.”`;
  return `
    <div class="topbar">
      <button class="back-btn" data-act="home" aria-label="Back">←</button>
      <h2>${esc(title)}</h2>
    </div>
    <div class="quiz-progress">Question ${quiz.index + 1} of ${quiz.questions.length}</div>
    <div class="quiz-bar"><span style="width:${pct}%"></span></div>
    <div class="prompt-card">
      <div class="prompt-kicker">${kicker}</div>
      <div class="card-text${prompt.length > 28 ? " small" : ""}" lang="${question.dir === "fr-en" ? "fr" : "en"}">${esc(prompt)}</div>
      <button class="hear-btn" data-act="speak" data-text="${esc(card.speak)}" style="margin-top:14px">Listen in French</button>
    </div>
    <div class="choices">
      ${question.choices.map((choice) => {
        let cls = "choice";
        if (picked) {
          if (choice.id === question.answerId) cls += " correct";
          else if (choice.id === picked) cls += " wrong";
        }
        return `<button class="${cls}" data-act="choose" data-id="${esc(choice.id)}"${picked ? " disabled" : ""}>${esc(choice.text)}</button>`;
      }).join("")}
    </div>
    <div class="feedback">${picked ? esc(feedback) : ""}</div>
    ${picked ? `<button class="btn btn-primary" data-act="next-q" style="width:100%;margin-top:8px">Next</button>` : ""}
  `;
}

function renderProgress() {
  rollDay();
  const all = countsFor(null);
  return `
    <div class="topbar">
      <button class="back-btn" data-act="home" aria-label="Back">←</button>
      <h2>Progress</h2>
    </div>
    <div class="stats-row">
      <div class="stat-card">
        <div class="label">Streak</div>
        <div class="value">${state.save.streak} day${state.save.streak === 1 ? "" : "s"}</div>
        <div class="sub">America/Indianapolis time</div>
      </div>
      <div class="stat-card">
        <div class="label">Learned</div>
        <div class="value">${all.learned} / ${all.total}</div>
        <div class="sub">${all.due} due now</div>
      </div>
    </div>
    <div class="section-label">Decks</div>
    <div class="progress-list">
      ${THEMES.map((theme) => {
        const counts = countsFor(theme.id);
        const pct = Math.round((counts.learned / counts.total) * 100);
        return `<div class="deck-bar">
          <div class="row"><strong>${esc(theme.name)}</strong><span>${counts.learned}/${counts.total}</span></div>
          <div class="bar"><span style="width:${pct}%;background:${theme.color}"></span></div>
        </div>`;
      }).join("")}
    </div>
    <div class="section-label">Daily goal</div>
    <div class="actions">
      <select class="dir-select" data-act="goal" style="width:100%;min-height:48px;padding:12px">
        ${[5, 10, 15, 20].map((n) => `<option value="${n}"${state.save.dailyGoal === n ? " selected" : ""}>${n} cards a day</option>`).join("")}
      </select>
    </div>
    <div class="section-label">Backup</div>
    <div class="io-row">
      <button class="btn btn-secondary" data-act="export">Export</button>
      <button class="btn btn-secondary" data-act="import">Import</button>
    </div>
    <input id="import-file" type="file" accept="application/json,.json" hidden>
    <p class="footer-note">Export a JSON backup to keep or move to another phone. Import replaces progress on this device. No accounts. Not published until you say yes.</p>
  `;
}

function render() {
  const root = document.getElementById("app");
  if (!root) return;
  let html = "";
  if (state.screen === "home") html = renderHome();
  else if (state.screen === "study") html = renderStudy();
  else if (state.screen === "quiz") html = renderQuiz();
  else html = renderProgress();
  if (state.toast) html += `<div class="toast" id="toast">${esc(state.toast)}</div>`;
  root.innerHTML = html;
  bind();
}

function bind() {
  const root = document.getElementById("app");
  root.querySelectorAll("[data-act]").forEach((el) => {
    const act = el.getAttribute("data-act");
    if (el.tagName === "SELECT") {
      el.addEventListener("change", () => {
        if (act === "direction") {
          state.save.settings.direction = el.value;
          persist();
          if (state.study && !state.study.done && currentStudyItem()) {
            currentStudyItem().dir = el.value === "mixed" ? pickDirection() : el.value;
            state.study.flipped = false;
            render();
          }
        } else if (act === "goal") {
          state.save.dailyGoal = Number(el.value) || DAILY_GOAL_DEFAULT;
          persist();
          render();
        }
      });
      return;
    }
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      const theme = el.getAttribute("data-theme");
      if (act === "home") go("home");
      else if (act === "progress") go("progress");
      else if (act === "study") startStudy(theme || null);
      else if (act === "practice") practiceAll(theme || null);
      else if (act === "quiz") startQuiz(theme || null);
      else if (act === "flip") flipCard();
      else if (act === "rate") rateCard(Number(el.getAttribute("data-q")));
      else if (act === "speak") speakFrench(el.getAttribute("data-text") || "");
      else if (act === "choose") pickChoice(el.getAttribute("data-id"));
      else if (act === "next-q") nextQuestion();
      else if (act === "export") exportSave();
      else if (act === "import") document.getElementById("import-file").click();
    });
  });
  const card = root.querySelector(".flashcard");
  if (card) {
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        flipCard();
      }
    });
  }
  const file = document.getElementById("import-file");
  if (file) {
    file.addEventListener("change", () => {
      if (file.files && file.files[0]) importSave(file.files[0]);
    });
  }
}

if ("serviceWorker" in navigator && !/autotest=1/.test(location.search)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

window.__allonsy = {
  CARDS,
  THEMES,
  state,
  startStudy,
  startQuiz,
  flipCard,
  rateCard,
  pickChoice,
  nextQuestion,
  speakFrench,
  todayKey,
  go,
  render,
  countsFor
};

render();
