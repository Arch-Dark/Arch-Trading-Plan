"use strict";

/*
============================================================
V5.1 — FILTRES COMBINÉS
Trading Dashboard
============================================================

Fonctionnalités :
- Filtre période
- Filtre actif
- Filtre setup
- Combinaison des 3 filtres
- Recalcul automatique des statistiques
- Recalcul performance setup
- Recalcul performance actif
- Aucun changement aux données enregistrées
============================================================
*/

(function () {

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

        if (typeof trades !== "undefined" && Array.isArray(trades)) {
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
                    localStorage.getItem("tradingActiveCapital")
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
            trade => trade.capitalId === capitalId
        );
    }

    /*
    ============================================================
    FILTRE PERIODE
    ============================================================
    */

    function periodFilter(tradeList) {

        if (
            typeof filterByPeriod === "function"
        ) {

            return filterByPeriod(
                tradeList
            );
        }

        if (
            typeof currentPeriod === "undefined" ||
            currentPeriod === "all"
        ) {

            return tradeList;
        }

        return tradeList;
    }

    /*
    ============================================================
    FILTRE ACTIF + SETUP
    ============================================================
    */

    function applyCombinedFilters(tradeList) {

        let filtered = periodFilter(
            tradeList
        );

        if (selectedAsset !== "ALL") {

            filtered = filtered.filter(
                trade =>
                    trade.asset === selectedAsset
            );
        }

        if (selectedSetup !== "ALL") {

            filtered = filtered.filter(
                trade =>
                    trade.setup === selectedSetup
            );
        }

        return filtered;
    }

    /*
    ============================================================
    STATISTIQUES
    ============================================================
    */

    function calculateStats(tradeList) {

        const tradesCount =
            tradeList.length;

        const winners =
            tradeList.filter(
                trade => trade.result === "TP"
            ).length;

        const losers =
            tradeList.filter(
                trade => trade.result === "SL"
            ).length;

        const breakevens =
            tradeList.filter(
                trade => trade.result === "BE"
            ).length;

        const profit =
            tradeList.reduce(
                (sum, trade) =>
                    sum + (Number(trade.pnl) || 0),
                0
            );

        const winrate =
            tradesCount > 0
                ? (winners / tradesCount) * 100
                : 0;

        const rrValues =
            tradeList
                .map(trade => Number(trade.rr))
                .filter(
                    rr =>
                        Number.isFinite(rr) &&
                        rr > 0
                );

        const averageRR =
            rrValues.length > 0
                ? rrValues.reduce(
                    (sum, rr) => sum + rr,
                    0
                ) / rrValues.length
                : 0;

        return {
            trades: tradesCount,
            winners,
            losers,
            breakevens,
            profit,
            winrate,
            averageRR
        };
    }

    /*
    ============================================================
    INTERFACE FILTRES
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

        const performanceSection =
            document.querySelector(
                "#setupTableBody"
            );

        if (!performanceSection) {
            return;
        }

        const table =
            performanceSection.closest(
                ".card"
            );

        if (!table) {
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

            <div class="v51-filter-grid">

                <div>

                    <label for="v51AssetFilter">
                        Actif
                    </label>

                    <select
                        id="v51AssetFilter"
                    >

                        ${FILTER_ASSETS.map(
                            asset => `

                            <option
                                value="${
                                    asset === "Tous les actifs"
                                        ? "ALL"
                                        : escapeHtml(asset)
                                }"
                            >
                                ${escapeHtml(asset)}
                            </option>

                        `
                        ).join("")}

                    </select>

                </div>

                <div>

                    <label for="v51SetupFilter">
                        Setup
                    </label>

                    <select
                        id="v51SetupFilter"
                    >

                        ${FILTER_SETUPS.map(
                            setup => `

                            <option
                                value="${
                                    setup === "Tous les setups"
                                        ? "ALL"
                                        : escapeHtml(setup)
                                }"
                            >
                                ${escapeHtml(setup)}
                            </option>

                        `
                        ).join("")}

                    </select>

                </div>

            </div>

            <div
                id="v51FilterSummary"
                class="v51-filter-summary"
            >
            </div>

            <div
                id="v51Stats"
                class="stats-grid v51-filter-stats"
            >

                <div class="stat-box">

                    <span>
                        Trades
                    </span>

                    <strong id="v51Trades">
                        0
                    </strong>

                </div>

                <div class="stat-box">

                    <span>
                        Gagnants
                    </span>

                    <strong id="v51Winners">
                        0
                    </strong>

                </div>

                <div class="stat-box">

                    <span>
                        Perdants
                    </span>

                    <strong id="v51Losers">
                        0
                    </strong>

                </div>

                <div class="stat-box">

                    <span>
                        BE
                    </span>

                    <strong id="v51BE">
                        0
                    </strong>

                </div>

                <div class="stat-box">

                    <span>
                        Winrate
                    </span>

                    <strong id="v51Winrate">
                        0%
                    </strong>

                </div>

                <div class="stat-box">

                    <span>
                        Profit
                    </span>

                    <strong id="v51Profit">
                        $0.00
                    </strong>

                </div>

                <div class="stat-box">

                    <span>
                        RR moyen
                    </span>

                    <strong id="v51RR">
                        0.00
                    </strong>

                </div>

            </div>

        `;

        table.parentNode.insertBefore(
            filterCard,
            table
        );

        const assetSelect =
            document.getElementById(
                "v51AssetFilter"
            );

        const setupSelect =
            document.getElementById(
                "v51SetupFilter"
            );

        assetSelect.addEventListener(
            "change",
            function () {

                selectedAsset =
                    this.value;

                refreshV51();

            }
        );

        setupSelect.addEventListener(
            "change",
            function () {

                selectedSetup =
                    this.value;

                refreshV51();

            }
        );

        /*
        On place la carte juste après
        la section Performance.
        */

        const performanceCard =
            document.querySelector(
                ".period-buttons"
            )?.closest(
                ".card"
            );

        if (
            performanceCard &&
            performanceCard.nextSibling
        ) {

            performanceCard.parentNode.insertBefore(
                filterCard,
                performanceCard.nextSibling
            );

        }
    }

    /*
    ============================================================
    MISE A JOUR
    ============================================================
    */

    function refreshV51() {

        const allTrades =
            getCurrentCapitalTrades();

        const filteredTrades =
            applyCombinedFilters(
                allTrades
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
    RESUME FILTRE
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

        let periodLabel =
            "Tout l'historique";

        if (
            typeof currentPeriod !== "undefined"
        ) {

            if (
                currentPeriod === "today"
            ) {
                periodLabel =
                    "Aujourd'hui";
            }

            if (
                currentPeriod === "week"
            ) {
                periodLabel =
                    "Cette semaine";
            }

            if (
                currentPeriod === "month"
            ) {
                periodLabel =
                    "Ce mois";
            }

            if (
                currentPeriod === "year"
            ) {
                periodLabel =
                    "Cette année";
            }
        }

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

            <span>
                ${escapeHtml(periodLabel)}
            </span>

            <span>
                ${escapeHtml(assetLabel)}
            </span>

            <span>
                ${escapeHtml(setupLabel)}
            </span>
        `;
    }

    /*
    ============================================================
    TABLEAUX FILTRES
    ============================================================
    */

    function updateFilteredTables(
        filteredTrades
    ) {

        /*
        Cette V5.1 ne modifie pas
        les données originales.

        Elle recalcule seulement
        les informations affichées
        lorsque les fonctions du dashboard
        sont disponibles.
        */

        const setupBody =
            document.getElementById(
                "setupTableBody"
            );

        if (
            setupBody &&
            selectedAsset !== "ALL"
        ) {

            renderFilteredSetupTable(
                filteredTrades
            );
        }

        const assetBody =
            document.getElementById(
                "assetTableBody"
            );

        if (
            assetBody &&
            selectedSetup !== "ALL"
        ) {

            renderFilteredAssetTable(
                filteredTrades
            );
        }
    }

    /*
    ============================================================
    TABLE SETUP FILTRÉ
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

                if (!grouped[setup]) {

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
                    grouped[setup].winners++;
                }

                grouped[setup].profit +=
                    Number(trade.pnl) || 0;

                const rr =
                    Number(trade.rr);

                if (
                    Number.isFinite(rr) &&
                    rr > 0
                ) {
                    grouped[setup].rr.push(rr);
                }

            }
        );

        tbody.innerHTML = "";

        const entries =
            Object.entries(
                grouped
            );

        if (entries.length === 0) {

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

                    const row =
                        document.createElement(
                            "tr"
                        );

                    row.innerHTML = `

                        <td>
                            ${escapeHtml(setup)}
                        </td>

                        <td>
                            ${stats.trades}
                        </td>

                        <td>
                            ${stats.winners}
                        </td>

                        <td>
                            ${winrate.toFixed(1)}%
                        </td>

                        <td>
                            ${money(stats.profit)}
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
    TABLE ACTIF FILTRÉ
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

                if (!grouped[asset]) {

                    grouped[asset] = {
                        trades: 0,
                        winners: 0,
                        losers: 0,
                        be: 0,
                        profit: 0,
                        rr: []
                    };

                }

                grouped[asset].trades++;

                if (
                    trade.result === "TP"
                ) {

                    grouped[
                        asset
                    ].winners++;

                } else if (
                    trade.result === "SL"
                ) {

                    grouped[
                        asset
                    ].losers++;

                } else if (
                    trade.result === "BE"
                ) {

                    grouped[
                        asset
                    ].be++;

                }

                grouped[asset].profit +=
                    Number(trade.pnl) || 0;

                const rr =
                    Number(trade.rr);

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

        if (entries.length === 0) {

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

                    const pnlValues =
                        tradeList
                            .filter(
                                trade =>
                                    trade.asset ===
                                    asset
                            )
                            .map(
                                trade =>
                                    Number(
                                        trade.pnl
                                    ) || 0
                            );

                    const best =
                        pnlValues.length > 0
                            ? Math.max(
                                ...pnlValues
                            )
                            : 0;

                    const worst =
                        pnlValues.length > 0
                            ? Math.min(
                                ...pnlValues
                            )
                            : 0;

                    const row =
                        document.createElement(
                            "tr"
                        );

                    row.innerHTML = `

                        <td>
                            ${escapeHtml(asset)}
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
                            ${winrate.toFixed(1)}%
                        </td>

                        <td>
                            ${money(stats.profit)}
                        </td>

                        <td>
                            ${averageRR.toFixed(2)}
                        </td>

                        <td>
                            ${money(best)}
                        </td>

                        <td>
                            ${money(worst)}
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
    SURVEILLANCE DES CHANGEMENTS DE PERIODE
    ============================================================
    */

    function hookPeriodButtons() {

        document
            .querySelectorAll(
                ".period-btn"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        function () {

                            setTimeout(
                                refreshV51,
                                0
                            );

                        }
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

        hookPeriodButtons();

        refreshV51();

    }

    /*
    L'application principale
    doit avoir fini de charger.
    */

    setTimeout(
        initialize,
        300
    );

    /*
    Rafraîchissement périodique
    pour rester synchronisé avec
    l'application principale.
    */

    setInterval(
        refreshV51,
        1000
    );

})();
