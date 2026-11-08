import { marked } from './vendor/marked.esm.js';

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

function unescapeHtml(s) {
    return s.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, m => ENTITIES[m] ?? m);
}

function tokenText(tokens) {
    let out = '';
    for (const t of tokens || []) {
        if (t.type === 'list') {
            for (const it of t.items) out += ' ' + tokenText(it.tokens);
        } else if (t.type === 'table') {
            out += ' ' + [...t.header, ...t.rows.flat()].map(c => tokenText(c.tokens)).join(' ');
        } else if (t.tokens) {
            out += tokenText(t.tokens);
        } else if (t.type === 'br') {
            out += ' ';
        } else if (t.type === 'hr' || t.type === 'space' || t.type === 'def') {
            out += '';
        } else {
            out += typeof t.text === 'string' ? t.text : (t.raw || '');
        }
    }
    return unescapeHtml(out).replace(/\s+/g, ' ').trim();
}

function renderTokens(tokens, links) {
    const list = tokens.slice();
    list.links = links || {};
    return marked.parser(list);
}

function flattenList(list, depth, links, out) {
    for (const item of list.items) {
        const own = item.tokens.filter(t => t.type !== 'list');
        const nested = item.tokens.filter(t => t.type === 'list');
        out.push({
            kind: 'item',
            depth,
            level: null,
            section: null,
            html: renderTokens(own, links),
            text: tokenText(own)
        });
        for (const n of nested) flattenList(n, depth + 1, links, out);
    }
}

export function parseSolution(md) {
    const tokens = marked.lexer(String(md ?? ''));
    const links = tokens.links || {};

    const depths = tokens.filter(t => t.type === 'heading' && t.depth >= 2).map(t => t.depth);
    const topLevel = depths.length ? Math.min(...depths) : 2;
    const hasLists = tokens.some(t => t.type === 'list');

    let title = '';
    let titleSeen = false;
    const intro = [];
    const chapters = [];
    let current = null;
    let pendingSection = null;

    for (const t of tokens) {
        if (t.type === 'space' || t.type === 'def') continue;

        if (t.type === 'heading' && !titleSeen && t.depth === 1 && !current) {
            title = tokenText(t.tokens);
            titleSeen = true;
            continue;
        }
        if (t.type === 'heading' && t.depth <= topLevel) {
            current = {
                index: chapters.length,
                number: chapters.length + 1,
                title: tokenText(t.tokens),
                steps: []
            };
            chapters.push(current);
            pendingSection = null;
            continue;
        }
        if (!current) {
            intro.push(t);
            continue;
        }
        if (t.type === 'hr') continue;
        if (t.type === 'heading') {
            pendingSection = { level: t.depth, html: renderTokens([t], links), text: tokenText(t.tokens) };
            continue;
        }
        const before = current.steps.length;
        if (t.type === 'list') {
            flattenList(t, 0, links, current.steps);
        } else {
            current.steps.push({
                kind: 'block',
                depth: 0,
                level: null,
                section: null,
                html: renderTokens([t], links),
                text: tokenText([t])
            });
        }
        if (pendingSection && current.steps.length > before) {
            current.steps[before].section = pendingSection;
            pendingSection = null;
        }
    }

    return {
        title,
        introHtml: intro.length ? renderTokens(intro, links) : '',
        chapters,
        topLevel,
        hasLists
    };
}

export function renderFull(md) {
    return marked.parse(String(md ?? ''));
}

export function chapterHash(chapter) {
    const str = chapter.steps.map(s => (s.section ? s.section.text + '\n' : '') + s.text).join('\n');
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export function revealed(chapter, r) {
    return chapter.steps.slice(0, Math.max(0, r));
}

export function applyAction(state, action, chapters) {
    const cur = state && Number.isInteger(state.c) ? state : { c: null, r: 0 };
    const chapter = cur.c !== null ? chapters[cur.c] : null;
    const len = chapter ? chapter.steps.length : 0;

    if (typeof action === 'string' && action.startsWith('open:')) {
        const idx = Number(action.slice(5));
        const target = Number.isInteger(idx) ? chapters[idx] : null;
        if (!target) return { c: cur.c, r: cur.r };
        return { c: idx, r: target.steps.length ? 1 : 0 };
    }
    switch (action) {
        case 'next': return chapter ? { c: cur.c, r: Math.min(len, cur.r + 1) } : { c: cur.c, r: cur.r };
        case 'next3': return chapter ? { c: cur.c, r: Math.min(len, cur.r + 3) } : { c: cur.c, r: cur.r };
        case 'rest': return chapter ? { c: cur.c, r: len } : { c: cur.c, r: cur.r };
        case 'back': return chapter ? { c: cur.c, r: Math.max(Math.min(1, len), cur.r - 1) } : { c: cur.c, r: cur.r };
        case 'close': return { c: null, r: 0 };
        default: return { c: cur.c, r: cur.r };
    }
}

export function progressToStore(solution, state) {
    if (!state || state.c === null || state.c === undefined) return null;
    const chapter = solution.chapters[state.c];
    if (!chapter) return null;
    return { c: state.c, r: state.r, t: chapter.title, h: chapterHash(chapter) };
}

export function progressFromStore(solution, saved) {
    const none = { c: null, r: 0 };
    if (!saved || typeof saved !== 'object' || !Number.isInteger(saved.c)) return none;
    const chapter = solution.chapters[saved.c];
    if (!chapter) return none;
    const len = chapter.steps.length;
    if (saved.h !== chapterHash(chapter) || saved.t !== chapter.title) {
        return { c: saved.c, r: len ? 1 : 0 };
    }
    const r = Number.isFinite(saved.r) ? Math.trunc(saved.r) : 1;
    return { c: saved.c, r: len ? Math.min(len, Math.max(1, r)) : 0 };
}
