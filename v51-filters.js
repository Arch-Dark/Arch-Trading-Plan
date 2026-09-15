/* ============================================================
   V5.8 — FILTRES + STATS + ANALYSE + CLASSEMENT
   + RECOMMANDATIONS
   + ANALYSE DU RISQUE
   + CALENDRIER DE PERFORMANCE
   + CORRECTION MULTI-PAGES
   ============================================================ */

(function () {
    "use strict";

    /* ============================================================
       CONFIGURATION
       ============================================================ */

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

    const DEFAULT_ASSETS = [
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

    const RISK_TOLERANCE = 0.10;

    let chartResizeAttached = false;

    let calendarMonth;
    let calendarYear;

    /* ============================================================
       GESTION DES PAGES
       ============================================================ */

    function getCurrentPage() {
        try {
            const params =
                new URLSearchParams(
                    window.location.search
                );

            const page =
                params.get("page");

            if (
                page === "analysis" ||
                page === "archives" ||
                page === "dashboard"
            ) {
                return page;
            }

            return "dashboard";
        } catch (error) {
            return "dashboard";
        }
    }

    function isAnalysisPage() {
        return (
            getCurrentPage() ===
            "analysis"
        );
    }

    function removeFilterSection() {
        const section =
            document.getElementById(
                "v51FilterCard"
            );

        if (section) {
            section.remove();
        }
    }

    /* ============================================================
       OUTILS
       ============================================================ */

    function formatMoney(value) {
        const number =
            Number(value) || 0;

        if (
            typeof money ===
            "function"
        ) {
            return money(number);
        }

        return (
            "$" +
            number.toFixed(2)
        );
    }

    function escapeValue(value) {
        if (
            typeof escapeHtml ===
            "function"
        ) {
            return escapeHtml(value);
        }

        return String(value ?? "")
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

    function getCapitalTrades() {
        if (
            typeof trades ===
                "undefined" ||
            !Array.isArray(trades)
        ) {
            return [];
        }

        if (
            typeof activeCapital ===
                "undefined" ||
            !activeCapital ||
            !activeCapital.id
        ) {
            return [];
        }

        return trades.filter(
            function (trade) {
                return (
                    trade.capitalId ===
                    activeCapital.id
                );
            }
        );
    }

    /* ============================================================
       TOUS LES CAPITAUX
       ============================================================ */

    function getAllCapitalTrades() {
        const result = [];

        if (
            typeof archives !==
                "undefined" &&
            Array.isArray(archives)
        ) {
            archives.forEach(
                function (archive) {
                    if (
                        Array.isArray(
                            archive.trades
                        )
                    ) {
                        result.push(
                            ...archive.trades
                        );
                    }
                }
            );
        }

        if (
            typeof trades !==
                "undefined" &&
            Array.isArray(trades)
        ) {
            result.push(
                ...trades
            );
        }

        return result;
    }

    function parseTradeDate(
        dateValue
    ) {
        if (!dateValue) {
            return null;
        }

        const date =
            new Date(
                String(dateValue) +
                    "T00:00:00"
            );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return null;
        }

        return date;
    }

    /* ============================================================
       PERIODES
       ============================================================ */

    function isToday(dateValue) {
        const tradeDate =
            parseTradeDate(
                dateValue
            );

        if (!tradeDate) {
            return false;
        }

        const today =
            new Date();

        return (
            tradeDate.getFullYear() ===
                today.getFullYear() &&
            tradeDate.getMonth() ===
                today.getMonth() &&
            tradeDate.getDate() ===
                today.getDate()
        );
    }

    function isThisWeek(dateValue) {
        const tradeDate =
            parseTradeDate(
                dateValue
            );

        if (!tradeDate) {
            return false;
        }

        const today =
            new Date();

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

    function isThisMonth(dateValue) {
        const tradeDate =
            parseTradeDate(
                dateValue
            );

        if (!tradeDate) {
            return false;
        }

        const today =
            new Date();

        return (
            tradeDate.getFullYear() ===
                today.getFullYear() &&
            tradeDate.getMonth() ===
                today.getMonth()
        );
    }

    function isThisYear(dateValue) {
        const tradeDate =
            parseTradeDate(
                dateValue
            );

        if (!tradeDate) {
            return false;
        }

        const today =
            new Date();

        return (
            tradeDate.getFullYear() ===
            today.getFullYear()
        );
    }

    function filterBySelectedPeriod(
        tradeList,
        period
    ) {
        if (period === "all") {
            return [
                ...tradeList
            ];
        }

        return tradeList.filter(
            function (trade) {
                if (
                    period ===
                    "today"
                ) {
                    return isToday(
                        trade.date
                    );
                }

                if (
                    period ===
                    "week"
                ) {
                    return isThisWeek(
                        trade.date
                    );
                }

                if (
                    period ===
                    "month"
                ) {
                    return isThisMonth(
                        trade.date
                    );
                }

                if (
                    period ===
                    "year"
                ) {
                    return isThisYear(
                        trade.date
                    );
                }

                return true;
            }
        );
    }

    /* ============================================================
       TRI CHRONOLOGIQUE
       ============================================================ */

    function sortChronologically(
        tradeList
    ) {
        return [
            ...tradeList
        ].sort(
            function (a, b) {
                const dateA =
                    new Date(
                        a.date ||
                            a.createdAt ||
                            0
                    ).getTime();

                const dateB =
                    new Date(
                        b.date ||
                            b.createdAt ||
                            0
                    ).getTime();

                if (
                    dateA !==
                    dateB
                ) {
                    return (
                        dateA -
                        dateB
                    );
                }

                const createdA =
                    new Date(
                        a.createdAt ||
                            0
                    ).getTime();

                const createdB =
                    new Date(
                        b.createdAt ||
                            0
                    ).getTime();

                return (
                    createdA -
                    createdB
                );
            }
        );
    }

    /* ============================================================
       CREATION SECTION
       ============================================================ */

    function createFilterSection() {
        if (!isAnalysisPage()) {
            return null;
        }

        removeFilterSection();

        const section =
            document.createElement(
                "section"
            );

        section.id =
            "v51FilterCard";

        section.className =
            "card";

        section.style.marginBottom =
            "28px";

        section.innerHTML = `
            <div class="section-header">
                <div>
                    <h2>
                        🔎 Analyse filtrée
                    </h2>

                    <p>
                        Analyse détaillée des performances
                    </p>
                </div>
            </div>

            <div
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
                    margin-bottom:24px;
                "
            >

                <div>
                    <label
                        for="v51PeriodFilter"
                        style="
                            display:block;
                            margin-bottom:6px;
                            font-weight:600;
                        "
                    >
                        Période
                    </label>

                    <select
                        id="v51PeriodFilter"
                        class="form-control"
                    >
                        <option value="today">
                            Aujourd'hui
                        </option>

                        <option value="week">
                            Cette semaine
                        </option>

                        <option value="month">
                            Ce mois
                        </option>

                        <option value="year">
                            Cette année
                        </option>

                        <option value="all">
                            Tout
                        </option>

                        <option value="all-capitals">
                            🏦 Tous les capitaux
                        </option>
                    </select>
                </div>

                <div>
                    <label
                        for="v51AssetFilter"
                        style="
                            display:block;
                            margin-bottom:6px;
                            font-weight:600;
                        "
                    >
                        Actif
                    </label>

                    <select
                        id="v51AssetFilter"
                        class="form-control"
                    >
                        <option value="ALL">
                            Tous les actifs
                        </option>
                    </select>
                </div>

                <div>
                    <label
                        for="v51SetupFilter"
                        style="
                            display:block;
                            margin-bottom:6px;
                            font-weight:600;
                        "
                    >
                        Setup
                    </label>

                    <select
                        id="v51SetupFilter"
                        class="form-control"
                    >
                        <option value="ALL">
                            Tous les setups
                        </option>
                    </select>
                </div>

            </div>

            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(
                            auto-fit,
                            minmax(
                                150px,
                                1fr
                            )
                        );
                    gap:14px;
                    margin-bottom:28px;
                "
            >

                <div class="stat-card">
                    <div class="stat-label">
                        Trades
                    </div>

                    <div
                        id="v51StatTrades"
                        class="stat-value"
                    >
                        0
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-label">
                        Profit
                    </div>

                    <div
                        id="v51StatProfit"
                        class="stat-value"
                    >
                        $0.00
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-label">
                        Winrate
                    </div>

                    <div
                        id="v51StatWinrate"
                        class="stat-value"
                    >
                        0.0%
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-label">
                        RR moyen
                    </div>

                    <div
                        id="v51StatRR"
                        class="stat-value"
                    >
                        0.00
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-label">
                        Profit Factor
                    </div>

                    <div
                        id="v51StatPF"
                        class="stat-value"
                    >
                        0.00
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-label">
                        TP
                    </div>

                    <div
                        id="v51StatTP"
                        class="stat-value"
                    >
                        0
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-label">
                        SL
                    </div>

                    <div
                        id="v51StatSL"
                        class="stat-value"
                    >
                        0
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-label">
                        BE
                    </div>

                    <div
                        id="v51StatBE"
                        class="stat-value"
                    >
                        0
                    </div>
                </div>

            </div>

            <div style="margin-bottom:28px;">

                <div class="section-header">
                    <div>
                        <h3>
                            🏆 Classement des setups
                        </h3>

                        <p>
                            Performance globale
                        </p>
                    </div>
                </div>

                <div class="table-wrapper">
                    <table>

                        <thead>
                            <tr>
                                <th>Rang</th>
                                <th>Setup</th>
                                <th>Trades</th>
                                <th>Winrate</th>
                                <th>Profit</th>
                                <th>Profit Factor</th>
                                <th>RR moyen</th>
                                <th>Score</th>
                            </tr>
                        </thead>

                        <tbody id="v55SetupRankingBody">
                        </tbody>

                    </table>
                </div>

            </div>

            <div style="margin-bottom:28px;">

                <div class="section-header">
                    <div>

                        <h3>
                            🥇 Classement des actifs
                        </h3>

                        <p>
                            Performance globale
                        </p>

                    </div>
                </div>

                <div class="table-wrapper">
                    <table>

                        <thead>
                            <tr>
                                <th>Rang</th>
                                <th>Actif</th>
                                <th>Trades</th>
                                <th>Winrate</th>
                                <th>Profit</th>
                                <th>Profit Factor</th>
                                <th>RR moyen</th>
                                <th>Score</th>
                            </tr>
                        </thead>

                        <tbody id="v55AssetRankingBody">
                        </tbody>

                    </table>
                </div>

            </div>

            <div style="margin-bottom:28px;">

                <div class="section-header">
                    <div>
                        <h3>
                            🎯 Analyse détaillée par setup
                        </h3>
                    </div>
                </div>

                <div class="table-wrapper">
                    <table>

                        <thead>
                            <tr>
                                <th>Setup</th>
                                <th>Trades</th>
                                <th>TP</th>
                                <th>SL</th>
                                <th>BE</th>
                                <th>Winrate</th>
                                <th>Profit</th>
                                <th>RR moyen</th>
                                <th>Profit Factor</th>
                                <th>Meilleur</th>
                                <th>Pire</th>
                            </tr>
                        </thead>

                        <tbody id="v54SetupBody">
                        </tbody>

                    </table>
                </div>

            </div>

            <div style="margin-bottom:28px;">

                <div class="section-header">
                    <div>
                        <h3>
                            📈 Analyse détaillée par actif
                        </h3>
                    </div>
                </div>

                <div class="table-wrapper">
                    <table>

                        <thead>
                            <tr>
                                <th>Actif</th>
                                <th>Trades</th>
                                <th>TP</th>
                                <th>SL</th>
                                <th>BE</th>
                                <th>Winrate</th>
                                <th>Profit</th>
                                <th>RR moyen</th>
                                <th>Profit Factor</th>
                                <th>Meilleur</th>
                                <th>Pire</th>
                            </tr>
                        </thead>

                        <tbody id="v54AssetBody">
                        </tbody>

                    </table>
                </div>

            </div>

            <div
                id="v51ChartContainer"
                style="
                    position:relative;
                    width:100%;
                    min-height:320px;
                "
            >

                <canvas
                    id="v51PerformanceChart"
                    style="
                        width:100%;
                        height:320px;
                        display:block;
                    "
                ></canvas>

                <div
                    id="v51EmptyChart"
                    class="empty-chart-message"
                    style="
                        display:none;
                        min-height:280px;
                        align-items:center;
                        justify-content:center;
                    "
                >
                    Aucun trade correspondant aux filtres.
                </div>

            </div>
        `;

        const periodButtons =
            document.querySelector(
                ".period-buttons"
            );

        if (
            periodButtons &&
            periodButtons.closest(
                ".card"
            )
        ) {
            const performanceCard =
                periodButtons.closest(
                    ".card"
                );

            performanceCard.insertAdjacentElement(
                "afterend",
                section
            );
        } else {
            const main =
                document.querySelector(
                    "main"
                );

            if (main) {
                main.appendChild(
                    section
                );
            } else {
                document.body.appendChild(
                    section
                );
            }
        }

        return section;
    }

    /* ============================================================
       FILTRES SELECT
       ============================================================ */

    function populateFilters() {
        if (!isAnalysisPage()) {
            return;
        }

        const assetSelect =
            document.getElementById(
                "v51AssetFilter"
            );

        const setupSelect =
            document.getElementById(
                "v51SetupFilter"
            );

        if (
            !assetSelect ||
            !setupSelect
        ) {
            return;
        }

        const currentAsset =
            assetSelect.value ||
            "ALL";

        const currentSetup =
            setupSelect.value ||
            "ALL";

        const periodSelect =
            document.getElementById(
                "v51PeriodFilter"
            );

        const selectedPeriod =
            periodSelect
                ? periodSelect.value
                : "all";

        const capitalTrades =
            selectedPeriod ===
            "all-capitals"
                ? getAllCapitalTrades()
                : getCapitalTrades();

        const assets =
            new Set(
                DEFAULT_ASSETS
            );

        capitalTrades.forEach(
            function (trade) {
                if (trade.asset) {
                    assets.add(
                        String(
                            trade.asset
                        )
                    );
                }
            }
        );

        assetSelect.innerHTML = `
            <option value="ALL">
                Tous les actifs
            </option>
        `;

        [
            ...assets
        ]
            .sort(
                function (a, b) {
                    return String(
                        a
                    ).localeCompare(
                        String(b),
                        "fr",
                        {
                            sensitivity:
                                "base"
                        }
                    );
                }
            )
            .forEach(
                function (asset) {
                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        asset;

                    option.textContent =
                        asset;

                    assetSelect.appendChild(
                        option
                    );
                }
            );

        if (
            [
                ...assetSelect.options
            ].some(
                function (option) {
                    return (
                        option.value ===
                        currentAsset
                    );
                }
            )
        ) {
            assetSelect.value =
                currentAsset;
        } else {
            assetSelect.value =
                "ALL";
        }

        setupSelect.innerHTML = `
            <option value="ALL">
                Tous les setups
            </option>
        `;

        const setups =
            new Set(
                SETUPS
            );

        capitalTrades.forEach(
            function (trade) {
                if (trade.setup) {
                    setups.add(
                        String(
                            trade.setup
                        )
                    );
                }
            }
        );

        [
            ...setups
        ]
            .sort(
                function (a, b) {
                    return String(
                        a
                    ).localeCompare(
                        String(b),
                        "fr",
                        {
                            sensitivity:
                                "base"
                        }
                    );
                }
            )
            .forEach(
                function (setup) {
                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        setup;

                    option.textContent =
                        setup;

                    setupSelect.appendChild(
                        option
                    );
                }
            );

        if (
            [
                ...setupSelect.options
            ].some(
                function (option) {
                    return (
                        option.value ===
                        currentSetup
                    );
                }
            )
        ) {
            setupSelect.value =
                currentSetup;
        } else {
            setupSelect.value =
                "ALL";
        }
    }

    /* ============================================================
       TRADES FILTRES
       ============================================================ */

    function getFilteredTrades() {
        if (!isAnalysisPage()) {
            return [];
        }

        const periodSelect =
            document.getElementById(
                "v51PeriodFilter"
            );

        const assetSelect =
            document.getElementById(
                "v51AssetFilter"
            );

        const setupSelect =
            document.getElementById(
                "v51SetupFilter"
            );

        const period =
            periodSelect
                ? periodSelect.value
                : "all";

        const asset =
            assetSelect
                ? assetSelect.value
                : "ALL";

        const setup =
            setupSelect
                ? setupSelect.value
                : "ALL";

        let result =
            period ===
            "all-capitals"
                ? getAllCapitalTrades()
                : getCapitalTrades();

        if (
            period !==
            "all-capitals"
        ) {
            result =
                filterBySelectedPeriod(
                    result,
                    period
                );
        }

        if (
            asset !==
            "ALL"
        ) {
            result =
                result.filter(
                    function (trade) {
                        return (
                            String(
                                trade.asset ||
                                    ""
                            ) ===
                            String(
                                asset
                            )
                        );
                    }
                );
        }

        if (
            setup !==
            "ALL"
        ) {
            result =
                result.filter(
                    function (trade) {
                        return (
                            String(
                                trade.setup ||
                                    ""
                            ) ===
                            String(
                                setup
                            )
                        );
                    }
                );
        }

        return sortChronologically(
            result
        );
    }

    /* ============================================================
       UTILITAIRES RESULTATS
       ============================================================ */

    function getTradeResult(
        trade
    ) {
        const result =
            String(
                trade.result ||
                    trade.outcome ||
                    trade.status ||
                    ""
            )
                .trim()
                .toUpperCase();

        if (
            result ===
                "TP" ||
            result.includes(
                "TAKE"
            )
        ) {
            return "TP";
        }

        if (
            result ===
                "SL" ||
            result.includes(
                "STOP"
            )
        ) {
            return "SL";
        }

        if (
            result ===
                "BE" ||
            result.includes(
                "BREAK"
            )
        ) {
            return "BE";
        }

        const pnl =
            Number(
                trade.pnl ??
                    trade.profit ??
                    0
            );

        if (pnl > 0) {
            return "TP";
        }

        if (pnl < 0) {
            return "SL";
        }

        return "BE";
    }

    function getTradePnl(
        trade
    ) {
        return Number(
            trade.pnl ??
                trade.profit ??
                0
        ) || 0;
    }

    function getTradeRR(
        trade
    ) {
        const rr =
            Number(
                trade.rr
            );

        if (
            Number.isFinite(
                rr
            )
        ) {
            return rr;
        }

        return 0;
    }

    function calculateStats(
        tradeList
    ) {
        const list =
            Array.isArray(
                tradeList
            )
                ? tradeList
                : [];

        let profit = 0;
        let grossProfit = 0;
        let grossLoss = 0;

        let tp = 0;
        let sl = 0;
        let be = 0;

        let rrTotal = 0;
        let rrCount = 0;

        list.forEach(
            function (trade) {
                const pnl =
                    getTradePnl(
                        trade
                    );

                profit +=
                    pnl;

                if (pnl > 0) {
                    grossProfit +=
                        pnl;
                }

                if (pnl < 0) {
                    grossLoss +=
                        Math.abs(
                            pnl
                        );
                }

                const result =
                    getTradeResult(
                        trade
                    );

                if (
                    result ===
                    "TP"
                ) {
                    tp++;
                } else if (
                    result ===
                    "SL"
                ) {
                    sl++;
                } else {
                    be++;
                }

                const rr =
                    getTradeRR(
                        trade
                    );

                if (
                    Number.isFinite(
                        rr
                    ) &&
                    rr > 0
                ) {
                    rrTotal +=
                        rr;

                    rrCount++;
                }
            }
        );

        const tradesCount =
            list.length;

        const winrate =
            tradesCount >
            0
                ? (
                      tp /
                      tradesCount
                  ) *
                  100
                : 0;

        const profitFactor =
            grossLoss >
            0
                ? grossProfit /
                  grossLoss
                : grossProfit >
                  0
                ? Infinity
                : 0;

        const averageRR =
            rrCount >
            0
                ? rrTotal /
                  rrCount
                : 0;

        return {
            trades:
                tradesCount,
            profit:
                profit,
            grossProfit:
                grossProfit,
            grossLoss:
                grossLoss,
            tp:
                tp,
            sl:
                sl,
            be:
                be,
            winrate:
                winrate,
            profitFactor:
                profitFactor,
            averageRR:
                averageRR
        };
    }

    function formatProfitFactor(
        value
    ) {
        if (
            value ===
            Infinity
        ) {
            return "∞";
        }

        return Number(
            value || 0
        ).toFixed(2);
    }

    /* ============================================================
       STATISTIQUES PRINCIPALES
       ============================================================ */

    function renderFilteredStats() {
        const list =
            getFilteredTrades();

        const stats =
            calculateStats(
                list
            );

        const tradesElement =
            document.getElementById(
                "v51StatTrades"
            );

        const profitElement =
            document.getElementById(
                "v51StatProfit"
            );

        const winrateElement =
            document.getElementById(
                "v51StatWinrate"
            );

        const rrElement =
            document.getElementById(
                "v51StatRR"
            );

        const pfElement =
            document.getElementById(
                "v51StatPF"
            );

        const tpElement =
            document.getElementById(
                "v51StatTP"
            );

        const slElement =
            document.getElementById(
                "v51StatSL"
            );

        const beElement =
            document.getElementById(
                "v51StatBE"
            );

        if (tradesElement) {
            tradesElement.textContent =
                stats.trades;
        }

        if (profitElement) {
            profitElement.textContent =
                formatMoney(
                    stats.profit
                );
        }

        if (winrateElement) {
            winrateElement.textContent =
                stats.winrate.toFixed(
                    1
                ) +
                "%";
        }

        if (rrElement) {
            rrElement.textContent =
                stats.averageRR.toFixed(
                    2
                );
        }

        if (pfElement) {
            pfElement.textContent =
                formatProfitFactor(
                    stats.profitFactor
                );
        }

        if (tpElement) {
            tpElement.textContent =
                stats.tp;
        }

        if (slElement) {
            slElement.textContent =
                stats.sl;
        }

        if (beElement) {
            beElement.textContent =
                stats.be;
        }
    }
