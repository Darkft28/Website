// Animations avancées basées sur le scroll

document.addEventListener('DOMContentLoaded', function() {

    // Configuration
    const isMobile = window.innerWidth <= 768;

    // ===== 1. HERO SECTION - Disparition progressive =====
    function initHeroScrollEffect() {
        const hero = document.querySelector('.hero');
        const heroContent = document.querySelector('.hero-content');

        if (!hero || !heroContent) return;

        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            const heroHeight = hero.offsetHeight;
            const fadeStart = heroHeight * 0.3;
            const fadeEnd = heroHeight * 0.8;

            if (scrolled >= fadeStart && scrolled <= fadeEnd) {
                // Calculer le pourcentage de disparition
                const fadeProgress = (scrolled - fadeStart) / (fadeEnd - fadeStart);
                const opacity = 1 - fadeProgress;
                const scale = 1 - (fadeProgress * 0.1);
                const blur = fadeProgress * 10;

                heroContent.style.opacity = opacity;
                heroContent.style.transform = `scale(${scale})`;
                heroContent.style.filter = `blur(${blur}px)`;
            } else if (scrolled > fadeEnd) {
                heroContent.style.opacity = '0';
                heroContent.style.transform = 'scale(0.9)';
            } else {
                heroContent.style.opacity = '1';
                heroContent.style.transform = 'scale(1)';
                heroContent.style.filter = 'blur(0px)';
            }
        }, { passive: true });
    }

    // ===== 2. CARROUSEL 3 CARTES AVEC PERSPECTIVE =====
    function initProjectsCarousel() {
        const projectsSection = document.getElementById('projects');
        if (!projectsSection) return;

        const projectsGrid = projectsSection.querySelector('.projects');
        if (!projectsGrid) return;

        const projectCards = Array.from(projectsGrid.querySelectorAll('.project-card'));
        if (projectCards.length === 0) return;

        // Sur mobile, ne pas créer de carrousel
        if (isMobile) return;

        let currentIndex = 0;

        // Créer la structure du carrousel
        const container = document.createElement('div');
        container.className = 'projects-carousel-container';

        const wrapper = document.createElement('div');
        wrapper.className = 'projects-carousel-wrapper';

        const track = document.createElement('div');
        track.className = 'projects-carousel-track';

        // Ajouter les cartes au track
        projectCards.forEach(card => {
            track.appendChild(card);
        });

        // Créer les contrôles de navigation
        const controls = document.createElement('div');
        controls.className = 'carousel-controls';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'carousel-btn prev';
        prevBtn.innerHTML = '‹';
        prevBtn.setAttribute('aria-label', 'Projet précédent');

        const nextBtn = document.createElement('button');
        nextBtn.className = 'carousel-btn next';
        nextBtn.innerHTML = '›';
        nextBtn.setAttribute('aria-label', 'Projet suivant');

        controls.appendChild(prevBtn);
        controls.appendChild(nextBtn);
        wrapper.appendChild(controls);

        // Créer l'indicateur de position
        const info = document.createElement('div');
        info.className = 'carousel-info';

        // Créer les dots de navigation
        const dots = document.createElement('div');
        dots.className = 'carousel-dots';
        projectCards.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'carousel-dot';
            dot.addEventListener('click', () => goToSlide(index));
            dots.appendChild(dot);
        });

        // Assembler tout
        wrapper.appendChild(track);
        container.appendChild(wrapper);
        container.appendChild(info);
        container.appendChild(dots);

        // Remplacer la grille
        projectsGrid.replaceWith(container);

        // Fonction pour mettre à jour l'affichage
        function updateCarousel() {
            const total = projectCards.length;

            // Calculer les indices avec boucle infinie
            const leftIndex = (currentIndex - 1 + total) % total;
            const centerIndex = currentIndex;
            const rightIndex = (currentIndex + 1) % total;

            // Appliquer les classes
            projectCards.forEach((card, i) => {
                card.classList.remove('center', 'left', 'right', 'hidden');

                if (i === centerIndex) {
                    card.classList.add('center');
                } else if (i === leftIndex) {
                    card.classList.add('left');
                } else if (i === rightIndex) {
                    card.classList.add('right');
                } else {
                    card.classList.add('hidden');
                }
            });

            // Mettre à jour l'indicateur
            info.textContent = `${currentIndex + 1} / ${total}`;

            // Mettre à jour les dots
            dots.querySelectorAll('.carousel-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });
        }

        // Navigation
        function navigate(direction) {
            const total = projectCards.length;
            currentIndex = (currentIndex + direction + total) % total;
            updateCarousel();
        }

        function goToSlide(index) {
            currentIndex = index;
            updateCarousel();
        }

        // Événements des boutons
        prevBtn.addEventListener('click', () => navigate(-1));
        nextBtn.addEventListener('click', () => navigate(1));

        // Navigation au clavier
        document.addEventListener('keydown', (e) => {
            const rect = projectsSection.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

            if (isVisible) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    navigate(-1);
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    navigate(1);
                }
            }
        });

        // Navigation avec la molette
        let wheelTimeout;
        wrapper.addEventListener('wheel', (e) => {
            e.preventDefault();

            clearTimeout(wheelTimeout);
            wheelTimeout = setTimeout(() => {
                if (e.deltaY > 0) {
                    navigate(1);
                } else {
                    navigate(-1);
                }
            }, 100);
        }, { passive: false });

        // Initialiser
        updateCarousel();
    }

    // ===== 3. RÉVÉLATION PROGRESSIVE DES SECTIONS =====
    function initRevealAnimations() {
        const revealElements = document.querySelectorAll('.reveal-section, .timeline-item');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });

        revealElements.forEach(el => observer.observe(el));
    }

    // ===== 4. ANIMATION DES SKILL TAGS AVEC EFFET DE VAGUE =====
    function initSkillsAnimation() {
        const skillTags = document.querySelectorAll('.skills .skill-tag');

        skillTags.forEach((tag, index) => {
            tag.classList.add(`wave-${(index % 9) + 1}`);
        });

        const skillsSection = document.getElementById('skills');
        if (!skillsSection) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    skillTags.forEach(tag => {
                        tag.classList.add('revealed');
                    });
                }
            });
        }, {
            threshold: 0.3
        });

        observer.observe(skillsSection);
    }

    // ===== 5. INDICATEUR DE PROGRESSION DU SCROLL =====
    function initScrollIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'scroll-indicator';
        document.body.appendChild(indicator);

        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            const height = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrolled / height) * 100;
            indicator.style.width = progress + '%';
        }, { passive: true });
    }

    // ===== 6. BOUTON SCROLL TO TOP =====
    function initScrollToTop() {
        const button = document.createElement('button');
        button.className = 'scroll-to-top';
        button.innerHTML = '↑';
        button.setAttribute('aria-label', 'Retour en haut');
        document.body.appendChild(button);

        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                button.classList.add('visible');
            } else {
                button.classList.remove('visible');
            }
        }, { passive: true });

        button.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ===== 7. ANIMATION DES TITRES DE SECTION =====
    function initSectionHeaders() {
        const headers = document.querySelectorAll('section h2');

        headers.forEach(header => {
            const wrapper = document.createElement('div');
            wrapper.className = 'section-header';
            header.parentNode.insertBefore(wrapper, header);
            wrapper.appendChild(header);
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, {
            threshold: 0.5
        });

        document.querySelectorAll('.section-header').forEach(el => observer.observe(el));
    }

    // ===== 8. EFFET MAGNÉTIQUE SUR LES CARTES (Desktop uniquement) =====
    function initMagneticEffect() {
        if (isMobile) return;

        const cards = document.querySelectorAll('.project-card');

        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.classList.add('magnetic-active');
            });

            card.addEventListener('mouseleave', function() {
                this.classList.remove('magnetic-active');
            });
        });
    }

    // ===== 9. PARTICULES FLOTTANTES DANS LE HERO =====
    function initFloatingParticles() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        const particleCount = isMobile ? 5 : 10;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (10 + Math.random() * 10) + 's';
            hero.appendChild(particle);
        }
    }

    // ===== 10. SMOOTH SCROLL AMÉLIORÉ =====
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const offsetTop = target.offsetTop - 70;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ===== INITIALISATION =====
    function init() {
        // Marquer les sections pour les animations
        const sections = document.querySelectorAll('#about, #skills, #experience, #contact');
        sections.forEach(section => section.classList.add('reveal-section'));

        // Initialiser toutes les animations
        initHeroScrollEffect();
        initProjectsCarousel();
        initRevealAnimations();
        initSkillsAnimation();
        initScrollIndicator();
        initScrollToTop();
        initSectionHeaders();
        initMagneticEffect();
        initFloatingParticles();
        initSmoothScroll();
    }

    // Démarrer après un court délai pour s'assurer que tout est chargé
    setTimeout(init, 100);
});
