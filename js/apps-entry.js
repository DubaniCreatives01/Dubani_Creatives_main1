import { supabase } from "./supabase-client.js";

const LOGIN = "login.html?next=" + encodeURIComponent("/my-apps.html");
const DASHBOARD = "my-apps.html";

async function pointAtDashboard() {
    const { data } = await supabase.auth.getSession();
    const href = data.session ? DASHBOARD : LOGIN;
    ["apps-sidebar-btn", "mobile-apps-btn", "sidebar-dashboard-link"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.setAttribute("href", href);
    });
}

pointAtDashboard();
supabase.auth.onAuthStateChange(() => {
    pointAtDashboard();
});
