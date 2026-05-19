/* expenses.js — Despeses compartides amb Supabase */
(function () {
  "use strict";

  var SUPA_URL = "https://ofpqfuzapjniprpiwfkl.supabase.co";
  var SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcHFmdXphcGpuaXBycGl3ZmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzYwMzgsImV4cCI6MjA5NDc1MjAzOH0.JXwb5PLvykUBUXHs0oOPHZ57Q6BdfcVIydCKC3CDsBc";
  var HEADERS  = { "Content-Type": "application/json", "apikey": SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY };
  var PERSONS  = ["Annabel","Amanda","Montse","Pere"];

  var expenses = [];

  function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
  function now()   { return new Date().toLocaleString("ca-ES", {day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"}); }
  function fmt(n)  { return (Math.round(n * 100) / 100).toFixed(2) + "€"; }

  function apiFetch(path, opts) {
    return fetch(SUPA_URL + "/rest/v1/" + path, Object.assign({ headers: HEADERS }, opts || {}))
      .then(function(r) { return r.ok ? r.json().catch(function(){return[];}) : Promise.reject(r.status); });
  }

  function loadExpenses() {
    apiFetch("expenses?order=created_at.asc")
      .then(function(rows) {
        expenses = rows.map(function(r) {
          return {
            id: r.id, desc: r.description, amount: parseFloat(r.amount),
            payer: r.payer, cat: r.category,
            split: r.split_persons ? r.split_persons.split(",") : PERSONS.slice(),
            addedAt: r.added_at
          };
        });
        render();
      })
      .catch(function() {
        try { expenses = JSON.parse(localStorage.getItem("florida2026-expenses") || "[]"); } catch(e) { expenses = []; }
        render();
      });
  }

  function saveLocal() {
    try { localStorage.setItem("florida2026-expenses", JSON.stringify(expenses)); } catch(e) {}
  }

  /* ---- LIQUIDACIONS ---- */
  function calcSettlements() {
    var balance = {};
    PERSONS.forEach(function(p){ balance[p] = 0; });

    expenses.forEach(function(exp) {
      var split = exp.split || PERSONS;
      var share = exp.amount / split.length;
      balance[exp.payer] = (balance[exp.payer] || 0) + exp.amount;
      split.forEach(function(p){ balance[p] = (balance[p] || 0) - share; });
    });

    var creditors = [], debtors = [];
    Object.keys(balance).forEach(function(p) {
      var b = Math.round(balance[p] * 100) / 100;
      if (b > 0.01)  creditors.push({ name: p, amt: b });
      if (b < -0.01) debtors.push({ name: p, amt: -b });
    });
    creditors.sort(function(a,b){ return b.amt - a.amt; });
    debtors.sort(function(a,b){ return b.amt - a.amt; });

    var settlements = [];
    var ci = 0, di = 0;
    while (ci < creditors.length && di < debtors.length) {
      var c = creditors[ci], d = debtors[di];
      var transfer = Math.min(c.amt, d.amt);
      settlements.push({ from: d.name, to: c.name, amt: Math.round(transfer * 100) / 100 });
      c.amt -= transfer; d.amt -= transfer;
      if (c.amt < 0.01) ci++;
      if (d.amt < 0.01) di++;
    }
    return { balance: balance, settlements: settlements };
  }

  /* ---- CRUD ---- */
  function addExpense() {
    var descEl   = document.getElementById("exp-desc");
    var amtEl    = document.getElementById("exp-amount");
    var payerEl  = document.getElementById("exp-payer");
    var catEl    = document.getElementById("exp-cat");

    var desc   = descEl   ? descEl.value.trim()     : "";
    var amount = amtEl    ? parseFloat(amtEl.value) : 0;
    var payer  = payerEl  ? payerEl.value           : "";
    var cat    = catEl    ? catEl.value             : "🛍️ Altres";

    if (!desc || !amount || amount <= 0 || !payer) {
      [descEl, amtEl, payerEl].forEach(function(el) {
        if (el && !el.value.trim()) { el.style.borderColor = "#e63946"; setTimeout(function(){ el.style.borderColor = ""; }, 1800); }
      });
      return;
    }

    var chips = document.querySelectorAll("#exp-split-persons .schip.active");
    var split = Array.from(chips).map(function(c){ return c.dataset.person; });
    if (!split.length) split = PERSONS.slice();

    var exp = { id: genId(), desc: desc, amount: amount, payer: payer, cat: cat, split: split, addedAt: now() };
    expenses.push(exp);
    render();

    if (descEl)  { descEl.value = ""; descEl.focus(); }
    if (amtEl)   amtEl.value = "";
    if (payerEl) payerEl.value = "";
    document.querySelectorAll("#exp-split-persons .schip").forEach(function(c){ c.classList.add("active"); });

    apiFetch("expenses", {
      method: "POST",
      body: JSON.stringify({
        id: exp.id, description: exp.desc, amount: exp.amount,
        payer: exp.payer, category: exp.cat,
        split_persons: exp.split.join(","), added_at: exp.addedAt
      })
    }).catch(function() { saveLocal(); });
  }

  function removeExpense(id) {
    expenses = expenses.filter(function(e){ return e.id !== id; });
    render();
    apiFetch("expenses?id=eq." + id, { method: "DELETE" }).catch(function(){ saveLocal(); });
  }

  /* ---- RENDER ---- */
  function render() {
    var listEl    = document.getElementById("exp-list");
    var emptyEl   = document.getElementById("exp-empty");
    var summaryEl = document.getElementById("exp-summary");
    var totalsEl  = document.getElementById("exp-totals");
    var settleEl  = document.getElementById("exp-settlements");

    if (listEl) Array.from(listEl.querySelectorAll(".exp-item")).forEach(function(el){ el.remove(); });

    if (expenses.length === 0) {
      if (emptyEl)   emptyEl.style.display = "";
      if (summaryEl) summaryEl.style.display = "none";
      return;
    }
    if (emptyEl)   emptyEl.style.display = "none";
    if (summaryEl) summaryEl.style.display = "";

    var result = calcSettlements();

    /* totals */
    if (totalsEl) {
      totalsEl.innerHTML = "";
      PERSONS.forEach(function(p) {
        var paid = expenses.filter(function(e){ return e.payer === p; })
                           .reduce(function(s,e){ return s + e.amount; }, 0);
        var net  = Math.round((result.balance[p] || 0) * 100) / 100;
        if (paid === 0 && Math.abs(net) < 0.01) return;
        var card = document.createElement("div");
        card.className = "exp-total-card";
        card.innerHTML =
          '<div class="exp-total-name">' + p + '</div>' +
          '<div class="exp-total-paid">' + fmt(paid) + '</div>' +
          '<div class="exp-total-owes ' + (net > 0.01 ? "owes-pos" : net < -0.01 ? "owes-neg" : "owes-zero") + '">' +
            (net > 0.01 ? '▲ li deuen ' + fmt(net) : net < -0.01 ? '▼ deu ' + fmt(-net) : '✓ al dia') +
          '</div>';
        totalsEl.appendChild(card);
      });
    }

    /* liquidacions */
    if (settleEl) {
      settleEl.innerHTML = "";
      if (!result.settlements.length) {
        settleEl.innerHTML = '<div style="font-size:13px;color:var(--ink-mute);padding:8px 0">✅ Tothom al dia — no hi ha deutes pendents</div>';
      } else {
        result.settlements.forEach(function(s) {
          var row = document.createElement("div");
          row.className = "settlement-row";
          row.innerHTML =
            '<span class="settlement-from">' + s.from + '</span>' +
            '<span class="settlement-arrow">→ paga →</span>' +
            '<span class="settlement-to">' + s.to + '</span>' +
            '<span class="settlement-amt">' + fmt(s.amt) + '</span>';
          settleEl.appendChild(row);
        });
      }
    }

    /* llista despeses */
    var sorted = expenses.slice().reverse();
    sorted.forEach(function(exp) {
      var icon = (exp.cat || "").split(" ")[0] || "💸";
      var splitNames = exp.split || PERSONS;
      var perPerson  = exp.amount / splitNames.length;

      var row = document.createElement("div");
      row.className = "exp-item";

      var iconEl = document.createElement("div");
      iconEl.className = "exp-item-icon";
      iconEl.textContent = icon;

      var body = document.createElement("div");
      body.className = "exp-item-body";

      var desc2 = document.createElement("div");
      desc2.className = "exp-item-desc";
      desc2.textContent = exp.desc;

      var meta = document.createElement("div");
      meta.className = "exp-item-meta";

      var payerTag = document.createElement("span");
      payerTag.className = "exp-payer-tag";
      payerTag.textContent = "💳 " + exp.payer;

      var splitTag = document.createElement("span");
      splitTag.className = "exp-split-tag";
      splitTag.textContent = splitNames.length === PERSONS.length
        ? "÷ " + PERSONS.length + " persones · " + fmt(perPerson) + "/persona"
        : "÷ " + splitNames.join(", ");

      var dateTag = document.createElement("span");
      dateTag.className = "exp-date-tag";
      dateTag.textContent = exp.addedAt;

      meta.appendChild(payerTag);
      meta.appendChild(splitTag);
      meta.appendChild(dateTag);
      body.appendChild(desc2);
      body.appendChild(meta);

      var amtEl2 = document.createElement("div");
      amtEl2.className = "exp-amount";
      amtEl2.textContent = fmt(exp.amount);

      var del = document.createElement("button");
      del.className = "item-del-btn";
      del.innerHTML = "×";
      del.addEventListener("click", function() { removeExpense(exp.id); });

      row.appendChild(iconEl);
      row.appendChild(body);
      row.appendChild(amtEl2);
      row.appendChild(del);
      listEl.appendChild(row);
    });
  }

  /* ---- POLL cada 15s ---- */
  function startPolling() {
    setInterval(function() {
      apiFetch("expenses?order=created_at.asc")
        .then(function(rows) {
          expenses = rows.map(function(r) {
            return {
              id: r.id, desc: r.description, amount: parseFloat(r.amount),
              payer: r.payer, cat: r.category,
              split: r.split_persons ? r.split_persons.split(",") : PERSONS.slice(),
              addedAt: r.added_at
            };
          });
          render();
        }).catch(function(){});
    }, 15000);
  }

  /* ---- INIT ---- */
  function init() {
    loadExpenses();
    startPolling();

    var addBtn = document.getElementById("exp-add-btn");
    if (addBtn) addBtn.addEventListener("click", addExpense);

    var descInput = document.getElementById("exp-desc");
    if (descInput) descInput.addEventListener("keydown", function(e){ if (e.key === "Enter") addExpense(); });

    document.querySelectorAll("#exp-split-persons .schip").forEach(function(chip) {
      chip.addEventListener("click", function(){ chip.classList.toggle("active"); });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
