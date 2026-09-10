// ==========================================
// TRADING DASHBOARD - APP.JS V2.1
// ==========================================

let trades = JSON.parse(localStorage.getItem("tradingTrades")) || [];
let currentPeriod = "today";

// ==========================================
// ELEMENTS HTML
// ==========================================

const form = document.getElementById("tradeForm");
const assetInput = document.getElementById("asset");
const dateInput = document.getElementById("date");
const directionInput = document.getElementById("direction");
const orderTypeInput = document.getElementById("orderType");
const entryInput = document.getElementById("entry");
const slInput = document.getElementById("sl");
const tpInput = document.getElementById("tp");
const rrInput = document.getElementById("calculatedRR");
const resultInput = document.getElementById("result");
const setupInput = document.getElementById("setup");
const profitInput = document.getElementById("profit");
const commentInput = document.getElementById("comment");

const balanceElement = document.getElementById("balance");
const totalProfitElement = document.getElementById("totalProfit");
const winrateElement = document.getElementById("winrate");
const averageRRElement = document.getElementById("averageRR");
const totalTradesElement = document.getElementById("totalTrades");
const bestSetupElement = document.getElementById("bestSetup");
const bestSetupDetailsElement = document.getElementById("bestSetupDetails");

const tradeList = document.getElementById("tradeList");
const emptyMessage = document.getElementById("emptyMessage");
const clearBtn = document.getElementById("clearBtn");
const setupList = document.getElementById("setupList");

// ==========================================
// DATE PAR DEFAUT
// ==========================================

if (dateInput) {
    dateInput.value = new Date().toISOString().split("T")[0];
}

// ==========================================
// CALCUL DU RR
// ==========================================

function calculateRR() {
    const entry = parseFloat(entryInput.value);
    const sl = parseFloat(slInput.value);
    const tp = parseFloat(tpInput.value);

    if (
        Number.isNaN(entry) ||
        Number.isNaN(sl) ||
        Number.isNaN(tp)
    ) {
        rrInput.value = "";
        return;
    }

    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);

    if (risk <= 0) {
        rrInput.value = "";
        return;
    }

    const rr = reward / risk;

    rrInput.value = `1:${rr.toFixed(2)}`;
}

entryInput?.addEventListener("input", calculateRR);
slInput?.addEventListener("input", calculateRR);
tpInput?.addEventListener("input", calculateRR);

// ==========================================
// SAUVEGARDE
// ==========================================

function saveTrades() {
    localStorage.setItem("tradingTrades", JSON.stringify(trades));
}

// ==========================================
// FORMATAGE
// ==========================================

function formatMoney(value) {
    const number = Number(value) || 0;

    if (number > 0) {
        return `+${number.toFixed(2)} $`;
    }

    if (number < 0) {
        return `${number.toFixed(2)} $`;
    }

    return `0.00 $`;
}

function formatRR(value) {
    const rr = Number(value) || 0;

    if (rr <= 0) {
        return "-";
    }

    return `1:${rr.toFixed(2)}`;
}

// ==========================================
// FILTRE DES PERIODES
// ==========================================

function getFilteredTrades() {
    const now = new Date();

    return trades.filter(trade => {
        if (!trade.date) return false;

        const tradeDate = new Date(`${trade.date}T00:00:00`);

        if (currentPeriod === "all") {
            return true;
        }

        if (currentPeriod === "today") {
            return (
                tradeDate.getFullYear() === now.getFullYear() &&
                tradeDate.getMonth() === now.getMonth() &&
                tradeDate.getDate() === now.getDate()
            );
        }

        if (currentPeriod === "week") {
            const currentDay = now.getDay();
            const mondayOffset = currentDay === 0 ? 6 : currentDay - 1;

            const monday = new Date(now);
            monday.setHours(0, 0, 0, 0);
            monday.setDate(now.getDate() - mondayOffset);

            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            sunday.setHours(23, 59, 59, 999);

            return tradeDate >= monday && tradeDate <= sunday;
        }

        if (currentPeriod === "month") {
            return (
                tradeDate.getFullYear() === now.getFullYear() &&
                tradeDate.getMonth() === now.getMonth()
            );
        }

        if (currentPeriod === "year") {
            return tradeDate.getFullYear() === now.getFullYear();
        }

        return true;
    });
}

// ==========================================
// CALCUL DES STATISTIQUES
// ==========================================

function updateDashboard() {
    const filteredTrades = getFilteredTrades();

    const totalTrades = filteredTrades.length;

    const totalProfit = filteredTrades.reduce(
        (sum, trade) => sum + (Number(trade.profit) || 0),
        0
    );

    const winningTrades = filteredTrades.filter(
        trade => trade.result === "TP"
    ).length;

    const breakEvenTrades = filteredTrades.filter(
        trade => trade.result === "BE"
    ).length;

    const winrate =
        totalTrades > 0
            ? (winningTrades / totalTrades) * 100
            : 0;

    const validRR = filteredTrades
        .map(trade => Number(trade.rr))
        .filter(rr => rr > 0);

    const averageRR =
        validRR.length > 0
            ? validRR.reduce((sum, rr) => sum + rr, 0) / validRR.length
            : 0;

    balanceElement.textContent = formatMoney(totalProfit);
    totalProfitElement.textContent = formatMoney(totalProfit);
    winrateElement.textContent = `${winrate.toFixed(1)}%`;
    averageRRElement.textContent = formatRR(averageRR);
    totalTradesElement.textContent = totalTrades;

    updateBestSetup(filteredTrades);
    updateSetupTable(filteredTrades);
}

// ==========================================
// MEILLEUR SETUP
// ==========================================

function updateBestSetup(filteredTrades) {
    if (filteredTrades.length === 0) {
        bestSetupElement.textContent = "-";
        bestSetupDetailsElement.textContent = "Aucun trade";
        return;
    }

    const setups = {};

    filteredTrades.forEach(trade => {
        const setup = trade.setup || "Non défini";

        if (!setups[setup]) {
            setups[setup] = {
                total: 0,
                wins: 0
            };
        }

        setups[setup].total++;

        if (trade.result === "TP") {
            setups[setup].wins++;
        }
    });

    const ranking = Object.entries(setups)
        .map(([name, data]) => ({
            name,
            total: data.total,
            wins: data.wins,
            winrate:
                data.total > 0
                    ? (data.wins / data.total) * 100
                    : 0
        }))
        .sort((a, b) => {
            if (b.winrate !== a.winrate) {
                return b.winrate - a.winrate;
            }

            return b.total - a.total;
        });

    const best = ranking[0];

    if (!best) {
        bestSetupElement.textContent = "-";
        bestSetupDetailsElement.textContent = "Aucun setup";
        return;
    }

    bestSetupElement.textContent = best.name;
    bestSetupDetailsElement.textContent =
        `${best.winrate.toFixed(1)}% de winrate • ${best.total} trade(s)`;
}

// ==========================================
// TABLEAU DES SETUPS
// ==========================================

function updateSetupTable(filteredTrades) {
    if (!setupList) return;

    setupList.innerHTML = "";

    const setups = {};

    filteredTrades.forEach(trade => {
        const setup = trade.setup || "Non défini";

        if (!setups[setup]) {
            setups[setup] = {
                total: 0,
                wins: 0,
                profit: 0
            };
        }

        setups[setup].total++;

        if (trade.result === "TP") {
            setups[setup].wins++;
        }

        setups[setup].profit += Number(trade.profit) || 0;
    });

    const sortedSetups = Object.entries(setups)
        .map(([name, data]) => ({
            name,
            total: data.total,
            wins: data.wins,
            profit: data.profit,
            winrate:
                data.total > 0
                    ? (data.wins / data.total) * 100
                    : 0
        }))
        .sort((a, b) => b.winrate - a.winrate);

    if (sortedSetups.length === 0) {
        setupList.innerHTML = `
            <tr>
                <td colspan="4">Aucun setup utilisé</td>
            </tr>
        `;
        return;
    }

    sortedSetups.forEach(setup => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${setup.name}</td>
            <td>${setup.total}</td>
            <td>${setup.winrate.toFixed(1)}%</td>
            <td>${formatMoney(setup.profit)}</td>
        `;

        setupList.appendChild(row);
    });
}

// ==========================================
// AFFICHAGE DE L'HISTORIQUE
// ==========================================

function renderTrades() {
    const filteredTrades = getFilteredTrades();

    tradeList.innerHTML = "";

    if (filteredTrades.length === 0) {
        emptyMessage.style.display = "block";
        return;
    }

    emptyMessage.style.display = "none";

    filteredTrades
        .slice()
        .reverse()
        .forEach(trade => {
            const row = document.createElement("tr");

            const resultClass =
                trade.result === "TP"
                    ? "win"
                    : trade.result === "SL"
                    ? "loss"
                    : "be";

            row.innerHTML = `
                <td>${trade.date || "-"}</td>
                <td>${trade.asset || "-"}</td>
                <td>${trade.direction || "-"}</td>
                <td>${trade.entry ?? "-"}</td>
                <td>${trade.sl ?? "-"}</td>
                <td>${trade.tp ?? "-"}</td>
                <td>${formatRR(trade.rr)}</td>
                <td>${trade.setup || "-"}</td>
                <td class="${resultClass}">${trade.result || "-"}</td>
                <td>${formatMoney(trade.profit)}</td>
                <td>
                    <button
                        class="delete-btn"
                        onclick="deleteTrade('${trade.id}')"
                        title="Supprimer"
                    >
                        🗑️
                    </button>
                </td>
            `;

            tradeList.appendChild(row);
        });
}

// ==========================================
// AJOUT D'UN TRADE
// ==========================================

form?.addEventListener("submit", function(event) {
    event.preventDefault();

    const entry = parseFloat(entryInput.value);
    const sl = parseFloat(slInput.value);
    const tp = parseFloat(tpInput.value);

    let rr = 0;

    if (
        !Number.isNaN(entry) &&
        !Number.isNaN(sl) &&
        !Number.isNaN(tp)
    ) {
        const risk = Math.abs(entry - sl);
        const reward = Math.abs(tp - entry);

        if (risk > 0) {
            rr = reward / risk;
        }
    }

    const trade = {
        id: Date.now().toString(),

        date: dateInput.value,

        asset: assetInput.value.trim(),

        direction: directionInput.value,

        orderType: orderTypeInput.value,

        entry: entry,

        sl: sl,

        tp: tp,

        rr: rr,

        setup: setupInput.value,

        result: resultInput.value,

        profit: parseFloat(profitInput.value) || 0,

        comment: commentInput.value.trim()
    };

    trades.push(trade);

    saveTrades();

    form.reset();

    dateInput.value = new Date()
        .toISOString()
        .split("T")[0];

    rrInput.value = "";

    updateDashboard();
    renderTrades();
});

// ==========================================
// SUPPRESSION D'UN TRADE
// ==========================================

function deleteTrade(id) {
    const confirmation = confirm(
        "Voulez-vous vraiment supprimer ce trade ?"
    );

    if (!confirmation) return;

    trades = trades.filter(trade => trade.id !== id);

    saveTrades();

    updateDashboard();
    renderTrades();
}

// ==========================================
// SUPPRESSION DE TOUS LES TRADES
// ==========================================

clearBtn?.addEventListener("click", function() {
    if (trades.length === 0) {
        alert("Il n'y a aucun trade à supprimer.");
        return;
    }

    const confirmation = confirm(
        "ATTENTION : voulez-vous supprimer tout l'historique ?"
    );

    if (!confirmation) return;

    trades = [];

    saveTrades();

    updateDashboard();
    renderTrades();
});

// ==========================================
// BOUTONS DE PERIODE
// ==========================================

const periodButtons = document.querySelectorAll(
    "[data-period]"
);

periodButtons.forEach(button => {
    button.addEventListener("click", function() {
        periodButtons.forEach(btn =>
            btn.classList.remove("active")
        );

        this.classList.add("active");

        currentPeriod = this.dataset.period;

        updateDashboard();
        renderTrades();
    });
});

// ==========================================
// MODE SOMBRE / CLAIR
// ==========================================

const themeToggle = document.getElementById("themeToggle");

themeToggle?.addEventListener("click", function() {
    document.body.classList.toggle("light-mode");

    const isLight =
        document.body.classList.contains("light-mode");

    localStorage.setItem(
        "tradingDashboardTheme",
        isLight ? "light" : "dark"
    );
});

const savedTheme =
    localStorage.getItem("tradingDashboardTheme");

if (savedTheme === "light") {
    document.body.classList.add("light-mode");
}

// ==========================================
// INITIALISATION
// ==========================================

updateDashboard();
renderTrades();

console.log("Trading Dashboard V2.1 chargé avec succès.");
