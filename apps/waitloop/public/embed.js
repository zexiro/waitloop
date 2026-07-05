/* Waitloop embed widget.
 * Usage:
 *   <div data-waitloop="your-slug" data-accent="#ff6b3d"></div>
 *   <script src="https://YOUR_WAITLOOP_HOST/embed.js" async></script>
 */
(function () {
  var script = document.currentScript;
  var origin = script && script.src ? new URL(script.src).origin : "";

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "style") Object.assign(el.style, attrs[k]);
      else el.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return el;
  }

  function mount(container) {
    if (container.__waitloop) return;
    container.__waitloop = true;
    var slug = container.getAttribute("data-waitloop");
    var accent = container.getAttribute("data-accent") || "#ff6b3d";
    var button = container.getAttribute("data-button") || "Join the waitlist";

    var input = h("input", {
      type: "email",
      required: "required",
      placeholder: "you@example.com",
      "aria-label": "Email address",
      style: {
        flex: "1",
        minWidth: "0",
        padding: "10px 12px",
        border: "1px solid rgba(128,128,128,.4)",
        borderRadius: "6px",
        font: "inherit",
        background: "transparent",
        color: "inherit",
      },
    });
    var btn = h(
      "button",
      {
        type: "submit",
        style: {
          padding: "10px 16px",
          border: "none",
          borderRadius: "6px",
          background: accent,
          color: "#0a0b0f",
          fontWeight: "700",
          font: "inherit",
          cursor: "pointer",
          whiteSpace: "nowrap",
        },
      },
      [button],
    );
    var msg = h("p", {
      style: { margin: "8px 0 0", font: "inherit", fontSize: "0.85em", opacity: "0.8" },
    });
    var form = h("form", { style: { display: "flex", gap: "8px", font: "inherit" } }, [
      input,
      btn,
    ]);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      btn.disabled = true;
      var ref = new URLSearchParams(window.location.search).get("ref") || undefined;
      fetch(origin + "/api/public/w/" + encodeURIComponent(slug) + "/signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: input.value, ref: ref }),
      })
        .then(function (r) {
          return r.json().then(function (d) {
            if (!r.ok) throw new Error(d.error || "something went wrong");
            form.style.display = "none";
            msg.textContent =
              (d.successMessage || "You're on the list!") +
              " You're #" +
              d.position +
              ". Share your link to move up: " +
              d.referralUrl;
          });
        })
        .catch(function (err) {
          msg.textContent = err.message;
        })
        .finally(function () {
          btn.disabled = false;
        });
    });

    container.appendChild(form);
    container.appendChild(msg);
  }

  function init() {
    document.querySelectorAll("[data-waitloop]").forEach(mount);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
