/* shopping.js — Llista de la compra amb Supabase */
(function () {
  "use strict";

  var SUPA_URL = "https://ofpqfuzapjniprpiwfkl.supabase.co";
  var SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcHFmdXphcGpuaXBycGl3ZmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzYwMzgsImV4cCI6MjA5NDc1MjAzOH0.JXwb5PLvykUBUXHs0oOPHZ57Q6BdfcVIydCKC3CDsBc";
  var HEADERS  = { "Content-Type": "application/json", "apikey": SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY };

  var items = [];
  var activeFilter = "all";

  function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
  function now() { return new Date().toLocaleString("ca-ES", {day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"}); }

  /* ---- API ---- */
  function apiFetch(path, opts) {
    return fetch(SUPA_URL + "/rest/v1/" + path, Object.assign({ headers: HEADERS }, opts || {}))
      .then(function(r) { return r.ok ? r.json().catch(function(){return[];}) : Promise.reject(r.status); });
  }

  function loadItems() {
    setLoading(true);
    apiFetch("shopping?order=created_at.desc")
      .then(function(rows) {
        items = rows.map(function(r) {
          return { id: r.id, name: r.name, qty: r.qty, done: r.done, addedAt: r.added_at };
        });
        render();
      })
      .catch(function() {
        try { items = JSON.parse(localStorage.getItem("florida2026-shopping") || "[]"); } catch(e) { items = []; }
        render();
      })
      .then(function() { setLoading(false); });
  }

  function saveLocal() {
    try { localStorage.setItem("florida2026-shopping", JSON.stringify(items)); } catch(e) {}
  }

  /* ---- CRUD ---- */
  function addItem() {
    var nameEl = document.getElementById("shop-name");
    var qtyEl  = document.getElementById("shop-qty");
    var name   = nameEl ? nameEl.value.trim() : "";
    if (!name) return;

    var item = { id: genId(), name: name, qty: qtyEl ? (qtyEl.value.trim() || "1") : "1", done: false, addedAt: now() };
    items.unshift(item);
    render();
    if (nameEl) { nameEl.value = ""; nameEl.focus(); }
    if (qtyEl)  qtyEl.value = "";

    apiFetch("shopping", {
      method: "POST",
      body: JSON.stringify({ id: item.id, name: item.name, qty: item.qty, done: false, added_at: item.addedAt })
    }).catch(function() { saveLocal(); });
  }

  function toggleItem(id) {
    var item = items.find(function(i) { return i.id === id; });
    if (!item) return;
    item.done = !item.done;
    render();
    apiFetch("shopping?id=eq." + id, {
      method: "PATCH",
      headers: Object.assign({ "Prefer": "return=minimal" }, HEADERS),
      body: JSON.stringify({ done: item.done })
    }).catch(function() { saveLocal(); });
  }

  function removeItem(id) {
    items = items.filter(function(i) { return i.id !== id; });
    render();
    apiFetch("shopping?id=eq." + id, { method: "DELETE" }).catch(function() { saveLocal(); });
  }

  function clearDone() {
    var doneIds = items.filter(function(i) { return i.done; }).map(function(i) { return i.id; });
    items = items.filter(function(i) { return !i.done; });
    render();
    doneIds.forEach(function(id) {
      apiFetch("shopping?id=eq." + id, { method: "DELETE" }).catch(function(){});
    });
  }

  /* ---- RENDER ---- */
  function setLoading(val) {
    var listEl = document.getElementById("shop-list");
    if (!listEl) return;
    var existing = listEl.querySelector(".shop-loading");
    if (val && !existing) {
      var d = document.createElement("div");
      d.className = "shop-loading list-empty";
      d.innerHTML = '<div class="le-icon">⏳</div><div class="le-title">Carregant...</div>';
      listEl.prepend(d);
    } else if (!val && existing) {
      existing.remove();
    }
  }

  function render() {
    var listEl   = document.getElementById("shop-list");
    var emptyEl  = document.getElementById("shop-empty");
    var statPend = document.getElementById("shop-stat-pending");
    var statDone = document.getElementById("shop-stat-done");
    var bar      = document.getElementById("shop-progress");
    var clearBtn = document.getElementById("shop-clear-done");

    var pending = items.filter(function(i) { return !i.done; }).length;
    var done    = items.filter(function(i) { return  i.done; }).length;

    if (statPend) statPend.textContent = pending + " pendents";
    if (statDone) statDone.textContent = done    + " comprats";
    if (bar) bar.style.width = items.length ? (done / items.length * 100) + "%" : "0%";
    if (clearBtn) clearBtn.style.display = done > 0 ? "" : "none";

    var visible = items.filter(function(i) {
      if (activeFilter === "pending") return !i.done;
      if (activeFilter === "done")    return  i.done;
      return true;
    });

    if (listEl) Array.from(listEl.querySelectorAll(".shop-item")).forEach(function(el){ el.remove(); });

    if (visible.length === 0) {
      if (emptyEl) emptyEl.style.display = "";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";

    visible.forEach(function(item) {
      var row = document.createElement("div");
      row.className = "shop-item" + (item.done ? " is-done" : "");

      var cb = document.createElement("button");
      cb.className = "shop-checkbox" + (item.done ? " checked" : "");
      cb.innerHTML = item.done ? "✓" : "";
      cb.addEventListener("click", function() { toggleItem(item.id); });

      var body = document.createElement("div");
      body.className = "shop-item-body";

      var nameEl2 = document.createElement("div");
      nameEl2.className = "shop-item-name";
      nameEl2.textContent = item.name + (item.qty && item.qty !== "1" ? "  ×" + item.qty : "");

      var meta = document.createElement("div");
      meta.className = "shop-item-meta";
      var t = document.createElement("span");
      t.className = "shop-item-time";
      t.textContent = item.addedAt;
      meta.appendChild(t);

      body.appendChild(nameEl2);
      body.appendChild(meta);

      var del = document.createElement("button");
      del.className = "item-del-btn";
      del.innerHTML = "×";
      del.addEventListener("click", function() { removeItem(item.id); });

      row.appendChild(cb);
      row.appendChild(body);
      row.appendChild(del);
      listEl.appendChild(row);
    });
  }

  /* ---- POLL cada 15s ---- */
  function startPolling() {
    setInterval(function() {
      apiFetch("shopping?order=created_at.desc")
        .then(function(rows) {
          items = rows.map(function(r) {
            return { id: r.id, name: r.name, qty: r.qty, done: r.done, addedAt: r.added_at };
          });
          render();
        }).catch(function(){});
    }, 15000);
  }

  /* ---- INIT ---- */
  function init() {
    loadItems();
    startPolling();

    var addBtn = document.getElementById("shop-add-btn");
    if (addBtn) addBtn.addEventListener("click", addItem);

    var nameInput = document.getElementById("shop-name");
    if (nameInput) nameInput.addEventListener("keydown", function(e){ if (e.key === "Enter") addItem(); });

    var clearBtn = document.getElementById("shop-clear-done");
    if (clearBtn) clearBtn.addEventListener("click", clearDone);

    document.querySelectorAll("#shop-filters .tf").forEach(function(btn) {
      if (!btn.dataset.filter) return;
      btn.addEventListener("click", function() {
        activeFilter = btn.dataset.filter;
        document.querySelectorAll("#shop-filters .tf").forEach(function(b){ b.classList.remove("active"); });
        btn.classList.add("active");
        render();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* ====== NOTES COMPARTIDES ====== */
(function() {
  var SUPA_URL = "https://ofpqfuzapjniprpiwfkl.supabase.co";
  var SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcHFmdXphcGpuaXBycGl3ZmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzYwMzgsImV4cCI6MjA5NDc1MjAzOH0.JXwb5PLvykUBUXHs0oOPHZ57Q6BdfcVIydCKC3CDsBc";
  var HEADERS = { "Content-Type": "application/json", "apikey": SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY };
  var NOTE_ID = "shopping-group-note";

  function apiFetch(path, opts) {
    return fetch(SUPA_URL + "/rest/v1/" + path, Object.assign({ headers: HEADERS }, opts || {}))
      .then(function(r) { return r.ok ? r.json().catch(function(){ return []; }) : Promise.reject(r.status); });
  }

  function loadNote() {
    apiFetch("notes?id=eq." + NOTE_ID)
      .then(function(rows) {
        var ta = document.getElementById("shop-notes");
        if (ta && rows.length > 0) ta.value = rows[0].content || "";
      }).catch(function(){});
  }

  function saveNote() {
    var ta  = document.getElementById("shop-notes");
    var btn = document.getElementById("shop-notes-save");
    var st  = document.getElementById("shop-notes-status");
    if (!ta) return;
    var content = ta.value;
    if (btn) btn.disabled = true;
    if (st)  st.textContent = "Guardant…";

    apiFetch("notes?id=eq." + NOTE_ID, {
      method: "DELETE", headers: Object.assign({ "Prefer": "return=minimal" }, HEADERS)
    }).then(function() {
      return apiFetch("notes", {
        method: "POST",
        body: JSON.stringify({ id: NOTE_ID, content: content })
      });
    }).then(function() {
      if (st)  st.textContent = "✓ Guardat!";
      if (btn) btn.disabled = false;
      setTimeout(function(){ if (st) st.textContent = ""; }, 3000);
    }).catch(function() {
      if (st)  st.textContent = "Error al guardar";
      if (btn) btn.disabled = false;
    });
  }

  function initNotes() {
    loadNote();
    setInterval(loadNote, 30000);
    var btn = document.getElementById("shop-notes-save");
    if (btn) btn.addEventListener("click", saveNote);
    var ta = document.getElementById("shop-notes");
    if (ta) ta.addEventListener("keydown", function(e){
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveNote();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNotes);
  } else {
    initNotes();
  }
})();
