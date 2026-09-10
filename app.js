// ============================================================
// TRADING DASHBOARD
// Trades + Capitaux + Archives + Graphiques
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
// CAPITAL PAR DÉFAUT
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
// COMPATIBILITÉ ANCIENS TRADES
// ============================================================

trades.forEach(function (trade) {
    if (!trade.capitalId) {
        trade.capitalId = activeCapital.id;
    }
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
// SAUVEGARDE
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


// ============================================================
// FORMATAGE
// ============================================================

function formatMoney(value) {
    return Number(value || 0).toFixed(2) + " $";
}


function formatRR(value) {
    return "1:" + Number(value || 0).toFixed(2);
}


function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : value;
    return div.innerHTML;
}


function formatDateTime(dateString) {

    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("fr-FR");
}


// ============================================================
// RR AUTOMATIQUE
// ============================================================

function calculateRR() {

    const entry = Number(entryInput.value);
    const sl = Number(slInput.value);
    const tp = Number(tpInput.value);

    if (
        !isFinite(entry) ||
        !isFinite(sl) ||
        !isFinite(tp)
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

    calculatedRRInput.value =
        "1:" + rr.toFixed(2);

    return rr;
}


entryInput.addEventListener("input", calculateRR);
slInput.addEventListener("input", calculateRR);
tpInput.addEventListener("input", calculateRR);
directionInput.addEventListener("change", calculateRR);


// ============================================================
// TRADES DU CAPITAL ACTIF
// ============================================================

function getCurrentCapitalTrades() {

    return trades.filter(function (trade) {

        return trade.capitalId === activeCapital.id;
    });
}


// ============================================================
// DÉBUT DES PÉRIODES
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


// ============================================================
// FILTRE
// ============================================================

function getFilteredTrades() {

    const currentTrades =
        getCurrentCapitalTrades();

    if (currentPeriod === "all") {
        return currentTrades;
    }

    const start =
        getPeriodStart(currentPeriod);

    return currentTrades.filter(function (trade) {

        const tradeDate =
            new Date(trade.date + "T00:00:00");

        return tradeDate >= start;
    });
}


// ============================================================
// STATISTIQUES
// ============================================================

function updateStats() {

    const allTrades =
        getCurrentCapitalTrades();

    const filteredTrades =
        getFilteredTrades();

    let totalProfit = 0;

    filteredTrades.forEach(function (trade) {

        totalProfit +=
            Number(trade.profit) || 0;
    });


    const winners =
        filteredTrades.filter(function (trade) {

            return trade.result === "TP";

        }).length;


    const winrate =
        filteredTrades.length > 0
            ? (winners / filteredTrades.length) * 100
            : 0;


    let rrTotal = 0;
    let rrCount = 0;

    filteredTrades.forEach(function (trade) {

        const rr = Number(trade.rr);

        if (isFinite(rr) && rr > 0) {

            rrTotal += rr;
            rrCount++;
        }
    });


    const averageRR =
        rrCount > 0
            ? rrTotal / rrCount
            : 0;


    const currentBalance =
        Number(activeCapital.initialCapital || 0) +
        allTrades.reduce(function (total, trade) {

            return total +
                (Number(trade.profit) || 0);

        }, 0);


    balanceElement.textContent =
        formatMoney(currentBalance);

    totalProfitElement.textContent =
        formatMoney(totalProfit);

    winrateElement.textContent =
        winrate.toFixed(1) + "%";

    averageRRElement.textContent =
        averageRR.toFixed(2);

    totalTradesElement.textContent =
        filteredTrades.length;


    activeCapitalName.textContent =
        activeCapital.name;

    activeCapitalPeriod.textContent =
        "Capital initial : " +
        formatMoney(activeCapital.initialCapital) +
        " • Solde actuel : " +
        formatMoney(currentBalance) +
        " • " +
        allTrades.length +
        " trade(s)";


    updateBestSetup(filteredTrades);
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


    const stats = {};


    currentTrades.forEach(function (trade) {

        const setup =
            trade.setup || "Sans setup";


        if (!stats[setup]) {

            stats[setup] = {
                trades: 0,
                winners: 0,
                profit: 0
            };
        }


        stats[setup].trades++;


        if (trade.result === "TP") {
            stats[setup].winners++;
        }


        stats[setup].profit +=
            Number(trade.profit) || 0;
    });


    const ranking =
        Object.keys(stats).map(function (setup) {

            const data = stats[setup];

            return {

                setup: setup,

                trades: data.trades,

                winners: data.winners,

                profit: data.profit,

                winrate:
                    (data.winners / data.trades) * 100
            };

        });


    ranking.sort(function (a, b) {

        if (b.winrate !== a.winrate) {
            return b.winrate - a.winrate;
        }

        return b.trades - a.trades;
    });


    const best = ranking[0];


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

    const currentTrades =
        getFilteredTrades();

    setupList.innerHTML = "";


    if (currentTrades.length === 0) {
        return;
    }


    const stats = {};


    currentTrades.forEach(function (trade) {

        const setup =
            trade.setup || "Sans setup";


        if (!stats[setup]) {

            stats[setup] = {
                trades: 0,
                winners: 0,
                profit: 0
            };
        }


        stats[setup].trades++;


        if (trade.result === "TP") {
            stats[setup].winners++;
        }


        stats[setup].profit +=
            Number(trade.profit) || 0;
    });


    const ranking =
        Object.keys(stats).map(function (setup) {

            const data = stats[setup];

            return {

                setup: setup,

                trades: data.trades,

                winners: data.winners,

                profit: data.profit,

                winrate:
                    (data.winners / data.trades) * 100
            };

        });


    ranking.sort(function (a, b) {

        if (b.winrate !== a.winrate) {
            return b.winrate - a.winrate;
        }

        return b.trades - a.trades;
    });


    ranking.forEach(function (item) {

        const row =
            document.createElement("tr");


        let profitClass = "be";

        if (item.profit > 0) {
            profitClass = "profit";
        }

        if (item.profit < 0) {
            profitClass = "loss";
        }


        row.innerHTML =
            "<td>" +
            escapeHTML(item.setup) +
            "</td>" +

            "<td>" +
            item.trades +
            "</td>" +

            "<td>" +
            item.winners +
            "</td>" +

            "<td>" +
            item.winrate.toFixed(1) +
            "%</td>" +

            '<td class="' +
            profitClass +
            '">' +

            (item.profit >= 0 ? "+" : "") +

            item.profit.toFixed(2) +
            " $" +

            "</td>";


        setupList.appendChild(row);
    });
}


// ============================================================
// HISTORIQUE
// ============================================================

function renderHistory() {

    const currentTrades =
        getFilteredTrades();

    tradeList.innerHTML = "";


    if (currentTrades.length === 0) {

        emptyMessage.style.display =
            "block";

        return;
    }


    emptyMessage.style.display =
        "none";


    currentTrades.forEach(function (trade) {

        const row =
            document.createElement("tr");


        const profit =
            Number(trade.profit) || 0;


        let profitClass = "be";

        if (profit > 0) {
            profitClass = "profit";
        }

        if (profit < 0) {
            profitClass = "loss";
        }


        let resultClass = "be";

        if (trade.result === "TP") {
            resultClass = "profit";
        }

        if (trade.result === "SL") {
            resultClass = "loss";
        }


        row.innerHTML =
            "<td>" +
            escapeHTML(trade.date) +
            "</td>" +

            "<td>" +
            escapeHTML(trade.asset) +
            "</td>" +

            "<td>" +
            (trade.direction === "BUY"
                ? "Buy"
                : "Sell") +
            "</td>" +

            "<td>" +
            Number(trade.entry).toFixed(2) +
            "</td>" +

            "<td>" +
            Number(trade.sl).toFixed(2) +
            "</td>" +

            "<td>" +
            Number(trade.tp).toFixed(2) +
            "</td>" +

            "<td>" +
            formatRR(trade.rr) +
            "</td>" +

            "<td>" +
            escapeHTML(trade.setup) +
            "</td>" +

            '<td class="' +
            resultClass +
            '">' +
            escapeHTML(trade.result) +
            "</td>" +

            '<td class="' +
            profitClass +
            '">' +

            (profit >= 0 ? "+" : "") +
            profit.toFixed(2) +
            " $" +

            "</td>" +

            "<td>" +

            '<button class="delete-btn" ' +
            'onclick="deleteTrade(\'' +
            trade.id +
            '\')">' +

            "🗑️" +

            "</button>" +

            "</td>";


        tradeList.appendChild(row);
    });
}


// ============================================================
// AJOUTER UN TRADE
// ============================================================

tradeForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const rr =
            calculateRR();


        const trade = {

            id:
                Date.now().toString(),

            capitalId:
                activeCapital.id,

            asset:
                assetInput.value.trim(),

            date:
                dateInput.value,

            direction:
                directionInput.value,

            orderType:
                orderTypeInput.value,

            entry:
                Number(entryInput.value),

            sl:
                Number(slInput.value),

            tp:
                Number(tpInput.value),

            rr:
                rr,

            result:
                resultInput.value,

            setup:
                setupInput.value,

            profit:
                Number(profitInput.value),

            comment:
                commentInput.value.trim(),

            createdAt:
                new Date().toISOString()
        };


        trades.push(trade);

        saveTrades();


        tradeForm.reset();

        calculatedRRInput.value =
            "0.00";


        dateInput.value =
            new Date()
                .toISOString()
                .split("T")[0];


        refreshDashboard();
    }
);


// ============================================================
// SUPPRIMER UN TRADE
// ============================================================

function deleteTrade(id) {

    if (!confirm("Supprimer ce trade ?")) {
        return;
    }


    trades =
        trades.filter(function (trade) {

            return trade.id !== id;
        });


    saveTrades();

    refreshDashboard();
}


// ============================================================
// SUPPRIMER LES TRADES DU CAPITAL ACTIF
// ============================================================

clearBtn.addEventListener(
    "click",
    function () {

        const currentTrades =
            getCurrentCapitalTrades();


        if (currentTrades.length === 0) {

            alert(
                "Il n'y a aucun trade dans le capital actif."
            );

            return;
        }


        if (
            !confirm(
                "Supprimer tous les trades du capital actif ?\n\n" +
                "Les archives ne seront pas supprimées."
            )
        ) {
            return;
        }


        trades =
            trades.filter(function (trade) {

                return trade.capitalId !==
                    activeCapital.id;
            });


        saveTrades();

        refreshDashboard();
    }
);


// ============================================================
// CAPITAL ACTIF
// ============================================================

function updateCapitalInputs() {

    capitalNameInput.value =
        activeCapital.name;

    initialCapitalInput.value =
        activeCapital.initialCapital;
}


saveCapitalBtn.addEventListener(
    "click",
    function () {

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


        if (
            !isFinite(initial) ||
            initial < 0
        ) {

            alert(
                "Veuillez entrer un capital initial valide."
            );

            return;
        }


        activeCapital.name =
            name;

        activeCapital.initialCapital =
            initial;


        saveActiveCapital();

        refreshDashboard();


        alert(
            "Capital enregistré avec succès."
        );
    }
);


// ============================================================
// MODALE NOUVEAU CAPITAL
// ============================================================

function openCapitalModal() {

    newCapitalNameInput.value =
        "Capital " +
        (archives.length + 2);

    newInitialCapitalInput.value =
        "";

    capitalModal.classList.remove(
        "hidden"
    );

    newCapitalNameInput.focus();
}


function closeCapitalModal() {

    capitalModal.classList.add(
        "hidden"
    );
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
// ARCHIVER LE CAPITAL ACTUEL
// ============================================================

function archiveCurrentCapital() {

    const currentTrades =
        getCurrentCapitalTrades();


    const totalProfit =
        currentTrades.reduce(
            function (total, trade) {

                return total +
                    (Number(trade.profit) || 0);

            },
            0
        );


    const finalBalance =
        Number(activeCapital.initialCapital || 0) +
        totalProfit;


    const winners =
        currentTrades.filter(
            function (trade) {

                return trade.result === "TP";
            }
        ).length;


    const winrate =
        currentTrades.length > 0
            ? (
                winners /
                currentTrades.length
            ) * 100
            : 0;


    const archive = {

        id:
            Date.now().toString(),

        name:
            activeCapital.name,

        initialCapital:
            Number(activeCapital.initialCapital) || 0,

        finalBalance:
            finalBalance,

        totalProfit:
            totalProfit,

        totalTrades:
            currentTrades.length,

        winrate:
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
// CRÉER NOUVEAU CAPITAL
// ============================================================

confirmCapitalBtn.addEventListener(
    "click",
    function () {

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


        if (
            !isFinite(initial) ||
            initial < 0
        ) {

            alert(
                "Veuillez entrer un capital initial valide."
            );

            return;
        }


        archiveCurrentCapital();


        activeCapital = {

            id:
                Date.now().toString(),

            name:
                name,

            initialCapital:
                initial,

            createdAt:
                new Date().toISOString()
        };


        saveActiveCapital();

        closeCapitalModal();

        refreshDashboard();
    }
);


// ============================================================
// ARCHIVAGE MANUEL
// ============================================================

archiveCapitalBtn.addEventListener(
    "click",
    function () {

        const currentTrades =
            getCurrentCapitalTrades();


        if (
            currentTrades.length === 0 &&
            Number(activeCapital.initialCapital || 0) === 0
        ) {

            alert(
                "Ce capital ne contient encore aucune donnée."
            );

            return;
        }


        if (
            !confirm(
                "Archiver le capital actuel ?\n\n" +
                "Son historique et ses statistiques seront conservés."
            )
        ) {
            return;
        }


        archiveCurrentCapital();


        activeCapital = {

            id:
                Date.now().toString(),

            name:
                "Capital " +
                (archives.length + 1),

            initialCapital:
                0,

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
// AFFICHER LES ARCHIVES
// ============================================================

function renderArchives() {

    archivesList.innerHTML = "";


    if (archives.length === 0) {

        emptyArchives.style.display =
            "block";

        return;
    }


    emptyArchives.style.display =
        "none";


    archives.forEach(function (archive) {

        const card =
            document.createElement("div");

        card.className =
            "archive-card";


        let profitClass = "be";

        if (archive.totalProfit > 0) {
            profitClass = "profit";
        }

        if (archive.totalProfit < 0) {
            profitClass = "loss";
        }


        card.innerHTML =

            '<div class="archive-card-header">' +

                "<div>" +

                    "<h3>" +
                    "📦 " +
                    escapeHTML(archive.name) +
                    "</h3>" +

                    '<div class="archive-date">' +

                    "Créé le : " +
                    formatDateTime(archive.createdAt) +

                    "<br>" +

                    "Archivé le : " +
                    formatDateTime(archive.archivedAt) +

                    "</div>" +

                "</div>" +

            "</div>" +


            '<div class="archive-stats">' +

                '<div class="archive-stat">' +

                    "<span>Capital initial</span>" +

                    "<strong>" +
                    formatMoney(archive.initialCapital) +
                    "</strong>" +

                "</div>" +


                '<div class="archive-stat">' +

                    "<span>Solde final</span>" +

                    "<strong>" +
                    formatMoney(archive.finalBalance) +
                    "</strong>" +

                "</div>" +


                '<div class="archive-stat">' +

                    "<span>Profit</span>" +

                    '<strong class="' +
                    profitClass +
                    '">' +

                    (archive.totalProfit >= 0
                        ? "+"
                        : "") +

                    Number(archive.totalProfit).toFixed(2) +
                    " $" +

                    "</strong>" +

                "</div>" +


                '<div class="archive-stat">' +

                    "<span>Trades</span>" +

                    "<strong>" +
                    archive.totalTrades +
                    "</strong>" +

                "</div>" +


                '<div class="archive-stat">' +

                    "<span>Winrate</span>" +

                    "<strong>" +
                    Number(archive.winrate).toFixed(1) +
                    "%" +
                    "</strong>" +

                "</div>" +

            "</div>" +


            '<div class="archive-actions">' +

                '<button ' +
                'class="archive-view-btn" ' +
                'onclick="viewArchive(\'' +
                archive.id +
                '\')">' +

                "📈 Voir le graphique" +

                "</button>" +


                '<button ' +
                'class="archive-delete-btn" ' +
                'onclick="deleteArchive(\'' +
                archive.id +
                '\')">' +

                "🗑️ Supprimer l'archive" +

                "</button>" +

            "</div>";


        archivesList.appendChild(card);
    });
}


// ============================================================
// VOIR GRAPHIQUE ARCHIVE
// ============================================================

let openedArchiveId = null;


function viewArchive(id) {

    const archive =
        archives.find(function (item) {

            return item.id === id;
        });


    if (!archive) {
        return;
    }


    openedArchiveId =
        archive.id;


    archiveChartTitle.textContent =
        "📈 " +
        archive.name;


    archiveChartSubtitle.textContent =
        "Évolution du capital pendant cette période archivée";


    archiveChartInitial.textContent =
        formatMoney(
            archive.initialCapital
        );


    archiveChartFinal.textContent =
        formatMoney(
            archive.finalBalance
        );


    archiveChartProfit.textContent =
        formatMoney(
            archive.totalProfit
        );


    archiveChartModal.classList.remove(
        "hidden"
    );


    setTimeout(function () {

        drawCapitalChart(
            archiveChartCanvas,
            archive.initialCapital,
            archive.trades
        );

    }, 50);
}


// ============================================================
// FERMER GRAPHIQUE
// ============================================================

function closeArchiveChart() {

    archiveChartModal.classList.add(
        "hidden"
    );

    openedArchiveId = null;
}


closeArchiveChartBtn.addEventListener(
    "click",
    closeArchiveChart
);


archiveChartModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            archiveChartModal
        ) {
            closeArchiveChart();
        }
    }
);


// ============================================================
// DONNÉES DU GRAPHIQUE
// ============================================================

function getCapitalEvolution(
    initialCapital,
    capitalTrades
) {

    const sorted =
        capitalTrades.slice().sort(
            function (a, b) {

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


    sorted.forEach(
        function (trade, index) {

            balance +=
                Number(trade.profit) || 0;


            points.push({

                label:
                    "Trade " +
                    (index + 1),

                balance:
                    balance
            });
        }
    );


    return points;
}


// ============================================================
// DESSIN GRAPHIQUE
// ============================================================

function drawCapitalChart(
    canvas,
    initialCapital,
    capitalTrades
) {

    if (!canvas) {
        return;
    }


    const container =
        canvas.parentElement;


    const rect =
        container.getBoundingClientRect();


    const width =
        Math.max(
            rect.width - 20,
            300
        );


    const height =
        Math.max(
            rect.height - 20,
            220
        );


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


    const styles =
        getComputedStyle(document.body);


    const textColor =
        styles.getPropertyValue(
            "--text"
        ).trim();


    const mutedColor =
        styles.getPropertyValue(
            "--muted"
        ).trim();


    const borderColor =
        styles.getPropertyValue(
            "--border"
        ).trim();


    const blueColor =
        styles.getPropertyValue(
            "--blue"
        ).trim();


    const greenColor =
        styles.getPropertyValue(
            "--green"
        ).trim();


    const redColor =
        styles.getPropertyValue(
            "--red"
        ).trim();


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


    if (capitalTrades.length === 0) {

        canvas.style.display =
            "none";

        return;
    }


    canvas.style.display =
        "block";


    const paddingLeft = 70;
    const paddingRight = 25;
    const paddingTop = 30;
    const paddingBottom = 50;


    const chartWidth =
        width -
        paddingLeft -
        paddingRight;


    const chartHeight =
        height -
        paddingTop -
        paddingBottom;


    const balances =
        points.map(function (point) {

            return point.balance;
        });


    let min =
        Math.min.apply(
            null,
            balances
        );


    let max =
        Math.max.apply(
            null,
            balances
        );


    if (min === max) {

        const extra =
            Math.max(
                Math.abs(min) * 0.1,
                10
            );

        min -= extra;
        max += extra;

    } else {

        const range =
            max - min;

        min -= range * 0.12;
        max += range * 0.12;
    }


    function getX(index) {

        if (points.length === 1) {

            return paddingLeft +
                chartWidth / 2;
        }


        return paddingLeft +
            (
                index /
                (points.length - 1)
            ) *
            chartWidth;
    }


    function getY(value) {

        return paddingTop +
            (
                1 -
                (
                    (value - min) /
                    (max - min)
                )
            ) *
            chartHeight;
    }


    // ========================================================
    // GRILLE
    // ========================================================

    ctx.lineWidth = 1;
    ctx.strokeStyle = borderColor;
    ctx.fillStyle = mutedColor;
    ctx.font = "12px Arial";


    for (let i = 0; i <= 5; i++) {

        const y =
            paddingTop +
            (i / 5) *
            chartHeight;


        ctx.beginPath();

        ctx.moveTo(
            paddingLeft,
            y
        );

        ctx.lineTo(
            paddingLeft + chartWidth,
            y
        );

        ctx.stroke();


        const value =
            max -
            (i / 5) *
            (max - min);


        ctx.textAlign = "right";


        ctx.fillText(
            value.toFixed(2) + " $",
            paddingLeft - 10,
            y + 4
        );
    }


    // ========================================================
    // COURBE
    // ========================================================

    ctx.beginPath();


    points.forEach(
        function (point, index) {

            const x =
                getX(index);

            const y =
                getY(point.balance);


            if (index === 0) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );
            }
        }
    );


    const firstBalance =
        points[0].balance;


    const lastBalance =
        points[points.length - 1].balance;


    ctx.strokeStyle =
        lastBalance >= firstBalance
            ? greenColor
            : redColor;


    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.stroke();


    // ========================================================
    // POINTS
    // ========================================================

    points.forEach(
        function (point, index) {

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
    // LABELS
    // ========================================================

    ctx.fillStyle =
        mutedColor;

    ctx.font =
        "11px Arial";

    ctx.textAlign =
        "center";


    if (points.length <= 10) {

        points.forEach(
            function (point, index) {

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
            function (point, index) {

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
    // SOLDE FINAL
    // ========================================================

    const finalX =
        getX(points.length - 1);

    const finalY =
        getY(lastBalance);


    ctx.fillStyle =
        textColor;

    ctx.font =
        "bold 13px Arial";

    ctx.textAlign =
        "right";


    ctx.fillText(
        lastBalance.toFixed(2) + " $",
        width - 10,
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


    if (currentTrades.length === 0) {

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
        currentTrades
    );
}


// ============================================================
// PÉRIODES
// ============================================================

periodButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                periodButtons.forEach(
                    function (btn) {

                        btn.classList.remove(
                            "active"
                        );
                    }
                );


                this.classList.add(
                    "active"
                );


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

    const saved =
        localStorage.getItem(
            THEME_KEY
        );


    if (saved === "light") {

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
    function () {

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

            const archive =
                archives.find(
                    function (item) {

                        return item.id ===
                            openedArchiveId;
                    }
                );


            if (archive) {

                drawCapitalChart(
                    archiveChartCanvas,
                    archive.initialCapital,
                    archive.trades
                );
            }
        }
    }
);


// ============================================================
// ESC
// ============================================================

document.addEventListener(
    "keydown",
    function (event) {

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
// SUPPRIMER ARCHIVE
// ============================================================

function deleteArchive(id) {

    const archive =
        archives.find(
            function (item) {

                return item.id === id;
            }
        );


    if (!archive) {
        return;
    }


    const confirmed =
        confirm(
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
            function (item) {

                return item.id !== id;
            }
        );


    saveArchives();

    renderArchives();
}


// ============================================================
// REDIMENSIONNEMENT
// ============================================================

window.addEventListener(
    "resize",
    function () {

        updateActiveCapitalChart();


        if (
            !archiveChartModal.classList.contains(
                "hidden"
            )
        ) {

            const archive =
                archives.find(
                    function (item) {

                        return item.id ===
                            openedArchiveId;
                    }
                );


            if (archive) {

                drawCapitalChart(
                    archiveChartCanvas,
                    archive.initialCapital,
                    archive.trades
                );
            }
        }
    }
);


// ============================================================
// ACTUALISATION
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
