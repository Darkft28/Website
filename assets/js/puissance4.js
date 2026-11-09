/* ===================================================================
   PUISSANCE 4 - Port JavaScript du code Python (MinMax alpha-bêta, MCTS)
   Joueur 1 = humain, joueur 2 = IA (ou inversement selon le choix).
   ================================================================= */
(function () {
    'use strict';

    var N = 6;          // lignes
    var M = 7;          // colonnes
    var P = 4;          // pions à aligner
    var DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]];

    /* ---------------------------------------------------------------
       Logique du jeu (plateau à plat : index = ligne * M + colonne,
       ligne 0 = haut du plateau)
       ------------------------------------------------------------- */
    function nouveauPlateau() {
        return new Uint8Array(N * M);
    }

    function adversaire(joueur) {
        return joueur === 1 ? 2 : 1;
    }

    function peutJouer(b, col) {
        return col >= 0 && col < M && b[col] === 0;
    }

    function colonnesPossibles(b) {
        var res = [];
        for (var c = 0; c < M; c++) {
            if (b[c] === 0) res.push(c);
        }
        return res;
    }

    function estPlein(b) {
        for (var c = 0; c < M; c++) {
            if (b[c] === 0) return false;
        }
        return true;
    }

    // Pose un pion et renvoie la ligne d'arrivée (-1 si impossible)
    function poserPion(b, col, joueur) {
        for (var l = N - 1; l >= 0; l--) {
            if (b[l * M + col] === 0) {
                b[l * M + col] = joueur;
                return l;
            }
        }
        return -1;
    }

    function compterDirection(b, l, c, joueur, dl, dc) {
        var compteur = 0;
        l += dl;
        c += dc;
        while (l >= 0 && l < N && c >= 0 && c < M && b[l * M + c] === joueur) {
            compteur++;
            l += dl;
            c += dc;
        }
        return compteur;
    }

    // Vrai si le pion en (l, c) appartient à un alignement gagnant
    function alignementGagnant(b, l, c, joueur) {
        for (var i = 0; i < DIRECTIONS.length; i++) {
            var dl = DIRECTIONS[i][0];
            var dc = DIRECTIONS[i][1];
            var total = 1 + compterDirection(b, l, c, joueur, dl, dc) + compterDirection(b, l, c, joueur, -dl, -dc);
            if (total >= P) return true;
        }
        return false;
    }

    // Renvoie les cases de l'alignement gagnant (pour la mise en évidence)
    function casesGagnantes(b, l, c, joueur) {
        for (var i = 0; i < DIRECTIONS.length; i++) {
            var dl = DIRECTIONS[i][0];
            var dc = DIRECTIONS[i][1];
            var a = compterDirection(b, l, c, joueur, dl, dc);
            var z = compterDirection(b, l, c, joueur, -dl, -dc);
            if (1 + a + z >= P) {
                var cases = [];
                for (var k = -z; k <= a; k++) {
                    cases.push([l + k * dl, c + k * dc]);
                }
                return cases;
            }
        }
        return [];
    }

    // Gagnant sur tout le plateau (0 si aucun)
    function gagnant(b) {
        for (var l = 0; l < N; l++) {
            for (var c = 0; c < M; c++) {
                var j = b[l * M + c];
                if (j !== 0 && alignementGagnant(b, l, c, j)) return j;
            }
        }
        return 0;
    }

    /* ---------------------------------------------------------------
       Heuristique (evaluation_heuristique_2 du code Python)
       ------------------------------------------------------------- */
    function evaluerBloc(b, l0, c0, dl, dc, joueur, adv) {
        var nj = 0;
        var na = 0;
        for (var k = 0; k < 4; k++) {
            var v = b[(l0 + k * dl) * M + (c0 + k * dc)];
            if (v === joueur) nj++;
            else if (v === adv) na++;
        }
        if (nj > 0 && na > 0) return 0;
        if (nj > 0) return Math.pow(2, nj);
        if (na > 0) return -Math.pow(2, na);
        return 0;
    }

    function evaluation(b, joueur) {
        var adv = adversaire(joueur);
        var score = 0;
        var l, c;
        for (l = 0; l < N; l++) for (c = 0; c < M - 3; c++) score += evaluerBloc(b, l, c, 0, 1, joueur, adv);
        for (l = 0; l < N - 3; l++) for (c = 0; c < M; c++) score += evaluerBloc(b, l, c, 1, 0, joueur, adv);
        for (l = 0; l < N - 3; l++) for (c = 0; c < M - 3; c++) score += evaluerBloc(b, l, c, 1, 1, joueur, adv);
        for (l = 3; l < N; l++) for (c = 0; c < M - 3; c++) score += evaluerBloc(b, l, c, -1, 1, joueur, adv);
        return score;
    }

    /* ---------------------------------------------------------------
       IA 1 : bot aléatoire (StupidBot)
       ------------------------------------------------------------- */
    function coupAleatoire(b) {
        var cols = colonnesPossibles(b);
        return cols[Math.floor(Math.random() * cols.length)];
    }

    /* ---------------------------------------------------------------
       IA 2 : MinMax avec élagage alpha-bêta
       ------------------------------------------------------------- */
    function coupMinMax(b, joueur, profondeur) {
        var noeuds = 0;

        function minmax(plateau, prof, courant, alpha, beta) {
            noeuds++;
            var g = gagnant(plateau);
            if (g === joueur) return { score: 100000, col: null };
            if (g === adversaire(joueur)) return { score: -100000, col: null };
            if (estPlein(plateau)) return { score: 0, col: null };
            if (prof === 0) return { score: evaluation(plateau, joueur), col: null };

            var cols = colonnesPossibles(plateau);
            var meilleur, meilleureCol = null;

            if (courant === joueur) {
                meilleur = -1000000;
                for (var i = 0; i < cols.length; i++) {
                    var copie = new Uint8Array(plateau);
                    poserPion(copie, cols[i], courant);
                    var r = minmax(copie, prof - 1, adversaire(courant), alpha, beta);
                    if (r.score > meilleur) {
                        meilleur = r.score;
                        meilleureCol = cols[i];
                    }
                    if (meilleur > alpha) alpha = meilleur;
                    if (alpha >= beta) break;
                }
            } else {
                meilleur = 1000000;
                for (var j = 0; j < cols.length; j++) {
                    var copie2 = new Uint8Array(plateau);
                    poserPion(copie2, cols[j], courant);
                    var r2 = minmax(copie2, prof - 1, adversaire(courant), alpha, beta);
                    if (r2.score < meilleur) {
                        meilleur = r2.score;
                        meilleureCol = cols[j];
                    }
                    if (meilleur < beta) beta = meilleur;
                    if (alpha >= beta) break;
                }
            }
            return { score: meilleur, col: meilleureCol };
        }

        var res = minmax(b, profondeur, joueur, -1000000, 1000000);
        var col = res.col === null ? colonnesPossibles(b)[0] : res.col;
        return { col: col, info: noeuds + ' nœuds explorés' };
    }

    /* ---------------------------------------------------------------
       IA 3 : MCTS (Monte-Carlo Tree Search, sélection UCT)
       ------------------------------------------------------------- */
    function creerSommet(plateau, joueurActuel, parent, coup, dernier) {
        var vainqueur = 0;
        if (dernier) {
            // dernier = [ligne, colonne, joueur] du coup qui mène à ce sommet
            if (alignementGagnant(plateau, dernier[0], dernier[1], dernier[2])) vainqueur = dernier[2];
        }
        var final = vainqueur !== 0 || estPlein(plateau);
        return {
            b: plateau,
            joueur: joueurActuel,   // joueur qui doit jouer depuis ce sommet
            parent: parent,
            coup: coup,
            enfants: [],
            nonEssayes: final ? [] : colonnesPossibles(plateau),
            visites: 0,
            victoires: 0,
            vainqueur: vainqueur,
            final: final
        };
    }

    function coupMCTS(b, joueur, iterations, C) {
        var racine = creerSommet(new Uint8Array(b), joueur, null, null, null);

        function selection(s) {
            while (s.nonEssayes.length === 0 && !s.final) {
                s = meilleurEnfantUCT(s);
            }
            return s;
        }

        function meilleurEnfantUCT(s) {
            var meilleurScore = -Infinity;
            var meilleurs = [];
            for (var i = 0; i < s.enfants.length; i++) {
                var e = s.enfants[i];
                var score;
                if (e.visites === 0) {
                    score = 1e6;
                } else {
                    score = e.victoires / e.visites + C * Math.sqrt(Math.log(s.visites) / e.visites);
                }
                if (score > meilleurScore) {
                    meilleurScore = score;
                    meilleurs = [e];
                } else if (score === meilleurScore) {
                    meilleurs.push(e);
                }
            }
            return meilleurs[Math.floor(Math.random() * meilleurs.length)];
        }

        function expansion(s) {
            if (s.final || s.nonEssayes.length === 0) return s;
            var idx = Math.floor(Math.random() * s.nonEssayes.length);
            var coup = s.nonEssayes.splice(idx, 1)[0];
            var copie = new Uint8Array(s.b);
            var l = poserPion(copie, coup, s.joueur);
            var enfant = creerSommet(copie, adversaire(s.joueur), s, coup, [l, coup, s.joueur]);
            s.enfants.push(enfant);
            return enfant;
        }

        function simulation(s) {
            if (s.vainqueur !== 0) return s.vainqueur;
            var plateau = new Uint8Array(s.b);
            var courant = s.joueur;
            while (true) {
                var cols = colonnesPossibles(plateau);
                if (cols.length === 0) return 0;
                var col = cols[Math.floor(Math.random() * cols.length)];
                var l = poserPion(plateau, col, courant);
                if (alignementGagnant(plateau, l, col, courant)) return courant;
                courant = adversaire(courant);
            }
        }

        function retropropagation(s, resultat) {
            while (s !== null) {
                s.visites++;
                // victoire créditée au joueur qui vient de jouer pour arriver ici
                if (resultat === adversaire(s.joueur)) s.victoires += 1;
                else if (resultat === 0) s.victoires += 0.5;
                s = s.parent;
            }
        }

        for (var i = 0; i < iterations; i++) {
            var s = selection(racine);
            s = expansion(s);
            retropropagation(s, simulation(s));
        }

        if (racine.enfants.length === 0) {
            return { col: colonnesPossibles(b)[0], info: '' };
        }
        var maxVisites = -1;
        var coups = [];
        var meilleureWin = 0;
        for (var k = 0; k < racine.enfants.length; k++) {
            var e = racine.enfants[k];
            if (e.visites > maxVisites) {
                maxVisites = e.visites;
                coups = [e.coup];
                meilleureWin = e.victoires / e.visites;
            } else if (e.visites === maxVisites) {
                coups.push(e.coup);
            }
        }
        return {
            col: coups[Math.floor(Math.random() * coups.length)],
            info: iterations + ' simulations, ~' + Math.round(meilleureWin * 100) + '% de victoire estimée'
        };
    }

    /* ---------------------------------------------------------------
       Configuration des niveaux
       ------------------------------------------------------------- */
    var NIVEAUX = {
        random: [{ label: 'Aléatoire', valeur: 0 }],
        minmax: [
            { label: 'Facile (profondeur 2)', valeur: 2 },
            { label: 'Moyen (profondeur 4)', valeur: 4 },
            { label: 'Difficile (profondeur 6)', valeur: 6 }
        ],
        mcts: [
            { label: 'Facile (200 simulations)', valeur: 200 },
            { label: 'Moyen (1 200 simulations)', valeur: 1200 },
            { label: 'Difficile (20 000 simulations)', valeur: 20000 },
            { label: 'Expert (100 000 simulations, très fort)', valeur: 100000 }
        ]
    };

    function calculerCoupIA(algo, b, joueur, niveau) {
        if (algo === 'random') return { col: coupAleatoire(b), info: '' };
        if (algo === 'minmax') return coupMinMax(b, joueur, niveau);
        return coupMCTS(b, joueur, niveau, 1.414);
    }

    /* ---------------------------------------------------------------
       Interface
       ------------------------------------------------------------- */
    document.addEventListener('DOMContentLoaded', function () {
        var elBoard = document.getElementById('p4Board');
        var elStatus = document.getElementById('p4Status');
        var elInfo = document.getElementById('p4Info');
        var elScore = document.getElementById('p4Score');
        var btnReplay = document.getElementById('p4Replay');
        var elRules = document.getElementById('p4RulesModal');
        var btnRules = document.getElementById('p4RulesBtn');
        var btnCloseRules = document.getElementById('p4CloseRules');

        if (!elBoard) return;

        var etat = null;
        var scores = { humain: 0, ia: 0, nul: 0 };
        var minuterie = null;

        // Construction du plateau : 7 boutons-colonnes de 6 cases
        var colonnes = [];
        var cases = [];
        for (var c = 0; c < M; c++) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'p4-column';
            btn.setAttribute('aria-label', 'Jouer dans la colonne ' + (c + 1));
            btn.dataset.col = c;
            colonnes.push(btn);
            for (var l = 0; l < N; l++) {
                var cell = document.createElement('span');
                cell.className = 'p4-cell';
                btn.appendChild(cell);
                cases[l * M + c] = cell;
            }
            elBoard.appendChild(btn);
        }

        function majScore() {
            elScore.textContent = 'Vous ' + scores.humain + ' – ' + scores.nul + ' nul(s) – ' + scores.ia + ' IA';
        }

        function dessiner() {
            for (var i = 0; i < N * M; i++) {
                var v = etat.b[i];
                var cl = 'p4-cell' + (v ? ' p4-' + (v === etat.humain ? 'human' : 'ai') : '');
                cases[i].className = cl;
            }
            colonnes.forEach(function (btn, col) {
                var jouable = !etat.fini && !etat.iaReflechit && etat.courant === etat.humain && peutJouer(etat.b, col);
                btn.disabled = !jouable;
            });
        }

        function nouvellePartie() {
            clearTimeout(minuterie);
            var humainCommence = true;
            etat = {
                b: nouveauPlateau(),
                humain: humainCommence ? 1 : 2,
                ia: humainCommence ? 2 : 1,
                courant: 1,
                fini: false,
                iaReflechit: false,
                algo: 'mcts',
                niveau: 100000
            };
            elInfo.textContent = '';
            majScore();
            dessiner();
            tourSuivant();
        }

        function statut(texte, classe) {
            elStatus.textContent = texte;
            elStatus.className = 'p4-status' + (classe ? ' ' + classe : '');
        }

        function tourSuivant() {
            if (etat.fini) return;
            if (etat.courant === etat.humain) {
                statut('À vous de jouer (pions rouges)');
                dessiner();
            } else {
                etat.iaReflechit = true;
                statut("L'IA réfléchit…", 'thinking');
                dessiner();
                // laisse le navigateur afficher le message avant le calcul
                minuterie = setTimeout(jouerIA, 80);
            }
        }

        function jouerIA() {
            var debut = performance.now();
            var res = calculerCoupIA(etat.algo, etat.b, etat.ia, etat.niveau);
            var duree = Math.round(performance.now() - debut);
            elInfo.textContent = "Dernier coup de l'IA : colonne " + (res.col + 1) +
                ' (' + duree + ' ms' + (res.info ? ' – ' + res.info : '') + ')';
            // petite pause minimale pour que le coup soit lisible
            var attente = Math.max(0, 350 - duree);
            minuterie = setTimeout(function () {
                etat.iaReflechit = false;
                jouerCoup(res.col);
            }, attente);
        }

        function jouerCoup(col) {
            if (etat.fini || !peutJouer(etat.b, col)) return;
            var joueur = etat.courant;
            var l = poserPion(etat.b, col, joueur);
            dessiner();
            cases[l * M + col].classList.add('p4-drop');

            if (alignementGagnant(etat.b, l, col, joueur)) {
                etat.fini = true;
                casesGagnantes(etat.b, l, col, joueur).forEach(function (p) {
                    cases[p[0] * M + p[1]].classList.add('p4-win');
                });
                if (joueur === etat.humain) {
                    scores.humain++;
                    statut('Bravo, vous avez gagné !', 'win');
                } else {
                    scores.ia++;
                    statut("L'IA a gagné…", 'lose');
                }
                majScore();
                dessiner();
                return;
            }
            if (estPlein(etat.b)) {
                etat.fini = true;
                scores.nul++;
                statut('Match nul', 'draw');
                majScore();
                dessiner();
                return;
            }
            etat.courant = adversaire(joueur);
            tourSuivant();
        }

        elBoard.addEventListener('click', function (e) {
            var btn = e.target.closest('.p4-column');
            if (!btn || btn.disabled || !etat) return;
            if (etat.courant !== etat.humain || etat.fini || etat.iaReflechit) return;
            jouerCoup(parseInt(btn.dataset.col, 10));
        });

        // Raccourcis clavier : touches 1 à 7
        document.addEventListener('keydown', function (e) {
            if (!etat) return;
            if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
            if (e.key >= '1' && e.key <= '7') {
                var col = parseInt(e.key, 10) - 1;
                if (etat.courant === etat.humain && !etat.fini && !etat.iaReflechit) jouerCoup(col);
            }
        });

        btnReplay.addEventListener('click', nouvellePartie);

        nouvellePartie();

        // Modal des règles
        if (btnRules && elRules) {
            btnRules.addEventListener('click', function () { elRules.classList.add('active'); });
            btnCloseRules.addEventListener('click', function () { elRules.classList.remove('active'); });
            elRules.addEventListener('click', function (e) {
                if (e.target === elRules) elRules.classList.remove('active');
            });
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') elRules.classList.remove('active');
            });
        }
    });
})();
