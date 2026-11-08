import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../js/store.js";

function fakeStorage(initial = {}) {
    const data = new Map(Object.entries(initial));
    return {
        data,
        getItem: k => (data.has(k) ? data.get(k) : null),
        setItem: (k, v) => { data.set(k, String(v)); },
        removeItem: k => { data.delete(k); },
        key: i => Array.from(data.keys())[i] ?? null,
        get length() { return data.size; }
    };
}

test("throwing storage falls back to memory without crashing", () => {
    const bad = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); }, key() { return null; }, length: 0 };
    const s = createStore(bad);
    assert.equal(s.persistent, false);
    s.setFavorite("a.md", true);
    assert.deepEqual(s.getFavorites(), ["a.md"]);
    s.setStatus("a.md", "done");
    assert.equal(s.getStatus("a.md"), "done");
    const none = createStore(undefined);
    none.trackRecent("x.md");
    assert.deepEqual(none.recentFiles(), ["x.md"]);
});

test("favorites, status, recent, last file, settings", () => {
    const s = createStore(fakeStorage());
    assert.equal(s.persistent, true);
    s.toggleFavorite("a.md"); s.toggleFavorite("b.md"); s.toggleFavorite("a.md");
    assert.deepEqual(s.getFavorites(), ["b.md"]);
    s.setStatus("a.md", "playing"); s.setStatus("b.md", "bogus"); s.setStatus("c.md", "done");
    assert.deepEqual(s.statusMap(), { "a.md": "playing", "c.md": "done" });
    s.setStatus("a.md", null);
    assert.equal(s.getStatus("a.md"), null);
    for (let i = 0; i < 25; i++) s.trackRecent(`g${i}.md`);
    s.trackRecent("g3.md");
    const recent = s.recentFiles();
    assert.equal(recent.length, 20);
    assert.equal(recent[0], "g3.md");
    s.setLastFile("x.md"); assert.equal(s.getLastFile(), "x.md"); s.clearLastFile(); assert.equal(s.getLastFile(), null);
    const navLang = (globalThis.navigator && globalThis.navigator.language) || ""; assert.equal(s.getLang(), navLang.startsWith("en") ? "en" : "de"); s.setLang("de"); assert.equal(s.getLang(), "de"); s.setLang("en"); assert.equal(s.getLang(), "en");
    assert.equal(s.getFontScale(), 100); s.setFontScale(120); assert.equal(s.getFontScale(), 120); s.setFontScale(999); assert.equal(s.getFontScale(), 100);
    assert.equal(s.getTreeScope(), "all"); s.setTreeScope("mine"); assert.equal(s.getTreeScope(), "mine"); s.setTreeScope("all"); assert.equal(s.getTreeScope(), "all");
    assert.equal(s.getMode(), "guided"); s.setMode("database"); assert.equal(s.getMode(), "database");
});

test("read state and migration", () => {
    const st = fakeStorage({ sgs_read_modified_files: JSON.stringify(["a.md", "gone.md"]) });
    const s = createStore(st);
    const files = [{ path: "a.md", last_modified: "2026-01-01T00:00:00Z" }, { path: "b.md", last_modified: "2026-01-02T00:00:00Z" }];
    s.migrateReadState(p => files.find(f => f.path === p));
    assert.equal(st.getItem("sgs_read_modified_files"), null);
    assert.deepEqual(Object.keys(s.readMap()), ["a.md"]);
    assert.equal(s.isUnread(files[0]), false);
    assert.equal(s.isUnread(files[1]), true);
    assert.equal(s.unreadCount(files), 1);
    s.markRead(files[1]);
    assert.equal(s.unreadCount(files), 0);
    s.markAllRead(files);
    assert.equal(s.isUnread({ path: "a.md", last_modified: "2026-02-01T00:00:00Z" }), true);
});

test("guided progress roundtrip, validation and corrupt JSON", () => {
    const st = fakeStorage();
    const s = createStore(st);
    s.setGuidedProgress("a.md", { c: 2, r: 5, t: "Kitchen", h: "abc" });
    assert.deepEqual(s.guidedProgress("a.md"), { c: 2, r: 5, t: "Kitchen", h: "abc" });
    st.setItem("sgs_guided_progress", JSON.stringify({ "a.md": { c: 2, r: 5, t: "K", h: "x" }, "bad.md": { c: "x", r: 1 }, "bad2.md": 5 }));
    assert.equal(s.guidedProgress("bad.md"), null);
    assert.equal(s.guidedProgress("bad2.md"), null);
    assert.equal(s.guidedProgress("a.md").t, "K");
    st.setItem("sgs_guided_progress", "{not json");
    assert.equal(s.guidedProgress("a.md"), null);
    s.setGuidedProgress("a.md", { c: 0, r: 1, t: "T", h: "h" });
    s.setGuidedProgress("a.md", null);
    assert.equal(s.guidedProgress("a.md"), null);
});

test("exportAll/importAll roundtrip and original export fixture", () => {
    const st = fakeStorage({ other_app: "keep", sgs_old: "x" });
    const s = createStore(st);
    s.setFavorite("a.md", true);
    s.setGuidedProgress("a.md", { c: 1, r: 2, t: "T", h: "h" });
    const exp = s.exportAll();
    assert.ok(exp.sgs_favorites && exp.sgs_guided_progress && exp.sgs_old);
    assert.equal(exp.other_app, undefined);

    const fixture = {
        sgs_favorites: JSON.stringify(["M/Monkey Island-EN.md"]),
        sgs_game_status: JSON.stringify({ "M/Monkey Island-EN.md": "playing" }),
        sgs_recent_files: JSON.stringify(["M/Monkey Island-EN.md"]),
        sgs_read_v2: JSON.stringify({ "M/Monkey Island-EN.md": "2026-01-01T00:00:00Z" }),
        sgs_lang: "en",
        sgs_font_scale: "120",
        sgs_spoiler_mode: "1",
        not_ours: "ignored",
        sgs_number: 5
    };
    const st2 = fakeStorage({ other_app: "keep", sgs_old: "gone" });
    const s2 = createStore(st2);
    assert.equal(s2.importAll(fixture), 7);
    assert.deepEqual(s2.getFavorites(), ["M/Monkey Island-EN.md"]);
    assert.equal(s2.getStatus("M/Monkey Island-EN.md"), "playing");
    assert.deepEqual(s2.recentFiles(), ["M/Monkey Island-EN.md"]);
    assert.equal(s2.getLang(), "en");
    assert.equal(s2.getFontScale(), 120);
    assert.equal(s2.get("sgs_spoiler_mode"), "1");
    assert.equal(st2.getItem("other_app"), "keep");
    assert.equal(st2.getItem("sgs_old"), null);
    assert.equal(st2.getItem("not_ours"), null);

    assert.throws(() => s2.importAll([]), /Invalid format/);
    assert.throws(() => s2.importAll(null), /Invalid format/);
    assert.throws(() => s2.importAll({ foo: "bar" }), /No valid settings found/);
    assert.throws(() => s2.importAll({ sgs_big: "x".repeat(500000) }), /No valid settings found/);
});
