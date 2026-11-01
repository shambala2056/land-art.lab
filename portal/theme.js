// Portal light / dark switch, top navigation and the motion layer: a circular
// reveal when the theme changes, a sliding pill on the section tabs, a hand-off
// between sections (page fades, skeletons and a rising tide, then cards come up
// one by one) and the glow-and-waves backdrop. Follows the system theme until
// the user picks one.
(function () {
  var KEY = 'portal-theme';
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function current() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  var s = saved();
  if (s === 'light' || s === 'dark') root.setAttribute('data-theme', s);

  /* ---- Theme toggle ---- */

  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';

  function paint(btn) {
    var dark = current() === 'dark';
    btn.innerHTML = dark ? SUN : MOON;
    btn.setAttribute('aria-label', dark ? 'Цайвар горим' : 'Бараан горим');
    btn.title = btn.getAttribute('aria-label');
  }

  function setTheme(next) {
    root.setAttribute('data-theme', next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
    document.querySelectorAll('.pt-theme-toggle').forEach(paint);
  }

  // The new theme opens out of the button as a growing circle.
  function toggle(btn) {
    var next = current() === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || reduced) return setTheme(next);
    var r = btn.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(function () { setTheme(next); }).ready.then(function () {
      root.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + end + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 450, easing: 'cubic-bezier(.55, 0, .75, .4)', pseudoElement: '::view-transition-new(root)' }
      );
    });
  }

  function makeToggle() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pt-theme-toggle';
    btn.addEventListener('click', function () { toggle(btn); });
    paint(btn);
    return btn;
  }

  // Sits in the header next to the bell when there is one; floats otherwise.
  function placeToggle() {
    var bell = document.querySelector('.las-headbar button[aria-label="Мэдэгдэл"]');
    var slot = bell && bell.parentElement && bell.parentElement.parentElement;
    var btn = document.querySelector('.pt-theme-toggle');
    if (slot) {
      if (btn && btn.parentElement === slot) return;
      if (btn) btn.remove();
      slot.insertBefore(makeToggle(), bell.parentElement);
    } else if (!btn) {
      btn = makeToggle();
      btn.classList.add('is-floating');
      document.body.appendChild(btn);
    } else if (!btn.classList.contains('is-floating')) {
      btn.remove();
      placeToggle();
    }
  }

  /* ---- Backdrop ---- */

  function wave(d) {
    return '<div class="pt-wave"><svg viewBox="0 0 2880 160" preserveAspectRatio="none"><path fill="currentColor" d="' + d + '"/></svg></div>';
  }
  function addAtmosphere() {
    if (document.querySelector('.pt-atmos')) return;
    var el = document.createElement('div');
    el.className = 'pt-atmos';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      wave('M0 90 C240 40 480 140 720 90 S1200 40 1440 90 S1920 140 2160 90 S2640 40 2880 90 V160 H0Z') +
      wave('M0 110 C360 70 720 150 1080 110 S1800 70 2160 110 S2700 150 2880 110 V160 H0Z');
    document.body.appendChild(el);
  }

  /* ---- Top navigation ---- */

  function norm(p) { return p.replace(/\/+$/, '') || '/'; }

  // The sidebar is hidden but still owns the real links; the tabs mirror it.
  function sections() {
    return Array.prototype.map.call(document.querySelectorAll('.las-sidebar nav a[href]'), function (a) {
      var spans = a.querySelectorAll('span');
      return { href: a.getAttribute('href'), label: (spans[spans.length - 1] || a).textContent.trim() };
    });
  }

  function buildNav() {
    var bar = document.querySelector('.las-headbar');
    if (!bar || bar.querySelector('.pt-topnav')) return;
    var list = sections();
    if (!list.length) return;

    var nav = document.createElement('div');
    nav.className = 'pt-topnav';
    var logo = document.querySelector('.las-sidebar img');
    if (logo) {
      var a = document.createElement('div');
      a.className = 'pt-topnav-logo';
      var img = document.createElement('img');
      img.src = logo.getAttribute('src');
      img.alt = logo.alt;
      a.appendChild(img);
      nav.appendChild(a);
    }
    var tabs = document.createElement('div');
    tabs.className = 'pt-tabs';
    tabs.setAttribute('role', 'tablist');
    tabs.innerHTML = '<span class="pt-tab-ind" aria-hidden="true"></span>';
    list.forEach(function (sct) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pt-tab';
      b.setAttribute('role', 'tab');
      b.dataset.href = sct.href;
      b.textContent = sct.label;
      b.addEventListener('click', function () { go(sct.href); });
      tabs.appendChild(b);
    });
    nav.appendChild(tabs);
    bar.insertBefore(nav, bar.firstChild);

    var header = bar.parentElement;
    if (!header.querySelector('.pt-crumbs')) {
      var c = document.createElement('div');
      c.className = 'pt-crumbs';
      c.innerHTML = '<div class="pt-crumbs-path"></div><div class="pt-crumbs-status"></div>';
      bar.after(c);
    }
    syncNav(true);
  }

  function activeTab() {
    var here = norm(location.pathname), best = null;
    document.querySelectorAll('.pt-tab').forEach(function (b) {
      var h = norm(b.dataset.href);
      if (here === h || (h !== '/portal' && here.indexOf(h + '/') === 0)) best = b;
    });
    return best;
  }

  // The pill stretches: its leading edge runs to the new tab first, then the
  // trailing edge catches up.
  // Each page draws its own header, so the pill can be rebuilt mid-move; the
  // move is remembered and picked up where it was on the new pill.
  var PILL_MS = 520, indAnim = null, pillMove = null;
  function runPill(ind, m, elapsed) {
    var R0 = m.L0 + m.W0, R1 = m.L1 + m.W1;
    var mid = m.L1 > m.L0
      ? { transform: 'translateX(' + m.L0 + 'px)', width: (R1 - m.L0) + 'px' }
      : { transform: 'translateX(' + m.L1 + 'px)', width: (R0 - m.L1) + 'px' };
    mid.offset = 0.5;
    indAnim = ind.animate([
      { transform: 'translateX(' + m.L0 + 'px)', width: m.W0 + 'px' },
      mid,
      { transform: 'translateX(' + m.L1 + 'px)', width: m.W1 + 'px' }
    ], { duration: PILL_MS, easing: 'cubic-bezier(.65, 0, .35, 1)' });
    indAnim.currentTime = elapsed;
  }
  function movePill(tab, instant) {
    var ind = document.querySelector('.pt-tab-ind');
    if (!ind || !tab) return;
    var L1 = tab.offsetLeft - 4, W1 = tab.offsetWidth;
    var L0 = parseFloat(ind.dataset.l), W0 = parseFloat(ind.dataset.w);
    if (L0 === L1 && W0 === W1) return;
    ind.dataset.l = L1; ind.dataset.w = W1;
    ind.style.transform = 'translateX(' + L1 + 'px)';
    ind.style.width = W1 + 'px';
    if (indAnim) indAnim.cancel();
    if (reduced) return;
    var elapsed = pillMove ? performance.now() - pillMove.t0 : PILL_MS;
    if (isNaN(L0) && pillMove && pillMove.L1 === L1 && elapsed < PILL_MS) {
      return runPill(ind, pillMove, elapsed);
    }
    if (instant || isNaN(L0)) return;
    pillMove = { L0: L0, W0: W0, L1: L1, W1: W1, t0: performance.now() };
    runPill(ind, pillMove, 0);
  }

  function syncNav(instant) {
    var tab = activeTab();
    document.querySelectorAll('.pt-tab').forEach(function (b) {
      b.classList.toggle('is-active', b === tab);
      b.setAttribute('aria-selected', b === tab ? 'true' : 'false');
    });
    if (tab) {
      movePill(tab, instant);
      tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    var path = document.querySelector('.pt-crumbs-path');
    if (path) path.innerHTML = 'Портал<span class="sep">›</span><b>' + (tab ? tab.textContent : '') + '</b>';
    tick();
  }

  function tick() {
    var st = document.querySelector('.pt-crumbs-status');
    if (!st) return;
    var d = new Date();
    st.textContent = 'Систем онлайн · ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  /* ---- Moving between sections ---- */

  var bypass = false, leaving = false, lastPath = location.pathname, leaveTimer, leftMain = null;

  function realLink(href) {
    return document.querySelector('.las-sidebar nav a[href="' + href + '"]');
  }

  // Let the current page go, then hand the click to the app's own router.
  function go(href, anchor) {
    if (norm(href) === norm(location.pathname)) return;
    document.querySelectorAll('.pt-tab').forEach(function (b) {
      if (norm(b.dataset.href) === norm(href)) {
        movePill(b);
        document.querySelectorAll('.pt-tab').forEach(function (x) { x.classList.toggle('is-active', x === b); });
      }
    });
    leave();
    setTimeout(function () {
      var a = (anchor && anchor.isConnected) ? anchor : realLink(href);
      if (!a) { location.href = href; return; }
      bypass = true;
      a.click();
      bypass = false;
    }, reduced ? 0 : 180);
  }

  function leave() {
    if (reduced) return;
    var main = document.querySelector('.las-content');
    if (!main) return;
    leaving = true;
    leftMain = main;
    main.classList.add('pt-leaving');
    var at = document.querySelector('.pt-atmos');
    if (at) at.classList.add('pt-tide');
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(arrive, 3000);
  }

  function arrive() {
    clearTimeout(leaveTimer);
    leaving = false;
    var main = document.querySelector('.las-content');
    if (main) {
      main.classList.remove('pt-leaving');
      main.querySelectorAll(CARD).forEach(function (el) { queue.push(el); });
    }
    whenPageReady();
    var at = document.querySelector('.pt-atmos');
    if (at) setTimeout(function () { at.classList.remove('pt-tide'); }, 150);
    scheduleRise();
  }

  // The route changes a moment before the new page has drawn; wait for its title.
  function whenPageReady() {
    var tries = 0;
    (function look() {
      var main = document.querySelector('.las-content');
      // Hold off while the page that just left is still the one in the DOM.
      if (main === leftMain && tries < 8) { tries++; return setTimeout(look, 30); }
      if (main && typeTitle(main)) return drawBars(main);
      if (++tries < 25) setTimeout(look, 30);
      else if (main) drawBars(main);
    })();
  }
  function typeTitle(main) {
    if (reduced) return true;
    var h = main.querySelector('h1, h2');
    if (!h) {
      h = Array.prototype.find.call(main.querySelectorAll('div, span, p'), function (el) {
        return el.children.length === 0 && el.textContent.trim().length > 2 &&
          parseFloat(getComputedStyle(el).fontSize) >= 22;
      });
    }
    if (!h) return false;
    if (h.dataset.ptTyped === location.pathname) return true;
    var node = Array.prototype.find.call(h.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
    if (!node) return false;
    h.dataset.ptTyped = location.pathname;
    // Letters rise one after another out of a mask at the baseline, so each
    // shows its top first. React's text node is set aside and put back after.
    var full = node.textContent, mask = document.createElement('span');
    mask.className = 'pt-rise';
    mask.setAttribute('aria-label', full);
    var step = Math.max(14, Math.min(26, 360 / full.length)), last = null;
    Array.prototype.forEach.call(full, function (ch, i) {
      var c = document.createElement('span');
      c.textContent = ch;
      c.setAttribute('aria-hidden', 'true');
      mask.appendChild(c);
      last = c.animate(
        [{ transform: 'translateY(105%)' }, { transform: 'none' }],
        { duration: 300, delay: i * step, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' }
      );
    });
    node.replaceWith(mask);
    var restore = function () { if (mask.isConnected) mask.replaceWith(node); };
    if (last) last.finished.then(restore, restore); else restore();
    return true;
  }

  // Progress bars draw from the left, as the route line does in the reference.
  function drawBars(main) {
    if (reduced) return;
    var i = 0;
    main.querySelectorAll('[style*="transition: width"]').forEach(function (el) {
      var w = el.style.width;
      if (!w || parseFloat(w) === 0) return;
      el.animate([{ width: '0%' }, { width: w }],
        { duration: 900, delay: 200 + (i++) * 60, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'backwards' });
    });
  }

  // A ring opens under the pointer on every press.
  document.addEventListener('pointerdown', function (e) {
    if (reduced || e.button !== 0) return;
    if (!e.target.closest || !e.target.closest('button, a, [role="tab"], [role="button"], input[type="checkbox"], select')) return;
    var r = document.createElement('span');
    r.className = 'pt-ring';
    r.style.left = e.clientX + 'px';
    r.style.top = e.clientY + 'px';
    document.body.appendChild(r);
    r.addEventListener('animationend', function () { r.remove(); });
  }, true);

  document.addEventListener('click', function (e) {
    if (bypass || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname.indexOf('/portal/') !== 0) return;
    if (norm(url.pathname) === norm(location.pathname)) return;
    e.preventDefault();
    e.stopPropagation();
    go(a.getAttribute('href'), a);
  }, true);

  /* ---- Cards rise in one after another as a page renders ---- */

  var CARD = '[style*="--pt-shadow-card"], [style*="--pt-tone-"], [style*="--pt-brand-bg"]';
  var queue = [], scheduled = false, lastRun = new WeakMap();
  function scheduleRise() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(rise); }
  }
  function rise() {
    scheduled = false;
    if (reduced || leaving) { if (!leaving) queue.length = 0; return; }
    var now = performance.now(), seen = new Set();
    var batch = queue.splice(0).filter(function (el) {
      if (seen.has(el) || !el.isConnected || el.parentElement.closest(CARD)) return false;
      if (now - (lastRun.get(el) || -1e9) < 800) return false;
      seen.add(el);
      return true;
    });
    // Reading order: row by row, left to right within a row.
    var pos = new Map();
    batch.forEach(function (el) { var r = el.getBoundingClientRect(); pos.set(el, [Math.round(r.top / 24), r.left]); });
    batch.sort(function (a, b) { var p = pos.get(a), q = pos.get(b); return p[0] - q[0] || p[1] - q[1]; });
    batch.forEach(function (el, i) {
      lastRun.set(el, now);
      el.animate(
        [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
        { duration: 380, delay: 60 + Math.min(i, 12) * 65, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' }
      );
    });
  }
  function collect(node) {
    if (node.nodeType !== 1 || node.closest('.pt-atmos, .pt-skel')) return;
    if (node.matches(CARD)) queue.push(node);
    else node.querySelectorAll(CARD).forEach(function (el) { queue.push(el); });
  }

  function watch() {
    document.querySelectorAll(CARD).forEach(function (el) { queue.push(el); });
    scheduleRise();
    whenPageReady();
    new MutationObserver(function (records) {
      records.forEach(function (r) { r.addedNodes.forEach(collect); });
      buildNav();
      placeToggle();
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        syncNav(false);
        if (leaving) arrive();
      }
      if (queue.length) scheduleRise();
    }).observe(document.body, { childList: true, subtree: true });
    addEventListener('popstate', function () { setTimeout(function () { syncNav(false); }, 0); });
    addEventListener('resize', function () { syncNav(true); });
    setInterval(tick, 30000);
  }

  // Added after hydration so React never sees a node it didn't render.
  function mount() {
    addAtmosphere();
    buildNav();
    placeToggle();
    watch();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      document.querySelectorAll('.pt-theme-toggle').forEach(paint);
    });
  }

  if (document.readyState === 'complete') setTimeout(mount, 0);
  else window.addEventListener('load', function () { setTimeout(mount, 0); });
})();
