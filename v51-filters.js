/* ============================================================
   V5.5 — FILTRES + STATISTIQUES + ANALYSE + CLASSEMENT
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

    let chartResizeAttached = false;

    /* ============================================================
       OUTILS
       ============================================================ */

    function formatMoney(value) {
        const number = Number(value) || 0;

        if (typeof money === "function") {
            return money(number);
        }

        return "$" + number.toFixed(2);
    }

    function escapeValue(value) {
        if (typeof escapeHtml === "function") {
            return escapeHtml(value);
        }

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getCapitalTrades() {
        if (
            typeof trades === "undefined" ||
            !Array.isArray(trades)
        ) {
            return [];
        }

        if (
            typeof activeCapital === "undefined" ||
            !activeCapital ||
            !activeCapital.id
        ) {
            return [];
        }

        return trades.filter(function (trade) {
            return trade.capitalId === activeCapital.id;
        });
    }

    function parseTradeDate(dateValue) {
        if (!dateValue) {
            return null;
        }

        const date = new Date(
            String(dateValue) + "T00:00:00"
        );

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        return date;
    }

    /* ============================================================
       PERIODES
       ============================================================ */

    function isToday(dateValue) {
        const tradeDate = parseTradeDate(dateValue);

        if (!tradeDate) {
            return false;
        }

        const today = new Date();

        return (
            tradeDate.getFullYear() === today.getFullYear() &&
            tradeDate.getMonth() === today.getMonth() &&
            tradeDate.getDate() === today.getDate()
        );
    }

    function isThisWeek(dateValue) {
        const tradeDate = parseTradeDate(dateValue);

        if (!tradeDate) {
            return false;
        }

        const today = new Date();

        const day = today.getDay();

        const diffToMonday =
            day === 0
                ? 6
                : day - 1;

        const monday = new Date(today);

        monday.setHours(0, 0, 0, 0);

        monday.setDate(
            today.getDate() - diffToMonday
        );

        const nextMonday = new Date(monday);

        nextMonday.setDate(
            monday.getDate() + 7
        );

        return (
            tradeDate >= monday &&
            tradeDate < nextMonday
        );
    }

    function isThisMonth(dateValue) {
        const tradeDate = parseTradeDate(dateValue);

        if (!tradeDate) {
            return false;
        }

        const today = new Date();

        return (
            tradeDate.getFullYear() === today.getFullYear() &&
            tradeDate.getMonth() === today.getMonth()
        );
    }

    function isThisYear(dateValue) {
        const tradeDate = parseTradeDate(dateValue);

        if (!tradeDate) {
            return false;
        }

        const today = new Date();

        return (
            tradeDate.getFullYear() === today.getFullYear()
        );
    }

    function filterBySelectedPeriod(
        tradeList,
        period
    ) {
        if (period === "all") {
            return [...tradeList];
        }

        return tradeList.filter(function (trade) {
            if (period === "today") {
                return isToday(trade.date);
            }

            if (period === "week") {
                return isThisWeek(trade.date);
            }

            if (period === "month") {
                return isThisMonth(trade.date);
            }

            if (period === "year") {
                return isThisYear(trade.date);
            }

            return true;
        });
    }

    /* ============================================================
       TRI CHRONOLOGIQUE
       ============================================================ */

    function sortChronologically(tradeList) {
        return [...tradeList].sort(function (a, b) {
            const dateA = new Date(
                a.date || a.createdAt || 0
            ).getTime();

            const dateB = new Date(
                b.date || b.createdAt || 0
            ).getTime();

            if (dateA !== dateB) {
                return dateA - dateB;
            }

            const createdA = new Date(
                a.createdAt || 0
            ).getTime();

            const createdB = new Date(
                b.createdAt || 0
            ).getTime();

            return createdA - createdB;
        });
    }

    /* ============================================================
       CREATION SECTION
       ============================================================ */

    function createFilterSection() {
        let section =
            document.getElementById(
                "v51FilterCard"
            );

        if (section) {
            return section;
        }

        section =
            document.createElement("section");

        section.id =
            "v51FilterCard";

        section.className =
            "card";

        section.innerHTML = `
            <div class="section-header">
                <div>
                    <h2>🔎 Analyse filtrée</h2>
                    <p>
                        Analyse selon la période, l'actif et le setup
                    </p>
                </div>
            </div>

            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(auto-fit,minmax(180px,1fr));
                    gap:14px;
                    margin-bottom:20px;
                "
            >

                <div>
                    <label for="v51PeriodFilter">
                        Période
                    </label>

                    <select id="v51PeriodFilter">
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

                        <option value="all" selected>
                            Tout l'historique
                        </option>
                    </select>
                </div>

                <div>
                    <label for="v51AssetFilter">
                        Actif
                    </label>

                    <select id="v51AssetFilter">
                        <option value="ALL">
                            Tous les actifs
                        </option>
                    </select>
                </div>

                <div>
                    <label for="v51SetupFilter">
                        Setup
                    </label>

                    <select id="v51SetupFilter">
                        <option value="ALL">
                            Tous les setups
                        </option>
                    </select>
                </div>

            </div>

            <!-- ==================================================
                 STATISTIQUES
                 ================================================== -->

            <div
                class="stats-grid"
                id="v51StatsGrid"
                style="margin-bottom:24px;"
            >

                <div class="stat-box">
                    <span>Trades</span>
                    <strong id="v51Trades">0</strong>
                </div>

                <div class="stat-box">
                    <span>Gagnants</span>
                    <strong id="v51Wins">0</strong>
                </div>

                <div class="stat-box">
                    <span>Perdants</span>
                    <strong id="v51Losses">0</strong>
                </div>

                <div class="stat-box">
                    <span>BE</span>
                    <strong id="v51BE">0</strong>
                </div>

                <div class="stat-box">
                    <span>Winrate</span>
                    <strong id="v51Winrate">0.0%</strong>
                </div>

                <div class="stat-box">
                    <span>Profit</span>
                    <strong id="v51Profit">$0.00</strong>
                </div>

                <div class="stat-box">
                    <span>RR moyen</span>
                    <strong id="v51AverageRR">0.00</strong>
                </div>

                <div class="stat-box">
                    <span>Profit Factor</span>
                    <strong id="v51ProfitFactor">0.00</strong>
                </div>

                <div class="stat-box">
                    <span>Gain moyen / trade</span>
                    <strong id="v51AverageTrade">$0.00</strong>
                </div>

                <div class="stat-box">
                    <span>Gain moyen gagnant</span>
                    <strong id="v51AverageWinner">$0.00</strong>
                </div>

                <div class="stat-box">
                    <span>Perte moyenne perdant</span>
                    <strong id="v51AverageLoser">$0.00</strong>
                </div>

                <div class="stat-box">
                    <span>Meilleur trade</span>
                    <strong id="v51BestTrade">$0.00</strong>
                </div>

                <div class="stat-box">
                    <span>Pire trade</span>
                    <strong id="v51WorstTrade">$0.00</strong>
                </div>

                <div class="stat-box">
                    <span>Série gagnante max</span>
                    <strong id="v51MaxWinStreak">0</strong>
                </div>

                <div class="stat-box">
                    <span>Série perdante max</span>
                    <strong id="v51MaxLossStreak">0</strong>
                </div>

                <div class="stat-box">
                    <span>Drawdown maximal</span>
                    <strong id="v51MaxDrawdown">$0.00</strong>
                </div>

            </div>

            <!-- ==================================================
                 CLASSEMENT SETUPS
                 ================================================== -->

            <div style="margin-bottom:28px;">

                <div class="section-header">
                    <div>
                        <h3>🏆 Classement des setups</h3>
                        <p>
                            Classement selon la performance globale
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

            <!-- ==================================================
                 CLASSEMENT ACTIFS
                 ================================================== -->

            <div style="margin-bottom:28px;">

                <div class="section-header">
                    <div>
                        <h3>🥇 Classement des actifs</h3>
                        <p>
                            Classement selon la performance globale
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

            <!-- ==================================================
                 DETAIL SETUPS
                 ================================================== -->

            <div style="margin-bottom:28px;">

                <div class="section-header">
                    <div>
                        <h3>🎯 Analyse détaillée par setup</h3>
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

            <!-- ==================================================
                 DETAIL ACTIFS
                 ================================================== -->

            <div style="margin-bottom:28px;">

                <div class="section-header">
                    <div>
                        <h3>📈 Analyse détaillée par actif</h3>
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

            <!-- ==================================================
                 GRAPHIQUE
                 ================================================== -->

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
            periodButtons.closest(".card")
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
                document.querySelector("main");

            if (main) {
                main.appendChild(section);
            } else {
                document.body.appendChild(section);
            }
        }

        return section;
    }

    /* ============================================================
       REMPLISSAGE DES FILTRES
       ============================================================ */

    function populateFilters() {
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

        const capitalTrades =
            getCapitalTrades();

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

        [...assets]
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
            [...assets].includes(
                currentAsset
            )
        ) {
            assetSelect.value =
                currentAsset;
        } else {
            assetSelect.value =
                "ALL";
        }

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

        setupSelect.innerHTML = `
            <option value="ALL">
                Tous les setups
            </option>
        `;

        [...setups]
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
            [...setups].includes(
                currentSetup
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
            getCapitalTrades();

        result =
            filterBySelectedPeriod(
                result,
                period
            );

        if (
            asset !== "ALL"
        ) {
            result =
                result.filter(
                    function (trade) {
                        return String(
                            trade.asset || ""
                        ) ===
                            String(
                                asset
                            );
                    }
                );
        }

        if (
            setup !== "ALL"
        ) {
            result =
                result.filter(
                    function (trade) {
                        return String(
                            trade.setup || ""
                        ) ===
                            String(
                                setup
                            );
                    }
                );
        }

        return sortChronologically(
            result
        );
    }

    /* ============================================================
       STATISTIQUES
       ============================================================ */

    function calculateAdvancedStats(
        filteredTrades
    ) {
        const pnlValues =
            filteredTrades.map(
                function (trade) {
                    return (
                        Number(
                            trade.pnl
                        ) || 0
                    );
                }
            );

        const totalTrades =
            filteredTrades.length;

        const winners =
            filteredTrades.filter(
                function (trade) {
                    return (
                        String(
                            trade.result ||
                                ""
                        ).toUpperCase() ===
                        "TP"
                    );
                }
            );

        const losers =
            filteredTrades.filter(
                function (trade) {
                    return (
                        String(
                            trade.result ||
                                ""
                        ).toUpperCase() ===
                        "SL"
                    );
                }
            );

        const breakevens =
            filteredTrades.filter(
                function (trade) {
                    return (
                        String(
                            trade.result ||
                                ""
                        ).toUpperCase() ===
                        "BE"
                    );
                }
            );

        const totalProfit =
            pnlValues.reduce(
                function (
                    sum,
                    value
                ) {
                    return (
                        sum +
                        value
                    );
                },
                0
            );

        const positivePnls =
            pnlValues.filter(
                function (value) {
                    return value > 0;
                }
            );

        const negativePnls =
            pnlValues.filter(
                function (value) {
                    return value < 0;
                }
            );

        const grossProfit =
            positivePnls.reduce(
                function (
                    sum,
                    value
                ) {
                    return (
                        sum +
                        value
                    );
                },
                0
            );

        const grossLoss =
            negativePnls.reduce(
                function (
                    sum,
                    value
                ) {
                    return (
                        sum +
                        Math.abs(value)
                    );
                },
                0
            );

        let profitFactor = 0;

        if (
            grossLoss > 0
        ) {
            profitFactor =
                grossProfit /
                grossLoss;
        } else if (
            grossProfit > 0
        ) {
            profitFactor =
                Infinity;
        }

        const rrValues =
            filteredTrades
                .map(
                    function (trade) {
                        return Number(
                            trade.rr
                        );
                    }
                )
                .filter(
                    function (value) {
                        return Number.isFinite(
                            value
                        );
                    }
                );

        const averageRR =
            rrValues.length > 0
                ? rrValues.reduce(
                      function (
                          sum,
                          value
                      ) {
                          return (
                              sum +
                              value
                          );
                      },
                      0
                  ) /
                  rrValues.length
                : 0;

        const averageTrade =
            totalTrades > 0
                ? totalProfit /
                  totalTrades
                : 0;

        const averageWinner =
            positivePnls.length > 0
                ? grossProfit /
                  positivePnls.length
                : 0;

        const averageLoser =
            negativePnls.length > 0
                ? negativePnls.reduce(
                      function (
                          sum,
                          value
                      ) {
                          return (
                              sum +
                              value
                          );
                      },
                      0
                  ) /
                  negativePnls.length
                : 0;

        const bestTrade =
            pnlValues.length > 0
                ? Math.max(
                      ...pnlValues
                  )
                : 0;

        const worstTrade =
            pnlValues.length > 0
                ? Math.min(
                      ...pnlValues
                  )
                : 0;

        let currentWinStreak = 0;
        let maxWinStreak = 0;

        let currentLossStreak = 0;
        let maxLossStreak = 0;

        filteredTrades.forEach(
            function (trade) {
                const result =
                    String(
                        trade.result ||
                            ""
                    ).toUpperCase();

                if (
                    result ===
                    "TP"
                ) {
                    currentWinStreak++;

                    maxWinStreak =
                        Math.max(
                            maxWinStreak,
                            currentWinStreak
                        );
                } else {
                    currentWinStreak =
                        0;
                }

                if (
                    result ===
                    "SL"
                ) {
                    currentLossStreak++;

                    maxLossStreak =
                        Math.max(
                            maxLossStreak,
                            currentLossStreak
                        );
                } else {
                    currentLossStreak =
                        0;
                }
            }
        );

        let cumulativeProfit = 0;
        let highestPoint = 0;
        let maxDrawdown = 0;

        filteredTrades.forEach(
            function (trade) {
                cumulativeProfit +=
                    Number(
                        trade.pnl
                    ) || 0;

                if (
                    cumulativeProfit >
                    highestPoint
                ) {
                    highestPoint =
                        cumulativeProfit;
                }

                const drawdown =
                    cumulativeProfit -
                    highestPoint;

                if (
                    drawdown <
                    maxDrawdown
                ) {
                    maxDrawdown =
                        drawdown;
                }
            }
        );

        return {
            totalTrades:
                totalTrades,

            wins:
                winners.length,

            losses:
                losers.length,

            be:
                breakevens.length,

            winrate:
                totalTrades > 0
                    ? (
                          winners.length /
                          totalTrades
                      ) *
                      100
                    : 0,

            totalProfit:
                totalProfit,

            averageRR:
                averageRR,

            profitFactor:
                profitFactor,

            averageTrade:
                averageTrade,

            averageWinner:
                averageWinner,

            averageLoser:
                averageLoser,

            bestTrade:
                bestTrade,

            worstTrade:
                worstTrade,

            maxWinStreak:
                maxWinStreak,

            maxLossStreak:
                maxLossStreak,

            maxDrawdown:
                maxDrawdown
        };
    }

    function displayStats(
        filteredTrades
    ) {
        const stats =
            calculateAdvancedStats(
                filteredTrades
            );

        function setText(
            id,
            value
        ) {
            const element =
                document.getElementById(
                    id
                );

            if (element) {
                element.textContent =
                    value;
            }
        }

        setText(
            "v51Trades",
            stats.totalTrades
        );

        setText(
            "v51Wins",
            stats.wins
        );

        setText(
            "v51Losses",
            stats.losses
        );

        setText(
            "v51BE",
            stats.be
        );

        setText(
            "v51Winrate",
            stats.winrate.toFixed(
                1
            ) + "%"
        );

        setText(
            "v51Profit",
            formatMoney(
                stats.totalProfit
            )
        );

        setText(
            "v51AverageRR",
            stats.averageRR.toFixed(
                2
            )
        );

        setText(
            "v51ProfitFactor",
            Number.isFinite(
                stats.profitFactor
            )
                ? stats.profitFactor.toFixed(
                      2
                  )
                : "∞"
        );

        setText(
            "v51AverageTrade",
            formatMoney(
                stats.averageTrade
            )
        );

        setText(
            "v51AverageWinner",
            formatMoney(
                stats.averageWinner
            )
        );

        setText(
            "v51AverageLoser",
            formatMoney(
                stats.averageLoser
            )
        );

        setText(
            "v51BestTrade",
            formatMoney(
                stats.bestTrade
            )
        );

        setText(
            "v51WorstTrade",
            formatMoney(
                stats.worstTrade
            )
        );

        setText(
            "v51MaxWinStreak",
            String(
                stats.maxWinStreak
            )
        );

        setText(
            "v51MaxLossStreak",
            String(
                stats.maxLossStreak
            )
        );

        setText(
            "v51MaxDrawdown",
            formatMoney(
                stats.maxDrawdown
            )
        );
    }

    /* ============================================================
       SCORE DE CLASSEMENT
       ============================================================ */

    function calculateRankingScore(
        stats
    ) {
        if (
            !stats ||
            stats.totalTrades === 0
        ) {
            return -Infinity;
        }

        /*
         * Score équilibré :
         *
         * 40 % = Profit
         * 30 % = Winrate
         * 20 % = Profit Factor
         * 10 % = RR moyen
         *
         * Le score sert uniquement au classement.
         */

        const profitComponent =
            stats.totalProfit;

        const winrateComponent =
            stats.winrate;

        const profitFactorComponent =
            Number.isFinite(
                stats.profitFactor
            )
                ? stats.profitFactor
                : 10;

        const rrComponent =
            stats.averageRR;

        return (
            profitComponent * 0.40 +
            winrateComponent * 0.30 +
            profitFactorComponent * 20 +
            rrComponent * 10
        );
    }

    function getRankingGroups(
        filteredTrades,
        field
    ) {
        const groups =
            new Map();

        filteredTrades.forEach(
            function (trade) {
                const value =
                    String(
                        trade[field] ||
                            "Non défini"
                    );

                if (
                    !groups.has(
                        value
                    )
                ) {
                    groups.set(
                        value,
                        []
                    );
                }

                groups
                    .get(value)
                    .push(trade);
            }
        );

        const ranking = [];

        groups.forEach(
            function (
                groupTrades,
                name
            ) {
                const stats =
                    calculateAdvancedStats(
                        groupTrades
                    );

                const score =
                    calculateRankingScore(
                        stats
                    );

                ranking.push({
                    name:
                        name,

                    trades:
                        groupTrades,

                    stats:
                        stats,

                    score:
                        score
                });
            }
        );

        ranking.sort(
            function (a, b) {
                if (
                    b.score !==
                    a.score
                ) {
                    return (
                        b.score -
                        a.score
                    );
                }

                if (
                    b.stats.totalProfit !==
                    a.stats.totalProfit
                ) {
                    return (
                        b.stats.totalProfit -
                        a.stats.totalProfit
                    );
                }

                if (
                    b.stats.winrate !==
                    a.stats.winrate
                ) {
                    return (
                        b.stats.winrate -
                        a.stats.winrate
                    );
                }

                return (
                    b.stats.profitFactor -
                    a.stats.profitFactor
                );
            }
        );

        return ranking;
    }

    /* ============================================================
       RANG
       ============================================================ */

    function rankingLabel(
        position
    ) {
        if (position === 0) {
            return "🥇";
        }

        if (position === 1) {
            return "🥈";
        }

        if (position === 2) {
            return "🥉";
        }

        return "#" + (
            position + 1
        );
    }

    /* ============================================================
       AFFICHAGE CLASSEMENT SETUPS
       ============================================================ */

    function renderSetupRanking(
        filteredTrades
    ) {
        const tbody =
            document.getElementById(
                "v55SetupRankingBody"
            );

        if (!tbody) {
            return;
        }

        tbody.innerHTML = "";

        const ranking =
            getRankingGroups(
                filteredTrades,
                "setup"
            );

        if (
            ranking.length ===
            0
        ) {
            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="empty-table"
                    >
                        Aucun setup à classer.
                    </td>
                </tr>
            `;

            return;
        }

        ranking.forEach(
            function (
                item,
                index
            ) {
                const stats =
                    item.stats;

                const row =
                    document.createElement(
                        "tr"
                    );

                const pf =
                    Number.isFinite(
                        stats.profitFactor
                    )
                        ? stats.profitFactor.toFixed(
                              2
                          )
                        : "∞";

                row.innerHTML = `
                    <td>
                        ${rankingLabel(
                            index
                        )}
                    </td>

                    <td>
                        <strong>
                            ${escapeValue(
                                item.name
                            )}
                        </strong>
                    </td>

                    <td>
                        ${stats.totalTrades}
                    </td>

                    <td>
                        ${stats.winrate.toFixed(
                            1
                        )}%
                    </td>

                    <td>
                        ${formatMoney(
                            stats.totalProfit
                        )}
                    </td>

                    <td>
                        ${pf}
                    </td>

                    <td>
                        ${stats.averageRR.toFixed(
                            2
                        )}
                    </td>

                    <td>
                        ${Number.isFinite(
                            item.score
                        )
                            ? item.score.toFixed(
                                  2
                              )
                            : "-"}
                    </td>
                `;

                tbody.appendChild(
                    row
                );
            }
        );
    }

    /* ============================================================
       AFFICHAGE CLASSEMENT ACTIFS
       ============================================================ */

    function renderAssetRanking(
        filteredTrades
    ) {
        const tbody =
            document.getElementById(
                "v55AssetRankingBody"
            );

        if (!tbody) {
            return;
        }

        tbody.innerHTML = "";

        const ranking =
            getRankingGroups(
                filteredTrades,
                "asset"
            );

        if (
            ranking.length ===
            0
        ) {
            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="empty-table"
                    >
                        Aucun actif à classer.
                    </td>
                </tr>
            `;

            return;
        }

        ranking.forEach(
            function (
                item,
                index
            ) {
                const stats =
                    item.stats;

                const row =
                    document.createElement(
                        "tr"
                    );

                const pf =
                    Number.isFinite(
                        stats.profitFactor
                    )
                        ? stats.profitFactor.toFixed(
                              2
                          )
                        : "∞";

                row.innerHTML = `
                    <td>
                        ${rankingLabel(
                            index
                        )}
                    </td>

                    <td>
                        <strong>
                            ${escapeValue(
                                item.name
                            )}
                        </strong>
                    </td>

                    <td>
                        ${stats.totalTrades}
                    </td>

                    <td>
                        ${stats.winrate.toFixed(
                            1
                        )}%
                    </td>

                    <td>
                        ${formatMoney(
                            stats.totalProfit
                        )}
                    </td>

                    <td>
                        ${pf}
                    </td>

                    <td>
                        ${stats.averageRR.toFixed(
                            2
                        )}
                    </td>

                    <td>
                        ${Number.isFinite(
                            item.score
                        )
                            ? item.score.toFixed(
                                  2
                              )
                            : "-"}
                    </td>
                `;

                tbody.appendChild(
                    row
                );
            }
        );
    }

    /* ============================================================
       DETAIL SETUPS
       ============================================================ */

    function renderSetupAnalysis(
        filteredTrades
    ) {
        const tbody =
            document.getElementById(
                "v54SetupBody"
            );

        if (!tbody) {
            return;
        }

        tbody.innerHTML = "";

        const setups =
            new Set(
                SETUPS
            );

        filteredTrades.forEach(
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

        let rowsAdded = 0;

        [...setups]
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
                    const groupTrades =
                        filteredTrades.filter(
                            function (trade) {
                                return String(
                                    trade.setup ||
                                        ""
                                ) ===
                                    String(
                                        setup
                                    );
                            }
                        );

                    if (
                        groupTrades.length ===
                        0
                    ) {
                        return;
                    }

                    const stats =
                        calculateAdvancedStats(
                            groupTrades
                        );

                    const row =
                        document.createElement(
                            "tr"
                        );

                    const pf =
                        Number.isFinite(
                            stats.profitFactor
                        )
                            ? stats.profitFactor.toFixed(
                                  2
                              )
                            : "∞";

                    row.innerHTML = `
                        <td>
                            ${escapeValue(
                                setup
                            )}
                        </td>

                        <td>
                            ${stats.totalTrades}
                        </td>

                        <td>
                            ${stats.wins}
                        </td>

                        <td>
                            ${stats.losses}
                        </td>

                        <td>
                            ${stats.be}
                        </td>

                        <td>
                            ${stats.winrate.toFixed(
                                1
                            )}%
                        </td>

                        <td>
                            ${formatMoney(
                                stats.totalProfit
                            )}
                        </td>

                        <td>
                            ${stats.averageRR.toFixed(
                                2
                            )}
                        </td>

                        <td>
                            ${pf}
                        </td>

                        <td>
                            ${formatMoney(
                                stats.bestTrade
                            )}
                        </td>

                        <td>
                            ${formatMoney(
                                stats.worstTrade
                            )}
                        </td>
                    `;

                    tbody.appendChild(
                        row
                    );

                    rowsAdded++;
                }
            );

        if (
            rowsAdded === 0
        ) {
            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="11"
                        class="empty-table"
                    >
                        Aucun setup correspondant aux filtres.
                    </td>
                </tr>
            `;
        }
    }

    /* ============================================================
       DETAIL ACTIFS
       ============================================================ */

    function renderAssetAnalysis(
        filteredTrades
    ) {
        const tbody =
            document.getElementById(
                "v54AssetBody"
            );

        if (!tbody) {
            return;
        }

        tbody.innerHTML = "";

        const assets =
            new Set(
                DEFAULT_ASSETS
            );

        filteredTrades.forEach(
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

        let rowsAdded = 0;

        [...assets]
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
                    const groupTrades =
                        filteredTrades.filter(
                            function (trade) {
                                return String(
                                    trade.asset ||
                                        ""
                                ) ===
                                    String(
                                        asset
                                    );
                            }
                        );

                    if (
                        groupTrades.length ===
                        0
                    ) {
                        return;
                    }

                    const stats =
                        calculateAdvancedStats(
                            groupTrades
                        );

                    const row =
                        document.createElement(
                            "tr"
                        );

                    const pf =
                        Number.isFinite(
                            stats.profitFactor
                        )
                            ? stats.profitFactor.toFixed(
                                  2
                              )
                            : "∞";

                    row.innerHTML = `
                        <td>
                            ${escapeValue(
                                asset
                            )}
                        </td>

                        <td>
                            ${stats.totalTrades}
                        </td>

                        <td>
                            ${stats.wins}
                        </td>

                        <td>
                            ${stats.losses}
                        </td>

                        <td>
                            ${stats.be}
                        </td>

                        <td>
                            ${stats.winrate.toFixed(
                                1
                            )}%
                        </td>

                        <td>
                            ${formatMoney(
                                stats.totalProfit
                            )}
                        </td>

                        <td>
                            ${stats.averageRR.toFixed(
                                2
                            )}
                        </td>

                        <td>
                            ${pf}
                        </td>

                        <td>
                            ${formatMoney(
                                stats.bestTrade
                            )}
                        </td>

                        <td>
                            ${formatMoney(
                                stats.worstTrade
                            )}
                        </td>
                    `;

                    tbody.appendChild(
                        row
                    );

                    rowsAdded++;
                }
            );

        if (
            rowsAdded === 0
        ) {
            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="11"
                        class="empty-table"
                    >
                        Aucun actif correspondant aux filtres.
                    </td>
                </tr>
            `;
        }
    }

    /* ============================================================
       GRAPHIQUE
       ============================================================ */

    function drawChart(
        filteredTrades
    ) {
        const canvas =
            document.getElementById(
                "v51PerformanceChart"
            );

        const emptyMessage =
            document.getElementById(
                "v51EmptyChart"
            );

        const container =
            document.getElementById(
                "v51ChartContainer"
            );

        if (
            !canvas ||
            !emptyMessage ||
            !container
        ) {
            return;
        }

        if (
            !chartResizeAttached
        ) {
            chartResizeAttached =
                true;

            window.addEventListener(
                "resize",
                function () {
                    drawChart(
                        getFilteredTrades()
                    );
                }
            );
        }

        const ctx =
            canvas.getContext(
                "2d"
            );

        if (!ctx) {
            return;
        }

        if (
            filteredTrades.length ===
            0
        ) {
            canvas.style.display =
                "none";

            emptyMessage.style.display =
                "flex";

            return;
        }

        canvas.style.display =
            "block";

        emptyMessage.style.display =
            "none";

        const width =
            container.clientWidth ||
            600;

        const height =
            320;

        const ratio =
            window.devicePixelRatio ||
            1;

        canvas.width =
            Math.max(
                1,
                Math.floor(
                    width *
                        ratio
                )
            );

        canvas.height =
            Math.max(
                1,
                Math.floor(
                    height *
                        ratio
                )
            );

        canvas.style.width =
            width + "px";

        canvas.style.height =
            height + "px";

        ctx.setTransform(
            ratio,
            0,
            0,
            ratio,
            0,
            0
        );

        ctx.clearRect(
            0,
            0,
            width,
            height
        );

        const values =
            [0];

        let cumulative =
            0;

        filteredTrades.forEach(
            function (trade) {
                cumulative +=
                    Number(
                        trade.pnl
                    ) || 0;

                values.push(
                    cumulative
                );
            }
        );

        let minValue =
            Math.min(
                ...values
            );

        let maxValue =
            Math.max(
                ...values
            );

        if (
            minValue ===
            maxValue
        ) {
            minValue -= 1;
            maxValue += 1;
        }

        const paddingLeft =
            65;

        const paddingRight =
            20;

        const paddingTop =
            20;

        const paddingBottom =
            42;

        const chartWidth =
            width -
            paddingLeft -
            paddingRight;

        const chartHeight =
            height -
            paddingTop -
            paddingBottom;

        const range =
            maxValue -
            minValue;

        function getX(
            index
        ) {
            if (
                filteredTrades.length ===
                0
            ) {
                return paddingLeft;
            }

            return (
                paddingLeft +
                (
                    index /
                    filteredTrades.length
                ) *
                    chartWidth
            );
        }

        function getY(
            value
        ) {
            return (
                paddingTop +
                (
                    maxValue -
                    value
                ) /
                    range *
                    chartHeight
            );
        }

        ctx.font =
            "12px sans-serif";

        ctx.lineWidth =
            1;

        for (
            let i = 0;
            i <= 5;
            i++
        ) {
            const value =
                minValue +
                (
                    (
                        maxValue -
                        minValue
                    ) *
                    i
                ) /
                    5;

            const y =
                getY(
                    value
                );

            ctx.beginPath();

            ctx.moveTo(
                paddingLeft,
                y
            );

            ctx.lineTo(
                width -
                    paddingRight,
                y
            );

            ctx.strokeStyle =
                "rgba(255,255,255,0.15)";

            ctx.stroke();

            ctx.fillStyle =
                "rgba(255,255,255,0.75)";

            ctx.fillText(
                value.toFixed(
                    2
                ),
                8,
                y + 4
            );
        }

        if (
            minValue <= 0 &&
            maxValue >= 0
        ) {
            const zeroY =
                getY(0);

            ctx.beginPath();

            ctx.moveTo(
                paddingLeft,
                zeroY
            );

            ctx.lineTo(
                width -
                    paddingRight,
                zeroY
            );

            ctx.strokeStyle =
                "rgba(255,255,255,0.35)";

            ctx.lineWidth =
                1.5;

            ctx.stroke();
        }

        for (
            let i = 0;
            i <
            values.length - 1;
            i++
        ) {
            const x1 =
                getX(i);

            const y1 =
                getY(
                    values[i]
                );

            const x2 =
                getX(
                    i + 1
                );

            const y2 =
                getY(
                    values[i + 1]
                );

            const difference =
                values[i + 1] -
                values[i];

            let lineColor =
                "rgb(148,163,184)";

            if (
                difference > 0
            ) {
                lineColor =
                    "rgb(34,197,94)";
            }

            if (
                difference < 0
            ) {
                lineColor =
                    "rgb(239,68,68)";
            }

            ctx.beginPath();

            ctx.moveTo(
                x1,
                y1
            );

            ctx.lineTo(
                x2,
                y2
            );

            ctx.strokeStyle =
                lineColor;

            ctx.lineWidth =
                3;

            ctx.stroke();
        }

        for (
            let i = 1;
            i <
            values.length;
            i++
        ) {
            const value =
                values[i];

            const previous =
                values[i - 1];

            let pointColor =
                "rgb(148,163,184)";

            if (
                value >
                previous
            ) {
                pointColor =
                    "rgb(34,197,94)";
            }

            if (
                value <
                previous
            ) {
                pointColor =
                    "rgb(239,68,68)";
            }

            ctx.beginPath();

            ctx.arc(
                getX(i),
                getY(value),
                3.5,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                pointColor;

            ctx.fill();
        }

        ctx.beginPath();

        ctx.moveTo(
            paddingLeft,
            height -
                paddingBottom
        );

        ctx.lineTo(
            width -
                paddingRight,
            height -
                paddingBottom
        );

        ctx.strokeStyle =
            "rgba(255,255,255,0.18)";

        ctx.lineWidth =
            1;

        ctx.stroke();

        ctx.fillStyle =
            "rgba(255,255,255,0.75)";

        ctx.font =
            "12px sans-serif";

        ctx.fillText(
            "Trades filtrés",
            width -
                paddingRight -
                85,
            height - 12
        );
    }

    /* ============================================================
       REFRESH
       ============================================================ */

    function refreshV55() {
        try {
            createFilterSection();

            populateFilters();

            const filteredTrades =
                getFilteredTrades();

            displayStats(
                filteredTrades
            );

            renderSetupRanking(
                filteredTrades
            );

            renderAssetRanking(
                filteredTrades
            );

            renderSetupAnalysis(
                filteredTrades
            );

            renderAssetAnalysis(
                filteredTrades
            );

            drawChart(
                filteredTrades
            );

        } catch (error) {
            console.error(
                "Erreur V5.5 :",
                error
            );
        }
    }

    /* ============================================================
       EVENEMENTS
       ============================================================ */

    function attachEvents() {
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

        if (periodSelect) {
            periodSelect.addEventListener(
                "change",
                function () {
                    refreshV55();
                }
            );
        }

        if (assetSelect) {
            assetSelect.addEventListener(
                "change",
                function () {
                    refreshV55();
                }
            );
        }

        if (setupSelect) {
            setupSelect.addEventListener(
                "change",
                function () {
                    refreshV55();
                }
            );
        }
    }

    /* ============================================================
       INITIALISATION
       ============================================================ */

    function initV55() {
        createFilterSection();

        populateFilters();

        attachEvents();

        refreshV55();
    }

    /* ============================================================
       VARIABLES PUBLIQUES
       ============================================================ */

    window.refreshV51 =
        refreshV55;

    window.getV51FilteredTrades =
        getFilteredTrades;

    window.calculateV51Stats =
        calculateAdvancedStats;

    window.calculateV55RankingScore =
        calculateRankingScore;

    /* ============================================================
       LANCEMENT
       ============================================================ */

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            function () {
                setTimeout(
                    initV55,
                    500
                );
            }
        );
    } else {
        setTimeout(
            initV55,
            500
        );
    }

    /* ============================================================
       ACTUALISATION AUTOMATIQUE
       ============================================================ */

    setInterval(
        refreshV55,
        1000
    );

})();
