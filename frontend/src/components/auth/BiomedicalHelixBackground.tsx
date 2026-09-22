"use client";

import React, { useEffect, useRef } from "react";

interface NodeColor {
    highlight: string;
    base: string;
    shadow: string;
    glow: string;
}

const PALETTE: NodeColor[] = [
    { highlight: "#a5f3fc", base: "#06b6d4", shadow: "#083344", glow: "rgba(6, 182, 212, 0.45)" }, // Cyan
    { highlight: "#a7f3d0", base: "#10b981", shadow: "#064e3b", glow: "rgba(16, 185, 129, 0.45)" }, // Emerald
    { highlight: "#ddd6fe", base: "#8b5cf6", shadow: "#2e1065", glow: "rgba(139, 92, 246, 0.45)" }, // Purple
    { highlight: "#fde68a", base: "#f59e0b", shadow: "#451a03", glow: "rgba(245, 158, 11, 0.45)" }, // Amber
    { highlight: "#fecaca", base: "#ef4444", shadow: "#450a0a", glow: "rgba(239, 68, 68, 0.45)" }, // Ruby
    { highlight: "#bfdbfe", base: "#3b82f6", shadow: "#172554", glow: "rgba(59, 130, 246, 0.45)" }, // Cobalt
    { highlight: "#99f6e4", base: "#14b8a6", shadow: "#042f2e", glow: "rgba(20, 184, 166, 0.45)" }, // Teal
    { highlight: "#fbcfe8", base: "#ec4899", shadow: "#500724", glow: "rgba(236, 72, 153, 0.45)" }, // Magenta
    { highlight: "#fef08a", base: "#eab308", shadow: "#422006", glow: "rgba(234, 179, 8, 0.45)" }, // Yellow
];

interface Particle {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    r: number;
    color: NodeColor;
    alpha: number;
    pulseSpeed: number;
    pulsePhase: number;
}

type RenderItem =
    | {
          type: "rung";
          z: number;
          x1: number;
          y1: number;
          x2: number;
          y2: number;
          color1: NodeColor;
          color2: NodeColor;
          alpha: number;
          width: number;
      }
    | {
          type: "sphere";
          z: number;
          x: number;
          y: number;
          r: number;
          color: NodeColor;
          alpha: number;
      }
    | {
          type: "particle";
          z: number;
          x: number;
          y: number;
          r: number;
          color: NodeColor;
          alpha: number;
      };

export default function BiomedicalHelixBackground() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        let animationFrameId: number;
        let width = 0;
        let height = 0;

        // Check prefers-reduced-motion
        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        let prefersReducedMotion = motionQuery.matches;

        const handleMotionChange = (e: MediaQueryListEvent) => {
            prefersReducedMotion = e.matches;
            if (prefersReducedMotion) {
                render(0);
            }
        };
        motionQuery.addEventListener("change", handleMotionChange);

        // Resize handler with devicePixelRatio support
        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const resizeObserver = new ResizeObserver(() => {
            resize();
            if (prefersReducedMotion) {
                render(0);
            }
        });
        resizeObserver.observe(canvas);
        resize();

        // Parallax mouse position
        let targetMouseX = 0;
        let targetMouseY = 0;
        let mouseX = 0;
        let mouseY = 0;

        const handleMouseMove = (e: MouseEvent) => {
            if (prefersReducedMotion) return;
            const rect = canvas.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / (rect.width || 1) - 0.5;
            const relY = (e.clientY - rect.top) / (rect.height || 1) - 0.5;
            targetMouseX = relX * 0.35;
            targetMouseY = relY * 0.35;
        };

        window.addEventListener("mousemove", handleMouseMove, { passive: true });

        // Generate ambient depth particles
        const particleCount = 35;
        const particles: Particle[] = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * (width || 800),
                y: Math.random() * (height || 800),
                z: Math.random() * 300 - 150,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                r: Math.random() * 3 + 1.2,
                color: PALETTE[i % PALETTE.length],
                alpha: Math.random() * 0.5 + 0.2,
                pulseSpeed: Math.random() * 0.02 + 0.01,
                pulsePhase: Math.random() * Math.PI * 2,
            });
        }

        let angle = 0;
        let lastTime = performance.now();

        // Helper: Draw 3D Sphere with specular highlight and ambient shading
        const draw3DSphere = (
            x: number,
            y: number,
            r: number,
            color: NodeColor,
            alpha: number
        ) => {
            if (r <= 0.4 || alpha <= 0.02) return;
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

            // Ambient glow around larger foreground spheres
            if (r > 6.5 && alpha > 0.45) {
                ctx.beginPath();
                ctx.arc(x, y, r * 1.55, 0, Math.PI * 2);
                ctx.fillStyle = color.glow;
                ctx.fill();
            }

            // Radial gradient creates real 3D ball illumination
            const grad = ctx.createRadialGradient(
                x - r * 0.35,
                y - r * 0.35,
                r * 0.05,
                x,
                y,
                r
            );
            grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
            grad.addColorStop(0.2, color.highlight);
            grad.addColorStop(0.68, color.base);
            grad.addColorStop(1, color.shadow);

            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.restore();
        };

        // Main render routine
        const render = (currentTime: number) => {
            if (width === 0 || height === 0) return;

            const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
            lastTime = currentTime;

            if (!prefersReducedMotion) {
                // Smooth subtle mouse parallax
                mouseX += (targetMouseX - mouseX) * 0.05;
                mouseY += (targetMouseY - mouseY) * 0.05;

                // Slow, elegant continuous rotation
                angle += dt * 0.35;
            }

            // 1. Deep scientific navy/black-blue background
            const bgGrad = ctx.createLinearGradient(0, 0, width, height);
            bgGrad.addColorStop(0, "#020617");
            bgGrad.addColorStop(0.35, "#040d21");
            bgGrad.addColorStop(0.7, "#06132e");
            bgGrad.addColorStop(1, "#020617");
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            // Volumetric ambient glow spots in the distance
            const glow1 = ctx.createRadialGradient(
                width * 0.35,
                height * 0.35,
                20,
                width * 0.35,
                height * 0.35,
                width * 0.65
            );
            glow1.addColorStop(0, "rgba(6, 182, 212, 0.12)");
            glow1.addColorStop(0.5, "rgba(59, 130, 246, 0.06)");
            glow1.addColorStop(1, "rgba(2, 6, 23, 0)");
            ctx.fillStyle = glow1;
            ctx.fillRect(0, 0, width, height);

            const glow2 = ctx.createRadialGradient(
                width * 0.7,
                height * 0.7,
                10,
                width * 0.7,
                height * 0.7,
                width * 0.55
            );
            glow2.addColorStop(0, "rgba(139, 92, 246, 0.09)");
            glow2.addColorStop(0.6, "rgba(16, 185, 129, 0.04)");
            glow2.addColorStop(1, "rgba(2, 6, 23, 0)");
            ctx.fillStyle = glow2;
            ctx.fillRect(0, 0, width, height);

            // Items to depth-sort
            const renderItems: RenderItem[] = [];

            // 2. Ambient Particles
            for (const p of particles) {
                if (!prefersReducedMotion) {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.pulsePhase += p.pulseSpeed;

                    if (p.x < -20) p.x = width + 20;
                    if (p.x > width + 20) p.x = -20;
                    if (p.y < -20) p.y = height + 20;
                    if (p.y > height + 20) p.y = -20;
                }

                const currentAlpha = p.alpha + Math.sin(p.pulsePhase) * 0.15;
                renderItems.push({
                    type: "particle",
                    z: p.z,
                    x: p.x,
                    y: p.y,
                    r: p.r,
                    color: p.color,
                    alpha: Math.max(0.05, currentAlpha),
                });
            }

            // 3. Helper to generate a 3D DNA Helix
            const generateHelix = (config: {
                startX: number;
                startY: number;
                startZ: number;
                endX: number;
                endY: number;
                endZ: number;
                bowX: number;
                bowY: number;
                radius: number;
                basePairs: number;
                turns: number;
                rotOffset: number;
                sphereRadius: number;
                rungWidth: number;
                overallAlpha: number;
                colorOffset: number;
            }) => {
                const {
                    startX,
                    startY,
                    startZ,
                    endX,
                    endY,
                    endZ,
                    bowX,
                    bowY,
                    radius,
                    basePairs,
                    turns,
                    rotOffset,
                    sphereRadius,
                    rungWidth,
                    overallAlpha,
                    colorOffset,
                } = config;

                const dx = endX - startX;
                const dy = endY - startY;
                const len = Math.hypot(dx, dy) || 1;
                // Perpendicular vector for helix width
                const perpX = -dy / len;
                const perpY = dx / len;

                for (let i = 0; i < basePairs; i++) {
                    const u = i / (basePairs - 1);
                    const bow = Math.sin(u * Math.PI);

                    // Center point along the bowed spine
                    const cx = startX + u * dx + bow * bowX;
                    const cy = startY + u * dy + bow * bowY;
                    const cz = startZ + u * (endZ - startZ);

                    // Helical rotation angle
                    const theta = u * (turns * Math.PI * 2) + angle + rotOffset + mouseX * 0.5;

                    // 3D displacement
                    const cosT = Math.cos(theta);
                    const sinT = Math.sin(theta);

                    // Coordinates for paired nodes
                    const p1x = cx + perpX * (cosT * radius);
                    const p1y = cy + perpY * (cosT * radius);
                    const p1z = cz + sinT * radius;

                    const p2x = cx - perpX * (cosT * radius);
                    const p2y = cy - perpY * (cosT * radius);
                    const p2z = cz - sinT * radius;

                    // Perspective projection
                    const fov = 500;
                    const scale1 = fov / (fov + p1z);
                    const scale2 = fov / (fov + p2z);
                    const scaleMid = fov / (fov + cz);

                    const s1x = p1x * scale1 + (width * (1 - scale1)) * 0.5;
                    const s1y = p1y * scale1 + (height * (1 - scale1)) * 0.5;
                    const s2x = p2x * scale2 + (width * (1 - scale2)) * 0.5;
                    const s2y = p2y * scale2 + (height * (1 - scale2)) * 0.5;

                    const cIndex1 = (i + colorOffset) % PALETTE.length;
                    const cIndex2 = (i + colorOffset + 3) % PALETTE.length;
                    const color1 = PALETTE[cIndex1];
                    const color2 = PALETTE[cIndex2];

                    // Rung connecting the two strands
                    const rungZ = cz;
                    renderItems.push({
                        type: "rung",
                        z: rungZ,
                        x1: s1x,
                        y1: s1y,
                        x2: s2x,
                        y2: s2y,
                        color1,
                        color2,
                        alpha: overallAlpha * 0.75 * Math.min(scale1, scale2),
                        width: rungWidth * scaleMid,
                    });

                    // Intermediate mini-nodes along rung for molecular bond realism
                    const midRungX1 = s1x * 0.65 + s2x * 0.35;
                    const midRungY1 = s1y * 0.65 + s2y * 0.35;
                    const midRungX2 = s1x * 0.35 + s2x * 0.65;
                    const midRungY2 = s1y * 0.35 + s2y * 0.65;

                    renderItems.push({
                        type: "sphere",
                        z: cz - 2,
                        x: midRungX1,
                        y: midRungY1,
                        r: sphereRadius * 0.45 * scaleMid,
                        color: color1,
                        alpha: overallAlpha * 0.85,
                    });

                    renderItems.push({
                        type: "sphere",
                        z: cz + 2,
                        x: midRungX2,
                        y: midRungY2,
                        r: sphereRadius * 0.45 * scaleMid,
                        color: color2,
                        alpha: overallAlpha * 0.85,
                    });

                    // Strand 1 Node
                    renderItems.push({
                        type: "sphere",
                        z: p1z,
                        x: s1x,
                        y: s1y,
                        r: sphereRadius * scale1,
                        color: color1,
                        alpha: overallAlpha * Math.min(1, scale1 * 1.1),
                    });

                    // Strand 2 Node
                    renderItems.push({
                        type: "sphere",
                        z: p2z,
                        x: s2x,
                        y: s2y,
                        r: sphereRadius * scale2,
                        color: color2,
                        alpha: overallAlpha * Math.min(1, scale2 * 1.1),
                    });
                }
            };

            // A. Secondary Background Helix (deeper, softer, smaller radius - depth of field)
            generateHelix({
                startX: width * 0.75,
                startY: -60,
                startZ: 140,
                endX: width * 0.2,
                endY: height * 0.65,
                endZ: 190,
                bowX: -80,
                bowY: 40,
                radius: 38,
                basePairs: 32,
                turns: 3.2,
                rotOffset: 1.5,
                sphereRadius: 6.5,
                rungWidth: 2,
                overallAlpha: 0.38,
                colorOffset: 4,
            });

            // B. Prominent Foreground 3D DNA Helix (large, vibrant, high depth)
            generateHelix({
                startX: width * 0.08,
                startY: -80,
                startZ: -60,
                endX: width * 0.82,
                endY: height + 80,
                endZ: 60,
                bowX: 95,
                bowY: -20,
                radius: 68,
                basePairs: 40,
                turns: 3.8,
                rotOffset: 0,
                sphereRadius: 11.5,
                rungWidth: 3.8,
                overallAlpha: 0.95,
                colorOffset: 0,
            });

            // 4. Depth Sorting (Z-sort: furthest first, closest last)
            renderItems.sort((a, b) => b.z - a.z);

            // 5. Draw All Sorted Items
            for (const item of renderItems) {
                if (item.type === "rung") {
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, Math.min(1, item.alpha));
                    const rungGrad = ctx.createLinearGradient(item.x1, item.y1, item.x2, item.y2);
                    rungGrad.addColorStop(0, item.color1.base);
                    rungGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.75)");
                    rungGrad.addColorStop(1, item.color2.base);

                    ctx.beginPath();
                    ctx.moveTo(item.x1, item.y1);
                    ctx.lineTo(item.x2, item.y2);
                    ctx.lineWidth = Math.max(1, item.width);
                    ctx.lineCap = "round";
                    ctx.strokeStyle = rungGrad;
                    ctx.stroke();
                    ctx.restore();
                } else if (item.type === "sphere") {
                    draw3DSphere(item.x, item.y, item.r, item.color, item.alpha);
                } else if (item.type === "particle") {
                    draw3DSphere(item.x, item.y, item.r, item.color, item.alpha * 0.6);
                }
            }

            // 6. Subtle dark gradient overlay on the right edge to guarantee 100% login form readability
            const fadeGrad = ctx.createLinearGradient(width - 140, 0, width, 0);
            fadeGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
            fadeGrad.addColorStop(1, "rgba(0, 0, 0, 0.92)");
            ctx.fillStyle = fadeGrad;
            ctx.fillRect(width - 140, 0, 140, height);

            // Continue animation if motion allowed
            if (!prefersReducedMotion) {
                animationFrameId = requestAnimationFrame(render);
            }
        };

        // Start animation loop or render static frame
        if (prefersReducedMotion) {
            render(0);
        } else {
            animationFrameId = requestAnimationFrame(render);
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
            window.removeEventListener("mousemove", handleMouseMove);
            motionQuery.removeEventListener("change", handleMotionChange);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
        />
    );
}
