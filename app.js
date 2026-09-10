// ============================================================
// TRADING DASHBOARD - APP.JS
// Version avec graphique amélioré
// ============================================================

const TRADES_KEY = "tradingTrades";
const CAPITAL_KEY = "tradingActiveCapital";
const ARCHIVES_KEY = "tradingCapitalArchives";
const THEME_KEY = "tradingDashboardTheme";

// ============================================================
// OUTILS
// ============================================================

function generateId(prefix = "id") {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

function loadJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        console.error("Erreur lecture stockage :", error);
        return fallback;
    }
}

function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function formatMoney(value) {
    const number = Number(value) || 0;

    return number.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + " $";
}

function formatRR(value) {
    const number = Number(value) || 0;
    return "1:" + number.toFixed(2);
}

function formatDate(date) {
    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
        return "-";
    }

    return d.toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ============================================================
// CHARGEMENT DES DONNÉES
// ============================================================

let trades = loadJSON(TRADES_KEY, []);
let archives = loadJSON(ARCHIVES_KEY, []);
let activeCapital = loadJSON(CAPITAL_KEY, null);

if (!Array.isArray(trades)) {
    trades = [];
}

if (!Array.isArray(archives)) {
    archives = [];
}

// ============================================================
// CRÉATION DU PREMIER CAPITAL
// ============================================================

if (!activeCapital) {
    activeCapital = {
        id: generateId("capital"),
        name: "Capital 1",
        initialCapital: 0,
        createdAt: new Date().toISOString()
    };

    saveJSON(CAPITAL_KEY, activeCapital);
}

// ============================================================
// MIGRATION DES ANCIENS TRADES
// ============================================================

let migrationNeeded = false;

trades = trades.map(trade => {
    if (!trade.capitalId) {
        migrationNeeded = true;

        return {
            ...trade,
            capitalId: activeCapital.id
        };
    }

    return trade;
});

if (migrationNeeded) {
    saveJSON(TRADES_KEY, trades);
}

// ============================================================
// ÉLÉMENTS HTML
// ============================================================

const capitalNameInput = document.getElementById("capitalName");
const capitalAmountInput = document.getElementById("capitalAmount");

const balanceValue = document.getElementById("balanceValue");
const profitValue = document.getElementById("profitValue");
const winrateValue = document.getElementById("winrateValue");
const averageRRValue = document.getElementById("averageRRValue");
const tradesCountValue = document.getElementById("tradesCountValue");
const bestSetupValue = document.getElementById("bestSetupValue");

const periodButtons = document.querySelectorAll(".period-btn");

const tradeForm = document.getElementById("tradeForm");

const assetInput = document.getElementById("asset");
const positionInput = document.getElementById("position");
const entryInput = document.getElementById("entry");
const slInput = document.getElementById("sl");
const tpInput = document.getElementById("tp");
const setupInput = document.getElementById("setup");
const resultInput = document.getElementById("result");
const pnlInput = document.getElementById("pnl");
const commentInput = document.getElementById("comment");

const historyBody = document.getElementById("historyBody");
const setupTableBody = document.getElementById("setupTableBody");

const saveCapitalBtn = document.getElementById("saveCapitalBtn");
const newCapitalBtn = document.getElementById("newCapitalBtn");
const archiveCapitalBtn = document.getElementById("archiveCapitalBtn");
const clearBtn = document.getElementById("clearBtn");

const archivesList = document.getElementById("archivesList");

const capitalModal = document.getElementById("capitalModal");
const newCapitalNameInput = document.getElementById("newCapitalName");
const newCapitalAmountInput = document.getElementById("newCapitalAmount");
const confirmCapitalBtn = document.getElementById("confirmCapitalBtn");
const cancelCapitalBtn = document.getElementById("cancelCapitalBtn");
const cancelCapitalBtn2 = document.getElementById("cancelCapitalBtn2");

const archiveChartModal = document.getElementById("archiveChartModal");
const archiveChartTitle = document.getElementById("archiveChartTitle");
const archiveChartSubtitle = document.getElementById("archiveChartSubtitle");
const archiveChartInitial = document.getElementById("archiveChartInitial");
const archiveChartFinal = document.getElementById("archiveChartFinal");
const archiveChartProfit = document.getElementById("archiveChartProfit");
const archiveChart = document.getElementById("archiveChart");
const closeArchiveChartBtn = document.getElementById("closeArchiveChartBtn");

const capitalChart = document.getElementById("capitalChart");
const emptyChartMessage = document.getElementById("emptyChartMessage");

const themeToggle = document.getElementById("themeToggle");

// ============================================================
// SETUP
// ============================================================

const SETUPS = [
    "LDP+QML",
    "LDP+FIBO 50",
    "OB",
    "BB",
    "ZS OA",
    "SSM1",
    "SSM2",
    "SSM3",
    "SBM1",
    "SBM2",
    "SBM3"
];

let currentPeriod = "today";
let openedArchiveId = null;

// ============================================================
// CALCULS
// ============================================================

function getActiveTrades() {
    return trades.filter(trade => trade.capitalId === activeCapital.id);
}

function calculateBalance() {
    const activeTrades = getActiveTrades();

    const profit = activeTrades.reduce((total, trade) => {
        return total + (Number(trade.pnl) || 0);
    }, 0);

    return Number(activeCapital.initialCapital || 0) + profit;
}

function calculateRR(entry, sl, tp) {
    const e = Number(entry);
    const s = Number(sl);
    const t = Number(tp);

    if (!Number.isFinite(e) || !Number.isFinite(s) || !Number.isFinite(t)) {
        return 0;
    }

    const risk = Math.abs(e - s);
    const reward = Math.abs(t - e);

    if (risk <= 0) {
        return 0;
    }

    return reward / risk;
}

// ============================================================
// FILTRE DES PÉRIODES
// ============================================================

function isSameDay(date) {
    const d = new Date(date);
    const now = new Date();

    return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
    );
}

function isSameWeek(date) {
    const d = new Date(date);
    const now = new Date();

    const day = now.getDay() === 0 ? 7 : now.getDay();

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - day + 1);

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return d >= start && d < end;
}

function isSameMonth(date) {
    const d = new Date(date);
    const now = new Date();

    return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth()
    );
}

function isSameYear(date) {
    const d = new Date(date);
    const now = new Date();

    return d.getFullYear() === now.getFullYear();
}

function filterByPeriod(list) {
    if (currentPeriod === "all") {
        return list;
    }

    return list.filter(trade => {
        const date = trade.date || trade.createdAt;

        if (currentPeriod === "today") {
            return isSameDay(date);
        }

        if (currentPeriod === "week") {
            return isSameWeek(date);
        }

        if (currentPeriod === "month") {
            return isSameMonth(date);
        }

        if (currentPeriod === "year") {
            return isSameYear(date);
        }

        return true;
    });
}

// ============================================================
// STATISTIQUES
// ============================================================

function updateStats() {
    const activeTrades = getActiveTrades();
    const periodTrades = filterByPeriod(activeTrades);

    const totalProfit = periodTrades.reduce((total, trade) => {
        return total + (Number(trade.pnl) || 0);
    }, 0);

    const winners = periodTrades.filter(trade => Number(trade.pnl) > 0).length;

    const winrate = periodTrades.length > 0
        ? (winners / periodTrades.length) * 100
        : 0;

    const rrValues = periodTrades
        .map(trade => Number(trade.rr))
        .filter(rr => Number.isFinite(rr) && rr > 0);

    const averageRR = rrValues.length > 0
        ? rrValues.reduce((a, b) => a + b, 0) / rrValues.length
        : 0;

    const balance = calculateBalance();

    if (balanceValue) {
        balanceValue.textContent = formatMoney(balance);
    }

    if (profitValue) {
        profitValue.textContent = formatMoney(totalProfit);
    }

    if (winrateValue) {
        winrateValue.textContent = winrate.toFixed(1) + " %";
    }

    if (averageRRValue) {
        averageRRValue.textContent = averageRR > 0
            ? formatRR(averageRR)
            : "-";
    }

    if (tradesCountValue) {
        tradesCountValue.textContent = periodTrades.length;
    }

    updateBestSetup(periodTrades);
}

// ============================================================
// MEILLEUR SETUP
// ============================================================

function updateBestSetup(list) {
    if (!bestSetupValue) {
        return;
    }

    if (list.length === 0) {
        bestSetupValue.textContent = "-";
        return;
    }

    const setupStats = {};

    list.forEach(trade => {
        const setup = trade.setup || "Sans setup";

        if (!setupStats[setup]) {
            setupStats[setup] = {
                trades: 0,
                winners: 0
            };
        }

        setupStats[setup].trades++;

        if (Number(trade.pnl) > 0) {
            setupStats[setup].winners++;
        }
    });

    const ranked = Object.entries(setupStats)
        .map(([setup, data]) => ({
            setup,
            trades: data.trades,
            winrate: data.trades > 0
                ? data.winners / data.trades
                : 0
        }))
        .sort((a, b) => {
            if (b.winrate !== a.winrate) {
                return b.winrate - a.winrate;
            }

            return b.trades - a.trades;
        });

    bestSetupValue.textContent = ranked[0]?.setup || "-";
}

// ============================================================
// TABLEAU DES SETUPS
// ============================================================

function updateSetupTable() {
    if (!setupTableBody) {
        return;
    }

    const activeTrades = filterByPeriod(getActiveTrades());

    setupTableBody.innerHTML = "";

    const stats = {};

    activeTrades.forEach(trade => {
        const setup = trade.setup || "Sans setup";

        if (!stats[setup]) {
            stats[setup] = {
                trades: 0,
                winners: 0,
                profit: 0
            };
        }

        stats[setup].trades++;
        stats[setup].profit += Number(trade.pnl) || 0;

        if (Number(trade.pnl) > 0) {
            stats[setup].winners++;
        }
    });

    const setupNames = [...new Set([
        ...SETUPS,
        ...Object.keys(stats)
    ])];

    setupNames.forEach(setup => {
        const data = stats[setup] || {
            trades: 0,
            winners: 0,
            profit: 0
        };

        const winrate = data.trades > 0
            ? (data.winners / data.trades) * 100
            : 0;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(setup)}</td>
            <td>${data.trades}</td>
            <td>${data.winners}</td>
            <td>${winrate.toFixed(1)} %</td>
            <td>${formatMoney(data.profit)}</td>
        `;

        setupTableBody.appendChild(row);
    });
}

// ============================================================
// HISTORIQUE
// ============================================================

function updateHistory() {
    if (!historyBody) {
        return;
    }

    const activeTrades = getActiveTrades()
        .slice()
        .sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });

    historyBody.innerHTML = "";

    if (activeTrades.length === 0) {
        historyBody.innerHTML = `
            <tr>
                <td colspan="11" class="empty-history">
                    Aucun trade enregistré.
                </td>
            </tr>
        `;

        return;
    }

    activeTrades.forEach(trade => {
        const pnl = Number(trade.pnl) || 0;

        let pnlClass = "";

        if (pnl > 0) {
            pnlClass = "profit-positive";
        } else if (pnl < 0) {
            pnlClass = "profit-negative";
        }

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${formatDate(trade.date)}</td>
            <td>${escapeHTML(trade.asset)}</td>
            <td>${escapeHTML(trade.position)}</td>
            <td>${escapeHTML(trade.entry)}</td>
            <td>${escapeHTML(trade.sl)}</td>
            <td>${escapeHTML(trade.tp)}</td>
            <td>${trade.rr > 0 ? formatRR(trade.rr) : "-"}</td>
            <td>${escapeHTML(trade.setup)}</td>
            <td>${escapeHTML(trade.result)}</td>
            <td class="${pnlClass}">
                ${pnl >= 0 ? "+" : ""}${formatMoney(pnl)}
            </td>
            <td>
                <button
                    type="button"
                    class="delete-trade-btn"
                    onclick="deleteTrade('${trade.id}')"
                >
                    Supprimer
                </button>
            </td>
        `;

        historyBody.appendChild(row);
    });
}

// ============================================================
// AJOUT D'UN TRADE
// ============================================================

function addTrade(event) {
    event.preventDefault();

    const asset = assetInput?.value.trim();
    const position = positionInput?.value;
    const entry = Number(entryInput?.value);
    const sl = Number(slInput?.value);
    const tp = Number(tpInput?.value);
    const setup = setupInput?.value;
    const result = resultInput?.value;
    const pnl = Number(pnlInput?.value);
    const comment = commentInput?.value.trim();

    if (!asset || !position || !Number.isFinite(entry) ||
        !Number.isFinite(sl) || !Number.isFinite(tp) ||
        !Number.isFinite(pnl)) {

        alert("Veuillez remplir correctement les champs du trade.");
        return;
    }

    const rr = calculateRR(entry, sl, tp);

    const trade = {
        id: generateId("trade"),
        capitalId: activeCapital.id,
        date: new Date().toISOString(),
        asset,
        position,
        entry,
        sl,
        tp,
        rr,
        setup: setup || "",
        result: result || "",
        pnl,
        comment
    };

    trades.push(trade);

    saveJSON(TRADES_KEY, trades);

    if (tradeForm) {
        tradeForm.reset();
    }

    refreshDashboard();

    alert("Trade enregistré avec succès.");
}

// ============================================================
// SUPPRESSION D'UN TRADE
// ============================================================

function deleteTrade(id) {
    const trade = trades.find(item => item.id === id);

    if (!trade) {
        return;
    }

    if (!confirm("Supprimer ce trade ?")) {
        return;
    }

    trades = trades.filter(item => item.id !== id);

    saveJSON(TRADES_KEY, trades);

    refreshDashboard();
}

window.deleteTrade = deleteTrade;

// ============================================================
// EFFACER LES TRADES DU CAPITAL ACTUEL
// ============================================================

function clearCurrentTrades() {
    const activeTrades = getActiveTrades();

    if (activeTrades.length === 0) {
        alert("Il n'y a aucun trade à supprimer.");
        return;
    }

    if (!confirm(
        "Supprimer tous les trades du capital actuel ?\n\n" +
        "Cette action ne supprimera pas les archives."
    )) {
        return;
    }

    trades = trades.filter(trade => trade.capitalId !== activeCapital.id);

    saveJSON(TRADES_KEY, trades);

    refreshDashboard();
}

// ============================================================
// CAPITAL ACTUEL
// ============================================================

function updateCapitalForm() {
    if (capitalNameInput) {
        capitalNameInput.value = activeCapital.name || "";
    }

    if (capitalAmountInput) {
        capitalAmountInput.value = Number(activeCapital.initialCapital || 0);
    }
}

function saveCapital() {
    const name = capitalNameInput?.value.trim();
    const amount = Number(capitalAmountInput?.value);

    if (!name) {
        alert("Veuillez entrer un nom pour le capital.");
        return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
        alert("Veuillez entrer un capital valide.");
        return;
    }

    activeCapital.name = name;
    activeCapital.initialCapital = amount;

    saveJSON(CAPITAL_KEY, activeCapital);

    refreshDashboard();

    alert("Capital enregistré avec succès.");
}

// ============================================================
// NOUVEAU CAPITAL
// ============================================================

function openCapitalModal() {
    if (!capitalModal) {
        return;
    }

    const suggestedNumber = archives.length + 2;

    if (newCapitalNameInput) {
        newCapitalNameInput.value = "Capital " + suggestedNumber;
    }

    if (newCapitalAmountInput) {
        newCapitalAmountInput.value = "";
    }

    capitalModal.classList.add("active");
}

function closeCapitalModal() {
    if (capitalModal) {
        capitalModal.classList.remove("active");
    }
}

function createNewCapital() {
    const name = newCapitalNameInput?.value.trim();
    const amount = Number(newCapitalAmountInput?.value);

    if (!name) {
        alert("Veuillez entrer un nom pour le nouveau capital.");
        return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
        alert("Veuillez entrer un montant valide.");
        return;
    }

    archiveCurrentCapital(false);

    activeCapital = {
        id: generateId("capital"),
        name,
        initialCapital: amount,
        createdAt: new Date().toISOString()
    };

    saveJSON(CAPITAL_KEY, activeCapital);

    closeCapitalModal();

    refreshDashboard();

    alert("Nouveau capital créé avec succès.");
}

// ============================================================
// ARCHIVAGE
// ============================================================

function calculateCapitalStats(capital, capitalTrades) {
    const totalProfit = capitalTrades.reduce((total, trade) => {
        return total + (Number(trade.pnl) || 0);
    }, 0);

    const winners = capitalTrades.filter(
        trade => Number(trade.pnl) > 0
    ).length;

    const winrate = capitalTrades.length > 0
        ? (winners / capitalTrades.length) * 100
        : 0;

    const finalBalance =
        Number(capital.initialCapital || 0) + totalProfit;

    return {
        totalProfit,
        winners,
        winrate,
        finalBalance
    };
}

function archiveCurrentCapital(showMessage = true) {
    const capitalTrades = getActiveTrades();

    const stats = calculateCapitalStats(
        activeCapital,
        capitalTrades
    );

    const archive = {
        id: generateId("archive"),
        name: activeCapital.name,
        initialCapital: Number(activeCapital.initialCapital || 0),
        finalBalance: stats.finalBalance,
        totalProfit: stats.totalProfit,
        totalTrades: capitalTrades.length,
        winrate: stats.winrate,
        createdAt: activeCapital.createdAt,
        archivedAt: new Date().toISOString(),
        trades: JSON.parse(JSON.stringify(capitalTrades))
    };

    archives.push(archive);

    saveJSON(ARCHIVES_KEY, archives);

    if (showMessage) {
        alert("Capital archivé avec succès.");
    }

    renderArchives();
}

function manualArchive() {
    if (!confirm(
        "Archiver le capital actuel ?\n\n" +
        "Son historique sera conservé séparément."
    )) {
        return;
    }

    archiveCurrentCapital(true);

    const nextCapitalNumber = archives.length + 1;

    activeCapital = {
        id: generateId("capital"),
        name: "Capital " + nextCapitalNumber,
        initialCapital: 0,
        createdAt: new Date().toISOString()
    };

    saveJSON(CAPITAL_KEY, activeCapital);

    refreshDashboard();
}

// ============================================================
// AFFICHAGE DES ARCHIVES
// ============================================================

function renderArchives() {
    if (!archivesList) {
        return;
    }

    archivesList.innerHTML = "";

    if (archives.length === 0) {
        archivesList.innerHTML = `
            <div class="empty-archives">
                Aucun capital archivé.
            </div>
        `;

        return;
    }

    const sortedArchives = archives
        .slice()
        .sort((a, b) => {
            return new Date(b.archivedAt) - new Date(a.archivedAt);
        });

    sortedArchives.forEach(archive => {
        const card = document.createElement("div");

        card.className = "archive-card";

        card.innerHTML = `
            <div class="archive-card-header">
                <div>
                    <h3>${escapeHTML(archive.name)}</h3>
                    <small>
                        Archivé le ${formatDate(archive.archivedAt)}
                    </small>
                </div>
            </div>

            <div class="archive-stats">
                <div>
                    <span>Capital initial</span>
                    <strong>${formatMoney(archive.initialCapital)}</strong>
                </div>

                <div>
                    <span>Capital final</span>
                    <strong>${formatMoney(archive.finalBalance)}</strong>
                </div>

                <div>
                    <span>Profit</span>
                    <strong>${formatMoney(archive.totalProfit)}</strong>
                </div>

                <div>
                    <span>Trades</span>
                    <strong>${archive.totalTrades}</strong>
                </div>

                <div>
                    <span>Winrate</span>
                    <strong>${Number(archive.winrate || 0).toFixed(1)} %</strong>
                </div>
            </div>

            <div class="archive-actions">
                <button
                    type="button"
                    class="view-archive-btn"
                    onclick="viewArchive('${archive.id}')"
                >
                    Voir le graphique
                </button>

                <button
                    type="button"
                    class="delete-archive-btn"
                    onclick="deleteArchive('${archive.id}')"
                >
                    Supprimer
                </button>
            </div>
        `;

        archivesList.appendChild(card);
    });
}

// ============================================================
// ÉVOLUTION DU CAPITAL
// ============================================================

function getCapitalEvolution(initialCapital, capitalTrades) {
    let balance = Number(initialCapital) || 0;

    const points = [
        {
            balance,
            pnl: 0,
            label: "Départ"
        }
    ];

    const sortedTrades = capitalTrades
        .slice()
        .sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });

    sortedTrades.forEach((trade, index) => {
        const pnl = Number(trade.pnl) || 0;

        balance += pnl;

        points.push({
            balance,
            pnl,
            label: "Trade " + (index + 1)
        });
    });

    return points;
}

// ============================================================
// ÉCHELLE DU GRAPHIQUE
// ============================================================

// Cette fonction crée une échelle propre.
// Exemple :
// 98.80 / 101.28 / 103.76
// devient :
// 95 / 100 / 105 / 110
//
// Pour les petits capitaux, l'échelle reste adaptée.

function calculateChartScale(values) {
    if (!values.length) {
        return {
            min: 0,
            max: 100,
            step: 5
        };
    }

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    if (minValue === maxValue) {
        const base = Math.floor(minValue / 5) * 5;

        return {
            min: base - 5,
            max: base + 10,
            step: 5
        };
    }

    const range = maxValue - minValue;

    // Échelle principale en multiples de 5 $
    let step = 5;

    // Si l'écart est très grand, on utilise des multiples
    // de 10, 25, 50, etc. pour éviter une échelle surchargée.
    if (range > 1000) {
        step = 100;
    } else if (range > 500) {
        step = 50;
    } else if (range > 200) {
        step = 25;
    } else if (range > 100) {
        step = 10;
    }

    let min = Math.floor(minValue / step) * step;
    let max = Math.ceil(maxValue / step) * step;

    // Ajouter une marge d'une graduation
    min -= step;
    max += step;

    if (min < 0 && minValue >= 0) {
        min = 0;
    }

    return {
        min,
        max,
        step
    };
}

// ============================================================
// COULEUR D'UN TRADE
// ============================================================

function getTradeColor(pnl) {
    const value = Number(pnl) || 0;

    if (value > 0) {
        return "#16a34a"; // vert
    }

    if (value < 0) {
        return "#dc2626"; // rouge
    }

    return "#64748b"; // gris = BE
}

// ============================================================
// DESSIN DU GRAPHIQUE
// ============================================================

function drawCapitalChart(canvas, points, options = {}) {
    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        return;
    }

    const rect = canvas.getBoundingClientRect();

    const width = Math.max(
        320,
        Math.floor(rect.width || canvas.parentElement?.clientWidth || 600)
    );

    const height = Math.max(
        260,
        Math.floor(rect.height || 320)
    );

    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, width, height);

    if (!points || points.length === 0) {
        return;
    }

    // --------------------------------------------------------
    // DIMENSIONS
    // --------------------------------------------------------

    const padding = {
        top: 25,
        right: 25,
        bottom: 45,
        left: 75
    };

    const chartWidth =
        width - padding.left - padding.right;

    const chartHeight =
        height - padding.top - padding.bottom;

    // --------------------------------------------------------
    // VALEURS
    // --------------------------------------------------------

    const values = points.map(point => Number(point.balance) || 0);

    const scale = calculateChartScale(values);

    const minValue = scale.min;
    const maxValue = scale.max;
    const step = scale.step;

    const valueRange = maxValue - minValue || 1;

    // --------------------------------------------------------
    // COULEURS DU THÈME
    // --------------------------------------------------------

    const styles = getComputedStyle(document.body);

    const textColor =
        styles.getPropertyValue("--text-color").trim() || "#64748b";

    const gridColor =
        styles.getPropertyValue("--border-color").trim() || "#e2e8f0";

    // --------------------------------------------------------
    // FOND
    // --------------------------------------------------------

    ctx.fillStyle =
        styles.getPropertyValue("--card-bg").trim() || "transparent";

    ctx.fillRect(
        0,
        0,
        width,
        height
    );

    // --------------------------------------------------------
    // GRILLE + ÉCHELLE
    // --------------------------------------------------------

    ctx.font = "12px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (
        let value = minValue;
        value <= maxValue + step / 10;
        value += step
    ) {
        const y =
            padding.top +
            chartHeight -
            ((value - minValue) / valueRange) * chartHeight;

        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = textColor;

        ctx.fillText(
            Math.round(value) + " $",
            padding.left - 10,
            y
        );
    }

    // --------------------------------------------------------
    // AXES
    // --------------------------------------------------------

    ctx.beginPath();

    ctx.moveTo(
        padding.left,
        padding.top
    );

    ctx.lineTo(
        padding.left,
        padding.top + chartHeight
    );

    ctx.lineTo(
        width - padding.right,
        padding.top + chartHeight
    );

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // --------------------------------------------------------
    // POSITION DES POINTS
    // --------------------------------------------------------

    const coordinates = points.map((point, index) => {
        const x = points.length === 1
            ? padding.left + chartWidth / 2
            : padding.left +
              (index / (points.length - 1)) * chartWidth;

        const y =
            padding.top +
            chartHeight -
            ((Number(point.balance) - minValue) / valueRange) *
                chartHeight;

        return {
            x,
            y,
            balance: Number(point.balance) || 0,
            pnl: Number(point.pnl) || 0
        };
    });

    // --------------------------------------------------------
    // LIGNE / COURBE
    // --------------------------------------------------------

    if (coordinates.length > 1) {
        for (let i = 1; i < coordinates.length; i++) {
            const previous = coordinates[i - 1];
            const current = coordinates[i];

            const color = getTradeColor(current.pnl);

            ctx.beginPath();

            ctx.moveTo(previous.x, previous.y);

            // Petite courbe douce entre les points
            const middleX =
                (previous.x + current.x) / 2;

            ctx.bezierCurveTo(
                middleX,
                previous.y,
                middleX,
                current.y,
                current.x,
                current.y
            );

            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            ctx.stroke();
        }
    }

    // --------------------------------------------------------
    // POINTS
    // --------------------------------------------------------

    coordinates.forEach((point, index) => {
        let color = "#64748b";

        if (index > 0) {
            color = getTradeColor(point.pnl);
        }

        ctx.beginPath();

        ctx.arc(
            point.x,
            point.y,
            4,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle =
            styles.getPropertyValue("--card-bg").trim() || "#ffffff";

        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // --------------------------------------------------------
    // VALEUR DU DERNIER POINT
    // --------------------------------------------------------

    const last = coordinates[coordinates.length - 1];

    if (last) {
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        ctx.fillStyle =
            last.pnl > 0
                ? "#16a34a"
                : last.pnl < 0
                    ? "#dc2626"
                    : textColor;

        ctx.fillText(
            formatMoney(last.balance),
            last.x,
            last.y - 10
        );
    }

    // --------------------------------------------------------
    // LABELS X
    // --------------------------------------------------------

    if (points.length <= 12) {
        ctx.font = "11px Arial";
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        coordinates.forEach((point, index) => {
            const label =
                index === 0
                    ? "Départ"
                    : "#" + index;

            ctx.fillText(
                label,
                point.x,
                padding.top + chartHeight + 12
            );
        });
    } else {
        // Pour beaucoup de trades, on n'affiche que
        // quelques labels afin de garder le graphique propre.

        const indexes = [
            0,
            Math.floor((points.length - 1) / 2),
            points.length - 1
        ];

        ctx.font = "11px Arial";
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        indexes.forEach(index => {
            const point = coordinates[index];

            const label =
                index === 0
                    ? "Départ"
                    : "#" + index;

            ctx.fillText(
                label,
                point.x,
                padding.top + chartHeight + 12
            );
        });
    }
}

// ============================================================
// GRAPHIQUE DU CAPITAL ACTIF
// ============================================================

function updateActiveChart() {
    if (!capitalChart) {
        return;
    }

    const activeTrades = getActiveTrades();

    if (activeTrades.length === 0) {
        capitalChart.style.display = "none";

        if (emptyChartMessage) {
            emptyChartMessage.style.display = "flex";
        }

        return;
    }

    capitalChart.style.display = "block";

    if (emptyChartMessage) {
        emptyChartMessage.style.display = "none";
    }

    const points = getCapitalEvolution(
        activeCapital.initialCapital,
        activeTrades
    );

    drawCapitalChart(capitalChart, points);
}

// ============================================================
// GRAPHIQUE D'UNE ARCHIVE
// ============================================================

function viewArchive(id) {
    const archive = archives.find(item => item.id === id);

    if (!archive || !archiveChartModal || !archiveChart) {
        return;
    }

    openedArchiveId = id;

    const points = getCapitalEvolution(
        archive.initialCapital,
        archive.trades || []
    );

    if (archiveChartTitle) {
        archiveChartTitle.textContent = archive.name;
    }

    if (archiveChartSubtitle) {
        archiveChartSubtitle.textContent =
            "Évolution du capital archivé";
    }

    if (archiveChartInitial) {
        archiveChartInitial.textContent =
            formatMoney(archive.initialCapital);
    }

    if (archiveChartFinal) {
        archiveChartFinal.textContent =
            formatMoney(archive.finalBalance);
    }

    if (archiveChartProfit) {
        archiveChartProfit.textContent =
            formatMoney(archive.totalProfit);
    }

    archiveChartModal.classList.add("active");

    // Attendre que le modal soit visible pour obtenir
    // la bonne largeur du canvas.
    requestAnimationFrame(() => {
        drawCapitalChart(
            archiveChart,
            points
        );
    });
}

window.viewArchive = viewArchive;

// ============================================================
// FERMETURE GRAPHIQUE ARCHIVE
// ============================================================

function closeArchiveChart() {
    openedArchiveId = null;

    if (archiveChartModal) {
        archiveChartModal.classList.remove("active");
    }
}

// ============================================================
// SUPPRESSION D'UNE ARCHIVE
// ============================================================

function deleteArchive(id) {
    const archive = archives.find(item => item.id === id);

    if (!archive) {
        return;
    }

    if (!confirm(
        "Supprimer définitivement l'archive \"" +
        archive.name +
        "\" ?"
    )) {
        return;
    }

    archives = archives.filter(item => item.id !== id);

    saveJSON(ARCHIVES_KEY, archives);

    if (openedArchiveId === id) {
        closeArchiveChart();
    }

    renderArchives();
}

window.deleteArchive = deleteArchive;

// ============================================================
// PÉRIODES
// ============================================================

function setPeriod(period) {
    currentPeriod = period;

    periodButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.period === period
        );
    });

    updateStats();
    updateSetupTable();
    updateHistory();
}

// ============================================================
// THÈME
// ============================================================

function applyTheme(theme) {
    document.body.classList.toggle(
        "light-theme",
        theme === "light"
    );

    document.body.classList.toggle(
        "dark-theme",
        theme === "dark"
    );

    if (themeToggle) {
        themeToggle.textContent =
            theme === "light"
                ? "🌙"
                : "☀️";
    }

    saveJSON(THEME_KEY, theme);

    updateActiveChart();

    if (openedArchiveId) {
        const archive = archives.find(
            item => item.id === openedArchiveId
        );

        if (archive && archiveChart) {
            const points = getCapitalEvolution(
                archive.initialCapital,
                archive.trades || []
            );

            requestAnimationFrame(() => {
                drawCapitalChart(
                    archiveChart,
                    points
                );
            });
        }
    }
}

function toggleTheme() {
    const currentTheme =
        document.body.classList.contains("light-theme")
            ? "light"
            : "dark";

    applyTheme(
        currentTheme === "light"
            ? "dark"
            : "light"
    );
}

// ============================================================
// RAFRAÎCHISSEMENT GLOBAL
// ============================================================

function refreshDashboard() {
    updateCapitalForm();
    updateStats();
    updateSetupTable();
    updateHistory();
    renderArchives();
    updateActiveChart();
}

// ============================================================
// ÉVÉNEMENTS
// ============================================================

if (tradeForm) {
    tradeForm.addEventListener(
        "submit",
        addTrade
    );
}

if (saveCapitalBtn) {
    saveCapitalBtn.addEventListener(
        "click",
        saveCapital
    );
}

if (newCapitalBtn) {
    newCapitalBtn.addEventListener(
        "click",
        openCapitalModal
    );
}

if (archiveCapitalBtn) {
    archiveCapitalBtn.addEventListener(
        "click",
        manualArchive
    );
}

if (clearBtn) {
    clearBtn.addEventListener(
        "click",
        clearCurrentTrades
    );
}

if (confirmCapitalBtn) {
    confirmCapitalBtn.addEventListener(
        "click",
        createNewCapital
    );
}

if (cancelCapitalBtn) {
    cancelCapitalBtn.addEventListener(
        "click",
        closeCapitalModal
    );
}

if (cancelCapitalBtn2) {
    cancelCapitalBtn2.addEventListener(
        "click",
        closeCapitalModal
    );
}

if (closeArchiveChartBtn) {
    closeArchiveChartBtn.addEventListener(
        "click",
        closeArchiveChart
    );
}

periodButtons.forEach(button => {
    button.addEventListener(
        "click",
        () => {
            setPeriod(
                button.dataset.period
            );
        }
    );
});

if (themeToggle) {
    themeToggle.addEventListener(
        "click",
        toggleTheme
    );
}

// Fermer les fenêtres modales en cliquant
// à l'extérieur
if (capitalModal) {
    capitalModal.addEventListener(
        "click",
        event => {
            if (event.target === capitalModal) {
                closeCapitalModal();
            }
        }
    );
}

if (archiveChartModal) {
    archiveChartModal.addEventListener(
        "click",
        event => {
            if (event.target === archiveChartModal) {
                closeArchiveChart();
            }
        }
    );
}

// Touche Échap
document.addEventListener(
    "keydown",
    event => {
        if (event.key === "Escape") {
            closeCapitalModal();
            closeArchiveChart();
        }
    }
);

// Redessiner les graphiques lorsque la fenêtre change de taille
window.addEventListener(
    "resize",
    () => {
        updateActiveChart();

        if (openedArchiveId) {
            const archive = archives.find(
                item => item.id === openedArchiveId
            );

            if (archive && archiveChart) {
                const points = getCapitalEvolution(
                    archive.initialCapital,
                    archive.trades || []
                );

                drawCapitalChart(
                    archiveChart,
                    points
                );
            }
        }
    }
);

// ============================================================
// INITIALISATION
// ============================================================

const savedTheme = loadJSON(
    THEME_KEY,
    "dark"
);

applyTheme(
    savedTheme === "light"
        ? "light"
        : "dark"
);

setPeriod("today");

refreshDashboard();

console.log(
    "Trading Dashboard initialisé avec succès."
);
