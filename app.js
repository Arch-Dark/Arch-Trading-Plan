// ==========================================
// TRADING DASHBOARD V2
// ==========================================

let trades = JSON.parse(localStorage.getItem("tradingTrades")) || [];

let currentPeriod = "today";

const form = document.getElementById("tradeForm");
const tradeList = document.getElementById("tradeList");
const setupList = document.getElementById("setupList");
const emptyMessage = document.getElementById("emptyMessage");


// ==========================================
// SAUVEGARDE
// ==========================================

function saveTrades() {

    localStorage.setItem(
        "tradingTrades",
        JSON.stringify(trades)
    );

    refreshDashboard();
}


// ==========================================
// CALCUL DU RR
// ==========================================

function calculateRR() {

    const entry = Number(document.getElementById("entry").value);
    const sl = Number(document.getElementById("sl").value);
    const tp = Number(document.getElementById("tp").value);

    const rrField = document.getElementById("calculatedRR");

    if (!entry || !sl || !tp) {

        rrField.value = "0.00";

        return;
    }

    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);

    if (risk === 0) {

        rrField.value = "0.00";

        return;
    }

    const rr = reward / risk;

    rrField.value = `1:${rr.toFixed(2)}`;
}


// Écoute des changements Entry / SL / TP

document.getElementById("entry")
    .addEventListener("input", calculateRR);

document.getElementById("sl")
    .addEventListener("input", calculateRR);

document.getElementById("tp")
    .addEventListener("input", calculateRR);


// ==========================================
// AJOUT D'UN TRADE
// ==========================================

form.addEventListener("submit", function(event) {

    event.preventDefault();

    const entry = Number(
        document.getElementById("entry").value
    );

    const sl = Number(
        document.getElementById("sl").value
    );

    const tp = Number(
        document.getElementById("tp").value
    );

    let rr = 0;

    if (entry && sl && tp) {

        const risk = Math.abs(entry - sl);
        const reward = Math.abs(tp - entry);

        if (risk > 0) {
            rr = reward / risk;
        }
    }


    const trade = {

        asset: document.getElementById("asset").value.trim(),

        date: document.getElementById("date").value,

        direction: document.getElementById("direction").value,

        orderType: document.getElementById("orderType").value,

        entry: entry,

        sl: sl,

        tp: tp,

        rr: rr,

        result: document.getElementById("result").value,

        setup: document.getElementById("setup").value,

        profit: Number(
            document.getElementById("profit").value
        ) || 0,

        comment: document.getElementById("comment").value.trim()

    };


    trades.unshift(trade);

    saveTrades();

    form.reset();

    setToday();

    calculateRR();

    alert("✅ Trade enregistré !");

});


// ==========================================
// FILTRAGE DES DATES
// ==========================================

function getFilteredTrades() {

    if (currentPeriod === "all") {
        return [...trades];
    }

    const now = new Date();

    return trades.filter(trade => {

        if (!trade.date) {
            return false;
        }

        const date = new Date(
            trade.date + "T00:00:00"
        );

        // Aujourd'hui

        if (currentPeriod === "today") {

            return (
                date.getFullYear() === now.getFullYear() &&
                date.getMonth() === now.getMonth() &&
                date.getDate() === now.getDate()
            );
        }


        // Cette semaine

        if (currentPeriod === "week") {

            const startOfWeek = new Date(now);

            const day = startOfWeek.getDay();

            const difference =
                day === 0 ? 6 : day - 1;

            startOfWeek.setDate(
                startOfWeek.getDate() - difference
            );

            startOfWeek.setHours(0, 0, 0, 0);

            return date >= startOfWeek;
        }


        // Ce mois

        if (currentPeriod === "month") {

            return (
                date.getFullYear() === now.getFullYear() &&
                date.getMonth() === now.getMonth()
            );
        }


        // Cette année

        if (currentPeriod === "year") {

            return (
                date.getFullYear() === now.getFullYear()
            );
        }

        return false;
    });
}


// ==========================================
// DASHBOARD
// ==========================================

function updateDashboard() {

    const filteredTrades = getFilteredTrades();

    let totalProfit = 0;

    let wins = 0;

    let rrTotal = 0;

    let rrCount = 0;


    filteredTrades.forEach(trade => {

        totalProfit += Number(trade.profit) || 0;


        if (trade.result === "TP") {
            wins++;
        }


        if (Number(trade.rr) > 0) {

            rrTotal += Number(trade.rr);

            rrCount++;
        }

    });


    const totalTrades =
        filteredTrades.length;


    const winrate =
        totalTrades > 0
            ? (wins / totalTrades) * 100
            : 0;


    const averageRR =
        rrCount > 0
            ? rrTotal / rrCount
            : 0;


    // ======================================
    // CAPITAL
    // ======================================

    /*
       Le capital initial sera défini plus tard
       dans les paramètres.
       
       Pour l'instant :
       capital = profit de la période.
    */

    const balance = totalProfit;


    document.getElementById("balance").textContent =
        `${balance.toFixed(2)} $`;


    document.getElementById("totalProfit").textContent =
        `${totalProfit.toFixed(2)} $`;


    document.getElementById("totalTrades").textContent =
        totalTrades;


    document.getElementById("winrate").textContent =
        `${winrate.toFixed(1)}%`;


    document.getElementById("averageRR").textContent =
        `1:${averageRR.toFixed(2)}`;


    updateBestSetup(filteredTrades);

    updateSetupTable(filteredTrades);

    displayTrades(filteredTrades);
}


// ==========================================
// MEILLEUR SETUP
// ==========================================

function updateBestSetup(filteredTrades) {

    const setupStats = {};


    filteredTrades.forEach(trade => {

        const setup = trade.setup || "Autre";


        if (!setupStats[setup]) {

            setupStats[setup] = {

                trades: 0,

                wins: 0,

                profit: 0
            };
        }


        setupStats[setup].trades++;

        setupStats[setup].profit +=
            Number(trade.profit) || 0;


        if (trade.result === "TP") {
            setupStats[setup].wins++;
        }

    });


    const setups = Object.entries(setupStats);


    if (setups.length === 0) {

        document.getElementById("bestSetup").textContent =
            "-";

        document.getElementById("bestSetupDetails").textContent =
            "Aucun trade";

        return;
    }


    /*
       Le meilleur setup est déterminé
       principalement par le winrate.

       En cas d'égalité :
       le setup avec le plus de trades gagne.
    */

    setups.sort((a, b) => {

        const statsA = a[1];

        const statsB = b[1];


        const winrateA =
            statsA.wins / statsA.trades;


        const winrateB =
            statsB.wins / statsB.trades;


        if (winrateB !== winrateA) {

            return winrateB - winrateA;
        }


        return statsB.trades - statsA.trades;
    });


    const bestName = setups[0][0];

    const best = setups[0][1];


    const bestWinrate =
        (best.wins / best.trades) * 100;


    document.getElementById("bestSetup").textContent =
        bestName;


    document.getElementById("bestSetupDetails").textContent =
        `${best.trades} trade(s) • ${bestWinrate.toFixed(1)}% winrate`;

}


// ==========================================
// TABLEAU DES SETUPS
// ==========================================

function updateSetupTable(filteredTrades) {

    setupList.innerHTML = "";


    const stats = {};


    filteredTrades.forEach(trade => {

        const setup = trade.setup || "Autre";


        if (!stats[setup]) {

            stats[setup] = {

                trades: 0,

                wins: 0,

                profit: 0
            };
        }


        stats[setup].trades++;

        stats[setup].profit +=
            Number(trade.profit) || 0;


        if (trade.result === "TP") {
            stats[setup].wins++;
        }

    });


    const sorted = Object.entries(stats)
        .sort((a, b) =>
            b[1].trades - a[1].trades
        );


    sorted.forEach(([setup, data]) => {

        const winrate =
            (data.wins / data.trades) * 100;


        const row =
            document.createElement("tr");


        const profitClass =
            data.profit > 0
                ? "profit"
                : data.profit < 0
                    ? "loss"
                    : "be";


        row.innerHTML = `

            <td>${setup}</td>

            <td>${data.trades}</td>

            <td>${data.wins}</td>

            <td>${winrate.toFixed(1)}%</td>

            <td class="${profitClass}">
                ${data.profit.toFixed(2)} $
            </td>

        `;


        setupList.appendChild(row);
    });

}


// ==========================================
// HISTORIQUE
// ==========================================

function displayTrades(filteredTrades) {

    tradeList.innerHTML = "";


    if (filteredTrades.length === 0) {

        emptyMessage.style.display = "block";

        return;
    }


    emptyMessage.style.display = "none";


    filteredTrades.forEach(trade => {

        const originalIndex =
            trades.indexOf(trade);


        const row =
            document.createElement("tr");


        let resultClass = "be";


        if (trade.result === "TP") {
            resultClass = "profit";
        }

        if (trade.result === "SL") {
            resultClass = "loss";
        }


        const profit =
            Number(trade.profit) || 0;


        const profitClass =
            profit > 0
                ? "profit"
                : profit < 0
                    ? "loss"
                    : "be";


        const rr =
            Number(trade.rr) || 0;


        row.innerHTML = `

            <td>${trade.date}</td>

            <td>${trade.asset}</td>

            <td>${trade.direction}</td>

            <td>${trade.entry}</td>

            <td>${trade.sl || "-"}</td>

            <td>${trade.tp || "-"}</td>

            <td>
                ${rr > 0 ? `1:${rr.toFixed(2)}` : "-"}
            </td>

            <td>${trade.setup}</td>

            <td class="${resultClass}">
                ${trade.result}
            </td>

            <td class="${profitClass}">
                ${profit.toFixed(2)} $
            </td>

            <td>

                <button
                    class="delete-btn"
                    onclick="deleteTrade(${originalIndex})">

                    ✕

                </button>

            </td>
        `;


        tradeList.appendChild(row);

    });

}


// ==========================================
// SUPPRIMER UN TRADE
// ==========================================

function deleteTrade(index) {

    if (!confirm("Supprimer ce trade ?")) {
        return;
    }


    trades.splice(index, 1);

    saveTrades();
}


// ==========================================
// SUPPRIMER TOUS LES TRADES
// ==========================================

document.getElementById("clearBtn")
    .addEventListener("click", function() {

        if (trades.length === 0) {
            return;
        }


        if (!confirm(
            "⚠️ Supprimer TOUS les trades ?"
        )) {
            return;
        }


        trades = [];

        saveTrades();

    });


// ==========================================
// CHANGEMENT DE PÉRIODE
// ==========================================

document.querySelectorAll(".period-btn")
    .forEach(button => {

        button.addEventListener("click", function() {

            document
                .querySelectorAll(".period-btn")
                .forEach(btn =>
                    btn.classList.remove("active")
                );


            this.classList.add("active");


            currentPeriod =
                this.dataset.period;


            refreshDashboard();

        });

    });


// ==========================================
// DATE DU JOUR
// ==========================================

function setToday() {

    const today = new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    document.getElementById("date").value =
        `${year}-${month}-${day}`;
}


// ==========================================
// MODE CLAIR / SOMBRE
// ==========================================

document.getElementById("themeBtn")
    .addEventListener("click", function() {

        document.body.classList.toggle("light");


        if (
            document.body.classList.contains("light")
        ) {

            this.textContent = "☀️";

        } else {

            this.textContent = "🌙";

        }

    });


// ==========================================
// REFRESH GLOBAL
// ==========================================

function refreshDashboard() {

    updateDashboard();

}


// ==========================================
// INITIALISATION
// ==========================================

setToday();

calculateRR();

refreshDashboard();
