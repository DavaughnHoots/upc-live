/* UPC interactive Advent study for upcplainfield.com (Squarespace 7.1 code block).
 *
 * Code block contents:
 *   <div data-upc-advent>Loading the Advent study…</div>
 *   <script src=".../advent/upc-advent.js"></script>
 *
 * Content comes from advent-2026.json next to this script (or the script's
 * data-src attribute, or an inline <script type="application/json"
 * data-upc-advent-data> block). Each week is a list of short steps, one idea
 * per screen, with big Back and Next buttons.
 *
 * Privacy: notes and choices are kept only in the reader's own browser
 * (localStorage). Nothing is sent anywhere and no names are collected.
 * All text is inserted with textContent (never innerHTML).
 */
(function () {
  "use strict";
  if (window.__upcAdventLoaded) return;
  window.__upcAdventLoaded = true;

  var me = document.currentScript;
  var SRC = (me && me.getAttribute("data-src")) ||
            (me && me.src ? me.src.replace(/upc-advent\.js(\?.*)?$/, "advent-2026.json") : "advent-2026.json");
  var KEY = "upc-advent-2026";
  var BIBLE = "https://www.biblegateway.com/passage/?version=NRSVUE&search=";
  var canSpeak = "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function";

  // ------------------------------------------------------------ storage
  var state = { notes: {}, picks: {}, other: {}, big: false, last: null };
  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (s && typeof s === "object") {
          state.notes = s.notes || {};
          state.picks = s.picks || {};
          state.other = s.other || {};
          state.big = !!s.big;
          state.last = s.last || null;
        }
      }
    } catch (e) { /* private mode or blocked storage: work without saving */ }
  }
  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }, 250);
  }

  // ------------------------------------------------------------ helpers
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null && text !== "") e.textContent = String(text);
    return e;
  }
  function button(cls, text, onClick) {
    var b = el("button", cls, text);
    b.type = "button";
    if (onClick) b.addEventListener("click", onClick);
    return b;
  }
  function str(v) { return typeof v === "string" ? v : ""; }

  // ------------------------------------------------------------ styles
  function injectStyles() {
    if (document.getElementById("upc-adv-style")) return;
    var serif = "'Crimson Pro',Georgia,'Times New Roman',serif";
    var css = [
      ".upc-adv{font-family:inherit;color:#000;background:#fff;text-align:left;line-height:1.5;font-size:22px;overflow-wrap:anywhere;max-width:44rem;margin:0 auto;border-radius:18px;padding:1.25rem 1.1rem 1.5rem;box-sizing:border-box}",
      ".upc-adv.big{font-size:28px}",
      ".upc-adv *{box-sizing:border-box}",
      ".upc-adv [hidden]{display:none!important}",
      ".upc-adv p{margin:0 0 1em}",
      ".upc-adv h2{font-family:" + serif + ";font-weight:500;font-size:2.1em;line-height:1.1;margin:.1em 0 .5em;color:#000}",
      ".upc-adv h2:focus{outline:none}",
      ".upc-adv .a-label{font-size:.85em;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#0033a0;margin:0 0 .2em}",
      ".upc-adv .a-tools{display:flex;gap:.5rem;flex-wrap:wrap;margin:0 0 1rem}",
      ".upc-adv .a-tools button{flex:1 1 8rem}",
      ".upc-adv button{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}",
      ".upc-adv button:focus-visible,.upc-adv a:focus-visible,.upc-adv textarea:focus-visible,.upc-adv input:focus-visible{outline:4px solid #f2b705;outline-offset:3px}",
      ".upc-adv .a-tool{min-height:56px;font-size:.85em;font-weight:700;background:#fff;color:#0033a0;border:3px solid #0033a0;border-radius:14px;padding:.4rem .6rem}",
      ".upc-adv .a-tool[aria-pressed=true]{background:#0033a0;color:#fff}",
      ".upc-adv .a-progress{font-size:.85em;font-weight:600;color:#222;margin:0 0 .3rem}",
      ".upc-adv .a-bar{height:12px;background:#dfe5f2;border-radius:6px;overflow:hidden;margin:0 0 1.1rem}",
      ".upc-adv .a-bar span{display:block;height:100%;background:#0033a0;border-radius:6px}",
      ".upc-adv .a-nav{display:flex;gap:.7rem;margin-top:1.6rem}",
      ".upc-adv .a-next{flex:2;min-height:72px;background:#0033a0;color:#fff;border:0;border-radius:300px;font-size:1.15em;font-weight:700;padding:.6rem 1rem}",
      ".upc-adv .a-back{flex:1;min-height:72px;background:#fff;color:#0033a0;border:3px solid #0033a0;border-radius:300px;font-size:1em;font-weight:700;padding:.6rem .8rem}",
      ".upc-adv .a-primary{display:block;width:100%;min-height:72px;background:#0033a0;color:#fff;border:0;border-radius:300px;font-size:1.1em;font-weight:700;padding:.6rem 1rem;margin:.6rem 0;text-align:center;text-decoration:none}",
      ".upc-adv .a-secondary{display:block;width:100%;min-height:64px;background:#fff;color:#0033a0;border:3px solid #0033a0;border-radius:300px;font-size:1em;font-weight:700;padding:.6rem 1rem;margin:.6rem 0;text-align:center;text-decoration:none}",
      ".upc-adv .a-big{font-family:" + serif + ";font-size:1.55em;line-height:1.25;margin:0 0 .9em}",
      ".upc-adv .a-verse{font-family:" + serif + ";font-size:1.45em;line-height:1.3;margin:0 0 .4em;padding:.2em 0 .2em .8em;border-left:8px solid #0033a0}",
      ".upc-adv .a-ref{font-weight:700;margin:0 0 1em .9em;color:#222}",
      ".upc-adv .a-read{display:flex;align-items:center;justify-content:center;gap:.5em;width:100%;min-height:64px;background:#eef2fb;color:#0033a0;border:3px solid #0033a0;border-radius:16px;font-weight:700;padding:.5rem 1rem;margin:0 0 1.1em;text-decoration:none;text-align:center}",
      ".upc-adv .a-key{background:#fff6dc;border:3px solid #c99a00;border-radius:16px;padding:.9em 1em;margin:0 0 1em}",
      ".upc-adv .a-key h3,.upc-adv .a-circle-q h3{font-size:1em;font-weight:800;margin:0 0 .3em;color:#000}",
      ".upc-adv .a-key p{margin:0}",
      ".upc-adv .a-prayer{font-family:" + serif + ";font-style:italic;font-size:1.45em;line-height:1.3;text-align:center;background:#0033a0;color:#fff;border-radius:18px;padding:1em .9em;margin:0 0 1em}",
      ".upc-adv .a-small{font-size:.9em;color:#222;background:#f1f1f1;border-radius:12px;padding:.7em .9em;margin:1em 0 0}",
      ".upc-adv label{display:block;font-weight:700;margin:.2em 0 .4em}",
      ".upc-adv textarea{display:block;width:100%;min-height:7em;font:inherit;font-size:1em;line-height:1.4;padding:.7rem .8rem;border:3px solid #555;border-radius:14px;background:#fff;color:#000;resize:vertical}",
      ".upc-adv input[type=text]{display:block;width:100%;font:inherit;font-size:1em;padding:.6rem .8rem;border:3px solid #555;border-radius:14px;margin-top:.5em}",
      ".upc-adv .a-saved{font-size:.85em;color:#0b5a1e;font-weight:700;min-height:1.4em;margin:.3em 0 0}",
      ".upc-adv .a-opt{display:flex;align-items:center;gap:.7em;width:100%;min-height:68px;text-align:left;background:#fff;color:#000;border:3px solid #777;border-radius:16px;padding:.6rem .9rem;margin:0 0 .6rem;font-weight:600}",
      ".upc-adv .a-opt .a-dot{flex:0 0 auto;width:1.3em;height:1.3em;border:3px solid #0033a0;border-radius:50%;background:#fff}",
      ".upc-adv .a-opt[aria-pressed=true],.upc-adv .a-opt[aria-expanded=true]{border-color:#0033a0;background:#eef2fb}",
      ".upc-adv .a-opt[aria-pressed=true] .a-dot{background:#0033a0;box-shadow:inset 0 0 0 3px #fff}",
      ".upc-adv .a-opt .a-check{margin-left:auto;font-weight:800;color:#0b5a1e;font-size:.85em}",
      ".upc-adv .a-card{display:block;width:100%;min-height:96px;text-align:center;background:#eef2fb;color:#000;border:3px solid #0033a0;border-radius:18px;padding:.8rem 1rem;margin:0 0 .7rem}",
      ".upc-adv .a-card .a-front{display:block;font-family:" + serif + ";font-size:1.45em;font-weight:600;line-height:1.2}",
      ".upc-adv .a-card .a-back-text{display:block;font-size:1.05em;font-weight:700;color:#8a0000;margin-top:.2em}",
      ".upc-adv .a-card .a-hint{display:block;font-size:.8em;color:#0033a0;font-weight:700;margin-top:.3em}",
      ".upc-adv .a-card[aria-expanded=true]{background:#fff}",
      ".upc-adv .a-rings{display:block;margin:0 auto 1rem;width:100%;max-width:300px;height:auto}",
      ".upc-adv .a-circle{display:flex;align-items:center;gap:.7em;width:100%;min-height:72px;text-align:left;background:#fff;color:#000;border:3px solid #0033a0;border-radius:300px;padding:.5rem 1rem .5rem .6rem;margin:0 0 .6rem;font-weight:700}",
      ".upc-adv .a-circle .a-num{flex:0 0 auto;display:flex;align-items:center;justify-content:center;width:2em;height:2em;border-radius:50%;background:#0033a0;color:#fff;font-weight:800}",
      ".upc-adv .a-circle[aria-expanded=true]{background:#eef2fb}",
      ".upc-adv .a-circle-q{border:3px solid #0033a0;border-top:0;border-radius:0 0 18px 18px;padding:.8em .9em;margin:-1.1rem .6rem .8rem;background:#fff}",
      ".upc-adv .a-q{border:3px solid #0033a0;border-top:0;border-radius:0 0 16px 16px;padding:.8em .9em;margin:-.9rem .3rem .8rem;background:#fff}",
      ".upc-adv .a-week{display:block;width:100%;text-align:left;background:#fff;color:#000;border:3px solid #0033a0;border-radius:18px;padding:.9rem 1rem;margin:0 0 .8rem;min-height:80px}",
      ".upc-adv .a-week .a-wnum{display:block;font-size:.85em;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#0033a0}",
      ".upc-adv .a-week .a-wtitle{display:block;font-family:" + serif + ";font-size:1.4em;line-height:1.2;margin:.1em 0}",
      ".upc-adv .a-week .a-wwhen{display:block;font-size:.85em;color:#222}",
      ".upc-adv .a-week .a-go{display:inline-block;margin-top:.5em;background:#0033a0;color:#fff;border-radius:300px;padding:.35em 1em;font-weight:700}",
      ".upc-adv .a-week[disabled]{border-color:#999;background:#f3f3f3;cursor:default}",
      ".upc-adv .a-week[disabled] .a-wnum{color:#444}",
      ".upc-adv .a-hero{text-align:center;margin:0 0 1.2rem}",
      ".upc-adv .a-hero .a-label{margin-bottom:.3em}",
      ".upc-adv .a-hero h2{margin-bottom:.2em}",
      ".upc-adv .a-hero p{margin:0 0 .5em;color:#222}",
      ".upc-adv .a-credit{font-size:.75em;color:#333;margin-top:1.5rem}",
      ".upc-adv .a-notes-list h3{font-size:1em;font-weight:800;margin:1em 0 .2em}",
      ".upc-adv .a-notes-list p{white-space:pre-wrap;margin:0 0 .4em}",
      "@media (max-width:480px){.upc-adv{padding:1rem .75rem 1.25rem}.upc-adv h2{font-size:1.8em}}",
      "@media print{body *{visibility:hidden!important}.upc-adv-print,.upc-adv-print *{visibility:visible!important}.upc-adv-print{position:absolute;left:0;top:0;width:100%}.upc-adv-print button{display:none!important}}"
    ].join("\n");
    var s = document.createElement("style");
    s.id = "upc-adv-style";
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ------------------------------------------------------------ app
  function App(root, data) {
    this.root = root;
    this.data = data;
    this.weeks = Array.isArray(data.weeks) ? data.weeks : [];
    this.view = null;
    var self = this;
    window.addEventListener("hashchange", function () { self.route(); });
    window.addEventListener("pagehide", function () { self.stopSpeaking(); });
  }

  App.prototype.weekIndex = function (id) {
    for (var i = 0; i < this.weeks.length; i++) if (this.weeks[i].id === id) return i;
    return -1;
  };
  App.prototype.isOpen = function (w) { return w && Array.isArray(w.steps) && w.steps.length > 0; };

  App.prototype.go = function (hash) {
    if (location.hash === "#" + hash) this.route();
    else location.hash = hash;
  };

  // #advent (home), #advent-w1-3 (week w1, step 3), #advent-notes
  App.prototype.route = function () {
    var h = location.hash.replace(/^#/, "");
    var m = /^advent-(w\d+)-(\d+)$/.exec(h);
    if (m) {
      var wi = this.weekIndex(m[1]);
      var w = this.weeks[wi];
      if (this.isOpen(w)) {
        var si = Math.min(Math.max(parseInt(m[2], 10) - 1, 0), w.steps.length - 1);
        return this.renderStep(wi, si);
      }
    }
    if (h === "advent-notes") return this.renderNotes();
    if (h.indexOf("advent") === 0 || !this.view) return this.renderHome();
  };

  App.prototype.frame = function (view) {
    this.stopSpeaking();
    this.view = view;
    this.root.textContent = "";
    this.root.className = "upc-adv" + (state.big ? " big" : "");
    this.root.classList.remove("upc-adv-print");
    var self = this;
    var tools = el("div", "a-tools");
    if (view !== "home") {
      tools.appendChild(button("a-tool", "☰ All weeks", function () { self.go("advent"); }));
    }
    var bigBtn = button("a-tool", state.big ? "A− Smaller text" : "A+ Bigger text", function () {
      state.big = !state.big;
      save();
      self.root.classList.toggle("big", state.big);
      bigBtn.textContent = state.big ? "A− Smaller text" : "A+ Bigger text";
      bigBtn.setAttribute("aria-pressed", state.big ? "true" : "false");
    });
    bigBtn.setAttribute("aria-pressed", state.big ? "true" : "false");
    tools.appendChild(bigBtn);
    if (canSpeak && view === "step") {
      this.speakBtn = button("a-tool", "🔊 Read it to me", function () { self.toggleSpeak(); });
      this.speakBtn.setAttribute("aria-pressed", "false");
      tools.appendChild(this.speakBtn);
    }
    this.root.appendChild(tools);
    var body = el("div", "a-body");
    this.root.appendChild(body);
    return body;
  };

  App.prototype.focusTop = function (heading) {
    var r = this.root.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight * 0.5) {
      window.scrollTo(0, window.pageYOffset + r.top - 80);
    }
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      try { heading.focus({ preventScroll: true }); } catch (e) { heading.focus(); }
    }
  };

  // ---------------- home
  App.prototype.renderHome = function () {
    var self = this, d = this.data;
    var body = this.frame("home");
    var hero = el("div", "a-hero");
    hero.appendChild(el("p", "a-label", str(d.label)));
    var h = el("h2", null, str(d.title));
    hero.appendChild(h);
    if (d.author) hero.appendChild(el("p", null, d.author));
    body.appendChild(hero);
    if (d.prayer) body.appendChild(el("p", "a-prayer", d.prayer));

    var last = state.last;
    if (last && this.isOpen(this.weeks[this.weekIndex(last.w)]) && last.s > 1) {
      var lw = this.weeks[this.weekIndex(last.w)];
      body.appendChild(button("a-primary", "Continue where I left off: " + str(lw.number) + ", Step " + last.s,
        function () { self.go("advent-" + last.w + "-" + last.s); }));
    }

    body.appendChild(el("p", "a-label", "Choose a week"));
    this.weeks.forEach(function (w) {
      var open = self.isOpen(w);
      var b = button("a-week", null, open ? function () { self.go("advent-" + w.id + "-1"); } : null);
      b.appendChild(el("span", "a-wnum", str(w.number)));
      b.appendChild(el("span", "a-wtitle", open ? str(w.title) : "Coming soon"));
      if (w.when) b.appendChild(el("span", "a-wwhen", (open ? "Class: " : "Opens ") + w.when));
      if (open) b.appendChild(el("span", "a-go", "Start ▸"));
      else b.disabled = true;
      body.appendChild(b);
    });

    body.appendChild(button("a-secondary", "📝 See and print my notes", function () { self.go("advent-notes"); }));
    if (d.credit) body.appendChild(el("p", "a-credit", d.credit));
    this.focusTop(null);
  };

  // ---------------- step
  App.prototype.renderStep = function (wi, si) {
    var self = this, w = this.weeks[wi], step = w.steps[si] || {};
    var body = this.frame("step");
    var total = w.steps.length;
    state.last = { w: w.id, s: si + 1 };
    save();

    body.appendChild(el("p", "a-progress", str(w.number) + " · Step " + (si + 1) + " of " + total));
    var bar = el("div", "a-bar");
    bar.setAttribute("aria-hidden", "true");
    var fill = el("span");
    fill.style.width = Math.round(((si + 1) / total) * 100) + "%";
    bar.appendChild(fill);
    body.appendChild(bar);

    var content = el("div", "a-content");
    if (step.label) content.appendChild(el("p", "a-label", step.label));
    var h = el("h2", null, str(step.title));
    content.appendChild(h);
    (step.blocks || []).forEach(function (b) {
      var node = self.block(b, w);
      if (node) content.appendChild(node);
    });
    body.appendChild(content);
    this.content = content;

    var nav = el("div", "a-nav");
    if (si > 0) {
      nav.appendChild(button("a-back", "◂ Back", function () { self.go("advent-" + w.id + "-" + si); }));
    }
    if (si < total - 1) {
      nav.appendChild(button("a-next", "Next ▸", function () { self.go("advent-" + w.id + "-" + (si + 2)); }));
    } else {
      nav.appendChild(button("a-next", "Finish ✓", function () { state.last = null; save(); self.go("advent"); }));
    }
    body.appendChild(nav);
    this.focusTop(h);
  };

  App.prototype.noteBox = function (id, prompt, labelText) {
    var wrap = el("div", "a-note");
    var tid = "upc-adv-" + id;
    var lab = el("label", null, labelText || prompt || "My notes");
    lab.setAttribute("for", tid);
    wrap.appendChild(lab);
    var ta = el("textarea");
    ta.id = tid;
    ta.setAttribute("data-noread", "1");
    if (labelText && prompt) ta.placeholder = prompt;
    ta.value = str(state.notes[id]);
    var msg = el("p", "a-saved");
    msg.setAttribute("aria-live", "polite");
    var t = null;
    ta.addEventListener("input", function () {
      state.notes[id] = ta.value;
      save();
      clearTimeout(t);
      msg.textContent = "";
      t = setTimeout(function () { msg.textContent = "✓ Saved on this device only"; }, 600);
    });
    wrap.appendChild(ta);
    wrap.appendChild(msg);
    return wrap;
  };

  App.prototype.block = function (b, w) {
    var self = this;
    switch (b && b.t) {
      case "p": return el("p", null, str(b.text));
      case "big": return el("p", "a-big", str(b.text));
      case "small": return el("p", "a-small", str(b.text));
      case "verse": {
        var f = document.createDocumentFragment();
        f.appendChild(el("blockquote", "a-verse", "“" + str(b.text) + "”"));
        f.appendChild(el("p", "a-ref", str(b.ref)));
        return f;
      }
      case "read": {
        var a = el("a", "a-read", "📖 Read " + str(b.ref) + " in the Bible");
        a.href = BIBLE + encodeURIComponent(str(b.q || b.ref));
        a.setAttribute("data-noread", "1");
        return a;
      }
      case "key": {
        var k = el("div", "a-key");
        k.appendChild(el("h3", null, str(b.title)));
        k.appendChild(el("p", null, str(b.text)));
        return k;
      }
      case "prayer": return el("p", "a-prayer", str(b.text));
      case "note": return this.noteBox(b.id, b.prompt, "My notes");
      case "howto": {
        var hw = el("div", "a-key");
        hw.appendChild(el("h3", null, "How this works"));
        hw.appendChild(el("p", null, "Tap the big blue Next button to go on. Tap Back to go back."));
        hw.appendChild(el("p", null, "Anything you write stays on your own phone or computer. No one else sees it."));
        return hw;
      }
      case "reveal": {
        var rv = el("div");
        (b.items || []).forEach(function (it) {
          var c = button("a-card", null);
          c.setAttribute("aria-expanded", "false");
          c.appendChild(el("span", "a-front", str(it.front)));
          var back = el("span", "a-back-text", str(it.back));
          back.hidden = true;
          c.appendChild(back);
          var hint = el("span", "a-hint", "Tap to see");
          c.appendChild(hint);
          c.addEventListener("click", function () {
            var open = c.getAttribute("aria-expanded") !== "true";
            c.setAttribute("aria-expanded", open ? "true" : "false");
            back.hidden = !open;
            hint.textContent = open ? "Tap to hide" : "Tap to see";
          });
          rv.appendChild(c);
        });
        return rv;
      }
      case "questions": {
        var qs = el("div");
        (b.items || []).forEach(function (it, i) {
          var q = button("a-opt", null);
          q.setAttribute("aria-expanded", "false");
          var num = el("span", "a-dot");
          num.style.borderRadius = "8px";
          q.appendChild(num);
          q.appendChild(el("span", null, str(it.q)));
          var done = el("span", "a-check", state.notes[it.id] ? "✓" : "");
          q.appendChild(done);
          var panel = el("div", "a-q");
          panel.hidden = true;
          panel.appendChild(self.noteBox(it.id, null, "My answer"));
          panel.querySelector("textarea").addEventListener("input", function (e) {
            done.textContent = e.target.value ? "✓" : "";
          });
          q.addEventListener("click", function () {
            var open = q.getAttribute("aria-expanded") !== "true";
            q.setAttribute("aria-expanded", open ? "true" : "false");
            panel.hidden = !open;
          });
          qs.appendChild(q);
          qs.appendChild(panel);
        });
        return qs;
      }
      case "circles": {
        var cw = el("div");
        cw.appendChild(this.rings((b.items || []).length));
        (b.items || []).forEach(function (it, i) {
          var c = button("a-circle", null);
          c.setAttribute("aria-expanded", "false");
          c.appendChild(el("span", "a-num", String(i + 1)));
          c.appendChild(el("span", null, str(it.name)));
          var done = el("span", "a-check", state.notes[it.id] ? "✓" : "");
          done.style.marginLeft = "auto";
          done.style.color = "#0b5a1e";
          c.appendChild(done);
          var panel = el("div", "a-circle-q");
          panel.hidden = true;
          panel.appendChild(el("h3", null, str(it.q)));
          panel.appendChild(self.noteBox(it.id, null, "My answer"));
          panel.querySelector("textarea").addEventListener("input", function (e) {
            done.textContent = e.target.value ? "✓" : "";
          });
          c.addEventListener("click", function () {
            var open = c.getAttribute("aria-expanded") !== "true";
            c.setAttribute("aria-expanded", open ? "true" : "false");
            panel.hidden = !open;
          });
          cw.appendChild(c);
          cw.appendChild(panel);
        });
        return cw;
      }
      case "choose": {
        var ch = el("div");
        ch.setAttribute("role", "group");
        var opts = (b.options || []).slice();
        var buttons = [];
        var otherInput = null;
        function mark() {
          buttons.forEach(function (x) {
            x.btn.setAttribute("aria-pressed", state.picks[b.id] === x.val ? "true" : "false");
          });
          if (otherInput) otherInput.hidden = state.picks[b.id] !== "__other";
        }
        opts.forEach(function (o) {
          var ob = button("a-opt", null, function () {
            state.picks[b.id] = (state.picks[b.id] === o) ? null : o;
            save(); mark();
          });
          ob.appendChild(el("span", "a-dot"));
          ob.appendChild(el("span", null, o));
          buttons.push({ btn: ob, val: o });
          ch.appendChild(ob);
        });
        if (b.other) {
          var oth = button("a-opt", null, function () {
            state.picks[b.id] = (state.picks[b.id] === "__other") ? null : "__other";
            save(); mark();
            if (state.picks[b.id] === "__other") otherInput.focus();
          });
          oth.appendChild(el("span", "a-dot"));
          oth.appendChild(el("span", null, str(b.other) + ":"));
          buttons.push({ btn: oth, val: "__other" });
          ch.appendChild(oth);
          otherInput = el("input");
          otherInput.type = "text";
          otherInput.setAttribute("aria-label", str(b.other));
          otherInput.setAttribute("data-noread", "1");
          otherInput.placeholder = "Write your own";
          otherInput.value = str(state.other[b.id]);
          otherInput.addEventListener("input", function () { state.other[b.id] = otherInput.value; save(); });
          ch.appendChild(otherInput);
        }
        var tip = el("p", "a-small", "Your choice is saved on this device. We will remind you of it at the end of this week's study.");
        ch.appendChild(tip);
        mark();
        return ch;
      }
      case "mychoice": {
        var pick = this.pickText(b.id);
        if (!pick) return null;
        var mc = el("div", "a-key");
        mc.appendChild(el("h3", null, "My act of peace this week"));
        mc.appendChild(el("p", null, pick));
        return mc;
      }
      case "end": {
        var e = el("div");
        e.appendChild(button("a-secondary", "📝 See and print my notes", function () { self.go("advent-notes"); }));
        var next = this.weeks[this.weekIndex(w.id) + 1];
        if (next) {
          e.appendChild(el("p", "a-small", this.isOpen(next)
            ? str(next.number) + " is ready when you are."
            : str(next.number) + " opens " + str(next.when) + "."));
        }
        return e;
      }
    }
    return null;
  };

  App.prototype.pickText = function (id) {
    var p = state.picks[id];
    if (!p) return "";
    if (p === "__other") return str(state.other[id]) || "Another step toward peace";
    return p;
  };

  App.prototype.rings = function (n) {
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 300 300");
    svg.setAttribute("class", "a-rings");
    svg.setAttribute("aria-hidden", "true");
    var fills = ["#dfe5f2", "#bfcbe6", "#7f98cf", "#0033a0"];
    for (var i = 0; i < n; i++) {
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", "150"); c.setAttribute("cy", "150");
      c.setAttribute("r", String(145 - i * 35));
      c.setAttribute("fill", fills[i % fills.length]);
      c.setAttribute("stroke", "#fff"); c.setAttribute("stroke-width", "3");
      svg.appendChild(c);
      var t = document.createElementNS(NS, "text");
      t.setAttribute("x", "150");
      t.setAttribute("y", i === n - 1 ? "160" : String(150 - (145 - i * 35) + 26));
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("font-size", "24");
      t.setAttribute("font-weight", "800");
      t.setAttribute("fill", i >= 2 ? "#fff" : "#00205f");
      t.textContent = String(i + 1);
      svg.appendChild(t);
    }
    return svg;
  };

  // ---------------- notes
  App.prototype.renderNotes = function () {
    var self = this;
    var body = this.frame("notes");
    this.root.classList.add("upc-adv-print");
    var h = el("h2", null, "My Notes");
    body.appendChild(el("p", "a-label", str(this.data.title)));
    body.appendChild(h);
    body.appendChild(el("p", "a-small", "These notes are saved only on this phone or computer. No one else can see them."));
    var list = el("div", "a-notes-list");
    var any = false;
    this.weeks.forEach(function (w) {
      if (!self.isOpen(w)) return;
      var items = [];
      w.steps.forEach(function (st) {
        (st.blocks || []).forEach(function (b) {
          if (b.t === "note" && state.notes[b.id]) items.push([str(st.title), state.notes[b.id]]);
          if ((b.t === "questions") || (b.t === "circles")) {
            (b.items || []).forEach(function (it) {
              if (state.notes[it.id]) items.push([b.t === "circles" ? str(it.name) + ": " + str(it.q) : str(it.q), state.notes[it.id]]);
            });
          }
          if (b.t === "choose" && self.pickText(b.id)) items.push(["My act of peace this week", self.pickText(b.id)]);
        });
      });
      if (!items.length) return;
      any = true;
      list.appendChild(el("p", "a-label", str(w.number) + ": " + str(w.title)));
      items.forEach(function (it) {
        list.appendChild(el("h3", null, it[0]));
        list.appendChild(el("p", null, it[1]));
      });
    });
    if (!any) list.appendChild(el("p", null, "You have not written any notes yet. Your notes will appear here."));
    body.appendChild(list);
    if (any) body.appendChild(button("a-primary", "🖨 Print my notes", function () { window.print(); }));
    var erase = button("a-secondary", "Erase all my notes", function () {
      if (erase.getAttribute("data-armed") === "1") {
        state.notes = {}; state.picks = {}; state.other = {}; state.last = null;
        save();
        self.renderNotes();
      } else {
        erase.setAttribute("data-armed", "1");
        erase.textContent = "Tap again to erase everything";
      }
    });
    if (any) body.appendChild(erase);
    body.appendChild(button("a-back", "◂ Back to all weeks", function () { self.go("advent"); }));
    body.lastChild.style.width = "100%";
    body.lastChild.style.marginTop = "1rem";
    this.focusTop(h);
  };

  // ---------------- read aloud
  App.prototype.readableText = function () {
    if (!this.content) return "";
    var parts = [];
    var walk = function (n) {
      if (n.nodeType === 3) { parts.push(n.nodeValue); return; }
      if (n.nodeType !== 1) return;
      if (n.hidden || n.getAttribute("data-noread") || n.tagName === "TEXTAREA" || n.tagName === "INPUT" || n.tagName === "svg") return;
      if (n.classList.contains("a-hint") || n.classList.contains("a-check") || n.classList.contains("a-saved")) return;
      for (var c = n.firstChild; c; c = c.nextSibling) walk(c);
      if (/^(P|H2|H3|BLOCKQUOTE|DIV|BUTTON|LABEL)$/.test(n.tagName)) parts.push(". ");
    };
    walk(this.content);
    return parts.join(" ").replace(/[“”]/g, "").replace(/\s*\.\s*(\.\s*)+/g, ". ").replace(/\s+/g, " ").trim();
  };
  App.prototype.toggleSpeak = function () {
    if (this.speaking) { this.stopSpeaking(); return; }
    var text = this.readableText();
    if (!text) return;
    var self = this;
    var u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.onend = u.onerror = function () { self.markSpeaking(false); };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    this.markSpeaking(true);
  };
  App.prototype.stopSpeaking = function () {
    if (canSpeak) { try { window.speechSynthesis.cancel(); } catch (e) {} }
    this.markSpeaking(false);
  };
  App.prototype.markSpeaking = function (on) {
    this.speaking = on;
    if (this.speakBtn && this.speakBtn.isConnected) {
      this.speakBtn.textContent = on ? "■ Stop reading" : "🔊 Read it to me";
      this.speakBtn.setAttribute("aria-pressed", on ? "true" : "false");
    }
  };

  // ------------------------------------------------------------ boot
  function validate(d) {
    return d && typeof d === "object" && Array.isArray(d.weeks) && d.weeks.length > 0;
  }
  function start(root, data) {
    if (!validate(data)) return;
    injectStyles();
    load();
    var app = new App(root, data);
    app.route();
  }
  function boot() {
    var root = document.querySelector("[data-upc-advent]");
    if (!root) return;
    var inline = document.querySelector("script[type='application/json'][data-upc-advent-data]");
    if (inline) {
      try { start(root, JSON.parse(inline.textContent)); } catch (e) {}
      return;
    }
    var url = SRC + (SRC.indexOf("?") < 0 ? "?" : "&") + "v=" + Math.floor(Date.now() / 600000);
    fetch(url, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) { start(root, d); })
      .catch(function () { /* keep the fallback text in the code block */ });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
