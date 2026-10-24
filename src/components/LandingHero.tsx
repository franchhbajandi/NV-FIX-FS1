import React, { useEffect, useRef, useState } from 'react';
import { Button } from './Button';

export interface LandingHeroProps {
  onStartEpisode01: () => void;
  onJumpToEpisode02: () => void;
  onFpsUpdate?: (fps: number, tier: 'high' | 'medium' | 'low') => void;
  isReady?: boolean;
  isLite?: boolean;
}

const VERTEX_SHADER_SRC = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SRC = `
  precision mediump float;
  varying vec2 v_uv;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform sampler2D u_trailTex;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
    vec2 uv = v_uv * aspect;

    // Sample eraser trail texture (flipped Y for canvas 2D coordinates)
    float erased = texture2D(u_trailTex, vec2(v_uv.x, 1.0 - v_uv.y)).r;

    // Chalkboard base (#0C1612 = rgb(12, 22, 18))
    vec3 chalkboard = vec3(0.047, 0.086, 0.071);

    // Chalk-dust surface film before wiping
    float grain = noise(uv * 28.0) * 0.55 + noise(uv * 95.0) * 0.35 + hash(uv * 220.0) * 0.1;
    vec3 dustyBoard = mix(chalkboard, vec3(0.22, 0.28, 0.25), grain * 0.65);

    // Subtle classroom graph-paper grid lines
    vec2 grid = abs(fract(uv * 16.0 - 0.5) - 0.5) / 0.035;
    float line = 1.0 - clamp(min(grid.x, grid.y), 0.0, 1.0);
    dustyBoard += line * vec3(0.035, 0.055, 0.045);

    // Revealed classroom color beneath where the eraser has wiped
    float wave = sin(uv.x * 3.2 + u_time * 0.4) * cos(uv.y * 2.6 - u_time * 0.3);
    vec3 constructionGreen = vec3(0.059, 0.420, 0.271); // #0F6B45
    vec3 notebookBlue = vec3(0.141, 0.278, 1.0);        // #2447FF
    vec3 highlighterYellow = vec3(1.0, 0.902, 0.0);     // #FFE600

    vec3 revealed = mix(chalkboard, constructionGreen, smoothstep(-0.6, 0.6, wave) * 0.72);
    revealed = mix(revealed, notebookBlue, smoothstep(0.1, 0.9, sin(uv.x * 2.0 - uv.y * 1.8)) * 0.45);
    revealed += line * vec3(0.10, 0.18, 0.14);

    // Soft chalk-dust rim at the edge of the wiped eraser trail
    float rim = smoothstep(0.05, 0.35, erased) * (1.0 - smoothstep(0.35, 0.85, erased));
    vec3 rimColor = mix(vec3(0.949, 0.961, 0.941), highlighterYellow, 0.4) * rim * (0.45 + 0.55 * grain);

    vec3 finalColor = mix(dustyBoard, revealed, smoothstep(0.05, 0.78, erased)) + rimColor;
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartEpisode01,
  onJumpToEpisode02,
  onFpsUpdate,
  isReady = true,
  isLite = false,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const [deviceTier, setDeviceTier] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    if (!isReady) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rootIsLite =
      isLite || document.documentElement.getAttribute('data-tier') === 'lite';
    const cores = navigator.hardwareConcurrency || 4;
    const tier: 'high' | 'medium' | 'low' =
      prefersReducedMotion || rootIsLite
        ? 'low'
        : cores <= 2
        ? 'low'
        : cores <= 4
        ? 'medium'
        : 'high';

    setDeviceTier(tier);
    if (tier === 'low') {
      if (headlineRef.current) {
        headlineRef.current.style.fontVariationSettings = '';
      }
      onFpsUpdate?.(60, 'low');
      return;
    }

    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      setWebglSupported(false);
      return;
    }

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vs || !fs) {
      setWebglSupported(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebglSupported(false);
      return;
    }
    gl.useProgram(program);

    // Full-screen triangle pair
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const resLoc = gl.getUniformLocation(program, 'u_resolution');
    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const trailLoc = gl.getUniformLocation(program, 'u_trailTex');

    // Offscreen 2D trail buffer for fluid eraser strokes
    const trailCanvas = document.createElement('canvas');
    trailCanvas.width = 512;
    trailCanvas.height = 256;
    const trailCtx = trailCanvas.getContext('2d');

    if (trailCtx) {
      trailCtx.fillStyle = '#000000';
      trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height);
    }

    const trailTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, trailTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(trailLoc, 0);

    // Resize handler with DPR capped at 1.5 (Section 8.5 guardrail)
    const updateSize = () => {
      if (!canvas || !section) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = section.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Pointer eraser state + variable font axis velocity (User Revision #6)
    let lastPointer = { x: -1, y: -1 };
    let pointerVelocity = 0;
    let currentWdth = 94;
    let currentWght = 760;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const stampEraser = (normX: number, normY: number, radius = 44) => {
      if (!trailCtx) return;
      const tx = normX * trailCanvas.width;
      const ty = normY * trailCanvas.height;
      const grad = trailCtx.createRadialGradient(tx, ty, radius * 0.15, tx, ty, radius);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
      grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.45)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
      trailCtx.fillStyle = grad;
      trailCtx.beginPath();
      trailCtx.arc(tx, ty, radius, 0, Math.PI * 2);
      trailCtx.fill();
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / Math.max(rect.width, 1);
      const ny = (e.clientY - rect.top) / Math.max(rect.height, 1);

      if (lastPointer.x >= 0) {
        const dx = nx - lastPointer.x;
        const dy = ny - lastPointer.y;
        const dist = Math.hypot(dx, dy);
        pointerVelocity = Math.min(1.0, pointerVelocity + dist * 9.0);

        const steps = Math.max(1, Math.ceil(dist * 45));
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          stampEraser(lastPointer.x + dx * t, lastPointer.y + dy * t, 40);
        }
      } else {
        stampEraser(nx, ny, 40);
      }
      lastPointer = { x: nx, y: ny };
    };

    section.addEventListener('pointermove', handlePointerMove, { passive: true });

    // Pause WebGL render loop when hero is scrolled out of view (Section 8.5 guardrail)
    let isVisible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    io.observe(section);

    let rafId = 0;
    const startTime = performance.now();
    let frameCount = 0;
    let fpsTimer = startTime;

    const render = (now: number) => {
      rafId = requestAnimationFrame(render);
      if (!isVisible) return;

      const elapsed = (now - startTime) * 0.001;
      frameCount++;
      if (now - fpsTimer >= 500) {
        const currentFps = Math.min(60, Math.round((frameCount * 1000) / (now - fpsTimer)));
        onFpsUpdate?.(currentFps, tier);
        frameCount = 0;
        fpsTimer = now;
      }

      // Short auto-wipe plays on load (0.0s -> 2.4s) across the chalkboard hero
      if (elapsed < 2.4) {
        const p = elapsed / 2.4;
        const easeP = 1 - Math.pow(1 - p, 3);
        const sweepX = 0.14 + easeP * 0.72;
        const sweepY = 0.48 + Math.sin(easeP * Math.PI * 2.0) * 0.14;
        stampEraser(sweepX, sweepY, 58);
      }

      // Subtle chalk-dust resettling decay so the board remains interactive
      if (trailCtx) {
        trailCtx.fillStyle = 'rgba(0, 0, 0, 0.004)';
        trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height);
      }

      gl.bindTexture(gl.TEXTURE_2D, trailTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, trailCanvas);
      gl.uniform1f(timeLoc, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Variable font axis animation confined strictly to the fixed-size hero headline box
      if (!isTouch && headlineRef.current) {
        pointerVelocity *= 0.9;
        const targetWdth = 88 + pointerVelocity * 12;
        const targetWght = 720 + pointerVelocity * 80;
        currentWdth += (targetWdth - currentWdth) * 0.16;
        currentWght += (targetWght - currentWght) * 0.16;
        headlineRef.current.style.fontVariationSettings = `'wdth' ${currentWdth.toFixed(1)}, 'wght' ${currentWght.toFixed(0)}`;
      }
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateSize);
      section.removeEventListener('pointermove', handlePointerMove);
      io.disconnect();
      gl.deleteTexture(trailTex);
      gl.deleteBuffer(quadBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [onFpsUpdate, isReady, isLite]);

  return (
    <section
      ref={sectionRef}
      id="top"
      data-redpen-component="ChalkDustShaderHero"
      data-redpen-tokens="--color-chalkboard, --color-chalk, --color-highlighter, --text-160"
      className="relative min-h-[86vh] flex flex-col justify-between p-[var(--space-24)] sm:p-[var(--space-48)] border-b-2 border-[var(--color-border-dark)] overflow-hidden select-none surface-chalkboard"
    >
      {/* Single WebGL Canvas (or high-contrast halftone fallback on low-tier / lite / reduced-motion) */}
      {isReady && !isLite && webglSupported && deviceTier !== 'low' ? (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-0 surface-chalkboard bg-halftone opacity-25"
        />
      )}

      {/* Top Classroom Context Bar */}
      <div className="relative z-10 max-w-7xl w-full mx-auto flex flex-wrap items-center justify-between gap-[var(--space-16)] border-b border-[var(--color-border-dark)] pb-[var(--space-16)]">
        <p className="text-scale-14 text-[var(--color-chalk)] font-medium">
          Bicol University College of Education · Experiential Learning Office · Daraga, Albay
        </p>
        <p className="text-scale-14 text-[var(--color-highlighter)] font-semibold">
          Move cursor or finger across the board to erase chalk dust
        </p>
      </div>

      {/* Main Variable-Axis Hero Headline Box & Subtitle */}
      <div className="relative z-10 max-w-7xl w-full mx-auto my-[var(--space-24)] space-y-[var(--space-24)]">
        {/* User Revision #6: Fixed-size box for variable font axis interpolation */}
        <div
          data-redpen-component="HeroKineticHeadlineBox"
          data-redpen-tokens="--font-display, --text-160"
          className="min-h-[180px] sm:min-h-[240px] lg:min-h-[300px] flex items-end overflow-hidden"
        >
          <h1
            ref={headlineRef}
            className="font-display font-extrabold text-scale-160 text-[var(--color-chalk)] tracking-tight leading-none"
          >
            The Observer’s Edition
          </h1>
        </div>

        <div className="max-w-3xl space-y-[var(--space-12)]">
          <p className="font-display font-bold text-scale-28 text-[var(--color-chalk)]">
            Field Study 1. Observations of teaching and learning in an actual school environment.
          </p>
          <p className="text-scale-17 text-[var(--color-chalk-faint)] reading-measure">
            Francois Joshua L. Bajandi, BSEd English IV · Resource Teacher: Herson N. Alamo, Teacher VI
          </p>
        </div>

        {/* Primary CTA to Episode 02 + Secondary Act I Jump */}
        <div className="flex flex-wrap items-center gap-[var(--space-16)] pt-[var(--space-8)]">
          <Button
            variant="primary-highlighter"
            onClick={onJumpToEpisode02}
            redpenName="Button (Read Episode 02: The Learning Environment)"
          >
            Read Episode 02: The Learning Environment
          </Button>
          <Button
            variant="secondary-dark"
            onClick={onStartEpisode01}
            redpenName="Button (Begin from Act I)"
          >
            Begin from Act I · Opening
          </Button>
        </div>
      </div>

      {/* Bottom Chalk-Line Scroll Cue */}
      <div className="relative z-10 max-w-7xl w-full mx-auto pt-[var(--space-16)] border-t border-[var(--color-border-dark)] flex items-center justify-between gap-[var(--space-16)]">
        <a
          href="#act-1"
          className="inline-flex items-center gap-[var(--space-12)] text-scale-14 text-[var(--color-chalk)] hover:text-[var(--color-highlighter)] transition-colors"
        >
          <span>Scroll to begin observing</span>
          <svg
            width="36"
            height="12"
            viewBox="0 0 36 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M2 6H34M28 1L34 6L28 11" />
          </svg>
        </a>
      </div>
    </section>
  );
};
