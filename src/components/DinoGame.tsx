import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Team } from '../types';
import { submitScore } from '../lib/storage';
import { audio } from '../lib/audio';
import { Play, RotateCcw, Send, Volume2, VolumeX, ArrowUp, ArrowDown, Trophy, Sparkles, CheckCircle2, PartyPopper } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface DinoGameProps {
  activeTeam: Team | null;
  onScoreSubmitted: (updatedTeam: Team, scoreSubmitted: number, isNewHigh: boolean) => void;
  onChangeTeam: () => void;
}

interface Obstacle {
  x: number;
  width: number;
  height: number;
  type: 'cactus' | 'cactus-group' | 'pterodactyl';
  yOffset: number; // For pterodactyl
  passed?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
}

interface Cloud {
  x: number;
  y: number;
  speed: number;
}

interface Flower {
  x: number;
  petalColor: string;
  centerColor: string;
  size: number;
  stemHeight: number;
}

export type TimePhase = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

interface RGB { r: number; g: number; b: number }

function parseHex(hex: string): RGB {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function lerpRGB(c1: RGB, c2: RGB, t: number): RGB {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t),
  };
}

function rgbToString(c: RGB, alpha = 1): string {
  return alpha === 1 ? `rgb(${c.r}, ${c.g}, ${c.b})` : `rgba(${c.r}, ${c.g}, ${c.b}, ${Number(alpha.toFixed(2))})`;
}

function lerpColor(hex1: string, hex2: string, t: number): string {
  const c1 = parseHex(hex1);
  const c2 = parseHex(hex2);
  const blended = lerpRGB(c1, c2, t);
  return rgbToString(blended);
}

function interpolateCycleColor(colors: [string, string, string, string], progress: number): string {
  const p = ((progress % 4) + 4) % 4;
  const i = Math.floor(p);
  const nextI = (i + 1) % 4;
  const t = p - i;
  return lerpColor(colors[i], colors[nextI], t);
}

export function getTimePhase(score: number): {
  phase: TimePhase;
  label: string;
  badgeStyle: string;
  subLabel: string;
} {
  const cycleLength = 800;
  const p = ((score % cycleLength) / cycleLength) * 4;
  const closest = Math.round(p) % 4;
  switch (closest) {
    case 0:
      return {
        phase: 'MORNING',
        label: '🌅 MORNING',
        badgeStyle: 'bg-amber-100 text-amber-900 border border-amber-300',
        subLabel: 'DAWN SUNRISE',
      };
    case 1:
      return {
        phase: 'AFTERNOON',
        label: '☀️ AFTERNOON',
        badgeStyle: 'bg-sky-100 text-sky-900 border border-sky-300',
        subLabel: 'BRIGHT DAY',
      };
    case 2:
      return {
        phase: 'EVENING',
        label: '🌆 EVENING',
        badgeStyle: 'bg-orange-100 text-orange-950 border border-orange-300',
        subLabel: 'SUNSET DUSK',
      };
    case 3:
    default:
      return {
        phase: 'NIGHT',
        label: '🌙 NIGHT',
        badgeStyle: 'bg-slate-900 text-yellow-300 border border-slate-700 shadow-md',
        subLabel: 'STARRY NIGHT',
      };
  }
}

export const DinoGame: React.FC<DinoGameProps> = ({ activeTeam, onScoreSubmitted, onChangeTeam }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(activeTeam?.highScore || 0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [scoreSubmitted, setScoreSubmitted] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{ isNewHigh: boolean } | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDucking, setIsDucking] = useState<boolean>(false);

  // References for game loop execution without state lag
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  
  // Physics & entities
  const dinoYRef = useRef<number>(0);
  const dinoVelocityYRef = useRef<number>(0);
  const isJumpingRef = useRef<boolean>(false);
  const isDuckingRef = useRef<boolean>(false);
  const speedRef = useRef<number>(7.5);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const groundOffsetRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const flowersRef = useRef<Flower[]>([]);
  const screenShakeRef = useRef<number>(0);

  const activeTeamRef = useRef(activeTeam);
  const onScoreSubmittedRef = useRef(onScoreSubmitted);

  useEffect(() => {
    activeTeamRef.current = activeTeam;
  }, [activeTeam]);

  useEffect(() => {
    onScoreSubmittedRef.current = onScoreSubmitted;
  }, [onScoreSubmitted]);

  // Update high score if team changes
  useEffect(() => {
    if (activeTeam) {
      setHighScore(activeTeam.highScore);
    }
  }, [activeTeam]);

  // Confetti Particle Explosion helper
  const triggerHighscoreConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#A855F7', '#FFD700'],
      });

      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.7 },
          colors: ['#4285F4', '#FBBC05', '#34A853'],
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.7 },
          colors: ['#EA4335', '#FBBC05', '#A855F7'],
        });
      }, 200);

      setTimeout(() => {
        confetti({
          particleCount: 75,
          spread: 100,
          origin: { y: 0.4 },
          colors: ['#FBBC05', '#FFD700', '#34A853', '#4285F4'],
        });
      }, 450);
    } catch {
      // Fallback
    }
  }, []);

  // Generate background stars, clouds & ground flowers
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * 1200,
        y: Math.random() * 250,
        size: Math.random() * 2 + 1,
      });
    }
    starsRef.current = stars;

    const clouds: Cloud[] = [];
    for (let i = 0; i < 8; i++) {
      clouds.push({
        x: Math.random() * 1200,
        y: 20 + Math.random() * 120,
        speed: 0.5 + Math.random() * 0.7,
      });
    }
    cloudsRef.current = clouds;

    const flowers: Flower[] = [];
    const petalColors = ['#EF4444', '#EC4899', '#F59E0B', '#3B82F6', '#A855F7', '#F43F5E', '#34D399'];
    for (let i = 0; i < 9; i++) {
      flowers.push({
        x: i * 160 + Math.random() * 50,
        petalColor: petalColors[i % petalColors.length],
        centerColor: '#FEF08A',
        size: 3 + (i % 2),
        stemHeight: 6 + (i % 4),
      });
    }
    flowersRef.current = flowers;
  }, []);

  // Audio mute sync
  const toggleSound = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  // Jump trigger
  const triggerJump = useCallback(() => {
    if (gameState === 'IDLE' || gameState === 'GAMEOVER') {
      startGame();
      return;
    }
    if (gameState === 'PLAYING' && !isJumpingRef.current && !isDuckingRef.current) {
      isJumpingRef.current = true;
      dinoVelocityYRef.current = -13.5; // Stronger crisp jump for higher speed
      audio.playJump();
    }
  }, [gameState]);

  // Duck trigger
  const setDuckState = useCallback((ducking: boolean) => {
    if (gameState === 'PLAYING' && !isJumpingRef.current) {
      isDuckingRef.current = ducking;
      setIsDucking(ducking);
    }
  }, [gameState]);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        triggerJump();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        setDuckState(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        setDuckState(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [triggerJump, setDuckState]);

  // Start game loop
  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setScoreSubmitted(false);
    setSubmissionSuccess(null);
    scoreRef.current = 0;
    speedRef.current = 7.5; // Increased initial speed for higher difficulty
    dinoYRef.current = 0;
    dinoVelocityYRef.current = 0;
    isJumpingRef.current = false;
    isDuckingRef.current = false;
    setIsDucking(false);
    obstaclesRef.current = [];
    particlesRef.current = [];
    groundOffsetRef.current = 0;
    frameCountRef.current = 0;
    lastTimeRef.current = performance.now();

    const petalColors = ['#EF4444', '#EC4899', '#F59E0B', '#3B82F6', '#A855F7', '#F43F5E', '#34D399'];
    const flowers: Flower[] = [];
    for (let i = 0; i < 9; i++) {
      flowers.push({
        x: i * 160 + Math.random() * 50,
        petalColor: petalColors[i % petalColors.length],
        centerColor: '#FEF08A',
        size: 3 + (i % 2),
        stemHeight: 6 + (i % 4),
      });
    }
    flowersRef.current = flowers;

    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    gameLoopRef.current = requestAnimationFrame(updateGame);
  };

  // Spawn obstacles with higher difficulty gaps and faster pterodactyl appearance
  const spawnObstacle = (canvasWidth: number) => {
    const minDistance = 210 + speedRef.current * 14;
    const lastObstacle = obstaclesRef.current[obstaclesRef.current.length - 1];
    
    if (lastObstacle && canvasWidth - lastObstacle.x < minDistance) {
      return;
    }

    const currentScore = scoreRef.current;
    const types: ('cactus' | 'cactus-group' | 'pterodactyl')[] = ['cactus', 'cactus-group'];
    
    if (currentScore > 150) { // Pterodactyls appear earlier (150+ pts)
      types.push('pterodactyl');
    }

    const type = types[Math.floor(Math.random() * types.length)];
    let width = 24;
    let height = 45;
    let yOffset = 0;

    if (type === 'cactus-group') {
      width = 48;
      height = 45;
    } else if (type === 'pterodactyl') {
      width = 38;
      height = 30;
      // High, medium, or low flight height
      yOffset = Math.random() > 0.5 ? 45 : 15;
    }

    obstaclesRef.current.push({
      x: canvasWidth + 20,
      width,
      height,
      type,
      yOffset,
    });
  };

  // Main game loop
  const updateGame = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = time;

    frameCountRef.current++;

    // Determine Base Speed (accelerates faster with score)
    const baseSpeed = 7.5 + Math.floor(scoreRef.current / 80) * 0.75;
    speedRef.current = baseSpeed;

    // Score Addition Rate
    const scoreRate = 0.18;
    scoreRef.current += scoreRate;
    const currentScoreInt = Math.floor(scoreRef.current);
    setScore(currentScoreInt);

    // Audio milestone sound every 100 points
    if (currentScoreInt > 0 && currentScoreInt % 100 === 0 && Math.floor(scoreRef.current - scoreRate) % 100 !== 0) {
      audio.playMilestone();
    }

    // Dino Physics (sharper gravity = 0.75)
    const gravity = 0.75;
    const groundY = canvas.height - 35; // Ground level

    if (isJumpingRef.current) {
      dinoYRef.current += dinoVelocityYRef.current;
      dinoVelocityYRef.current += gravity;

      if (dinoYRef.current >= 0) {
        dinoYRef.current = 0;
        dinoVelocityYRef.current = 0;
        // Burst landing dust particles
        for (let p = 0; p < 6; p++) {
          particlesRef.current.push({
            x: 60 + 10 + (Math.random() - 0.5) * 16,
            y: groundY - 1,
            vx: (Math.random() - 0.5) * 3,
            vy: -0.5 - Math.random() * 1.2,
            size: 2 + Math.random() * 2,
            alpha: 0.8,
            color: '#94A3B8',
          });
        }
        isJumpingRef.current = false;
      }
    } else {
      // Running dust particles
      const cycleProgress = ((currentScoreInt % 800) / 800) * 4;
      const dustColor = interpolateCycleColor(['#CBD5E1', '#94A3B8', '#FDBA74', '#334155'], cycleProgress);

      if (frameCountRef.current % 4 === 0) {
        particlesRef.current.push({
          x: 60 + 4 + Math.random() * 6,
          y: groundY - 1,
          vx: -1.2 - Math.random() * 1.5,
          vy: -0.3 - Math.random() * 0.5,
          size: 2 + Math.random() * 2,
          alpha: 0.7,
          color: dustColor,
        });
      }
    }

    // Scroll ground & flowers
    groundOffsetRef.current = (groundOffsetRef.current + speedRef.current) % 20;
    flowersRef.current.forEach((f) => {
      f.x -= speedRef.current;
      if (f.x < -20) {
        f.x = canvas.width + 120 + Math.random() * 280;
      }
    });

    // Spawn Obstacles (increased frequency)
    if (Math.random() < 0.025) {
      spawnObstacle(canvas.width);
    }

    // Move Obstacles
    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      const obs = obstaclesRef.current[i];
      obs.x -= speedRef.current;

      if (obs.type === 'pterodactyl') {
        obs.yOffset = (obs.yOffset || 15) + Math.sin(frameCountRef.current * 0.15 + obs.x * 0.05) * 0.4;
      }

      if (obs.x + obs.width < 0) {
        obstaclesRef.current.splice(i, 1);
      }
    }

    // Dino Hitbox calculation
    const dinoWidth = isDuckingRef.current ? 48 : 34;
    const dinoHeight = isDuckingRef.current ? 24 : 38;
    const dinoX = 60;
    const dinoActualY = groundY - dinoHeight + dinoYRef.current;

    // Collision Check with Obstacles
    let hasCollided = false;
    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      const obs = obstaclesRef.current[i];
      const obsY = obs.type === 'pterodactyl' ? groundY - obs.height - obs.yOffset : groundY - obs.height;

      const paddingX = 6;
      const paddingY = 6;

      if (
        dinoX + dinoWidth - paddingX > obs.x &&
        dinoX + paddingX < obs.x + obs.width &&
        dinoActualY + dinoHeight - paddingY > obsY &&
        dinoActualY + paddingY < obsY + obs.height
      ) {
        hasCollided = true;
        break;
      }
    }

    if (hasCollided) {
      audio.playGameOver();
      setGameState('GAMEOVER');
      screenShakeRef.current = 12; // Visual impact camera shake

      // Collision Particle Explosion
      const impactX = dinoX + dinoWidth / 2;
      const impactY = dinoActualY + dinoHeight / 2;
      const particleColors = ['#16A34A', '#EA4335', '#FBBC05', '#4285F4', '#FFFFFF'];
      for (let p = 0; p < 28; p++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 7;
        particlesRef.current.push({
          x: impactX,
          y: impactY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          size: 3 + Math.random() * 4,
          alpha: 1,
          color: particleColors[p % particleColors.length],
        });
      }

      // Auto Submit score on Game Over
      const finalScoreInt = currentScoreInt;
      if (activeTeamRef.current) {
        (async () => {
          try {
            const res = await submitScore(activeTeamRef.current.id, finalScoreInt);
            setScoreSubmitted(true);
            setSubmissionSuccess({ isNewHigh: res.isNewHighScore });
            if (res.isNewHighScore) {
              setHighScore(res.team.highScore);
              triggerHighscoreConfetti();
            }
            if (onScoreSubmittedRef.current) {
              onScoreSubmittedRef.current(res.team, finalScoreInt, res.isNewHighScore);
            }
          } catch {
            // Submission fallback
          }
        })();
      }

      return; // Stop game loop
    }

    // --- DRAWING ---
    const cycleProgress = ((currentScoreInt % 800) / 800) * 4;

    // Screen Shake effect calculation
    let shakeX = 0;
    let shakeY = 0;
    if (screenShakeRef.current > 0.3) {
      shakeX = (Math.random() - 0.5) * screenShakeRef.current;
      shakeY = (Math.random() - 0.5) * screenShakeRef.current;
      screenShakeRef.current *= 0.85;
    }

    ctx.save();
    if (shakeX !== 0 || shakeY !== 0) {
      ctx.translate(shakeX, shakeY);
    }

    // Smooth Sky Gradients
    const skyTop = interpolateCycleColor(['#FEF3C7', '#7DD3FC', '#312E81', '#020617'], cycleProgress);
    const skyMid = interpolateCycleColor(['#FDE68A', '#BAE6FD', '#C2410C', '#0B132B'], cycleProgress);
    const skyBottom = interpolateCycleColor(['#E0F2FE', '#F8FAFC', '#FFEDD5', '#0F172A'], cycleProgress);

    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, skyTop);
    skyGrad.addColorStop(0.5, skyMid);
    skyGrad.addColorStop(1, skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- CELESTIAL OBJECTS (SUN, MOON, STARS, CLOUDS) ---

    // 1. SUN CALCULATIONS
    let sunAlpha = 0;
    let sunX = canvas.width - 110;
    let sunY = 70;

    if (cycleProgress >= 3.6 || cycleProgress <= 2.4) {
      const normSunP = cycleProgress >= 3.6 ? cycleProgress - 3.6 : cycleProgress + 0.4;
      if (normSunP < 0.4) {
        sunAlpha = normSunP / 0.4;
        sunX = canvas.width - 130 + normSunP * 50;
        sunY = 110 - normSunP * 100;
      } else if (normSunP <= 2.4) {
        sunAlpha = 1.0;
        const tSun = (normSunP - 0.4) / 2.0;
        sunX = canvas.width - 110 - tSun * 30;
        sunY = 70 - Math.sin(tSun * Math.PI) * 35;
      } else {
        const tSink = (normSunP - 2.4) / 0.4;
        sunAlpha = 1 - tSink;
        sunX = canvas.width - 140 - tSink * 20;
        sunY = 70 + tSink * 50;
      }
    }

    if (sunAlpha > 0) {
      const sunCoreColor = interpolateCycleColor(['#F59E0B', '#FBBC05', '#EA580C', '#D97706'], cycleProgress);

      ctx.save();
      ctx.globalAlpha = sunAlpha;

      // Sun outer aura
      ctx.fillStyle = interpolateCycleColor(
        ['rgba(251, 191, 36, 0.2)', 'rgba(251, 188, 5, 0.15)', 'rgba(234, 88, 12, 0.25)', 'rgba(217, 119, 6, 0.1)'],
        cycleProgress
      );
      ctx.beginPath();
      ctx.arc(sunX, sunY, 36, 0, Math.PI * 2);
      ctx.fill();

      // Sun mid glow
      ctx.fillStyle = interpolateCycleColor(
        ['rgba(251, 191, 36, 0.35)', 'rgba(251, 188, 5, 0.28)', 'rgba(249, 115, 22, 0.4)', 'rgba(217, 119, 6, 0.2)'],
        cycleProgress
      );
      ctx.beginPath();
      ctx.arc(sunX, sunY, 24, 0, Math.PI * 2);
      ctx.fill();

      // Sun core
      ctx.fillStyle = sunCoreColor;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 16, 0, Math.PI * 2);
      ctx.fill();

      // Afternoon Sun Rays
      const rayAlpha = Math.max(0, 1 - Math.abs(cycleProgress - 1.0) * 2.5);
      if (rayAlpha > 0) {
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.globalAlpha = sunAlpha * rayAlpha;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.beginPath();
          ctx.moveTo(sunX + Math.cos(a) * 18, sunY + Math.sin(a) * 18);
          ctx.lineTo(sunX + Math.cos(a) * 24, sunY + Math.sin(a) * 24);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // 2. MOON CALCULATIONS
    let moonAlpha = 0;
    let moonX = canvas.width - 90;
    let moonY = 45;

    if (cycleProgress >= 1.6 && cycleProgress <= 3.8) {
      if (cycleProgress < 2.2) {
        const tRise = (cycleProgress - 1.6) / 0.6;
        moonAlpha = tRise;
        moonX = canvas.width - 120 + tRise * 30;
        moonY = 100 - tRise * 55;
      } else if (cycleProgress <= 3.2) {
        moonAlpha = 1.0;
        const tMoon = (cycleProgress - 2.2) / 1.0;
        moonX = canvas.width - 90 + tMoon * 20;
        moonY = 45 + Math.sin(tMoon * Math.PI) * 15;
      } else {
        const tSet = (cycleProgress - 3.2) / 0.6;
        moonAlpha = 1 - tSet;
        moonX = canvas.width - 70 + tSet * 20;
        moonY = 60 + tSet * 50;
      }
    }

    if (moonAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = moonAlpha;

      ctx.fillStyle = 'rgba(253, 224, 71, 0.15)';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = skyMid;
      ctx.beginPath();
      ctx.arc(moonX - 6, moonY - 4, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 3. STARS CALCULATIONS
    let starAlpha = 0;
    if (cycleProgress >= 1.8 && cycleProgress <= 3.8) {
      if (cycleProgress < 2.5) {
        starAlpha = (cycleProgress - 1.8) / 0.7;
      } else if (cycleProgress <= 3.2) {
        starAlpha = 1.0;
      } else {
        starAlpha = 1 - (cycleProgress - 3.2) / 0.6;
      }
    } else if (cycleProgress < 0.2) {
      starAlpha = (0.2 - cycleProgress) / 0.2;
    }

    if (starAlpha > 0) {
      ctx.fillStyle = '#E2E8F0';
      starsRef.current.forEach((s) => {
        const twinkle = Math.sin(frameCountRef.current * 0.08 + s.x) * 0.5 + 0.5;
        ctx.globalAlpha = starAlpha * (0.3 + twinkle * 0.7);
        ctx.fillRect(s.x, s.y, s.size, s.size);
        ctx.globalAlpha = 1.0;
      });
    }

    // 4. CLOUDS CALCULATIONS
    const cloudColor = interpolateCycleColor(['#FED7AA', '#CBD5E1', '#C084FC', '#334155'], cycleProgress);
    ctx.fillStyle = cloudColor;
    cloudsRef.current.forEach((c) => {
      c.x -= c.speed;
      if (c.x < -60) {
        c.x = canvas.width + Math.random() * 100;
        c.y = 15 + Math.random() * 45;
      }
      ctx.fillRect(c.x + 10, c.y, 28, 8);
      ctx.fillRect(c.x + 4, c.y + 4, 40, 8);
      ctx.fillRect(c.x, c.y + 8, 48, 8);
    });

    // --- DRAW GROUND & FLOWERS ---
    const groundBaseColor = interpolateCycleColor(['#15803D', '#16A34A', '#065F46', '#064E3B'], cycleProgress);
    const groundSubColor = interpolateCycleColor(['#166534', '#15803D', '#044E38', '#022C22'], cycleProgress);
    const groundTopGrassColor = interpolateCycleColor(['#4ADE80', '#22C55E', '#10B981', '#059669'], cycleProgress);
    const tuftColor = interpolateCycleColor(['#A7F3D0', '#86EFAC', '#6EE7B7', '#34D399'], cycleProgress);

    // Base grassy ground band
    ctx.fillStyle = groundBaseColor;
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

    // Darker sub-soil layer
    ctx.fillStyle = groundSubColor;
    ctx.fillRect(0, groundY + 16, canvas.width, canvas.height - groundY - 16);

    // Top bright grass blade trim
    ctx.fillStyle = groundTopGrassColor;
    ctx.fillRect(0, groundY, canvas.width, 3);

    // Scrolling grass tufts along the ground
    ctx.fillStyle = tuftColor;
    for (let x = -groundOffsetRef.current; x < canvas.width + 20; x += 16) {
      ctx.fillRect(x, groundY - 2, 2, 3);
      ctx.fillRect(x + 3, groundY - 4, 2, 5);
      ctx.fillRect(x + 6, groundY - 1, 2, 2);
    }

    // Flowers along the green ground
    flowersRef.current.forEach((f) => {
      const flowerBaseY = groundY;
      const flowerTopY = groundY - f.stemHeight;

      ctx.strokeStyle = '#14532D';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(f.x, flowerBaseY);
      ctx.lineTo(f.x, flowerTopY);
      ctx.stroke();

      ctx.fillStyle = '#16A34A';
      ctx.fillRect(f.x - 3, flowerBaseY - 4, 3, 2);

      ctx.fillStyle = f.petalColor;
      const s = f.size;
      ctx.beginPath();
      ctx.arc(f.x - s, flowerTopY, s, 0, Math.PI * 2);
      ctx.arc(f.x + s, flowerTopY, s, 0, Math.PI * 2);
      ctx.arc(f.x, flowerTopY - s, s, 0, Math.PI * 2);
      ctx.arc(f.x, flowerTopY + s, s, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = f.centerColor;
      ctx.beginPath();
      ctx.arc(f.x, flowerTopY, s * 0.7, 0, Math.PI * 2);
      ctx.fill();
    });

    // --- DRAW PARTICLES ---
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const part = particlesRef.current[i];
      part.x += part.vx;
      part.y += part.vy;
      part.alpha -= 0.03;

      if (part.alpha <= 0) {
        particlesRef.current.splice(i, 1);
      } else {
        ctx.globalAlpha = part.alpha;
        ctx.fillStyle = part.color;
        ctx.fillRect(part.x, part.y, part.size, part.size);
        ctx.globalAlpha = 1.0;
      }
    }

    // --- DRAW DINO ---
    const dinoColor = interpolateCycleColor(['#16A34A', '#16A34A', '#22C55E', '#4ADE80'], cycleProgress);
    const eyeBgColor = interpolateCycleColor(['#FFFFFF', '#FFFFFF', '#312E81', '#0F172A'], cycleProgress);
    const eyePupilColor = interpolateCycleColor(['#000000', '#000000', '#FFFFFF', '#FFFFFF'], cycleProgress);
    const accentColor = interpolateCycleColor(['#FBBC05', '#FBBC05', '#F97316', '#FBBF24'], cycleProgress);
    const mouthCutoutColor = interpolateCycleColor(['#F8FAFC', '#F8FAFC', '#312E81', '#0F172A'], cycleProgress);

    const legFrame = Math.floor(frameCountRef.current / 4) % 2;

    if (isDuckingRef.current && !isJumpingRef.current) {
      ctx.fillStyle = dinoColor;
      ctx.fillRect(dinoX, dinoActualY + 10, 8, 6);
      ctx.fillRect(dinoX + 6, dinoActualY + 8, 34, 14);
      ctx.fillRect(dinoX + 36, dinoActualY + 4, 18, 12);

      ctx.fillStyle = mouthCutoutColor;
      ctx.fillRect(dinoX + 44, dinoActualY + 10, 10, 3);

      ctx.fillStyle = eyeBgColor;
      ctx.fillRect(dinoX + 42, dinoActualY + 6, 4, 4);
      ctx.fillStyle = eyePupilColor;
      ctx.fillRect(dinoX + 44, dinoActualY + 7, 2, 2);

      ctx.fillStyle = accentColor;
      ctx.fillRect(dinoX + 32, dinoActualY + 16, 5, 3);

      ctx.fillStyle = dinoColor;
      if (legFrame === 0) {
        ctx.fillRect(dinoX + 14, dinoActualY + 22, 5, 3);
        ctx.fillRect(dinoX + 28, dinoActualY + 21, 5, 2);
      } else {
        ctx.fillRect(dinoX + 14, dinoActualY + 21, 5, 2);
        ctx.fillRect(dinoX + 28, dinoActualY + 22, 5, 3);
      }
    } else {
      ctx.fillStyle = dinoColor;
      ctx.fillRect(dinoX + 18, dinoActualY, 20, 14);
      ctx.fillRect(dinoX + 28, dinoActualY + 2, 10, 10);

      ctx.fillStyle = mouthCutoutColor;
      ctx.fillRect(dinoX + 28, dinoActualY + 10, 10, 2);

      const isBlinking = frameCountRef.current % 130 < 6;
      if (isBlinking) {
        ctx.fillStyle = eyePupilColor;
        ctx.fillRect(dinoX + 22, dinoActualY + 5, 5, 1);
      } else {
        ctx.fillStyle = eyeBgColor;
        ctx.fillRect(dinoX + 22, dinoActualY + 3, 4, 4);
        ctx.fillStyle = eyePupilColor;
        const pupilOffsetY = isJumpingRef.current ? -1 : 0;
        ctx.fillRect(dinoX + 24, dinoActualY + 4 + pupilOffsetY, 2, 2);
      }

      ctx.fillStyle = dinoColor;
      ctx.fillRect(dinoX + 14, dinoActualY + 12, 16, 18);
      ctx.fillRect(dinoX + 26, dinoActualY + 16, 4, 10);

      ctx.fillRect(dinoX + 6, dinoActualY + 16, 8, 8);
      ctx.fillRect(dinoX + 2, dinoActualY + 14, 4, 6);
      ctx.fillRect(dinoX, dinoActualY + 12, 2, 4);

      ctx.fillStyle = accentColor;
      ctx.fillRect(dinoX + 24, dinoActualY + 18, 6, 3);
      ctx.fillRect(dinoX + 28, dinoActualY + 20, 2, 4);

      ctx.fillStyle = dinoColor;
      if (isJumpingRef.current) {
        ctx.fillRect(dinoX + 12, dinoActualY + 30, 5, 4);
        ctx.fillRect(dinoX + 20, dinoActualY + 30, 5, 3);
      } else {
        if (legFrame === 0) {
          ctx.fillRect(dinoX + 12, dinoActualY + 30, 5, 6);
          ctx.fillRect(dinoX + 12, dinoActualY + 36, 7, 2);
          ctx.fillRect(dinoX + 20, dinoActualY + 30, 5, 3);
        } else {
          ctx.fillRect(dinoX + 12, dinoActualY + 30, 5, 3);
          ctx.fillRect(dinoX + 20, dinoActualY + 30, 5, 6);
          ctx.fillRect(dinoX + 20, dinoActualY + 36, 7, 2);
        }
      }
    }

    // --- DRAW OBSTACLES ---
    const cactusColor = interpolateCycleColor(['#059669', '#059669', '#10B981', '#34D399'], cycleProgress);
    const pterodactylColor = interpolateCycleColor(['#EA4335', '#EA4335', '#F97316', '#F87171'], cycleProgress);
    const wingColor = interpolateCycleColor(['#34A853', '#34A853', '#38BDF8', '#38BDF8'], cycleProgress);

    obstaclesRef.current.forEach((obs) => {
      const obsY = obs.type === 'pterodactyl' ? groundY - obs.height - obs.yOffset : groundY - obs.height;

      if (obs.type === 'pterodactyl') {
        ctx.fillStyle = pterodactylColor;
        ctx.fillRect(obs.x + 8, obsY + 10, 20, 12);
        ctx.fillRect(obs.x + 24, obsY + 4, 12, 10);

        const wingUp = Math.floor(frameCountRef.current / 6) % 2 === 0;
        ctx.fillStyle = wingColor;
        if (wingUp) {
          ctx.fillRect(obs.x + 12, obsY - 8, 10, 18);
        } else {
          ctx.fillRect(obs.x + 12, obsY + 14, 10, 14);
        }
      } else if (obs.type === 'cactus-group') {
        ctx.fillStyle = cactusColor;
        ctx.fillRect(obs.x + 4, obsY, 14, 45);
        ctx.fillRect(obs.x, obsY + 12, 22, 6);
        ctx.fillRect(obs.x, obsY + 6, 6, 12);
        ctx.fillRect(obs.x + 26, obsY + 8, 14, 37);
        ctx.fillRect(obs.x + 22, obsY + 20, 22, 6);
        ctx.fillRect(obs.x + 38, obsY + 14, 6, 12);
      } else {
        ctx.fillStyle = cactusColor;
        ctx.fillRect(obs.x + 6, obsY, 12, 45);
        ctx.fillRect(obs.x + 2, obsY + 10, 20, 6);
        ctx.fillRect(obs.x + 2, obsY + 4, 6, 12);
        ctx.fillRect(obs.x + 16, obsY + 16, 6, 10);
      }
    });

    ctx.restore();

    // Request next frame
    gameLoopRef.current = requestAnimationFrame(updateGame);
  };

  // Submit Score Handler
  const handleSubmitScore = async () => {
    if (!activeTeam || isSubmitting || scoreSubmitted) return;
    setIsSubmitting(true);
    audio.playClick();

    try {
      const res = await submitScore(activeTeam.id, score);
      setScoreSubmitted(true);
      setSubmissionSuccess({ isNewHigh: res.isNewHighScore });
      if (res.isNewHighScore) {
        setHighScore(res.team.highScore);
        triggerHighscoreConfetti();
      }
      onScoreSubmitted(res.team, score, res.isNewHighScore);
    } catch {
      // Error handling
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup loop on unmount
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-6 p-4 sm:p-6">
      {/* Team Header Bar */}
      <div className="w-full bg-white border-2 border-gray-200 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#4285F4]/10 text-[#4285F4] flex items-center justify-center text-[#4285F4] font-black text-2xl">
            🦖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-[#4285F4] border border-blue-200">
                {activeTeam?.id || 'NO TEAM'}
              </span>
              <h2 className="text-xl font-black text-[#202124]">{activeTeam?.name || 'Guest Team'}</h2>
            </div>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              Players: <span className="text-gray-800 font-bold">{activeTeam?.player1 || 'Player 1'}</span> &{' '}
              <span className="text-gray-800 font-bold">{activeTeam?.player2 || 'Player 2'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs font-bold text-gray-400 block uppercase">Team Record</span>
            <span className="text-xl font-black text-[#FBBC05] tracking-tight flex items-center justify-end gap-1">
              <Trophy className="w-5 h-5 text-[#FBBC05] inline" />
              {highScore.toLocaleString()} pts
            </span>
          </div>

          <button
            onClick={onChangeTeam}
            className="px-3.5 py-2 text-xs font-black text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors border border-gray-200 uppercase cursor-pointer"
            title="Change active team registration"
          >
            Switch Team
          </button>

          <button
            onClick={toggleSound}
            className="p-2 text-gray-500 hover:text-gray-800 bg-gray-100 rounded-xl transition-colors border border-gray-200 cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-[#EA4335]" /> : <Volume2 className="w-5 h-5 text-[#34A853]" />}
          </button>
        </div>
      </div>

      {/* Main Game Stage Container */}
      <div className="relative w-full bg-white border-2 border-gray-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center">
        {/* Top HUD Overlay */}
        <div className="w-full px-6 py-3 bg-gray-100 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-[#202124]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#4285F4]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34A853] animate-pulse"></span>
              DINO RUNNER ARCADE
            </div>

            {(() => {
              const currentPhase = getTimePhase(score);
              return (
                <div
                  className={`px-3 py-0.5 rounded-full text-[11px] font-black uppercase flex items-center gap-1.5 transition-all shadow-xs ${currentPhase.badgeStyle}`}
                >
                  <span>{currentPhase.label}</span>
                  <span className="opacity-60 text-[9px] font-bold">({currentPhase.subLabel})</span>
                </div>
              );
            })()}
          </div>

          <div className="flex items-center gap-6 font-mono font-black text-lg">
            <span className="text-gray-400 text-xs font-bold uppercase">
              HI <strong className="text-[#FBBC05] ml-1">{highScore.toString().padStart(5, '0')}</strong>
            </span>
            <span className="text-[#4285F4] text-2xl tracking-wider">{score.toString().padStart(5, '0')}</span>
          </div>
        </div>

        {/* Canvas Game Screen */}
        <div className="relative w-full overflow-hidden bg-[#f8f9fa] flex justify-center items-center py-2">
          <canvas
            ref={canvasRef}
            width={1200}
            height={400}
            className="w-full h-[400px] max-w-[1200px] cursor-pointer touch-none select-none"
            onClick={triggerJump}
          />

          {/* Start Screen Overlay */}
          <AnimatePresence>
            {gameState === 'IDLE' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#EA4335]/10 text-[#EA4335] flex items-center justify-center text-4xl mb-3 shadow-md">
                  🦖
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-[#202124] mb-2 uppercase">Ready to Run, {activeTeam?.name}?</h3>
                <p className="text-xs sm:text-sm text-gray-500 font-semibold max-w-md mb-6">
                  Press <kbd className="px-2 py-1 bg-gray-100 text-[#4285F4] rounded border border-gray-300 font-mono text-xs font-black">SPACE</kbd> or <kbd className="px-2 py-1 bg-gray-100 text-[#4285F4] rounded border border-gray-300 font-mono text-xs font-black">UP ARROW</kbd> to jump over cacti and pterodactyls!
                </p>

                <button
                  onClick={startGame}
                  className="px-8 py-3.5 bg-[#EA4335] hover:bg-[#d93025] text-white font-black text-lg rounded-2xl shadow-xl transition-all transform hover:scale-105 active:scale-100 flex items-center gap-3 cursor-pointer uppercase tracking-tight"
                >
                  <Play className="w-6 h-6 fill-current" />
                  START GAME NOW
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game Over Screen Overlay */}
          <AnimatePresence>
            {gameState === 'GAMEOVER' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-5 text-center z-20 overflow-y-auto max-h-full"
              >
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-red-100 border border-red-200 text-[#EA4335] text-[10px] font-black uppercase tracking-widest mb-1">
                  GAME OVER
                </div>

                <div className="text-gray-400 text-[10px] uppercase font-black tracking-wider">Final Score</div>
                <div className="text-4xl sm:text-5xl font-black text-[#4285F4] font-mono tracking-tight leading-none my-1">
                  {score.toLocaleString()}
                </div>

                {/* Score status highlight */}
                {(score > (activeTeam?.highScore || 0) || submissionSuccess?.isNewHigh) && (
                  <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-[#b45309] border border-amber-300 text-xs font-black my-1 shadow-2xs">
                    <Sparkles className="w-4 h-4 text-[#FBBC05]" />
                    <span>NEW TEAM HIGH SCORE RECORD! 🎉</span>
                    <button
                      onClick={triggerHighscoreConfetti}
                      className="px-2 py-0.5 bg-[#FBBC05] hover:bg-amber-400 text-slate-950 rounded-full text-[10px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="Fire celebration confetti"
                    >
                      <PartyPopper className="w-3 h-3" /> Confetti!
                    </button>
                  </div>
                )}

                {/* Submission status feedback */}
                {submissionSuccess && (
                  <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[#34A853] text-xs font-black flex items-center gap-1.5 my-1">
                    <CheckCircle2 className="w-4 h-4 text-[#34A853] flex-shrink-0" />
                    Score successfully logged to event leaderboard!
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                  <button
                    onClick={startGame}
                    className="px-6 py-2.5 bg-[#EA4335] hover:bg-[#d93025] text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2 text-xs sm:text-sm cursor-pointer uppercase active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4 text-white" />
                    TRY AGAIN
                  </button>

                  <button
                    onClick={handleSubmitScore}
                    disabled={isSubmitting || scoreSubmitted}
                    className={`px-4 py-2.5 font-black rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer uppercase tracking-tight ${
                      scoreSubmitted
                        ? 'bg-emerald-100 text-[#34A853] border border-emerald-300 cursor-default'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin"></span>
                        SUBMITTING...
                      </span>
                    ) : scoreSubmitted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#34A853]" />
                        SUBMITTED!
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        SUBMIT SCORE
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* On-Screen Touch Controls for Tablet/Mobile Kiosk */}
        <div className="w-full px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 font-semibold">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-700">Controls:</span>
            <span>Tap screen / Spacebar = Jump</span>
            <span className="hidden sm:inline">| Down Arrow = Duck</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onMouseDown={() => setDuckState(true)}
              onMouseUp={() => setDuckState(false)}
              onTouchStart={() => setDuckState(true)}
              onTouchEnd={() => setDuckState(false)}
              className={`px-4 py-2 text-xs font-black rounded-xl border transition-colors flex items-center gap-1 uppercase ${
                isDucking ? 'bg-[#FBBC05] text-slate-950 border-amber-400' : 'bg-gray-200 text-gray-700 border-gray-300'
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5" /> DUCK
            </button>

            <button
              onClick={triggerJump}
              className="px-5 py-2 bg-[#4285F4] hover:bg-[#3367d6] text-white font-black rounded-xl border border-blue-400 transition-colors flex items-center gap-1 shadow-md uppercase active:scale-95 cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" /> JUMP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
