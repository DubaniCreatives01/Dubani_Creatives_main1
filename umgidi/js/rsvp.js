(function () {
  const ENDPOINT = "https://maofytcvzlapcqegrvpp.supabase.co/rest/v1/rpc/submit_umgidi_rsvp";
  const API_KEY = "sb_publishable_V1Og_p-4bcHqcmV8m2EnAA_lwH9A29T";

  const form = document.getElementById("rsvp-form");
  const firstInput = document.getElementById("first-name");
  const surnameInput = document.getElementById("surname");
  const submitBtn = document.getElementById("submit-btn");
  const errorEl = document.getElementById("form-error");
  const thanks = document.getElementById("thanks");
  const thanksName = document.getElementById("thanks-name");
  const thanksTitle = document.getElementById("thanks-title");
  const againBtn = document.getElementById("again");
  const mapOpen = document.getElementById("map-open");
  const mapDialog = document.getElementById("map-dialog");
  const mapClose = document.getElementById("map-close");

  let sending = false;

  function clean(value) {
    return value.replace(/\s+/g, " ").trim();
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function clearError() {
    errorEl.hidden = true;
    errorEl.textContent = "";
  }

  function showForm() {
    form.hidden = false;
    thanks.hidden = true;
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirm my attendance";
    firstInput.focus();
  }

  async function submitRsvp(first, surname) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        apikey: API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_first_name: first, p_surname: surname }),
    });

    if (!response.ok) {
      let serverMessage = "";
      try {
        const data = await response.json();
        serverMessage = data && data.message ? String(data.message) : "";
      } catch (err) {
        serverMessage = "";
      }
      if (/required/i.test(serverMessage)) {
        throw new Error("Please enter both your first name and surname.");
      }
      throw new Error("We could not save your RSVP just now. Please try again.");
    }
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (sending) return;

    const first = clean(firstInput.value);
    const surname = clean(surnameInput.value);
    firstInput.value = first;
    surnameInput.value = surname;
    clearError();

    if (!first || !surname) {
      showError("Please enter both your first name and surname.");
      (first ? surnameInput : firstInput).focus();
      return;
    }
    if (first.length > 80 || surname.length > 80) {
      showError("That name is a little long. Please use the name you go by.");
      return;
    }

    sending = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving…";

    try {
      await submitRsvp(first, surname);
      thanksName.textContent = first + " " + surname;
      form.hidden = true;
      thanks.hidden = false;
      thanksTitle.focus();
    } catch (err) {
      showError(err && err.message ? err.message : "We could not save your RSVP just now. Please try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirm my attendance";
    } finally {
      sending = false;
    }
  });

  againBtn.addEventListener("click", function () {
    form.reset();
    clearError();
    showForm();
  });

  mapOpen.addEventListener("click", function () {
    if (typeof mapDialog.showModal === "function") {
      mapDialog.showModal();
    } else {
      window.open("assets/venue-map.webp", "_blank", "noopener");
    }
  });

  mapClose.addEventListener("click", function () {
    mapDialog.close();
  });

  mapDialog.addEventListener("click", function (event) {
    if (event.target === mapDialog) mapDialog.close();
  });
})();
