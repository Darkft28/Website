# Contexte Projet - Site Web Baptiste Nuytten

## Vue d'ensemble

Site web professionnel de Baptiste Nuytten, développeur web freelance basé à Caen (Normandie).
Le site comprend une page de services/tarifs (index.html) et un portfolio (portfolio/Portfolio.html).

- **URL de production** : https://baptistenuytten.fr
- **SIREN** : 991 703 851
- **Statut** : Micro-entreprise

## Architecture du projet

```
Website/
├── index.html                    # Page principale (services, tarifs, contact)
├── robots.txt
├── sitemap.xml
├── assets/
│   ├── css/
│   │   ├── style.css             # CSS global (variables, reset, header, footer, composants communs)
│   │   ├── services.css          # Styles spécifiques à index.html (hero, tarifs, processus, impact)
│   │   ├── project-pages.css     # Styles des pages projet détaillées
│   │   ├── carousel-3d.css       # Carrousel 3D du portfolio
│   │   ├── scroll-animations.css # Animations au scroll
│   │   ├── strategium.css        # Page démo Strategium
│   │   └── timeline.css          # Timeline verticale expérience
│   ├── img/                      # Images du site (projets, avatar, avis)
│   ├── images/                   # Images Open Graph (og-portfolio.jpg, og-services.jpg)
│   └── js/
│       ├── carousel-3d.js        # Logique du carrousel projets
│       ├── scroll-animations.js  # Animations au défilement
│       ├── strategium.js         # Démo interactive Strategium
│       └── timeline.js           # Timeline verticale animation
├── legal/
│   ├── cgv.html                  # Conditions Générales de Vente
│   └── mentions-legales.html     # Mentions légales
├── portfolio/
│   ├── Portfolio.html            # Page portfolio (about, skills, projets, expérience)
│   ├── index.html                # Redirection 301 vers Portfolio.html
│   └── projets/                  # Pages de détail par projet
│       ├── autoGarden.html
│       ├── pim.html
│       ├── solartracker.html
│       ├── strategium-demo.html
│       ├── streaming.html
│       └── supemon.html
└── download/
    ├── CV_Nuytten_Baptiste.pdf
    └── PokeGame.zip
```

## Stack technique

- **HTML5** sémantique avec données structurées Schema.org (JSON-LD)
- **CSS3 pur** (pas de framework CSS) avec variables CSS custom properties
- **JavaScript vanilla** (pas de framework JS)
- **Font Awesome 6.4** pour les icônes (chargé en defer)
- **Web3Forms** pour le formulaire de contact (API key dans le HTML)
- **Hébergement** : statique (pas de build, pas de bundler)

## Système de design CSS

### Variables principales (définies dans style.css :root)

#### Couleurs
- `--color-accent-start: #6366F1` (indigo)
- `--color-accent-end: #8B5CF6` (violet)
- `--gradient-accent` : gradient indigo → violet (identité visuelle principale)
- Thème clair/sombre via `[data-theme="dark"]`

#### Typographie
- Font : Inter (system-ui fallback)
- Tailles : de `--font-size-xs` (0.75rem) à `--font-size-7xl` (4.5rem)
- Poids : de `--font-weight-light` (300) à `--font-weight-black` (900)

#### Espacements
- Échelle : `--spacing-1` (0.25rem) à `--spacing-32` (8rem)
- Sections : `--spacing-section: 120px`, `--spacing-section-lg: 160px`

#### Layout
- Container max : `--container-max: 1600px`
- Header fixe : `--header-height: 80px`
- `zoom: 0.8` sur `html` (dézoom global voulu par le client)

#### Border radius
- De `--radius-sm` (0.375rem) à `--radius-full` (9999px)

#### Ombres
- Échelle standard : `--shadow-xs` à `--shadow-2xl`
- Ombres accent : `--shadow-accent`, `--shadow-accent-lg`

### Conventions de nommage CSS
- Classes descriptives en kebab-case
- Préfixes par section : `.services-hero-*`, `.solution-*`, `.workflow-*`, `.hosting-*`, `.impact-*`
- Variantes : `.featured` pour mise en avant, `.active` pour état actif
- Responsive : breakpoints à 1199px, 1100px, 991px, 767px, 575px, 480px

### Thème sombre
- Activé via `[data-theme="dark"]` sur `<html>`
- Stocké en localStorage (dark par défaut)
- Toggle dans le header (bouton lune/soleil)

## SEO

### Points critiques
- Chaque page a des balises meta (title, description, keywords, canonical)
- Open Graph + Twitter Cards sur toutes les pages
- Données structurées JSON-LD : ProfessionalService, BreadcrumbList, FAQPage
- Geo tags (Caen, Normandie)
- Sitemap XML à la racine
- robots.txt permissif
- Images avec `loading="lazy"`, `width`, `height`
- CSS non-critique en `media="print" onload="this.media='all'"`

### Mots-clés cibles
- "développeur web Caen"
- "développeur web freelance Caen"
- "création site internet Caen"
- "création site vitrine Caen"

## Fonctionnalités JavaScript (dans index.html inline)

- **Menu hamburger** : toggle `.active` sur `.nav-links` et `.hamburger`
- **Thème** : localStorage, `data-theme` sur `<html>`
- **Animations scroll** : IntersectionObserver (opacity + translateY)
- **Compteurs stats** : Animation requestAnimationFrame sur `.stat-number[data-target]`
- **Smooth scroll** : offset de 70px pour le header fixe
- **Dropdown portfolio** : hover sur desktop, lien simple sur mobile

## Règles importantes

### Ce qu'il ne faut PAS modifier sans demander
- Les prix et tarifs (800€, 1800€, 20€/mois, 50€/mois, 30€/h)
- Les informations légales (SIREN, SIRET, TVA)
- L'API key Web3Forms
- Les URLs canoniques et liens LinkedIn/GitHub
- La structure Schema.org (impacts SEO)

### Conventions à respecter
- Pas de framework CSS/JS - tout est vanilla
- Pas de build step - le code est servi tel quel
- Le thème sombre est le thème par défaut
- Le font-size root à 13px est volontaire (effet dézoom global)
- Les animations doivent respecter `prefers-reduced-motion`
- Les images doivent avoir `loading="lazy"`, `width` et `height`
- Le header est transparent en haut de page, visible au scroll (classe `.scrolled`)
- Mobile first pour les media queries dans le responsive

### Git & Commits
- **JAMAIS** de `Co-Authored-By: Claude` dans les messages de commit
- **JAMAIS** de mention "Generated with Claude Code" dans les PRs ou commits
- **JAMAIS** de référence à Claude, IA ou assistant dans l'historique git
- Les commits doivent apparaître comme écrits par le développeur uniquement
- Messages de commit en français, concis et descriptifs

### Performance
- Pas de dépendances npm
- CSS Font Awesome chargé en defer
- Images optimisées avec lazy loading
- `will-change: transform` sur les éléments animés
- `transform: translate3d(0,0,0)` pour l'accélération GPU

## Formulaire de contact

- Action : `https://api.web3forms.com/submit` (POST)
- Champs : nom, email, téléphone (optionnel), type de projet (select), message
- Pas de validation JS custom (utilise les attributs HTML required)

## Responsive breakpoints

| Breakpoint | Cible |
|-----------|-------|
| 1199px | Desktop large |
| 1100px | Workflow cards (2 colonnes) |
| 991px | Tablette (1 colonne solutions, menu mobile) |
| 767px | Mobile (layout empilé, hero simplifié) |
| 575px | Petit mobile (tailles réduites) |
| 480px | Très petit écran |

## Git

- Branche principale : `main`
- Messages de commit en français, concis
- Pas de CI/CD configuré
- Déploiement manuel
- **Aucune trace de Claude/IA** dans les commits, PRs, ou messages (pas de Co-Authored-By, pas de "Generated with Claude Code")
