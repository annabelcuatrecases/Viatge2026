/* restaurants.js — Restaurants recomanats amb Supabase */
(function () {
  "use strict";

  var SUPA_URL = "https://ofpqfuzapjniprpiwfkl.supabase.co";
  var SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcHFmdXphcGpuaXBycGl3ZmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzYwMzgsImV4cCI6MjA5NDc1MjAzOH0.JXwb5PLvykUBUXHs0oOPHZ57Q6BdfcVIydCKC3CDsBc";
  var HEADERS  = { "Content-Type": "application/json", "apikey": SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY };

  var items = [];

  function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
  function now()   { return new Date().toLocaleString("ca-ES", {day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"}); }

  function apiFetch(path, opts) {
    return fetch(SUPA_URL + "/rest/v1/" + path, Object.assign({ headers: HEADERS }, opts || {}))
      .then(function(r) { return r.ok ? r.json().catch(function(){ return []; }) : Promise.reject(r.status); });
  }

  function load() {
    apiFetch("restaurants?order=created_at.asc")
      .then(function(rows) {
        items = rows.map(function(r) {
          return { id: r.id, name: r.name, city: r.city || "", note: r.note || "", addedAt: r.added_at };
        });
        render();
      })
      .catch(function() {
        try { items = JSON.parse(localStorage.getItem("florida2026-restaurants") || "[]"); } catch(e) { items = []; }
        render();
      });
  }

  function addItem() {
    var nameEl = document.getElementById("rest-name");
    var cityEl = document.getElementById("rest-city");
    var noteEl = document.getElementById("rest-note");

    var name = nameEl ? nameEl.value.trim() : "";
    if (!name) { if (nameEl) { nameEl.style.borderColor = "#e63946"; setTimeout(function(){ nameEl.style.borderColor = ""; }, 1800); } return; }

    var item = {
      id: genId(), name: name,
      city: cityEl ? cityEl.value.trim() : "",
      note: noteEl ? noteEl.value.trim() : "",
      addedAt: now()
    };
    items.push(item);
    render();
    if (nameEl) { nameEl.value = ""; nameEl.focus(); }
    if (cityEl)  cityEl.value = "";
    if (noteEl)  noteEl.value = "";

    apiFetch("restaurants", {
      method: "POST",
      body: JSON.stringify({ id: item.id, name: item.name, city: item.city, note: item.note, added_at: item.addedAt })
    }).catch(function() {
      try { localStorage.setItem("florida2026-restaurants", JSON.stringify(items)); } catch(e) {}
    });
  }

  function removeItem(id) {
    items = items.filter(function(i) { return i.id !== id; });
    render();
    apiFetch("restaurants?id=eq." + id, { method: "DELETE" }).catch(function(){});
  }

  function render() {
    var listEl  = document.getElementById("rest-list");
    var emptyEl = document.getElementById("rest-empty");
    if (!listEl) return;

    Array.from(listEl.querySelectorAll(".rest-item")).forEach(function(el){ el.remove(); });

    if (items.length === 0) {
      if (emptyEl) emptyEl.style.display = "";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";

    items.forEach(function(item) {
      var row = document.createElement("div");
      row.className = "rest-item";

      var left = document.createElement("div");
      left.className = "rest-item-left";

      var nameEl2 = document.createElement("div");
      nameEl2.className = "rest-item-name";
      nameEl2.textContent = "🍽️ " + item.name;

      var meta = document.createElement("div");
      meta.className = "rest-item-meta";

      if (item.city) {
        var city = document.createElement("span");
        city.className = "rest-item-city";
        city.textContent = "📍 " + item.city;
        meta.appendChild(city);
      }
      if (item.note) {
        var note = document.createElement("span");
        note.className = "rest-item-note";
        note.textContent = "💬 " + item.note;
        meta.appendChild(note);
      }

      var time = document.createElement("span");
      time.className = "shop-item-time";
      time.textContent = item.addedAt;
      meta.appendChild(time);

      left.appendChild(nameEl2);
      left.appendChild(meta);

      var del = document.createElement("button");
      del.className = "item-del-btn";
      del.innerHTML = "×";
      del.addEventListener("click", function() { removeItem(item.id); });

      row.appendChild(left);
      row.appendChild(del);
      listEl.appendChild(row);
    });
  }

  /* poll cada 20s */
  function startPolling() {
    setInterval(function() {
      apiFetch("restaurants?order=created_at.asc")
        .then(function(rows) {
          items = rows.map(function(r) {
            return { id: r.id, name: r.name, city: r.city || "", note: r.note || "", addedAt: r.added_at };
          });
          render();
        }).catch(function(){});
    }, 20000);
  }

  function init() {
    load();
    startPolling();

    var addBtn = document.getElementById("rest-add-btn");
    if (addBtn) addBtn.addEventListener("click", addItem);

    var nameInput = document.getElementById("rest-name");
    if (nameInput) nameInput.addEventListener("keydown", function(e){ if (e.key === "Enter") addItem(); });

    var noteInput = document.getElementById("rest-note");
    if (noteInput) noteInput.addEventListener("keydown", function(e){ if (e.key === "Enter") addItem(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
