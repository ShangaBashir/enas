// Global state and configurations
let audioCtx = null;
let musicPlaying = false;
let musicScheduledTimeouts = [];
let audioLoopInterval = null;
const muteBtn = document.getElementById('mute-btn');

// Canvas Setup for Particles (Confetti & Money)
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
let animationFrameId = null;
let isRaining = false;

// Resize canvas to full window
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Web Audio API Music Box Synthesizer
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// Chime note frequency mappings
const NOTES = {
  'C4': 261.63,
  'D4': 293.66,
  'E4': 329.63,
  'F4': 349.23,
  'G4': 392.00,
  'A4': 440.00,
  'Bb4': 466.16,
  'C5': 523.25,
  'D5': 587.33
};

// Play a single music box chime note
function playChime(noteName, startTime, duration) {
  if (!audioCtx || audioCtx.state === 'suspended') return;

  const frequency = NOTES[noteName];
  if (!frequency) return;

  // Primary tine oscillator
  const osc1 = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(frequency, startTime);

  // Subtle bright overtone to simulate metal tine vibration
  const osc2 = audioCtx.createOscillator();
  const overtoneGain = audioCtx.createGain();

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(frequency * 4, startTime); // 4th harmonic
  overtoneGain.gain.setValueAtTime(0.05, startTime);

  // Gain envelope: fast attack, slow decay
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.03); // Attack
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // Long decay

  overtoneGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.4);

  // Connect nodes
  osc1.connect(gainNode);
  osc2.connect(overtoneGain);

  gainNode.connect(audioCtx.destination);
  overtoneGain.connect(audioCtx.destination);

  osc1.start(startTime);
  osc1.stop(startTime + duration);

  osc2.start(startTime);
  osc2.stop(startTime + duration);
}

// Play synthesized wind sound for blowing candle
function playBlowSound() {
  initAudio();
  if (!audioCtx || audioCtx.state === 'suspended') return;

  const bufferSize = audioCtx.sampleRate * 1.0; // 1 second buffer
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  // White noise generation
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 1.0);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.0);

  noiseNode.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  noiseNode.start();
}

// Happy Birthday Song Sheet (Note name, duration in beats)
const melody = [
  { note: 'C4', beats: 0.75 }, { note: 'C4', beats: 0.25 },
  { note: 'D4', beats: 1.0 },  { note: 'C4', beats: 1.0 },
  { note: 'F4', beats: 1.0 },  { note: 'E4', beats: 2.0 },
  
  { note: 'C4', beats: 0.75 }, { note: 'C4', beats: 0.25 },
  { note: 'D4', beats: 1.0 },  { note: 'C4', beats: 1.0 },
  { note: 'G4', beats: 1.0 },  { note: 'F4', beats: 2.0 },
  
  { note: 'C4', beats: 0.75 }, { note: 'C4', beats: 0.25 },
  { note: 'C5', beats: 1.0 },  { note: 'A4', beats: 1.0 },
  { note: 'F4', beats: 1.0 },  { note: 'E4', beats: 1.0 },
  { note: 'D4', beats: 2.0 },
  
  { note: 'Bb4', beats: 0.75 }, { note: 'Bb4', beats: 0.25 },
  { note: 'A4', beats: 1.0 },   { note: 'F4', beats: 1.0 },
  { note: 'G4', beats: 1.0 },   { note: 'F4', beats: 2.0 }
];

const BEAT_DURATION = 0.55; // 550ms per beat

function playBirthdayMelody() {
  initAudio();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  let currentSecs = audioCtx.currentTime;
  
  // Clear any pre-scheduled timeouts
  musicScheduledTimeouts.forEach(clearTimeout);
  musicScheduledTimeouts = [];

  melody.forEach((item) => {
    const duration = item.beats * BEAT_DURATION;
    playChime(item.note, currentSecs, duration + 0.8); // Add overlap decay
    currentSecs += duration;
  });

  // Schedule loop
  const totalLengthMs = melody.reduce((acc, item) => acc + (item.beats * BEAT_DURATION), 0) * 1000;
  const timeoutId = setTimeout(() => {
    if (musicPlaying) playBirthdayMelody();
  }, totalLengthMs + 1000); // 1s break between repetitions

  musicScheduledTimeouts.push(timeoutId);
}

function startMusic() {
  initAudio();
  musicPlaying = true;
  muteBtn.style.display = 'flex';
  muteBtn.classList.remove('muted');
  muteBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>`;
  playBirthdayMelody();
}

function stopMusic() {
  musicPlaying = false;
  musicScheduledTimeouts.forEach(clearTimeout);
  musicScheduledTimeouts = [];
  muteBtn.classList.add('muted');
  muteBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <line x1="23" y1="9" x2="17" y2="15"></line>
      <line x1="17" y1="9" x2="23" y2="15"></line>
    </svg>`;
}

// Mute button click handler
muteBtn.addEventListener('click', () => {
  if (musicPlaying) {
    stopMusic();
  } else {
    startMusic();
  }
});

// PARTICLE ENGINE: MONEY & CONFETTI RAIN

class Particle {
  constructor(isInitialBurst = false) {
    this.reset(isInitialBurst);
  }

  reset(isInitialBurst = false) {
    // Canvas dimensions
    const w = canvas.width;
    const h = canvas.height;

    this.x = Math.random() * w;
    this.y = isInitialBurst ? Math.random() * h * 0.8 : -50;
    
    // Choose particle type: 40% dollar bills, 25% gold coins, 25% confetti, 10% hearts/stars
    const r = Math.random();
    if (r < 0.40) {
      this.type = 'bill';
    } else if (r < 0.65) {
      this.type = 'coin';
    } else if (r < 0.90) {
      this.type = 'confetti';
    } else {
      this.type = Math.random() > 0.5 ? 'heart' : 'star';
    }

    // Kinematics
    this.vy = Math.random() * 2 + 1.5; // downward speed
    this.vx = Math.random() * 1.5 - 0.75; // horizontal speed
    this.size = Math.random() * 12 + 10; // general size bounds
    
    // Fluttering sway effect
    this.swayAmplitude = Math.random() * 30 + 10;
    this.swaySpeed = Math.random() * 0.03 + 0.01;
    this.swayOffset = Math.random() * Math.PI * 2;

    // Rotation properties
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = Math.random() * 0.04 - 0.02;
    
    // Flip properties (for 3D spin effect)
    this.flip = Math.random() * Math.PI * 2;
    this.flipSpeed = Math.random() * 0.05 + 0.02;

    // Colorful confetti colors
    const colors = ['#f7cac9', '#dfba6b', '#b76e79', '#9b59b6', '#3498db', '#1abc9c', '#e74c3c'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.y += this.vy;
    this.swayOffset += this.swaySpeed;
    this.x += Math.sin(this.swayOffset) * 0.4 + this.vx;
    this.rotation += this.rotationSpeed;
    this.flip += this.flipSpeed;

    // Recycle particle if it falls off screen
    if (this.y > canvas.height + 50) {
      this.reset(false);
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(Math.cos(this.flip), 1); // 3D flip effect

    if (this.type === 'bill') {
      // Draw Dollar Bill
      const width = this.size * 2.2;
      const height = this.size * 1.1;
      
      // Bill body
      ctx.fillStyle = '#d4edda';
      ctx.strokeStyle = '#28a745';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(-width/2, -height/2, width, height);
      ctx.fill();
      ctx.stroke();

      // Border frame inside
      ctx.strokeStyle = '#218838';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.rect(-width/2 + 2, -height/2 + 2, width - 4, height - 4);
      ctx.stroke();

      // Center Oval
      ctx.fillStyle = '#c3e6cb';
      ctx.beginPath();
      ctx.ellipse(0, 0, width * 0.25, height * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dollar sign
      ctx.font = `bold ${this.size * 0.7}px Montserrat`;
      ctx.fillStyle = '#1e7e34';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0);
      
    } else if (this.type === 'coin') {
      // Draw Shiny Gold Coin
      const radius = this.size * 0.65;
      
      // Coin base
      const gradient = ctx.createRadialGradient(-radius * 0.2, -radius * 0.2, 0, 0, 0, radius);
      gradient.addColorStop(0, '#fff3b0');
      gradient.addColorStop(0.3, '#dfba6b');
      gradient.addColorStop(1, '#a67c1e');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI*2);
      ctx.fill();

      // Coin inner circle
      ctx.strokeStyle = '#bfa153';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.75, 0, Math.PI*2);
      ctx.stroke();

      // Dollar or Star symbol inside coin
      ctx.font = `bold ${radius * 0.9}px Montserrat`;
      ctx.fillStyle = '#6f5209';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0);

    } else if (this.type === 'confetti') {
      // Draw Standard Colorful Confetti
      ctx.fillStyle = this.color;
      const confSize = this.size * 0.6;
      ctx.beginPath();
      ctx.rect(-confSize/2, -confSize/2, confSize, confSize);
      ctx.fill();

    } else if (this.type === 'heart') {
      // Draw Rose Gold/Blush Heart
      ctx.fillStyle = Math.random() > 0.5 ? '#b76e79' : '#f7cac9';
      const scale = this.size * 0.04;
      ctx.beginPath();
      ctx.moveTo(0, -5 * scale);
      ctx.bezierCurveTo(-5 * scale, -15 * scale, -18 * scale, -10 * scale, -18 * scale, 3 * scale);
      ctx.bezierCurveTo(-18 * scale, 13 * scale, -8 * scale, 22 * scale, 0, 32 * scale);
      ctx.bezierCurveTo(8 * scale, 22 * scale, 18 * scale, 13 * scale, 18 * scale, 3 * scale);
      ctx.bezierCurveTo(18 * scale, -10 * scale, 5 * scale, -15 * scale, 0, -5 * scale);
      ctx.closePath();
      ctx.fill();

    } else if (this.type === 'star') {
      // Draw Sparkly Star
      ctx.fillStyle = '#ffd700';
      const spikes = 5;
      const outerRadius = this.size * 0.5;
      const innerRadius = this.size * 0.2;
      let rot = Math.PI / 2 * 3;
      let x = 0;
      let y = 0;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(0, -outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = Math.cos(rot) * outerRadius;
        y = Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = Math.cos(rot) * innerRadius;
        y = Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(0, -outerRadius);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

// Particle Loop Controller
function initParticles() {
  particles = [];
  const particleCount = Math.min(100, Math.floor(window.innerWidth / 8)); // scale with screen width
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle(true)); // Initial burst spreads them out
  }
}

function updateParticles() {
  if (!isRaining) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  
  animationFrameId = requestAnimationFrame(updateParticles);
}

function startRaining() {
  isRaining = true;
  initParticles();
  updateParticles();
}

function stopRaining() {
  isRaining = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Sparkle Pop Effect for Chest Clicking
function createSparkleBurst(centerX, centerY) {
  const bursts = [];
  const count = 30;
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 3;
    bursts.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 5 + 3,
      alpha: 1,
      color: Math.random() > 0.5 ? '#ffd700' : '#ffffff'
    });
  }

  function drawBursts() {
    if (bursts.length === 0) return;
    
    // We draw on the same particle canvas
    bursts.forEach((b, index) => {
      b.x += b.vx;
      b.y += b.vy;
      b.vy += 0.1; // gravity
      b.alpha -= 0.02;
      
      if (b.alpha <= 0) {
        bursts.splice(index, 1);
      } else {
        ctx.save();
        ctx.globalAlpha = b.alpha;
        ctx.fillStyle = b.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffd700';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    if (isRaining) {
      // It is already looping in updateParticles, so we just append drawing.
      // But if we want it to run independently when chest clicks, we can requestFrame.
      if (bursts.length > 0) {
        requestAnimationFrame(drawBursts);
      }
    }
  }

  drawBursts();
}

// APP SCENE CONTROLLER FLOW

const sceneWish = document.getElementById('scene-wish');
const sceneDarkness = document.getElementById('scene-darkness');
const sceneCelebration = document.getElementById('scene-celebration');

const candleTrigger = document.getElementById('candle-trigger');
const wishBtn = document.getElementById('wish-btn');
const timerDisplay = document.getElementById('timer-display');
const flame = document.getElementById('flame');
const candle = document.querySelector('.candle');

const chestTrigger = document.getElementById('chest-trigger');
const scrollContainer = document.getElementById('scroll-container');
const closeScrollBtn = document.getElementById('close-scroll-btn');

// Start Countdown Sequence
let wishInProgress = false;

function makeWishSequence() {
  if (wishInProgress) return;
  wishInProgress = true;
  initAudio();

  let count = 5;
  wishBtn.disabled = true;
  wishBtn.style.transform = 'scale(0.95)';
  wishBtn.style.opacity = '0.7';

  const interval = setInterval(() => {
    if (count > 0) {
      wishBtn.textContent = `Wish close: ${count}... 💫`;
      count--;
    } else {
      clearInterval(interval);
      blowOutCandle();
    }
  }, 1000);
}

// Tap trigger directly on candle
candleTrigger.addEventListener('click', () => {
  if (!wishInProgress) {
    makeWishSequence();
  }
});

// Click button
wishBtn.addEventListener('click', (e) => {
  e.stopPropagation(); // prevent double triggers on wrapper
  makeWishSequence();
});

// Blow out candle action
function blowOutCandle() {
  // 1. Play blowing sound
  playBlowSound();

  // 2. Extinguish candle flame
  candle.classList.add('blown-out');

  // 3. Switch to Darkness scene
  setTimeout(() => {
    sceneWish.classList.remove('active');
    sceneDarkness.classList.add('active');
    
    // 4. Stay in pitch black for 1.8 seconds, then trigger Celebration
    setTimeout(() => {
      sceneDarkness.classList.remove('active');
      sceneCelebration.classList.add('active');
      
      // Start celebration elements
      startMusic();
      startRaining();
    }, 1800);

  }, 600);
}

// OPEN THE SURPRISE BOX (CHEST)

let chestOpened = false;

chestTrigger.addEventListener('click', (e) => {
  if (chestOpened) return;
  chestOpened = true;

  // Add open styling
  chestTrigger.classList.add('opened');

  // Calculate coordinates for particle burst
  const rect = chestTrigger.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  // Trigger sparklers burst
  createSparkleBurst(x, y);

  // Fade out instruction text, slide open the letter scroll
  setTimeout(() => {
    // Hide instructions
    document.querySelector('.tap-instruction').style.display = 'none';
    
    // Show Letter Scroll
    scrollContainer.style.display = 'block';
    
    // Scroll letter window into view nicely
    scrollContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 600);
});

// Close Scroll Action Function
function closeLetter() {
  scrollContainer.style.animation = 'none';
  scrollContainer.offsetHeight; // trigger reflow
  scrollContainer.style.animation = 'unfold-scroll 0.8s ease reverse forwards';
  
  setTimeout(() => {
    scrollContainer.style.display = 'none';
    // Reset chest trigger so it can be re-opened if they want
    chestTrigger.classList.remove('opened');
    document.querySelector('.tap-instruction').style.display = 'block';
    chestOpened = false;
    // reset animation for next open
    scrollContainer.style.animation = 'unfold-scroll 1.2s cubic-bezier(0.25, 0.8, 0.25, 1) forwards';
  }, 800);
}

// Close Scroll Button
closeScrollBtn.addEventListener('click', closeLetter);

// OK Button after coupons
const okBtn = document.getElementById('ok-btn');
if (okBtn) {
  okBtn.addEventListener('click', closeLetter);
}

// INTERACTIVE FLIPPING COUPONS

const coupons = document.querySelectorAll('.coupon-card');

coupons.forEach(coupon => {
  coupon.addEventListener('click', () => {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    // Toggle flipped class
    coupon.classList.toggle('flipped');
    
    // Play a tiny sweet high note (chime) when flipping
    if (coupon.classList.contains('flipped')) {
      const notes = ['G5', 'A4', 'C5', 'D5'];
      const randomNote = notes[Math.floor(Math.random() * notes.length)];
      if (audioCtx && audioCtx.state !== 'suspended') {
        playChime(randomNote, audioCtx.currentTime, 0.8);
      }
    }
  });
});
