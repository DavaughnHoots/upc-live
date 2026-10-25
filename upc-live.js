/* UPC live sections for upcplainfield.com (Squarespace 7.1 code blocks).
 *
 * Fills any of these containers found on the page:
 *   <div data-upc-live="this-week">  fallback HTML  </div>
 *   <div data-upc-live="newsletters"> fallback HTML </div>
 *   <div data-upc-live="events">      fallback HTML </div>
 *
 * Content comes from upc-live.json next to this script. Each container keeps
 * the fallback HTML written into its code block until the feed loads and
 * validates; on any error the fallback stays, so the page is never blank.
 * All text is inserted with textContent (never innerHTML), and only http(s)
 * or same-host relative links are rendered.
 */
(function () {
  "use strict";
  if (window.__upcLiveLoaded) return;
  window.__upcLiveLoaded = true;

  var me = document.currentScript;
  var SRC = (me && me.getAttribute("data-src")) ||
            (me && me.src ? me.src.replace(/upc-live\.js(\?.*)?$/, "upc-live.json") : "upc-live.json");
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
                "August", "September", "October", "November", "December"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // ------------------------------------------------------------ helpers
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null && text !== "") e.textContent = String(text);
    return e;
  }
  function parseDate(s) {             // "YYYY-MM-DD" as a LOCAL date (no UTC shift)
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function today() {
    // window.__upcToday ("YYYY-MM-DD") lets the local preview page test other
    // dates; the live Squarespace page never sets it.
    var t = parseDate(window.__upcToday);
    if (t) return t;
    var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
  function upcomingSunday() { var t = today(); t.setDate(t.getDate() + (7 - t.getDay()) % 7); return t; }
  function sameDay(a, b) { return a && b && a.getTime() === b.getTime(); }
  function longDate(d) { return MONTHS[d.getMonth()] + " " + d.getDate(); }
  function safeUrl(u) {
    if (!u || typeof u !== "string") return null;
    try {
      var abs = new URL(u, SRC);
      return (abs.protocol === "https:" || abs.protocol === "http:") ? abs.href : null;
    } catch (e) { return null; }
  }
  function link(text, url, cls) {
    var href = safeUrl(url);
    if (!href) return el("span", cls, text);
    var a = el("a", cls, text);
    a.href = href;
    if (!/^https?:\/\/(www\.)?upcplainfield\.com/i.test(href)) { a.target = "_blank"; a.rel = "noopener"; }
    return a;
  }
  function isUpcoming(dateStr) { var d = parseDate(dateStr); return !d || d >= today(); }

  // ------------------------------------------------------------ styles
  function injectStyles() {
    if (document.getElementById("upc-live-style")) return;
    var css = [
      ".upc-live{font-family:inherit;color:#000;text-align:left;line-height:1.45;overflow-wrap:anywhere}",
      ".upc-live *{box-sizing:border-box}",
      ".upc-live .upc-h{font-family:'Crimson Pro',Georgia,serif;font-weight:300;font-size:2rem;letter-spacing:-.03em;line-height:1.05;margin:0 0 .25em}",
      ".upc-live .upc-sub{font-size:.95rem;opacity:.75;margin:0 0 1em}",
      ".upc-live.upc-card,.upc-live .upc-card{background:#fff;border-radius:18px;padding:1.4rem 1.6rem;box-shadow:0 1px 4px rgba(0,0,0,.07)}",
      ".upc-live .upc-grid{display:grid;gap:.9rem}",
      ".upc-live .upc-times{display:grid;gap:.65rem;margin:.4rem 0 0}",
      ".upc-live .upc-time{display:grid;grid-template-columns:minmax(9rem,12.5rem) 1fr auto;align-items:baseline;gap:.15rem 1rem;border-top:1px solid #e3e3e3;padding-top:.6rem}",
      ".upc-live .upc-time b{font-weight:600}",
      ".upc-live .upc-time span{opacity:.85}",
      ".upc-live a.upc-btn,.upc-live a.upc-btn:visited{display:inline-block;background:#0033a0;color:#fff!important;border-radius:300px;padding:.7em 1.9em;font-weight:500;font-size:.95rem;text-decoration:none!important;letter-spacing:.02em;margin:.5rem .5rem 0 0}",
      ".upc-live a.upc-btn:hover{opacity:.88}",
      ".upc-live a.upc-link,.upc-live a.upc-link:visited{color:#0033a0!important;text-decoration:none!important;font-weight:500}",
      ".upc-live a.upc-link:hover{text-decoration:underline!important}",
      ".upc-live .upc-list{margin:.6rem 0 0;padding-left:1.15rem}",
      ".upc-live .upc-list li{margin:.3rem 0}",
      ".upc-live .upc-label{font-size:.78rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#0033a0;margin:1.1rem 0 .2rem}",
      ".upc-live .upc-months{display:grid;grid-template-columns:repeat(auto-fill,minmax(9.5rem,1fr));gap:.35rem .9rem;margin-top:.8rem;font-size:.95rem}",
      ".upc-live .upc-muted{opacity:.6}",
      ".upc-live .upc-event{display:grid;grid-template-columns:4.2rem 1fr;gap:1rem;align-items:start}",
      ".upc-live .upc-date{background:#0033a0;color:#fff;border-radius:14px;text-align:center;padding:.45rem 0 .5rem;line-height:1.05}",
      ".upc-live .upc-date small{display:block;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase}",
      ".upc-live .upc-date strong{display:block;font-size:1.65rem;font-weight:600}",
      ".upc-live .upc-event h4{font-family:'Crimson Pro',Georgia,serif;font-weight:400;font-size:1.35rem;margin:0 0 .15rem;letter-spacing:-.01em}",
      ".upc-live .upc-event p{margin:.15rem 0;font-size:.95rem}",
      ".upc-live .upc-flyer{display:block;margin-top:.6rem;max-width:100%;border-radius:12px}",
      ".upc-live .upc-stamp{font-size:.75rem;opacity:.5;margin-top:.9rem}",
      "@media (max-width:767px){.upc-live .upc-time{grid-template-columns:1fr;gap:.1rem}.upc-live.upc-card,.upc-live .upc-card{padding:1.1rem 1.1rem}.upc-live .upc-h{font-size:1.7rem}}"
    ].join("\n");
    var s = document.createElement("style");
    s.id = "upc-live-style";
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ------------------------------------------------------------ sections
  function renderThisWeek(box, data) {
    var sunday = upcomingSunday();
    var tw = data.this_week || {};
    var matches = sameDay(parseDate(tw.date), sunday);
    var wrap = el("div", "upc-live upc-card");

    var isToday = sameDay(sunday, today());
    wrap.appendChild(el("p", "upc-label", isToday ? "Today" : "This Sunday"));
    wrap.appendChild(el("h3", "upc-h", DAYS[0] + ", " + longDate(sunday)));
    if (matches && tw.title) wrap.appendChild(el("p", "upc-sub", tw.title));

    if (matches && tw.scripture && tw.scripture.length) {
      wrap.appendChild(el("p", null, "Scripture: " + tw.scripture.join("; ")));
    }
    var buttons = el("div");
    var sundayTimes = (data.service_times || [])[0];
    if (sundayTimes && sundayTimes.link) buttons.appendChild(link("Watch the 11:00 am service live", sundayTimes.link.url, "upc-btn"));
    if (matches && tw.bulletin_url) buttons.appendChild(link("This week's bulletin", tw.bulletin_url, "upc-btn"));
    if (buttons.childNodes.length) wrap.appendChild(buttons);

    // Recording of the most recent Sunday service, shown from that day through
    // the following week (8 days), then it drops off until the next one is set.
    var ls = data.last_service;
    var lsDate = ls && parseDate(ls.date);
    var lsUrl = ls && /^https:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}$/.test(ls.video_url || "") ? ls.video_url : null;
    var lsAge = lsDate ? Math.round((today() - lsDate) / 864e5) : -1;
    if (lsUrl && lsAge >= 0 && lsAge <= 7) {
      wrap.appendChild(el("p", "upc-label", lsAge === 0 ? "Today's service" : "Last Sunday"));
      wrap.appendChild(el("p", null, DAYS[lsDate.getDay()] + ", " + longDate(lsDate) + (ls.title ? " · " + ls.title : "")));
      wrap.appendChild(link("Watch the recording", lsUrl, "upc-btn"));
    }

    // Last Sunday's bulletin keeps showing its announcements through the week;
    // each item's own expiry decides when it goes. A bulletin dated for a later
    // Sunday stays hidden until its week. (An announcement may repeat an event
    // in Upcoming Events; a duplicate beats a dropped notice.)
    var twDate = parseDate(tw.date);
    var showAnns = matches || (twDate && twDate < sunday);
    var anns = (showAnns ? (tw.announcements || []) : []).filter(function (a) {
      if (!a || !a.text) return false;
      return isUpcoming(a.expires || a.date);
    });
    if (anns.length) {
      wrap.appendChild(el("p", "upc-label", matches ? "Announcements" : "This week"));
      var ul = el("ul", "upc-list");
      anns.forEach(function (a) { ul.appendChild(el("li", null, a.text)); });
      wrap.appendChild(ul);
    }

    if ((data.service_times || []).length) {
      wrap.appendChild(el("p", "upc-label", "Every week"));
      var times = el("div", "upc-times");
      data.service_times.forEach(function (t) {
        var row = el("div", "upc-time");
        row.appendChild(el("b", null, t.label));
        row.appendChild(el("span", null, t.when + (t.where ? " · " + t.where : "")));
        if (t.link) row.appendChild(link(t.link.text, t.link.url, "upc-link"));
        times.appendChild(row);
      });
      wrap.appendChild(times);
    }
    swap(box, wrap);
  }

  function renderNewsletters(box, data) {
    var list = (data.newsletters || []).filter(function (n) { return n && n.label; });
    if (!list.length) return;
    var wrap = el("div", "upc-live");
    var latest = list.filter(function (n) { return n.url; })[0];
    wrap.appendChild(el("h3", "upc-h", "Newsletters"));
    wrap.appendChild(el("p", "upc-sub", "Download the latest newsletter to stay connected with our church family."));
    if (latest) wrap.appendChild(link("Read the " + latest.label + " newsletter", latest.url, "upc-btn"));
    var grid = el("div", "upc-months");
    list.forEach(function (n) {
      if (n === latest) return;
      grid.appendChild(n.url ? link(n.label, n.url, "upc-link") : el("span", "upc-muted", n.label + (n.note ? " (" + n.note + ")" : "")));
    });
    wrap.appendChild(grid);
    swap(box, wrap);
  }

  function renderEvents(box, data) {
    var max = parseInt(box.getAttribute("data-max") || "4", 10);
    var upcoming = (data.events || []).filter(function (e) { return e && e.title && e.date && isUpcoming(e.date); })
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; })
      .slice(0, max);
    var wrap = el("div", "upc-live");
    wrap.appendChild(el("h3", "upc-h", "Upcoming Events"));
    if (!upcoming.length) {
      wrap.appendChild(el("p", "upc-sub", "See the latest newsletter for upcoming activities."));
      swap(box, wrap);
      return;
    }
    var grid = el("div", "upc-grid");
    upcoming.forEach(function (e) {
      var d = parseDate(e.date);
      var card = el("div", "upc-card upc-event");
      var badge = el("div", "upc-date");
      badge.appendChild(el("small", null, MONTHS[d.getMonth()].slice(0, 3)));
      badge.appendChild(el("strong", null, d.getDate()));
      card.appendChild(badge);
      var body = el("div");
      body.appendChild(el("h4", null, e.title));
      var when = DAYS[d.getDay()] + ", " + longDate(d) + (e.time ? " · " + e.time : "");
      body.appendChild(el("p", null, when));
      if (e.where) body.appendChild(el("p", "upc-muted", e.where));
      if (e.details) body.appendChild(el("p", null, e.details));
      var flyer = safeUrl(e.flyer);
      if (flyer) {
        var a = link("", flyer);
        var img = document.createElement("img");
        img.className = "upc-flyer"; img.src = flyer; img.alt = e.title + " flyer"; img.loading = "lazy";
        a.appendChild(img);
        body.appendChild(a);
      }
      card.appendChild(body);
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    swap(box, wrap);
  }

  function swap(box, node) { box.textContent = ""; box.appendChild(node); box.setAttribute("data-upc-ready", "1"); }

  // ------------------------------------------------------------ boot
  function valid(d) {
    return d && typeof d === "object" && d.version === 1 &&
      Array.isArray(d.service_times) && Array.isArray(d.newsletters) && Array.isArray(d.events);
  }
  function run() {
    var boxes = document.querySelectorAll("[data-upc-live]");
    if (!boxes.length || !window.fetch) return;
    var bust = Math.floor(Date.now() / 300000);           // refetch at most every 5 minutes
    fetch(SRC + (SRC.indexOf("?") < 0 ? "?" : "&") + "v=" + bust, {cache: "no-store"})
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (data) {
        if (!valid(data)) throw new Error("feed failed validation");
        injectStyles();
        Array.prototype.forEach.call(boxes, function (box) {
          try {
            var kind = box.getAttribute("data-upc-live");
            if (kind === "this-week") renderThisWeek(box, data);
            else if (kind === "newsletters") renderNewsletters(box, data);
            else if (kind === "events") renderEvents(box, data);
          } catch (e) { if (window.console) console.warn("upc-live:", kind, e); }
        });
      })
      .catch(function (e) { if (window.console) console.warn("upc-live: keeping fallback content.", e); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
