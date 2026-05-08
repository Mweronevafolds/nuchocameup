import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

interface ParticleCanvasProps {
  particleCount?: number;
  color?: string;
  speed?: number;
  connectionRadius?: number;
  className?: string;
}

export function ParticleCanvas({
  particleCount = 55,
  color = "#00F0FF",
  speed = 0.35,
  connectionRadius = 110,
  className = "",
}: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(canvas);

    // Build particles
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x:       Math.random() * canvas.width,
      y:       Math.random() * canvas.height,
      vx:      (Math.random() - 0.5) * speed,
      vy:      (Math.random() - 0.5) * speed,
      radius:  Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener("mousemove", onMouseMove);

    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `${r},${g},${b}`;
    };
    const rgb = hexToRgb(color);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        // gentle mouse repulsion
        const dx = p.x - mouseRef.current.x;
        const dy = p.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          p.vx += (dx / dist) * 0.02;
          p.vy += (dy / dist) * 0.02;
        }

        // clamp speed
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > speed * 3) { p.vx = (p.vx / spd) * speed * 3; p.vy = (p.vy / spd) * speed * 3; }

        p.x += p.vx;
        p.y += p.vy;

        // bounce
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${p.opacity})`;
        ctx.fill();
      });

      // draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < connectionRadius) {
            const alpha = (1 - d / connectionRadius) * 0.25;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${rgb},${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      resizeObs.disconnect();
      canvas.removeEventListener("mousemove", onMouseMove);
    };
  }, [particleCount, color, speed, connectionRadius]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      aria-hidden
    />
  );
}
