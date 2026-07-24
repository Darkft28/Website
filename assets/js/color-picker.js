/**
 * Color Picker - Sélecteur de thème de couleur
 * Permet de changer la couleur d'accent du site
 */

(function() {
    'use strict';

    /* Starts assombris pour contraste texte blanc ≥ ~4,5:1 sur les CTA */
    const colorPalettes = {
        emerald: {
            start: '#059669',
            end: '#10B981',
            hoverStart: '#047857',
            hoverEnd: '#059669',
            rgb: '5, 150, 105',
            rgbLight: '16, 185, 129'
        },
        violet: {
            start: '#4F46E5',
            end: '#7C3AED',
            hoverStart: '#4338CA',
            hoverEnd: '#6D28D9',
            rgb: '79, 70, 229',
            rgbLight: '124, 58, 237'
        },
        cyan: {
            start: '#0E7490',
            end: '#0891B2',
            hoverStart: '#155E75',
            hoverEnd: '#0E7490',
            rgb: '14, 116, 144',
            rgbLight: '8, 145, 178'
        },
        rose: {
            start: '#DB2777',
            end: '#EC4899',
            hoverStart: '#BE185D',
            hoverEnd: '#DB2777',
            rgb: '219, 39, 119',
            rgbLight: '236, 72, 153'
        },
        orange: {
            start: '#EA580C',
            end: '#F97316',
            hoverStart: '#C2410C',
            hoverEnd: '#EA580C',
            rgb: '234, 88, 12',
            rgbLight: '249, 115, 22'
        },
        red: {
            start: '#DC2626',
            end: '#EF4444',
            hoverStart: '#B91C1C',
            hoverEnd: '#DC2626',
            rgb: '220, 38, 38',
            rgbLight: '239, 68, 68'
        }
    };

    function applyColor(colorName) {
        const palette = colorPalettes[colorName];
        if (!palette) return;

        const root = document.documentElement;

        // Couleurs principales
        root.style.setProperty('--color-accent-start', palette.start);
        root.style.setProperty('--color-accent-end', palette.end);

        // Valeurs RGB pour les rgba()
        root.style.setProperty('--color-accent-rgb', palette.rgb);
        root.style.setProperty('--color-accent-rgb-light', palette.rgbLight);

        // Gradients
        root.style.setProperty('--gradient-accent', `linear-gradient(135deg, ${palette.start} 0%, ${palette.end} 100%)`);
        root.style.setProperty('--gradient-accent-hover', `linear-gradient(135deg, ${palette.hoverStart} 0%, ${palette.hoverEnd} 100%)`);

        // Ombres
        root.style.setProperty('--shadow-accent', `0 8px 32px rgba(${palette.rgb}, 0.25)`);
        root.style.setProperty('--shadow-accent-lg', `0 20px 40px rgba(${palette.rgb}, 0.3)`);
    }

    function updateActiveColor(colorName) {
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(opt => {
            opt.classList.toggle('active', opt.dataset.color === colorName);
        });
    }

    function initColorPicker() {
        const colorPickerToggle = document.getElementById('colorPickerToggle');
        const colorPickerMenu = document.getElementById('colorPickerMenu');
        const colorOptions = document.querySelectorAll('.color-option');

        if (!colorPickerToggle || !colorPickerMenu) return;

        // Appliquer la couleur sauvegardée
        const savedColor = localStorage.getItem('accentColor') || 'emerald';
        applyColor(savedColor);
        updateActiveColor(savedColor);

        // Toggle du menu
        colorPickerToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            colorPickerMenu.classList.toggle('active');
        });

        // Fermer le menu si on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!colorPickerMenu.contains(e.target) && e.target !== colorPickerToggle) {
                colorPickerMenu.classList.remove('active');
            }
        });

        // Sélection d'une couleur
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                const color = option.dataset.color;
                applyColor(color);
                updateActiveColor(color);
                localStorage.setItem('accentColor', color);
                colorPickerMenu.classList.remove('active');
            });
        });
    }

    // Appliquer la couleur immédiatement (avant DOMContentLoaded)
    const savedColor = localStorage.getItem('accentColor') || 'emerald';
    applyColor(savedColor);

    // Initialiser le picker quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initColorPicker);
    } else {
        initColorPicker();
    }
})();
