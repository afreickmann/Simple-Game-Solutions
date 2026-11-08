// Dev tool, not shipped: node tests/audit-corpus.mjs [--files]
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSolution } from '../js/model.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const structure = JSON.parse(readFileSync(join(root, 'structure.json'), 'utf8'));
const files = [];
(function walk(n) {
    if (n.type === 'file') files.push(n);
    (n.children || []).forEach(walk);
})(structure);

const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; };

const rows = [];
for (const f of files) {
    const sol = parseSolution(readFileSync(join(root, 'solutions', f.path), 'utf8'));
    const steps = sol.chapters.flatMap(c => c.steps);
    const lens = steps.map(s => s.text.length);
    rows.push({
        name: f.name,
        chapters: sol.chapters.length,
        steps: steps.length,
        maxLen: Math.max(0, ...lens),
        medLen: median(lens),
        maxDepth: Math.max(0, ...steps.map(s => s.depth)),
        hasLists: sol.hasLists,
        emptyChapters: sol.chapters.filter(c => c.steps.length === 0).length,
        topLevel: sol.topLevel
    });
}

const ch = rows.map(r => r.chapters);
console.log(`files: ${rows.length}`);
console.log(`chapters per file: min ${Math.min(...ch)}, median ${median(ch)}, p90 ${pct(ch, 0.9)}, p99 ${pct(ch, 0.99)}, max ${Math.max(...ch)}`);
const buckets = [[0, 0], [1, 5], [6, 10], [11, 20], [21, 40], [41, 80], [81, Infinity]];
console.log('chapter count distribution:');
for (const [lo, hi] of buckets) {
    const n = rows.filter(r => r.chapters >= lo && r.chapters <= hi).length;
    console.log(`  ${hi === Infinity ? lo + '+' : lo === hi ? lo : lo + '-' + hi}: ${n}`);
}
const st = rows.map(r => r.steps);
console.log(`steps per file: min ${Math.min(...st)}, median ${median(st)}, max ${Math.max(...st)}`);
console.log(`max step text length: ${Math.max(...rows.map(r => r.maxLen))}, median of medians ${median(rows.map(r => r.medLen))}`);
console.log(`max nesting depth: ${Math.max(...rows.map(r => r.maxDepth))}`);
console.log(`topLevel heading depth: ${[2, 3, 4, 5, 6].map(d => `h${d}=${rows.filter(r => r.topLevel === d).length}`).join(' ')}`);

const flag = (label, list, show = r => r.name) => {
    console.log(`${label}: ${list.length}`);
    list.slice(0, 12).forEach(r => console.log('   - ' + show(r)));
    if (list.length > 12) console.log(`   ... +${list.length - 12} more`);
};
flag('files without lists (paragraph fallback)', rows.filter(r => !r.hasLists));
flag('files with zero steps', rows.filter(r => r.steps === 0));
flag('files with empty chapters', rows.filter(r => r.emptyChapters > 0), r => `${r.name} (${r.emptyChapters} of ${r.chapters})`);
flag('files with > 40 top-level chapters', rows.filter(r => r.chapters > 40), r => `${r.name} (${r.chapters})`);
flag('files with a single chapter', rows.filter(r => r.chapters === 1), r => `${r.name} (${r.steps} steps)`);
flag('files with zero chapters', rows.filter(r => r.chapters === 0));
flag('files with step text > 1000 chars', rows.filter(r => r.maxLen > 1000), r => `${r.name} (${r.maxLen})`);
flag('files with nesting depth > 4', rows.filter(r => r.maxDepth > 4), r => `${r.name} (${r.maxDepth})`);

if (process.argv.includes('--files')) {
    console.log('\nname\tchapters\tsteps\tmaxLen\tmedLen\tmaxDepth\tlists');
    rows.forEach(r => console.log([r.name, r.chapters, r.steps, r.maxLen, r.medLen, r.maxDepth, r.hasLists].join('\t')));
}
