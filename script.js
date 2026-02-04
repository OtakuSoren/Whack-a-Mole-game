const holes = Array.from(document.querySelectorAll('.hole'));
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const timeDisplay = document.getElementById('time');
const scoreDisplay = document.getElementById('score');
const bestDisplay = document.getElementById('best');
const comboDisplay = document.getElementById('combo');
const livesDisplay = document.getElementById('lives');
const speedInput = document.getElementById('speed');
const speedValue = document.getElementById('speedValue');
const modeSelect = document.getElementById('mode');
const soundToggle = document.getElementById('soundToggle');
const vibrateToggle = document.getElementById('vibrateToggle');

const GAME_DURATION = 30;
const MAX_LIVES = 3;
const GOLD_CHANCE = 0.15;
const BOMB_CHANCE = 0.1;
const COMBO_STEP = 5;
const MIN_SPEED = 350;

let score = 0;
let timeLeft = GAME_DURATION;
let combo = 0;
let lives = MAX_LIVES;
let moleTimer = null;
let countdownTimer = null;
let activeIndex = -1;
let activeType = 'normal';
let isPlaying = false;
let awaitingHit = false;
let audioContext = null;
let currentSpeed = Number(speedInput.value);

const loadBestScore = () => {
  const stored = Number.parseInt(localStorage.getItem('whack-best') ?? '0', 10);
  bestDisplay.textContent = Number.isNaN(stored) ? '0' : stored.toString();
};

const updateSpeedLabel = () => {
  const seconds = (Number(speedInput.value) / 1000).toFixed(1);
  speedValue.textContent = `${seconds}s`;
};

const setScore = (value) => {
  score = value;
  scoreDisplay.textContent = score.toString();
};

const setTime = (value) => {
  timeLeft = value;
  timeDisplay.textContent = timeLeft.toString();
};

const setCombo = (value) => {
  combo = value;
  comboDisplay.textContent = combo.toString();
};

const setLives = (value) => {
  lives = value;
  livesDisplay.textContent = lives.toString();
};

const playTone = (frequency, duration = 0.08) => {
  if (!soundToggle.checked) {
    return;
  }
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.08;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
};

const triggerVibration = (pattern) => {
  if (!vibrateToggle.checked) {
    return;
  }
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

const clearMole = () => {
  if (activeIndex >= 0) {
    holes[activeIndex].classList.remove('active', 'hit', 'gold', 'bomb', 'pop', 'miss');
    holes[activeIndex].dataset.type = '';
  }
  activeIndex = -1;
  activeType = 'normal';
  awaitingHit = false;
};

const markMiss = () => {
  if (modeSelect.value !== 'survival') {
    return;
  }
  setCombo(0);
  setLives(Math.max(0, lives - 1));
  playTone(220, 0.12);
  triggerVibration([80, 50, 80]);
  if (activeIndex >= 0) {
    const hole = holes[activeIndex];
    hole.classList.add('miss');
    setTimeout(() => hole.classList.remove('miss'), 200);
  }
  if (lives <= 1) {
    endGame();
  }
};

const pickMoleType = () => {
  const roll = Math.random();
  if (roll < BOMB_CHANCE) {
    return 'bomb';
  }
  if (roll < BOMB_CHANCE + GOLD_CHANCE) {
    return 'gold';
  }
  return 'normal';
};

const spawnMole = () => {
  if (awaitingHit) {
    markMiss();
  }
  clearMole();
  const nextIndex = Math.floor(Math.random() * holes.length);
  activeIndex = nextIndex;
  activeType = pickMoleType();
  awaitingHit = true;
  holes[nextIndex].classList.add('active', 'pop');
  holes[nextIndex].classList.toggle('gold', activeType === 'gold');
  holes[nextIndex].classList.toggle('bomb', activeType === 'bomb');
  holes[nextIndex].dataset.type = activeType;
  setTimeout(() => holes[nextIndex].classList.remove('pop'), 200);
};

const applyScore = (base) => {
  const multiplier = 1 + Math.floor(combo / COMBO_STEP) * 0.5;
  setScore(score + Math.round(base * multiplier));
};

const showScoreFloat = (hole, text, type) => {
  const float = document.createElement('span');
  float.className = `score-float score-float--${type}`;
  float.textContent = text;
  hole.appendChild(float);
  setTimeout(() => float.remove(), 700);
};

const handleHit = (index) => {
  if (!isPlaying || index !== activeIndex) {
    return;
  }
  const hole = holes[index];
  hole.classList.add('hit');
  awaitingHit = false;

  if (activeType === 'bomb') {
    setCombo(0);
    applyScore(-2);
    playTone(160, 0.14);
    triggerVibration([120, 40, 120]);
    showScoreFloat(hole, '-2', 'bomb');
  } else if (activeType === 'gold') {
    setCombo(combo + 1);
    applyScore(3);
    playTone(660, 0.1);
    triggerVibration(40);
    showScoreFloat(hole, '+3', 'gold');
  } else {
    setCombo(combo + 1);
    applyScore(1);
    playTone(520, 0.08);
    triggerVibration(20);
    showScoreFloat(hole, '+1', 'normal');
  }

  if (modeSelect.value === 'survival') {
    currentSpeed = Math.max(MIN_SPEED, currentSpeed - 20);
    speedInput.value = currentSpeed.toString();
    updateSpeedLabel();
    clearInterval(moleTimer);
    moleTimer = setInterval(spawnMole, currentSpeed);
  }

  setTimeout(() => hole.classList.remove('hit'), 120);
  spawnMole();
};

const endGame = () => {
  isPlaying = false;
  startBtn.disabled = false;
  resetBtn.disabled = false;
  clearInterval(moleTimer);
  clearInterval(countdownTimer);
  clearMole();

  const bestScore = Number.parseInt(bestDisplay.textContent ?? '0', 10);
  if (score > bestScore) {
    bestDisplay.textContent = score.toString();
    localStorage.setItem('whack-best', score.toString());
  }
};

const startGame = () => {
  if (isPlaying) {
    return;
  }
  isPlaying = true;
  startBtn.disabled = true;
  resetBtn.disabled = true;
  setScore(0);
  setCombo(0);
  setLives(MAX_LIVES);
  setTime(GAME_DURATION);
  currentSpeed = Number(speedInput.value);
  spawnMole();

  moleTimer = setInterval(spawnMole, currentSpeed);
  clearInterval(countdownTimer);
  if (modeSelect.value === 'time') {
    countdownTimer = setInterval(() => {
      setTime(timeLeft - 1);
      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  } else {
    setTime('∞');
  }
};

const resetGame = () => {
  clearInterval(moleTimer);
  clearInterval(countdownTimer);
  isPlaying = false;
  startBtn.disabled = false;
  resetBtn.disabled = true;
  setScore(0);
  setCombo(0);
  setLives(MAX_LIVES);
  setTime(GAME_DURATION);
  clearMole();
};

holes.forEach((hole, index) => {
  hole.addEventListener('click', () => handleHit(index));
  hole.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleHit(index);
    }
  });
});

startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', resetGame);

speedInput.addEventListener('input', () => {
  updateSpeedLabel();
  currentSpeed = Number(speedInput.value);
  if (isPlaying) {
    clearInterval(moleTimer);
    moleTimer = setInterval(spawnMole, currentSpeed);
  }
});

modeSelect.addEventListener('change', () => {
  resetGame();
});

updateSpeedLabel();
loadBestScore();
