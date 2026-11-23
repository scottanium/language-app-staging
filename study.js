/* Allons-y. Classic scripts, loaded in order. Shared vars use var so later files can see them. */
/* Flashcard study session. */
function startStudy(themeId) {
  const now = Date.now();
  const pool = cardsFor(themeId);
  const due = shuffle(pool.filter((card) => isDue(card.id, now)));
  const queue = due.map((card) => ({ id: card.id, dir: pickDirection() }));
  state.study = {
    themeId,
    queue,
    index: 0,
    flipped: false,
    done: queue.length === 0,
    reviewed: 0,
    empty: queue.length === 0
  };
  state.screen = "study";
  render();
}

function practiceAll(themeId) {
  const queue = shuffle(cardsFor(themeId)).map((card) => ({ id: card.id, dir: pickDirection() }));
  state.study = {
    themeId,
    queue,
    index: 0,
    flipped: false,
    done: false,
    reviewed: 0,
    empty: false
  };
  state.screen = "study";
  render();
}

function currentStudyItem() {
  const study = state.study;
  if (!study || study.done || study.empty) return null;
  return study.queue[study.index] || null;
}

function flipCard() {
  if (!state.study || state.study.done || state.study.empty) return;
  state.study.flipped = true;
  render();
}

function rateCard(quality) {
  const item = currentStudyItem();
  if (!item || !state.study.flipped) return;
  applyReview(item.id, quality);
  const study = state.study;
  study.reviewed += 1;
  if (quality < 3) {
    study.queue.push({ id: item.id, dir: pickDirection() });
  }
  study.index += 1;
  study.flipped = false;
  if (study.index >= study.queue.length) study.done = true;
  render();
}

