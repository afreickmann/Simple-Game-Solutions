const MAX_IMPORT_VALUE = 500000;

function safeStorage() { try { return globalThis.localStorage; } catch (e) { return null; } }

export function createStore(storage = safeStorage()) {
    const memory = new Map();
    let persistent = true;

    function probe() {
        try {
            if (!storage) return false;
            const k = "sgs__probe";
            storage.setItem(k, "1");
            storage.removeItem(k);
            return true;
        } catch (e) {
            return false;
        }
    }
    persistent = probe();

    function get(key) {
        if (persistent) {
            try { return storage.getItem(key); } catch (e) { persistent = false; }
        }
        return memory.has(key) ? memory.get(key) : null;
    }
    function set(key, val) {
        const value = String(val);
        if (persistent) {
            try { storage.setItem(key, value); return true; } catch (e) { persistent = false; }
        }
        memory.set(key, value);
        return false;
    }
    function remove(key) {
        if (persistent) {
            try { storage.removeItem(key); return; } catch (e) { persistent = false; }
        }
        memory.delete(key);
    }
    function sgsKeys() {
        const keys = [];
        if (persistent) {
            try {
                for (let i = 0; i < storage.length; i++) {
                    const k = storage.key(i);
                    if (k && k.startsWith("sgs_")) keys.push(k);
                }
                return keys;
            } catch (e) { persistent = false; }
        }
        for (const k of memory.keys()) if (k.startsWith("sgs_")) keys.push(k);
        return keys;
    }
    function readJsonArray(key) {
        try {
            const v = JSON.parse(get(key) || "[]");
            return Array.isArray(v) ? v.filter(x => typeof x === "string") : [];
        } catch (e) { return []; }
    }
    function readJsonObject(key) {
        try {
            const v = JSON.parse(get(key) || "{}");
            return (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
        } catch (e) { return {}; }
    }
    function writeJson(key, value) {
        return set(key, JSON.stringify(value));
    }

    const GAME_STATUSES = ["playing", "done"];

    function getFavorites() { return readJsonArray("sgs_favorites"); }
    function isFavorite(path) { return getFavorites().includes(path); }
    function setFavorite(path, on) {
        const favs = getFavorites().filter(p => p !== path);
        if (on) favs.push(path);
        writeJson("sgs_favorites", favs);
    }
    function toggleFavorite(path) { setFavorite(path, !isFavorite(path)); }

    function statusMap() {
        const raw = readJsonObject("sgs_game_status");
        const map = {};
        Object.keys(raw).forEach(path => {
            if (GAME_STATUSES.includes(raw[path])) map[path] = raw[path];
        });
        return map;
    }
    function getStatus(path) { return statusMap()[path] || null; }
    function setStatus(path, status) {
        const map = statusMap();
        if (GAME_STATUSES.includes(status)) map[path] = status; else delete map[path];
        writeJson("sgs_game_status", map);
    }

    function recentFiles() { return readJsonArray("sgs_recent_files"); }
    function trackRecent(path) {
        const recent = recentFiles().filter(p => p !== path);
        recent.unshift(path);
        writeJson("sgs_recent_files", recent.slice(0, 20));
    }

    function readMap() { return readJsonObject("sgs_read_v2"); }
    function isUnread(file, map = readMap()) {
        const seen = map[file.path];
        if (!seen) return true;
        if (!file.last_modified) return false;
        return new Date(file.last_modified) > new Date(seen);
    }
    function markRead(file) {
        const map = readMap();
        map[file.path] = file.last_modified || new Date().toISOString();
        writeJson("sgs_read_v2", map);
    }
    function markAllRead(files) {
        const map = readMap();
        files.forEach(file => { map[file.path] = file.last_modified || new Date().toISOString(); });
        writeJson("sgs_read_v2", map);
    }
    function unreadCount(files) {
        const map = readMap();
        return files.filter(file => isUnread(file, map)).length;
    }
    function migrateReadState(indexFn) {
        if (get("sgs_read_modified_files") === null) return;
        if (get("sgs_read_v2") === null) {
            const map = {};
            readJsonArray("sgs_read_modified_files").forEach(p => {
                const node = indexFn ? indexFn(p) : null;
                if (node) map[p] = node.last_modified || new Date().toISOString();
            });
            writeJson("sgs_read_v2", map);
        }
        remove("sgs_read_modified_files");
    }

    function getLastFile() { return get("sgs_last_file") || null; }
    function setLastFile(p) { set("sgs_last_file", p); }
    function clearLastFile() { remove("sgs_last_file"); }

    function getLang() {
        const saved = get("sgs_lang");
        if (saved === "de" || saved === "en") return saved;
        const nav = (typeof navigator !== "undefined" && navigator) ? (navigator.language || navigator.userLanguage) : null;
        if (nav && nav.startsWith("en")) return "en";
        return "de";
    }
    function setLang(lang) { if (lang === "de" || lang === "en") set("sgs_lang", lang); }

    function getFontScale() {
        const n = parseInt(get("sgs_font_scale") || "100", 10);
        return n >= 50 && n <= 200 ? n : 100;
    }
    function setFontScale(n) { set("sgs_font_scale", n); }

    function getTreeScope() {
        const saved = get("sgs_tree_scope");
        return (saved === "favorites" || saved === "mine") ? saved : "all";
    }
    function setTreeScope(scope) {
        if (scope === "favorites" || scope === "mine") set("sgs_tree_scope", scope); else remove("sgs_tree_scope");
    }

    function getMode() { return get("sgs_mode") === "database" ? "database" : "guided"; }
    function setMode(mode) { set("sgs_mode", mode === "guided" ? "guided" : "database"); }

    function guidedAll() {
        const raw = readJsonObject("sgs_guided_progress");
        const out = {};
        Object.keys(raw).forEach(path => {
            const e = raw[path];
            if (e && typeof e === "object" && Number.isFinite(e.c) && Number.isFinite(e.r)
                && typeof e.t === "string" && typeof e.h === "string") {
                out[path] = { c: e.c, r: e.r, t: e.t, h: e.h };
                if (Number.isInteger(e.s) && e.s > 0) out[path].s = e.s;
                if (Array.isArray(e.rc)) out[path].rc = e.rc.filter(n => Number.isInteger(n) && n >= 0 && n < 5000).slice(0, 5000);
            }
        });
        return out;
    }
    function guidedProgress(path) { return guidedAll()[path] || null; }
    function setGuidedProgress(path, obj) {
        const all = guidedAll();
        if (obj) {
            all[path] = { c: obj.c, r: obj.r, t: obj.t, h: obj.h };
            if (Number.isInteger(obj.s) && obj.s > 0) all[path].s = obj.s;
            if (Array.isArray(obj.rc)) all[path].rc = obj.rc.filter(n => Number.isInteger(n) && n >= 0 && n < 5000).slice(0, 5000);
        } else delete all[path];
        writeJson("sgs_guided_progress", all);
    }

    function exportAll() {
        const data = {};
        sgsKeys().forEach(k => {
            const v = get(k);
            if (typeof v === "string") data[k] = v;
        });
        return data;
    }
    function importAll(obj) {
        if (typeof obj !== "object" || obj === null || Array.isArray(obj)) throw new Error("Invalid format");
        const entries = Object.entries(obj).filter(([key, value]) =>
            key.startsWith("sgs_") && typeof value === "string" && value.length < MAX_IMPORT_VALUE);
        if (entries.length === 0) throw new Error("No valid settings found");
        sgsKeys().forEach(k => remove(k));
        entries.forEach(([k, v]) => set(k, v));
        return entries.length;
    }

    return {
        get persistent() { return persistent; },
        get, set, remove, readJsonArray, readJsonObject, writeJson,
        getFavorites, isFavorite, setFavorite, toggleFavorite,
        statusMap, getStatus, setStatus,
        recentFiles, trackRecent,
        readMap, isUnread, markRead, markAllRead, unreadCount, migrateReadState,
        getLastFile, setLastFile, clearLastFile,
        getLang, setLang, getFontScale, setFontScale,
        getTreeScope, setTreeScope, getMode, setMode,
        guidedProgress, setGuidedProgress,
        exportAll, importAll
    };
}
