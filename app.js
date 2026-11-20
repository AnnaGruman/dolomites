/* בונה את האתר מתוך data.js. אין צורך לערוך את הקובץ הזה. */
(function () {
  var S = window.SITE;
  var TODO = /\[להשלים[^\]]*\]/;
  var todoCount = 0;
  var $ = function (id) { return document.getElementById(id); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  // טקסט עם סימון צהוב לכל [להשלים]
  function txt(s) {
    return esc(s).replace(/\[להשלים[^\]]*\]/g, function (m) { todoCount++; return '<mark class="todo">' + m + "</mark>"; });
  }
  function placeholder(file, label) {
    todoCount++;
    return '<div class="ph"><div>📷 חסרה תמונה<br><b>' + esc(file || label) + "</b></div></div>";
  }
  // תמונה; אם הקובץ חסר מוחלפת במקום מסומן
  function photo(src, alt, extra) {
    if (!src) return placeholder("", alt);
    return '<img src="' + esc(src) + '" alt="' + esc(alt) + '" width="1080" height="1350" loading="lazy" decoding="async" ' + (extra || "") +
      ' onerror="window.__missing(this,\'' + esc(src) + '\')">';
  }
  // גלריה להחלקה: התמונה הראשית ואחריה התמונות הנוספות
  function gallery(main, extra, alt) {
    var items = [main].concat(extra || []).filter(Boolean).map(function (g) { return typeof g === "string" ? { src: g } : g; });
    if (items.length < 2) {
      var st = (items[0].pos ? "object-position:" + esc(items[0].pos) + ";" : "") + (items[0].ratio ? "aspect-ratio:" + esc(items[0].ratio) + ";" : "");
      return photo(items[0].src, alt, st ? 'style="' + st + '"' : "");
    }
    var slides = items.map(function (g, i) {
      return '<div class="slide">' + photo(g.src, alt + " " + (i + 1), g.pos ? 'style="object-position:' + esc(g.pos) + '"' : "") + "</div>";
    }).join("");
    var dots = items.map(function (_, i) { return '<span class="dot' + (i ? "" : " on") + '"></span>'; }).join("");
    return '<div class="gallery"><div class="track">' + slides + '</div><div class="dots" aria-hidden="true">' + dots +
      '</div><span class="count">1/' + items.length + "</span></div>";
  }
  window.__missing = function (img, file) {
    var d = document.createElement("div");
    d.innerHTML = placeholder(file);
    img.replaceWith(d.firstChild);
    updateTodoBar();
    console.warn("חסרה תמונה:", file);
  };
  // מחרוזת = פסקה, מערך = רשימה עם נקודות
  function blocks(arr) {
    if (!Array.isArray(arr)) arr = [arr];
    return arr.map(function (b) {
      return Array.isArray(b)
        ? '<ul class="bullets">' + b.map(function (li) { return "<li>" + txt(li) + "</li>"; }).join("") + "</ul>"
        : "<p>" + txt(b) + "</p>";
    }).join("");
  }
  function safeUrl(u) { return /^https:\/\//.test(u || "") ? u : "#"; }
  function mapsUrl(p) {
    var q = p.query || (p.lat + "," + p.lng);
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
  }

  // Hero
  document.title = S.title + " · " + S.kicker;
  $("title").innerHTML = txt(S.title);
  $("subtitle").innerHTML = txt(S.subtitle);
  $("kicker").innerHTML = txt(S.kicker);
  $("intro").innerHTML = blocks(S.intro) + (S.introNote ? '<p class="hint">' + txt(S.introNote) + "</p>" : "");
  var cover = $("cover"), hero = document.querySelector(".hero");
  cover.alt = S.title + " · " + S.subtitle;
  cover.onerror = function () {
    cover.remove();
    todoCount++; updateTodoBar(); console.warn("חסרה תמונה:", S.cover);
  };
  if (S.coverTextPos === "top") hero.classList.add("top");
  cover.src = S.cover;


  // Nav + days
  var nav = "", days = "";
  S.days.forEach(function (d, i) {
    var n = i + 1;
    nav += '<li><a class="day-link" href="#day' + n + '" aria-label="יום ' + n + '">' + n + "</a></li>";
    var pts = (d.points || []).map(function (p) {
      return '<li><span class="nm">📍 ' + txt(p.name) + (p.note ? '<span class="note">' + txt(p.note) + "</span>" : "") +
        '</span><a class="btn" href="' + mapsUrl(p) + '" target="_blank" rel="noopener">ניווט ↗</a></li>';
    }).join("");
    days += '<article class="day" id="day' + n + '">' +
      '<div class="day-photo">' + gallery(d.image, d.gallery, d.title) + "</div>" +
      '<div class="wrap"><span class="chip">יום ' + n + "</span><h2>" + txt(d.title) + "</h2>" +
      '<div class="day-text">' + blocks(d.text || []) + "</div>" +
      (d.links && d.links.length ? '<div class="links">' + d.links.map(function (l) {
        return '<a class="btn btn-soft" href="' + esc(safeUrl(l.url)) + '" target="_blank" rel="noopener">' + txt(l.label) + " ↗</a>";
      }).join("") + "</div>" : "") +
      (d.tip ? '<div class="tip"><span class="tip-ico">📸</span><div><b>טיפ צילום</b>' + txt(d.tip) + "</div></div>" : "") +
      (pts ? '<ul class="points">' + pts + "</ul>" : "") +
      "</div></article>";
  });
  $("nav-days").innerHTML = nav;
  $("days").innerHTML = days;

  // Base town
  if (S.base) {
    $("base-sec").hidden = false;
    $("base").innerHTML = '<span class="chip">' + txt(S.base.chip) + "</span><h2>" + txt(S.base.title) + "</h2>" +
      (S.base.image ? '<div class="base-photo">' + photo(S.base.image, S.base.title) + "</div>" : "") +
      '<div class="day-text">' + blocks(S.base.text || []) + "</div>";
  }

  // Hotels
  $("hotels").innerHTML = S.hotels.map(function (h) {
    return '<article class="hotel">' + (h.image ? gallery(h.image, h.gallery, h.name) : "") +
      '<div class="hotel-body"><h3>' + txt(h.name) + "</h3>" +
      '<div class="where">' + txt(h.place) + (h.nights ? '<span class="nights">' + txt(h.nights) + "</span>" : "") + "</div>" +
      (h.text ? "<p>" + txt(h.text) + "</p>" : "") + "</div></article>";
  }).join("");

  $("know").innerHTML = S.knowBefore.map(function (k) { return "<li>" + txt(k) + "</li>"; }).join("");
  $("prices").innerHTML = S.prices.map(function (p) { return "<dt>" + txt(p.item) + "</dt><dd>" + txt(p.price) + "</dd>"; }).join("");
  $("prices-note").innerHTML = txt(S.pricesNote || "");

  $("outro-title").innerHTML = txt(S.outroTitle);
  $("outro-text").innerHTML = txt(S.outroText);
  var ig = $("ig-btn");
  ig.href = S.instagram; ig.textContent = S.outroButton + " ↗";
  $("ig-handle").textContent = S.instagramHandle || "";
  var share = $("share-btn"), siteUrl = S.siteUrl || location.href.split("#")[0];
  share.href = "https://wa.me/?text=" + encodeURIComponent((S.shareText || "") + "\n" + siteUrl);
  share.textContent = S.shareButton || "שלחו למי שטס איתכם ✈️";
  if (S.hireText) {
    $("hire").innerHTML = txt(S.hireText) + (S.hireLinkText ? ' <a href="' + esc(safeUrl(S.hireUrl || S.instagram)) + '" target="_blank" rel="noopener">' + txt(S.hireLinkText) + "</a>" : "");
  }
  $("year").textContent = new Date().getFullYear();

  function updateTodoBar() {
    var bar = $("todo-bar");
    if (!todoCount) { bar.hidden = true; document.body.classList.remove("has-todo"); return; }
    bar.hidden = false;
    document.body.classList.add("has-todo");
    bar.textContent = "⚠️ נשארו " + todoCount + " דברים להשלים (מסומנים בצהוב). הפס ייעלם כשהכל יושלם ב-data.js";
  }
  updateTodoBar();

  // Map
  function goDay(n) {
    var el = $("day" + n);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (window.L) {
    var touch = window.matchMedia("(pointer:coarse)").matches;
    var map = L.map("map", { scrollWheelZoom: false, dragging: !touch, tap: false, zoomControl: true, zoomSnap: 0.25 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    var line = [], all = [], focus = [], pins = [];
    S.days.forEach(function (d, i) {
      var n = i + 1;
      (d.points || []).forEach(function (p, j) {
        if (typeof p.lat !== "number" || typeof p.lng !== "number") return;
        var ll = L.latLng(p.lat, p.lng);
        line.push(ll); all.push(ll);
        if (p.lat >= (S.mapFocusMinLat || 46.3)) focus.push(ll);
        if (p.map === false) return; // נקודה בלי סיכה (רק כפתור ניווט)
        pins.push({ ll: ll, n: n, first: j === 0, name: p.name.replace(TODO, "") });
      });
    });
    L.polyline(line, { color: "#c07a5c", weight: 3, opacity: .85, dashArray: "6 7" }).addTo(map);

    // סיכות קרובות מתאחדות לסיכה אחת ("2·3"). לחיצה עליה מגדילה את האזור
    var pinLayer = L.layerGroup().addTo(map);
    function drawPins() {
      pinLayer.clearLayers();
      var groups = [];
      pins.forEach(function (pn) {
        var pt = map.latLngToLayerPoint(pn.ll), g = null;
        for (var k = 0; k < groups.length; k++) if (groups[k].pt.distanceTo(pt) < 36) { g = groups[k]; break; }
        if (g) g.items.push(pn); else groups.push({ pt: pt, items: [pn] });
      });
      // איחוד חוזר: קבוצות שהמרכזים שלהן עדיין קרובים מתאחדות
      function centerOf(g) { var x = 0, y = 0; g.items.forEach(function (it) { var q = map.latLngToLayerPoint(it.ll); x += q.x; y += q.y; }); return L.point(x / g.items.length, y / g.items.length); }
      var merged = true;
      while (merged) {
        merged = false;
        for (var a = 0; a < groups.length && !merged; a++) for (var c = a + 1; c < groups.length && !merged; c++) {
          if (centerOf(groups[a]).distanceTo(centerOf(groups[c])) < 40) { groups[a].items = groups[a].items.concat(groups[c].items); groups.splice(c, 1); merged = true; }
        }
      }
      groups.forEach(function (g) {
        var days = [];
        g.items.forEach(function (it) { if (days.indexOf(it.n) < 0) days.push(it.n); });
        days.sort(function (a, b) { return a - b; });
        var label = days.join("·"), w = Math.max(30, 14 + label.length * 9);
        var multi = days.length > 1;
        var icon = L.divIcon({ className: "", html: '<div class="pin' + (multi ? " multi" : (g.items[0].first ? " first" : "")) + '" style="width:' + w + 'px">' + label + "</div>", iconSize: [w, 30], iconAnchor: [w / 2, 15] });
        var lls = g.items.map(function (it) { return it.ll; });
        var center = L.latLngBounds(lls).getCenter();
        var tip = g.items.map(function (it) { return "יום " + it.n + " · " + it.name; }).join("<br>");
        L.marker(multi ? center : g.items[0].ll, { icon: icon, title: g.items.map(function (it) { return it.name; }).join(", "), zIndexOffset: multi ? 200 : (g.items[0].first ? 100 : 0) })
          .addTo(pinLayer)
          .bindTooltip(tip, { direction: "top", offset: [0, -14] })
          .on("click", function () {
            if (!multi) { goDay(days[0]); return; }
            map.flyToBounds(L.latLngBounds(lls), { padding: [60, 60], maxZoom: 15, duration: .6 });
            showingAll = false; if (toggleBtn) toggleBtn.textContent = "הצג את כל המסלול";
          });
      });
    }
    map.on("zoomend", drawPins);

    // פתיחה בזום על הדולומיטים + כפתור "הצג את כל המסלול"
    var showingAll = false, toggleBtn = null;
    function showFocus() { map.fitBounds(L.latLngBounds(focus.length ? focus : all), { padding: [26, 26] }); }
    function showAll() { map.fitBounds(L.latLngBounds(all), { paddingTopLeft: [60, 40], paddingBottomRight: [70, 70] }); }
    var ToggleCtl = L.Control.extend({
      options: { position: "bottomright" },
      onAdd: function () {
        var b = toggleBtn = L.DomUtil.create("button", "map-toggle");
        b.type = "button";
        b.textContent = "הצג את כל המסלול";
        L.DomEvent.disableClickPropagation(b);
        L.DomEvent.on(b, "click", function () {
          showingAll = !showingAll;
          if (showingAll) showAll(); else showFocus();
          b.textContent = showingAll ? "חזרה לדולומיטים" : "הצג את כל המסלול";
        });
        return b;
      }
    });
    map.addControl(new ToggleCtl());
    showFocus();
    drawPins();
    if (touch) {
      // בטלפון: אצבע אחת גוללת את הדף, שתי אצבעות מזיזות את המפה
      map.getContainer().addEventListener("touchstart", function (e) {
        if (e.touches.length > 1) map.dragging.enable(); else map.dragging.disable();
      }, { passive: true });
    }
  } else {
    $("map").innerHTML = '<p style="padding:20px">המפה לא נטענה. רעננו את הדף.</p>';
  }

  // Gallery dots + counter
  document.querySelectorAll(".gallery").forEach(function (g) {
    var track = g.querySelector(".track"), dots = g.querySelectorAll(".dot"), count = g.querySelector(".count");
    var n = dots.length, last = 0;
    track.addEventListener("scroll", function () {
      var i = Math.min(n - 1, Math.round(Math.abs(track.scrollLeft) / track.clientWidth));
      if (i === last) return;
      last = i;
      dots.forEach(function (d, j) { d.classList.toggle("on", j === i); });
      count.textContent = (i + 1) + "/" + n;
    }, { passive: true });
  });

  // Active day in the nav
  var links = Array.prototype.slice.call(document.querySelectorAll(".day-link"));
  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) {
          var on = a.getAttribute("href") === "#" + e.target.id;
          a.classList.toggle("active", on);
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    document.querySelectorAll(".day, .section, .intro, .hero, .outro").forEach(function (s) { obs.observe(s); });
  }
})();
