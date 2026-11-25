(function () {
  const ENDPOINT = "https://maofytcvzlapcqegrvpp.supabase.co/rest/v1/rpc/get_umgidi_rsvps";
  const API_KEY = "sb_publishable_V1Og_p-4bcHqcmV8m2EnAA_lwH9A29T";

  let key = "";
  const board = document.getElementById("board");
  const privateView = document.getElementById("private");
  const accessForm = document.getElementById("access-form");
  const accessKeyInput = document.getElementById("access-key");
  const accessError = document.getElementById("access-error");
  const accessSubmit = document.getElementById("access-submit");
  const loading = document.getElementById("loading");
  const banner = document.getElementById("banner");
  const countEl = document.getElementById("count");
  const matchNote = document.getElementById("match-note");
  const search = document.getElementById("search");
  const tableBody = document.getElementById("rows");
  const empty = document.getElementById("empty");
  const refreshBtn = document.getElementById("refresh");
  const csvBtn = document.getElementById("csv");
  const updated = document.getElementById("updated");

  if (window.location.search) {
    window.history.replaceState({}, "", window.location.pathname + window.location.hash);
  }

  const when = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  let rows = [];
  let loadingNow = false;

  function showPrivate(message) {
    loading.hidden = true;
    board.hidden = true;
    banner.hidden = true;
    privateView.hidden = false;
    accessError.textContent = message || "";
    accessError.hidden = !message;
  }

  function formatWhen(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return when.format(date);
  }

  function filtered() {
    const query = search.value.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(function (row) {
      return (
        String(row.first_name || "").toLowerCase().includes(query) ||
        String(row.surname || "").toLowerCase().includes(query)
      );
    });
  }

  function render() {
    const visible = filtered();
    countEl.textContent = String(rows.length);
    tableBody.replaceChildren();

    if (search.value.trim()) {
      matchNote.textContent = visible.length === 1 ? "1 match" : visible.length + " matches";
    } else {
      matchNote.textContent = "";
    }

    empty.hidden = visible.length !== 0;
    empty.textContent = rows.length === 0
      ? "No RSVPs yet. When guests confirm, their names will appear here."
      : "No one matches that search.";
    csvBtn.disabled = rows.length === 0;

    visible.forEach(function (row) {
      const tr = document.createElement("tr");
      const no = document.createElement("td");
      const first = document.createElement("td");
      const surname = document.createElement("td");
      const submitted = document.createElement("td");
      no.className = "no";
      submitted.className = "when";
      no.textContent = String(row.no);
      first.textContent = row.first_name || "";
      surname.textContent = row.surname || "";
      submitted.textContent = formatWhen(row.created_at);
      if (row.created_at) {
        const time = document.createElement("time");
        time.dateTime = row.created_at;
        time.textContent = submitted.textContent;
        submitted.textContent = "";
        submitted.appendChild(time);
      }
      tr.append(no, first, surname, submitted);
      tableBody.appendChild(tr);
    });
  }

  async function load(manual) {
    if (!key) {
      showPrivate();
      return;
    }
    if (loadingNow) return;
    loadingNow = true;
    if (manual) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = "Refreshing…";
    }
    accessSubmit.disabled = true;
    accessSubmit.textContent = "Checking…";
    banner.hidden = true;

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          apikey: API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ p_key: key }),
      });
      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (err) {
        data = null;
      }

      if (!response.ok) {
        const message = data && data.message ? String(data.message) : "";
        if (response.status === 401 || response.status === 403 || message === "Not allowed") {
          key = "";
          accessKeyInput.value = "";
          showPrivate("That key didn’t work. Check it and try again.");
          return;
        }
        throw new Error("load");
      }

      if (!Array.isArray(data)) throw new Error("shape");

      data.sort(function (a, b) {
        return String(a.created_at || "").localeCompare(String(b.created_at || ""));
      });
      rows = data.map(function (row, index) {
        return {
          id: row.id,
          first_name: row.first_name,
          surname: row.surname,
          created_at: row.created_at,
          no: index + 1,
        };
      });

      loading.hidden = true;
      privateView.hidden = true;
      board.hidden = false;
      updated.textContent = "Updated " + formatWhen(new Date().toISOString()) + " · Johannesburg";
      render();
    } catch (err) {
      if (board.hidden) {
        loading.hidden = true;
        privateView.hidden = true;
        board.hidden = false;
      }
      banner.hidden = false;
      banner.textContent = "The list could not be loaded. Check the connection and try again.";
    } finally {
      loadingNow = false;
      refreshBtn.disabled = false;
      refreshBtn.textContent = "Refresh";
      accessSubmit.disabled = false;
      accessSubmit.textContent = "View RSVP list";
    }
  }

  function csvCell(value) {
    return '"' + String(value ?? "").replace(/"/g, '""') + '"';
  }

  accessForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const enteredKey = accessKeyInput.value.trim();
    if (!enteredKey) {
      accessError.textContent = "Enter the private key to continue.";
      accessError.hidden = false;
      accessKeyInput.focus();
      return;
    }
    key = enteredKey;
    accessError.hidden = true;
    loading.hidden = false;
    privateView.hidden = true;
    load(false);
  });

  csvBtn.addEventListener("click", function () {
    const lines = [[ "No.", "Name", "Surname", "Submitted (Africa/Johannesburg)" ]];
    rows.forEach(function (row) {
      lines.push([row.no, row.first_name || "", row.surname || "", formatWhen(row.created_at)]);
    });
    const csv = "\uFEFF" + lines.map(function (line) {
      return line.map(csvCell).join(",");
    }).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "umgidi-rsvps.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  search.addEventListener("input", render);
  refreshBtn.addEventListener("click", function () { load(true); });

  load(false);
  setInterval(function () {
    if (document.visibilityState === "visible") load(false);
  }, 60000);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") load(false);
  });
})();
