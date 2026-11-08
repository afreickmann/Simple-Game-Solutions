import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { matchQuery, languageOf, gameTitle, searchGames, searchSteps } from "../js/search.js";

test("matchQuery: empty, AND, OR, UND, ODER", () => {
    assert.equal(matchQuery("monkey island", ""), true);
    assert.equal(matchQuery("monkey island", "   "), true);
    assert.equal(matchQuery("monkey island", "monkey island"), true);
    assert.equal(matchQuery("monkey island", "monkey and island"), true);
    assert.equal(matchQuery("monkey island", "monkey und island"), true);
    assert.equal(matchQuery("monkey island", "monkey and tentacle"), false);
    assert.equal(matchQuery("monkey island", "tentacle or island"), true);
    assert.equal(matchQuery("monkey island", "tentacle oder island"), true);
    assert.equal(matchQuery("monkey island", "tentacle oder zak"), false);
    assert.equal(matchQuery("maniac mansion", "MANIAC"), true);
    assert.equal(matchQuery("x", "and"), false);
});

test("languageOf and gameTitle", () => {
    assert.equal(languageOf("Monkey Island-EN.md"), "EN");
    assert.equal(languageOf("M/Maniac Mansion-DE.md"), "DE");
    assert.equal(languageOf("Foo-IT.md"), null);
    assert.equal(languageOf("Foo.md"), null);
    assert.equal(gameTitle("M/Maniac Mansion-DE.md"), "Maniac Mansion");
    assert.equal(gameTitle("Gobliiins 5-EN"), "Gobliiins 5");
});

test("searchGames with lang and scope", () => {
    const files = [
        { name: "Monkey Island-EN", path: "M/Monkey Island-EN.md" },
        { name: "Monkey Island-DE", path: "M/Monkey Island-DE.md" },
        { name: "Maniac Mansion-DE", path: "M/Maniac Mansion-DE.md" }
    ];
    assert.equal(searchGames(files, "monkey").length, 2);
    assert.deepEqual(searchGames(files, "monkey", { lang: "DE" }).map(f => f.path), ["M/Monkey Island-DE.md"]);
    assert.equal(searchGames(files, "", { lang: "DE" }).length, 2);
    const scope = new Set(["M/Maniac Mansion-DE.md"]);
    assert.deepEqual(searchGames(files, "", { scopePaths: scope }).map(f => f.path), ["M/Maniac Mansion-DE.md"]);
    assert.equal(searchGames(files, "monkey", { scopePaths: scope }).length, 0);
});

const solution = {
    chapters: [
        { title: "Kitchen", steps: [{ text: "talk to cook" }, { text: "take pan ZEBRAMARKER" }, { text: "leave" }] },
        { title: "Lighthouse SECRETCHAPTER", steps: [{ text: "climb stairs" }] }
    ]
};

test("searchSteps normal mode searches everything", () => {
    assert.equal(searchSteps(solution, "zebramarker").length, 1);
    const r = searchSteps(solution, "secretchapter");
    assert.equal(r.length, 1);
    assert.equal(r[0].kind, "chapter");
    assert.equal(r[0].stepIndex, null);
    assert.deepEqual(searchSteps(solution, ""), []);
});

test("searchSteps guided scope never leaks later steps or chapter titles", () => {
    assert.deepEqual(searchSteps(solution, "zebramarker", { c: 0, r: 1 }), []);
    assert.equal(searchSteps(solution, "zebramarker", { c: 0, r: 2 }).length, 1);
    assert.deepEqual(searchSteps(solution, "secretchapter", { c: 0, r: 3 }), []);
    assert.deepEqual(searchSteps(solution, "kitchen", { c: null, r: 0 }), []);
    assert.equal(searchSteps(solution, "kitchen", { c: 0, r: 0 }).length, 1);
    assert.deepEqual(searchSteps(solution, "climb", { c: 0, r: 3 }), []);
});

test("every file in structure.json maps to exactly one language", () => {
    const data = JSON.parse(readFileSync(new URL("../structure.json", import.meta.url), "utf8"));
    const files = [];
    (function walk(n) { if (n.type === "file") files.push(n); (n.children || []).forEach(walk); })(data);
    assert.ok(files.length > 500);
    for (const f of files) {
        const lang = languageOf(f.name);
        assert.ok(lang === "DE" || lang === "EN", f.name);
    }
});
