/* Allons-y. Classic scripts, loaded in order. Shared vars use var so later files can see them. */
/* Multiple-choice quiz. */
function startQuiz(themeId) {
  const pool = cardsFor(themeId);
  const selected = shuffle(pool).slice(0, Math.min(QUIZ_LENGTH, pool.length));
  const questions = selected.map((card) => {
    const dir = Math.random() < 0.5 ? "fr-en" : "en-fr";
    const sameTheme = pool.filter((other) => other.id !== card.id);
    const fallback = CARDS.filter((other) => other.id !== card.id);
    const distractorSource = sameTheme.length >= 3 ? sameTheme : fallback;
    const distractors = shuffle(distractorSource).slice(0, 3);
    const answer = dir === "fr-en" ? card.en : card.fr;
    const choices = shuffle([card, ...distractors]).map((entry) => ({
      id: entry.id,
      text: dir === "fr-en" ? entry.en : entry.fr
    }));
    return { id: card.id, dir, choices, answerId: card.id, answer };
  });
  state.quiz = {
    themeId,
    questions,
    index: 0,
    picked: null,
    score: 0,
    done: false
  };
  state.screen = "quiz";
  render();
}

function pickChoice(id) {
  const quiz = state.quiz;
  if (!quiz || quiz.done || quiz.picked) return;
  const question = quiz.questions[quiz.index];
  quiz.picked = id;
  if (id === question.answerId) quiz.score += 1;
  render();
}

function nextQuestion() {
  const quiz = state.quiz;
  if (!quiz || !quiz.picked) return;
  quiz.index += 1;
  quiz.picked = null;
  if (quiz.index >= quiz.questions.length) quiz.done = true;
  render();
}

