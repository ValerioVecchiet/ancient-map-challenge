(() => {
  const GAME_SECONDS = 300;
  const QUESTION_SECONDS = 15;
  const QUESTIONS_PER_GAME = 30;
  const NEXT_QUESTION_DELAY_MS = 1400;
  const REASONS = {
    time: 'Il tempo a disposizione è scaduto.',
    deck: 'Hai completato tutte le domande.',
    quit: 'Partita terminata in anticipo.',
  };

  const $ = (id) => document.getElementById(id);
  const screens = {
    home: $('screen-home'),
    game: $('screen-game'),
    results: $('screen-results'),
  };
  const markers = {};
  let periodRegionIds = [];
  let selectedPeriodId = PERIODS[0].id;
  let selectedMode = 'history';
  let regions = REGIONS;
  let game = null;

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function formatTime(seconds) {
    const total = Math.ceil(seconds);
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => el.classList.toggle('active', key === name));
    window.scrollTo({ top: 0 });
  }

  function buildMarkers() {
    const modern = selectedMode === 'modern';
    regions = modern ? MODERN_REGIONS : REGIONS;
    const shapes = modern ? MODERN_SHAPES : REGION_SHAPES;
    const paths = Object.keys(regions)
      .map((id) => `<path class="map-region" data-id="${id}" d="${shapes[id]}" role="button" tabindex="0" aria-label="Seleziona territorio"></path>`)
      .join('');
    Object.keys(markers).forEach((id) => delete markers[id]);
    $('map').classList.toggle('modern-map', modern);
    $('map').parentElement.classList.toggle('modern-map-wrap', modern);
    $('map').setAttribute('role', 'group');
    $('map').setAttribute('aria-label', modern ? 'Mappa politica di Europa e Mediterraneo' : 'Cartina storica dell’Impero Romano');
    $('map').innerHTML = `${modern ? '' : '<img class="map-image" src="./mappa-impero-romano.jpg" alt="" draggable="false" />'}<svg class="map-regions" viewBox="${modern ? '0 0 1200 950' : '0 0 1920 1323'}" preserveAspectRatio="xMidYMid meet">${modern ? `<path class="map-context" d="${MODERN_CONTEXT}" />` : ''}${paths}</svg>`;
    $('map').querySelectorAll('.map-region').forEach((el) => {
      markers[el.dataset.id] = el;
      const select = () => {
        Object.values(markers).forEach((other) => other !== el && other.classList.remove('is-selected'));
        el.classList.toggle('is-selected');
        el.setAttribute('aria-pressed', String(el.classList.contains('is-selected')));
      };
      el.addEventListener('click', select);
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); }
      });
    });
  }

  function setRegionState(id, state) {
    markers[id].classList.remove('is-active', 'is-ok', 'is-ko');
    markers[id].classList.add(`is-${state}`);
  }

  function highlightRegion(id, state = null) {
    Object.entries(markers).forEach(([regionId, el]) => {
      el.classList.remove('is-active', 'is-ok', 'is-ko', 'is-selected');
      el.setAttribute('aria-pressed', 'false');
      el.classList.toggle('is-off', !periodRegionIds.includes(regionId));
    });
    if (id && state) setRegionState(id, state);
  }

  function setMapPeriod(period) {
    periodRegionIds = period.regions;
    highlightRegion(null);
  }

  function chooseMode(mode) {
    selectedMode = mode;
    $('mode-selection').hidden = true;
    $('mode-setup').hidden = false;
    $('history-setup').hidden = mode === 'modern';
    $('setup-title').textContent = mode === 'modern' ? 'Modalità Attualità' : 'Modalità Storia';
    $('start-btn').focus({ preventScroll: true });
  }

  function returnHome() {
    $('mode-selection').hidden = false;
    $('mode-setup').hidden = true;
    showScreen('home');
  }

  function renderPeriods() {
    $('period-list').innerHTML = PERIODS.map((period) => `
      <button type="button" class="period-card" data-id="${period.id}" aria-pressed="${period.id === selectedPeriodId}">
        <span class="period-year">${period.year}</span>
        <span class="period-title">${period.title}</span>
        <span class="period-desc">${period.description}</span>
      </button>
    `).join('');

    $('period-list').addEventListener('click', (event) => {
      const card = event.target.closest('.period-card');
      if (!card) return;
      selectedPeriodId = card.dataset.id;
      $('period-list').querySelectorAll('.period-card').forEach((el) => {
        el.setAttribute('aria-pressed', String(el === card));
      });
    });
  }

  function buildQuestion(regionId, poolIds) {
    const target = regions[regionId];
    const kind = Math.random() < 0.5 ? 'name' : 'capital';
    const valueOf = (region) => (kind === 'name' ? region.name : region.capital);
    const distractors = shuffle(poolIds.filter((id) => id !== regionId))
      .slice(0, 3)
      .map((id) => valueOf(regions[id]));
    const options = shuffle([valueOf(target), ...distractors]);
    return { regionId, kind, options, answer: options.indexOf(valueOf(target)) };
  }

  function buildDeck(poolIds) {
    const order = [];
    while (order.length < QUESTIONS_PER_GAME) order.push(...shuffle(poolIds));
    order.length = QUESTIONS_PER_GAME;
    return order.map((regionId) => buildQuestion(regionId, poolIds));
  }

  function renderScoreboard() {
    $('score').textContent = game.score;
    $('correct').textContent = game.correct;
    $('wrong').textContent = game.wrong;
  }

  function updateClock(remaining) {
    $('clock-value').textContent = formatTime(remaining);
    $('clock-fill').style.width = `${(remaining / GAME_SECONDS) * 100}%`;
    $('hud-clock').classList.toggle('warning', remaining <= 60);
  }

  function updateQuestionTimer(left) {
    $('q-time').textContent = `${Math.ceil(left)}s`;
    $('q-time').classList.toggle('low', left <= 5);
    $('q-bar-fill').style.width = `${(left / QUESTION_SECONDS) * 100}%`;
  }

  function questionSecondsLeft() {
    return Math.max(0, QUESTION_SECONDS - (Date.now() - game.questionStartedAt) / 1000);
  }

  function setFeedback(type, text) {
    const el = $('feedback');
    el.className = type ? `feedback ${type}` : 'feedback';
    el.textContent = text;
  }

  function renderQuestion(question, index, total) {
    $('q-count').textContent = `Domanda ${index + 1} di ${total}`;
    $('q-kind').textContent = question.kind === 'name' ? 'Identifica il territorio' : selectedMode === 'modern' ? 'Capitale' : 'Capitale storica';
    $('q-text').textContent = question.kind === 'name'
      ? 'Quale territorio è evidenziato sulla mappa?'
      : selectedMode === 'modern' ? 'Qual è la capitale dello stato evidenziato?' : 'Qual è la capitale storica del territorio evidenziato?';

    const optionsEl = $('options');
    optionsEl.innerHTML = '';
    question.options.forEach((label, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'option';
      button.innerHTML = '<span class="option-key"></span><span class="option-label"></span>';
      button.querySelector('.option-key').textContent = i + 1;
      button.querySelector('.option-label').textContent = label;
      button.addEventListener('click', () => answer(i));
      optionsEl.append(button);
    });
    setFeedback('', '');
  }

  function nextQuestion() {
    if (!game) return;
    game.index += 1;
    if (game.index >= game.deck.length) {
      finishGame('deck');
      return;
    }
    game.current = game.deck[game.index];
    game.answered = false;
    game.questionStartedAt = Date.now();
    highlightRegion(game.current.regionId, 'active');
    renderQuestion(game.current, game.index, game.deck.length);
    updateQuestionTimer(QUESTION_SECONDS);
  }

  function answer(choice) {
    if (!game || game.answered) return;
    game.answered = true;

    const question = game.current;
    const timeLeft = questionSecondsLeft();
    const buttons = [...$('options').children];
    buttons.forEach((button) => { button.disabled = true; });
    buttons[question.answer].classList.add('correct');
    const correctLabel = question.options[question.answer];

    if (choice === question.answer) {
      const points = 100 + Math.round((100 * timeLeft) / QUESTION_SECONDS);
      game.score += points;
      game.correct += 1;
      setRegionState(question.regionId, 'ok');
      setFeedback('good', `Esatto! +${points} punti`);
    } else {
      game.wrong += 1;
      if (choice >= 0) buttons[choice].classList.add('wrong');
      setRegionState(question.regionId, 'ko');
      setFeedback('bad', choice < 0
        ? `Tempo scaduto. La risposta era: ${correctLabel}`
        : `Sbagliato. La risposta era: ${correctLabel}`);
    }

    renderScoreboard();
    game.nextId = setTimeout(nextQuestion, NEXT_QUESTION_DELAY_MS);
  }

  function tick() {
    if (!game) return;
    const remaining = Math.max(0, GAME_SECONDS - (Date.now() - game.startedAt) / 1000);
    updateClock(remaining);
    if (remaining <= 0) {
      finishGame('time');
      return;
    }
    if (game.current && !game.answered) {
      const left = questionSecondsLeft();
      updateQuestionTimer(left);
      if (left <= 0) answer(-1);
    }
  }

  function rankMessage(accuracy) {
    if (selectedMode === 'modern') {
      if (accuracy >= 80) return 'Ottimo risultato, conosci il mondo di oggi!';
      if (accuracy >= 50) return 'Buon lavoro: continua a esplorare la geografia.';
      return 'Ci sono ancora tanti paesi da scoprire: riprova!';
    }
    if (accuracy >= 80) return 'Sei un vero stratega di Roma!';
    if (accuracy >= 50) return 'Buon lavoro, legionario: continua ad allenarti.';
    return 'La storia ha ancora molto da insegnarti: riprova!';
  }

  function finishGame(reason) {
    if (!game) return;
    const finished = game;
    clearInterval(finished.tickId);
    clearTimeout(finished.nextId);
    game = null;
    highlightRegion(null);

    const answered = finished.correct + finished.wrong;
    const accuracy = answered ? Math.round((finished.correct / answered) * 100) : 0;
    $('res-period').textContent = `${finished.period.title} · ${finished.period.year}`;
    $('res-reason').textContent = REASONS[reason];
    $('res-score').textContent = finished.score;
    $('res-correct').textContent = finished.correct;
    $('res-wrong').textContent = finished.wrong;
    $('res-accuracy').textContent = `${accuracy}%`;
    $('res-rank').textContent = rankMessage(accuracy);
    showScreen('results');
  }

  function startGame() {
    const period = selectedMode === 'modern'
      ? { title: 'Modalità Attualità', year: 'Europa e Mediterraneo', regions: Object.keys(MODERN_REGIONS) }
      : PERIODS.find((p) => p.id === selectedPeriodId);
    if (!period) return;
    buildMarkers();
    game = {
      period,
      deck: buildDeck(period.regions),
      index: -1,
      current: null,
      answered: false,
      score: 0,
      correct: 0,
      wrong: 0,
      startedAt: Date.now(),
      questionStartedAt: 0,
      tickId: null,
      nextId: null,
    };
    setMapPeriod(period);
    $('game-period').textContent = `${period.title} · ${period.year}`;
    $('map-heading').textContent = selectedMode === 'modern' ? 'Mappa politica moderna' : 'Mappa del periodo';
    renderScoreboard();
    updateClock(GAME_SECONDS);
    setFeedback('', '');
    showScreen('game');
    game.tickId = setInterval(tick, 100);
    nextQuestion();
  }

  $('start-btn').addEventListener('click', startGame);
  $('quit-btn').addEventListener('click', () => finishGame('quit'));
  $('again-btn').addEventListener('click', startGame);
  $('change-btn').addEventListener('click', returnHome);
  $('history-mode-btn').addEventListener('click', () => chooseMode('history'));
  $('modern-mode-btn').addEventListener('click', () => chooseMode('modern'));
  $('back-modes-btn').addEventListener('click', returnHome);

  document.addEventListener('keydown', (event) => {
    if (!game || game.answered) return;
    const choice = Number(event.key) - 1;
    if (choice >= 0 && choice < game.current.options.length) answer(choice);
  });

  $('modern-preview').innerHTML = `<svg viewBox="0 0 1200 950" aria-hidden="true"><path class="map-context" d="${MODERN_CONTEXT}" />${Object.values(MODERN_SHAPES).map((d) => `<path class="preview-country" d="${d}" />`).join('')}</svg>`;
  renderPeriods();
  showScreen('home');
})();
