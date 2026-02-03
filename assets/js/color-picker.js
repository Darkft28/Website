/**
 * Color Picker - Sélecteur de thème de couleur
 * Permet de changer la couleur d'accent du site
 */

(function() {
    'use strict';

    const colorPalettes = {
        emerald: {
            start: '#10B981',
            end: '#34D399',
            hoverStart: '#059669',
            hoverEnd: '#10B981',
            rgb: '16, 185, 129',
            rgbLight: '52, 211, 153'
        },
        violet: {
            start: '#6366F1',
            end: '#8B5CF6',
            hoverStart: '#4F46E5',
            hoverEnd: '#7C3AED',
            rgb: '99, 102, 241',
            rgbLight: '139, 92, 246'
        },
        cyan: {
            start: '#06B6D4',
            end: '#22D3EE',
            hoverStart: '#0891B2',
            hoverEnd: '#06B6D4',
            rgb: '6, 182, 212',
            rgbLight: '34, 211, 238'
        },
        rose: {
            start: '#EC4899',
            end: '#F472B6',
            hoverStart: '#DB2777',
            hoverEnd: '#EC4899',
            rgb: '236, 72, 153',
            rgbLight: '244, 114, 182'
        },
        orange: {
            start: '#F97316',
            end: '#FB923C',
            hoverStart: '#EA580C',
            hoverEnd: '#F97316',
            rgb: '249, 115, 22',
            rgbLight: '251, 146, 60'
        },
        red: {
            start: '#EF4444',
            end: '#F87171',
            hoverStart: '#DC2626',
            hoverEnd: '#EF4444',
            rgb: '239, 68, 68',
            rgbLight: '248, 113, 113'
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
