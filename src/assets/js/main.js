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

// Order form ------------------------------------------------------------------
// There is no server: the form builds a WhatsApp message and opens it, which is
// how most customers already talk to the team.

const form = document.getElementById("order-form");

if (form) {
  const sent = document.getElementById("order-sent");
  const sentLink = document.getElementById("order-sent-link");
  const orderText = document.getElementById("order-text");
  const stockError = document.getElementById("stock-error");
  const stockBoxes = [...form.querySelectorAll('input[name="stock"]')];
  const dateInput = form.querySelector("#date");
  const leadDays = Number(form.dataset.leadDays) || 21;

  const qtyFor = (box) => form.querySelector(`#qty-${box.value}`);

  function syncQty(box) {
    const qty = qtyFor(box);
    qty.disabled = !box.checked;
    if (!box.checked) qty.value = "";
  }

  stockBoxes.forEach((box) => {
    box.addEventListener("change", () => {
      syncQty(box);
      if (box.checked) qtyFor(box).focus();
      if (stockBoxes.some((b) => b.checked)) stockError.hidden = true;
    });
  });

  // Preselect stock from links such as /order.html?stock=broilers,layers
  const preselect = new URLSearchParams(location.search).get("stock");
  if (preselect) {
    preselect.split(",").forEach((value) => {
      const box = stockBoxes.find((b) => b.value === value);
      if (box) box.checked = true;
    });
  }
  stockBoxes.forEach(syncQty);

  // Suggest the earliest realistic delivery date rather than blocking earlier ones.
  const earliest = new Date();
  earliest.setDate(earliest.getDate() + leadDays);
  const isoDate = (d) => d.toISOString().slice(0, 10);
  const prettyDate = (d) =>
    d.toLocaleDateString("en-ZW", { weekday: "short", day: "numeric", month: "long" });
  dateInput.min = isoDate(new Date());
  form.querySelector("[data-earliest]").textContent = prettyDate(earliest);

  const required = [
    { input: form.querySelector("#location"), error: document.getElementById("location-error") },
    { input: form.querySelector("#name"), error: document.getElementById("name-error") },
    { input: form.querySelector("#phone"), error: document.getElementById("phone-error") },
  ];

  required.forEach(({ input, error }) => {
    input.addEventListener("input", () => {
      if (input.value.trim()) {
        input.removeAttribute("aria-invalid");
        error.hidden = true;
      }
    });
  });

  function validate() {
    let firstInvalid = null;

    const hasStock = stockBoxes.some((b) => b.checked);
    stockError.hidden = hasStock;
    if (!hasStock) firstInvalid = stockBoxes[0];

    required.forEach(({ input, error }) => {
      const ok = input.value.trim() !== "";
      error.hidden = ok;
      if (ok) input.removeAttribute("aria-invalid");
      else {
        input.setAttribute("aria-invalid", "true");
        firstInvalid ??= input;
      }
    });

    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  function buildMessage() {
    const data = new FormData(form);
    const lines = ["Hello Nyajena, I would like to order:"];

    stockBoxes
      .filter((b) => b.checked)
      .forEach((b) => {
        const qty = qtyFor(b).value.trim();
        lines.push(`- ${b.dataset.label}${qty ? `: ${qty}` : ""}`);
      });

    if (data.get("extras")) lines.push("- Please also quote feed, vaccines or brooding equipment");

    lines.push("", `Deliver to: ${data.get("location").trim()}`);
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
      copyStatus.textContent = "Order text copied. Paste it into WhatsApp or an SMS.";
    } catch {
      orderText.select();
      copyButton.textContent = "Press Ctrl+C to copy";
      copyStatus.textContent = "Order text selected. Press Ctrl+C to copy it.";
    }
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copyButton.textContent = copyLabel;
    }, 2500);
  });
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
