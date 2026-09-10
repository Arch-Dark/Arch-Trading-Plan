/* =========================================================
   TRADING DASHBOARD
   Gestion des capitaux, trades, statistiques, graphiques
   ========================================================= */


/* =========================================================
   STOCKAGE
   ========================================================= */

const TRADES_KEY = "tradingTrades";
const CAPITAL_KEY = "tradingActiveCapital";
const ARCHIVES_KEY = "tradingCapitalArchives";
const THEME_KEY = "tradingDashboardTheme";


/* =========================================================
   OUTILS
   ========================================================= */

function loadJSON(key, fallback) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (error) {
        console.error("Erreur lecture stockage :", error);
        return fallback;
    }
}


function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}


function generateId(prefix = "id") {
    return prefix + "_" + Date.now() + "_" +
        Math.random().toString(36).substring(2, 9);
}


function parseNumber(value) {
    if (value === null || value === undefined) {
        return NaN;
    }

    const normalized = String(value)
        .trim()
        .replace(/\s/g, "")
        .replace(",", ".");

    if (normalized === "") {
        return NaN;
    }

    return Number(normalized);
}


function formatMoney(value) {
    return Number(value || 0).toFixed(2) + " $";
}


function formatDate(dateValue) {
    if (!dateValue) {
        return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return String(dateValue);
    }

    return date.toLocaleDateString("fr-FR");
}


function formatDateTime(dateValue) {
    if (!dateValue) {
        return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return String(dateValue);
    }

    return date.toLocaleDateString("fr-FR") + " " +
        date.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit"
        });
}


/* =========================================================
   VARIABLES
   ========================================================= */

let trades = loadJSON(TRADES_KEY, []);
let archives = loadJSON(ARCHIVES_KEY, []);
let activeCapital = loadJSON(CAPITAL_KEY, null);

let currentPeriod = "today";
let openedArchiveId = null;


/* =========================================================
   INITIALISATION CAPITAL
   ========================================================= */

if (!activeCapital) {

    activeCapital = {
        id: generateId("capital"),
        name: "Capital 1",
        initialCapital: 0,
        createdAt: new Date().toISOString()
    };

    saveJSON(CAPITAL_KEY, activeCapital);
}


/* =========================================================
   COMPATIBILITÉ ANCIENS TRADES
   ========================================================= */

let tradesChanged = false;

trades = trades.map(trade => {

    if (!trade.capitalId) {
        trade.capitalId = activeCapital.id;
        tradesChanged = true;
    }

    if (!trade.id) {
        trade.id = generateId("trade");
        tradesChanged = true;
    }

    return trade;
});


if (tradesChanged) {
    saveJSON(TRADES_KEY, trades);
}


/* =========================================================
   DOM
   ========================================================= */

const themeBtn = document.getElementById("themeBtn");

const activeCapitalName =
    document.getElementById("activeCapitalName");

const activeCapitalPeriod =
    document.getElementById("activeCapitalPeriod");

const capitalNameInput =
    document.getElementById("capitalName");

const initialCapitalInput =
    document.getElementById("initialCapital");

const saveCapitalBtn =
    document.getElementById("saveCapitalBtn");

const newCapitalBtn =
    document.getElementById("newCapitalBtn");

const archiveCapitalBtn =
    document.getElementById("archiveCapitalBtn");


/* Graphique */

const capitalChart =
    document.getElementById("capitalChart");

const emptyChartMessage =
    document.getElementById("emptyChartMessage");


/* Statistiques */

const balanceElement =
    document.getElementById("balance");

const totalProfitElement =
    document.getElementById("totalProfit");

const winrateElement =
    document.getElementById("winrate");

const averageRRElement =
    document.getElementById("averageRR");

const totalTradesElement =
    document.getElementById("totalTrades");

const bestSetupElement =
    document.getElementById("bestSetup");

const bestSetupDetailsElement =
    document.getElementById("bestSetupDetails");


/* Trade */

const tradeForm =
    document.getElementById("tradeForm");

const assetInput =
    document.getElementById("asset");

const dateInput =
    document.getElementById("date");

const directionInput =
    document.getElementById("direction");

const orderTypeInput =
    document.getElementById("orderType");

const entryInput =
    document.getElementById("entry");

const slInput =
    document.getElementById("sl");

const tpInput =
    document.getElementById("tp");

const calculatedRRInput =
    document.getElementById("calculatedRR");

const resultInput =
    document.getElementById("result");

const setupInput =
    document.getElementById("setup");

const profitInput =
    document.getElementById("profit");

const commentInput =
    document.getElementById("comment");


/* Tables */

const setupList =
    document.getElementById("setupList");

const tradeList =
    document.getElementById("tradeList");

const emptyMessage =
    document.getElementById("emptyMessage");


/* Archives */

const archivesList =
    document.getElementById("archivesList");

const emptyArchives =
    document.getElementById("emptyArchives");


/* Modal capital */

const capitalModal =
    document.getElementById("capitalModal");

const cancelCapitalBtn =
    document.getElementById("cancelCapitalBtn");

const cancelCapitalBtn2 =
    document.getElementById("cancelCapitalBtn2");

const confirmCapitalBtn =
    document.getElementById("confirmCapitalBtn");

const newCapitalNameInput =
    document.getElementById("newCapitalName");

const newInitialCapitalInput =
    document.getElementById("newInitialCapital");


/* Modal graphique archive */

const archiveChartModal =
    document.getElementById("archiveChartModal");

const archiveChartTitle =
    document.getElementById("archiveChartTitle");

const archiveChartSubtitle =
    document.getElementById("archiveChartSubtitle");

const archiveChartInitial =
    document.getElementById("archiveChartInitial");

const archiveChartFinal =
    document.getElementById("archiveChartFinal");

const archiveChartProfit =
    document.getElementById("archiveChartProfit");

const archiveChart =
    document.getElementById("archiveChart");

const closeArchiveChartBtn =
    document.getElementById("closeArchiveChartBtn");


/* =========================================================
   RR
   ========================================================= */

function calculateRR(entry, sl, tp) {

    if (
        !Number.isFinite(entry) ||
        !Number.isFinite(sl) ||
        !Number.isFinite(tp)
    ) {
        return 0;
    }

    const direction =
        directionInput ? directionInput.value : "BUY";

    let risk;
    let reward;

    if (direction === "SELL") {

        risk = sl - entry;
        reward = entry - tp;

    } else {

        risk = entry - sl;
        reward = tp - entry;
    }

    if (risk <= 0 || reward <= 0) {
        return 0;
    }

    return reward / risk;
}


function updateCalculatedRR() {

    const entry = parseNumber(entryInput?.value);
    const sl = parseNumber(slInput?.value);
    const tp = parseNumber(tpInput?.value);

    const rr = calculateRR(entry, sl, tp);

    if (calculatedRRInput) {
        calculatedRRInput.value = rr.toFixed(2);
    }
}


/* =========================================================
   CAPITAL ACTIF
   ========================================================= */

function getCurrentCapitalTrades() {

    return trades.filter(
        trade => trade.capitalId === activeCapital.id
    );
}


function getCurrentBalance() {

    const currentTrades = getCurrentCapitalTrades();

    const profit = currentTrades.reduce(
        (sum, trade) => sum + Number(trade.pnl || 0),
        0
    );

    return Number(activeCapital.initialCapital || 0) + profit;
}


/* =========================================================
   PERIODES
   ========================================================= */

function isInPeriod(dateValue, period) {

    const date = new Date(dateValue);
    const now = new Date();

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    if (period === "all") {
        return true;
    }


    if (period === "today") {

        return (
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate()
        );
    }


    if (period === "week") {

        const currentDay = now.getDay();

        const mondayOffset =
            currentDay === 0 ? -6 : 1 - currentDay;

        const startOfWeek = new Date(now);

        startOfWeek.setDate(
            now.getDate() + mondayOffset
        );

        startOfWeek.setHours(0, 0, 0, 0);

        return date >= startOfWeek;
    }


    if (period === "month") {

        return (
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth()
        );
    }


    if (period === "year") {

        return (
            date.getFullYear() === now.getFullYear()
        );
    }


    return true;
}


function getPeriodTrades() {

    return getCurrentCapitalTrades().filter(
        trade => isInPeriod(trade.date, currentPeriod)
    );
}


/* =========================================================
   STATISTIQUES
   ========================================================= */

function calculateStats(list) {

    const totalTrades = list.length;

    const totalProfit = list.reduce(
        (sum, trade) => sum + Number(trade.pnl || 0),
        0
    );

    const winners = list.filter(
        trade => Number(trade.pnl || 0) > 0
    ).length;

    const winrate =
        totalTrades > 0
            ? (winners / totalTrades) * 100
            : 0;


    const rrValues = list
        .map(trade => Number(trade.rr))
        .filter(value => Number.isFinite(value) && value > 0);

    const averageRR =
        rrValues.length > 0
            ? rrValues.reduce((a, b) => a + b, 0) /
              rrValues.length
            : 0;


    return {
        totalTrades,
        totalProfit,
        winners,
        winrate,
        averageRR
    };
}


/* =========================================================
   MEILLEUR SETUP
   ========================================================= */

function calculateBestSetup(list) {

    const setups = {};

    list.forEach(trade => {

        const setup = trade.setup || "Sans setup";

        if (!setups[setup]) {

            setups[setup] = {
                trades: 0,
                winners: 0,
                profit: 0
            };
        }

        setups[setup].trades++;

        if (Number(trade.pnl || 0) > 0) {
            setups[setup].winners++;
        }

        setups[setup].profit += Number(trade.pnl || 0);
    });


    const ranking = Object.entries(setups)
        .map(([name, data]) => {

            const winrate =
                data.trades > 0
                    ? (data.winners / data.trades) * 100
                    : 0;

            return {
                name,
                ...data,
                winrate
            };
        })
        .sort((a, b) => {

            if (b.winrate !== a.winrate) {
                return b.winrate - a.winrate;
            }

            return b.trades - a.trades;
        });


    return ranking.length > 0
        ? ranking[0]
        : null;
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function refreshDashboard() {

    const currentTrades =
        getCurrentCapitalTrades();

    const periodTrades =
        getPeriodTrades();

    const stats =
        calculateStats(periodTrades);

    const balance =
        getCurrentBalance();


    if (activeCapitalName) {
        activeCapitalName.textContent =
            activeCapital.name;
    }


    if (capitalNameInput) {
        capitalNameInput.value =
            activeCapital.name;
    }


    if (initialCapitalInput) {
        initialCapitalInput.value =
            Number(activeCapital.initialCapital || 0);
    }


    if (activeCapitalPeriod) {

        activeCapitalPeriod.textContent =
            "Capital initial : " +
            formatMoney(activeCapital.initialCapital) +
            " • Solde actuel : " +
            formatMoney(balance) +
            " • " +
            currentTrades.length +
            " trade(s)";
    }


    if (balanceElement) {
        balanceElement.textContent =
            formatMoney(balance);
    }


    if (totalProfitElement) {
        totalProfitElement.textContent =
            formatMoney(stats.totalProfit);
    }


    if (winrateElement) {

        winrateElement.textContent =
            stats.winrate.toFixed(1) + "%";
    }


    if (averageRRElement) {

        averageRRElement.textContent =
            stats.averageRR.toFixed(2);
    }


    if (totalTradesElement) {

        totalTradesElement.textContent =
            stats.totalTrades;
    }


    const bestSetup =
        calculateBestSetup(currentTrades);


    if (bestSetup) {

        if (bestSetupElement) {
            bestSetupElement.textContent =
                bestSetup.name;
        }

        if (bestSetupDetailsElement) {

            bestSetupDetailsElement.textContent =
                bestSetup.winrate.toFixed(1) +
                "% de réussite • " +
                bestSetup.trades +
                " trade(s)";
        }

    } else {

        if (bestSetupElement) {
            bestSetupElement.textContent = "-";
        }

        if (bestSetupDetailsElement) {
            bestSetupDetailsElement.textContent =
                "Aucun trade";
        }
    }


    renderSetupTable(currentTrades);
    renderTradeHistory(currentTrades);
    renderActiveChart();
    renderArchives();
}


/* =========================================================
   TABLE SETUPS
   ========================================================= */

function renderSetupTable(list) {

    if (!setupList) {
        return;
    }

    setupList.innerHTML = "";


    const setups = {};

    list.forEach(trade => {

        const setup = trade.setup || "Sans setup";

        if (!setups[setup]) {

            setups[setup] = {
                trades: 0,
                winners: 0,
                profit: 0
            };
        }

        setups[setup].trades++;

        if (Number(trade.pnl || 0) > 0) {
            setups[setup].winners++;
        }

        setups[setup].profit += Number(trade.pnl || 0);
    });


    const rows = Object.entries(setups)
        .map(([name, data]) => {

            const winrate =
                data.trades > 0
                    ? (data.winners / data.trades) * 100
                    : 0;

            return {
                name,
                ...data,
                winrate
            };
        })
        .sort((a, b) => {

            if (b.winrate !== a.winrate) {
                return b.winrate - a.winrate;
            }

            return b.trades - a.trades;
        });


    if (rows.length === 0) {

        setupList.innerHTML = `
            <tr>
                <td colspan="5">
                    Aucun trade enregistré.
                </td>
            </tr>
        `;

        return;
    }


    rows.forEach(row => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${escapeHTML(row.name)}</td>
            <td>${row.trades}</td>
            <td>${row.winners}</td>
            <td>${row.winrate.toFixed(1)}%</td>
            <td>${formatMoney(row.profit)}</td>
        `;

        setupList.appendChild(tr);
    });
}


/* =========================================================
   HISTORIQUE
   ========================================================= */

function renderTradeHistory(list) {

    if (!tradeList) {
        return;
    }

    tradeList.innerHTML = "";


    if (emptyMessage) {
        emptyMessage.style.display =
            list.length === 0 ? "block" : "none";
    }


    const sortedTrades = [...list].sort(
        (a, b) =>
            new Date(b.date) - new Date(a.date)
    );


    sortedTrades.forEach(trade => {

        const tr = document.createElement("tr");


        let resultDisplay = trade.result || "-";

        if (trade.result === "TP") {
            resultDisplay = "🟢 TP";
        }

        if (trade.result === "SL") {
            resultDisplay = "🔴 SL";
        }

        if (trade.result === "BE") {
            resultDisplay = "⚖️ BE";
        }


        const pnl =
            Number(trade.pnl || 0);

        const pnlClass =
            pnl > 0
                ? "profit"
                : pnl < 0
                    ? "loss"
                    : "";


        tr.innerHTML = `
            <td>${formatDate(trade.date)}</td>
            <td>${escapeHTML(trade.asset || "-")}</td>
            <td>${trade.position || "-"}</td>
            <td>${formatPrice(trade.entry)}</td>
            <td>${formatPrice(trade.sl)}</td>
            <td>${formatPrice(trade.tp)}</td>
            <td>${Number(trade.rr || 0).toFixed(2)}</td>
            <td>${escapeHTML(trade.setup || "-")}</td>
            <td>${resultDisplay}</td>
            <td class="${pnlClass}">
                ${formatMoney(pnl)}
            </td>
            <td>
                <button
                    class="delete-trade-btn danger"
                    data-id="${trade.id}">
                    🗑️
                </button>
            </td>
        `;


        tradeList.appendChild(tr);
    });


    document
        .querySelectorAll(".delete-trade-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => deleteTrade(button.dataset.id)
            );
        });
}


function formatPrice(value) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "-";
    }

    return number.toFixed(2);
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   AJOUTER UN TRADE
   ========================================================= */

function addTrade(event) {

    event.preventDefault();


    /* Récupération des champs */

    const asset =
        assetInput?.value.trim();

    const tradeDate =
        dateInput?.value;

    const position =
        directionInput?.value;

    const orderType =
        orderTypeInput?.value;

    const entry =
        parseNumber(entryInput?.value);

    const sl =
        parseNumber(slInput?.value);

    const tp =
        parseNumber(tpInput?.value);

    const setup =
        setupInput?.value || "";

    const result =
        resultInput?.value || "";

    const pnl =
        parseNumber(profitInput?.value);

    const comment =
        commentInput?.value.trim() || "";


    /* Validation */

    if (
        !asset ||
        !tradeDate ||
        !position ||
        !Number.isFinite(entry) ||
        !Number.isFinite(sl) ||
        !Number.isFinite(tp) ||
        !Number.isFinite(pnl)
    ) {

        alert(
            "Veuillez remplir correctement les champs du trade."
        );

        return;
    }


    /* Calcul RR */

    let risk;
    let reward;


    if (position === "SELL") {

        risk = sl - entry;
        reward = entry - tp;

    } else {

        risk = entry - sl;
        reward = tp - entry;
    }


    if (risk <= 0 || reward <= 0) {

        alert(
            "Vérifiez Entry, Stop Loss et Take Profit.\n\n" +
            "Pour un Buy : SL < Entry < TP.\n" +
            "Pour un Sell : TP < Entry < SL."
        );

        return;
    }


    const rr =
        reward / risk;


    /* Date */

    let finalDate;

    try {

        /*
         * Le champ HTML est de type date.
         * On crée une date locale à midi pour éviter
         * les décalages de jour liés au fuseau horaire.
         */

        finalDate =
            new Date(
                tradeDate + "T12:00:00"
            ).toISOString();

    } catch (error) {

        finalDate =
            new Date().toISOString();
    }


    /* Création du trade */

    const trade = {

        id: generateId("trade"),

        capitalId:
            activeCapital.id,

        date:
            finalDate,

        asset:
            asset,

        position:
            position,

        orderType:
            orderType,

        entry:
            entry,

        sl:
            sl,

        tp:
            tp,

        rr:
            rr,

        setup:
            setup,

        result:
            result,

        pnl:
            pnl,

        comment:
            comment
    };


    /* Enregistrement */

    trades.push(trade);

    saveJSON(
        TRADES_KEY,
        trades
    );


    /* Reset formulaire */

    if (tradeForm) {
        tradeForm.reset();
    }


    /* Valeurs par défaut après reset */

    if (dateInput) {

        const now = new Date();

        const year =
            now.getFullYear();

        const month =
            String(now.getMonth() + 1)
                .padStart(2, "0");

        const day =
            String(now.getDate())
                .padStart(2, "0");

        dateInput.value =
            `${year}-${month}-${day}`;
    }


    if (calculatedRRInput) {
        calculatedRRInput.value =
            "0.00";
    }


    /* Actualisation */

    refreshDashboard();


    alert(
        "✅ Trade enregistré avec succès !"
    );
}


/* =========================================================
   SUPPRIMER UN TRADE
   ========================================================= */

function deleteTrade(id) {

    const confirmed =
        confirm(
            "Voulez-vous vraiment supprimer ce trade ?"
        );

    if (!confirmed) {
        return;
    }


    trades =
        trades.filter(
            trade => trade.id !== id
        );


    saveJSON(
        TRADES_KEY,
        trades
    );


    refreshDashboard();
}


/* =========================================================
   SUPPRIMER LES TRADES DU CAPITAL ACTIF
   ========================================================= */

function clearCurrentCapitalTrades() {

    const currentTrades =
        getCurrentCapitalTrades();


    if (currentTrades.length === 0) {

        alert(
            "Il n'y a aucun trade à supprimer."
        );

        return;
    }


    const confirmed =
        confirm(
            "⚠️ Supprimer tous les trades du capital actif ?\n\n" +
            "Cette action ne supprimera pas les archives."
        );


    if (!confirmed) {
        return;
    }


    trades =
        trades.filter(
            trade =>
                trade.capitalId !== activeCapital.id
        );


    saveJSON(
        TRADES_KEY,
        trades
    );


    refreshDashboard();
}


/* =========================================================
   CAPITAL
   ========================================================= */

function saveCapital() {

    const name =
        capitalNameInput?.value.trim();

    const amount =
        parseNumber(initialCapitalInput?.value);


    if (!name) {

        alert(
            "Veuillez entrer un nom pour le capital."
        );

        return;
    }


    if (!Number.isFinite(amount) || amount < 0) {

        alert(
            "Veuillez entrer un capital initial valide."
        );

        return;
    }


    activeCapital.name =
        name;

    activeCapital.initialCapital =
        amount;


    saveJSON(
        CAPITAL_KEY,
        activeCapital
    );


    refreshDashboard();


    alert(
        "✅ Capital enregistré avec succès !"
    );
}


/* =========================================================
   NOUVEAU CAPITAL
   ========================================================= */

function openCapitalModal() {

    if (!capitalModal) {
        return;
    }

    capitalModal.classList.remove("hidden");


    if (newCapitalNameInput) {

        const currentNumber =
            archives.length + 2;

        newCapitalNameInput.value =
            "Capital " + currentNumber;
    }


    if (newInitialCapitalInput) {
        newInitialCapitalInput.value = "";
    }
}


function closeCapitalModal() {

    if (capitalModal) {
        capitalModal.classList.add("hidden");
    }
}


function createNewCapital() {

    const name =
        newCapitalNameInput?.value.trim();

    const amount =
        parseNumber(
            newInitialCapitalInput?.value
        );


    if (!name) {

        alert(
            "Veuillez entrer un nom pour le nouveau capital."
        );

        return;
    }


    if (!Number.isFinite(amount) || amount < 0) {

        alert(
            "Veuillez entrer un capital initial valide."
        );

        return;
    }


    /*
     * Si le capital actuel contient des trades,
     * on l'archive automatiquement avant de créer
     * le nouveau.
     */

    const currentTrades =
        getCurrentCapitalTrades();


    if (currentTrades.length > 0) {

        archiveCurrentCapital(false);
    }


    activeCapital = {

        id:
            generateId("capital"),

        name:
            name,

        initialCapital:
            amount,

        createdAt:
            new Date().toISOString()
    };


    saveJSON(
        CAPITAL_KEY,
        activeCapital
    );


    closeCapitalModal();


    refreshDashboard();


    alert(
        "✅ Nouveau capital créé avec succès !"
    );
}


/* =========================================================
   ARCHIVAGE
   ========================================================= */

function archiveCurrentCapital(showMessage = true) {

    const currentTrades =
        getCurrentCapitalTrades();

    const totalProfit =
        currentTrades.reduce(
            (sum, trade) =>
                sum + Number(trade.pnl || 0),
            0
        );

    const finalBalance =
        Number(activeCapital.initialCapital || 0) +
        totalProfit;


    const winners =
        currentTrades.filter(
            trade => Number(trade.pnl || 0) > 0
        ).length;


    const winrate =
        currentTrades.length > 0
            ? (winners / currentTrades.length) * 100
            : 0;


    const archive = {

        id:
            generateId("archive"),

        name:
            activeCapital.name,

        initialCapital:
            Number(activeCapital.initialCapital || 0),

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


    archives.push(archive);

    saveJSON(
        ARCHIVES_KEY,
        archives
    );


    /*
     * Après archivage manuel :
     * création d'un nouveau capital vide.
     */

    if (showMessage) {

        activeCapital = {

            id:
                generateId("capital"),

            name:
                "Capital " + (archives.length + 1),

            initialCapital:
                0,

            createdAt:
                new Date().toISOString()
        };


        saveJSON(
            CAPITAL_KEY,
            activeCapital
        );


        refreshDashboard();


        alert(
            "📦 Capital archivé avec succès !"
        );
    }
}


/* =========================================================
   ARCHIVES
   ========================================================= */

function renderArchives() {

    if (!archivesList) {
        return;
    }


    archivesList.innerHTML = "";


    if (emptyArchives) {

        emptyArchives.style.display =
            archives.length === 0
                ? "block"
                : "none";
    }


    const sortedArchives =
        [...archives].reverse();


    sortedArchives.forEach(archive => {

        const card =
            document.createElement("div");

        card.className =
            "archive-card";


        const profitClass =
            Number(archive.totalProfit || 0) > 0
                ? "profit"
                : Number(archive.totalProfit || 0) < 0
                    ? "loss"
                    : "";


        card.innerHTML = `

            <div class="archive-card-header">

                <div>

                    <h3>
                        📦 ${escapeHTML(archive.name)}
                    </h3>

                    <small>
                        Archivé le ${formatDateTime(archive.archivedAt)}
                    </small>

                </div>

            </div>


            <div class="archive-stats">

                <div>
                    <span>Capital initial</span>
                    <strong>
                        ${formatMoney(archive.initialCapital)}
                    </strong>
                </div>


                <div>
                    <span>Solde final</span>
                    <strong>
                        ${formatMoney(archive.finalBalance)}
                    </strong>
                </div>


                <div>
                    <span>Profit</span>
                    <strong class="${profitClass}">
                        ${formatMoney(archive.totalProfit)}
                    </strong>
                </div>


                <div>
                    <span>Trades</span>
                    <strong>
                        ${archive.totalTrades}
                    </strong>
                </div>


                <div>
                    <span>Winrate</span>
                    <strong>
                        ${Number(archive.winrate || 0).toFixed(1)}%
                    </strong>
                </div>

            </div>


            <div class="archive-actions">

                <button
                    class="secondary view-archive-btn"
                    data-id="${archive.id}">

                    📈 Voir le graphique

                </button>


                <button
                    class="danger delete-archive-btn"
                    data-id="${archive.id}">

                    🗑️ Supprimer

                </button>

            </div>
        `;


        archivesList.appendChild(card);
    });


    document
        .querySelectorAll(".view-archive-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => openArchiveChart(
                    button.dataset.id
                )
            );
        });


    document
        .querySelectorAll(".delete-archive-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => deleteArchive(
                    button.dataset.id
                )
            );
        });
}


/* =========================================================
   SUPPRIMER ARCHIVE
   ========================================================= */

function deleteArchive(id) {

    const confirmed =
        confirm(
            "Voulez-vous vraiment supprimer cette archive ?\n\n" +
            "Tous les trades de cette archive seront perdus."
        );


    if (!confirmed) {
        return;
    }


    archives =
        archives.filter(
            archive => archive.id !== id
        );


    saveJSON(
        ARCHIVES_KEY,
        archives
    );


    refreshDashboard();
}


/* =========================================================
   ECHELLE DU GRAPHIQUE
   ========================================================= */

function calculateChartScale(values) {

    if (!values || values.length === 0) {

        return {
            min: 0,
            max: 100,
            step: 20
        };
    }


    let minValue =
        Math.min(...values);

    let maxValue =
        Math.max(...values);


    if (minValue === maxValue) {

        const base =
            Math.abs(minValue) || 100;

        minValue =
            minValue - base * 0.1;

        maxValue =
            maxValue + base * 0.1;
    }


    const range =
        maxValue - minValue;


    let step = 5;


    if (range > 1000) {
        step = 100;

    } else if (range > 500) {
        step = 50;

    } else if (range > 200) {
        step = 25;

    } else if (range > 100) {
        step = 10;

    } else {
        step = 5;
    }


    let min =
        Math.floor(minValue / step) * step;

    let max =
        Math.ceil(maxValue / step) * step;


    /*
     * Si tout est positif, on évite un minimum
     * inutilement négatif.
     */

    if (minValue >= 0) {
        min = Math.max(0, min);
    }


    /*
     * Petite marge visuelle.
     */

    if (min === max) {
        max += step;
    }


    return {
        min,
        max,
        step
    };
}


/* =========================================================
   COULEURS DES SEGMENTS
   ========================================================= */

function getTradeColor(pnl) {

    const value =
        Number(pnl || 0);


    if (value > 0) {
        return "#16a34a";
    }


    if (value < 0) {
        return "#dc2626";
    }


    return "#64748b";
}


/* =========================================================
   GRAPHIQUE CAPITAL
   ========================================================= */

function drawCapitalChart(
    canvas,
    initialCapital,
    tradeListData
) {

    if (!canvas) {
        return;
    }


    const ctx =
        canvas.getContext("2d");


    const rect =
        canvas.getBoundingClientRect();


    const width =
        Math.max(
            canvas.clientWidth || rect.width || 600,
            300
        );


    const height =
        Math.max(
            canvas.clientHeight || rect.height || 320,
            250
        );


    const devicePixelRatio =
        window.devicePixelRatio || 1;


    canvas.width =
        width * devicePixelRatio;

    canvas.height =
        height * devicePixelRatio;


    ctx.setTransform(
        devicePixelRatio,
        0,
        0,
        devicePixelRatio,
        0,
        0
    );


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const sortedTrades =
        [...tradeListData].sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );


    /*
     * Evolution du capital :
     *
     * Point 0 = capital initial
     * Point 1 = après trade 1
     * Point 2 = après trade 2
     * etc.
     */

    const values = [
        Number(initialCapital || 0)
    ];


    let runningBalance =
        Number(initialCapital || 0);


    sortedTrades.forEach(trade => {

        runningBalance +=
            Number(trade.pnl || 0);

        values.push(runningBalance);
    });


    if (values.length < 2) {
        return;
    }


    const scale =
        calculateChartScale(values);


    /* Marges */

    const paddingLeft = 70;
    const paddingRight = 25;
    const paddingTop = 25;
    const paddingBottom = 45;


    const chartWidth =
        width -
        paddingLeft -
        paddingRight;


    const chartHeight =
        height -
        paddingTop -
        paddingBottom;


    if (
        chartWidth <= 0 ||
        chartHeight <= 0
    ) {
        return;
    }


    /* Fond */

    ctx.fillStyle =
        getComputedStyle(
            document.body
        ).getPropertyValue(
            "--panel-bg"
        ).trim() || "#ffffff";

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    /* Grille */

    ctx.font =
        "12px Arial";

    ctx.textAlign =
        "right";

    ctx.textBaseline =
        "middle";


    const tickCount =
        Math.round(
            (scale.max - scale.min) /
            scale.step
        );


    for (let i = 0; i <= tickCount; i++) {

        const value =
            scale.min +
            i * scale.step;


        const ratio =
            (value - scale.min) /
            (scale.max - scale.min);


        const y =
            paddingTop +
            chartHeight -
            ratio * chartHeight;


        ctx.beginPath();

        ctx.moveTo(
            paddingLeft,
            y
        );

        ctx.lineTo(
            width - paddingRight,
            y
        );


        ctx.strokeStyle =
            "rgba(128,128,128,0.18)";

        ctx.lineWidth = 1;

        ctx.stroke();


        ctx.fillStyle =
            "#6b7280";


        ctx.fillText(
            value.toFixed(0) + " $",
            paddingLeft - 10,
            y
        );
    }


    /* Axe vertical */

    ctx.beginPath();

    ctx.moveTo(
        paddingLeft,
        paddingTop
    );

    ctx.lineTo(
        paddingLeft,
        height - paddingBottom
    );

    ctx.strokeStyle =
        "rgba(128,128,128,0.4)";

    ctx.stroke();


    /* Axe horizontal */

    ctx.beginPath();

    ctx.moveTo(
        paddingLeft,
        height - paddingBottom
    );

    ctx.lineTo(
        width - paddingRight,
        height - paddingBottom
    );

    ctx.stroke();


    /* Conversion valeur → coordonnées */

    function getX(index) {

        if (values.length === 1) {
            return paddingLeft;
        }

        return (
            paddingLeft +
            (index / (values.length - 1)) *
            chartWidth
        );
    }


    function getY(value) {

        return (
            paddingTop +
            chartHeight -
            (
                (value - scale.min) /
                (scale.max - scale.min)
            ) *
            chartHeight
        );
    }


    /* Ligne */

    for (
        let i = 1;
        i < values.length;
        i++
    ) {

        const x1 =
            getX(i - 1);

        const y1 =
            getY(values[i - 1]);

        const x2 =
            getX(i);

        const y2 =
            getY(values[i]);


        const trade =
            sortedTrades[i - 1];


        ctx.beginPath();

        ctx.moveTo(
            x1,
            y1
        );


        /*
         * Ligne droite pour conserver une lecture
         * claire du résultat de chaque trade.
         */

        ctx.lineTo(
            x2,
            y2
        );


        ctx.strokeStyle =
            getTradeColor(
                trade?.pnl
            );


        ctx.lineWidth = 3;

        ctx.lineCap =
            "round";

        ctx.stroke();
    }


    /* Points */

    values.forEach(
        (value, index) => {

            const x =
                getX(index);

            const y =
                getY(value);


            let pointColor =
                "#2563eb";


            if (index > 0) {

                pointColor =
                    getTradeColor(
                        sortedTrades[index - 1]?.pnl
                    );
            }


            ctx.beginPath();

            ctx.arc(
                x,
                y,
                4,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                pointColor;

            ctx.fill();


            ctx.strokeStyle =
                "#ffffff";

            ctx.lineWidth = 2;

            ctx.stroke();
        }
    );


    /* Labels X */

    ctx.fillStyle =
        "#6b7280";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "top";


    if (values.length <= 12) {

        values.forEach(
            (value, index) => {

                const x =
                    getX(index);

                const label =
                    index === 0
                        ? "Départ"
                        : "#" + index;


                ctx.fillText(
                    label,
                    x,
                    height - paddingBottom + 12
                );
            }
        );

    } else {

        const indexes = [
            0,
            Math.floor(
                (values.length - 1) / 2
            ),
            values.length - 1
        ];


        indexes.forEach(index => {

            const x =
                getX(index);


            const label =
                index === 0
                    ? "Départ"
                    : "#" + index;


            ctx.fillText(
                label,
                x,
                height - paddingBottom + 12
            );
        });
    }


    /* Valeur finale */

    const finalValue =
        values[values.length - 1];


    ctx.textAlign =
        "right";

    ctx.textBaseline =
        "bottom";

    ctx.font =
        "bold 13px Arial";

    ctx.fillStyle =
        finalValue >= Number(initialCapital || 0)
            ? "#16a34a"
            : "#dc2626";


    ctx.fillText(
        "Solde : " +
        finalValue.toFixed(2) +
        " $",
        width - paddingRight,
        paddingTop - 5
    );
}


/* =========================================================
   GRAPHIQUE ACTIF
   ========================================================= */

function renderActiveChart() {

    if (!capitalChart) {
        return;
    }


    const currentTrades =
        getCurrentCapitalTrades();


    if (currentTrades.length === 0) {

        capitalChart.style.display =
            "none";


        if (emptyChartMessage) {
            emptyChartMessage.style.display =
                "block";
        }

        return;
    }


    capitalChart.style.display =
        "block";


    if (emptyChartMessage) {
        emptyChartMessage.style.display =
            "none";
    }


    drawCapitalChart(
        capitalChart,
        activeCapital.initialCapital,
        currentTrades
    );
}


/* =========================================================
   GRAPHIQUE ARCHIVE
   ========================================================= */

function openArchiveChart(id) {

    const archive =
        archives.find(
            item => item.id === id
        );


    if (!archive) {
        return;
    }


    openedArchiveId =
        archive.id;


    if (archiveChartTitle) {

        archiveChartTitle.textContent =
            "📈 " + archive.name;
    }


    if (archiveChartSubtitle) {

        archiveChartSubtitle.textContent =
            "Évolution du capital avant archivage";
    }


    if (archiveChartInitial) {

        archiveChartInitial.textContent =
            formatMoney(
                archive.initialCapital
            );
    }


    if (archiveChartFinal) {

        archiveChartFinal.textContent =
            formatMoney(
                archive.finalBalance
            );
    }


    if (archiveChartProfit) {

        archiveChartProfit.textContent =
            formatMoney(
                archive.totalProfit
            );
    }


    if (archiveChartModal) {

        archiveChartModal.classList.remove(
            "hidden"
        );
    }


    setTimeout(() => {

        drawCapitalChart(
            archiveChart,
            archive.initialCapital,
            archive.trades || []
        );

    }, 50);
}


function closeArchiveChart() {

    if (archiveChartModal) {

        archiveChartModal.classList.add(
            "hidden"
        );
    }


    openedArchiveId = null;
}


/* =========================================================
   THEME
   ========================================================= */

function applyTheme(theme) {

    if (theme === "light") {

        document.body.classList.add(
            "light-theme"
        );

        if (themeBtn) {
            themeBtn.textContent = "☀️";
        }

    } else {

        document.body.classList.remove(
            "light-theme"
        );

        if (themeBtn) {
            themeBtn.textContent = "🌙";
        }
    }
}


function toggleTheme() {

    const isLight =
        document.body.classList.contains(
            "light-theme"
        );


    const newTheme =
        isLight ? "dark" : "light";


    saveJSON(
        THEME_KEY,
        newTheme
    );


    applyTheme(newTheme);
}


/* =========================================================
   EVENEMENTS
   ========================================================= */


/* Capital */

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
        () => {

            const currentTrades =
                getCurrentCapitalTrades();


            if (currentTrades.length === 0) {

                alert(
                    "Le capital actuel ne contient aucun trade à archiver."
                );

                return;
            }


            const confirmed =
                confirm(
                    "Voulez-vous archiver le capital actuel ?\n\n" +
                    "Ses trades et statistiques seront conservés dans les archives."
                );


            if (confirmed) {

                archiveCurrentCapital(true);
            }
        }
    );
}


/* Modal */

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


if (confirmCapitalBtn) {

    confirmCapitalBtn.addEventListener(
        "click",
        createNewCapital
    );
}


/* Trade */

if (tradeForm) {

    tradeForm.addEventListener(
        "submit",
        addTrade
    );
}


[
    entryInput,
    slInput,
    tpInput,
    directionInput
].forEach(input => {

    if (input) {

        input.addEventListener(
            "input",
            updateCalculatedRR
        );

        input.addEventListener(
            "change",
            updateCalculatedRR
        );
    }
});


/* Supprimer tout */

const clearBtn =
    document.getElementById("clearBtn");


if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        clearCurrentCapitalTrades
    );
}


/* Périodes */

document
    .querySelectorAll(".period-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".period-btn")
                    .forEach(btn =>
                        btn.classList.remove(
                            "active"
                        )
                    );


                button.classList.add(
                    "active"
                );


                currentPeriod =
                    button.dataset.period ||
                    "today";


                refreshDashboard();
            }
        );
    });


/* Theme */

if (themeBtn) {

    themeBtn.addEventListener(
        "click",
        toggleTheme
    );
}


/* Fermer graphique archive */

if (closeArchiveChartBtn) {

    closeArchiveChartBtn.addEventListener(
        "click",
        closeArchiveChart
    );
}


/* Fermer modal en cliquant à l'extérieur */

if (capitalModal) {

    capitalModal.addEventListener(
        "click",
        event => {

            if (
                event.target === capitalModal
            ) {
                closeCapitalModal();
            }
        }
    );
}


if (archiveChartModal) {

    archiveChartModal.addEventListener(
        "click",
        event => {

            if (
                event.target === archiveChartModal
            ) {
                closeArchiveChart();
            }
        }
    );
}


/* Touche Escape */

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            closeCapitalModal();
            closeArchiveChart();
        }
    }
);


/* Redessiner le graphique si la fenêtre change */

window.addEventListener(
    "resize",
    () => {

        renderActiveChart();


        if (
            openedArchiveId &&
            archiveChartModal &&
            !archiveChartModal.classList.contains(
                "hidden"
            )
        ) {

            const archive =
                archives.find(
                    item =>
                        item.id === openedArchiveId
                );


            if (archive) {

                drawCapitalChart(
                    archiveChart,
                    archive.initialCapital,
                    archive.trades || []
                );
            }
        }
    }
);


/* =========================================================
   INITIALISATION THEME
   ========================================================= */

const savedTheme =
    loadJSON(
        THEME_KEY,
        "dark"
    );


applyTheme(savedTheme);


/* =========================================================
   DATE DU JOUR PAR DEFAUT
   ========================================================= */

if (dateInput && !dateInput.value) {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");

    dateInput.value =
        `${year}-${month}-${day}`;
}


/* =========================================================
   PREMIER AFFICHAGE
   ========================================================= */

updateCalculatedRR();

refreshDashboard();

console.log(
    "Trading Dashboard initialisé avec succès."
);
