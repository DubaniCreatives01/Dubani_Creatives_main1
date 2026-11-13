import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./js/supabase-client.js";
import { requireOwner } from "./js/auth-guard.js";
import {
    SIGNED_URL_SECONDS,
    inspectUpload,
    formatBytes,
    storagePath,
    saToday,
    expiryAlert,
    canPreview,
    isPdf,
    displayDate,
    cleanFolderName,
    cleanFileName,
    missingStarterFolders,
    extensionOf,
} from "./js/vault-logic.mjs";

const BUCKET = "company-vault";
const $ = (id) => document.getElementById(id);

const state = {
    session: null,
    folders: [],
    files: [],
    folderId: "all",
    query: "",
    view: localStorage.getItem("dc-vault-view") === "grid" ? "grid" : "list",
    today: saToday(),
    pendingDelete: null,
};

const uploadQueue = [];
let uploading = false;
let ready = false;

function errText(error) {
    if (!error) return "Request failed.";
    return [error.message, error.details, error.hint].filter(Boolean).join(" — ");
}

function missingTable(error) {
    const text = errText(error);
    return error?.code === "PGRST205" || error?.code === "42P01" || /vault_files|vault_folders/.test(text);
}

function showBanner(text, kind) {
    const banner = $("banner");
    banner.hidden = false;
    banner.className = "app-banner " + (kind || "");
    banner.textContent = text;
}

function clearBanner() {
    $("banner").hidden = true;
    $("banner").textContent = "";
}

function el(tag, props, children) {
    const node = document.createElement(tag);
    Object.entries(props || {}).forEach(([key, value]) => {
        if (value == null || value === false) return;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else node.setAttribute(key, value);
    });
    (children || []).forEach((child) => node.append(child));
    return node;
}

function openModal(id) {
    $(id).classList.add("active");
}

function closeModal(id) {
    $(id).classList.remove("active");
    if (id === "preview-modal") {
        $("preview-frame").src = "about:blank";
        $("preview-image").removeAttribute("src");
    }
    if (id === "delete-modal") state.pendingDelete = null;
}

function folderName(id) {
    return state.folders.find((folder) => folder.id === id)?.name || "Unknown folder";
}

function alerts() {
    return state.files
        .map((file) => ({ file, alert: expiryAlert(file.expires_on, state.today) }))
        .filter((row) => row.alert)
        .sort((a, b) => String(a.file.expires_on).localeCompare(String(b.file.expires_on)));
}

function visibleFiles() {
    const query = state.query.trim().toLowerCase();
    return state.files.filter((file) => {
        if (state.folderId !== "all" && file.folder_id !== state.folderId) return false;
        if (query && !file.name.toLowerCase().includes(query)) return false;
        return true;
    });
}

function renderFolders() {
    const list = $("folder-list");
    list.replaceChildren();
    const counts = new Map();
    state.files.forEach((file) => counts.set(file.folder_id, (counts.get(file.folder_id) || 0) + 1));
    const items = [{ id: "all", name: "All files", count: state.files.length }].concat(
        state.folders.map((folder) => ({ id: folder.id, name: folder.name, count: counts.get(folder.id) || 0 })),
    );
    items.forEach((folder) => {
        const button = el("button", {
            type: "button",
            class: "folder-btn" + (state.folderId === folder.id ? " active" : ""),
        }, [
            el("span", { text: folder.name }),
            el("small", { text: String(folder.count) }),
        ]);
        button.addEventListener("click", () => {
            state.folderId = folder.id;
            if (folder.id !== "all") $("upload-folder").value = folder.id;
            render();
        });
        list.append(button);
    });
    $("rename-folder-btn").disabled = state.folderId === "all";
}

function renderUploadFolders() {
    const select = $("upload-folder");
    const current = select.value;
    select.replaceChildren();
    state.folders.forEach((folder) => {
        select.append(el("option", { value: folder.id, text: folder.name }));
    });
    if (state.folderId !== "all" && state.folders.some((folder) => folder.id === state.folderId)) {
        select.value = state.folderId;
    } else if (state.folders.some((folder) => folder.id === current)) {
        select.value = current;
    }
}

function expiryBadge(file) {
    const alert = expiryAlert(file.expires_on, state.today);
    if (!alert) return null;
    return el("span", { class: "badge " + alert.level, text: alert.label });
}

function actionButtons(file) {
    const wrap = el("div", { class: "file-actions" });
    if (canPreview(file.mime_type)) {
        const preview = el("button", { type: "button", class: "btn btn-sm", text: "Preview" });
        preview.addEventListener("click", () => previewFile(file));
        wrap.append(preview);
    }
    const download = el("button", { type: "button", class: "btn btn-sm", text: "Download" });
    download.addEventListener("click", () => downloadFile(file));
    const edit = el("button", { type: "button", class: "btn btn-sm", text: "Rename / move" });
    edit.addEventListener("click", () => openEdit(file));
    const remove = el("button", { type: "button", class: "btn btn-sm btn-danger", text: "Delete" });
    remove.addEventListener("click", () => askDelete(file));
    wrap.append(download, edit, remove);
    return wrap;
}

function renderFiles() {
    const host = $("file-browser");
    const files = visibleFiles();
    const scope = state.folderId === "all" ? "all folders" : folderName(state.folderId);
    $("file-count").textContent = `${files.length} file${files.length === 1 ? "" : "s"} in ${scope}`;
    host.replaceChildren();
    if (!files.length) {
        host.append(el("p", { class: "empty-note", text: state.query ? "No files match that name." : "This folder is empty. Drop files above to store them." }));
        return;
    }
    if (state.view === "grid") {
        const grid = el("div", { class: "file-grid" });
        files.forEach((file) => {
            const title = el("div", { class: "file-name", text: file.name });
            const badge = expiryBadge(file);
            if (badge) title.append(badge);
            grid.append(el("article", { class: "file-card" }, [
                el("div", { class: "type-mark", text: (extensionOf(file.name) || "file").slice(0, 4).toUpperCase() }),
                title,
                el("p", { class: "meta", text: file.folder_name }),
                el("p", { class: "meta", text: `${formatBytes(file.size_bytes)} · ${displayDate(file.created_at)}` }),
                actionButtons(file),
            ]));
        });
        host.append(grid);
        return;
    }
    const table = el("table", { class: "file-table" });
    const head = el("tr", {}, ["Name", "Folder", "Size", "Uploaded", ""].map((label) => el("th", { text: label })));
    table.append(el("thead", {}, [head]));
    const body = el("tbody");
    files.forEach((file) => {
        const name = el("td", {}, [el("span", { class: "file-name", text: file.name })]);
        const badge = expiryBadge(file);
        if (badge) name.append(badge);
        body.append(el("tr", {}, [
            name,
            el("td", { text: file.folder_name }),
            el("td", { text: formatBytes(file.size_bytes) }),
            el("td", { class: "hide-sm", text: displayDate(file.created_at) }),
            el("td", {}, [actionButtons(file)]),
        ]));
    });
    table.append(body);
    host.append(table);
}

function renderAlerts() {
    const host = $("expiry-banner");
    const rows = alerts();
    host.replaceChildren();
    if (!rows.length) {
        host.classList.add("hidden");
        return;
    }
    host.classList.remove("hidden");
    const list = el("ul");
    rows.forEach(({ file, alert }) => {
        const button = el("button", { type: "button", class: "btn btn-sm", text: "Show" });
        button.addEventListener("click", () => {
            state.folderId = file.folder_id;
            state.query = file.name;
            $("search").value = file.name;
            render();
        });
        list.append(el("li", { class: "level-" + alert.level }, [
            document.createTextNode(`${file.name} · ${file.folder_name} · ${alert.label} (${file.expires_on}) `),
            button,
        ]));
    });
    host.append(el("h2", { text: "Certificates and documents needing attention" }), list);
}

function render() {
    $("view-list").classList.toggle("active", state.view === "list");
    $("view-grid").classList.toggle("active", state.view === "grid");
    renderFolders();
    renderUploadFolders();
    renderAlerts();
    renderFiles();
}

async function signedUrl(path) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
    if (error) throw error;
    return data.signedUrl;
}

async function previewFile(file) {
    try {
        const url = await signedUrl(file.storage_path);
        $("preview-title").textContent = file.name;
        const frame = $("preview-frame");
        const image = $("preview-image");
        if (isPdf(file.mime_type)) {
            image.hidden = true;
            image.removeAttribute("src");
            frame.hidden = false;
            frame.src = url;
        } else {
            frame.hidden = true;
            frame.src = "about:blank";
            image.hidden = false;
            image.alt = file.name;
            image.src = url;
        }
        openModal("preview-modal");
    } catch (error) {
        showBanner(errText(error), "error");
    }
}

async function downloadFile(file) {
    try {
        const url = await signedUrl(file.storage_path);
        const response = await fetch(url);
        if (!response.ok) throw new Error("Download failed.");
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = el("a", { href: objectUrl, download: file.name });
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    } catch (error) {
        try {
            const url = await signedUrl(file.storage_path);
            window.open(url, "_blank", "noopener");
        } catch (inner) {
            showBanner(errText(inner || error), "error");
        }
    }
}

function openEdit(file) {
    $("edit-id").value = file.id;
    $("edit-name").value = file.name;
    const select = $("edit-folder");
    select.replaceChildren();
    state.folders.forEach((folder) => select.append(el("option", { value: folder.id, text: folder.name })));
    select.value = file.folder_id;
    $("edit-expiry").value = file.expires_on || "";
    openModal("edit-modal");
    $("edit-name").focus();
}

function askDelete(file) {
    state.pendingDelete = file;
    $("delete-name").textContent = file.name;
    openModal("delete-modal");
}

async function saveEdit(event) {
    event.preventDefault();
    const id = $("edit-id").value;
    const name = cleanFileName($("edit-name").value);
    if (!name) {
        showBanner("Enter a file name without slashes.", "error");
        return;
    }
    const folderId = $("edit-folder").value;
    const expiresOn = $("edit-expiry").value || null;
    const { error } = await supabase.from("vault_files").update({
        name,
        folder_id: folderId,
        expires_on: expiresOn,
    }).eq("id", id);
    if (error) {
        showBanner(errText(error), "error");
        return;
    }
    closeModal("edit-modal");
    showBanner("File updated.", "ok");
    await loadFiles();
    render();
}

async function confirmDelete() {
    const file = state.pendingDelete;
    if (!file) return;
    $("confirm-delete").disabled = true;
    const removed = await supabase.storage.from(BUCKET).remove([file.storage_path]);
    if (removed.error) {
        $("confirm-delete").disabled = false;
        showBanner(errText(removed.error), "error");
        return;
    }
    const { error } = await supabase.from("vault_files").delete().eq("id", file.id);
    $("confirm-delete").disabled = false;
    if (error) {
        showBanner(`The stored file was removed, but the record remains: ${errText(error)}`, "error");
        return;
    }
    closeModal("delete-modal");
    showBanner("File deleted.", "ok");
    state.files = state.files.filter((row) => row.id !== file.id);
    render();
}

async function addFolder(event) {
    event.preventDefault();
    const name = cleanFolderName($("new-folder-name").value);
    if (!name) {
        showBanner("Enter a folder name.", "error");
        return;
    }
    const { error } = await supabase.from("vault_folders").insert({ name });
    if (error) {
        showBanner(error.code === "23505" ? "A folder with that name already exists." : errText(error), "error");
        return;
    }
    $("new-folder-name").value = "";
    showBanner(`Folder “${name}” added.`, "ok");
    await loadFolders();
    const created = state.folders.find((folder) => folder.name.toLowerCase() === name.toLowerCase());
    if (created) state.folderId = created.id;
    render();
}

async function renameFolder(event) {
    event.preventDefault();
    if (state.folderId === "all") return;
    const name = cleanFolderName($("rename-folder-name").value);
    if (!name) {
        showBanner("Enter a folder name.", "error");
        return;
    }
    const { error } = await supabase.from("vault_folders").update({ name }).eq("id", state.folderId);
    if (error) {
        showBanner(error.code === "23505" ? "A folder with that name already exists." : errText(error), "error");
        return;
    }
    closeModal("rename-folder-modal");
    showBanner("Folder renamed.", "ok");
    await loadFolders();
    render();
}

async function loadFolders() {
    const { data, error } = await supabase.from("vault_folders").select("id, name, created_at").order("name");
    if (error) throw error;
    state.folders = data || [];
}

async function loadFiles() {
    const { data, error } = await supabase
        .from("vault_files")
        .select("id, folder_id, name, storage_path, mime_type, size_bytes, expires_on, created_at")
        .order("created_at", { ascending: false });
    if (error) throw error;
    state.files = (data || []).map((row) => ({
        ...row,
        folder_name: folderName(row.folder_id),
    }));
}

async function ensureFolders() {
    await loadFolders();
    const missing = missingStarterFolders(state.folders.map((folder) => folder.name));
    if (!missing.length) return;
    const inserted = await supabase.from("vault_folders").insert(missing.map((name) => ({ name })));
    if (inserted.error && inserted.error.code !== "23505") throw inserted.error;
    await loadFolders();
}

async function boot() {
    try {
        await ensureFolders();
        await loadFiles();
        clearBanner();
        ready = true;
        render();
    } catch (error) {
        if (missingTable(error)) {
            showBanner("The vault database is not set up yet. Apply supabase/migrations/20261113120500_company_vault.sql in the Supabase SQL editor, then reload this page.", "error");
            return;
        }
        showBanner(errText(error), "error");
    }
}

function readStorageError(xhr) {
    try {
        const body = JSON.parse(xhr.responseText);
        return body.message || body.error || body.msg || `Upload failed (${xhr.status}).`;
    } catch {
        return xhr.status ? `Upload failed (${xhr.status}).` : "Upload failed.";
    }
}

function uploadObject(path, file, mime, token, onProgress) {
    return new Promise((resolve, reject) => {
        const typed = new File([file], file.name, { type: mime });
        const body = new FormData();
        body.append("cacheControl", "3600");
        body.append("", typed);
        const xhr = new XMLHttpRequest();
        const encoded = path.split("/").map((part) => encodeURIComponent(part)).join("/");
        xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("apikey", SUPABASE_PUBLISHABLE_KEY);
        xhr.setRequestHeader("x-upsert", "false");
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) onProgress(event.loaded / event.total);
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                onProgress(1);
                resolve();
                return;
            }
            reject(new Error(readStorageError(xhr)));
        };
        xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
        xhr.send(body);
    });
}

function queueRow(name) {
    const bar = el("span");
    const label = el("strong", { text: "Waiting…" });
    const row = el("li", { class: "upload-row" }, [
        el("header", {}, [el("span", { text: name }), label]),
        el("div", { class: "progress" }, [bar]),
    ]);
    $("upload-queue").prepend(row);
    return {
        progress(ratio) {
            bar.style.width = `${Math.round(ratio * 100)}%`;
            label.textContent = `${Math.round(ratio * 100)}%`;
        },
        fail(message) {
            row.classList.add("error");
            label.textContent = message;
        },
        done() {
            label.textContent = "Uploaded";
            bar.style.width = "100%";
        },
    };
}

async function uploadOne(file) {
    const checked = inspectUpload(file);
    const row = queueRow(file.name || "File");
    if (!checked.ok) {
        row.fail(checked.error);
        return false;
    }
    const folderId = $("upload-folder").value;
    if (!folderId) {
        row.fail("Add a folder before uploading.");
        return false;
    }
    const fileId = crypto.randomUUID();
    const path = storagePath(state.session.user.id, fileId, checked.name);
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) throw new Error("Your session expired. Sign in again.");
        row.progress(0);
        await uploadObject(path, file, checked.mime, data.session.access_token, row.progress);
        const inserted = await supabase.from("vault_files").insert({
            id: fileId,
            folder_id: folderId,
            name: checked.name,
            storage_path: path,
            mime_type: checked.mime,
            size_bytes: checked.size,
        });
        if (inserted.error) {
            await supabase.storage.from(BUCKET).remove([path]);
            throw inserted.error;
        }
        row.done();
        return true;
    } catch (error) {
        row.fail(errText(error));
        return false;
    }
}

async function pump() {
    if (uploading) return;
    uploading = true;
    let ok = 0;
    let failed = 0;
    while (true) {
        if (!uploadQueue.length) {
            await Promise.resolve();
            if (!uploadQueue.length) break;
        }
        const file = uploadQueue.shift();
        if (await uploadOne(file)) ok += 1;
        else failed += 1;
    }
    uploading = false;
    if (ok) {
        await loadFiles();
        render();
    }
    if (ok || failed) {
        showBanner(`Uploaded ${ok} file${ok === 1 ? "" : "s"}${failed ? `. ${failed} failed.` : "."}`, failed ? "error" : "ok");
    }
}

function enqueue(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    if (!ready) {
        showBanner("The vault is still loading.", "loading");
        return;
    }
    if (!$("upload-folder").value) {
        showBanner("Choose a folder to upload into.", "error");
        return;
    }
    files.forEach((file) => uploadQueue.push(file));
    pump();
}

function bind() {
    $("logout-btn").addEventListener("click", async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            showBanner(errText(error), "error");
            return;
        }
        location.href = "login.html";
    });
    $("search").addEventListener("input", () => {
        state.query = $("search").value;
        renderFiles();
        renderAlerts();
    });
    $("view-list").addEventListener("click", () => {
        state.view = "list";
        localStorage.setItem("dc-vault-view", "list");
        render();
    });
    $("view-grid").addEventListener("click", () => {
        state.view = "grid";
        localStorage.setItem("dc-vault-view", "grid");
        render();
    });
    $("browse-btn").addEventListener("click", () => $("file-input").click());
    $("file-input").addEventListener("change", () => {
        enqueue($("file-input").files);
        $("file-input").value = "";
    });
    const zone = $("dropzone");
    ["dragenter", "dragover"].forEach((name) => {
        zone.addEventListener(name, (event) => {
            event.preventDefault();
            zone.classList.add("dragover");
        });
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
    zone.addEventListener("drop", (event) => {
        event.preventDefault();
        zone.classList.remove("dragover");
        enqueue(event.dataTransfer?.files);
    });
    window.addEventListener("dragover", (event) => event.preventDefault());
    window.addEventListener("drop", (event) => {
        if (event.target.closest("#dropzone")) return;
        event.preventDefault();
        enqueue(event.dataTransfer?.files);
    });
    $("new-folder-form").addEventListener("submit", addFolder);
    $("edit-form").addEventListener("submit", saveEdit);
    $("rename-folder-form").addEventListener("submit", renameFolder);
    $("confirm-delete").addEventListener("click", confirmDelete);
    $("rename-folder-btn").addEventListener("click", () => {
        const folder = state.folders.find((row) => row.id === state.folderId);
        if (!folder) return;
        $("rename-folder-name").value = folder.name;
        openModal("rename-folder-modal");
        $("rename-folder-name").focus();
    });
    document.querySelectorAll("[data-close]").forEach((button) => {
        button.addEventListener("click", () => closeModal(button.getAttribute("data-close")));
    });
    document.querySelectorAll(".modal-overlay").forEach((overlay) => {
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) closeModal(overlay.id);
        });
    });
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        document.querySelectorAll(".modal-overlay.active").forEach((overlay) => closeModal(overlay.id));
    });
}

const session = await requireOwner();
if (session) {
    state.session = session;
    state.today = saToday();
    bind();
    boot();
}
