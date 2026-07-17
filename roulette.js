/* ============================================================
 *  고민 룰렛 — Ultra Flashy Edition
 *  - Three.js galaxy starfield background
 *  - Neon exploding wheel with sparkle trails
 *  - 3-2-1 countdown flash before spin
 *  - Fireworks + golden jackpot result
 *  - Idle breathing wheel + color-shifting UX
 * ============================================================ */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

const choices = [
  { label: '시', message: '지금은 바로 시작해도 좋아요.', detail: '첫걸음이 가장 빠른 해답일 수 있어요.' },
  { label: '생', message: '한 번 더 생각해보고 가볍게 시도해보세요.', detail: '무리하지 않게 시작하면 부담이 줄어요.' },
  { label: '쉬', message: '가장 먼저 쉬운 방법부터 해보세요.', detail: '작은 성공이 마음을 편하게 만들어줘요.' },
  { label: '기', message: '지금은 기다리는 게 정답일 수 있어요.', detail: '잠시 멈추는 것도 좋은 선택이에요.' },
  { label: '마', message: '당신의 마음이 이미 답을 알고 있어요.', detail: '감정이 먼저 알려주는 신호를 믿어보세요.' },
  { label: '작', message: '작은 선택 하나부터 해보세요.', detail: '큰 결정보다 작은 행동이 길을 열어요.' },
  { label: '편', message: '조금은 쉬운 쪽으로 가도 괜찮아요.', detail: '무조건 어렵게 가지 않아도 돼요.' },
  { label: '결', message: '지금 당장 결정하지 않아도 괜찮아요.', detail: '천천히 정리되는 순간도 분명 존재해요.' },
  { label: '불', message: '불안한 마음은 잠시 뒤로 미뤄두세요.', detail: '불안은 오늘의 판단을 흐리게 할 수 있어요.' },
  { label: '완', message: '너무 완벽하게 하려다 멈추지 마세요.', detail: '완벽보다 실행이 더 중요해요.' },
  { label: '해', message: '오늘은 그냥 해보는 쪽이 더 나을 수 있어요.', detail: '시도해 보면 생각보다 쉬울 수 있어요.' },
  { label: '실', message: '실패해도 괜찮으니 먼저 시도해보세요.', detail: '실패는 다음 선택을 더 잘하게 해줘요.' }
];

// Sophisticated wheel palette — elegant deep tones, not tacky rainbow
const palette = [
  '#6200ea', '#303f9f', '#00796b', '#c2185b', '#ff6f00', '#d32f2f',
  '#0288d1', '#388e3c', '#f57c00', '#5c6bc0', '#0097a7', '#e64a19'
];

const wheel = document.getElementById('roulette-wheel');
const result = document.getElementById('roulette-result');
const spinButton = document.getElementById('spin-button');
const resetButton = document.getElementById('reset-button');
const soundToggle = document.getElementById('sound-toggle');

let isSpinning = false;
let currentRotation = 0;
let soundEnabled = true;

/* ============================================================
 *  Wheel rendering
 * ============================================================ */
function renderChoices() {
  wheel.innerHTML = '';

  const labels = document.createElement('div');
  labels.className = 'wheel-labels';
  wheel.appendChild(labels);

  const center = document.createElement('div');
  center.className = 'wheel-center';
  center.innerHTML = '<span>오늘의 답</span>';
  wheel.appendChild(center);

  wheel.style.background = `conic-gradient(${choices.map((_, idx) => {
    const c = palette[idx % palette.length];
    return `${c} ${idx * (360 / choices.length)}deg ${(idx + 1) * (360 / choices.length)}deg`;
  }).join(', ')})`;

  const segmentAngle = 360 / choices.length;
  choices.forEach((choice, index) => {
    const label = document.createElement('span');
    label.className = 'wheel-label';
    label.textContent = choice.label;

    const angle = index * segmentAngle + segmentAngle / 2 - 90;
    const radius = 112;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;

    label.style.left = `calc(50% + ${x}px)`;
    label.style.top = `calc(50% + ${y}px)`;
    label.style.transform = `translate(-50%, -50%) rotate(${angle + 90}deg)`;
    labels.appendChild(label);
  });
}

/* ============================================================
 *  Web Audio — tick during spin + chime on land
 * ============================================================ */
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      audioCtx = null;
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTick(freq = 880, duration = 0.05) {
  if (!soundEnabled) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playChime() {
  if (!soundEnabled) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const start = ctx.currentTime + i * 0.09;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.5);
  });
}

/* ============================================================
 *  Spin logic — with 3-2-1 countdown + firework
 * ============================================================ */
function spinRoulette() {
  if (isSpinning) return;

  isSpinning = true;
  spinButton.disabled = true;
  spinButton.querySelector('.spin-btn-text').textContent = '돌리는 중...';
  resetButton.hidden = true;

  // Countdown flash — 3, 2, 1
  const countdownLights = ['⚡', '🌟', '💥'];
  result.classList.remove('is-result', 'reveal');
  let cdIdx = 0;
  const cdFlash = () => {
    result.innerHTML = `<span class="result-icon" style="font-size:2.5rem;animation:badgePop 0.4s">${countdownLights[cdIdx]}</span>`;
    cdIdx++;
    if (cdIdx < 3) {
      setTimeout(cdFlash, 400);
    } else {
      // GO! — spin
      result.innerHTML = '<span class="result-icon">🌀</span><span class="result-main">룰렛이 돌고 있어요...</span>';
      doActualSpin();
    }
  };
  cdFlash();
}

function doActualSpin() {
  const randomIndex = Math.floor(Math.random() * choices.length);
  const randomChoice = choices[randomIndex];
  const segmentAngle = 360 / choices.length;
  const selectedSegmentAngle = randomIndex * segmentAngle + segmentAngle / 2 - 90;
  const targetOrientation = ((-90 - selectedSegmentAngle) % 360 + 360) % 360;

  const spinAmount = 3600 + Math.floor(Math.random() * 1080);
  let finalRotation = currentRotation + spinAmount;
  const remainder = (targetOrientation - (finalRotation % 360) + 360) % 360;
  finalRotation += remainder;
  currentRotation = finalRotation;

  const duration = 6200;
  wheel.style.transition = `transform ${duration / 1000}s cubic-bezier(0.12, 0.82, 0.17, 1)`;
  wheel.style.transform = `rotate(${currentRotation}deg)`;
  wheel.classList.add('spinning');

  // Ticking
  let elapsed = 0;
  let interval = 70;
  const tickLoop = () => {
    if (!isSpinning) return;
    if (elapsed >= duration) return;
    playTick(740 + Math.random() * 200);
    elapsed += interval;
    interval = 70 + (elapsed / duration) * 280;
    setTimeout(tickLoop, interval);
  };
  tickLoop();

  setTimeout(() => {
    wheel.classList.remove('spinning');
    playChime();
    revealResult(randomChoice);
    isSpinning = false;
  }, duration);
}

function revealResult(choice) {
  // Golden jackpot reveal
  const goldenGradient = `linear-gradient(135deg, #ffd700, #ffaa00, #ffdd44, #ffd700)`;
  result.style.background = goldenGradient;
  result.style.border = '2px solid #ffd700';
  result.style.boxShadow = '0 0 60px -8px #ffd700, 0 20px 50px -12px oklch(0 0 0 / 0.3)';
  result.style.color = '#8b4513';
  
  result.innerHTML = `
    <span class="result-badge" style="background:linear-gradient(135deg,#ffd700,#ff8c00);box-shadow:0 0 20px #ffd700">${choice.label}</span>
    <span class="result-text" style="color:#8b4513;font-weight:900">${choice.message}</span>
    <span class="result-detail" style="color:#a0522d">${choice.detail}</span>
  `;
  
  result.classList.add('is-result');
  void result.offsetWidth;
  result.classList.add('reveal');

  spinButton.hidden = true;
  resetButton.hidden = false;
  fireConfetti();
  
  // Reset after 3 seconds
  setTimeout(() => {
    result.style.background = '';
    result.style.border = '';
    result.style.boxShadow = '';
    result.style.color = '';
  }, 3000);
}

function resetSpin() {
  result.innerHTML = '<span class="result-icon">🎲</span><span class="result-main">다시 마음을 가다듬고 돌려보세요.</span>';
  result.classList.remove('is-result', 'reveal');
  spinButton.hidden = false;
  spinButton.disabled = false;
  spinButton.querySelector('.spin-btn-text').textContent = '룰렛 돌리기';
  resetButton.hidden = true;
}

spinButton.addEventListener('click', () => { ensureAudio(); spinRoulette(); });
resetButton.addEventListener('click', resetSpin);

soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundToggle.classList.toggle('muted', !soundEnabled);
  if (soundEnabled) ensureAudio();
});

renderChoices();

/* ============================================================
 *  Three.js Galaxy background (mirrors main page)
 * ============================================================ */
const bgCanvas = document.getElementById('roulette-bg');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: bgCanvas,
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);

// Stars
function addStar() {
  const g = new THREE.SphereGeometry(0.15, 16, 16);
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff });
  const s = new THREE.Mesh(g, m);
  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(150));
  s.position.set(x, y, z);
  scene.add(s);
}
Array(500).fill().forEach(addStar);

// Ambient
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
const point = new THREE.PointLight(0xffffff, 1);
point.position.set(20, 20, 20);
scene.add(ambient, point);

// Floating torus
const torusG = new THREE.TorusGeometry(10, 3, 16, 100);
const torusM = new THREE.MeshStandardMaterial({ color: 0x4a90e2, wireframe: true, transparent: true, opacity: 0.25 });
const torus = new THREE.Mesh(torusG, torusM);
scene.add(torus);

// Glow ring — spinning ring
const ringG = new THREE.TorusGeometry(8, 0.4, 32, 64);
const ringM = new THREE.MeshStandardMaterial({ 
  color: 0x4a90e2, 
  transparent: true, 
  opacity: 0.3,
  emissive: 0x4a90e2,
  emissiveIntensity: 0.3
});
const ring = new THREE.Mesh(ringG, ringM);
ring.position.z = -10;
scene.add(ring);

let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX - window.innerWidth / 2) / 100;
  mouseY = (e.clientY - window.innerHeight / 2) / 100;
});

function animateBg() {
  requestAnimationFrame(animateBg);
  
  torus.rotation.x += 0.008;
  torus.rotation.y += 0.004;
  torus.rotation.z += 0.008;
  ring.rotation.x += 0.01;
  ring.rotation.y += 0.005;
  
  camera.position.x += (mouseX - camera.position.x) * 0.05;
  camera.position.y += (-mouseY - camera.position.y) * 0.05;
  camera.lookAt(scene.position);

  scene.children.forEach(child => {
    if (child.isMesh && child.geometry instanceof THREE.SphereGeometry) {
      child.position.y += 0.015;
      if (child.position.y > 60) child.position.y = -60;
    }
  });
  
  renderer.render(scene, camera);
}
animateBg();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Assign to global for background
window.bgCanvas = bgCanvas;

/* ============================================================
 *  Firework + Confetti burst on result
 * ============================================================ */
const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');
let confettiPieces = [];
let confettiActive = false;

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
resizeConfetti();
window.addEventListener('resize', resizeConfetti);

function fireConfetti() {
  const colors = palette.concat(['#ffffff', '#ffd700', '#ff4500', '#00ff7f', '#ff69b4']);
  const originX = window.innerWidth / 2;
  const originY = window.innerHeight * 0.4;
  
  // Firework burst — 3 rings
  for (let ring = 0; ring < 3; ring++) {
    const count = 50 + ring * 30;
    const speed = 8 + ring * 4;
    const delay = ring * 150;
    setTimeout(() => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * speed + 3;
        confettiPieces.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 3,
          size: Math.random() * 10 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          rot: Math.random() * Math.PI,
          vrot: (Math.random() - 0.5) * 0.5,
          life: 1
        });
      }
      if (!confettiActive) {
        confettiActive = true;
        drawConfetti();
      }
    }, delay);
  }
  
  // Sparkle rain
  setTimeout(() => {
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * window.innerWidth;
      confettiPieces.push({
        x,
        y: -20,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 4 + 2,
        size: Math.random() * 5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.3,
        life: 1
      });
    }
  }, 500);

  if (!confettiActive) {
    confettiActive = true;
    drawConfetti();
  }
}

function drawConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiPieces = confettiPieces.filter(p => p.life > 0);
  
  for (const p of confettiPieces) {
    p.vy += 0.2;
    p.vx *= 0.99;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vrot;
    p.life -= 0.006;
    
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rot);
    confettiCtx.globalAlpha = Math.max(0, p.life);
    confettiCtx.fillStyle = p.color;
    
    // Mix shapes — circle, rect, triangle
    const shape = Math.floor(Math.random() * 3);
    if (shape === 0) {
      confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
    } else if (shape === 1) {
      confettiCtx.beginPath();
      confettiCtx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
      confettiCtx.fill();
    } else {
      confettiCtx.beginPath();
      confettiCtx.moveTo(-p.size / 2, p.size / 2);
      confettiCtx.lineTo(0, -p.size / 2);
      confettiCtx.lineTo(p.size / 2, p.size / 2);
      confettiCtx.closePath();
      confettiCtx.fill();
    }
    
    confettiCtx.restore();
  }
  
  if (confettiPieces.length > 0) {
    requestAnimationFrame(drawConfetti);
  } else {
    confettiActive = false;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}
