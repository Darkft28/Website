/* ================================================================
   HERO WAOUH — Vanilla JS, aucune dépendance externe
   Utilisé sur index.html et portfolio/Portfolio.html
   Désactivé automatiquement si prefers-reduced-motion est actif
   ou si l'écran est < 768 px (mobile).
================================================================ */
(function () {
    'use strict';

    /* ----------------------------------------------------------
       0. GUARDS : reduced-motion & mobile
    ---------------------------------------------------------- */
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile       = window.matchMedia('(max-width: 767px)').matches;

    /* Éléments partagés — déclarés ici pour être accessibles à tous les modules */
    const heroSection = document.getElementById('hero-section');
    let isHeroHovered = false;

    /* ----------------------------------------------------------
       1. UTILITAIRES
    ---------------------------------------------------------- */
    /** Lit --color-accent-rgb une seule fois par frame, mis en cache */
    let _rgbCache = '';
    let _rgbFrame = -1;
    function getAccentRGB(frame) {
        if (frame !== _rgbFrame) {
            _rgbCache = getComputedStyle(document.documentElement)
                            .getPropertyValue('--color-accent-rgb').trim() || '16, 185, 129';
            _rgbFrame = frame;
        }
        return _rgbCache;
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    /* ----------------------------------------------------------
       2. CURSOR PERSONNALISÉ (desktop seulement, motion ok)
    ---------------------------------------------------------- */
    const cursorDot  = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');

    if (!prefersReduced && !isMobile && cursorDot && cursorRing && heroSection) {
        heroSection.addEventListener('mouseenter', () => {
            isHeroHovered = true;
            document.body.classList.add('hero-hovered');
        });
        heroSection.addEventListener('mouseleave', () => {
            isHeroHovered = false;
            document.body.classList.remove('hero-hovered');
        });

        let mouseX = -200, mouseY = -200;
        let ringX  = -200, ringY  = -200;
        let ringScale = 1;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        const interactiveSelector = 'a, button, .btn, .magnetic-btn, [role="button"], input, textarea, select, label';
        document.querySelectorAll(interactiveSelector).forEach(el => {
            el.addEventListener('mouseenter', () => { ringScale = 2.4; });
            el.addEventListener('mouseleave', () => { ringScale = 1; });
        });

        (function animateCursor() {
            cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;

            ringX = lerp(ringX, mouseX, 0.12);
            ringY = lerp(ringY, mouseY, 0.12);
            const currentScale = parseFloat(cursorRing.dataset.scale || '1');
            const newScale     = lerp(currentScale, ringScale, 0.15);
            cursorRing.dataset.scale = newScale;
            cursorRing.style.transform =
                `translate(${ringX}px, ${ringY}px) translate(-50%, -50%) scale(${newScale})`;

            requestAnimationFrame(animateCursor);
        })();
    }

    /* ----------------------------------------------------------
       3. CURSOR TRAIL — traînée lumineuse (20 points)
       Utilise transform au lieu de left/top → composite-only, zéro layout
    ---------------------------------------------------------- */
    if (!prefersReduced && !isMobile && heroSection) {
        const TRAIL_LEN   = 20;
        const trailPoints = [];
        const trailEls    = [];

        for (let i = 0; i < TRAIL_LEN; i++) {
            const el = document.createElement('div');
            el.style.cssText = `
                position: fixed;
                top: 0; left: 0;
                pointer-events: none;
                border-radius: 50%;
                z-index: 9997;
                will-change: transform, opacity;
            `;
            document.body.appendChild(el);
            trailEls.push(el);
            trailPoints.push({ x: -200, y: -200 });
        }

        let trailMouseX = -200, trailMouseY = -200;
        document.addEventListener('mousemove', (e) => {
            trailMouseX = e.clientX;
            trailMouseY = e.clientY;
        });

        (function animateTrail() {
            if (!isHeroHovered) {
                trailEls.forEach(el => { el.style.opacity = '0'; });
                requestAnimationFrame(animateTrail);
                return;
            }

            trailPoints.unshift({ x: trailMouseX, y: trailMouseY });
            trailPoints.length = TRAIL_LEN;

            const rgb = getAccentRGB(-1); // frame=-1 : lecture directe hors canvas loop
            trailPoints.forEach((pt, i) => {
                const progress = 1 - i / TRAIL_LEN;
                const size     = Math.max(1, 6 * progress);
                const opacity  = progress * 0.55;
                const half     = size / 2;
                const el       = trailEls[i];
                /* transform composite-only — pas de layout */
                el.style.transform  = `translate(${pt.x - half}px, ${pt.y - half}px)`;
                el.style.width      = size + 'px';
                el.style.height     = size + 'px';
                el.style.opacity    = opacity;
                el.style.background = `rgba(${rgb}, ${opacity})`;
                el.style.boxShadow  = `0 0 ${size * 2}px rgba(${rgb}, ${opacity * 0.8})`;
            });

            requestAnimationFrame(animateTrail);
        })();
    }

    /* ----------------------------------------------------------
       4. CANVAS — Réseau de particules + répulsion curseur
       Optimisations :
       - sqrt évité pour 95%+ des paires (comparaison dx²+dy²)
       - getAccentRGB() une seule fois par frame (cache par numéro de frame)
       - Particules en tableau plat pour meilleure localité mémoire
    ---------------------------------------------------------- */
    const canvas = document.getElementById('hero-particle-canvas');

    if (!prefersReduced && !isMobile && canvas && heroSection) {
        const ctx              = canvas.getContext('2d');
        const PARTICLE_COUNT   = 200;
        const MAX_DIST         = 130;
        const MAX_DIST_SQ      = MAX_DIST * MAX_DIST;       // carré pré-calculé
        const CURSOR_DIST      = MAX_DIST * 1.5;
        const CURSOR_DIST_SQ   = CURSOR_DIST * CURSOR_DIST;
        const REPULSE_RADIUS   = 150;
        const REPULSE_RADIUS_SQ = REPULSE_RADIUS * REPULSE_RADIUS;
        const REPULSE_STRENGTH = 5;

        let canvasW, canvasH;
        let frameNum = 0;
        const particles = [];
        let mouse = { x: -9999, y: -9999 };

        function resizeCanvas() {
            canvasW = canvas.width  = heroSection.offsetWidth;
            canvasH = canvas.height = heroSection.offsetHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        class Particle {
            constructor() {
                this.x        = Math.random() * canvasW;
                this.y        = Math.random() * canvasH;
                this.vx       = (Math.random() - 0.5) * 0.6;
                this.vy       = (Math.random() - 0.5) * 0.6;
                this.r        = Math.random() * 2 + 1;
                this.alpha    = Math.random() * 0.5 + 0.2;
                this.alphaDir = (Math.random() > 0.5 ? 1 : -1) * 0.003;
            }

            update() {
                /* Pulsation opacité */
                this.alpha += this.alphaDir;
                if (this.alpha > 0.7 || this.alpha < 0.15) this.alphaDir *= -1;

                /* Répulsion curseur — sqrt uniquement si dans le rayon */
                const dx  = this.x - mouse.x;
                const dy  = this.y - mouse.y;
                const dSq = dx * dx + dy * dy;

                if (dSq < REPULSE_RADIUS_SQ && dSq > 0) {
                    const dist  = Math.sqrt(dSq);
                    const force = (REPULSE_RADIUS - dist) / REPULSE_RADIUS;
                    this.vx += (dx / dist) * force * REPULSE_STRENGTH * 0.1;
                    this.vy += (dy / dist) * force * REPULSE_STRENGTH * 0.1;
                }

                this.vx *= 0.97;
                this.vy *= 0.97;
                this.x  += this.vx;
                this.y  += this.vy;

                /* Rebond sur les bords */
                if (this.x < 0)       { this.x = 0;       this.vx *= -1; }
                if (this.x > canvasW) { this.x = canvasW; this.vx *= -1; }
                if (this.y < 0)       { this.y = 0;       this.vy *= -1; }
                if (this.y > canvasH) { this.y = canvasH; this.vy *= -1; }
            }
        }

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle());
        }

        heroSection.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        heroSection.addEventListener('mouseleave', () => {
            mouse.x = -9999;
            mouse.y = -9999;
        });

        (function drawFrame() {
            frameNum++;
            ctx.clearRect(0, 0, canvasW, canvasH);

            /* RGB mis en cache pour toute la frame */
            const rgb = getAccentRGB(frameNum);

            /* Connexions entre particules — comparaison dx²+dy² évite 95% des sqrt */
            for (let i = 0; i < particles.length; i++) {
                const pi = particles[i];
                for (let j = i + 1; j < particles.length; j++) {
                    const pj  = particles[j];
                    const dx  = pi.x - pj.x;
                    const dy  = pi.y - pj.y;
                    const dSq = dx * dx + dy * dy;
                    if (dSq < MAX_DIST_SQ) {
                        const opacity = (1 - Math.sqrt(dSq) / MAX_DIST) * 0.35;
                        ctx.beginPath();
                        ctx.moveTo(pi.x, pi.y);
                        ctx.lineTo(pj.x, pj.y);
                        ctx.strokeStyle = `rgba(${rgb}, ${opacity})`;
                        ctx.lineWidth   = 0.8;
                        ctx.stroke();
                    }
                }
            }

            /* Lignes vers le curseur */
            if (mouse.x !== -9999) {
                for (let i = 0; i < particles.length; i++) {
                    const p   = particles[i];
                    const dx  = p.x - mouse.x;
                    const dy  = p.y - mouse.y;
                    const dSq = dx * dx + dy * dy;
                    if (dSq < CURSOR_DIST_SQ) {
                        const opacity = (1 - Math.sqrt(dSq) / CURSOR_DIST) * 0.6;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.strokeStyle = `rgba(${rgb}, ${opacity})`;
                        ctx.lineWidth   = 1;
                        ctx.stroke();
                    }
                }
            }

            /* Update + draw des particules */
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.update();
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${rgb}, ${p.alpha})`;
                ctx.fill();
            }

            requestAnimationFrame(drawFrame);
        })();
    }

    /* ----------------------------------------------------------
       5. SPOTLIGHT RADIAL — halo qui suit le curseur
    ---------------------------------------------------------- */
    const spotlight = document.getElementById('hero-spotlight');

    if (!prefersReduced && heroSection && spotlight) {
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            const x    = ((e.clientX - rect.left) / rect.width)  * 100;
            const y    = ((e.clientY - rect.top)  / rect.height) * 100;
            spotlight.style.opacity    = '1';
            spotlight.style.background =
                `radial-gradient(circle 500px at ${x}% ${y}%,
                    rgba(var(--color-accent-rgb), 0.07) 0%,
                    transparent 70%)`;
        });
        heroSection.addEventListener('mouseleave', () => {
            spotlight.style.opacity = '0';
        });
    }

    /* ----------------------------------------------------------
       6. TILT 3D AVATAR + HALO DIRECTIONNEL
    ---------------------------------------------------------- */
    const tiltContainer = document.getElementById('hero-image-tilt');
    const avatarHalo    = document.getElementById('avatar-halo');

    if (!prefersReduced && !isMobile && tiltContainer && heroSection) {
        const MAX_TILT = 12;
        let tiltCurX = 0, tiltCurY = 0;
        let tiltTgtX = 0, tiltTgtY = 0;

        heroSection.addEventListener('mousemove', (e) => {
            const rect   = tiltContainer.getBoundingClientRect();
            const cx     = rect.left + rect.width  / 2;
            const cy     = rect.top  + rect.height / 2;
            const rawDx  = e.clientX - cx;
            const rawDy  = e.clientY - cy;
            const dSq    = rawDx * rawDx + rawDy * rawDy;
            const radius = rect.width * 1.2;

            if (dSq < radius * radius) {
                const dist      = Math.sqrt(dSq);
                const influence = 1 - dist / radius;
                tiltTgtY =  (rawDx / (rect.width  / 2)) * MAX_TILT * influence;
                tiltTgtX = -(rawDy / (rect.height / 2)) * MAX_TILT * influence;
            } else {
                tiltTgtX = 0;
                tiltTgtY = 0;
            }
        });

        heroSection.addEventListener('mouseleave', () => {
            tiltTgtX = 0;
            tiltTgtY = 0;
        });

        (function animateTilt() {
            tiltCurX = lerp(tiltCurX, tiltTgtX, 0.08);
            tiltCurY = lerp(tiltCurY, tiltTgtY, 0.08);

            const intensity = Math.sqrt(tiltCurX * tiltCurX + tiltCurY * tiltCurY) / MAX_TILT;
            const scale     = 1 + intensity * 0.04;

            tiltContainer.style.transform =
                `perspective(900px) rotateX(${tiltCurX}deg) rotateY(${tiltCurY}deg) scale(${scale})`;

            if (avatarHalo) {
                const haloX = (tiltCurY / MAX_TILT) * 35;
                const haloY = (-tiltCurX / MAX_TILT) * 35;
                avatarHalo.style.transform =
                    `translate(calc(-50% + ${haloX}px), calc(-50% + ${haloY}px))`;
                avatarHalo.style.opacity = 0.4 + intensity * 0.6;
            }

            requestAnimationFrame(animateTilt);
        })();
    }

    /* ----------------------------------------------------------
       7. MAGNETIC BUTTONS
    ---------------------------------------------------------- */
    if (!prefersReduced && !isMobile) {
        const MAGNET_RADIUS   = 80;
        const MAGNET_RADIUS_SQ = MAGNET_RADIUS * MAGNET_RADIUS;
        const MAGNET_STRENGTH = 0.35;
        const MAX_OFFSET      = 12;

        document.querySelectorAll('.magnetic-btn').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const cx   = rect.left + rect.width  / 2;
                const cy   = rect.top  + rect.height / 2;
                const dx   = e.clientX - cx;
                const dy   = e.clientY - cy;
                const dSq  = dx * dx + dy * dy;

                if (dSq < MAGNET_RADIUS_SQ) {
                    const dist   = Math.sqrt(dSq);
                    const factor = (1 - dist / MAGNET_RADIUS) * MAGNET_STRENGTH;
                    const mx = Math.min(Math.abs(dx * factor), MAX_OFFSET) * Math.sign(dx);
                    const my = Math.min(Math.abs(dy * factor), MAX_OFFSET) * Math.sign(dy);
                    btn.style.transform = `translate(${mx}px, ${my}px)`;
                }
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate(0, 0)';
            });
        });
    }

})();
