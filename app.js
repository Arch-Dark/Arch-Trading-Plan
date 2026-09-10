// ===============================
// TRADING DASHBOARD
// ===============================

let trades = JSON.parse(localStorage.getItem("tradingTrades")) || [];

const form = document.getElementById("tradeForm");
const tradeList = document.getElementById("tradeList");
const emptyMessage = document.getElementById("emptyMessage");


// ===============================
// AFFICHER LES TRADES
// ===============================

function displayTrades() {

    tradeList.innerHTML = "";

    if (trades.length === 0) {
        emptyMessage.style.display = "block";
        updateStats();
        return;
    }

    emptyMessage.style.display = "none";

    trades.forEach((trade, index) => {

        const row = document.createElement("tr");

        let resultClass = "";

        if (trade.result === "TP") {
            resultClass = "profit";
        } else if (trade.result === "SL") {
            resultClass = "loss";
        } else {
            resultClass = "be";
        }

        let profitClass = "";

        if (Number(trade.profit) > 0) {
            profitClass = "profit";
        } else if (Number(trade.profit) < 0) {
            profitClass = "loss";
        } else {
            profitClass = "be";
        }

        row.innerHTML = `
            <td>${trade.date}</td>
            <td>${trade.asset}</td>
            <td>${trade.direction}</td>
            <td>${trade.entry}</td>
            <td>${trade.sl || "-"}</td>
            <td>${trade.tp || "-"}</td>
            <td>${trade.setup}</td>

            <td class="${resultClass}">
                ${trade.result}
            </td>

            <td class="${profitClass}">
                ${Number(trade.profit).toFixed(2)} $
            </td>

            <td>
                <button
                    class="delete-btn"
                    onclick="deleteTrade(${index})">
                    ✕
                </button>
            </td>
        `;

        tradeList.appendChild(row);
    });

    updateStats();
}


// ===============================
// AJOUTER UN TRADE
// ===============================

form.addEventListener("submit", function(event) {

    event.preventDefault();

    const trade = {

        asset: document.getElementById("asset").value,

        date: document.getElementById("date").value,

        direction: document.getElementById("direction").value,

        orderType: document.getElementById("orderType").value,

        entry: document.getElementById("entry").value,

        sl: document.getElementById("sl").value,

        tp: document.getElementById("tp").value,

        result: document.getElementById("result").value,

        setup: document.getElementById("setup").value,

        profit: document.getElementById("profit").value,

        comment: document.getElementById("comment").value

    };

    trades.unshift(trade);

    saveTrades();

    form.reset();

    setToday();

    alert("✅ Trade enregistré !");

});


// ===============================
// SUPPRIMER UN TRADE
// ===============================

function deleteTrade(index) {

    if (!confirm("Supprimer ce trade ?")) {
        return;
    }

    trades.splice(index, 1);

    saveTrades();
}


// ===============================
// SUPPRIMER TOUS LES TRADES
// ===============================

document.getElementById("clearBtn").addEventListener("click", function() {

    if (trades.length === 0) {
        return;
    }

    if (!confirm("⚠️ Supprimer TOUS les trades ?")) {
        return;
    }

    trades = [];

    saveTrades();

});


// ===============================
// SAUVEGARDER
// ===============================

function saveTrades() {

    localStorage.setItem(
        "tradingTrades",
        JSON.stringify(trades)
    );

    displayTrades();
}


// ===============================
// STATISTIQUES
// ===============================

function updateStats() {

    const totalTrades = trades.length;

    let totalProfit = 0;
    let wins = 0;
    let breakEven = 0;

    trades.forEach(trade => {

        totalProfit += Number(trade.profit) || 0;

        if (trade.result === "TP") {
            wins++;
        }

        if (trade.result === "BE") {
            breakEven++;
        }

    });

    let winrate = 0;

    if (totalTrades > 0) {
        winrate = (wins / totalTrades) * 100;
    }

    document.getElementById("totalProfit").textContent =
        `${totalProfit.toFixed(2)} $`;

    document.getElementById("totalTrades").textContent =
        totalTrades;

    document.getElementById("winrate").textContent =
        `${winrate.toFixed(1)}%`;

    document.getElementById("breakEven").textContent =
        breakEven;
}


// ===============================
// DATE DU JOUR
// ===============================

function setToday() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    document.getElementById("date").value =
        `${year}-${month}-${day}`;
}


// ===============================
// MODE SOMBRE / CLAIR
// ===============================

document.getElementById("themeBtn")
    .addEventListener("click", function() {

        document.body.classList.toggle("light");

        if (document.body.classList.contains("light")) {
            this.textContent = "☀️";
        } else {
            this.textContent = "🌙";
        }

    });


// ===============================
// INITIALISATION
// ===============================

setToday();

displayTrades();
