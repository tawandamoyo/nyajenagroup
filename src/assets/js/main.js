// Mobile navigation ---------------------------------------------------------

const navToggle = document.querySelector(".site-nav__toggle");
const navList = document.getElementById("site-nav-list");

function setNav(open) {
  navToggle.setAttribute("aria-expanded", String(open));
  navList.classList.toggle("is-open", open);
}

if (navToggle && navList) {
  navToggle.addEventListener("click", () => {
    setNav(navToggle.getAttribute("aria-expanded") !== "true");
  });
  navList.addEventListener("click", (event) => {
    if (event.target.closest("a")) setNav(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navList.classList.contains("is-open")) {
      setNav(false);
      navToggle.focus();
    }
  });
}

// Earliest delivery dates ------------------------------------------------------
// The lead time is fixed, so the earliest date is worked out on the visitor's
// device and is never stale. Lines that only make sense with a date stay hidden
// until it is filled in. en-GB rather than en-ZW, which pads days to "09".

const prettyDate = (d, long = false) => d.toLocaleDateString("en-GB", long
  ? { weekday: "long", day: "numeric", month: "long" }
  : { weekday: "short", day: "numeric", month: "long", year: "numeric" });

document.querySelectorAll("[data-earliest]").forEach((el) => {
  const date = new Date();
  date.setDate(date.getDate() + (Number(el.dataset.earliest) || 21));
  el.textContent = prettyDate(date, el.dataset.format === "long");
  const line = el.closest("[data-earliest-line]");
  if (line) line.hidden = false;
});

// Order form ------------------------------------------------------------------
// There is no server: the form builds a WhatsApp message and opens it, which is
// how most customers already talk to the team.

const form = document.getElementById("order-form");

if (form) {
  const sent = document.getElementById("order-sent");
  const sentLink = document.getElementById("order-sent-link");
  const orderText = document.getElementById("order-text");
  const stockError = document.getElementById("stock-error");
  const errorSummary = document.getElementById("form-error-summary");
  const stockBoxes = [...form.querySelectorAll('input[name="stock"]')];
  const dateInput = form.querySelector("#date");

  const qtyFor = (box) => form.querySelector(`#qty-${box.value}`);
  const variantFor = (box) => form.querySelector(`#variant-${box.value}`);
  const qtyErrorFor = (box) => document.getElementById(`qty-error-${box.value}`);

  function showValidity(input, error, valid) {
    error.hidden = valid;
    if (valid) input.removeAttribute("aria-invalid");
    else input.setAttribute("aria-invalid", "true");
  }

  const validQuantity = (input) => {
    const value = input.value.trim();
    return value === "" || (/^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0);
  };

  function syncQty(box) {
    const qty = qtyFor(box);
    qty.disabled = !box.checked;
    const variant = variantFor(box);
    if (variant) {
      variant.disabled = !box.checked;
      document.getElementById(`details-${box.value}`).hidden = !box.checked;
    }
    if (!box.checked) {
      qty.value = "";
      if (variant) variant.value = "";
      showValidity(qty, qtyErrorFor(box), true);
    }
  }

  stockBoxes.forEach((box) => {
    box.addEventListener("change", () => {
      syncQty(box);
      if (box.checked) qtyFor(box).focus();
      if (stockBoxes.some((b) => b.checked)) {
        stockError.hidden = true;
        stockError.closest("fieldset").removeAttribute("aria-invalid");
      }
    });
    qtyFor(box).addEventListener("input", () => {
      showValidity(qtyFor(box), qtyErrorFor(box), validQuantity(qtyFor(box)));
    });
  });

  // A single product can be selected in advance; a group still needs a choice.
  const params = new URLSearchParams(location.search);
  const requested = (params.get("stock") || "").split(",").filter(Boolean);
  if (requested.length === 1) {
    const box = stockBoxes.find((b) => b.value === requested[0]);
    if (box) box.checked = true;
  }
  if (params.get("group") === "other-poultry" || requested.length > 1) {
    document.getElementById("stock-group-hint").hidden = false;
    if (!stockBoxes.some((b) => b.checked)) {
      const firstChoices = params.get("group") === "other-poultry"
        ? ["guinea-fowl", "turkeys", "ducks"] : requested;
      [...firstChoices].reverse().forEach((value) => {
        const box = stockBoxes.find((b) => b.value === value);
        if (box) box.closest("ul").prepend(box.closest("li"));
      });
    }
  }
  stockBoxes.forEach(syncQty);

  // Local calendar dates avoid shifting the date in time zones ahead of UTC.
  const isoDate = (d) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
  dateInput.min = isoDate(new Date());

  const required = [
    { input: form.querySelector("#location"), error: document.getElementById("location-error"), valid: (value) => value.trim() !== "" },
    { input: form.querySelector("#name"), error: document.getElementById("name-error"), valid: (value) => value.trim() !== "" },
    { input: form.querySelector("#phone"), error: document.getElementById("phone-error"), valid: (value) => {
      const digits = value.replace(/\D/g, "");
      return /^\+?[\d\s().-]+$/.test(value.trim()) && digits.length >= 7 && digits.length <= 15;
    } },
    { input: dateInput, error: document.getElementById("date-error"), valid: (value) => {
      if (!value) return !dateInput.validity.badInput;
      const date = new Date(`${value}T12:00:00`);
      return !Number.isNaN(date.getTime()) && isoDate(date) === value && value >= isoDate(new Date());
    } },
  ];

  required.forEach(({ input, error, valid }) => {
    input.addEventListener("input", () => {
      if (input.hasAttribute("aria-invalid")) showValidity(input, error, valid(input.value));
    });
  });

  function validate() {
    let firstInvalid = null;

    const hasStock = stockBoxes.some((b) => b.checked);
    showValidity(stockError.closest("fieldset"), stockError, hasStock);
    if (!hasStock) firstInvalid = form.querySelector('input[name="stock"]');

    stockBoxes.filter((b) => b.checked).forEach((box) => {
      const input = qtyFor(box);
      const ok = validQuantity(input);
      showValidity(input, qtyErrorFor(box), ok);
      if (!ok) firstInvalid ??= input;
    });

    required.forEach(({ input, error, valid }) => {
      const ok = valid(input.value);
      showValidity(input, error, ok);
      if (!ok) firstInvalid ??= input;
    });

    errorSummary.hidden = !firstInvalid;
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  function buildMessage() {
    const data = new FormData(form);
    const lines = ["Hi Nyajena, I would like to order:"];

    stockBoxes
      .filter((b) => b.checked)
      .forEach((b) => {
        const qty = qtyFor(b).value.trim();
        const unit = qtyFor(b).nextElementSibling.textContent;
        const variant = variantFor(b);
        lines.push(`- ${b.dataset.label}: ${qty ? `${qty} ${unit}` : "quantity to discuss"}${variant ? `; ${variant.value || "type to discuss — please advise"}` : ""}`);
      });

    if (data.get("extras")) lines.push("- Please also quote feed, vaccines or brooding equipment");

    lines.push("", `Town or district: ${data.get("location").trim()}`);
    const date = data.get("date");
    if (date) lines.push(`Preferred date: ${prettyDate(new Date(`${date}T12:00:00`))}`);

    lines.push("", `Name: ${data.get("name").trim()}`, `Phone: ${data.get("phone").trim()}`);

    const notes = data.get("notes").trim();
    if (notes) lines.push("", notes);


    return lines.join("\n");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validate()) return;

    const message = buildMessage();
    const url = `https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(message)}`;

    orderText.value = message;
    sentLink.href = url;
    form.hidden = true;
    sent.hidden = false;
    sent.focus();

    window.open(url, "_blank", "noopener");
  });

  document.getElementById("order-edit").addEventListener("click", () => {
    sent.hidden = true;
    form.hidden = false;
    form.querySelector("legend").scrollIntoView({ block: "start" });
    stockBoxes[0].focus({ preventScroll: true });
  });

  const copyButton = document.getElementById("order-copy");
  const copyStatus = document.getElementById("order-copy-status");
  const copyLabel = copyButton.textContent;
  let copyTimer;
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(orderText.value);
      copyButton.textContent = "Copied";
      copyStatus.textContent = "Order copied. Paste it into WhatsApp or an SMS.";
    } catch {
      orderText.select();
      copyButton.textContent = "Select and copy the text below";
      copyStatus.textContent = "Order selected. Use your device’s copy command to copy it.";
    }
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copyButton.textContent = copyLabel;
    }, 2500);
  });

  // Enable submission only after the WhatsApp handler is ready.
  form.querySelector('button[type="submit"]').disabled = false;
}

// WhatsApp shortcut -----------------------------------------------------------
// Out of the way while reading down a page on a phone, back when scrolling up,
// and hidden where the page already offers WhatsApp (order band, footer).

const fab = document.querySelector(".whatsapp-fab");

if (fab) {
  const covered = new Set();
  let tuckedByScroll = false;
  let lastY = window.scrollY;
  const phone = window.matchMedia("(max-width: 47.99em)");

  const update = () => fab.classList.toggle("is-tucked", covered.size > 0 || tuckedByScroll);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? covered.add(e.target) : covered.delete(e.target)));
    update();
  });
  document.querySelectorAll(".order-band, .site-footer").forEach((el) => observer.observe(el));

  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 8) return;
      tuckedByScroll = phone.matches && y > lastY && y > 200;
      lastY = y;
      update();
    },
    { passive: true },
  );
}
