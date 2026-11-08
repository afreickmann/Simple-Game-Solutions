import DOMPurify from './vendor/purify.es.mjs';
import { parseSolution, renderFull, revealed, applyAction, progressToStore, progressFromStore, chapterHash } from './model.js';
import { languageOf, gameTitle, searchGames, searchSteps, searchGamesFuzzy, searchStepsFuzzy } from './search.js';
import { createStore } from './store.js';

const T = {
    de: {
        subLast: 'Das ist der letzte Abschnitt.', listError: 'Die Spieleliste konnte nicht geladen werden. Prüf deine Internetverbindung.', readerLabel: 'Lösung', menu: 'Spiele', didYouMean: 'Meintest du:', pickStartShort: 'Ganz von vorn', pick10Next2: '10 Kapitel weiter', pick10Prev2: '10 Kapitel zurück', hitKeysEnter: 'Enter für „Genau das!“', moreAboutGame2: 'Mehr zu diesem Spiel', nextIsText: 'Du stehst direkt davor.', takeNext: 'Nächsten Schritt aufdecken', sameChTitle: 'Weiter hinten in diesem Kapitel', sameChText: 'Dieser Schritt liegt noch vor dir. Zeig ihn nur, wenn du wirklich nicht weiterkommst.', hitKeysMasked: '→ für die nächste Fundstelle', hitKeys: '→ für die nächste Fundstelle, Enter für „Genau das!“', nextIsYours: 'Das ist dein nächster Schritt', hereMark: r => `Deine Stelle: Schritt ${r}`, pick10Next: '10 weiter', pick10Prev: '10 zurück', closeSearch: 'Schließen', changeTitle: 'Anderes Kapitel wählen', markDone: 'Als durchgespielt markieren', markedDone: 'Als durchgespielt markiert.', allGamesShort: 'Alle Spiele', resumeAt: r => `Weiter bei Schritt ${r}`, earlierTitle: 'Diese Fundstelle liegt vor deiner Stelle', earlierText: 'Sie steht in einem Kapitel, das du schon hinter dir hast.', nextHitTitle: ch => `Nächste Fundstelle in ${ch}`, nextHitText: 'Der Schritt ist noch verdeckt. Zeig ihn nur, wenn das Kapitel zu deiner Stelle passt.', nextHitShow: 'Schritt zeigen', laterHead: 'Weiter hinten als deine Stelle', backToSpot: (c, r) => `Zurück zu Kapitel ${c}, Schritt ${r}`, landed: 'Hier bist du. Deine Stelle ist gespeichert.', laterTitle: 'Diese Fundstelle liegt weiter hinten als deine Stelle', laterText: 'Sie steht in einem Kapitel, das du noch nicht gelesen hast. Wenn du sie ansiehst, erfährst du vielleicht mehr, als du willst.', laterShow: 'Trotzdem zeigen', noHitHead: q => `Nichts gefunden: „${q}“`, showAll: n => `Alle ${n} Spiele anzeigen`, progressLabel: 'Fortschritt auf ein anderes Gerät mitnehmen', exportShort: 'Datei speichern', importShort: 'Datei öffnen', next3Done: '3 Schritte aufgedeckt.', pathEmpty: 'Hier erscheinen die Kapitel bis zu deiner Stelle.', otherChapter: 'Anderes Kapitel wählen', entryFull: 'Lieber die ganze Lösung lesen', classicView: 'Klassische Ansicht', pathTabSearch: 'Wort suchen', pathTabChapters: 'Kapitel durchgehen', pathTabsLabel: 'Wie findest du deine Stelle?', noHitsRetry: 'Anderes Wort suchen', sectionWord: 'Abschnitt', discussions: 'Diskussionen', reportBug: 'Fehler melden', moreAboutGame: 'Mehr zu diesem Spiel', findLabel: 'In dieser Lösung suchen', otherGame: 'Anderes Spiel', moreTools: 'Mehr', restLong: 'Rest des Kapitels zeigen', restHelp: 'Deckt alle übrigen Schritte auf. Lässt sich rückgängig machen.', pickLead: 'Such nach einem Wort oder blättere durch die Kapitel. Was danach kommt, bleibt verdeckt.', pathSearchTitle: 'Ich weiß, woran ich hänge', pathSearchText: 'Gib ein Wort ein, das an deiner Stelle vorkommt, etwa einen Gegenstand oder Ort. Du siehst die Fundstellen einzeln.', pathSearchGo: 'Suchen', pathSearchLang: l => `Die Lösung ist auf ${l}. Such nach dem ${l === 'Englisch' ? 'englischen' : 'deutschen'} Wort.`, pathChapterTitle: 'Ich weiß nur ungefähr, wo ich bin', pathChapterText: 'Blättere durch die Kapitelnamen, bis du deine Stelle erkennst.', continueBtn: 'Weiter', kbdHint: 'Suchen mit /', skip: 'Zum Inhalt springen', langDE: 'Deutsch', langEN: 'Englisch', pickTitle: 'Wo steckst du fest?', subTitle: n => `Wo genau in Kapitel ${n}?`, continueAt: (n, name) => `Kapitel ${n}: ${name}`, historyHead: 'Bis zu deiner Stelle', hitHead: q => `Gefunden: „${q}“`, hitPos: n => `Fundstelle ${n}`, findTip: 'Du weißt, woran du hängst? Such oben nach einem Wort. Du siehst nur die Fundstelle.', noHitsTip: 'Versuch ein anderes Wort oder blättere durch die Kapitel.', options: 'Optionen', heroGo: 'Spiel suchen', yourPath: 'Deine Kapitel', subIntro: 'Blättere durch die Abschnitte, bis du deine Stelle erkennst.', subStart: 'Am Kapitelanfang beginnen', jumpNow: (c, n) => `Du liest jetzt ab Kapitel ${c}, Schritt ${n}.`, jumpKeep: 'Hier bleiben', jumpUndo: (c, n) => `Zurück zu Kapitel ${c}, Schritt ${n}`, historyHint: 'Wähl einen Schritt oder ein Kapitel, um dort weiterzulesen.', jumpHere: 'Hier weiterlesen', history: 'Nachlesen', historyTitle: 'Alles vor deiner Stelle nachlesen', historyBack: 'Zurück zu deiner Stelle', prevChapter: 'Vorheriges Kapitel', prevChapterTitle: 'Zum vorherigen Kapitel', backToList: 'Alle Spiele', gameMenu: 'Mehr zu diesem Spiel', about: 'Über diese Lösung', moreActions: 'Weitere Optionen', stepOf: 'Schritt', games: 'Spiele', close: 'Schließen', loading: 'Wird geladen …', chapters: 'Kapitel', settings: 'Mehr',
        modeDatabase: 'Ganze Lösung', searchBtn: 'Anderes Spiel suchen', findBtn: 'Wort suchen', keyHint: 'Leertaste oder → für weiter, ← für zurück', modeGuided: 'Ich stecke fest', modeLabel: 'Wie möchtest du lesen?', startPage: 'Startseite',
        export: 'Fortschritt exportieren', import: 'Fortschritt importieren', howtoAgain: 'So geht’s', fontSize: 'Schriftgröße',
        searchGames: 'Spiel suchen', searchOtherGame: 'Anderes Spiel suchen', searchInGame: 'Wort suchen', searchStuck: 'Suchwort, z. B. Schlüssel', searchStuckOther: l => 'Englisches Wort, z. B. key', noHitsLang: l => ` Die Lösung ist auf ${l}.`, savedNote: 'Deine Stelle wird automatisch gespeichert.', readyFor: 'Du suchst nach', noHitsHere: 'Dieses Wort kommt in der Lösung nicht vor.',
        allLangs: 'Alle Sprachen', langFilter: 'Sprache der Lösung', scopeLabel: 'Filter',
        scopeAll: 'Alle', scopeFavorites: 'Favoriten', scopeMine: 'Meine Spiele',
        favorite: 'Favorit', statusLabel: 'Spielstatus', statusNone: 'Kein Status', statusPlaying: 'Ich spiele gerade', statusDone: 'Durchgespielt',
        findPrev: 'Vorherige Fundstelle', findNext: 'Nächste Fundstelle',
        gamesCount: n => `${n} ${n === 1 ? 'Spiel' : 'Spiele'}`, noGames: 'Kein Spiel gefunden. Prüf die Schreibweise oder blättere die Liste von A bis Z durch.', moreGames: n => `Nur die ersten ${n} werden angezeigt. Grenz die Suche weiter ein.`,
        welcome: (n, w) => `${n} Lösungen für Adventure-Spiele, insgesamt ${w} Wörter.`,
        homeTitle: 'Wie möchtest du lesen?', goStuck: 'Ich stecke fest', goStuckText: 'Schritt für Schritt, ohne Spoiler: Du siehst immer nur den nächsten Schritt.', goFull: 'Ganze Lösung', goFullText: 'Alle Schritte auf einmal, zum Lesen und Durchsuchen.', heroTitle: 'Bei welchem Spiel steckst du fest?', heroSub: 'Such dein Spiel und deine Stelle darin. Du siehst nur den nächsten Schritt, der Rest bleibt verdeckt.', scheme: 'Erscheinungsbild', schemeAuto: 'Automatisch', schemeLight: 'Hell', schemeDark: 'Dunkel', pickGameHint: 'Gib oben den Namen deines Spiels ein.', tabModified: 'Neu und aktualisiert', tabUsed: 'Weitermachen', tabMine: 'Meine Spiele', allGames: 'Alle Spiele von A bis Z',
        empty: 'Noch nichts hier.', newTag: 'NEU', markAllRead: 'Alle als gelesen markieren',
        loadError: 'Die Lösung konnte nicht geladen werden. Prüf deine Internetverbindung.', retry: 'Erneut versuchen',
        langName: { DE: 'Deutsch', EN: 'Englisch' },
        translateSummary: 'Übersetzen? So geht’s',
        translateHint: from => `Diese Lösung ist auf ${from}. Dein Browser kann sie übersetzen: Wähl im Browser-Menü „Seite übersetzen“ (Chrome, Edge, Safari). Die Übersetzung ist maschinell.`,
        pickIntro: 'Blättere durch die Kapitelnamen, bis du deine Stelle erkennst.', pickHere: 'Hier bin ich', pickNext: 'Nächstes Kapitel', pickPrev: 'Vorheriges Kapitel', subNext: 'Nächster Abschnitt', subPrev: 'Vorheriger Abschnitt', pickStart: 'Ganz von vorn anfangen', pickLast: 'Das ist das letzte Kapitel.',
        chapterWord: 'Kapitel', stepWord: 'Schritt', noSteps: 'In diesem Kapitel gibt es keine Schritte.',
        back: 'Zurück', backTitle: 'Einen Schritt zurück', next: 'Nächster Schritt', next3: '3 Schritte weiter', next3Title: '3 Schritte aufdecken', rest: 'Rest des Kapitels', restTitle: 'Rest des Kapitels aufdecken', closeChapter: 'Kapitel wechseln', closeTitle: 'Ein anderes Kapitel wählen', confirmRest: 'Alle übrigen Schritte dieses Kapitels aufdecken?', chapterDone: 'Kapitel geschafft.', nextChapter: 'Nächstes Kapitel', endOfChapter: 'Ende der Lösung. Gut gespielt!',
        confirmReveal: 'Dann siehst du auch alles, was noch kommt. Deine Stelle bleibt gespeichert.', revealTitle: 'Ganze Lösung zeigen?',
        findNone: 'Nichts gefunden', findNoneGuided: 'In den aufgedeckten Schritten nichts gefunden', findOpenChapter: 'Öffne zuerst ein Kapitel', findCount: (i, n) => `${i} von ${n}`, findGo: 'Fundstelle zeigen', findOne: 'Du siehst eine Fundstelle nach der anderen, sonst nichts.', hitNext: 'Passt nicht, weiter', hitContinue: 'Genau das!', hitEnd: 'Suche beenden', hitLast: 'Das ist die letzte Fundstelle.', hitAgain: 'Zur ersten Fundstelle', hitWord: 'Fundstelle', saved: 'gespeichert', restDone: 'Rest des Kapitels aufgedeckt.', undo: 'Rückgängig', cancel: 'Abbrechen', revealOk: 'Ganze Lösung zeigen', resetProgress: 'Fortschritt zurücksetzen', resetAsk: 'Deine gespeicherte Stelle in diesem Spiel wird gelöscht.', resetOk: 'Zurücksetzen', howto1: 'Spiel suchen', howto2: 'Deine Stelle finden', howto3: 'Nur den nächsten Schritt lesen', howtoOk: 'Verstanden', gameBtn: 'Mein Spiel', settingsLong: 'Einstellungen', modeHelpGuided: 'Schritt für Schritt, ohne Spoiler', modeHelpDb: 'Alles auf einmal, mit Spoilern', pickAfter: 'Danach siehst du nur den nächsten Schritt.', restSub: 'Deckt alle übrigen Schritte auf. Lässt sich rückgängig machen.', historySub: 'Alles vor deiner Stelle nachlesen.',
        importOk: 'Fortschritt geladen.', importErr: 'Die Datei konnte nicht geladen werden. Wähl eine Datei, die du hier gesichert hast.', storageWarn: 'Dein Browser lässt hier kein Speichern zu. Favoriten und Fortschritt gehen beim Neuladen verloren.'
    },
    en: {
        subLast: 'This is the last section.', listError: "The game list couldn't be loaded. Check your internet connection.", readerLabel: 'Walkthrough', menu: 'Games', didYouMean: 'Did you mean:', pickStartShort: 'From the start', pick10Next2: '10 chapters ahead', pick10Prev2: '10 chapters back', hitKeysEnter: 'Enter for “That is it!”', moreAboutGame2: 'More about this game', nextIsText: 'You are right in front of it.', takeNext: 'Reveal next step', sameChTitle: 'Further on in this chapter', sameChText: 'This step is still ahead of you. Only show it if you are really stuck.', hitKeysMasked: '→ for the next match', hitKeys: '→ for the next match, Enter for “That is it!”', nextIsYours: 'This is your next step', hereMark: r => `Your place: step ${r}`, pick10Next: '10 ahead', pick10Prev: '10 back', closeSearch: 'Close', changeTitle: 'Choose another chapter', markDone: 'Mark as finished', markedDone: 'Marked as finished.', allGamesShort: 'All games', resumeAt: r => `Continue at step ${r}`, earlierTitle: 'This match is before your place', earlierText: 'It is in a chapter you have already finished.', nextHitTitle: ch => `Next match in ${ch}`, nextHitText: 'The step is still hidden. Show it only if this chapter fits your place.', nextHitShow: 'Show step', laterHead: 'Further ahead than your place', backToSpot: (c, r) => `Back to chapter ${c}, step ${r}`, landed: 'You are here. Your place is saved.', laterTitle: 'This match is further ahead than your place', laterText: 'It is in a chapter you have not read yet. Looking at it may tell you more than you want.', laterShow: 'Show anyway', noHitHead: q => `Nothing found: “${q}”`, showAll: n => `Show all ${n} games`, progressLabel: 'Take your progress to another device', exportShort: 'Save file', importShort: 'Open file', next3Done: '3 steps revealed.', pathEmpty: 'The chapters up to your place appear here.', otherChapter: 'Choose another chapter', entryFull: 'Read the full walkthrough instead', classicView: 'Classic view', pathTabSearch: 'Find a word', pathTabChapters: 'Go through chapters', pathTabsLabel: 'How do you want to find your place?', noHitsRetry: 'Try another word', sectionWord: 'Section', discussions: 'Discussions', reportBug: 'Report a bug', moreAboutGame: 'More about this game', findLabel: 'Search this walkthrough', otherGame: 'Other game', moreTools: 'More', restLong: 'Show rest of chapter', restHelp: 'Reveals all remaining steps. You can undo this.', pickLead: 'Search for a word or page through the chapters. What comes after stays hidden.', pathSearchTitle: 'I know what I\'m stuck on', pathSearchText: 'Type a word from your place, like an item or a location. You see the matches one at a time.', pathSearchGo: 'Search', pathSearchLang: l => `This walkthrough is in ${l}, so search in ${l}.`, pathChapterTitle: 'I only roughly know where I am', pathChapterText: 'Page through the chapter names until you recognize your place.', continueBtn: 'Continue', kbdHint: 'Press / to search', skip: 'Skip to content', langDE: 'German', langEN: 'English', pickTitle: 'Where are you stuck?', subTitle: n => `Where exactly in chapter ${n}?`, continueAt: (n, name) => `Chapter ${n}: ${name}`, historyHead: 'Up to your place', hitHead: q => `Found: “${q}”`, hitPos: n => `Match ${n}`, findTip: 'Know what you\'re stuck on? Search for a word above. You only see the match.', noHitsTip: 'Try another word or page through the chapters.', options: 'Options', heroGo: 'Find a game', yourPath: 'Your chapters', subIntro: 'Page through the sections until you recognize your place.', subStart: 'Start at the beginning of the chapter', jumpNow: (c, n) => `You are now reading from chapter ${c}, step ${n}.`, jumpKeep: 'Stay here', jumpUndo: (c, n) => `Back to chapter ${c}, step ${n}`, historyHint: 'Select a step or chapter to continue reading from there.', jumpHere: 'Continue here', history: 'Look back', historyTitle: 'Look back at everything before your place', historyBack: 'Back to your place', prevChapter: 'Previous chapter', prevChapterTitle: 'Go to the previous chapter', backToList: 'All games', gameMenu: 'More about this game', about: 'About this walkthrough', moreActions: 'More options', stepOf: 'Step', games: 'Games', close: 'Close', loading: 'Loading …', chapters: 'Chapters', settings: 'More',
        modeDatabase: 'Full walkthrough', searchBtn: 'Find another game', findBtn: 'Find word', keyHint: 'Space or → for next, ← for back', modeGuided: "I'm stuck", modeLabel: 'How do you want to read?', startPage: 'Start page',
        export: 'Export progress', import: 'Import progress', howtoAgain: 'How it works', fontSize: 'Font size',
        searchGames: 'Find a game', searchOtherGame: 'Find another game', searchInGame: 'Search this walkthrough', searchStuck: 'Search word, e.g. key', searchStuckOther: l => 'German word, e.g. Schlüssel', noHitsLang: l => ` This walkthrough is in ${l}. Try a word in ${l}.`, savedNote: 'Your place is saved automatically.', readyFor: 'Searching for', noHitsHere: 'This word isn\'t in the walkthrough.',
        allLangs: 'All languages', langFilter: 'Walkthrough language', scopeLabel: 'Filter',
        scopeAll: 'All', scopeFavorites: 'Favorites', scopeMine: 'My games',
        favorite: 'Favorite', statusLabel: 'Game status', statusNone: 'No status', statusPlaying: "I'm playing", statusDone: 'Finished',
        findPrev: 'Previous match', findNext: 'Next match',
        gamesCount: n => `${n} ${n === 1 ? 'game' : 'games'}`, noGames: 'No games found. Check the spelling or browse the list from A to Z.', moreGames: n => `Showing the first ${n}. Narrow your search to see the rest.`,
        welcome: (n, w) => `${n} adventure game walkthroughs, ${w} words in total.`,
        homeTitle: 'How do you want to read?', goStuck: "I'm stuck", goStuckText: 'Step by step, no spoilers: you only ever see the next step.', goFull: 'Full walkthrough', goFullText: 'Every step at once, to read and search.', heroTitle: 'Which game are you stuck in?', heroSub: 'Find your game and your place in it. You only see the next step; the rest stays hidden.', scheme: 'Appearance', schemeAuto: 'Automatic', schemeLight: 'Light', schemeDark: 'Dark', pickGameHint: 'Type the name of your game above.', tabModified: 'New and updated', tabUsed: 'Continue', tabMine: 'My games', allGames: 'Browse all games A to Z',
        empty: 'Nothing here yet.', newTag: 'NEW', markAllRead: 'Mark all as read',
        loadError: 'The walkthrough couldn\'t be loaded. Check your internet connection.', retry: 'Try again',
        langName: { DE: 'German', EN: 'English' },
        translateSummary: 'Translate? Here’s how',
        translateHint: from => `This walkthrough is in ${from}. Your browser can translate it: choose “Translate page” in the browser menu (Chrome, Edge, Safari). It is a machine translation.`,
        pickIntro: 'Page through the chapter names until you recognize your place.', pickHere: 'This is where I am', pickNext: 'Next chapter', pickPrev: 'Previous chapter', subNext: 'Next section', subPrev: 'Previous section', pickStart: 'Start from the beginning', pickLast: 'This is the last chapter.',
        chapterWord: 'Chapter', stepWord: 'Step', noSteps: 'This chapter has no steps.',
        back: 'Back', backTitle: 'One step back', next: 'Next step', next3: '3 more steps', next3Title: 'Reveal 3 steps', rest: 'Rest of chapter', restTitle: 'Reveal the rest of the chapter', closeChapter: 'Change chapter', closeTitle: 'Choose another chapter', confirmRest: 'Reveal all remaining steps in this chapter?', chapterDone: 'Chapter done.', nextChapter: 'Next chapter', endOfChapter: 'End of the walkthrough. Well played!',
        confirmReveal: 'You\'ll also see everything that comes later. Your place stays saved.', revealTitle: 'Show the full walkthrough?',
        findNone: 'No matches', findNoneGuided: 'Nothing found in the revealed steps', findOpenChapter: 'Open a chapter first', findCount: (i, n) => `${i} of ${n}`, findGo: 'Show match', findOne: 'You see one match at a time, nothing else.', hitNext: 'Not this one', hitContinue: 'That is it!', hitEnd: 'End search', hitLast: 'This is the last match.', hitAgain: 'Back to the first match', hitWord: 'Match', saved: 'saved', restDone: 'Rest of the chapter revealed.', undo: 'Undo', cancel: 'Cancel', revealOk: 'Show full walkthrough', resetProgress: 'Reset progress', resetAsk: 'Your saved place in this game will be deleted.', resetOk: 'Reset', howto1: 'Find your game', howto2: 'Find your place', howto3: 'Read only the next step', howtoOk: 'Got it', gameBtn: 'My game', settingsLong: 'Settings', modeHelpGuided: 'Step by step, no spoilers', modeHelpDb: 'Everything at once, spoilers included', pickAfter: 'After that you only see the next step.', restSub: 'Reveals all remaining steps. You can undo this.', historySub: 'Look back at everything before your place.',
        importOk: 'Progress loaded.', importErr: 'That file couldn\'t be loaded. Choose a file you saved here.', storageWarn: 'Your browser doesn\'t allow saving here. Favorites and progress will be lost when you reload.'
    }
};

const $ = id => document.getElementById(id);
const store = createStore();
let lang = store.getLang();
let mode = store.getMode();
let files = [];
const fileMap = new Map();
let current = null;           // { path, node, md, solution, state }
let loadToken = 0;
let findMarks = [];
let findIndex = -1;
let lastFocusBeforeDrawer = null;

const t = () => T[lang];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = html => DOMPurify.sanitize(html);
const encodePath = p => 'solutions/' + p.split('/').map(encodeURIComponent).join('/');
const ICON_BACK = '<svg class="ico" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_SEARCH = '<svg class="ico" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 15.5L20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const ICON_LIST = '<svg class="ico" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M9 6.5h11M9 12h11M9 17.5h11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="4.5" cy="6.5" r="1.4" fill="currentColor"/><circle cx="4.5" cy="12" r="1.4" fill="currentColor"/><circle cx="4.5" cy="17.5" r="1.4" fill="currentColor"/></svg>';
const ICON_NEXT = '<svg class="ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_CHECK = '<svg class="ico" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const backButton = (attrs, disabled, title) => `<button class="btn back" type="button" ${attrs}${title ? ` title="${esc(title)}"` : ''} aria-label="${esc(t().back)}"${disabled ? ' disabled' : ''}>${ICON_BACK}<span class="back-label">${esc(t().back)}</span></button>`;
const chapterName = title => title.replace(/^\s*\d+(?:\.\d+)*\.?\s+/, '');
const langCode = node => { const l = languageOf(node.name); return l ? l.toLowerCase() : ''; };

/* ---------- i18n ---------- */
function placeSearch(where) {
    const row = $('searchRow');
    const slot = where === 'hero' ? $('heroSearchSlot') : where === 'drawer' ? $('drawerSearchSlot') : $('barSearchSlot');
    if (slot && row.parentElement !== slot) slot.append(row);
    document.body.classList.toggle('search-in-hero', where === 'hero' && !!slot);
}
function syncSearchLabel() { const gs = $('gameSearch'); const txt = current ? t().searchOtherGame : t().searchGames; gs.placeholder = txt; gs.setAttribute('aria-label', txt); }
function syncFindLabel() { syncSearchLabel(); const fi = $('findInput'); const mism = current && langCode(current.node) && langCode(current.node) !== lang; const txt = mode === 'guided' ? (mism ? t().searchStuckOther(t().langName[languageOf(current.node.name)]) : t().searchStuck) : t().searchInGame; fi.placeholder = txt; fi.setAttribute('aria-label', t().findLabel); }
function syncModeHelp() { const m = $('modeHelp'); if (m) m.textContent = mode === 'guided' ? t().modeHelpGuided : t().modeHelpDb; }
function applyI18n() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { const v = T[lang][el.dataset.i18n]; if (typeof v === 'string') el.textContent = v; });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = T[lang][el.dataset.i18nPlaceholder]; });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', T[lang][el.dataset.i18nAria]); });
    $('langSelect').value = lang;
    syncFindLabel();
    syncModeHelp();
}

/* ---------- drawers ---------- */
const isDesktop = () => matchMedia('(min-width: 64rem)').matches;
function setDrawer(which, open) {
    const cls = which === 'sidebar' ? 'sidebar-open' : 'toc-open';
    if (which === 'sidebar' && document.body.dataset.view === 'game' && !isDesktop()) placeSearch(open ? 'drawer' : 'bar');
    document.body.classList.toggle(cls, open);
    $('scrim').hidden = !(document.body.classList.contains('sidebar-open') || document.body.classList.contains('toc-open'));
    const anyOpen = document.body.classList.contains('sidebar-open') || document.body.classList.contains('toc-open');
    $('reader').inert = anyOpen;
    document.querySelector('.bar').inert = anyOpen;
    if (which === 'sidebar') { $('sidebar').setAttribute('role', open && !(isDesktop() && document.body.dataset.view === 'home') ? 'dialog' : 'complementary'); }
    $('menuBtn').setAttribute('aria-expanded', String(document.body.classList.contains('sidebar-open')));
    $('tocBtn').setAttribute('aria-expanded', String(document.body.classList.contains('toc-open')));
    if (open) { lastFocusBeforeDrawer = document.activeElement; ((which === 'sidebar' && isDesktop() && $('searchRow').parentElement === $('drawerSearchSlot')) ? $('gameSearch') : (which === 'sidebar' ? $('closeSidebar') : $('closeToc'))).focus(); }
    else if (lastFocusBeforeDrawer && lastFocusBeforeDrawer.focus) { lastFocusBeforeDrawer.focus(); lastFocusBeforeDrawer = null; }
}
function setFindOpen(open) {
    document.body.classList.toggle('find-open', open);
    $('findOpen').setAttribute('aria-expanded', String(open));
}
function setSheet(open, fromPop = false) {
    const was = document.body.classList.contains('sheet-open');
    if (open && !was && !isDesktop()) pushInner();
    else if (!open && was && !fromPop && !isDesktop()) popInner();
    document.body.classList.toggle('sheet-open', open);
    const sheetMode = open && !isDesktop();
    [...$('readerBar').children].forEach(el => { if (el !== $('gameSheet')) el.inert = sheetMode; });
    $('readingCol').inert = sheetMode;
    document.querySelector('.bar').inert = sheetMode;
    if (sheetMode) { $('gameSheet').setAttribute('role', 'dialog'); $('gameSheet').setAttribute('aria-modal', 'true'); } else { $('gameSheet').setAttribute('role', 'region'); $('gameSheet').removeAttribute('aria-modal'); }
    $('gameBtn').setAttribute('aria-expanded', String(open));
    $('scrim').hidden = !(open || document.body.classList.contains('sidebar-open') || document.body.classList.contains('toc-open'));
    if (open) $('closeSheet').focus(); else if (document.activeElement && $('gameSheet').contains(document.activeElement)) $('gameBtn').focus();
}
const closeDrawers = () => { if (document.body.classList.contains('sidebar-open')) setDrawer('sidebar', false); if (document.body.classList.contains('toc-open')) setDrawer('toc', false); if (document.body.classList.contains('sheet-open')) setSheet(false); };

/* ---------- game list ---------- */
function scopePaths() {
  const s = store.getTreeScope();
    if (s === 'favorites') return new Set(store.getFavorites());
    if (s === 'mine') return new Set([...store.getFavorites(), ...Object.keys(store.statusMap())]);
    return null;
}
const MARK = {
    star: '<svg class="ico" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    play: '<svg class="ico" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10-6.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    done: '<svg class="ico" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
function markers(path) {
    let out = '';
    if (store.isFavorite(path)) out += `<span class="mark-fav" role="img" aria-label="${esc(t().favorite)}" title="${esc(t().favorite)}">${MARK.star}</span>`;
    const st = store.getStatus(path);
    if (st === 'playing') out += `<span class="mark-status" role="img" aria-label="${esc(t().statusPlaying)}" title="${esc(t().statusPlaying)}">${MARK.play}</span>`;
    if (st === 'done') out += `<span class="mark-status" role="img" aria-label="${esc(t().statusDone)}" title="${esc(t().statusDone)}">${MARK.done}</span>`;
    return out;
}
function rowHtml(node) {
    const l = languageOf(node.name);
    const cur = current && current.path === node.path ? ' aria-current="true"' : '';
    return `<button class="game-row" type="button" id="opt-${esc(node.path).replace(/[^A-Za-z0-9_-]/g, '_')}" data-path="${esc(node.path)}"${cur}><span class="name" translate="no">${esc(gameTitle(node.name))}</span>${markers(node.path)}${l ? `<span class="badge" translate="no">${l}</span>` : ''}</button>`;
}
function renderList() {
    const inDrawer = $('searchRow').parentElement === $('drawerSearchSlot');
    const q = inDrawer || document.body.classList.contains('list-filter') ? $('gameSearch').value : '';
    const lf = $('langFilter').value || null;
    const sp = scopePaths();
    const box = $('gameList');
    document.querySelectorAll('#scopeBar button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scope === store.getTreeScope())));
    const flat = q.trim() || lf || sp;
    if (flat) {
        const hits = rankGames(searchGames(files, q, { lang: lf, scopePaths: sp }), q);
        const LIMIT = 300;
        $('listCount').textContent = t().gamesCount(hits.length);
        box.innerHTML = hits.length ? hits.slice(0, LIMIT).map(rowHtml).join('') + (hits.length > LIMIT ? `<p class="muted">${esc(t().moreGames(LIMIT))}</p>` : '') : `<p class="muted">${esc(t().noGames)}</p>`;
        return;
    }
    $('listCount').textContent = t().gamesCount(files.length);
    const groups = new Map();
    files.forEach(f => { if (!groups.has(f.letter)) groups.set(f.letter, []); groups.get(f.letter).push(f); });
    const curLetter = current ? current.node.letter : null;
    box.innerHTML = [...groups.entries()].map(([letter, list]) => `<details${letter === curLetter || (!current && matchMedia('(min-width: 64rem)').matches) ? ' open' : ''}><summary translate="no">${esc(letter)} (${list.length})</summary>${list.map(rowHtml).join('')}</details>`).join('');
}

const bareTitle = n => gameTitle(n.name).toLowerCase().replace(/^(the|der|die|das|a|an)\s+/, '');
function rankGames(hits, q) {
    const first = String(q || '').toLowerCase().split(/\s+|\b(?:and|und|or|oder)\b/).filter(Boolean)[0] || '';
    const phrase = String(q || '').toLowerCase().trim().replace(/\s+/g, ' ');
    const plain = /\b(and|und|or|oder)\b/.test(phrase) ? '' : phrase;
    const esc2 = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const score = n => {
        const b = bareTitle(n), full = gameTitle(n.name).toLowerCase();
        if (!first) return 4;
        if (plain && (b.startsWith(plain) || full.startsWith(plain))) return 0;
        if (plain && new RegExp('(^|[\\s\\-:])' + esc2(plain)).test(full)) return 1;
        if (b.startsWith(first) || full.startsWith(first)) return 2;
        if (b.split(/[\s\-:]+/).some(w => w.startsWith(first))) return 3;
        return 4;
    };
    return hits.map(n => [score(n), bareTitle(n), n]).sort((a, b) => a[0] - b[0] || a[1].length - b[1].length || a[1].localeCompare(b[1])).map(x => x[2]);
}
function renderSuggest() {
    const box = $('suggest');
    if ($('searchRow').parentElement === $('drawerSearchSlot')) { box.hidden = true; return; }
    const q = $('gameSearch').value;
    const lf = $('langFilter').value || null;
    if (!q.trim() && !lf) { box.hidden = true; return; }
    let hits = rankGames(searchGames(files, q, { lang: lf }), q);
    let fuzzy = false;
    if (!hits.length && q.trim().length >= 3) { hits = searchGamesFuzzy(files, q, { lang: lf }).slice(0, 8); fuzzy = hits.length > 0; }
    const MAX = 8;
    box.innerHTML = (fuzzy ? `<p class="muted suggest-more">${esc(t().didYouMean)}</p>` : '') + (hits.length ? hits.slice(0, MAX).map(rowHtml).join('') + (hits.length > MAX ? `<button class="link-quiet suggest-more" type="button" data-show-all="1">${esc(t().showAll(hits.length))}</button>` : '') : `<p class="muted suggest-more">${esc(t().noGames)}</p>`);
    box.hidden = false;
    box.setAttribute('role', 'listbox');
    box.querySelectorAll('.game-row').forEach(r => { r.setAttribute('role', 'option'); r.setAttribute('aria-selected', 'false'); r.tabIndex = -1; });
    $('gameSearch').removeAttribute('aria-activedescendant');
    $('live').textContent = t().gamesCount(hits.length);
}

/* ---------- home ---------- */
function continueLine(n) {
    const p = store.guidedProgress(n.path);
    return p && Number.isInteger(p.c) && p.t ? `<span class="card-sub" translate="no">${esc(t().continueAt(p.c + 1, chapterName(p.t)))}${Number.isInteger(p.r) && p.r > 0 ? ` · ${esc(t().stepWord)}\u00a0${p.r}` : ''}</span><span class="card-go">${esc(t().continueBtn)}${ICON_NEXT}</span>` : '';
}
function gameCards(list, withProgress = false) {
    return `<div class="card-grid">${list.map(n => `<button class="game-card" type="button" data-path="${esc(n.path)}"><span class="name" translate="no">${esc(gameTitle(n.name))}</span><span class="meta">${languageOf(n.name) ? `<span class="badge" translate="no">${languageOf(n.name)}</span>` : ''}${store.isUnread(n) ? `<span class="new-tag">${esc(t().newTag)}</span>` : ''}${markers(n.path)}</span>${withProgress ? continueLine(n) : ''}</button>`).join('')}</div>`;
}
function shelf(title, list, extra = '', withProgress = false) {
    return list.length ? `<section class="shelf"><h2>${esc(title)}</h2>${gameCards(list, withProgress)}${extra}</section>` : '';
}
function renderHome() {
    current = null;
    document.body.classList.remove('picking', 'reading', 'find-open', 'sheet-open');
    syncSearchLabel();
    document.body.dataset.view = 'home';
    document.body.classList.remove('search-open');
    $('readerBar').hidden = true;
    $('guidedControls').hidden = true;
    $('translateHint').hidden = true;
    $('tocList').innerHTML = '';
    $('toc').hidden = true;
    $('tocBtn').hidden = true;
    const used = store.recentFiles().map(p => fileMap.get(p)).filter(Boolean).slice(0, 6);
    const mine = [...new Set([...store.getFavorites(), ...Object.keys(store.statusMap())])].map(p => fileMap.get(p)).filter(Boolean).slice(0, 6);
    const fresh = [...files].sort((a, b) => new Date(b.last_modified) - new Date(a.last_modified)).slice(0, 8);
    const words = files.reduce((n, f) => n + (f.words || 0), 0).toLocaleString(lang === 'de' ? 'de-DE' : 'en-US');
    $('content').lang = lang;
    placeSearch('bar');
    $('content').innerHTML = `<div class="welcome"><header class="welcome-hero"><h1 class="hero-title">${esc(t().heroTitle)}</h1><p class="hero-sub">${esc(t().heroSub)}</p><div id="heroSearchSlot" class="hero-search"></div></header>${store.get('sgs_howto') ? '' : `<aside class="howto"><ol><li>${esc(t().howto1)}</li><li>${esc(t().howto2)}</li><li>${esc(t().howto3)}</li></ol><button class="link-quiet" type="button" id="howtoClose">${esc(t().howtoOk)}</button></aside>`}${shelf(t().tabUsed, used, '', true)}${shelf(t().tabMine, mine)}${shelf(t().tabModified, fresh, `<button class="link-quiet" type="button" id="markAllRead">${esc(t().markAllRead)}</button>`)}<p class="muted">${esc(t().welcome(files.length, words))} <button class="link-quiet phone-only" type="button" id="openList">${esc(t().allGames)}</button></p><p class="muted desktop-only kbd-note">${esc(t().kbdHint)}</p></div>`;
    placeSearch('hero');
    resetScroll();
    renderList();
    if (isDesktop() && !document.querySelector('dialog[open]')) $('gameSearch').focus({ preventScroll: true });
}

/* ---------- reader ---------- */
function linkTargets(root) {
    root.querySelectorAll('a[href^="http"]').forEach(a => {
        a.target = '_blank'; a.rel = 'noopener noreferrer';
        if (!a.textContent.trim() && !a.getAttribute('aria-label')) { try { a.setAttribute('aria-label', new URL(a.href).hostname); } catch (e) { /* ignore */ } }
    });
}
function syncBarHeight() { document.documentElement.style.setProperty('--rbh', `${$('readerBar').hidden ? 0 : $('readerBar').offsetHeight}px`); }
function renderReader() {
    if (!current) return renderHome();
    document.body.dataset.view = 'game';
    const { node, solution } = current;
    const code = langCode(node);
    const l = languageOf(node.name);
    placeSearch('bar');
    $('readerBar').hidden = false;
    $('gameTitle').textContent = gameTitle(node.name);
    $('sheetTitle').textContent = gameTitle(node.name);
    $('langBadge').textContent = l ? t().langName[l] : '';
    $('langBadge').hidden = !l;
    $('favBtn').setAttribute('aria-pressed', String(store.isFavorite(node.path)));
    $('statusSelect').value = store.getStatus(node.path) || '';
    const hint = $('translateHint');
    if (l && code !== lang) { hint.hidden = false; $('translateText').textContent = t().translateHint(t().langName[l]); } else hint.hidden = true;
    $('content').lang = code || lang;
    const guided = mode === 'guided';
    $('tocBtn').hidden = guided;
    { const th = document.querySelector('#toc .panel-head h2'); if (th) th.textContent = guided ? t().yourPath : t().chapters; }
    syncFindLabel();
    $('toc').hidden = guided;
    $('toc').classList.remove('path-rail');
    $('guidedControls').hidden = !guided;
    if (guided) renderGuided(false); else renderDatabase();
    document.title = `${gameTitle(node.name)} | Simple Game Solutions`;
    syncBarHeight();
    renderList();
    runFind(false);
}
function renderDatabase() {
    document.body.classList.remove('picking');
    const c = $('content');
    c.innerHTML = `<article class="doc">${clean(renderFull(current.md))}</article>`;
    linkTargets(c);
    c.querySelectorAll('h1').forEach((h, i) => { const n = document.createElement('h2'); n.innerHTML = h.innerHTML; if (i === 0) n.className = 'doc-title'; h.replaceWith(n); });
    const docTitle = c.querySelector('h2.doc-title');
    const meta = docTitle && docTitle.nextElementSibling;
    if (meta && meta.tagName === 'TABLE') { const d = document.createElement('details'); d.className = 'about'; d.innerHTML = `<summary>${esc(t().about)}</summary>`; meta.replaceWith(d); d.append(meta); }
    const heads = [...c.querySelectorAll('h2,h3,h4')];
    heads.forEach((h, i) => { h.id = `sec-${i}`; });
    $('tocList').innerHTML = heads.filter(h => h.tagName !== 'H1' && !h.classList.contains('doc-title')).map(h => `<button class="game-row" type="button" data-sec="${h.id}" style="padding-left:${(Number(h.tagName[1]) - 2) * .9 + .5}rem">${esc(h.textContent)}</button>`).join('');
    $('pathPanel').hidden = true;
    document.body.classList.remove('reading');
    resetScroll();
    if (window.IntersectionObserver) {
        const io = new IntersectionObserver(es => { es.forEach(en => { if (en.isIntersecting) { $('tocList').querySelectorAll('[aria-current]').forEach(b => b.removeAttribute('aria-current')); const b = $('tocList').querySelector(`[data-sec="${en.target.id}"]`); if (b) b.setAttribute('aria-current', 'true'); } }); }, { root: $('readingCol'), rootMargin: '0px 0px -75% 0px' });
        heads.forEach(h => io.observe(h));
    }
    if (current.state && current.state.c !== null && current.state.c !== undefined) {
        const chTitle = (current.solution.chapters[current.state.c] || {}).title;
        const target = chTitle && heads.find(h => h.textContent.trim() === chTitle.trim());
        if (target) {
            target.insertAdjacentHTML('afterend', `<p class="db-here">${esc(t().hereMark(current.state.r))}</p>`);
            const lvl = Number(target.tagName[1]); const items = [];
            for (let el = target.nextElementSibling; el && !(/^H[1-6]$/.test(el.tagName) && Number(el.tagName[1]) <= lvl); el = el.nextElementSibling) items.push(...el.querySelectorAll('li'));
            const mine = items[current.state.r - 1];
            if (mine) { mine.classList.add('db-here-step'); mine.scrollIntoView({ block: 'center' }); } else target.scrollIntoView({ block: 'start' });
            setTimeout(() => { $('tocList').querySelectorAll('[aria-current]').forEach(b => b.removeAttribute('aria-current')); const b = $('tocList').querySelector(`[data-sec="${target.id}"]`); if (b) b.setAttribute('aria-current', 'true'); }, 120);
            document.scrollingElement.scrollTop = 0;
        }
    }
}
const tool = (attrs, label, extraClass = '') => `<button class="tool-link${extraClass}" type="button" ${attrs}>${esc(label)}</button>`;
const readingHead = (title, status, tools = '', titleNoTranslate = false, saved = false) => `<header class="reading-head"><div class="reading-title-row"><h2 class="reading-title"${titleNoTranslate ? ' translate="no"' : ''}>${title}</h2>${status ? `<p class="reading-status">${esc(status)}${saved ? `<span class="saved"> · ${esc(t().saved)}</span>` : ''}</p>` : ''}</div>${tools ? `<nav class="chapter-tools" aria-label="${esc(t().chapterWord)}">${tools}</nav>` : ''}</header>`;
function renderHits(announce) {
    const { solution } = current;
    const h = current.hits;
    const c = $('content');
    const ctl = $('guidedControls');
    const shown = [h.items[h.n - 1]];
    const last = 0;
    const it0 = shown[0];
    const known = current.reached.size > 0;
    const far = known ? Math.max(...current.reached) : -1;
    const opened = h.open && h.open[h.n];
    const st = current.state;
    const ahead = known && (it0.c > far || (st.c !== null && it0.c === st.c && it0.i >= st.r));
    const masked = !opened && (known ? ahead : h.n > 1);
    const isNext = known && st.c !== null && it0.c === st.c && it0.i === st.r;
    const sec0 = (() => { const steps = solution.chapters[it0.c].steps; for (let k = it0.i; k >= 0; k--) if (steps[k].section && steps[k].section.text) return steps[k].section.text; return ''; })();
    const chLabel = `${t().chapterWord} ${solution.chapters[it0.c].number}: ${chapterName(solution.chapters[it0.c].title)}${sec0 ? ` · ${sec0}` : ''}`;
    const sameCh = known && st.c !== null && it0.c === st.c;
    const maskHtml = isNext
        ? `<div class="later-card"><h3 class="later-title">${esc(t().nextIsYours)}</h3><p class="muted">${esc(t().nextIsText)}</p></div>`
        : known
        ? `<div class="later-card"><h3 class="later-title">${esc(sameCh ? t().sameChTitle : t().laterTitle)}</h3><p class="muted">${esc(sameCh ? t().sameChText : t().laterText)}</p><button class="btn" type="button" data-act="hit-reveal">${esc(t().laterShow)}</button></div>`
        : `<div class="later-card"><h3 class="later-title" translate="no">${esc(t().nextHitTitle(chLabel))}</h3><p class="muted">${esc(t().nextHitText)}</p><button class="btn" type="button" data-act="hit-reveal">${esc(t().nextHitShow)}</button></div>`;
    c.innerHTML = readingHead(esc(t().hitHead(h.q)), t().hitPos(h.n), tool('data-act="hit-end"', t().hitEnd)) + (masked
        ? maskHtml
        : `<ol class="steps hit-steps">${shown.map((it, i) => { const ch = solution.chapters[it.c]; const st = ch.steps[it.i]; return `<li class="step${i === last ? ' newest' : ''}" style="--depth:0"><span class="step-no hit-mark">${ICON_SEARCH}<span class="sr-only">${esc(t().hitWord)}</span></span><div class="step-body"><span class="step-section" translate="no">${esc(chLabel)}</span>${clean(st.html)}</div></li>`; }).join('')}</ol>`);
    linkTargets(c);
    highlight(findTerms(h.q));
    c.querySelectorAll('.reading-head mark.find').forEach(m => m.replaceWith(document.createTextNode(m.textContent)));
    findMarks = [...c.querySelectorAll('mark.find')];
    const atEnd = h.n >= h.items.length;
    const single = h.items.length === 1;
    ctl.hidden = false;
    ctl.className = 'guided-controls hit';
    ctl.innerHTML = (atEnd && !single ? `<div class="notice" role="status"><p>${esc(t().hitLast)}</p></div>` : '')
        + backButton('data-act="hit-back"', h.n <= 1)
        + (single ? `<button class="btn" type="button" data-find-retry="1">${esc(t().noHitsRetry)}</button>` : `<button class="btn" type="button" data-act="${atEnd ? 'hit-again' : 'hit-next'}">${esc(atEnd ? t().hitAgain : t().hitNext)}</button>`)
        + (masked ? (isNext ? `<button class="btn primary cta" type="button" data-act="hit-take-next">${esc(t().takeNext)}</button>` : '') : `<button class="btn primary cta" type="button" data-act="hit-continue">${esc(t().hitContinue)}</button>`)
        + (atEnd ? (masked ? '' : `<span class="key-hint">${esc(t().hitKeysEnter)}</span>`) : `<span class="key-hint">${esc(masked ? t().hitKeysMasked : t().hitKeys)}</span>`);
    fitControls();
    const newest = c.querySelector('.step.newest');
    if (newest && $('readingCol').scrollHeight > $('readingCol').clientHeight) newest.scrollIntoView({ block: 'nearest' }); else resetScroll();
    if (!ctl.contains(document.activeElement)) { const ht = c.querySelector('.reading-title'); if (ht) { ht.tabIndex = -1; ht.focus({ preventScroll: true }); } }
    if (announce) $('live').textContent = masked ? `${t().hitWord} ${h.n}: ${known ? t().laterTitle : t().nextHitTitle(chLabel)}` : `${t().hitWord} ${h.n}: ${solution.chapters[shown[last].c].steps[shown[last].i].text}`;
}
function renderNoHit() {
    const q = current.noHit;
    $('guidedControls').hidden = true;
    const other = langCode(current.node) && langCode(current.node) !== lang ? t().noHitsLang(t().langName[languageOf(current.node.name)]) : '';
    $('content').innerHTML = readingHead(esc(t().noHitHead(q)), '') + `<div class="find-ready"><p>${esc(t().noHitsHere + other)}</p><p class="muted">${esc(t().noHitsTip)}</p><div class="find-ready-actions"><button class="btn" type="button" data-find-retry="1">${esc(t().noHitsRetry)}</button><button class="btn primary cta" type="button" data-find-clear="1" data-tab="chapters">${esc(t().pathTabChapters)}</button></div></div>`;
}
function stepLi(s, i, n, newest, depth, jump) {
    const j = jump ? ` data-hist-c="${jump.c}" data-hist-i="${i}"` : '';
    const jb = jump ? ` role="button" tabindex="0" aria-label="${esc(t().jumpHere)}: ${esc(String(s.text || '').slice(0, 80))}"` : '';
    return `<li class="step${newest ? ' newest' : ''}${jump ? ' jumpable' : ''}" style="--depth:${depth}" value="${n}"${j}><span class="step-no"><span class="sr-only">${esc(t().stepWord)} </span>${n}</span><div class="step-body"${jb}>${s.section ? `<span class="step-section" translate="no">${esc(s.section.text)}</span>` : ''}${clean(s.html)}</div></li>`;
}
function renderHistory(announce) {
    const { solution, state } = current;
    const c = $('content');
    const ctl = $('guidedControls');
    let html = readingHead(esc(t().historyHead), '', tool('data-act="history-off"', t().historyBack)) + `<p class="muted history-hint">${esc(t().historyHint)}</p>`;
    const chain = [...current.reached].filter(ci => ci <= state.c).sort((a, b) => a - b);
    for (const ci of chain) {
        const ch = solution.chapters[ci];
        const steps = ci < state.c ? ch.steps : revealed(ch, state.r);
        html += `<h3 class="history-chapter"><button class="history-jump" type="button" data-hist-c="${ci}" data-hist-i="0" title="${esc(t().jumpHere)}">${esc(t().chapterWord)} ${ch.number}: <span translate="no">${esc(chapterName(ch.title))}</span></button></h3><ol class="steps">${steps.map((st, i) => stepLi(st, i, i + 1, ci === state.c && i === steps.length - 1, st.depth, { c: ci })).join('')}</ol>`;
    }
    c.innerHTML = html;
    c.classList.add('is-history');
    linkTargets(c);
    ctl.hidden = false;
    ctl.className = 'guided-controls history';
    ctl.innerHTML = `<p class="muted history-bar-hint phone-only">${esc(t().historyHint)}</p><button class="btn primary cta" type="button" data-act="history-off">${esc(t().historyBack)}</button>`;
    const newest = c.querySelector('.step.newest');
    if (newest) { newest.scrollIntoView({ block: 'center' }); document.scrollingElement.scrollTop = 0; }
    if (announce) $('live').textContent = t().history;
    if (newest) requestAnimationFrame(() => newest.scrollIntoView({ block: 'center' }));
}
function sectionsOf(chapter) {
    const out = [];
    chapter.steps.forEach((st, idx) => { if (st.section && st.section.text) out.push({ idx, text: st.section.text }); });
    return out;
}
function pathHtml() {
    const { solution, state } = current;
    return `<h3 class="path-title">${esc(t().yourPath)}</h3><ol class="path-list">` + solution.chapters.map((ch, i) => [ch, i]).filter(([, i]) => current.reached.has(i)).map(([ch, i]) => `<li><button class="path-item" type="button" data-jump-ch="${i}"${i === (state.c !== null ? state.c : (current.prevState ? current.prevState.c : -1)) ? ' aria-current="step"' : ''}><span class="path-no">${ch.number}</span><span class="path-name" translate="no">${esc(chapterName(ch.title))}</span></button></li>`).join('') + '</ol>';
}
function syncAdmin() { const d = $('gameAdmin'); if (d) { if (!isDesktop()) d.open = true; d.querySelector('summary').hidden = !isDesktop(); } }
function renderPathRail() {
    syncAdmin();
    const { state } = current;
    const panel = $('pathPanel');
    const h = document.querySelector('#toc .panel-head h2');
    if (mode !== 'guided') { if (h) h.textContent = t().chapters; panel.hidden = true; document.body.classList.remove('reading'); return; }
    if (h) h.textContent = t().chapters;
    $('toc').hidden = true;
    const show = state.c !== null && !current.sub;
    document.body.classList.toggle('reading', show);
    panel.hidden = false;
    panel.setAttribute('aria-label', t().yourPath);
    panel.innerHTML = current.reached.size ? pathHtml() : `<h3 class="path-title">${esc(t().yourPath)}</h3><p class="muted path-empty">${esc(t().pathEmpty)}</p>`;
}
function renderSub() {
    document.body.classList.add('picking');
    const { solution, sub } = current;
    const ch = solution.chapters[sub.c];
    const it = sub.items[sub.i];
    const lastOne = sub.i >= sub.items.length - 1;
    const secNo = (it.text.match(/^\s*(\d+(?:\.\d+)*)\.?\s+/) || [])[1];
    $('guidedControls').hidden = true;
    $('content').innerHTML = readingHead(esc(t().subTitle(ch.number)), '') + `<div class="picker"><p class="dialog-note">${esc(t().subIntro)}</p><div class="pick-card"><p class="pick-no" translate="no">${esc(t().chapterWord)} ${ch.number} · ${esc(chapterName(ch.title))}${secNo ? ` · ${esc(t().sectionWord)} ${esc(secNo)}` : ''}</p><p class="pick-name" translate="no">${esc(chapterName(it.text))}</p></div>${lastOne ? `<p class="muted">${esc(t().subLast)}</p>` : ''}<div class="pick-actions"><button class="btn" type="button" data-sub="prev"${sub.i === 0 ? ' disabled' : ''}>${esc(t().subPrev)}</button><button class="btn" type="button" data-sub="next"${lastOne ? ' disabled' : ''}>${esc(t().subNext)}</button><button class="btn primary cta" type="button" data-sub="here">${esc(t().pickHere)}</button><p class="muted pick-after">${esc(t().pickAfter)}</p></div><p class="sub-links"><button class="link-quiet" type="button" data-sub="start">${esc(t().subStart)}</button><button class="link-quiet" type="button" data-sub="chapters">${esc(t().otherChapter)}</button></p></div>`;
    resetScroll();
}
const FOCUS_KEYS = ['act', 'pick', 'sub', 'entryTab', 'chapter', 'histC', 'jump', 'undo', 'findRetry', 'findClear', 'backSpot'];
const visible = el => !!(el && !el.disabled && el.offsetParent);
function focusKey(el) {
    if (!el || !el.closest || !el.closest('#content, #guidedControls')) return null;
    const host = el.closest('button, [role="button"], input');
    if (!host) return null;
    if (host.id) return '#' + host.id;
    if (host.dataset.subcheck !== undefined || host.dataset.backSpot !== undefined && host.classList.contains('cta')) return '.path-chapters .cta';
    const k = FOCUS_KEYS.find(key => host.dataset[key] !== undefined);
    return k ? `[data-${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}="${host.dataset[k]}"]` : null;
}
function renderGuided(announce) {
    const before = document.activeElement;
    const key = focusKey(before);
    try { return renderGuidedInner(announce); } finally {
        renderPathRail();
        if (key && !document.contains(before)) {
            const same = document.querySelector(`#content ${key}, #guidedControls ${key}`);
            const fromField = before && before.matches && before.matches('input');
            const pick = sels => sels.map(q => document.querySelector(q));
            const cands = current && current.hits
                ? (fromField ? [$('content').querySelector('.reading-title')] : pick(['#guidedControls [data-act="hit-continue"]', '#guidedControls [data-act="hit-take-next"]', '#guidedControls [data-act="hit-next"]', '#guidedControls [data-act="hit-again"]', '#guidedControls [data-find-retry]']))
                : (current && (current.stepping || current.prevState) ? pick(['#content .path-chapters .cta', '#guidedControls .btn.primary']) : pick(['#guidedControls .btn.primary', ...(isDesktop() ? ['#content #pickFind'] : []), '#content .cta']));
            const target = visible(same) ? same : (cands.find(visible) || $('content').querySelector('.reading-title'));
            if (target) { if (target.classList.contains('reading-title')) target.tabIndex = -1; target.focus({ preventScroll: true }); }
        }
    }
}
function claimUpTo(c) { for (let i = 0; i <= c; i++) current.reached.add(i); }
function renderGuidedInner(announce) {
    if (current.state.c !== null) current.reached.add(current.state.c);
    document.body.classList.toggle('picking', current.state.c === null && !current.hits && !current.noHit && !current.history);
    document.body.classList.toggle('searching', !!(current.hits || current.noHit));
    $('resetProgress').hidden = !current.reached.size;
    $('content').classList.remove('is-history');
    $('tocList').innerHTML = '';
    if (current.hits) return renderHits(announce);
    if (current.noHit) return renderNoHit();
    if (current.history && current.state.c !== null && [...current.reached].some(ci => ci < current.state.c)) return renderHistory(announce);
    current.history = false;
    if (current.sub) return renderSub();
    const { solution, state } = current;
    const c = $('content');
    const ctl = $('guidedControls');
    $('tocList').innerHTML = '';
    if (state.c === null) {
        ctl.hidden = true;
        const i = Math.min(current.pick || 0, solution.chapters.length - 1);
        const ch = solution.chapters[i];
        const lastOne = i >= solution.chapters.length - 1;
        const l = languageOf(current.node.name);
        const langNote = l && l.toLowerCase() !== lang ? t().pathSearchLang(t().langName[l]) : '';
        const stepping = !!current.stepping;
        const tab = current.entryTab || (stepping ? 'chapters' : 'search');
        c.innerHTML = readingHead(esc(current.prevState ? t().changeTitle : t().pickTitle), '') + (current.prevState ? '' : `<p class="lead">${esc(t().pickLead)}</p>`)
            + (current.prevState && current.prevState.c !== i ? `<p class="entry-back"><button class="link-back" type="button" data-back-spot="1">${ICON_BACK}<span>${esc(t().backToSpot(solution.chapters[current.prevState.c].number, current.prevState.r))}</span></button></p>` : '')
            + `<div class="seg path-tabs" role="group" aria-label="${esc(t().pathTabsLabel)}"><button type="button" data-entry-tab="search" aria-pressed="${tab === 'search'}">${esc(t().pathTabSearch)}</button><button type="button" data-entry-tab="chapters" aria-pressed="${tab === 'chapters'}">${esc(t().pathTabChapters)}</button></div>`
            + `<div class="paths${current.prevState || stepping ? ' changing' : ''}" data-tab="${tab}">`
            + `<section class="path-card path-search"><h3 class="path-card-title">${ICON_SEARCH}${esc(t().pathSearchTitle)}</h3><p class="path-card-text">${esc(t().pathSearchText)}</p><form class="pick-search" data-pick-search="1"><div class="find-field">${ICON_SEARCH.replace('class="ico"', 'class="ico search-ico"')}<input id="pickFind" type="search" autocomplete="off" enterkeyhint="search" placeholder="${esc(langCode(current.node) && langCode(current.node) !== lang ? t().searchStuckOther() : t().searchStuck)}" aria-label="${esc(t().pathSearchTitle)}"></div><button class="btn${current.prevState || stepping ? '' : ' primary'}" type="submit">${esc(t().pathSearchGo)}</button></form>${langNote ? `<p class="muted small-note">${esc(langNote)}</p>` : ''}</section>`
            + `<section class="path-card path-chapters"><h3 class="path-card-title">${ICON_LIST}${esc(t().pathChapterTitle)}</h3><p class="path-card-text">${esc(t().pathChapterText)}</p><div class="pick-card"><p class="pick-no">${esc(t().chapterWord)} ${ch.number}</p><p class="pick-name" translate="no">${esc(chapterName(ch.title))}</p></div>${lastOne ? `<p class="muted small-note">${esc(t().pickLast)}</p>` : ''}<div class="pick-actions"><button class="btn" type="button" data-pick="prev"${i === 0 ? ' disabled' : ''}>${esc(t().pickPrev)}</button><button class="btn" type="button" data-pick="next"${lastOne ? ' disabled' : ''}>${esc(t().pickNext)}</button>${solution.chapters.length > 15 ? `<p class="pick-jump">${i > 0 ? `<button class="link-quiet" type="button" data-pick="prev10">${esc(t().pick10Prev2)}</button>` : ''}${lastOne ? '' : `<button class="link-quiet" type="button" data-pick="next10">${esc(t().pick10Next2)}</button>`}</p>` : ''}${current.prevState && current.prevState.c === i ? `<button class="btn primary cta" type="button" data-back-spot="1">${esc(t().resumeAt(current.prevState.r))}</button>` : `<button class="btn primary cta" type="button" data-chapter="${ch.index}" data-subcheck="1">${esc(t().pickHere)}</button>`}</div><p class="muted pick-after">${esc(t().pickAfter)}</p></section>`
            + `</div><p class="entry-full">${i > 0 || current.prevState ? `<button class="link-quiet" type="button" data-chapter="0">${esc(t().pickStartShort)}</button>` : ''}<button class="link-quiet phone-only" type="button" data-mode-switch="database">${esc(t().entryFull)}</button></p>`;
        if (!stepping && isDesktop()) $('pickFind').focus({ preventScroll: true });
        resetScroll();
        return;
    }
    const chapter = solution.chapters[state.c];
    const from = current.from || 0;
    const shown = revealed(chapter, state.r).slice(from);
    const last = shown.length - 1;
    const atEndH = state.r >= chapter.steps.length;
    const moreItems = (atEndH ? '' : `<button class="btn plain more-item" type="button" data-act="rest"><span class="mi-t">${esc(t().restLong)}</span><span class="mi-s">${esc(t().restHelp)}</span></button>`)
        + `<button class="btn plain more-item phone-only" type="button" data-mode-switch="database"><span class="mi-t">${esc(t().modeDatabase)}</span><span class="mi-s">${esc(t().modeHelpDb)}</span></button>`;
    const tools = tool('data-act="close"', t().closeChapter, '')
        + ([...current.reached].some(ci => ci < state.c) ? tool('data-act="history-on"', t().history) : '')
        + `<details class="menu tools-more${atEndH ? ' phone-only' : ''}"><summary class="tool-link">${esc(t().moreTools)}<svg class="ico" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></summary><div class="menu-panel">${moreItems}</div></details>`;
    c.innerHTML = readingHead(`${esc(t().chapterWord)} ${chapter.number}: <span translate="no">${esc(chapterName(chapter.title))}</span>`, `${t().stepWord} ${state.r}`, tools, false, true) + `${shown.length ? '' : `<p class="muted">${esc(t().noSteps)}</p>`}<ol class="steps">${shown.map((s, i) => `<li class="step${i === last ? ' newest' : ''}" style="--depth:${s.depth}" value="${from + i + 1}"><span class="step-no"><span class="sr-only">${esc(t().stepWord)} </span>${from + i + 1}</span><div class="step-body">${s.section ? `<span class="step-section" translate="no">${esc(s.section.text)}</span>` : ''}${clean(s.html)}</div></li>`).join('')}</ol>`;
    linkTargets(c);
    if (current.pending) {
        const o = current.pending;
        c.insertAdjacentHTML('afterbegin', `<div class="notice jump-bar" role="group"><p>${esc(t().jumpNow(chapter.number, state.r))}</p><div class="notice-actions"><button class="btn" type="button" data-jump="keep">${esc(t().jumpKeep)}</button><button class="btn" type="button" data-jump="undo">${esc(t().jumpUndo(solution.chapters[o.c].number, o.r))}</button></div></div>`);
    }
    const atEnd = state.r >= chapter.steps.length;
    const hasNext = state.c + 1 < solution.chapters.length;
    ctl.hidden = false;
    ctl.className = 'guided-controls';
    const undoBtn = current.undo && !current.pending ? `<button class="btn ghost" type="button" data-undo="1">${esc(t().undo)}</button>` : '';
    const landed = current.landed; current.landed = false;
    const landedNote = `<div class="notice landed" role="status">${ICON_CHECK}<p>${esc(t().landed)}</p></div>`;
    const done = landed && !current.pending ? landedNote : atEnd ? `<div class="notice done" role="status">${ICON_CHECK}<p>${esc(hasNext ? t().chapterDone : t().endOfChapter)}</p>${undoBtn}${hasNext ? '' : `<div class="notice-actions">${store.getStatus(current.path) === 'done' ? `<span class="muted">${esc(t().markedDone)}</span>` : `<button class="btn primary" type="button" data-mark-done="1">${esc(t().markDone)}</button>`}<button class="btn" type="button" data-all-games="1">${esc(t().allGamesShort)}</button></div>`}</div>` : (undoBtn ? `<div class="notice" role="status"><p>${esc(current.undo.kind === 'next3' ? t().next3Done : t().restDone)}</p>${undoBtn}</div>` : '');
    ctl.innerHTML = done
        + backButton('data-act="back"', state.r <= from + 1 && from === 0 && !(state.c > 0 && current.reached.has(state.c - 1)), t().backTitle)
        + (atEnd ? (hasNext ? `<button class="btn primary cta" type="button" data-act="open:${state.c + 1}">${esc(t().nextChapter)}</button>` : '')
            : `<button class="btn multi" type="button" data-act="next3" title="${esc(t().next3Title)}">${esc(t().next3)}</button><button class="btn primary cta" type="button" data-act="next">${esc(t().next)}</button>`);
    if (!atEnd) ctl.insertAdjacentHTML('beforeend', `<span class="key-hint">${esc(t().keyHint)}</span>`);
    document.documentElement.style.setProperty('--ctlh', `${ctl.offsetHeight}px`);
    fitControls();
    const newest = c.querySelector('.step.newest');
    if (newest && $('readingCol').scrollHeight > $('readingCol').clientHeight) { newest.scrollIntoView({ block: 'nearest' }); const head = c.querySelector('.reading-head'); if (head && newest.getBoundingClientRect().bottom - head.getBoundingClientRect().top < $('readingCol').clientHeight - $('guidedControls').offsetHeight) head.scrollIntoView({ block: 'start' }); }
    else resetScroll();
    if (announce && shown.length) $('live').textContent = `${t().stepWord} ${state.r}: ${shown[last].text}`;
}
function jumpTo(c, i) {
    const old = { c: current.state.c, r: current.state.r, from: current.from || 0 };
    current.history = false;
    current.hits = null;
    current.state = { c, r: Math.min(current.solution.chapters[c].steps.length, i + 1) || 1 };
    current.from = i;
    current.undo = null;
    current.pending = (old.c === c && old.r === current.state.r && old.from === i) ? null : old;
    renderGuided(true);
    resetScroll();
}
const prefersCalm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function glide(update) {
    if (!document.startViewTransition || prefersCalm()) { update(); return; }
    const root = document.documentElement;
    const done = () => root.classList.remove('gliding');
    root.classList.add('gliding');
    const vt = document.startViewTransition(update);
    vt.ready.catch(() => {});
    vt.updateCallbackDone.catch(e => console.error(e));
    vt.finished.then(done, done);
}
function fitControls() {
    const ctl = $('guidedControls');
    if (ctl.hidden) return;
    ctl.classList.remove('in-flow', 'compact');
    const limit = $('readingCol').clientHeight * 0.4;
    if (ctl.offsetHeight > limit) ctl.classList.add('compact');
    if (ctl.offsetHeight > limit) ctl.classList.add('in-flow');
}
function resetScroll() { $('readingCol').scrollTop = 0; $('reader').scrollTop = 0; }
function saveGuided() {
    const o = progressToStore(current.solution, current.state);
    if (o && current.from > 0) o.s = current.from;
    if (o) o.rc = [...current.reached].sort((a, b) => a - b);
    store.setGuidedProgress(current.path, o);
}
function loadFrom(solution, state, saved) {
    const ch = state.c !== null ? solution.chapters[state.c] : null;
    const f = saved && Number.isInteger(saved.s) ? saved.s : 0;
    return ch && f > 0 && f < state.r && f < ch.steps.length && saved.h === chapterHash(ch) ? f : 0;
}
function pickChapter(dir) {
    if (!current) return;
    current.stepping = true;
    current.entryTab = 'chapters';
    const max = current.solution.chapters.length - 1;
    const d = { next: 1, prev: -1, next10: 10, prev10: -10 }[dir] || 0;
    current.pick = Math.max(0, Math.min(max, (current.pick || 0) + d));
    renderGuided(false);
    const ch = current.solution.chapters[current.pick];
    $('live').textContent = `${t().chapterWord} ${ch.number}: ${chapterName(ch.title)}`;
}
function guidedAction(action) {
    if (!current) return;
    if (current.pending && (action === 'close' || action.startsWith('open:'))) { current.pending = null; saveGuided(); }
    if (action === 'history-on' || action === 'history-off') {
        if (current.pending && action === 'history-on') { current.pending = null; saveGuided(); }
        if (action === 'history-on' && !current.history) pushInner(); else if (action === 'history-off' && current.history) popInner();
        current.history = action === 'history-on';
        renderGuided(true);
        if (!current.history) resetScroll();
        return;
    }
    if (action.startsWith('hit-')) {
        const h = current.hits;
        if (!h) return;
        if (action === 'hit-take-next') { popInner(); current.hits = null; $('findInput').value = ''; setFindOpen(false); clearMarks(); guidedAction('next'); return; }
        if (action === 'hit-reveal') { h.open = h.open || {}; h.open[h.n] = true; }
        else if (action === 'hit-next') h.n = Math.min(h.items.length, h.n + 1);
        else if (action === 'hit-back') h.n = Math.max(1, h.n - 1);
        else if (action === 'hit-again') h.n = 1;
        else if (action === 'hit-end') { popInner(); current.hits = null; $('findInput').value = ''; current.noHit = false; clearMarks(); $('findCount').textContent = ''; setFindOpen(false); }
        else if (action === 'hit-continue') {
            const it = h.items[h.n - 1];
            popInner();
            const old = current.state.c !== null ? { c: current.state.c, r: current.state.r, from: current.from || 0 } : null;
            const moved = old && (old.c !== it.c || old.r !== it.i + 1);
            glide(() => { claimUpTo(it.c); current.landed = true; current.hits = null; current.noHit = false; current.pending = moved ? old : null; current.stepping = false; current.entryTab = null; current.state = { c: it.c, r: it.i + 1 }; current.from = it.i; saveGuided(); $('findInput').value = ''; runFind(false); setFindOpen(false); renderGuided(true); resetScroll(); const b = $('guidedControls').querySelector('.btn.primary'); if (b) b.focus({ preventScroll: true }); });
            return;
        }
        renderGuided(true);
        return;
    }
    if (action === 'rest' || action === 'next3') current.undo = { c: current.state.c, r: current.state.r, from: current.from || 0, kind: action }; else if (!action.startsWith('hit-') && !action.startsWith('history')) current.undo = null;
    if (action === 'prevch' || (action === 'back' && current.state.c !== null && current.state.r <= (current.from || 0) + 1)) {
        const st = current.state;
        if (action === 'back' && (current.from || 0) > 0) { current.from = 0; }
        else if (st.c > 0 && current.reached.has(st.c - 1)) {
            const prev = current.solution.chapters[st.c - 1];
            current.from = 0;
            current.state = { c: st.c - 1, r: action === 'prevch' ? (prev.steps.length ? 1 : 0) : prev.steps.length };
        } else return;
        saveGuided(); renderGuided(true); runFind(false);
        return;
    }
    if (action === 'close') { current.pick = current.state.c || 0; current.stepping = true; current.entryTab = 'chapters'; current.prevState = { c: current.state.c, r: current.state.r, from: current.from || 0 }; pushInner(); }
    else current.prevState = null;
    if (action.startsWith('open:') && current.state.c === null) claimUpTo(Number(action.slice(5)) || 0);
    if (action === 'close' || action.startsWith('open:')) current.from = 0;
    current.state = applyAction(current.state, action, current.solution.chapters);
    const hadFocus = $('guidedControls').contains(document.activeElement);
    if (current.state.c !== null) saveGuided();
    renderGuided(true);
    runFind(false);
}

/* ---------- in-game search ---------- */
function findTerms(q) {
    return [...new Set(q.toLowerCase().split(/\b(?:or|oder|and|und)\b/).flatMap(p => p.split(/\s+/)).filter(Boolean))];
}
function clearMarks() {
    const c = $('content');
    c.querySelectorAll('mark.find').forEach(m => m.replaceWith(document.createTextNode(m.textContent)));
    c.normalize();
    findMarks = [];
    findIndex = -1;
}
function highlight(terms) {
    const re = new RegExp(`(${terms.map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const walker = document.createTreeWalker($('content'), NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
        if (!re.test(n.nodeValue)) return;
        re.lastIndex = 0;
        const frag = document.createDocumentFragment();
        n.nodeValue.split(re).forEach((part, i) => {
            if (i % 2) { const m = document.createElement('mark'); m.className = 'find'; m.textContent = part; frag.append(m); }
            else if (part) frag.append(document.createTextNode(part));
        });
        n.replaceWith(frag);
    });
    findMarks = [...$('content').querySelectorAll('mark.find')];
}
function showFind(i) {
    if (!findMarks.length) return;
    findMarks.forEach(m => m.classList.remove('current'));
    findIndex = (i + findMarks.length) % findMarks.length;
    const m = findMarks[findIndex];
    m.classList.add('current');
    m.scrollIntoView({ block: 'center' });
    $('findCount').textContent = t().findCount(findIndex + 1, findMarks.length);
}
function startGuidedSearch(q) {
    if (!current) return;
    q = String(q || '').trim();
    if (!q) return;
    $('findInput').value = q;
    let items = searchSteps(current.solution, q, null).filter(h => h.kind === 'step').map(h => ({ c: h.chapterIndex, i: h.stepIndex }));
    if (!items.length) items = searchStepsFuzzy(current.solution, q).map(h => ({ c: h.chapterIndex, i: h.stepIndex }));
    const here = current.state.c;
    if (here !== null) items = [...items.filter(x => x.c >= here), ...items.filter(x => x.c < here)];
    const wasInner = !!(current.hits || current.noHit);
    current.noHit = items.length ? null : q;
    current.hits = items.length ? { q, items, n: 1 } : null;
    if (!wasInner) pushInner();
    renderGuided(true);
    resetScroll();
}
let skipPop = false;
function pushInner() { history.pushState({ inner: true }, '', location.href); }
function popInner() { if (history.state && history.state.inner) { skipPop = true; history.back(); } }
function runFind(jump = true) {
    if (!current) return;
    clearMarks();
    const q = $('findInput').value.trim();
    const out = $('findCount');
    $('findResults').hidden = true;
    if (!q) { out.textContent = ''; return; }
    const guided = mode === 'guided';
    const box = $('findResults');
    box.hidden = true; box.innerHTML = '';
    if (guided) {
        out.textContent = '';
        if (current.hits) highlight(findTerms(current.hits.q));
        return;
    }
    const scope = null;
    const hits = searchSteps(current.solution, q, scope);
    if (!hits.length) { out.textContent = t().findNone; return; }
    highlight(findTerms(q));
    if (!findMarks.length) { out.textContent = t().findNone; return; }
    if (jump) showFind(0); else out.textContent = t().findCount(0, findMarks.length);
}

/* ---------- loading ---------- */
async function openGame(path, { push = true } = {}) {
    const node = fileMap.get(path);
    if (!node) { renderHome(); return; }
    const token = ++loadToken;
    closeDrawers();
    placeSearch('bar');
    document.body.dataset.view = 'game';
    $('content').innerHTML = `<p class="muted loading">${esc(t().loading)}</p>`;
    $('readerBar').hidden = false;
    $('gameTitle').textContent = gameTitle(node.name);
    try {
        const ac = new AbortController();
        const to = setTimeout(() => ac.abort(), 20000);
        let res;
        try { res = await fetch(encodePath(path), { signal: ac.signal }); } finally { clearTimeout(to); }
        if (token !== loadToken) return;
        if (!res.ok) throw new Error(String(res.status));
        const md = await res.text();
        if (token !== loadToken) return;
        const solution = parseSolution(md);
        const saved = store.guidedProgress(path); const st0 = progressFromStore(solution, saved);
        const reached = new Set(Array.isArray(saved && saved.rc) ? saved.rc.filter(n => n < solution.chapters.length) : []);
        if (!reached.size && st0.c !== null) for (let i = 0; i <= st0.c; i++) reached.add(i);
        current = { path, node, md, solution, state: st0, from: loadFrom(solution, st0, saved), reached };
        store.setLastFile(path);
        store.trackRecent(path);
        store.set('sgs_howto', '1');
        store.markRead(node);
        document.body.classList.remove('search-open');
        $('searchToggle').setAttribute('aria-expanded', 'false');
        setFindOpen(false);
        if (push) history.pushState({}, '', `?file=${encodeURIComponent(path)}`);
        else if (new URLSearchParams(location.search).get('file') !== path) history.replaceState(history.state, '', `?file=${encodeURIComponent(path)}`);
        $('findInput').value = '';
        renderReader();
        const pf = $('pickFind');
        if (pf && isDesktop()) pf.focus({ preventScroll: true }); else $('content').focus({ preventScroll: true });
    } catch (e) {
        if (token !== loadToken) return;
        current = null;
        $('content').innerHTML = `<p class="error">${esc(t().loadError)}</p><p><button class="btn" type="button" id="retryBtn" data-path="${esc(path)}">${esc(t().retry)}</button></p>`;
        $('guidedControls').hidden = true;
    }
}
function goHome(push = true) {
    ++loadToken;
    store.clearLastFile();
    closeDrawers();
    $('findInput').value = '';
    document.title = lang === 'de' ? 'Simple Game Solutions | Lösungen für Adventure-Spiele' : 'Simple Game Solutions | Adventure game walkthroughs';
    if (push) history.pushState({}, '', location.pathname);
    renderHome();
}

/* ---------- mode ---------- */
function applyMode() {
    document.body.dataset.mode = mode;
    syncFindLabel();
    syncModeHelp();
    document.querySelectorAll('#modeSwitch button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
}
function askConfirm(title, text, okLabel) {
    const d = $('confirmDlg');
    if (!d.showModal) return Promise.resolve(window.confirm(text));
    $('confirmTitle').textContent = title;
    $('confirmText').textContent = text;
    $('confirmOk').textContent = okLabel;
    return new Promise(resolve => {
        d.addEventListener('close', () => resolve(d.returnValue === 'ok'), { once: true });
        d.returnValue = 'cancel';
        d.showModal();
        $('confirmOk').focus();
    });
}
async function setMode(next, quiet = false) {
    if (next === mode) return;
    if (!quiet && next === 'database' && current && !(await askConfirm(t().revealTitle, t().confirmReveal, t().revealOk))) return;
    if (current && next === 'database' && !quiet) pushInner();
    mode = next;
    if (current) current.hits = null;
    syncFindLabel();
    store.setMode(mode);
    applyMode();
    closeDrawers();
    if (current) renderReader();
}

/* ---------- settings ---------- */
function exportSettings() {
    const blob = new Blob([JSON.stringify(store.exportAll(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `simple-game-solutions-settings-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
}
function importSettings(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            store.importAll(JSON.parse(reader.result));
            lang = store.getLang(); mode = store.getMode();
            applyI18n(); applyMode(); applyZoom();
            if (current) { const sv = store.guidedProgress(current.path); current.state = progressFromStore(current.solution, sv); current.from = loadFrom(current.solution, current.state, sv); renderReader(); } else renderHome();
            alert(t().importOk);
        } catch (e) { alert(t().importErr); }
    };
    reader.readAsText(file);
}
function applyScheme() {
    const v = store.get('sgs_scheme');
    const scheme = v === 'light' || v === 'dark' ? v : 'auto';
    if (scheme === 'auto') delete document.documentElement.dataset.scheme; else document.documentElement.dataset.scheme = scheme;
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => { if (scheme === 'auto') m.content = m.media.includes('dark') ? '#111827' : '#ffffff'; else m.content = scheme === 'dark' ? '#111827' : '#ffffff'; });
    $('schemeSelect').value = scheme;
}
function applyZoom() {
    const pct = store.getFontScale();
    document.documentElement.style.setProperty('--fs', String(pct / 100));
    document.documentElement.classList.remove('fs-large');
    const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    document.documentElement.classList.toggle('fs-large', pct > 115 || rootPx > 18.5);
    $('zoomSelect').value = String(pct);
}

/* ---------- events ---------- */
// arrows work from anywhere except text fields and open menus; on a button only Space/Enter belong to the button
function keyBlocked(e) {
    const el = e.target;
    if (!el.closest) return false;
    const b = document.body.classList;
    if (b.contains('sheet-open') || b.contains('sidebar-open') || b.contains('toc-open') || document.querySelector('dialog[open], details.menu[open]')) return true;
    if (el.closest('input, select, textarea, [contenteditable]')) return true;
    if (el.closest('button, a, summary, [role="button"]') && (e.key === ' ' || e.key === 'Enter')) return true;
    return false;
}
function bind() {
    new ResizeObserver(syncBarHeight).observe($('readerBar'));
    new ResizeObserver(fitControls).observe($('readingCol'));
    new ResizeObserver(fitControls).observe(document.documentElement);
    new MutationObserver(() => { const open = !$('suggest').hidden; $('gameSearch').setAttribute('aria-expanded', String(open)); if (!open) $('gameSearch').removeAttribute('aria-activedescendant'); }).observe($('suggest'), { attributes: true, attributeFilter: ['hidden'] });
    document.addEventListener('click', e => { document.querySelectorAll('details.menu[open]').forEach(d => { if (!d.contains(e.target)) d.open = false; }); });
    $('menuBtn').addEventListener('click', () => setDrawer('sidebar', !document.body.classList.contains('sidebar-open')));
    $('closeSidebar').addEventListener('click', () => setDrawer('sidebar', false));
    $('tocBtn').addEventListener('click', () => setDrawer('toc', !document.body.classList.contains('toc-open')));
    $('closeToc').addEventListener('click', () => setDrawer('toc', false));
    $('scrim').addEventListener('click', closeDrawers);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && current && current.prevState && current.state.c === null && !document.querySelector('dialog[open], details.menu[open]') && !document.body.classList.contains('sheet-open') && !document.body.classList.contains('sidebar-open')) { const b = $('content').querySelector('[data-back-spot]'); if (b) { b.click(); return; } } if (e.key === 'Escape') { closeDrawers(); document.querySelectorAll('details.menu[open]').forEach(d => { d.open = false; const sm = d.querySelector('summary'); if (sm) sm.focus(); }); } });
    $('homeBtn').addEventListener('click', () => goHome());
    $('searchToggle').addEventListener('click', () => { const open = document.body.classList.toggle('search-open'); $('searchToggle').setAttribute('aria-expanded', String(open)); const lbl = $('searchToggle').querySelector('.lbl-long'); if (lbl) lbl.textContent = open ? t().closeSearch : t().otherGame; if (open) $('gameSearch').focus(); });
    matchMedia('(min-width: 64rem)').addEventListener('change', () => { if (document.body.classList.contains('sheet-open')) setSheet(false); });
    document.addEventListener('keydown', e => {
        if (mode === 'guided' && current && current.hits && e.key === 'Enter' && !keyBlocked(e) && !(e.target.closest && e.target.closest('button, a, summary'))) {
            const go = $('guidedControls').querySelector('[data-act="hit-continue"], [data-act="hit-take-next"]');
            if (go) { e.preventDefault(); go.click(); }
            return;
        }
        if (mode === 'guided' && current && current.hits && !e.altKey && !e.ctrlKey && !e.metaKey && !keyBlocked(e)) {
            if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); guidedAction('hit-next'); } else if (e.key === 'ArrowLeft') { e.preventDefault(); guidedAction('hit-back'); }
            return;
        }
        if (mode === 'guided' && current && current.state.c === null && !current.hits && !current.noHit && !e.altKey && !e.ctrlKey && !e.metaKey && !keyBlocked(e)) {
            const fwd = e.key === 'ArrowRight' || e.key === ' ', back = e.key === 'ArrowLeft';
            if (!fwd && !back) return;
            e.preventDefault();
            if (current.sub) { const sb = current.sub; sb.i = Math.max(0, Math.min(sb.items.length - 1, sb.i + (fwd ? 1 : -1))); renderGuided(false); const here = $('content').querySelector('[data-sub="here"]'); if (here && (document.activeElement === document.body || !document.activeElement)) here.focus({ preventScroll: true }); }
            else pickChapter(fwd ? 'next' : 'prev');
            return;
        }
        if (mode !== 'guided' || !current || current.state.c === null || current.history || document.querySelector('details.menu[open]') || e.altKey || e.ctrlKey || e.metaKey) return;
        if (keyBlocked(e)) return;
        if (e.key === ' ' || e.key === 'ArrowRight') {
            e.preventDefault();
            const ch = current.solution.chapters[current.state.c];
            if (current.state.r >= ch.steps.length && current.state.c + 1 < current.solution.chapters.length) glide(() => guidedAction(`open:${current.state.c + 1}`)); else guidedAction('next');
        }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); guidedAction('back'); }
    });
    $('homeBtn2').addEventListener('click', () => goHome());
    $('pathPanel').addEventListener('click', e => { const j = e.target.closest('[data-jump-ch]'); if (j && current) { setSheet(false); jumpTo(Number(j.dataset.jumpCh), 0); } });
    $('gameBtn').addEventListener('click', () => setSheet(!document.body.classList.contains('sheet-open')));
    $('closeSheet').addEventListener('click', () => setSheet(false));
    $('findOpen').addEventListener('click', () => { const open = !document.body.classList.contains('find-open'); setFindOpen(open); if (open) $('findInput').focus(); else $('findInput').blur(); });
    $('dockGuided').addEventListener('click', () => setMode('guided', true));
    $('dockToc').addEventListener('click', () => setDrawer('toc', true));
    $('backToList').addEventListener('click', () => goHome());
    $('modeSwitch').addEventListener('click', e => { const b = e.target.closest('button[data-mode]'); if (b) setMode(b.dataset.mode); });
    $('langSelect').addEventListener('change', e => { lang = e.target.value; store.setLang(lang); applyI18n(); current ? renderReader() : renderHome(); });
    $('schemeSelect').addEventListener('change', e => { store.set('sgs_scheme', e.target.value); applyScheme(); });
    $('zoomSelect').addEventListener('change', e => { store.setFontScale(Number(e.target.value)); applyZoom(); });
    $('exportBtn').addEventListener('click', exportSettings);
    $('importBtn').addEventListener('click', () => $('importFile').click());
    $('importFile').addEventListener('change', e => { const f = e.target.files[0]; if (f) importSettings(f); e.target.value = ''; });
    $('gameSearch').addEventListener('input', () => { if (!$('gameSearch').value.trim()) document.body.classList.remove('list-filter'); renderList(); renderSuggest(); });
    $('gameSearch').addEventListener('focus', renderSuggest);
    $('gameSearch').addEventListener('keydown', e => {
        if (e.key === 'Escape' && !$('suggest').hidden) { e.preventDefault(); $('suggest').hidden = true; }
        if (e.key === 'ArrowDown' && $('suggest').hidden && $('gameSearch').value.trim()) { e.preventDefault(); renderSuggest(); return; }
        if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !$('suggest').hidden) {
            const rows = [...$('suggest').querySelectorAll('.game-row')];
            if (!rows.length) return;
            e.preventDefault();
            let i = rows.findIndex(r => r.getAttribute('aria-selected') === 'true');
            i = e.key === 'ArrowDown' ? Math.min(rows.length - 1, i + 1) : Math.max(0, i - 1);
            rows.forEach((r, k) => { r.setAttribute('aria-selected', String(k === i)); r.classList.toggle('active', k === i); });
            $('gameSearch').setAttribute('aria-activedescendant', rows[i].id);
            rows[i].scrollIntoView({ block: 'nearest' });
            return;
        }
        if (e.key === 'Enter' && !$('suggest').hidden && $('gameSearch').value.trim()) { const first = $('suggest').querySelector('[aria-selected="true"]') || $('suggest').querySelector('[data-path]'); if (first) { e.preventDefault(); $('suggest').hidden = true; openGame(first.dataset.path); } }
    });
    const showAllGames = () => { $('suggest').hidden = true; document.body.classList.add('list-filter'); renderList(); if (isDesktop() && document.body.dataset.view === 'home') { const r = $('gameList').querySelector('.game-row'); if (r) { r.scrollIntoView({ block: 'nearest' }); r.focus(); } } else setDrawer('sidebar', true); };
    $('suggest').addEventListener('click', e => { if (e.target.closest('[data-show-all]')) { showAllGames(); return; } const b = e.target.closest('[data-path]'); if (b) { $('suggest').hidden = true; openGame(b.dataset.path); } });
    document.addEventListener('click', e => { if (!e.target.closest('.search-wrap')) $('suggest').hidden = true; });
    $('langFilter').addEventListener('change', () => { renderList(); renderSuggest(); });
    $('scopeBar').addEventListener('click', e => { const b = e.target.closest('button[data-scope]'); if (b) { store.setTreeScope(b.dataset.scope); renderList(); } });
    $('gameList').addEventListener('click', e => { const b = e.target.closest('[data-path]'); if (b) openGame(b.dataset.path); });
    $('resetProgress').addEventListener('click', async () => {
        setSheet(false);
        if (!current || !(await askConfirm(t().resetProgress + '?', t().resetAsk, t().resetOk))) return;
        store.setGuidedProgress(current.path, null);
        current.state = { c: null, r: 0 }; current.from = 0; current.pending = null; current.undo = null; current.hits = null; current.sub = null; current.history = false; current.pick = 0; current.reached = new Set();
        renderReader();
    });
    $('favBtn').addEventListener('click', () => { if (!current) return; store.toggleFavorite(current.path); $('favBtn').setAttribute('aria-pressed', String(store.isFavorite(current.path))); renderList(); });
    $('statusSelect').addEventListener('change', e => { if (!current) return; store.setStatus(current.path, e.target.value || null); renderList(); });
    $('tocList').addEventListener('click', e => { const j = e.target.closest('[data-jump-ch]'); if (j && current) { jumpTo(Number(j.dataset.jumpCh), 0); setDrawer('toc', false); return; } const b = e.target.closest('[data-sec]'); if (!b) return; const el = document.getElementById(b.dataset.sec); if (el) el.scrollIntoView({ block: 'start' }); setDrawer('toc', false); });
    $('content').addEventListener('click', e => {
        const toolAct = e.target.closest('.chapter-tools [data-act], .later-card [data-act]');
        if (toolAct && current) { guidedAction(toolAct.dataset.act); return; }
        const toolMode = e.target.closest('[data-mode-switch]');
        if (toolMode && current) { setMode(toolMode.dataset.modeSwitch); return; }
        if (e.target.closest('[data-find-retry]') && current) {
            popInner(); current.noHit = null;
            if (current.state.c === null) { $('findInput').value = ''; current.entryTab = 'search'; renderGuided(false); const f = $('pickFind'); if (f) f.focus(); }
            else { renderGuided(false); setFindOpen(true); $('findInput').select(); $('findInput').focus(); }
            return;
        }
        const tabBtn = e.target.closest('[data-entry-tab]');
        if (tabBtn && current) { current.entryTab = tabBtn.dataset.entryTab; renderGuided(false); const f = current.entryTab === 'search' ? $('pickFind') : $('content').querySelector('.path-chapters .cta'); if (f) f.focus(); return; }
        const clr = e.target.closest('[data-find-clear]');
        if (clr && clr.dataset.tab && current) current.entryTab = clr.dataset.tab;
        if (e.target.closest('[data-find-clear]') && current) {
            popInner();
            $('findInput').value = '';
            current.noHit = false;
            current.hits = null;
            setFindOpen(false);
            runFind(false);
            renderGuided(false);
            return;
        }
        if (e.target.closest('[data-undo]') && current && current.undo) {
            const u = current.undo;
            current.undo = null;
            current.state = { c: u.c, r: u.r };
            current.from = u.from;
            saveGuided();
            renderGuided(true);
            return;
        }
        if (e.target.closest('[data-back-spot]') && current && current.prevState) { popInner(); const o = current.prevState; current.prevState = null; current.state = { c: o.c, r: o.r }; current.from = o.from; current.stepping = false; current.entryTab = null; renderGuided(true); resetScroll(); return; }
        if (e.target.closest('#howtoClose')) { store.set('sgs_howto', '1'); const el = $('content').querySelector('.howto'); if (el) el.remove(); return; }
        if (e.target.closest('[data-focus-search]')) { $('gameSearch').focus(); return; }
        const jb = e.target.closest('[data-jump]');
        if (jb && current && current.pending) {
            if (jb.dataset.jump === 'undo') { const o = current.pending; current.state = { c: o.c, r: o.r }; current.from = o.from; }
            current.pending = null;
            saveGuided();
            renderGuided(true);
            resetScroll();
            return;
        }
        const hj = e.target.closest('[data-hist-c]');
        if (hj && current && !e.target.closest('a')) { jumpTo(Number(hj.dataset.histC), Number(hj.dataset.histI)); return; }
        const sb = e.target.closest('[data-sub]');
        if (sb && current && current.sub) {
            const sub = current.sub;
            const act = sb.dataset.sub;
            if (act === 'next') { sub.i = Math.min(sub.items.length - 1, sub.i + 1); renderGuided(false); return; }
            if (act === 'prev') { sub.i = Math.max(0, sub.i - 1); renderGuided(false); return; }
            popInner();
            current.sub = null;
            if (act === 'chapters') { current.stepping = true; current.entryTab = 'chapters'; current.pick = sub.c; renderGuided(false); return; }
            if (act === 'start') { guidedAction(`open:${sub.c}`); return; }
            const idx = sub.items[sub.i].idx;
            glide(() => {
                claimUpTo(sub.c);
                current.landed = true;
                current.pending = null;
                current.state = { c: sub.c, r: idx + 1 };
                current.from = idx;
                saveGuided();
                renderGuided(true);
                resetScroll();
            });
            return;
        }
        const ch = e.target.closest('[data-chapter]');
        if (ch && ch.dataset.subcheck && current) {
            const c = Number(ch.dataset.chapter);
            const items = sectionsOf(current.solution.chapters[c]);
            if (items.length >= 4) { current.sub = { c, items, i: 0 }; pushInner(); renderGuided(false); return; }
        }
        if (ch) { const n = ch.dataset.chapter; current.stepping = false; current.entryTab = null; glide(() => guidedAction(`open:${n}`)); return; }
        const row = e.target.closest('[data-path]');
        if (row) { openGame(row.dataset.path); return; }
        const pk = e.target.closest('[data-pick]');
        if (pk) { pickChapter(pk.dataset.pick); return; }
        if (e.target.closest('#openList')) { showAllGames(); return; }
        if (e.target.closest('#markAllRead')) { store.markAllRead([...files].sort((a, b) => new Date(b.last_modified) - new Date(a.last_modified)).slice(0, 20)); renderHome(); }
    });
    $('content').addEventListener('submit', e => {
        const f = e.target.closest('[data-pick-search]');
        if (!f || !current) return;
        e.preventDefault();
        const q = $('pickFind').value.trim();
        if (!q) { $('pickFind').focus(); return; }
        startGuidedSearch(q);
    });
    $('content').addEventListener('keydown', e => { const hk = e.target.closest && e.target.closest('[data-hist-c]'); if ((e.key === 'Enter' || e.key === ' ') && hk && e.target.matches('[role="button"]') && current) { e.preventDefault(); jumpTo(Number(hk.dataset.histC), Number(hk.dataset.histI)); } });
    $('guidedControls').addEventListener('click', e => {
        if (e.target.closest('[data-mark-done]') && current) { store.setStatus(current.path, 'done'); $('statusSelect').value = 'done'; renderList(); renderGuided(false); return; }
        if (e.target.closest('[data-all-games]')) { goHome(); return; }
        if (e.target.closest('[data-undo]') && current && current.undo) {
            const u = current.undo;
            current.undo = null;
            current.state = { c: u.c, r: u.r };
            current.from = u.from;
            saveGuided();
            renderGuided(true);
            return;
        }
        const b = e.target.closest('[data-act]');
        if (b) guidedAction(b.dataset.act);
    });
    $('howtoAgain').addEventListener('click', () => { store.set('sgs_howto', ''); $('settings').open = false; goHome(); });
    let timer;
    $('findInput').addEventListener('input', () => { if (mode === 'guided') return; clearTimeout(timer); timer = setTimeout(() => runFind(true), 150); });
    $('findInput').addEventListener('keydown', e => { if (e.key !== 'Enter') return; e.preventDefault(); if (mode === 'guided') { startGuidedSearch($('findInput').value); return; } showFind(findIndex + (e.shiftKey ? -1 : 1)); });
    $('findNext').addEventListener('click', () => showFind(findIndex + 1));
    $('findPrev').addEventListener('click', () => showFind(findIndex - 1));
    document.addEventListener('keydown', e => {
        if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
        if (keyBlocked(e)) return;
        e.preventDefault();
        if (document.body.dataset.view === 'game' && current) {
            let pf = $('pickFind');
            if (pf && !pf.offsetParent && current.state.c === null && !current.hits) { current.entryTab = 'search'; renderGuided(false); pf = $('pickFind'); }
            if (pf && pf.offsetParent) { pf.focus(); return; }
            if (!isDesktop()) setFindOpen(true);
            $('findInput').focus(); $('findInput').select();
            return;
        }
        $('gameSearch').focus();
    });
    window.addEventListener('popstate', () => {
        if (skipPop) { skipPop = false; return; }
        if (document.body.classList.contains('sheet-open')) { setSheet(false, true); return; }
        if (current && mode === 'database' && new URLSearchParams(location.search).get('file') === current.path) { setMode('guided', true); return; }
        const p = new URLSearchParams(location.search).get('file');
        if (current && p === current.path) {
            if (current.hits || current.noHit) { current.hits = null; current.noHit = null; $('findInput').value = ''; $('findInput').blur(); setFindOpen(false); clearMarks(); }
            else if (current.history) current.history = false;
            else if (current.sub) current.sub = null;
            else if (current.prevState && current.state.c === null) { const o = current.prevState; current.prevState = null; current.state = { c: o.c, r: o.r }; current.from = o.from; }
            renderGuided(false); resetScroll();
            return;
        }
        p ? openGame(p, { push: false }) : goHome(false);
    });
}

/* ---------- start ---------- */
async function init() {
    applyI18n();
    applyMode();
    applyZoom();
    applyScheme();
    bind();
    if (!store.persistent) $('listCount').textContent = t().storageWarn;
    try {
        const res = await fetch('structure.json');
        if (!res.ok) throw new Error(String(res.status));
        const root = await res.json();
        (root.children || []).forEach(dir => (dir.children || []).forEach(function walk(n) {
            if (n.type === 'file') { n.letter = dir.name; files.push(n); fileMap.set(n.path, n); }
            else (n.children || []).forEach(walk);
        }));
    } catch (e) {
        $('gameList').innerHTML = `<p class="error">${esc(t().listError)}</p>`;
        $('content').innerHTML = `<p class="error">${esc(t().listError)}</p><p><button class="btn" type="button" onclick="location.reload()">${esc(t().retry)}</button></p>`;
        return;
    }
    store.migrateReadState(p => fileMap.get(p));
    const fromUrl = new URLSearchParams(location.search).get('file');
    const last = store.getLastFile();
    renderList();
    if (fromUrl && fileMap.has(fromUrl)) await openGame(fromUrl, { push: false });
    else if (last && fileMap.has(last)) await openGame(last, { push: false });
    else renderHome();
}
init();
