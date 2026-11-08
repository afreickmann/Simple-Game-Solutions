import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    parseSolution, renderFull, chapterHash, revealed,
    applyAction, progressToStore, progressFromStore
} from '../js/model.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const structure = JSON.parse(readFileSync(join(root, 'structure.json'), 'utf8'));
const files = [];
(function walk(n) {
    if (n.type === 'file') files.push(n);
    (n.children || []).forEach(walk);
})(structure);

const read = path => readFileSync(join(root, 'solutions', path), 'utf8');
const find = re => files.find(f => re.test(f.name));

const monkey = find(/Secret of Monkey Island.*-EN$/) || find(/Monkey Island.*-EN$/);
const prose = files.filter(f => /Maniac Mansion Mania Staffel 0[5-9] Edgar Award-DE$/.test(f.name));

test('fixtures exist', () => {
    assert.ok(monkey, 'a Monkey Island EN solution');
    assert.equal(prose.length, 5, 'five prose-only Edgar Award files found by name');
});

test('list-based file parses into numbered chapters with steps', () => {
    const sol = parseSolution(read(monkey.path));
    assert.ok(sol.title.length > 0);
    assert.ok(sol.hasLists);
    assert.ok(sol.chapters.length >= 1);
    sol.chapters.forEach((c, i) => {
        assert.equal(c.index, i);
        assert.equal(c.number, i + 1);
        assert.equal(typeof c.title, 'string');
        c.steps.forEach(s => {
            assert.ok(['item', 'block'].includes(s.kind));
            assert.equal(typeof s.html, 'string');
            assert.equal(typeof s.text, 'string');
        });
    });
    assert.ok(sol.chapters.some(c => c.steps.some(s => s.kind === 'item')));
});

test('prose-only files still give paragraph blocks as steps', () => {
    assert.ok(prose.length > 0);
    for (const f of prose) {
        const sol = parseSolution(read(f.path));
        assert.equal(sol.hasLists, false, f.name);
        const steps = sol.chapters.flatMap(c => c.steps);
        assert.ok(steps.length > 0, `${f.name} has steps`);
        assert.ok(steps.every(s => s.kind !== 'item'), f.name);
        assert.ok(steps.some(s => s.kind === 'block' && s.text.length > 0), f.name);
    }
});

test('nested lists become following steps with depth + 1', () => {
    const sol = parseSolution('# T\n\n## A\n\n- one\n  - nested\n    - deep\n- two\n');
    const steps = sol.chapters[0].steps;
    assert.deepEqual(steps.map(s => [s.text, s.depth]), [['one', 0], ['nested', 1], ['deep', 2], ['two', 0]]);
    assert.ok(steps.every(s => s.kind === 'item'));
});

test('chapter numbering, topLevel and deeper headings as labels on the next step', () => {
    const md = '# Game\n\nIntro text\n\n### A\n\n- a1\n\n#### sub\n\n- s1\n\n### B\n\n- b1\n';
    const sol = parseSolution(md);
    assert.equal(sol.title, 'Game');
    assert.equal(sol.topLevel, 3);
    assert.deepEqual(sol.chapters.map(c => [c.number, c.title]), [[1, 'A'], [2, 'B']]);
    assert.deepEqual(sol.chapters[0].steps.map(s => [s.kind, s.text, s.section && s.section.text]), [['item', 'a1', null], ['item', 's1', 'sub']]);
    assert.equal(sol.chapters[0].steps[1].section.level, 4);
    assert.equal(sol.chapters[0].steps[1].level, null);
    assert.match(sol.introHtml, /Intro text/);
    assert.doesNotMatch(sol.introHtml, /Game/);
});

test('a later h1 starts a chapter', () => {
    const sol = parseSolution('# Game\n\n## A\n\n- a\n\n# Second\n\n- b\n');
    assert.deepEqual(sol.chapters.map(c => c.title), ['A', 'Second']);
});

test('reveal never exposes later step text', () => {
    const sol = parseSolution(read(monkey.path));
    const chapter = sol.chapters.find(c => c.steps.length >= 4);
    assert.ok(chapter);
    const marked = chapter.steps.map((s, i) => ({ ...s, html: `${s.html}ZQMARK${i}XZ`, text: `${s.text} ZQMARK${i}XZ` }));
    const fake = { ...chapter, steps: marked };
    for (let n = 1; n < marked.length; n++) {
        const view = revealed(fake, n);
        assert.equal(view.length, n);
        const blob = view.map(s => s.html + s.text).join('\n');
        assert.ok(blob.includes(`ZQMARK${n - 1}XZ`));
        assert.ok(!blob.includes(`ZQMARK${n}XZ`), `step ${n} leaked after revealing ${n}`);
    }
    assert.deepEqual(revealed(chapter, 0), []);
    assert.deepEqual(revealed(chapter, -2), []);
});

test('applyAction transitions and clamping', () => {
    const chapters = parseSolution('# T\n\n## A\n\n- 1\n- 2\n- 3\n- 4\n- 5\n\n## Empty\n\n## C\n\n- c1\n').chapters;
    const s0 = { c: null, r: 0 };
    const frozen = Object.freeze({ ...s0 });
    const s1 = applyAction(frozen, 'open:0', chapters);
    assert.deepEqual(s1, { c: 0, r: 1 });
    assert.deepEqual(applyAction(s1, 'next', chapters), { c: 0, r: 2 });
    assert.deepEqual(applyAction(s1, 'next3', chapters), { c: 0, r: 4 });
    assert.deepEqual(applyAction({ c: 0, r: 4 }, 'next3', chapters), { c: 0, r: 5 });
    assert.deepEqual(applyAction({ c: 0, r: 5 }, 'next', chapters), { c: 0, r: 5 });
    assert.deepEqual(applyAction(s1, 'rest', chapters), { c: 0, r: 5 });
    assert.deepEqual(applyAction({ c: 0, r: 3 }, 'back', chapters), { c: 0, r: 2 });
    assert.deepEqual(applyAction({ c: 0, r: 1 }, 'back', chapters), { c: 0, r: 1 });
    assert.deepEqual(applyAction({ c: 0, r: 3 }, 'close', chapters), { c: null, r: 0 });
    assert.deepEqual(applyAction(s0, 'next', chapters), { c: null, r: 0 });
    assert.deepEqual(applyAction(s0, 'open:1', chapters), { c: 1, r: 0 });
    assert.deepEqual(applyAction(s0, 'open:9', chapters), { c: null, r: 0 });
    assert.deepEqual(applyAction(s0, 'open:x', chapters), { c: null, r: 0 });
    assert.deepEqual(applyAction({ c: 1, r: 0 }, 'back', chapters), { c: 1, r: 0 });
    assert.deepEqual(s1, { c: 0, r: 1 });
});

test('progress roundtrip', () => {
    const sol = parseSolution(read(monkey.path));
    const idx = sol.chapters.findIndex(c => c.steps.length >= 3);
    const state = { c: idx, r: 3 };
    const saved = progressToStore(sol, state);
    assert.equal(saved.c, idx);
    assert.equal(saved.r, 3);
    assert.equal(saved.t, sol.chapters[idx].title);
    assert.equal(saved.h, chapterHash(sol.chapters[idx]));
    assert.deepEqual(progressFromStore(sol, JSON.parse(JSON.stringify(saved))), state);
    assert.equal(progressToStore(sol, { c: null, r: 0 }), null);
});

test('hash or title mismatch resets to chapter start', () => {
    const sol = parseSolution('# T\n\n## A\n\n- 1\n- 2\n- 3\n');
    const saved = progressToStore(sol, { c: 0, r: 3 });
    const changed = parseSolution('# T\n\n## A\n\n- 1\n- 2 changed\n- 3\n');
    assert.deepEqual(progressFromStore(changed, saved), { c: 0, r: 1 });
    const renamed = parseSolution('# T\n\n## Z\n\n- 1\n- 2\n- 3\n');
    assert.deepEqual(progressFromStore(renamed, saved), { c: 0, r: 1 });
});

test('invalid saved input yields no chapter', () => {
    const sol = parseSolution('# T\n\n## A\n\n- 1\n');
    const none = { c: null, r: 0 };
    for (const bad of [null, undefined, 5, 'x', {}, { c: 'a' }, { c: 1.5 }, { c: 7, r: 1, t: 'A', h: 'x' }, { c: -1 }]) {
        assert.deepEqual(progressFromStore(sol, bad), none, JSON.stringify(bad));
    }
    const good = progressToStore(sol, { c: 0, r: 1 });
    assert.deepEqual(progressFromStore(sol, { ...good, r: 99 }), { c: 0, r: 1 });
    assert.deepEqual(progressFromStore(sol, { ...good, r: -4 }), { c: 0, r: 1 });
    assert.deepEqual(progressFromStore(sol, { ...good, r: 'x' }), { c: 0, r: 1 });
});

test('empty and heading-less documents', () => {
    for (const md of ['', '   \n', null, undefined, 'just text\n\n- a\n- b\n']) {
        const sol = parseSolution(md);
        assert.deepEqual(sol.chapters, []);
        assert.equal(sol.topLevel, 2);
        assert.equal(sol.title, '');
    }
    assert.match(parseSolution('just text').introHtml, /just text/);
    assert.equal(parseSolution('').hasLists, false);
});

test('renderFull and chapterHash', () => {
    assert.match(renderFull('# Hi\n\n- a'), /<h1[^>]*>Hi<\/h1>[\s\S]*<li>a<\/li>/);
    const a = { steps: [{ text: 'x' }, { text: 'y' }] };
    const b = { steps: [{ text: 'x' }, { text: 'z' }] };
    assert.equal(chapterHash(a), chapterHash({ steps: [{ text: 'x' }, { text: 'y' }] }));
    assert.notEqual(chapterHash(a), chapterHash(b));
    assert.match(chapterHash(a), /^[0-9a-z]+$/);
});

test('reference links resolve inside single steps', () => {
    const sol = parseSolution('# T\n\n## A\n\n- see [site][s]\n\n[s]: https://example.com\n');
    assert.match(sol.chapters[0].steps[0].html, /href="https:\/\/example\.com"/);
});
