// ==========================================
// TRADING DASHBOARD - CAPITALS & ARCHIVES
// ==========================================

const TRADES_KEY = "tradingTrades";
const CAPITAL_KEY = "tradingActiveCapital";
const ARCHIVES_KEY = "tradingCapitalArchives";
const THEME_KEY = "tradingDashboardTheme";

let trades = JSON.parse(localStorage.getItem(TRADES_KEY)) || [];

let archives = JSON.parse(localStorage.getItem(ARCHIVES_KEY)) || [];

let activeCapital = JSON.parse(
    localStorage.getItem(CAPITAL_KEY)
);

let currentPeriod = "today";

// ==========================================
// INITIALISATION DU CAPITAL
// ==========================================

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
const bestSetupDetailsElement =
    document.getElementById("bestSetupDetails");

const tradeList = document.getElementById("tradeList");
const emptyMessage = document.getElementById("emptyMessage");
const clearBtn = document.getElementById("clearBtn");
const setupList = document.getElementById("setupList");

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

const archivesList =
    document.getElementById("archivesList");

const emptyArchives =
    document.getElementById("emptyArchives");

const capitalModal =
    document.getElementById("capitalModal");

const newCapitalNameInput =
    document.getElementById("newCapitalName");

const newInitialCapitalInput =
    document.getElementById("newInitialCapital");

const cancelCapitalBtn =
    document.getElementById("cancelCapitalBtn");

const confirmCapitalBtn =
    document.getElementById("confirmCapitalBtn");

const themeBtn =
    document.getElementById("themeBtn");

// ==========================================
// SAUVEGARDE
// ==========================================

function saveTrades() {

    localStorage.setItem(
        TRADES_KEY,
        JSON.stringify(trades)
    );
}

function saveActiveCapital() {

    localStorage.setItem(
        CAPITAL_KEY,
        JSON.stringify(activeCapital)
    );
}

function saveArchives() {

    localStorage.setItem(
        ARCHIVES_KEY,
        JSON.stringify(archives)
    );
}

// ==========================================
// DATE
// ==========================================

function setTodayDate() {

    if (dateInput) {

        dateInput.value =
            new Date().toISOString().split("T")[0];
    }
}

// ==========================================
// FORMATAGE ARGENT
// ==========================================

function formatMoney(value) {

    const number = Number(value) || 0;

    if (number > 0) {

        return `+${number.toFixed(2)} $`;
    }

    if (number < 0) {

        return `${number.toFixed(2)} $`;
    }

    return "0.00 $";
}

// ==========================================
// FORMATAGE RR
// ==========================================

function formatRR(value) {

    const rr = Number(value) || 0;

    if (rr <= 0) {

        return "-";
    }

    return `1:${rr.toFixed(2)}`;
}

// ==========================================
// CALCUL RR
// ==========================================

function calculateRR() {

    const entry =
        parseFloat(entryInput.value);

    const sl =
        parseFloat(slInput.value);

    const tp =
        parseFloat(tpInput.value);

    if (
        Number.isNaN(entry) ||
        Number.isNaN(sl) ||
        Number.isNaN(tp)
    ) {

        rrInput.value = "0.00";

        return;
    }

    const risk =
        Math.abs(entry - sl);

    const reward =
        Math.abs(tp - entry);

    if (risk <= 0) {

        rrInput.value = "0.00";

        return;
    }

    const rr =
        reward / risk;

    rrInput.value =
        `1:${rr.toFixed(2)}`;
}

entryInput?.addEventListener(
    "input",
    calculateRR
);

slInput?.addEventListener(
    "input",
    calculateRR
);

tpInput?.addEventListener(
    "input",
    calculateRR
);

// ==========================================
// FILTRE PERIODE
// ==========================================

function getFilteredTrades() {

    const now = new Date();

    return trades.filter(trade => {

        if (!trade.date) {

            return false;
        }

        const tradeDate =
            new Date(`${trade.date}T00:00:00`);

        if (currentPeriod === "all") {

            return true;
        }

        if (currentPeriod === "today") {

            return (
                tradeDate.getFullYear() ===
                    now.getFullYear() &&

                tradeDate.getMonth() ===
                    now.getMonth() &&

                tradeDate.getDate() ===
                    now.getDate()
            );
        }

        if (currentPeriod === "week") {

            const day =
                now.getDay();

            const mondayOffset =
                day === 0 ? 6 : day - 1;

            const monday =
                new Date(now);

            monday.setHours(
                0,
                0,
                0,
                0
            );

            monday.setDate(
                now.getDate() -
                mondayOffset
            );

            const sunday =
                new Date(monday);

            sunday.setDate(
                monday.getDate() + 6
            );

            sunday.setHours(
                23,
                59,
                59,
                999
            );

            return (
                tradeDate >= monday &&
                tradeDate <= sunday
            );
        }

        if (currentPeriod === "month") {

            return (
                tradeDate.getFullYear() ===
                    now.getFullYear() &&

                tradeDate.getMonth() ===
                    now.getMonth()
            );
        }

        if (currentPeriod === "year") {

            return (
                tradeDate.getFullYear() ===
                now.getFullYear()
            );
        }

        return true;
    });
}

// ==========================================
// PROFIT TOTAL DU CAPITAL
// ==========================================

function getCapitalProfit() {

    return trades.reduce(
        (sum, trade) =>
            sum + (Number(trade.profit) || 0),
        0
    );
}

// ==========================================
// SOLDE ACTUEL
// ==========================================

function getCurrentBalance() {

    const initial =
        Number(activeCapital.initialCapital) || 0;

    const profit =
        getCapitalProfit();

    return initial + profit;
}

// ==========================================
// AFFICHAGE CAPITAL
// ==========================================

function updateCapitalDisplay() {

    activeCapitalName.textContent =
        activeCapital.name;

    const capitalTrades =
        trades.length;

    const initial =
        Number(activeCapital.initialCapital) || 0;

    const balance =
        getCurrentBalance();

    activeCapitalPeriod.textContent =
        `Capital initial : ${initial.toFixed(2)} $ • ` +
        `Solde actuel : ${balance.toFixed(2)} $ • ` +
        `${capitalTrades} trade(s)`;

    capitalNameInput.value =
        activeCapital.name;

    initialCapitalInput.value =
        activeCapital.initialCapital;
}

// ==========================================
// DASHBOARD
// ==========================================

function updateDashboard() {

    const filteredTrades =
        getFilteredTrades();

    const totalTrades =
        filteredTrades.length;

    const totalProfit =
        filteredTrades.reduce(
            (sum, trade) =>
                sum + (Number(trade.profit) || 0),
            0
        );

    const winningTrades =
        filteredTrades.filter(
            trade => trade.result === "TP"
        ).length;

    const winrate =
        totalTrades > 0
            ? (winningTrades / totalTrades) * 100
            : 0;

    const validRR =
        filteredTrades
            .map(trade => Number(trade.rr))
            .filter(rr => rr > 0);

    const averageRR =
        validRR.length > 0
            ? validRR.reduce(
                (sum, rr) => sum + rr,
                0
            ) / validRR.length
            : 0;

    /*
     * Le solde reste celui du capital entier,
     * même lorsqu'on regarde une période.
     */

    const balance =
        getCurrentBalance();

    balanceElement.textContent =
        formatMoney(balance);

    totalProfitElement.textContent =
        formatMoney(totalProfit);

    winrateElement.textContent =
        `${winrate.toFixed(1)}%`;

    averageRRElement.textContent =
        formatRR(averageRR);

    totalTradesElement.textContent =
        totalTrades;

    updateBestSetup(filteredTrades);

    updateSetupTable(filteredTrades);
}

// ==========================================
// MEILLEUR SETUP
// ==========================================

function updateBestSetup(filteredTrades) {

    if (filteredTrades.length === 0) {

        bestSetupElement.textContent = "-";

        bestSetupDetailsElement.textContent =
            "Aucun trade";

        return;
    }

    const setups = {};

    filteredTrades.forEach(trade => {

        const setup =
            trade.setup || "Non défini";

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

    const ranking =
        Object.entries(setups)
            .map(([name, data]) => {

                return {

                    name,

                    total: data.total,

                    wins: data.wins,

                    winrate:
                        data.total > 0
                            ? (
                                data.wins /
                                data.total
                            ) * 100
                            : 0
                };
            })
            .sort((a, b) => {

                if (
                    b.winrate !==
                    a.winrate
                ) {

                    return (
                        b.winrate -
                        a.winrate
                    );
                }

                return (
                    b.total -
                    a.total
                );
            });

    const best =
        ranking[0];

    bestSetupElement.textContent =
        best.name;

    bestSetupDetailsElement.textContent =
        `${best.winrate.toFixed(1)}% de winrate • ` +
        `${best.total} trade(s)`;
}

// ==========================================
// TABLEAU SETUPS
// ==========================================

function updateSetupTable(filteredTrades) {

    setupList.innerHTML = "";

    const setups = {};

    filteredTrades.forEach(trade => {

        const setup =
            trade.setup || "Non défini";

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

        setups[setup].profit +=
            Number(trade.profit) || 0;
    });

    const sorted =
        Object.entries(setups)
            .map(([name, data]) => {

                return {

                    name,

                    total: data.total,

                    wins: data.wins,

                    profit: data.profit,

                    winrate:
                        data.total > 0
                            ? (
                                data.wins /
                                data.total
                            ) * 100
                            : 0
                };
            })
            .sort(
                (a, b) =>
                    b.winrate -
                    a.winrate
            );

    if (sorted.length === 0) {

        setupList.innerHTML = `
            <tr>
                <td colspan="5">
                    Aucun setup utilisé
                </td>
            </tr>
        `;

        return;
    }

    sorted.forEach(setup => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${setup.name}</td>
            <td>${setup.total}</td>
            <td>${setup.wins}</td>
            <td>${setup.winrate.toFixed(1)}%</td>
            <td>${formatMoney(setup.profit)}</td>
        `;

        setupList.appendChild(row);
    });
}

// ==========================================
// HISTORIQUE
// ==========================================

function renderTrades() {

    const filteredTrades =
        getFilteredTrades();

    tradeList.innerHTML = "";

    if (filteredTrades.length === 0) {

        emptyMessage.style.display =
            "block";

        return;
    }

    emptyMessage.style.display =
        "block";

    emptyMessage.style.display =
        "none";

    filteredTrades
        .slice()
        .reverse()
        .forEach(trade => {

            const row =
                document.createElement("tr");

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

                <td class="${resultClass}">
                    ${trade.result || "-"}
                </td>

                <td>
                    ${formatMoney(trade.profit)}
                </td>

                <td>
                    <button
                        class="delete-btn"
                        onclick="deleteTrade('${trade.id}')"
                        title="Supprimer">

                        🗑️

                    </button>
                </td>
            `;

            tradeList.appendChild(row);
        });
}

// ==========================================
// AJOUT TRADE
// ==========================================

form?.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const entry =
            parseFloat(entryInput.value);

        const sl =
            parseFloat(slInput.value);

        const tp =
            parseFloat(tpInput.value);

        let rr = 0;

        if (
            !Number.isNaN(entry) &&
            !Number.isNaN(sl) &&
            !Number.isNaN(tp)
        ) {

            const risk =
                Math.abs(entry - sl);

            const reward =
                Math.abs(tp - entry);

            if (risk > 0) {

                rr =
                    reward / risk;
            }
        }

        const trade = {

            id: Date.now().toString(),

            capitalId:
                activeCapital.id,

            date:
                dateInput.value,

            asset:
                assetInput.value.trim(),

            direction:
                directionInput.value,

            orderType:
                orderTypeInput.value,

            entry,

            sl,

            tp,

            rr,

            setup:
                setupInput.value,

            result:
                resultInput.value,

            profit:
                parseFloat(profitInput.value) || 0,

            comment:
                commentInput.value.trim()
        };

        trades.push(trade);

        saveTrades();

        form.reset();

        setTodayDate();

        rrInput.value =
            "0.00";

        updateCapitalDisplay();

        updateDashboard();

        renderTrades();
    }
);

// ==========================================
// SUPPRIMER UN TRADE
// ==========================================

function deleteTrade(id) {

    const confirmation =
        confirm(
            "Voulez-vous vraiment supprimer ce trade ?"
        );

    if (!confirmation) {

        return;
    }

    trades =
        trades.filter(
            trade =>
                trade.id !== id
        );

    saveTrades();

    updateCapitalDisplay();

    updateDashboard();

    renderTrades();
}

// ==========================================
// SUPPRIMER TOUS LES TRADES DU CAPITAL
// ==========================================

clearBtn?.addEventListener(
    "click",
    function() {

        if (trades.length === 0) {

            alert(
                "Il n'y a aucun trade dans ce capital."
            );

            return;
        }

        const confirmation =
            confirm(
                "ATTENTION : tous les trades du capital actif seront supprimés. Continuer ?"
            );

        if (!confirmation) {

            return;
        }

        trades = [];

        saveTrades();

        updateCapitalDisplay();

        updateDashboard();

        renderTrades();
    }
);

// ==========================================
// ENREGISTRER LES INFOS DU CAPITAL
// ==========================================

saveCapitalBtn?.addEventListener(
    "click",
    function() {

        const name =
            capitalNameInput.value.trim();

        const initial =
            parseFloat(
                initialCapitalInput.value
            );

        if (!name) {

            alert(
                "Veuillez donner un nom au capital."
            );

            return;
        }

        if (
            Number.isNaN(initial) ||
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

        updateCapitalDisplay();

        updateDashboard();

        alert(
            "Capital enregistré avec succès."
        );
    }
);

// ==========================================
// OUVRIR MODALE NOUVEAU CAPITAL
// ==========================================

newCapitalBtn?.addEventListener(
    "click",
    function() {

        newCapitalNameInput.value = "";

        newInitialCapitalInput.value = "";

        capitalModal.classList.remove(
            "hidden"
        );

        newCapitalNameInput.focus();
    }
);

// ==========================================
// FERMER MODALE
// ==========================================

cancelCapitalBtn?.addEventListener(
    "click",
    function() {

        capitalModal.classList.add(
            "hidden"
        );
    }
);

// ==========================================
// CREER NOUVEAU CAPITAL
// ==========================================

confirmCapitalBtn?.addEventListener(
    "click",
    function() {

        const name =
            newCapitalNameInput.value.trim();

        const initial =
            parseFloat(
                newInitialCapitalInput.value
            );

        if (!name) {

            alert(
                "Veuillez donner un nom au nouveau capital."
            );

            return;
        }

        if (
            Number.isNaN(initial) ||
            initial < 0
        ) {

            alert(
                "Veuillez entrer un capital initial valide."
            );

            return;
        }

        /*
         * L'ancien capital est automatiquement archivé
         * avant de créer le nouveau.
         */

        archiveCurrentCapital(false);

        activeCapital = {

            id: Date.now().toString(),

            name,

            initialCapital:
                initial,

            createdAt:
                new Date().toISOString()
        };

        trades = [];

        saveActiveCapital();

        saveTrades();

        capitalModal.classList.add(
            "hidden"
        );

        currentPeriod = "today";

        document
            .querySelectorAll(
                ".period-btn"
            )
            .forEach(button => {

                button.classList.remove(
                    "active"
                );
            });

        const todayButton =
            document.querySelector(
                '[data-period="today"]'
            );

        todayButton?.classList.add(
            "active"
        );

        updateCapitalDisplay();

        updateDashboard();

        renderTrades();

        renderArchives();

        alert(
            `Nouveau capital "${name}" créé.`
        );
    }
);

// ==========================================
// ARCHIVER LE CAPITAL ACTUEL
// ==========================================

archiveCapitalBtn?.addEventListener(
    "click",
    function() {

        if (trades.length === 0) {

            const confirmation =
                confirm(
                    "Ce capital ne contient aucun trade. Voulez-vous quand même l'archiver ?"
                );

            if (!confirmation) {

                return;
            }
        }

        const confirmation =
            confirm(
                `Archiver "${activeCapital.name}" et tous ses trades ?`
            );

        if (!confirmation) {

            return;
        }

        archiveCurrentCapital(true);

        activeCapital = {

            id: Date.now().toString(),

            name:
                `Capital ${archives.length + 1}`,

            initialCapital: 0,

            createdAt:
                new Date().toISOString()
        };

        trades = [];

        saveActiveCapital();

        saveTrades();

        updateCapitalDisplay();

        updateDashboard();

        renderTrades();

        renderArchives();

        alert(
            "Capital archivé avec succès. Un nouveau capital vide est maintenant actif."
        );
    }
);

// ==========================================
// FONCTION ARCHIVAGE
// ==========================================

function archiveCurrentCapital(showMessage) {

    const finalProfit =
        getCapitalProfit();

    const finalBalance =
        getCurrentBalance();

    const totalTrades =
        trades.length;

    const wins =
        trades.filter(
            trade =>
                trade.result === "TP"
        ).length;

    const winrate =
        totalTrades > 0
            ? (
                wins /
                totalTrades
            ) * 100
            : 0;

    const archive = {

        id:
            activeCapital.id,

        name:
            activeCapital.name,

        initialCapital:
            Number(
                activeCapital.initialCapital
            ) || 0,

        finalBalance,

        totalProfit:
            finalProfit,

        totalTrades,

        winrate,

        createdAt:
            activeCapital.createdAt,

        archivedAt:
            new Date().toISOString(),

        trades:
            JSON.parse(
                JSON.stringify(trades)
            )
    };

    archives.push(archive);

    saveArchives();

    if (showMessage) {

        console.log(
            "Capital archivé :",
            archive
        );
    }
}

// ==========================================
// AFFICHAGE DES ARCHIVES
// ==========================================

function renderArchives() {

    archivesList.innerHTML = "";

    if (archives.length === 0) {

        emptyArchives.style.display =
            "block";

        return;
    }

    emptyArchives.style.display =
        "none";

    archives
        .slice()
        .reverse()
        .forEach(archive => {

            const card =
                document.createElement("div");

            card.className =
                "archive-card";

            const archivedDate =
                archive.archivedAt
                    ? new Date(
                        archive.archivedAt
                    ).toLocaleDateString(
                        "fr-FR"
                    )
                    : "-";

            card.innerHTML = `

                <div class="archive-card-header">

                    <div>

                        <h3>
                            📦 ${archive.name}
                        </h3>

                        <div class="archive-date">
                            Archivé le ${archivedDate}
                        </div>

                    </div>

                </div>


                <div class="archive-stats">

                    <div class="archive-stat">

                        <span>
                            Capital initial
                        </span>

                        <strong>
                            ${Number(
                                archive.initialCapital
                            ).toFixed(2)} $
                        </strong>

                    </div>


                    <div class="archive-stat">

                        <span>
                            Solde final
                        </span>

                        <strong>
                            ${Number(
                                archive.finalBalance
                            ).toFixed(2)} $
                        </strong>

                    </div>


                    <div class="archive-stat">

                        <span>
                            Profit
                        </span>

                        <strong>
                            ${formatMoney(
                                archive.totalProfit
                            )}
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
                            ${Number(
                                archive.winrate
                            ).toFixed(1)}%
                        </strong>

                    </div>

                </div>


                <div class="archive-actions">

                    <button
                        class="archive-view-btn"
                        onclick="viewArchive('${archive.id}')">

                        👁️ Voir

                    </button>


                    <button
                        class="archive-delete-btn"
                        onclick="deleteArchive('${archive.id}')">

                        🗑️ Supprimer

                    </button>

                </div>
            `;

            archivesList.appendChild(card);
        });
}

// ==========================================
// VOIR UNE ARCHIVE
// ==========================================

function viewArchive(id) {

    const archive =
        archives.find(
            item =>
                item.id === id
        );

    if (!archive) {

        alert(
            "Archive introuvable."
        );

        return;
    }

    const profit =
        Number(
            archive.totalProfit
        ) || 0;

    const balance =
        Number(
            archive.finalBalance
        ) || 0;

    const winrate =
        Number(
            archive.winrate
        ) || 0;

    alert(
        `📦 ${archive.name}\n\n` +

        `Capital initial : ` +
        `${Number(
            archive.initialCapital
        ).toFixed(2)} $\n` +

        `Solde final : ` +
        `${balance.toFixed(2)} $\n` +

        `Profit total : ` +
        `${formatMoney(profit)}\n` +

        `Nombre de trades : ` +
        `${archive.totalTrades}\n` +

        `Winrate : ` +
        `${winrate.toFixed(1)}%\n\n` +

        `L'historique complet de ` +
        `${archive.totalTrades} trade(s) ` +
        `est conservé dans cette archive.`
    );
}

// ==========================================
// SUPPRIMER UNE ARCHIVE
// ==========================================

function deleteArchive(id) {

    const confirmation =
        confirm(
            "Supprimer définitivement cette archive et tous ses trades ?"
        );

    if (!confirmation) {

        return;
    }

    archives =
        archives.filter(
            archive =>
                archive.id !== id
        );

    saveArchives();

    renderArchives();
}

// ==========================================
// PERIODES
// ==========================================

const periodButtons =
    document.querySelectorAll(
        "[data-period]"
    );

periodButtons.forEach(button => {

    button.addEventListener(
        "click",
        function() {

            periodButtons.forEach(
                btn =>
                    btn.classList.remove(
                        "active"
                    )
            );

            this.classList.add(
                "active"
            );

            currentPeriod =
                this.dataset.period;

            updateDashboard();

            renderTrades();
        }
    );
});

// ==========================================
// MODE SOMBRE / CLAIR
// ==========================================

themeBtn?.addEventListener(
    "click",
    function() {

        document.body.classList.toggle(
            "light"
        );

        const isLight =
            document.body.classList.contains(
                "light"
            );

        localStorage.setItem(
            THEME_KEY,
            isLight
                ? "light"
                : "dark"
        );

        updateThemeButton();
    }
);

function updateThemeButton() {

    if (!themeBtn) {

        return;
    }

    const isLight =
        document.body.classList.contains(
            "light"
        );

    themeBtn.textContent =
        isLight
            ? "☀️"
            : "🌙";
}

const savedTheme =
    localStorage.getItem(
        THEME_KEY
    );

if (savedTheme === "light") {

    document.body.classList.add(
        "light"
    );
}

updateThemeButton();

// ==========================================
// INITIALISATION
// ==========================================

setTodayDate();

updateCapitalDisplay();

updateDashboard();

renderTrades();

renderArchives();

console.log(
    "Trading Dashboard - système Capital & Archives chargé."
);
