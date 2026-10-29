import { supabase, OWNER_ID } from "./supabase-client.js";

function appPrefix() {
    return /\/(handscribe|patternforge)\//.test(location.pathname) ? "../" : "";
}

function loginHref() {
    const next = location.pathname + location.search;
    return `${appPrefix()}login.html?next=${encodeURIComponent(next)}`;
}

function showBlocked(message) {
    document.documentElement.classList.add("dc-ready");
    const home = appPrefix() || "./";
    document.body.innerHTML = `
        <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0d0d0d;color:#f0f0f0;font-family:Inter,system-ui,sans-serif;padding:24px;text-align:center;">
            <div>
                <h1 style="font-family:Outfit,Inter,sans-serif;font-size:1.7rem;margin-bottom:12px;">${message}</h1>
                <p style="color:#888;margin-bottom:20px;">This area is limited to the Dubani Creatives account owner.</p>
                <a href="${home}login.html" style="color:#ff5e00;font-weight:600;">Back to login</a>
            </div>
        </main>`;
}

async function runGate() {
    const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Sign-in check timed out. Check your connection and refresh.")), 12000);
    });
    let session = null;
    try {
        const result = await Promise.race([supabase.auth.getSession(), timeout]);
        if (result.error) throw result.error;
        session = result.data.session;
    } catch (err) {
        showBlocked(err.message || "Could not check your session.");
        return null;
    }
    if (!session) {
        location.replace(loginHref());
        return null;
    }
    if (session.user.id !== OWNER_ID) {
        await supabase.auth.signOut();
        showBlocked("Not authorised");
        return null;
    }
    document.documentElement.classList.add("dc-ready");
    return session;
}

let pending = null;

export function requireOwner() {
    if (!pending) pending = runGate();
    return pending;
}

requireOwner();
