(function () {
'use strict';

// ============================================================
// DONNÉES
// ============================================================

const TYPE_COLORS = {
    'Feu':        '#FF6B6B',
    'Eau':        '#4EC9B0',
    'Plante':     '#6CBF59',
    'Electrique': '#E5C07B',
    'Normal':     '#ABB2BF',
    'Poison':     '#C678DD',
    'Sol':        '#CC8B3C'
};

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

const STARTERS_DATA = [
    {
        name: 'Supmander', type: 'Feu',
        hp: 10, maxHp: 10, attack: 1, defense: 1, speed: 1, accuracy: 1, evasion: 1,
        level: 1, exp: 0,
        attacks: [
            { name: 'Griffe',       damage: 3, eff_atk: 0, eff_def: 0, eff_eva: 0 },
            { name: 'Rugissement',  damage: 0, eff_atk: 1, eff_def: 0, eff_eva: 0 }
        ]
    },
    {
        name: 'Supirtle', type: 'Eau',
        hp: 9, maxHp: 9, attack: 1, defense: 1, speed: 3, accuracy: 1, evasion: 1,
        level: 1, exp: 0,
        attacks: [
            { name: 'Charge',    damage: 2, eff_atk: 0, eff_def: 0, eff_eva: 0 },
            { name: 'Feuillage', damage: 0, eff_atk: 0, eff_def: 0, eff_eva: 1 }
        ]
    },
    {
        name: 'Supasaur', type: 'Plante',
        hp: 11, maxHp: 11, attack: 2, defense: 1, speed: 2, accuracy: 1, evasion: 1,
        level: 1, exp: 0,
        attacks: [
            { name: 'Charge',    damage: 2, eff_atk: 0, eff_def: 0, eff_eva: 0 },
            { name: 'Carapace',  damage: 0, eff_atk: 0, eff_def: 1, eff_eva: 0 }
        ]
    }
];

const WILD_TEMPLATES = [
    {
        name: 'Supachu', type: 'Electrique',
        bHp: 8, bAtk: 2, bDef: 1, bSpd: 4, bAcc: 1, bEva: 1,
        attacks: [
            { name: 'Éclair',       damage: 3, eff_atk: 0, eff_def: 0, eff_eva: 0 },
            { name: 'Queue de Fer', damage: 2, eff_atk: 0, eff_def: 0, eff_eva: 0 }
        ]
    },
    {
        name: 'Supevee', type: 'Normal',
        bHp: 10, bAtk: 1, bDef: 2, bSpd: 2, bAcc: 1, bEva: 1,
        attacks: [
            { name: 'Charge',      damage: 2, eff_atk: 0, eff_def: 0, eff_eva: 0 },
            { name: 'Rugissement', damage: 0, eff_atk: 1, eff_def: 0, eff_eva: 0 }
        ]
    },
    {
        name: 'Supattata', type: 'Poison',
        bHp: 9, bAtk: 2, bDef: 1, bSpd: 2, bAcc: 1, bEva: 1,
        attacks: [
            { name: 'Morsure', damage: 3, eff_atk: 0, eff_def:  0, eff_eva: 0 },
            { name: 'Acide',   damage: 2, eff_atk: 0, eff_def: -1, eff_eva: 0 }
        ]
    },
    {
        name: 'Supbat', type: 'Eau',
        bHp: 7, bAtk: 2, bDef: 1, bSpd: 3, bAcc: 1, bEva: 2,
        attacks: [
            { name: 'Vague',  damage: 2, eff_atk: 0, eff_def: 0, eff_eva: 0 },
            { name: 'Splash', damage: 3, eff_atk: 0, eff_def: 0, eff_eva: 0 }
        ]
    },
    {
        name: 'Supdude', type: 'Sol',
        bHp: 12, bAtk: 3, bDef: 2, bSpd: 1, bAcc: 1, bEva: 1,
        attacks: [
            { name: 'Séisme',       damage: 4, eff_atk: 0, eff_def: 0, eff_eva: 0 },
            { name: 'Coup de Pied', damage: 2, eff_atk: 0, eff_def: 0, eff_eva: 0 }
        ]
    }
];

const SHOP_ITEMS = [
    { name: 'Potion',       key: 'potion',      buy: 100, sell: 50,  desc: '+5 PV' },
    { name: 'Super Potion', key: 'superPotion',  buy: 300, sell: 150, desc: '+10 PV' },
    { name: 'Bonbon Rare',  key: 'rareCandy',   buy: 700, sell: 350, desc: '+1 Niveau' }
];

// ============================================================
// ÉTAT DU JEU
// ============================================================

let player     = null;
let wildPoke   = null;
let pendingCb  = null;
let outputEl, inputEl;

// ============================================================
// UTILITAIRES D'AFFICHAGE
// ============================================================

function c(text, col)  { return `<span style="color:${col}">${text}</span>`; }
function b(text)       { return `<span style="font-weight:700">${text}</span>`; }
function tc(type)      { return TYPE_COLORS[type] || '#ABB2BF'; }

function print(html) {
    const div = document.createElement('div');
    div.className = 'sm-line';
    div.innerHTML = html;
    outputEl.appendChild(div);
    outputEl.scrollTop = outputEl.scrollHeight;
}
function blank()  { print('&nbsp;'); }
function sep()    { print(c('─'.repeat(46), '#2d3748')); }

function hpBar(cur, max, w) {
    w = w || 10;
    const f = Math.max(0, Math.round((cur / max) * w));
    const e = w - f;
    const col = f > w * 0.5 ? '#4EC9B0' : f > w * 0.25 ? '#E5C07B' : '#FF6B6B';
    return '[' + c('█'.repeat(f), col) + c('░'.repeat(e), '#2d3748') + ']';
}

function printPoke(poke, label) {
    const col = tc(poke.type);
    print(
        b(label ? label + ' ' : '') +
        c(poke.name, col) +
        c(' [' + poke.type + ']', col) +
        ' Niv.' + poke.level +
        '  PV: ' + hpBar(poke.hp, poke.maxHp) +
        ' ' + poke.hp + '/' + poke.maxHp
    );
}

// ============================================================
// MÉCANIQUES
// ============================================================

function expNeeded(level) {
    return 500 + (level - 1) * 1000;
}

function levelUp(poke) {
    poke.level++;
    poke.attack   = Math.max(1, Math.floor(poke.attack   * 1.3));
    poke.defense  = Math.max(1, Math.floor(poke.defense  * 1.3));
    poke.speed    = Math.max(1, Math.floor(poke.speed    * 1.3));
    poke.accuracy = Math.max(1, Math.floor(poke.accuracy * 1.3));
    poke.evasion  = Math.max(1, Math.floor(poke.evasion  * 1.3));
    poke.maxHp    = Math.floor(poke.maxHp * 1.3);
    poke.hp       = poke.maxHp;
    poke.exp      = 0;
}

function calcDmg(atk, def, move) {
    let d = Math.floor((atk.attack * move.damage) / def.defense);
    if (Math.random() < 0.5) d++;
    return Math.max(0, d);
}

function generateWild(playerLevel) {
    const tpl  = deepClone(WILD_TEMPLATES[Math.floor(Math.random() * WILD_TEMPLATES.length)]);
    const lvl  = Math.max(1, playerLevel + Math.floor(Math.random() * 3) - 1);
    const mult = Math.pow(1.3, lvl - 1);
    return {
        name:     tpl.name, type: tpl.type,
        hp:       Math.max(1, Math.floor(tpl.bHp  * mult)),
        maxHp:    Math.max(1, Math.floor(tpl.bHp  * mult)),
        attack:   Math.max(1, Math.floor(tpl.bAtk * mult)),
        defense:  Math.max(1, Math.floor(tpl.bDef * mult)),
        speed:    Math.max(1, Math.floor(tpl.bSpd * mult)),
        accuracy: Math.max(1, Math.floor(tpl.bAcc * mult)),
        evasion:  Math.max(1, Math.floor(tpl.bEva * mult)),
        level: lvl, exp: 0,
        attacks: deepClone(tpl.attacks)
    };
}

function activePoke() { return player.pokemons[player.activePokemonIndex]; }

// ============================================================
// SAUVEGARDE (localStorage)
// ============================================================

function save() {
    localStorage.setItem('supemon_v1', JSON.stringify(player));
    print(c('✔ Partie sauvegardée.', '#4EC9B0'));
}

function hasSave()  { return !!localStorage.getItem('supemon_v1'); }
function getSave()  { return JSON.parse(localStorage.getItem('supemon_v1')); }

// ============================================================
// SYSTÈME D'ENTRÉE
// ============================================================

function waitInput(cb) {
    pendingCb = cb;
    inputEl.disabled = false;
    inputEl.focus();
}

function handleInput(raw) {
    const v = raw.trim();
    if (!pendingCb) return;
    const cb = pendingCb;
    pendingCb = null;
    inputEl.disabled = true;
    print(c('> ', '#6366F1') + v);
    cb(v);
}

// ============================================================
// ÉCRAN TITRE
// ============================================================

function showTitle() {
    blank();
    print(c(' ____  _   _ ____  _____ __  __  ___  _   _', '#6366F1'));
    print(c('/ ___|| | | |  _ \\| ____|  \\/  |/ _ \\| \\ | |', '#6366F1'));
    print(c('\\___ \\| | | | |_) |  _| | |\\/| | | | |  \\| |', '#8B5CF6'));
    print(c(' ___) | |_| |  __/| |___| |  | | |_| | |\\  |', '#8B5CF6'));
    print(c('|____/ \\___/|_|   |_____|_|  |_|\\___/|_| \\_|', '#A78BFA'));
    blank();
    print(c('  Jeu Pokémon en ligne de commande — Baptiste Nuytten', '#4B5563'));
    blank();
    sep();

    if (hasSave()) {
        const sv = getSave();
        print('  ' + b('1.') + ' Nouvelle partie');
        print('  ' + b('2.') + ' Continuer — ' + c(sv.name, '#6366F1') +
              ' (' + sv.pokemons.length + ' Supemon' + (sv.pokemons.length > 1 ? 's' : '') + ')');
        blank();
        waitInput(v => {
            if (v === '2') {
                player = getSave();
                blank();
                print(c('Bienvenue à nouveau, ' + player.name + ' !', '#6366F1'));
                showMainMenu();
            } else {
                showNewGame();
            }
        });
    } else {
        print('  ' + b('Entrée') + ' — Commencer l\'aventure');
        blank();
        waitInput(() => showNewGame());
    }
}

// ============================================================
// NOUVELLE PARTIE
// ============================================================

function showNewGame() {
    blank();
    print(b('Entrez votre nom de dresseur :'));
    waitInput(name => {
        if (!name) { showNewGame(); return; }
        const admin = name.toUpperCase() === 'ADMIN';
        player = {
            name,
            supcoins:     admin ? 999999 : 0,
            potion:       admin ? 99 : 0,
            superPotion:  admin ? 99 : 0,
            rareCandy:    admin ? 99 : 0,
            pokemons:     [],
            activePokemonIndex: 0
        };
        if (admin) print(c('Mode ADMIN activé ! Ressources illimitées.', '#FFD700'));
        showStarterSelect();
    });
}

function showStarterSelect() {
    blank();
    print(b('Choisissez votre Supemon de départ :'));
    blank();
    STARTERS_DATA.forEach((s, i) => {
        const col = tc(s.type);
        print('  ' + b((i + 1) + '.') + ' ' + c(s.name, col) + ' ' + c('[' + s.type + ']', col) +
              '  PV:' + s.hp + '  Atk:' + s.attack + '  Déf:' + s.defense + '  Vit:' + s.speed);
        s.attacks.forEach(a => {
            const d = a.damage > 0 ? ' (' + a.damage + ' dégâts)' : ' (effet stat)';
            print('        ' + c('• ' + a.name, '#4B5563') + c(d, '#374151'));
        });
        blank();
    });

    waitInput(v => {
        const idx = parseInt(v) - 1;
        if (idx < 0 || idx >= STARTERS_DATA.length || isNaN(idx)) {
            print(c('Entrez 1, 2 ou 3.', '#FF6B6B'));
            showStarterSelect();
            return;
        }
        const starter = deepClone(STARTERS_DATA[idx]);
        player.pokemons.push(starter);
        blank();
        print(c('Vous avez choisi ' + starter.name + ' ! Bonne aventure !', tc(starter.type)));
        save();
        showMainMenu();
    });
}

// ============================================================
// MENU PRINCIPAL
// ============================================================

function showMainMenu() {
    blank();
    sep();
    print(b(c('  ' + player.name, '#6366F1')) +
          '  ' + c(player.supcoins + ' Supcoins ◈', '#FFD700') +
          '  ' + c(activePoke().name, tc(activePoke().type)) + ' Niv.' + activePoke().level);
    sep();
    blank();
    print('  ' + b('1.') + ' Explorer la nature');
    print('  ' + b('2.') + ' Boutique');
    print('  ' + b('3.') + ' Inventaire');
    print('  ' + b('4.') + ' Mes Supemons');
    print('  ' + b('5.') + ' Centre Supemon ' + c('(soins gratuits)', '#4B5563'));
    print('  ' + b('6.') + ' Sauvegarder et quitter');
    blank();

    waitInput(v => {
        switch (v) {
            case '1': exploreNature();    break;
            case '2': showShop();         break;
            case '3': showInventory();    break;
            case '4': showPokemonList();  break;
            case '5': healCenter();       break;
            case '6': save(); showTitle(); break;
            default:
                print(c('Option invalide.', '#FF6B6B'));
                showMainMenu();
        }
    });
}

// ============================================================
// EXPLORATION / COMBAT
// ============================================================

function exploreNature() {
    blank();
    print(c('Vous explorez la nature en herbe haute...', '#6CBF59'));
    blank();
    wildPoke = generateWild(activePoke().level);
    print(c('Un ' + wildPoke.name + ' sauvage (Niv.' + wildPoke.level + ') apparaît !',
            tc(wildPoke.type)));
    blank();
    showBattleMenu();
}

function showBattleMenu() {
    sep();
    printPoke(wildPoke,    '  Ennemi :');
    printPoke(activePoke(), '  Votre  :');
    sep();
    blank();
    print('  ' + b('1.') + ' Attaquer');
    print('  ' + b('2.') + ' Changer de Supemon');
    print('  ' + b('3.') + ' Utiliser un objet');
    print('  ' + b('4.') + ' Capturer');
    print('  ' + b('5.') + ' Fuir');
    blank();

    waitInput(v => {
        switch (v) {
            case '1': showAttackMenu();     break;
            case '2': showSwitchMenu(true); break;
            case '3': showBattleItemMenu(); break;
            case '4': tryCatch();           break;
            case '5': tryFlee();            break;
            default:
                print(c('Option invalide.', '#FF6B6B'));
                showBattleMenu();
        }
    });
}

// --- Attaques ---

function showAttackMenu() {
    blank();
    print(b('Choisissez une attaque :'));
    blank();
    const poke = activePoke();
    poke.attacks.forEach((a, i) => {
        let info = '';
        if (a.damage    > 0) info += ' ' + c('(' + a.damage + ' dégâts)', '#9CA3AF');
        if (a.eff_atk !== 0) info += c(' +' + a.eff_atk + ' Atk', '#E5C07B');
        if (a.eff_def !== 0) info += c(' +' + a.eff_def + ' Déf', '#4EC9B0');
        if (a.eff_eva !== 0) info += c(' +' + a.eff_eva + ' Esq', '#6CBF59');
        print('  ' + b((i + 1) + '.') + ' ' + a.name + info);
    });
    print('  ' + b('0.') + ' Retour');
    blank();

    waitInput(v => {
        if (v === '0') { showBattleMenu(); return; }
        const idx = parseInt(v) - 1;
        if (isNaN(idx) || idx < 0 || idx >= poke.attacks.length) {
            print(c('Choix invalide.', '#FF6B6B'));
            showAttackMenu();
            return;
        }
        applyPlayerAttack(poke.attacks[idx]);
    });
}

function applyPlayerAttack(move) {
    const poke = activePoke();

    // Effets stat sur le joueur
    if (move.eff_atk) poke.attack  = Math.max(1, poke.attack  + move.eff_atk);
    if (move.eff_def) poke.defense = Math.max(1, poke.defense + move.eff_def);
    if (move.eff_eva) poke.evasion = Math.max(1, poke.evasion + move.eff_eva);

    if (move.damage > 0) {
        const hit = poke.accuracy / (poke.accuracy + wildPoke.evasion) + 0.1;
        if (Math.random() < hit) {
            const dmg = calcDmg(poke, wildPoke, move);
            wildPoke.hp = Math.max(0, wildPoke.hp - dmg);
            print(c('  ' + poke.name + ' utilise ' + move.name + ' — ' + dmg + ' dégâts !', '#E5C07B'));
        } else {
            print(c('  ' + poke.name + ' rate son attaque !', '#9CA3AF'));
        }
    } else {
        print(c('  ' + poke.name + ' utilise ' + move.name + ' !', '#9CA3AF'));
    }

    if (wildPoke.hp <= 0) { battleVictory(); return; }
    applyWildAttack();
}

function applyWildAttack() {
    const move = wildPoke.attacks[Math.floor(Math.random() * wildPoke.attacks.length)];
    const poke = activePoke();

    if (move.damage > 0) {
        const hit = wildPoke.accuracy / (wildPoke.accuracy + poke.evasion) + 0.1;
        if (Math.random() < hit) {
            const dmg = calcDmg(wildPoke, poke, move);
            poke.hp = Math.max(0, poke.hp - dmg);
            print(c('  ' + wildPoke.name + ' utilise ' + move.name + ' — ' + dmg + ' dégâts !', '#FF6B6B'));
        } else {
            print(c('  ' + wildPoke.name + ' rate son attaque !', '#9CA3AF'));
        }
    } else {
        if (move.eff_atk) wildPoke.attack  = Math.max(1, wildPoke.attack  + move.eff_atk);
        if (move.eff_def) wildPoke.defense = Math.max(1, wildPoke.defense + move.eff_def);
        if (move.eff_eva) wildPoke.evasion = Math.max(1, wildPoke.evasion + move.eff_eva);
        print(c('  ' + wildPoke.name + ' utilise ' + move.name + ' !', '#9CA3AF'));
    }

    if (poke.hp <= 0) {
        print(c('  ' + poke.name + ' est K.O. !', '#FF6B6B'));
        const next = player.pokemons.findIndex((p, i) => i !== player.activePokemonIndex && p.hp > 0);
        if (next === -1) { battleDefeat(); return; }
        player.activePokemonIndex = next;
        print(c('  ' + activePoke().name + ' entre en combat !', tc(activePoke().type)));
    }
    showBattleMenu();
}

function battleVictory() {
    const expGain   = 100 + Math.floor(Math.random() * 400) + wildPoke.level * 100;
    const coinsGain = 100 + Math.floor(Math.random() * 400) + wildPoke.level * 50;
    blank();
    print(c('  Victoire ! ' + wildPoke.name + ' est vaincu !', '#4EC9B0'));
    print(c('  +' + expGain + ' EXP   +' + coinsGain + ' Supcoins', '#FFD700'));
    player.supcoins += coinsGain;
    const poke = activePoke();
    poke.exp = (poke.exp || 0) + expGain;
    while (poke.exp >= expNeeded(poke.level)) {
        poke.exp -= expNeeded(poke.level);
        levelUp(poke);
        print(c('  ' + poke.name + ' passe au niveau ' + poke.level + ' !', '#FFD700'));
        print('  PV Max:' + poke.maxHp + '  Atk:' + poke.attack + '  Déf:' + poke.defense);
    }
    wildPoke = null;
    save();
    blank();
    print(c('  (Appuyez sur Entrée pour continuer)', '#374151'));
    waitInput(() => showMainMenu());
}

function battleDefeat() {
    blank();
    print(c('  Tous vos Supemons sont K.O. !', '#FF6B6B'));
    print(c('  Vous êtes soigné au Centre Supemon...', '#9CA3AF'));
    player.pokemons.forEach(p => { p.hp = Math.max(1, Math.floor(p.maxHp / 2)); });
    player.activePokemonIndex = 0;
    wildPoke = null;
    blank();
    print(c('  (Appuyez sur Entrée pour continuer)', '#374151'));
    waitInput(() => showMainMenu());
}

// --- Changer ---

function showSwitchMenu(inBattle) {
    if (player.pokemons.length <= 1) {
        print(c("  Vous n'avez qu'un seul Supemon !", '#FF6B6B'));
        if (inBattle) showBattleMenu(); else showMainMenu();
        return;
    }
    blank();
    print(b('Choisissez un Supemon :'));
    blank();
    player.pokemons.forEach((p, i) => {
        const cur = i === player.activePokemonIndex ? c(' (actif)', '#4B5563') : '';
        const ko  = p.hp <= 0 ? c(' K.O.', '#FF6B6B') : '';
        print('  ' + b((i + 1) + '.') + ' ' + c(p.name, tc(p.type)) +
              ' Niv.' + p.level + '  PV:' + p.hp + '/' + p.maxHp + ko + cur);
    });
    print('  ' + b('0.') + ' Retour');
    blank();

    waitInput(v => {
        if (v === '0') { if (inBattle) showBattleMenu(); else showPokemonList(); return; }
        const idx = parseInt(v) - 1;
        if (isNaN(idx) || idx < 0 || idx >= player.pokemons.length) {
            print(c('Choix invalide.', '#FF6B6B')); showSwitchMenu(inBattle); return;
        }
        if (idx === player.activePokemonIndex) {
            print(c('Ce Supemon est déjà actif !', '#FF6B6B')); showSwitchMenu(inBattle); return;
        }
        if (player.pokemons[idx].hp <= 0) {
            print(c('Ce Supemon est K.O. !', '#FF6B6B')); showSwitchMenu(inBattle); return;
        }
        player.activePokemonIndex = idx;
        print(c('  ' + activePoke().name + ' est maintenant actif !', tc(activePoke().type)));
        if (inBattle) { applyWildAttack(); } else { showPokemonList(); }
    });
}

// --- Objets en combat ---

function showBattleItemMenu() {
    blank();
    print(b('Utiliser un objet :'));
    blank();
    print('  ' + b('1.') + ' Potion (x' + player.potion + ') ' + c('+5 PV', '#4EC9B0'));
    print('  ' + b('2.') + ' Super Potion (x' + player.superPotion + ') ' + c('+10 PV', '#4EC9B0'));
    print('  ' + b('0.') + ' Retour');
    blank();

    waitInput(v => {
        if (v === '0') { showBattleMenu(); return; }
        const poke = activePoke();
        if (v === '1') {
            if (!player.potion) { print(c('Pas de Potion !', '#FF6B6B')); showBattleMenu(); return; }
            player.potion--;
            poke.hp = Math.min(poke.maxHp, poke.hp + 5);
            print(c('  ' + poke.name + ' récupère 5 PV !', '#4EC9B0'));
        } else if (v === '2') {
            if (!player.superPotion) { print(c('Pas de Super Potion !', '#FF6B6B')); showBattleMenu(); return; }
            player.superPotion--;
            poke.hp = Math.min(poke.maxHp, poke.hp + 10);
            print(c('  ' + poke.name + ' récupère 10 PV !', '#4EC9B0'));
        } else {
            print(c('Choix invalide.', '#FF6B6B')); showBattleItemMenu(); return;
        }
        applyWildAttack();
    });
}

// --- Capture ---

function tryCatch() {
    const ratio = (wildPoke.maxHp - wildPoke.hp) / wildPoke.maxHp;
    const chance = ratio - 0.5;
    if (chance <= 0) {
        print(c('  Le Supemon est en pleine forme, impossible de le capturer !', '#FF6B6B'));
        applyWildAttack();
        return;
    }
    if (player.pokemons.length >= 10) {
        print(c('  Équipe pleine (10 Supemons max) !', '#FF6B6B'));
        applyWildAttack();
        return;
    }
    if (Math.random() < chance) {
        const captured = deepClone(wildPoke);
        captured.exp = 0;
        player.pokemons.push(captured);
        wildPoke = null;
        blank();
        print(c('  ' + captured.name + ' a été capturé !', '#4EC9B0'));
        save();
        blank();
        print(c('  (Appuyez sur Entrée pour continuer)', '#374151'));
        waitInput(() => showMainMenu());
    } else {
        print(c('  Raté ! Le Supemon s\'est échappé !', '#FF6B6B'));
        applyWildAttack();
    }
}

// --- Fuite ---

function tryFlee() {
    const poke = activePoke();
    const chance = poke.speed / (poke.speed + wildPoke.speed);
    if (Math.random() < chance) {
        wildPoke = null;
        blank();
        print(c('  Vous avez réussi à fuir !', '#9CA3AF'));
        blank();
        print(c('  (Appuyez sur Entrée pour continuer)', '#374151'));
        waitInput(() => showMainMenu());
    } else {
        print(c('  Impossible de fuir !', '#FF6B6B'));
        applyWildAttack();
    }
}

// ============================================================
// BOUTIQUE
// ============================================================

function showShop() {
    blank();
    sep();
    print(b('  BOUTIQUE') + '  ' + c(player.supcoins + ' Supcoins ◈', '#FFD700'));
    sep();
    blank();
    print('  ' + b('1.') + ' Acheter');
    print('  ' + b('2.') + ' Vendre');
    print('  ' + b('0.') + ' Retour');
    blank();

    waitInput(v => {
        if (v === '0') { showMainMenu(); return; }
        if (v === '1') showShopBuy();
        else if (v === '2') showShopSell();
        else { print(c('Option invalide.', '#FF6B6B')); showShop(); }
    });
}

function showShopBuy() {
    blank();
    print(b('Acheter :'));
    blank();
    SHOP_ITEMS.forEach((item, i) => {
        print('  ' + b((i + 1) + '.') + ' ' + item.name +
              c(' ' + item.desc, '#9CA3AF') +
              ' — ' + c(item.buy + ' Supcoins', '#FFD700'));
    });
    print('  ' + b('0.') + ' Retour');
    blank();

    waitInput(v => {
        if (v === '0') { showShop(); return; }
        const idx = parseInt(v) - 1;
        if (isNaN(idx) || idx < 0 || idx >= SHOP_ITEMS.length) {
            print(c('Choix invalide.', '#FF6B6B')); showShopBuy(); return;
        }
        const item = SHOP_ITEMS[idx];
        if (player.supcoins < item.buy) {
            print(c('  Pas assez de Supcoins ! (' + player.supcoins + '/' + item.buy + ')', '#FF6B6B'));
        } else {
            player.supcoins -= item.buy;
            player[item.key]++;
            print(c('  ' + item.name + ' acheté ! ' + player.supcoins + ' Supcoins restants.', '#4EC9B0'));
        }
        showShop();
    });
}

function showShopSell() {
    blank();
    print(b('Vendre :'));
    blank();
    SHOP_ITEMS.forEach((item, i) => {
        print('  ' + b((i + 1) + '.') + ' ' + item.name +
              c(' (x' + player[item.key] + ')', '#9CA3AF') +
              ' — ' + c(item.sell + ' Supcoins', '#FFD700'));
    });
    print('  ' + b('0.') + ' Retour');
    blank();

    waitInput(v => {
        if (v === '0') { showShop(); return; }
        const idx = parseInt(v) - 1;
        if (isNaN(idx) || idx < 0 || idx >= SHOP_ITEMS.length) {
            print(c('Choix invalide.', '#FF6B6B')); showShopSell(); return;
        }
        const item = SHOP_ITEMS[idx];
        if (!player[item.key]) {
            print(c("  Vous n'avez pas de " + item.name + ' !', '#FF6B6B'));
        } else {
            player[item.key]--;
            player.supcoins += item.sell;
            print(c('  ' + item.name + ' vendu ! ' + player.supcoins + ' Supcoins.', '#4EC9B0'));
        }
        showShop();
    });
}

// ============================================================
// INVENTAIRE
// ============================================================

function showInventory() {
    blank();
    sep();
    print(b('  INVENTAIRE'));
    sep();
    blank();
    print('  Supcoins     : ' + c(player.supcoins + ' ◈', '#FFD700'));
    print('  Potion       : x' + player.potion + c('  +5 PV', '#4B5563'));
    print('  Super Potion : x' + player.superPotion + c('  +10 PV', '#4B5563'));
    print('  Bonbon Rare  : x' + player.rareCandy + c('  +1 Niveau', '#4B5563'));
    blank();
    if (player.rareCandy > 0) {
        print('  ' + b('1.') + ' Utiliser un Bonbon Rare sur ' + c(activePoke().name, tc(activePoke().type)));
    }
    print('  ' + b('0.') + ' Retour');
    blank();

    waitInput(v => {
        if (v === '0') { showMainMenu(); return; }
        if (v === '1' && player.rareCandy > 0) {
            player.rareCandy--;
            const poke = activePoke();
            levelUp(poke);
            print(c('  ' + poke.name + ' passe au niveau ' + poke.level + ' !', '#FFD700'));
            print('  PV Max:' + poke.maxHp + '  Atk:' + poke.attack + '  Déf:' + poke.defense);
            save();
            showInventory();
        } else {
            print(c('Option invalide.', '#FF6B6B'));
            showInventory();
        }
    });
}

// ============================================================
// LISTE SUPEMONS
// ============================================================

function showPokemonList() {
    blank();
    sep();
    print(b('  MES SUPEMONS  ') + c('(' + player.pokemons.length + '/10)', '#4B5563'));
    sep();
    blank();
    player.pokemons.forEach((p, i) => {
        const cur = i === player.activePokemonIndex;
        const ko  = p.hp <= 0 ? c(' K.O.', '#FF6B6B') : '';
        print(b('  ' + (cur ? '▶ ' : '  ') + (i + 1) + '. ') + c(p.name, tc(p.type)) +
              c(' [' + p.type + ']', tc(p.type)) + ko);
        print('      Niv.' + p.level + '  EXP: ' + (p.exp || 0) + '/' + expNeeded(p.level));
        print('      PV: ' + hpBar(p.hp, p.maxHp, 8) + ' ' + p.hp + '/' + p.maxHp);
        print('      Atk:' + p.attack + ' Déf:' + p.defense + ' Vit:' + p.speed);
        print('      Attaques: ' + p.attacks.map(a => a.name).join(', '));
        blank();
    });
    if (player.pokemons.length > 1) {
        print(b('Changer de Supemon actif ? (numéro ou 0)'));
    } else {
        print(b('0') + ' pour retour');
    }
    blank();

    waitInput(v => {
        if (v === '0') { showMainMenu(); return; }
        const idx = parseInt(v) - 1;
        if (!isNaN(idx) && idx >= 0 && idx < player.pokemons.length) {
            if (player.pokemons[idx].hp <= 0) {
                print(c('Ce Supemon est K.O. !', '#FF6B6B'));
            } else {
                player.activePokemonIndex = idx;
                print(c(activePoke().name + ' est maintenant votre Supemon actif.', tc(activePoke().type)));
            }
        }
        showPokemonList();
    });
}

// ============================================================
// CENTRE SUPEMON
// ============================================================

function healCenter() {
    blank();
    print(c('  ╔═══════════════════════════╗', '#4EC9B0'));
    print(c('  ║   CENTRE SUPEMON  ✚       ║', '#4EC9B0'));
    print(c('  ╚═══════════════════════════╝', '#4EC9B0'));
    blank();
    print('  Tous vos Supemons seront soignés complètement.');
    blank();
    print('  ' + b('1.') + ' Soigner');
    print('  ' + b('0.') + ' Retour');
    blank();

    waitInput(v => {
        if (v === '0') { showMainMenu(); return; }
        if (v === '1') {
            player.pokemons.forEach(p => { p.hp = p.maxHp; });
            print(c('  Tous vos Supemons ont été soignés !', '#4EC9B0'));
            save();
        }
        showMainMenu();
    });
}

// ============================================================
// INITIALISATION
// ============================================================

function init() {
    outputEl = document.getElementById('supemon-output');
    inputEl  = document.getElementById('supemon-input');
    if (!outputEl || !inputEl) return;

    inputEl.disabled = true;
    inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            const val = inputEl.value;
            inputEl.value = '';
            handleInput(val);
        }
    });

    // Clic sur le terminal → focus input
    document.getElementById('supemon-terminal').addEventListener('click', function () {
        if (!inputEl.disabled) inputEl.focus();
    });

    showTitle();
}

document.addEventListener('DOMContentLoaded', init);

})();
