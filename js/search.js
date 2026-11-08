// forgiving text: case, accents, apostrophes (also iOS smart quotes) and separators don't matter
export function fold(text) {
    return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[’‘'`´]/g, "").replace(/[-–—:;,.!?()\[\]"“”„]/g, " ").replace(/\s+/g, " ");
}
export function matchQuery(nameLower, query) {
    const q = String(query || "").trim();
    if (!q) return true;
    nameLower = fold(nameLower);
    const orClauses = fold(q).split(/\b(?:or|oder)\b/);
    return orClauses.some(clause => {
        const cleanClause = clause.replace(/\b(?:and|und)\b/g, " ");
        const terms = cleanClause.split(/\s+/).filter(t => t.length > 0);
        if (terms.length === 0) return false;
        return terms.every(term => nameLower.includes(term));
    });
}

function baseName(name) {
    const last = String(name || "").split("/").pop();
    return last.replace(/\.(md|txt)$/i, "");
}

export function languageOf(name) {
    const m = baseName(name).match(/-(DE|EN)$/);
    return m ? m[1] : null;
}

export function gameTitle(name) {
    return baseName(name).replace(/-(DE|EN)$/, "");
}

export function searchGames(files, query, { lang = null, scopePaths = null } = {}) {
    return files.filter(file => {
        if (scopePaths && !scopePaths.has(file.path)) return false;
        if (lang && languageOf(file.name) !== lang) return false;
        return matchQuery(String(file.name).toLowerCase(), query);
    });
}

export function searchSteps(solution, query, scope = null) {
    const q = String(query || "").trim();
    if (!q || !solution || !Array.isArray(solution.chapters)) return [];
    const hits = [];
    const chapters = solution.chapters;
    const visit = (chapterIndex, stepLimit) => {
        const chapter = chapters[chapterIndex];
        if (!chapter) return;
        if (matchQuery(String(chapter.title || "").toLowerCase(), q)) {
            hits.push({ chapterIndex, stepIndex: null, kind: "chapter", text: chapter.title });
        }
        const steps = chapter.steps || [];
        const limit = Math.min(steps.length, stepLimit);
        for (let i = 0; i < limit; i++) {
            const text = String(steps[i].text || "");
            if (matchQuery(text.toLowerCase(), q)) {
                hits.push({ chapterIndex, stepIndex: i, kind: "step", text });
            }
        }
    };
    if (scope === null) {
        chapters.forEach((_, i) => visit(i, Infinity));
    } else {
        if (scope.c === null || scope.c === undefined) return [];
        visit(scope.c, Math.max(0, Number(scope.r) || 0));
    }
    return hits;
}

// fallback when nothing matches exactly: plurals and small typos (one edit, two for long words)
function near(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 99;
    const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
        let diag = prev[0]; prev[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const tmp = prev[j];
            prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
            diag = tmp;
        }
    }
    return prev[b.length];
}
function termNear(words, term) {
    const stems = [term, term.replace(/(es|s|e|en|n)$/, "")].filter(x => x.length >= 3);
    const allowed = term.length >= 7 ? 2 : term.length >= 4 ? 1 : 0;
    return words.some(w => stems.some(st => w.startsWith(st)) || (allowed && (near(w, term) <= allowed || near(w.slice(0, term.length), term) <= allowed)));
}
export function matchQueryFuzzy(text, query) {
    const q = fold(query).replace(/\b(?:and|und|or|oder)\b/g, " ").trim();
    if (!q) return false;
    const words = fold(text).split(" ").filter(Boolean);
    return q.split(" ").filter(Boolean).every(term => termNear(words, term));
}
export function searchGamesFuzzy(files, query, { lang = null } = {}) {
    return files.filter(file => (!lang || languageOf(file.name) === lang) && matchQueryFuzzy(gameTitle(file.name), query));
}
export function searchStepsFuzzy(solution, query) {
    const hits = [];
    (solution && solution.chapters || []).forEach((ch, ci) => (ch.steps || []).forEach((st, i) => { if (matchQueryFuzzy(st.text, query)) hits.push({ chapterIndex: ci, stepIndex: i, kind: "step", text: st.text }); }));
    return hits;
}
