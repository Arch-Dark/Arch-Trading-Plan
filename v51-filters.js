"use strict";

/*
============================================================
V5.1 — ANALYSE FILTRÉE
Trading Dashboard
============================================================

Filtres disponibles :
- Période
- Actif
- Setup

Les 3 filtres fonctionnent ensemble.

Exemple :
Ce mois + XAUUSD + LDP+QML
============================================================
*/

(function () {

    const FILTER_PERIODS = [
        {
            value: "today",
            label: "Aujourd'hui"
        },
        {
            value: "week",
            label: "Cette semaine"
        },
        {
            value: "month",
            label: "Ce mois"
        },
        {
            value: "year",
            label: "Cette année"
        },
        {
            value: "all",
            label: "Tout l'historique"
        }
    ];


    const FILTER_ASSETS = [
        "Tous les actifs",
        "EUR/USD",
        "GBP/USD",
        "AUD/USD",
        "NZD/USD",
        "USD/CAD",
        "USD/CHF",
        "USD/JPY",
        "XAUUSD",
        "BTCUSD"
    ];


    const FILTER_SETUPS = [
        "Tous les setups",
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


    let selectedPeriod = "today";
    let selectedAsset = "ALL";
    let selectedSetup = "ALL";



    /*
    ============================================================
    UTILITAIRES
    ============================================================
    */

    function money(value) {

        const number = Number(value) || 0;

        return "$" + number.toFixed(2);

    }


    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function getAllTrades() {

        if (
            typeof trades !== "undefined" &&
            Array.isArray(trades)
        ) {

            return trades;

        }


        try {

            return JSON.parse(
                localStorage.getItem("tradingTrades")
            ) || [];

        } catch {

            return [];

        }

    }


    function getCurrentCapitalId() {

        if (
            typeof activeCapital !== "undefined" &&
            activeCapital
        ) {

            return activeCapital.id;

        }


        try {

            const capital =
                JSON.parse(
                    localStorage.getItem(
                        "tradingActiveCapital"
                    )
                );

            return capital?.id || null;

        } catch {

            return null;

        }

    }


    function getCurrentCapitalTrades() {

        const capitalId =
            getCurrentCapitalId();


        return getAllTrades().filter(
            trade =>
                trade.capitalId === capitalId
        );

    }



    /*
    ============================================================
    FILTRE PERIODE
    ============================================================
    */

    function filterBySelectedPeriod(
        tradeList
    ) {

        if (
            selectedPeriod === "all"
        ) {

            return tradeList;

        }


        return tradeList.filter(
            trade => {

                if (!trade.date) {
                    return false;
                }


                const tradeDate =
                    new Date(
                        trade.date +
                        "T00:00:00"
                    );


                const today =
                    new Date();


                if (
                    Number.isNaN(
                        tradeDate.getTime()
                    )
                ) {

                    return false;

                }


                /*
                ============================
                AUJOURD'HUI
                ============================
                */

                if (
                    selectedPeriod ===
                    "today"
                ) {

                    return (
                        tradeDate.getFullYear() ===
                            today.getFullYear() &&

                        tradeDate.getMonth() ===
                            today.getMonth() &&

                        tradeDate.getDate() ===
                            today.getDate()
                    );

                }


                /*
                ============================
                CETTE SEMAINE
                ============================
                */

                if (
                    selectedPeriod ===
                    "week"
                ) {

                    const day =
                        today.getDay();


                    const diffToMonday =
                        day === 0
                            ? 6
                            : day - 1;


                    const monday =
                        new Date(today);


                    monday.setHours(
                        0,
                        0,
                        0,
                        0
                    );


                    monday.setDate(
                        today.getDate() -
                        diffToMonday
                    );


                    const nextMonday =
                        new Date(monday);


                    nextMonday.setDate(
                        monday.getDate() +
                        7
                    );


                    return (
                        tradeDate >=
                            monday &&
                        tradeDate <
                            nextMonday
                    );

                }


                /*
                ============================
                CE MOIS
                ============================
                */

                if (
                    selectedPeriod ===
                    "month"
                ) {

                    return (
                        tradeDate.getFullYear() ===
                            today.getFullYear() &&

                        tradeDate.getMonth() ===
                            today.getMonth()
                    );

                }


                /*
                ============================
                CETTE ANNEE
                ============================
                */

                if (
                    selectedPeriod ===
                    "year"
                ) {

                    return (
                        tradeDate.getFullYear() ===
                        today.getFullYear()
                    );

                }


                return true;

            }
        );

    }



    /*
    ============================================================
    FILTRES COMBINES
    ============================================================
    */

    function applyCombinedFilters(
        tradeList
    ) {

        let filtered =
            filterBySelectedPeriod(
                tradeList
            );


        /*
        FILTRE ACTIF
        */

        if (
            selectedAsset !== "ALL"
        ) {

            filtered =
                filtered.filter(
                    trade =>
                        trade.asset ===
                        selectedAsset
                );

        }


        /*
        FILTRE SETUP
        */

        if (
            selectedSetup !== "ALL"
        ) {

            filtered =
                filtered.filter(
                    trade =>
                        trade.setup ===
                        selectedSetup
                );

        }


        return filtered;

    }



    /*
    ============================================================
    STATISTIQUES
    ============================================================
    */

    function calculateStats(
        tradeList
    ) {

        const tradesCount =
            tradeList.length;


        const winners =
            tradeList.filter(
                trade =>
                    trade.result === "TP"
            ).length;


        const losers =
            tradeList.filter(
                trade =>
                    trade.result === "SL"
            ).length;


        const breakevens =
            tradeList.filter(
                trade =>
                    trade.result === "BE"
            ).length;


        const profit =
            tradeList.reduce(
                (
                    sum,
                    trade
                ) =>
                    sum +
                    (
                        Number(
                            trade.pnl
                        ) || 0
                    ),
                0
            );


        const winrate =
            tradesCount > 0
                ? (
                    winners /
                    tradesCount
                ) * 100
                : 0;


        const rrValues =
            tradeList
                .map(
                    trade =>
                        Number(
                            trade.rr
                        )
                )
                .filter(
                    rr =>
                        Number.isFinite(
                            rr
                        ) &&
                        rr > 0
                );


        const averageRR =
            rrValues.length > 0
                ? rrValues.reduce(
                    (
                        sum,
                        rr
                    ) =>
                        sum + rr,
                    0
                ) / rrValues.length
                : 0;


        return {

            trades:
                tradesCount,

            winners:
                winners,

            losers:
                losers,

            breakevens:
                breakevens,

            profit:
                profit,

            winrate:
                winrate,

            averageRR:
                averageRR

        };

    }



    /*
    ============================================================
    CREATION DE L'INTERFACE
    ============================================================
    */

    function createFilterInterface() {

        if (
            document.getElementById(
                "v51Filters"
            )
        ) {

            return;

        }


        const setupBody =
            document.getElementById(
                "setupTableBody"
            );


        if (!setupBody) {

            return;

        }


        const setupCard =
            setupBody.closest(
                ".card"
            );


        if (!setupCard) {

            return;

        }


        const filterCard =
            document.createElement(
                "section"
            );


        filterCard.className =
            "card v51-filter-card";


        filterCard.id =
            "v51Filters";


        filterCard.innerHTML = `

            <div class="section-header">

                <div>

                    <h2>
                        🔎 Analyse filtrée
                    </h2>

                    <p>
                        Combinez période, actif et setup
                    </p>

                </div>

            </div>


            <div
                class="v51-filter-grid"
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(
                            auto-fit,
                            minmax(
                                180px,
                                1fr
                            )
                        );
                    gap:16px;
                    margin-bottom:20px;
                "
            >


                <!-- PERIODE -->

                <div>

                    <label
                        for="v51PeriodFilter"
                    >
                        Période
                    </label>

                    <select
                        id="v51PeriodFilter"
                    >

                        ${FILTER_PERIODS
                            .map(
                                period => `
                                    <option
                                        value="${period.value}"
                                    >
                                        ${period.label}
                                    </option>
                                `
                            )
                            .join("")
                        }

                    </select>

                </div>



                <!-- ACTIF -->

                <div>

                    <label
                        for="v51AssetFilter"
                    >
                        Actif
                    </label>

                    <select
                        id="v51AssetFilter"
                    >

                        ${FILTER_ASSETS
                            .map(
                                asset => `

                                    <option
                                        value="${
                                            asset ===
                                            "Tous les actifs"
                                                ? "ALL"
                                                : asset
                                        }"
                                    >
                                        ${escapeHtml(
                                            asset
                                        )}
                                    </option>

                                `
                            )
                            .join("")
                        }

                    </select>

                </div>



                <!-- SETUP -->

                <div>

                    <label
                        for="v51SetupFilter"
                    >
                        Setup
                    </label>

                    <select
                        id="v51SetupFilter"
                    >

                        ${FILTER_SETUPS
                            .map(
                                setup => `

                                    <option
                                        value="${
                                            setup ===
                                            "Tous les setups"
                                                ? "ALL"
                                                : setup
                                        }"
                                    >
                                        ${escapeHtml(
                                            setup
                                        )}
                                    </option>

                                `
                            )
                            .join("")
                        }

                    </select>

                </div>


            </div>


            <!-- RESUME -->

            <div
                id="v51FilterSummary"
                class="v51-filter-summary"
                style="
                    margin-bottom:20px;
                    padding:14px;
                    border-radius:10px;
                    background:
                        rgba(
                            148,
                            163,
                            184,
                            0.10
                        );
                "
            >
            </div>



            <!-- STATISTIQUES -->

            <div
                id="v51Stats"
                class="stats-grid v51-filter-stats"
            >


                <div class="stat-box">

                    <span>
                        Trades
                    </span>

                    <strong
                        id="v51Trades"
                    >
                        0
                    </strong>

                </div>



                <div class="stat-box">

                    <span>
                        Gagnants
                    </span>

                    <strong
                        id="v51Winners"
                    >
                        0
                    </strong>

                </div>



                <div class="stat-box">

                    <span>
                        Perdants
                    </span>

                    <strong
                        id="v51Losers"
                    >
                        0
                    </strong>

                </div>



                <div class="stat-box">

                    <span>
                        BE
                    </span>

                    <strong
                        id="v51BE"
                    >
                        0
                    </strong>

                </div>



                <div class="stat-box">

                    <span>
                        Winrate
                    </span>

                    <strong
                        id="v51Winrate"
                    >
                        0%
                    </strong>

                </div>



                <div class="stat-box">

                    <span>
                        Profit
                    </span>

                    <strong
                        id="v51Profit"
                    >
                        $0.00
                    </strong>

                </div>



                <div class="stat-box">

                    <span>
                        RR moyen
                    </span>

                    <strong
                        id="v51RR"
                    >
                        0.00
                    </strong>

                </div>


            </div>

        `;


        /*
        Insérer la carte après Performance
        */

        const performanceButtons =
            document.querySelector(
                ".period-buttons"
            );


        const performanceCard =
            performanceButtons
                ? performanceButtons.closest(
                    ".card"
                )
                : null;


        if (
            performanceCard
        ) {

            performanceCard.parentNode.insertBefore(
                filterCard,
                performanceCard.nextSibling
            );

        } else {

            setupCard.parentNode.insertBefore(
                filterCard,
                setupCard
            );

        }



        /*
        EVENEMENT PERIODE
        */

        const periodSelect =
            document.getElementById(
                "v51PeriodFilter"
            );


        if (periodSelect) {

            periodSelect.addEventListener(
                "change",
                function () {

                    selectedPeriod =
                        this.value;

                    refreshV51();

                }
            );

        }



        /*
        EVENEMENT ACTIF
        */

        const assetSelect =
            document.getElementById(
                "v51AssetFilter"
            );


        if (assetSelect) {

            assetSelect.addEventListener(
                "change",
                function () {

                    selectedAsset =
                        this.value;

                    refreshV51();

                }
            );

        }



        /*
        EVENEMENT SETUP
        */

        const setupSelect =
            document.getElementById(
                "v51SetupFilter"
            );


        if (setupSelect) {

            setupSelect.addEventListener(
                "change",
                function () {

                    selectedSetup =
                        this.value;

                    refreshV51();

                }
            );

        }

    }



    /*
    ============================================================
    RESUME DES FILTRES
    ============================================================
    */

    function updateSummary() {

        const summary =
            document.getElementById(
                "v51FilterSummary"
            );


        if (!summary) {

            return;

        }


        const period =
            FILTER_PERIODS.find(
                item =>
                    item.value ===
                    selectedPeriod
            );


        const periodLabel =
            period
                ? period.label
                : "Tout l'historique";


        const assetLabel =
            selectedAsset === "ALL"
                ? "Tous les actifs"
                : selectedAsset;


        const setupLabel =
            selectedSetup === "ALL"
                ? "Tous les setups"
                : selectedSetup;


        summary.innerHTML = `

            <strong>
                Filtres actifs :
            </strong>

            <span
                style="
                    display:inline-block;
                    margin-left:8px;
                "
            >
                📅
                ${escapeHtml(
                    periodLabel
                )}
            </span>

            <span
                style="
                    display:inline-block;
                    margin-left:8px;
                "
            >
                🌍
                ${escapeHtml(
                    assetLabel
                )}
            </span>

            <span
                style="
                    display:inline-block;
                    margin-left:8px;
                "
            >
                🎯
                ${escapeHtml(
                    setupLabel
                )}
            </span>

        `;

    }



    /*
    ============================================================
    MISE A JOUR STATISTIQUES
    ============================================================
    */

    function refreshV51() {

        const currentTrades =
            getCurrentCapitalTrades();


        const filteredTrades =
            applyCombinedFilters(
                currentTrades
            );


        const stats =
            calculateStats(
                filteredTrades
            );



        const tradesElement =
            document.getElementById(
                "v51Trades"
            );


        const winnersElement =
            document.getElementById(
                "v51Winners"
            );


        const losersElement =
            document.getElementById(
                "v51Losers"
            );


        const beElement =
            document.getElementById(
                "v51BE"
            );


        const winrateElement =
            document.getElementById(
                "v51Winrate"
            );


        const profitElement =
            document.getElementById(
                "v51Profit"
            );


        const rrElement =
            document.getElementById(
                "v51RR"
            );



        if (tradesElement) {

            tradesElement.textContent =
                stats.trades;

        }


        if (winnersElement) {

            winnersElement.textContent =
                stats.winners;

        }


        if (losersElement) {

            losersElement.textContent =
                stats.losers;

        }


        if (beElement) {

            beElement.textContent =
                stats.breakevens;

        }


        if (winrateElement) {

            winrateElement.textContent =
                stats.winrate.toFixed(1) +
                "%";

        }


        if (profitElement) {

            profitElement.textContent =
                money(stats.profit);

        }


        if (rrElement) {

            rrElement.textContent =
                stats.averageRR.toFixed(2);

        }


        updateSummary();

        updateFilteredTables(
            filteredTrades
        );

    }



    /*
    ============================================================
    TABLEAUX
    ============================================================
    */

    function updateFilteredTables(
        filteredTrades
    ) {

        /*
        Lorsque l'actif est choisi,
        le tableau Setup devient
        l'analyse des setups de cet actif.

        Lorsque le setup est choisi,
        le tableau Actif devient
        l'analyse des actifs avec ce setup.

        Lorsque les deux sont choisis,
        chacun affiche uniquement
        la combinaison sélectionnée.
        */


        const setupBody =
            document.getElementById(
                "setupTableBody"
            );


        if (
            setupBody &&
            (
                selectedAsset !== "ALL" ||
                selectedSetup !== "ALL"
            )
        ) {

            renderFilteredSetupTable(
                filteredTrades
            );

        } else if (
            typeof window.updateSetupTable ===
            "function"
        ) {

            /*
            On laisse le dashboard principal
            afficher son tableau normal.
            */

        }



        const assetBody =
            document.getElementById(
                "assetTableBody"
            );


        if (
            assetBody &&
            (
                selectedAsset !== "ALL" ||
                selectedSetup !== "ALL"
            )
        ) {

            renderFilteredAssetTable(
                filteredTrades
            );

        }

    }



    /*
    ============================================================
    TABLE SETUPS
    ============================================================
    */

    function renderFilteredSetupTable(
        tradeList
    ) {

        const tbody =
            document.getElementById(
                "setupTableBody"
            );


        if (!tbody) {

            return;

        }


        const grouped = {};



        tradeList.forEach(
            trade => {

                const setup =
                    trade.setup || "-";


                if (
                    !grouped[setup]
                ) {

                    grouped[setup] = {

                        trades: 0,

                        winners: 0,

                        profit: 0,

                        rr: []

                    };

                }


                grouped[setup].trades++;


                if (
                    trade.result === "TP"
                ) {

                    grouped[
                        setup
                    ].winners++;

                }


                grouped[setup].profit +=
                    Number(
                        trade.pnl
                    ) || 0;


                const rr =
                    Number(
                        trade.rr
                    );


                if (
                    Number.isFinite(rr) &&
                    rr > 0
                ) {

                    grouped[
                        setup
                    ].rr.push(rr);

                }

            }
        );



        tbody.innerHTML = "";



        const entries =
            Object.entries(
                grouped
            );



        if (
            entries.length === 0
        ) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        class="empty-table"
                    >
                        Aucun résultat pour ces filtres.
                    </td>

                </tr>

            `;

            return;

        }



        entries
            .sort(
                (a, b) =>
                    b[1].profit -
                    a[1].profit
            )
            .forEach(
                ([setup, stats]) => {

                    const winrate =
                        stats.trades > 0
                            ? (
                                stats.winners /
                                stats.trades
                            ) * 100
                            : 0;


                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <td>
                            ${escapeHtml(
                                setup
                            )}
                        </td>

                        <td>
                            ${stats.trades}
                        </td>

                        <td>
                            ${stats.winners}
                        </td>

                        <td>
                            ${winrate.toFixed(
                                1
                            )}%
                        </td>

                        <td>
                            ${money(
                                stats.profit
                            )}
                        </td>

                    `;


                    tbody.appendChild(
                        row
                    );

                }
            );

    }



    /*
    ============================================================
    TABLE ACTIFS
    ============================================================
    */

    function renderFilteredAssetTable(
        tradeList
    ) {

        const tbody =
            document.getElementById(
                "assetTableBody"
            );


        if (!tbody) {

            return;

        }


        const grouped = {};



        tradeList.forEach(
            trade => {

                const asset =
                    trade.asset || "-";


                if (
                    !grouped[asset]
                ) {

                    grouped[asset] = {

                        trades: 0,

                        winners: 0,

                        losers: 0,

                        be: 0,

                        profit: 0,

                        rr: [],

                        pnl: []

                    };

                }


                grouped[asset].trades++;


                if (
                    trade.result === "TP"
                ) {

                    grouped[
                        asset
                    ].winners++;

                }


                if (
                    trade.result === "SL"
                ) {

                    grouped[
                        asset
                    ].losers++;

                }


                if (
                    trade.result === "BE"
                ) {

                    grouped[
                        asset
                    ].be++;

                }


                grouped[asset].profit +=
                    Number(
                        trade.pnl
                    ) || 0;


                grouped[asset].pnl.push(
                    Number(
                        trade.pnl
                    ) || 0
                );


                const rr =
                    Number(
                        trade.rr
                    );


                if (
                    Number.isFinite(rr) &&
                    rr > 0
                ) {

                    grouped[
                        asset
                    ].rr.push(rr);

                }

            }
        );



        tbody.innerHTML = "";



        const entries =
            Object.entries(
                grouped
            );



        if (
            entries.length === 0
        ) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="10"
                        class="empty-table"
                    >
                        Aucun résultat pour ces filtres.
                    </td>

                </tr>

            `;

            return;

        }



        entries
            .sort(
                (a, b) =>
                    b[1].profit -
                    a[1].profit
            )
            .forEach(
                ([asset, stats]) => {

                    const winrate =
                        stats.trades > 0
                            ? (
                                stats.winners /
                                stats.trades
                            ) * 100
                            : 0;


                    const averageRR =
                        stats.rr.length > 0
                            ? stats.rr.reduce(
                                (
                                    sum,
                                    rr
                                ) =>
                                    sum + rr,
                                0
                            ) /
                            stats.rr.length
                            : 0;


                    const best =
                        stats.pnl.length > 0
                            ? Math.max(
                                ...stats.pnl
                            )
                            : 0;


                    const worst =
                        stats.pnl.length > 0
                            ? Math.min(
                                ...stats.pnl
                            )
                            : 0;


                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <td>
                            ${escapeHtml(
                                asset
                            )}
                        </td>

                        <td>
                            ${stats.trades}
                        </td>

                        <td>
                            ${stats.winners}
                        </td>

                        <td>
                            ${stats.losers}
                        </td>

                        <td>
                            ${stats.be}
                        </td>

                        <td>
                            ${winrate.toFixed(
                                1
                            )}%
                        </td>

                        <td>
                            ${money(
                                stats.profit
                            )}
                        </td>

                        <td>
                            ${averageRR.toFixed(
                                2
                            )}
                        </td>

                        <td>
                            ${money(
                                best
                            )}
                        </td>

                        <td>
                            ${money(
                                worst
                            )}
                        </td>

                    `;


                    tbody.appendChild(
                        row
                    );

                }
            );

    }



    /*
    ============================================================
    INITIALISATION
    ============================================================
    */

    function initialize() {

        createFilterInterface();

        refreshV51();

    }



    /*
    On attend que app.js
    ait terminé son initialisation.
    */

    setTimeout(
        initialize,
        500
    );



    /*
    Synchronisation avec
    l'application principale.
    */

    setInterval(
        function () {

            refreshV51();

        },
        1000
    );

})();
