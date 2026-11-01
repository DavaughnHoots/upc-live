/* UPC leaders dashboard (Squarespace 7.1 code block on a hidden, password page).
 *
 *   <div data-upc-dash></div>
 *   <script src="https://davaughnhoots.github.io/upc-live/dashboard/upc-dashboard.js" defer></script>
 *
 * The numbers live in dashboard.enc.json next to this script, encrypted with
 * AES-GCM under a key made from the leaders' password (PBKDF2-SHA256). The
 * password is never stored in this file, the page, or the browser. Without it
 * the data file is unreadable. build_dashboard.py (kept off the public site)
 * writes the encrypted file.
 *
 * All text is inserted with textContent (never innerHTML).
 */
(function () {
  "use strict";
  if (window.__upcDashLoaded) return;
  window.__upcDashLoaded = true;

  var me = document.currentScript;
  var SRC = (me && me.getAttribute("data-src")) ||
            (me && me.src ? me.src.replace(/upc-dashboard\.js(\?.*)?$/, "dashboard.enc.json") : "dashboard.enc.json");
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
                "August", "September", "October", "November", "December"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null && text !== "") e.textContent = String(text);
    return e;
  }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function longDate(s) {
    var d = parseDate(s);
    return d ? DAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate() : (s || "");
  }
  function num(n) { return n == null || n === "" ? "" : Number(n).toLocaleString("en-US"); }
  function b64(s) {
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function injectStyles() {
    if (document.getElementById("upc-dash-style")) return;
    var css = [
      ".upc-dash{font-family:inherit;color:#000;text-align:left;line-height:1.5;font-size:20px;overflow-wrap:anywhere;max-width:46rem;margin:0 auto}",
      ".upc-dash *{box-sizing:border-box}",
      ".upc-dash h2{font-family:'Crimson Pro',Georgia,serif;font-weight:400;font-size:2.1rem;line-height:1.1;margin:0 0 .3em}",
      ".upc-dash h3{font-family:'Crimson Pro',Georgia,serif;font-weight:500;font-size:1.6rem;margin:0 0 .5em}",
      ".upc-dash .d-card{background:#fff;border-radius:18px;padding:1.3rem 1.4rem;box-shadow:0 1px 4px rgba(0,0,0,.08);margin:0 0 1.1rem}",
      ".upc-dash .d-sub{font-size:.95em;color:#333;margin:0 0 1rem}",
      ".upc-dash label{display:block;font-weight:600;margin:0 0 .4rem}",
      ".upc-dash input{width:100%;font-size:1.2rem;padding:.75rem .9rem;border:2px solid #555;border-radius:12px}",
      ".upc-dash button{display:block;width:100%;margin-top:.9rem;background:#0033a0;color:#fff;border:0;border-radius:300px;padding:.85rem 1rem;font-size:1.15rem;font-weight:600;cursor:pointer}",
      ".upc-dash button:focus,.upc-dash input:focus{outline:3px solid #f2a900;outline-offset:2px}",
      ".upc-dash .d-err{color:#a40000;font-weight:600;margin-top:.7rem}",
      ".upc-dash .d-row{border-top:1px solid #ddd;padding:.65rem 0}",
      ".upc-dash .d-row:first-of-type{border-top:0}",
      ".upc-dash .d-tag{display:inline-block;font-size:.9em;font-weight:700;letter-spacing:.04em;text-transform:uppercase;border-radius:8px;padding:.15rem .55rem;margin-right:.5rem}",
      ".upc-dash .ok{background:#d9f2df;color:#0b5a1e}",
      ".upc-dash .due{background:#fff1c7;color:#6b4d00}",
      ".upc-dash .behind{background:#fbd5d5;color:#8a0000}",
      ".upc-dash .d-big{font-size:2rem;font-weight:700;line-height:1.1}",
      ".upc-dash .d-muted{color:#333;font-size:.95em}",
      ".upc-dash .d-stamp{font-size:.95em;color:#333;margin:.4rem 0 1.2rem}"
    ].join("\n");
    var s = document.createElement("style");
    s.id = "upc-dash-style";
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ------------------------------------------------------------ decrypt
  function decrypt(blob, password) {
    var subtle = window.crypto && window.crypto.subtle;
    if (!subtle || !window.TextEncoder || !window.TextDecoder) return Promise.reject(new Error("This browser can't open the dashboard. Try Chrome or Safari."));
    return subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"])
      .then(function (base) {
        return subtle.deriveKey({name: "PBKDF2", hash: "SHA-256", salt: b64(blob.salt), iterations: blob.iter},
                                base, {name: "AES-GCM", length: 256}, false, ["decrypt"]);
      })
      .then(function (key) { return subtle.decrypt({name: "AES-GCM", iv: b64(blob.iv)}, key, b64(blob.ct)); })
      .then(function (buf) { return JSON.parse(new TextDecoder().decode(buf)); });
  }

  // ------------------------------------------------------------ cards
  function card(title, sub) {
    var c = el("section", "d-card");
    c.appendChild(el("h3", null, title));
    if (sub) c.appendChild(el("p", "d-sub", sub));
    return c;
  }
  var WORD = {ok: "Up to date", due: "Due soon", behind: "Behind"};

  function render(box, d) {
    var wrap = el("div", "upc-dash");
    wrap.appendChild(el("h2", null, "UPC at a glance"));
    if (d.built) wrap.appendChild(el("p", "d-stamp", "Updated " + longDate(d.built.slice(0, 10))));

    var tw = d.this_week;
    if (tw) {
      var c1 = card("This week", longDate(tw.date) + (tw.title ? ", " + tw.title : ""));
      if (tw.scripture && tw.scripture.length) c1.appendChild(el("p", null, "Scripture: " + tw.scripture.join("; ")));
      (tw.items || []).forEach(function (t) { c1.appendChild(el("p", "d-row", t)); });
      wrap.appendChild(c1);
    }

    if ((d.status || []).length) {
      var c2 = card("Up to date?", "Website, YouTube, and Facebook, checked when this page was updated.");
      d.status.forEach(function (s) {
        var row = el("div", "d-row");
        var st = WORD[s.state] ? s.state : "due";
        row.appendChild(el("span", "d-tag " + st, WORD[st]));
        row.appendChild(el("strong", null, s.area + ": " + s.item));
        if (s.detail) row.appendChild(el("div", "d-muted", s.detail));
        c2.appendChild(row);
      });
      wrap.appendChild(c2);
    }

    if ((d.attendance || []).length) {
      var c3 = card("Worship attendance", "Sunday counts, newest first.");
      d.attendance.slice(0, 6).forEach(function (a) {
        var row = el("div", "d-row");
        row.appendChild(el("strong", null, longDate(a.date)));
        var parts = [];
        if (a.in_person !== "" && a.in_person != null) parts.push(num(a.in_person) + " in person");
        if (a.online !== "" && a.online != null) parts.push(num(a.online) + " online views");
        row.appendChild(el("div", null, parts.join(", ") || "Not counted"));
        c3.appendChild(row);
      });
      wrap.appendChild(c3);
    }

    if ((d.online || []).length) {
      var c4 = card("Online ministry", "Followers and subscribers, compared with the last annual report.");
      d.online.forEach(function (o) {
        var row = el("div", "d-row");
        row.appendChild(el("strong", null, o.label));
        row.appendChild(el("div", "d-big", num(o.now)));
        var line = o.as_of ? "As of " + longDate(o.as_of) : "";
        if (o.before != null && o.before !== "") line += (line ? ". " : "") + "Last annual report: " + num(o.before) + (o.before_note ? " (" + o.before_note + ")" : "");
        if (line) row.appendChild(el("div", "d-muted", line));
        if (o.note) row.appendChild(el("div", "d-muted", o.note));
        c4.appendChild(row);
      });
      wrap.appendChild(c4);
    }

    if ((d.calendar || []).length) {
      var c5 = card("Coming up", "The next 60 days.");
      d.calendar.forEach(function (e) {
        var row = el("div", "d-row");
        row.appendChild(el("strong", null, longDate(e.date) + (e.time ? ", " + e.time : "")));
        row.appendChild(el("div", null, e.title));
        c5.appendChild(row);
      });
      wrap.appendChild(c5);
    }
    box.textContent = "";
    box.appendChild(wrap);
  }

  function showLock(box, blob) {
    var wrap = el("div", "upc-dash");
    var c = el("section", "d-card");
    c.appendChild(el("h2", null, "Leaders dashboard"));
    c.appendChild(el("p", "d-sub", "Type the leaders' password to open it."));
    var form = el("form");
    var lab = el("label", null, "Password");
    lab.setAttribute("for", "upc-dash-pw");
    var inp = el("input");
    inp.type = "password"; inp.id = "upc-dash-pw"; inp.autocomplete = "current-password";
    var btn = el("button", null, "Open dashboard");
    btn.type = "submit";
    var err = el("p", "d-err");
    err.setAttribute("role", "alert");
    form.appendChild(lab); form.appendChild(inp); form.appendChild(btn); form.appendChild(err);
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      err.textContent = "";
      btn.textContent = "Opening...";
      btn.disabled = true;
      Promise.resolve().then(function () { return decrypt(blob, inp.value); })
        .then(function (data) {
          try { render(box, data); }
          catch (e) {
            if (window.console) console.warn("upc-dash: render", e);
            showMessage(box, "The password worked, but the dashboard data has a problem. Please tell Davaughn.");
          }
        }, function (e) {
          btn.textContent = "Open dashboard";
          btn.disabled = false;
          err.textContent = (e && /browser/.test(e.message)) ? e.message : "That password didn't work. Please try again.";
          inp.select();
        });
    });
    c.appendChild(form);
    wrap.appendChild(c);
    box.textContent = "";
    box.appendChild(wrap);
    inp.focus();
  }

  function showMessage(box, text) {
    var w = el("div", "upc-dash");
    w.appendChild(el("p", "d-card", text));
    box.textContent = "";
    box.appendChild(w);
  }

  function run() {
    var boxes = document.querySelectorAll("[data-upc-dash]");
    if (!boxes.length || !window.fetch) return;
    injectStyles();
    // One dashboard per page; any extra placeholder says so instead of staying blank.
    for (var i = 1; i < boxes.length; i++) showMessage(boxes[i], "The dashboard is shown once on this page.");
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 20000) : null;
    fetch(SRC + (SRC.indexOf("?") < 0 ? "?" : "&") + "v=" + Math.floor(Date.now() / 300000),
          ctl ? {cache: "no-store", signal: ctl.signal} : {cache: "no-store"})
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (blob) {
        if (timer) clearTimeout(timer);
        if (!blob || blob.v !== 1 || !blob.salt || !blob.iv || !blob.ct ||
            !(blob.iter >= 100000 && blob.iter <= 5000000)) throw new Error("bad file");
        showLock(boxes[0], blob);
      })
      .catch(function (e) {
        if (timer) clearTimeout(timer);
        if (window.console) console.warn("upc-dash:", e);
        showMessage(boxes[0], "The dashboard isn't available right now. Please try again later.");
      });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
