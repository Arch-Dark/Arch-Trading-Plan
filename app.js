```javascript
// ============================================================
// TRADING DASHBOARD
// Gestion des trades + capitaux + archives + graphiques
// ============================================================


// ============================================================
// CLÉS DE STOCKAGE
// ============================================================

const TRADES_KEY = "tradingTrades";
const CAPITAL_KEY = "tradingActiveCapital";
const ARCHIVES_KEY = "tradingCapitalArchives";
const THEME_KEY = "tradingDashboardTheme";


// ============================================================
// DONNÉES
// ============================================================

let trades = JSON.parse(localStorage.getItem(TRADES_KEY)) || [];
let archives = JSON.parse(localStorage.getItem(ARCHIVES_KEY)) || [];

let activeCapital = JSON.parse(localStorage.getItem(CAPITAL_KEY));

let currentPeriod = "today";


// ============================================================
// CRÉATION DU PREMIER CAPITAL SI NÉCESSAIRE
// ============================================================

if (!activeCapital) {

    activeCapital = {
        id: Date.now().toString(),
        name: "Capital 1",
        initialCapital: 0,
        createdAt: new Date().toISOString()
    };

    localStorage.setItem(
        CAPITAL_KEY,
        JSON.stringify(activeCapital)
    );
}


// ============================================================
// ANCIENS TRADES SANS CAPITAL ID
// ============================================================

trades = trades.map(trade => {

    if (!trade.capitalId) {
        trade.capitalId = activeCapital.id;
    }

    return trade;
});

localStorage.setItem(
    TRADES_KEY,
    JSON.stringify(trades)
);


// ============================================================
// ÉLÉMENTS HTML
// ============================================================

const tradeForm = document.getElementById("tradeForm");

const assetInput = document.getElementById("asset");
const dateInput = document.getElementById("date");
const directionInput = document.getElementById("direction");
const orderTypeInput = document.getElementById("orderType");
const entryInput = document.getElementById("entry");
const slInput = document.getElementById("sl");
const tpInput = document.getElementById("tp");
const calculatedRRInput = document.getElementById("calculatedRR");
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
const setupList = document.getElementById("setupList");
const emptyMessage = document.getElementById("emptyMessage");
const clearBtn = document.getElementById("clearBtn");

const periodButtons = document.querySelectorAll(".period-btn");

const activeCapitalName = document.getElementById("activeCapitalName");
const activeCapitalPeriod = document.getElementById("activeCapitalPeriod");

const capitalNameInput = document.getElementById("capitalName");
const initialCapitalInput = document.getElementById("initialCapital");

const saveCapitalBtn = document.getElementById("saveCapitalBtn");
const newCapitalBtn = document.getElementById("newCapitalBtn");
const archiveCapitalBtn = document.getElementById("archiveCapitalBtn");

const capitalModal = document.getElementById("capitalModal");
const newCapitalNameInput = document.getElementById("newCapitalName");
const newInitialCapitalInput = document.getElementById("newInitialCapital");

const cancelCapitalBtn = document.getElementById("cancelCapitalBtn");
const cancelCapitalBtn2 = document.getElementById("cancelCapitalBtn2");
const confirmCapitalBtn = document.getElementById("confirmCapitalBtn");

const archivesList = document.getElementById("archivesList");
const emptyArchives = document.getElementById("emptyArchives");

const themeBtn = document.getElementById("themeBtn");


// ============================================================
// GRAPHIQUES
// ============================================================

const capitalChartCanvas = document.getElementById("capitalChart");
const emptyChartMessage = document.getElementById("emptyChartMessage");

const archiveChartModal = document.getElementById("archiveChartModal");
const archiveChartTitle = document.getElementById("archiveChartTitle");
const archiveChartSubtitle = document.getElementById("archiveChartSubtitle");
const archiveChartInitial = document.getElementById("archiveChartInitial");
const archiveChartFinal = document.getElementById("archiveChartFinal");
const archiveChartProfit = document.getElementById("archiveChartProfit");
const archiveChartCanvas = document.getElementById("archiveChart");
const closeArchiveChartBtn = document.getElementById("closeArchiveChartBtn");


// ============================================================
// OUTILS
// ============================================================

function saveTrades() {

    localStorage.setItem(
        TRADES_KEY,
        JSON.stringify(trades)
    );
}


function saveArchives() {

    localStorage.setItem(
        ARCHIVES_KEY,
        JSON.stringify(archives)
    );
}


function saveActiveCapital() {

    localStorage.setItem(
        CAPITAL_KEY,
        JSON.stringify(activeCapital)
    );
}


function formatMoney(value) {

    return Number(value || 0).toFixed(2) + " $";
}


function formatRR(value) {

    return "1:" + Number(value || 0).toFixed(2);
}


function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}


// ============================================================
// CALCUL RR
// ============================================================

function calculateRR() {

    const entry = Number(entryInput.value);
    const sl = Number(slInput.value);
    const tp = Number(tpInput.value);

    if (
        !Number.isFinite(entry) ||
        !Number.isFinite(sl) ||
        !Number.isFinite(tp)
    ) {

        calculatedRRInput.value = "0.00";
        return 0;
    }

    let risk = 0;
    let reward = 0;

    if (directionInput.value === "BUY") {

        risk = entry - sl;
        reward = tp - entry;

    } else {

        risk = sl - entry;
        reward = entry - tp;
    }

    if (risk <= 0 || reward <= 0) {

        calculatedRRInput.value = "0.00";
        return 0;
    }

    const rr = reward / risk;

    calculatedRRInput.value = "1:" + rr.toFixed(2);

    return rr;
}


entryInput.addEventListener("input", calculateRR);
slInput.addEventListener("input", calculateRR);
tpInput.addEventListener("input", calculateRR);
directionInput.addEventListener("change", calculateRR);


// ============================================================
// FILTRAGE PAR PÉRIODE
// ============================================================

function getPeriodStart(period) {

    const now = new Date();

    if (period === "today") {

        return new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
    }

    if (period === "week") {

        const day = now.getDay();

        const diff = day === 0 ? 6 : day - 1;

        return new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - diff
        );
    }

    if (period === "month") {

        return new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );
    }

    if (period === "year") {

        return new Date(
            now.getFullYear(),
            0,
            1
        );
    }

    return null;
}


function getCurrentCapitalTrades() {

    return trades.filter(
        trade => trade.capitalId === activeCapital.id
    );
}


function getFilteredTrades() {

    const currentTrades = getCurrentCapitalTrades();

    if (currentPeriod === "all") {

        return currentTrades;
    }

    const start = getPeriodStart(currentPeriod);

    return currentTrades.filter(trade => {

        const tradeDate = new Date(
            trade.date + "T00:00:00"
        );

        return tradeDate >= start;
    });
}


// ============================================================
// STATISTIQUES
// ============================================================

function updateStats() {

    const allCurrentTrades = getCurrentCapitalTrades();
    const filteredTrades = getFilteredTrades();

    let totalProfit = 0;

    filteredTrades.forEach(trade => {

        totalProfit += Number(trade.profit) || 0;
    });

    const winners = filteredTrades.filter(
        trade => trade.result === "TP"
    ).length;

    const winrate = filteredTrades.length > 0
        ? (winners / filteredTrades.length) * 100
        : 0;

    const validRR = filteredTrades
        .map(trade => Number(trade.rr))
        .filter(rr => Number.isFinite(rr) && rr > 0);

    const averageRR = validRR.length > 0
        ? validRR.reduce((sum, rr) => sum + rr, 0) / validRR.length
        : 0;

    const currentBalance =
        Number(activeCapital.initialCapital || 0) +
        allCurrentTrades.reduce(
            (sum, trade) => sum + (Number(trade.profit) || 0),
            0
        );

    balanceElement.textContent = formatMoney(currentBalance);

    totalProfitElement.textContent = formatMoney(totalProfit);

    winrateElement.textContent =
        winrate.toFixed(1) + "%";

    averageRRElement.textContent =
        averageRR.toFixed(2);

    totalTradesElement.textContent =
        filteredTrades.length;

    updateBestSetup(filteredTrades);

    activeCapitalName.textContent =
        activeCapital.name;

    activeCapitalPeriod.textContent =
        "Capital initial : " +
        formatMoney(activeCapital.initialCapital) +
        " • Solde actuel : " +
        formatMoney(currentBalance) +
        " • " +
        allCurrentTrades.length +
        " trade(s)";
}


// ============================================================
// MEILLEUR SETUP
// ============================================================

function updateBestSetup(currentTrades) {

    if (currentTrades.length === 0) {

        bestSetupElement.textContent = "-";

        bestSetupDetailsElement.textContent =
            "Aucun trade";

        return;
    }

    const setupStats = {};

    currentTrades.forEach(trade => {

        const setup = trade.setup || "Sans setup";

        if (!setupStats[setup]) {

            setupStats[setup] = {
                trades: 0,
                winners: 0,
                profit: 0
            };
        }

        setupStats[setup].trades++;

        if (trade.result === "TP") {
            setupStats[setup].winners++;
        }

        setupStats[setup].profit +=
            Number(trade.profit) || 0;
    });

    const ranked = Object.entries(setupStats)
        .map(([setup, data]) => {

            return {
                setup,
                trades: data.trades,
                winners: data.winners,
                profit: data.profit,
                winrate:
                    (data.winners / data.trades) * 100
            };
        })
        .sort((a, b) => {

            if (b.winrate !== a.winrate) {
                return b.winrate - a.winrate;
            }

            return b.trades - a.trades;
        });

    const best = ranked[0];

    bestSetupElement.textContent =
        best.setup;

    bestSetupDetailsElement.textContent =
        best.winrate.toFixed(1) +
        "% • " +
        best.trades +
        " trade(s) • " +
        formatMoney(best.profit);
}


// ============================================================
// TABLEAU DES SETUPS
// ============================================================

function renderSetupTable() {

    const currentTrades = getFilteredTrades();

    setupList.innerHTML = "";

    if (currentTrades.length === 0) {
        return;
    }

    const setupStats = {};

    currentTrades.forEach(trade => {

        const setup = trade.setup || "Sans setup";

        if (!setupStats[setup]) {

            setupStats[setup] = {
                trades: 0,
                winners: 0,
                profit: 0
            };
        }

        setupStats[setup].trades++;

        if (trade.result === "TP") {
            setupStats[setup].winners++;
        }

        setupStats[setup].profit +=
            Number(trade.profit) || 0;
    });

    const sorted = Object.entries(setupStats)
        .map(([setup, data]) => {

            return {
                setup,
                ...data,
                winrate:
                    (data.winners / data.trades) * 100
            };
        })
        .sort((a, b) => {

            if (b.winrate !== a.winrate) {
                return b.winrate - a.winrate;
            }

            return b.trades - a.trades;
        });

    sorted.forEach(item => {

        const row = document.createElement("tr");

        const profitClass =
            item.profit > 0
                ? "profit"
                : item.profit < 0
                    ? "loss"
                    : "be";

        row.innerHTML = `
            <td>${escapeHTML(item.setup)}</td>
            <td>${item.trades}</td>
            <td>${item.winners}</td>
            <td>${item.winrate.toFixed(1)}%</td>
            <td class="${profitClass}">
                ${item.profit >= 0 ? "+" : ""}
                ${item.profit.toFixed(2)} $
            </td>
        `;

        setupList.appendChild(row);
    });
}


// ============================================================
// HISTORIQUE
// ============================================================

function renderHistory() {

    const currentTrades = getFilteredTrades();

    tradeList.innerHTML = "";

    if (currentTrades.length === 0) {

        emptyMessage.style.display = "block";

        return;
    }

    emptyMessage.style.display = "none";

    currentTrades.forEach(trade => {

        const row = document.createElement("tr");

        const profit =
            Number(trade.profit) || 0;

        const profitClass =
            profit > 0
                ? "profit"
                : profit < 0
                    ? "loss"
                    : "be";

        const resultClass =
            trade.result === "TP"
                ? "profit"
                : trade.result === "SL"
                    ? "loss"
                    : "be";

        row.innerHTML = `
            <td>${escapeHTML(trade.date)}</td>

            <td>${escapeHTML(trade.asset)}</td>

            <td>
                ${trade.direction === "BUY"
                    ? "Buy"
                    : "Sell"}
            </td>

            <td>${Number(trade.entry).toFixed(2)}</td>

            <td>${Number(trade.sl).toFixed(2)}</td>

            <td>${Number(trade.tp).toFixed(2)}</td>

            <td>
                ${formatRR(trade.rr)}
            </td>

            <td>
                ${escapeHTML(trade.setup)}
            </td>

            <td class="${resultClass}">
                ${escapeHTML(trade.result)}
            </td>

            <td class="${profitClass}">
                ${profit >= 0 ? "+" : ""}
                ${profit.toFixed(2)} $
            </td>

            <td>
                <button
                    class="delete-btn"
                    onclick="deleteTrade('${trade.id}')">
                    🗑️
                </button>
            </td>
        `;

        tradeList.appendChild(row);
    });
}


// ============================================================
// AJOUT TRADE
// ============================================================

tradeForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const rr = calculateRR();

    const trade = {

        id: Date.now().toString(),

        capitalId: activeCapital.id,

        asset: assetInput.value.trim(),

        date: dateInput.value,

        direction: directionInput.value,

        orderType: orderTypeInput.value,

        entry: Number(entryInput.value),

        sl: Number(slInput.value),

        tp: Number(tpInput.value),

        rr: rr,

        result: resultInput.value,

        setup: setupInput.value,

        profit: Number(profitInput.value),

        comment: commentInput.value.trim(),

        createdAt: new Date().toISOString()
    };

    trades.push(trade);

    saveTrades();

    tradeForm.reset();

    calculatedRRInput.value = "0.00";

    dateInput.value =
        new Date().toISOString().split("T")[0];

    refreshDashboard();
});


// ============================================================
// SUPPRIMER UN TRADE
// ============================================================

function deleteTrade(id) {

    const confirmed = confirm(
        "Supprimer ce trade ?"
    );

    if (!confirmed) {
        return;
    }

    trades = trades.filter(
        trade => trade.id !== id
    );

    saveTrades();

    refreshDashboard();
}


// ============================================================
// SUPPRIMER TOUS LES TRADES DU CAPITAL ACTIF
// ============================================================

clearBtn.addEventListener("click", function() {

    const currentTrades = getCurrentCapitalTrades();

    if (currentTrades.length === 0) {

        alert(
            "Il n'y a aucun trade dans le capital actif."
        );

        return;
    }

    const confirmed = confirm(
        "Supprimer tous les trades du capital actif ?\n\n" +
        "Les archives ne seront pas supprimées."
    );

    if (!confirmed) {
        return;
    }

    trades = trades.filter(
        trade => trade.capitalId !== activeCapital.id
    );

    saveTrades();

    refreshDashboard();
});


// ============================================================
// CAPITAL ACTIF
// ============================================================

function updateCapitalInputs() {

    capitalNameInput.value =
        activeCapital.name;

    initialCapitalInput.value =
        activeCapital.initialCapital;
}


saveCapitalBtn.addEventListener("click", function() {

    const name =
        capitalNameInput.value.trim();

    const initial =
        Number(initialCapitalInput.value);

    if (!name) {

        alert(
            "Veuillez donner un nom au capital."
        );

        return;
    }

    if (!Number.isFinite(initial) || initial < 0) {

        alert(
            "Veuillez entrer un capital initial valide."
        );

        return;
    }

    activeCapital.name = name;

    activeCapital.initialCapital = initial;

    saveActiveCapital();

    refreshDashboard();

    alert(
        "Capital enregistré avec succès."
    );
});


// ============================================================
// NOUVEAU CAPITAL
// ============================================================

function openCapitalModal() {

    newCapitalNameInput.value =
        "Capital " + (archives.length + 2);

    newInitialCapitalInput.value = "";

    capitalModal.classList.remove("hidden");

    newCapitalNameInput.focus();
}


function closeCapitalModal() {

    capitalModal.classList.add("hidden");
}


newCapitalBtn.addEventListener(
    "click",
    openCapitalModal
);


cancelCapitalBtn.addEventListener(
    "click",
    closeCapitalModal
);


if (cancelCapitalBtn2) {

    cancelCapitalBtn2.addEventListener(
        "click",
        closeCapitalModal
    );
}


// ============================================================
// ARCHIVAGE DU CAPITAL ACTUEL
// ============================================================

function archiveCurrentCapital() {

    const currentTrades =
        getCurrentCapitalTrades();

    const totalProfit =
        currentTrades.reduce(
            (sum, trade) =>
                sum + (Number(trade.profit) || 0),
            0
        );

    const finalBalance =
        Number(activeCapital.initialCapital || 0) +
        totalProfit;

    const winners =
        currentTrades.filter(
            trade => trade.result === "TP"
        ).length;

    const winrate =
        currentTrades.length > 0
            ? (winners / currentTrades.length) * 100
            : 0;

    const archive = {

        id: Date.now().toString(),

        name: activeCapital.name,

        initialCapital:
            Number(activeCapital.initialCapital) || 0,

        finalBalance,

        totalProfit,

        totalTrades:
            currentTrades.length,

        winrate,

        createdAt:
            activeCapital.createdAt,

        archivedAt:
            new Date().toISOString(),

        trades:
            JSON.parse(
                JSON.stringify(currentTrades)
            )
    };

    archives.unshift(archive);

    saveArchives();

    return archive;
}


// ============================================================
// CRÉER LE NOUVEAU CAPITAL
// ============================================================

confirmCapitalBtn.addEventListener(
    "click",
    function() {

        const name =
            newCapitalNameInput.value.trim();

        const initial =
            Number(newInitialCapitalInput.value);

        if (!name) {

            alert(
                "Veuillez donner un nom au nouveau capital."
            );

            return;
        }

        if (!Number.isFinite(initial) || initial < 0) {

            alert(
                "Veuillez entrer un capital initial valide."
            );

            return;
        }

        // Archiver l'ancien capital
        archiveCurrentCapital();

        // Créer le nouveau
        activeCapital = {

            id: Date.now().toString(),

            name,

            initialCapital: initial,

            createdAt:
                new Date().toISOString()
        };

        saveActiveCapital();

        closeCapitalModal();

        refreshDashboard();
    }
);


// ============================================================
// ARCHIVER MANUELLEMENT
// ============================================================

archiveCapitalBtn.addEventListener(
    "click",
    function() {

        const currentTrades =
            getCurrentCapitalTrades();

        const confirmed = confirm(
            "Archiver le capital actuel ?\n\n" +
            "Son historique et ses statistiques seront conservés."
        );

        if (!confirmed) {
            return;
        }

        archiveCurrentCapital();

        activeCapital = {

            id: Date.now().toString(),

            name:
                "Capital " +
                (archives.length + 1),

            initialCapital: 0,

            createdAt:
                new Date().toISOString()
        };

        saveActiveCapital();

        refreshDashboard();

        alert(
            "Capital archivé avec succès."
        );
    }
);


// ============================================================
// ARCHIVES
// ============================================================

function renderArchives() {

    archivesList.innerHTML = "";

    if (archives.length === 0) {

        emptyArchives.style.display = "block";

        return;
    }

    emptyArchives.style.display = "none";

    archives.forEach(archive => {

        const card =
            document.createElement("div");

        card.className =
            "archive-card";

        const profitClass =
            archive.totalProfit > 0
                ? "profit"
                : archive.totalProfit < 0
                    ? "loss"
                    : "be";

        card.innerHTML = `

            <div class="archive-card-header">

                <div>

                    <h3>
                        📦 ${escapeHTML(archive.name)}
                    </h3>

                    <div class="archive-date">

                        Créé le :
                        ${formatDateTime(archive.createdAt)}

                        <br>

                        Archivé le :
                        ${formatDateTime(archive.archivedAt)}

                    </div>

                </div>

            </div>


            <div class="archive-stats">

                <div class="archive-stat">

                    <span>
                        Capital initial
                    </span>

                    <strong>
                        ${formatMoney(archive.initialCapital)}
                    </strong>

                </div>


                <div class="archive-stat">

                    <span>
                        Solde final
                    </span>

                    <strong>
                        ${formatMoney(archive.finalBalance)}
                    </strong>

                </div>


                <div class="archive-stat">

                    <span>
                        Profit
                    </span>

                    <strong class="${profitClass}">

                        ${archive.totalProfit >= 0 ? "+" : ""}
                        ${Number(archive.totalProfit).toFixed(2)} $

                    </strong>

                </div>


                <div class="archive-stat">

                    <span>
                        Trades
                    </span>

                    <strong>
                        ${archive.totalTrades}
                    </strong>

                </div>


                <div class="archive-stat">

                    <span>
                        Winrate
                    </span>

                    <strong>
                        ${Number(archive.winrate).toFixed(1)}%
                    </strong>

                </div>

            </div>


            <div class="archive-actions">

                <button
                    class="archive-view-btn"
                    onclick="viewArchive('${archive.id}')">

                    📈 Voir le graphique

                </button>


                <button
                    class="archive-delete-btn"
                    onclick="deleteArchive('${archive.id}')">

                    🗑️ Supprimer l'archive

                </button>

            </div>
        `;

        archivesList.appendChild(card);
    });
}


function formatDateTime(dateString) {

    if (!dateString) {
        return "-";
    }

    const date =
        new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString(
        "fr-FR",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );
}


// ============================================================
// VOIR UNE ARCHIVE
// ============================================================

function viewArchive(id) {

    const archive =
        archives.find(
            item => item.id === id
        );

    if (!archive) {
        return;
    }

    archiveChartTitle.textContent =
        "📈 " + archive.name;

    archiveChartSubtitle.textContent =
        "Évolution du capital pendant cette période archivée";

    archiveChartInitial.textContent =
        formatMoney(archive.initialCapital);

    archiveChartFinal.textContent =
        formatMoney(archive.finalBalance);

    archiveChartProfit.textContent =
        formatMoney(archive.totalProfit);

    archiveChartModal.classList.remove("hidden");

    // Le canvas doit être visible avant le dessin
    setTimeout(function() {

        drawCapitalChart(
            archiveChartCanvas,
            archive.initialCapital,
            archive.trades,
            false
        );

    }, 50);
}


// ============================================================
// FERMER GRAPHIQUE ARCHIVE
// ============================================================

function closeArchiveChart() {

    archiveChartModal.classList.add("hidden");
}


closeArchiveChartBtn.addEventListener(
    "click",
    closeArchiveChart
);


// Fermer en cliquant sur le fond
archiveChartModal.addEventListener(
    "click",
    function(event) {

        if (event.target === archiveChartModal) {

            closeArchiveChart();
        }
    }
);


// ============================================================
// GRAPHIQUE CAPITAL ACTIF
// ============================================================

function getCapitalEvolution(
    initialCapital,
    capitalTrades
) {

    const sortedTrades =
        [...capitalTrades].sort(
            (a, b) => {

                const dateA =
                    new Date(
                        a.createdAt ||
                        (a.date + "T00:00:00")
                    );

                const dateB =
                    new Date(
                        b.createdAt ||
                        (b.date + "T00:00:00")
                    );

                return dateA - dateB;
            }
        );

    const points = [

        {
            label: "Départ",
            balance:
                Number(initialCapital) || 0
        }

    ];

    let balance =
        Number(initialCapital) || 0;

    sortedTrades.forEach(
        (trade, index) => {

            balance +=
                Number(trade.profit) || 0;

            points.push({

                label:
                    "Trade " + (index + 1),

                balance
            });
        }
    );

    return points;
}


// ============================================================
// DESSIN DU GRAPHIQUE CANVAS
// ============================================================

function drawCapitalChart(
    canvas,
    initialCapital,
    capitalTrades,
    showEmptyMessage = true
) {

    if (!canvas) {
        return;
    }

    const container =
        canvas.parentElement;

    const rect =
        container.getBoundingClientRect();

    const width =
        Math.max(rect.width - 20, 300);

    const height =
        Math.max(rect.height - 20, 220);

    const dpr =
        window.devicePixelRatio || 1;

    canvas.width =
        width * dpr;

    canvas.height =
        height * dpr;

    canvas.style.width =
        width + "px";

    canvas.style.height =
        height + "px";

    const ctx =
        canvas.getContext("2d");

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    const computedStyle =
        getComputedStyle(document.body);

    const textColor =
        computedStyle.getPropertyValue(
            "--text"
        ).trim() || "#e8eef7";

    const mutedColor =
        computedStyle.getPropertyValue(
            "--muted"
        ).trim() || "#8c99aa";

    const borderColor =
        computedStyle.getPropertyValue(
            "--border"
        ).trim() || "#263244";

    const blueColor =
        computedStyle.getPropertyValue(
            "--blue"
        ).trim() || "#3b82f6";

    const greenColor =
        computedStyle.getPropertyValue(
            "--green"
        ).trim() || "#22c55e";

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const points =
        getCapitalEvolution(
            initialCapital,
            capitalTrades
        );


    // ========================================================
    // GRAPHIQUE VIDE
    // ========================================================

    if (
        capitalTrades.length === 0 &&
        showEmptyMessage
    ) {

        canvas.style.display = "none";

        return;
    }

    canvas.style.display = "block";


    // ========================================================
    // DIMENSIONS
    // ========================================================

    const padding = {

        top: 30,

        right: 25,

        bottom: 50,

        left: 70
    };

    const chartWidth =
        width -
        padding.left -
        padding.right;

    const chartHeight =
        height -
        padding.top -
        padding.bottom;


    // ========================================================
    // MIN / MAX
    // ========================================================

    const balances =
        points.map(
            point => point.balance
        );

    let minBalance =
        Math.min(...balances);

    let maxBalance =
        Math.max(...balances);

    if (minBalance === maxBalance) {

        const extra =
            Math.max(
                Math.abs(minBalance) * 0.1,
                10
            );

        minBalance -= extra;
        maxBalance += extra;

    } else {

        const range =
            maxBalance - minBalance;

        minBalance -= range * 0.12;
        maxBalance += range * 0.12;
    }


    // ========================================================
    // FONCTION COORDONNÉE
    // ========================================================

    function getX(index) {

        if (points.length === 1) {

            return padding.left +
                chartWidth / 2;
        }

        return padding.left +
            (
                index /
                (points.length - 1)
            ) *
            chartWidth;
    }


    function getY(balance) {

        return padding.top +
            (
                1 -
                (
                    (balance - minBalance) /
                    (maxBalance - minBalance)
                )
            ) *
            chartHeight;
    }


    // ========================================================
    // GRILLE
    // ========================================================

    ctx.lineWidth = 1;

    ctx.strokeStyle =
        borderColor;

    ctx.fillStyle =
        mutedColor;

    ctx.font =
        "12px Arial";

    const gridLines = 5;

    for (
        let i = 0;
        i <= gridLines;
        i++
    ) {

        const y =
            padding.top +
            (
                i / gridLines
            ) *
            chartHeight;

        ctx.beginPath();

        ctx.moveTo(
            padding.left,
            y
        );

        ctx.lineTo(
            padding.left + chartWidth,
            y
        );

        ctx.stroke();


        const value =
            maxBalance -
            (
                i / gridLines
            ) *
            (
                maxBalance -
                minBalance
            );

        ctx.textAlign =
            "right";

        ctx.fillText(
            value.toFixed(2) + " $",
            padding.left - 10,
            y + 4
        );
    }


    // ========================================================
    // LIGNE ZÉRO SI VISIBLE
    // ========================================================

    if (
        minBalance <= 0 &&
        maxBalance >= 0
    ) {

        const zeroY =
            getY(0);

        ctx.save();

        ctx.setLineDash([
            5,
            5
        ]);

        ctx.strokeStyle =
            mutedColor;

        ctx.beginPath();

        ctx.moveTo(
            padding.left,
            zeroY
        );

        ctx.lineTo(
            padding.left + chartWidth,
            zeroY
        );

        ctx.stroke();

        ctx.restore();
    }


    // ========================================================
    // ZONE SOUS LA COURBE
    // ========================================================

    if (points.length > 1) {

        const firstX =
            getX(0);

        const lastX =
            getX(points.length - 1);

        ctx.beginPath();

        ctx.moveTo(
            firstX,
            getY(points[0].balance)
        );

        for (
            let i = 1;
            i < points.length;
            i++
        ) {

            ctx.lineTo(
                getX(i),
                getY(points[i].balance)
            );
        }

        ctx.lineTo(
            lastX,
            padding.top + chartHeight
        );

        ctx.lineTo(
            firstX,
            padding.top + chartHeight
        );

        ctx.closePath();

        const gradient =
            ctx.createLinearGradient(
                0,
                padding.top,
                0,
                padding.top + chartHeight
            );

        gradient.addColorStop(
            0,
            "rgba(59,130,246,0.25)"
        );

        gradient.addColorStop(
            1,
            "rgba(59,130,246,0.01)"
        );

        ctx.fillStyle =
            gradient;

        ctx.fill();
    }


    // ========================================================
    // COURBE
    // ========================================================

    ctx.beginPath();

    points.forEach(
        (point, index) => {

            const x =
                getX(index);

            const y =
                getY(point.balance);

            if (index === 0) {

                ctx.moveTo(x, y);

            } else {

                ctx.lineTo(x, y);
            }
        }
    );

    const finalBalance =
        points[points.length - 1].balance;

    const startBalance =
        points[0].balance;

    ctx.strokeStyle =
        finalBalance >= startBalance
            ? greenColor
            : "#ef4444";

    ctx.lineWidth = 3;

    ctx.lineJoin =
        "round";

    ctx.lineCap =
        "round";

    ctx.stroke();


    // ========================================================
    // POINTS
    // ========================================================

    points.forEach(
        (point, index) => {

            const x =
                getX(index);

            const y =
                getY(point.balance);

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                index === points.length - 1
                    ? 5
                    : 3.5,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                blueColor;

            ctx.fill();

            ctx.strokeStyle =
                textColor;

            ctx.lineWidth = 1.5;

            ctx.stroke();
        }
    );


    // ========================================================
    // LABELS X
    // ========================================================

    ctx.fillStyle =
        mutedColor;

    ctx.font =
        "11px Arial";

    ctx.textAlign =
        "center";

    if (points.length <= 12) {

        points.forEach(
            (point, index) => {

                ctx.fillText(
                    point.label,
                    getX(index),
                    height - 18
                );
            }
        );

    } else {

        const step =
            Math.ceil(
                points.length / 8
            );

        points.forEach(
            (point, index) => {

                if (
                    index % step === 0 ||
                    index === points.length - 1
                ) {

                    ctx.fillText(
                        point.label,
                        getX(index),
                        height - 18
                    );
                }
            }
        );
    }


    // ========================================================
    // VALEUR FINALE
    // ========================================================

    const finalX =
        getX(points.length - 1);

    const finalY =
        getY(finalBalance);

    ctx.fillStyle =
        textColor;

    ctx.font =
        "bold 13px Arial";

    ctx.textAlign =
        "right";

    ctx.fillText(
        finalBalance.toFixed(2) + " $",
        Math.min(
            finalX + 45,
            width - 10
        ),
        Math.max(
            finalY - 12,
            18
        )
    );
}


// ============================================================
// GRAPHIQUE ACTIF
// ============================================================

function updateActiveCapitalChart() {

    const currentTrades =
        getCurrentCapitalTrades();

    if (
        currentTrades.length === 0
    ) {

        capitalChartCanvas.style.display =
            "none";

        emptyChartMessage.style.display =
            "block";

        return;
    }

    capitalChartCanvas.style.display =
        "block";

    emptyChartMessage.style.display =
        "none";

    drawCapitalChart(
        capitalChartCanvas,
        activeCapital.initialCapital,
        currentTrades,
        true
    );
}


// ============================================================
// REDIMENSIONNEMENT GRAPHIQUES
// ============================================================

window.addEventListener(
    "resize",
    function() {

        updateActiveCapitalChart();

        if (
            !archiveChartModal.classList.contains(
                "hidden"
            )
        ) {

            const archiveTitle =
                archiveChartTitle.textContent
                    .replace("📈 ", "");

            const archive =
                archives.find(
                    item =>
                        item.name === archiveTitle
                );

            if (archive) {

                drawCapitalChart(
                    archiveChartCanvas,
                    archive.initialCapital,
                    archive.trades,
                    false
                );
            }
        }
    }
);


// ============================================================
// PÉRIODES
// ============================================================

periodButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            function() {

                periodButtons.forEach(
                    btn =>
                        btn.classList.remove(
                            "active"
                        )
                );

                this.classList.add("active");

                currentPeriod =
                    this.dataset.period;

                refreshDashboard();
            }
        );
    }
);


// ============================================================
// THÈME
// ============================================================

function applyTheme() {

    const savedTheme =
        localStorage.getItem(
            THEME_KEY
        );

    if (savedTheme === "light") {

        document.body.classList.add(
            "light"
        );

        themeBtn.textContent =
            "☀️";

    } else {

        document.body.classList.remove(
            "light"
        );

        themeBtn.textContent =
            "🌙";
    }
}


themeBtn.addEventListener(
    "click",
    function() {

        const isLight =
            document.body.classList.toggle(
                "light"
            );

        localStorage.setItem(
            THEME_KEY,
            isLight
                ? "light"
                : "dark"
        );

        themeBtn.textContent =
            isLight
                ? "☀️"
                : "🌙";

        updateActiveCapitalChart();

        if (
            !archiveChartModal.classList.contains(
                "hidden"
            )
        ) {

            const archiveTitle =
                archiveChartTitle.textContent
                    .replace("📈 ", "");

            const archive =
                archives.find(
                    item =>
                        item.name === archiveTitle
                );

            if (archive) {

                drawCapitalChart(
                    archiveChartCanvas,
                    archive.initialCapital,
                    archive.trades,
                    false
                );
            }
        }
    }
);


// ============================================================
// FERMER MODALE AVEC ESC
// ============================================================

document.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Escape") {

            closeCapitalModal();

            if (
                !archiveChartModal.classList.contains(
                    "hidden"
                )
            ) {

                closeArchiveChart();
            }
        }
    }
);


// ============================================================
// SUPPRIMER UNE ARCHIVE
// ============================================================

function deleteArchive(id) {

    const archive =
        archives.find(
            item => item.id === id
        );

    if (!archive) {
        return;
    }

    const confirmed = confirm(
        "Supprimer définitivement l'archive \"" +
        archive.name +
        "\" ?\n\n" +
        "Tous ses trades et ses statistiques seront supprimés."
    );

    if (!confirmed) {
        return;
    }

    archives =
        archives.filter(
            item => item.id !== id
        );

    saveArchives();

    renderArchives();
}


// ============================================================
// ACTUALISATION GÉNÉRALE
// ============================================================

function refreshDashboard() {

    updateCapitalInputs();

    updateStats();

    renderSetupTable();

    renderHistory();

    renderArchives();

    updateActiveCapitalChart();
}


// ============================================================
// DATE PAR DÉFAUT
// ============================================================

if (!dateInput.value) {

    dateInput.value =
        new Date()
            .toISOString()
            .split("T")[0];
}


// ============================================================
// INITIALISATION
// ============================================================

applyTheme();

refreshDashboard();

calculateRR();
```
