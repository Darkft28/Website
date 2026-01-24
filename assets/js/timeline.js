/**
 * TIMELINE VERTICALE
 * Animation au scroll et interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    const timelineItems = document.querySelectorAll('.timeline-v-item');
    const timelineWrapper = document.querySelector('.timeline-v-wrapper');

    if (!timelineItems.length) {
        console.warn('Timeline items not found');
        return;
    }

    // Options pour l'Intersection Observer - déclenchement rapide
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px 50px 0px'
    };

    // Callback de l'observer
    const observerCallback = (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    };

    // Créer l'observer
    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observer chaque élément de la timeline
    timelineItems.forEach((item) => {
        observer.observe(item);
    });
});
