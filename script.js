const holes = Array.from(document.querySelectorAll('.hole'));
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const timeDisplay = document.getElementById('time');
const scoreDisplay = document.getElementById('score');
const bestDisplay = document.getElementById('best');
const speedInput = document.getElementById('speed');
const speedValue = document.getElementById('speedValue');

const GAME_DURATION = 30;
let score = 0;
let timeLeft = GAME_DURATION;
let moleTimer = null;
let countdownTimer = null;
let activeIndex = -1;
let isPlaying = false;

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

const clearMole = () => {
  if (activeIndex >= 0) {
    holes[activeIndex].classList.remove('active', 'hit');
  }
  activeIndex = -1;
};

const spawnMole = () => {
  clearMole();
  const nextIndex = Math.floor(Math.random() * holes.length);
  activeIndex = nextIndex;
  holes[nextIndex].classList.add('active');
};

const handleHit = (index) => {
  if (!isPlaying || index !== activeIndex) {
    return;
  }
  const hole = holes[index];
  hole.classList.add('hit');
  setScore(score + 1);
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
  setTime(GAME_DURATION);
  spawnMole();

  const speed = Number(speedInput.value);
  moleTimer = setInterval(spawnMole, speed);
  countdownTimer = setInterval(() => {
    setTime(timeLeft - 1);
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
};

const resetGame = () => {
  clearInterval(moleTimer);
  clearInterval(countdownTimer);
  isPlaying = false;
  startBtn.disabled = false;
  resetBtn.disabled = true;
  setScore(0);
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
  if (isPlaying) {
    clearInterval(moleTimer);
    moleTimer = setInterval(spawnMole, Number(speedInput.value));
  }
});

updateSpeedLabel();
loadBestScore();
