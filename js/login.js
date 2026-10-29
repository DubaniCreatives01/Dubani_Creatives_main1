import { supabase, OWNER_ID } from "./supabase-client.js";

const msg = document.getElementById("msg");
const loginForm = document.getElementById("login-form");
const recoveryForm = document.getElementById("recovery-form");
const submitBtn = document.getElementById("submit-btn");

function setMessage(text, kind) {
    msg.textContent = text || "";
    msg.className = "msg" + (kind ? " " + kind : "");
}

function safeNext(value) {
    if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
        return "/my-apps.html";
    }
    try {
        const url = new URL(value, location.origin);
        if (url.origin !== location.origin) return "/my-apps.html";
        return url.pathname + url.search + url.hash;
    } catch {
        return "/my-apps.html";
    }
}

const nextUrl = safeNext(new URLSearchParams(location.search).get("next"));
const recoveryArrival = location.hash.includes("type=recovery") || new URLSearchParams(location.search).has("code");

function showRecovery() {
    document.getElementById("title").innerHTML = "Choose a <span>new password</span>";
    document.getElementById("lede").textContent = "This reset link is for the owner account. Save a new password to continue.";
    loginForm.classList.add("hidden");
    recoveryForm.classList.remove("hidden");
}

supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") showRecovery();
});

async function leaveIfOwner(session) {
    if (!session) return false;
    if (session.user.id !== OWNER_ID) {
        await supabase.auth.signOut();
        setMessage("Not authorised", "error");
        return false;
    }
    location.replace(nextUrl);
    return true;
}

const existing = await supabase.auth.getSession();
if (existing.error) {
    setMessage(existing.error.message, "error");
} else if (recoveryArrival) {
    showRecovery();
} else if (existing.data.session) {
    await leaveIfOwner(existing.data.session);
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("");
    submitBtn.disabled = true;
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    submitBtn.disabled = false;
    if (error) {
        setMessage(error.message, "error");
        return;
    }
    await leaveIfOwner(data.session);
});

document.getElementById("forgot-btn").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    if (!email) {
        setMessage("Enter your email first, then choose Forgot password.", "error");
        document.getElementById("email").focus();
        return;
    }
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: location.origin + "/login.html",
    });
    if (error) {
        setMessage(error.message, "error");
        return;
    }
    setMessage("If that email can sign in, a reset link is on its way.", "ok");
});

recoveryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nextPassword = document.getElementById("new-password").value;
    document.getElementById("recovery-btn").disabled = true;
    const { data, error } = await supabase.auth.updateUser({ password: nextPassword });
    document.getElementById("recovery-btn").disabled = false;
    if (error) {
        setMessage(error.message, "error");
        return;
    }
    await leaveIfOwner(data.user ? (await supabase.auth.getSession()).data.session : null);
});
