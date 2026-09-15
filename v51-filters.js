    /* ============================================================
       CLASSEMENT SETUPS
       ============================================================ */

    function calculateRankingScore(
        stats
    ) {
        if (
            !stats ||
            stats.trades === 0
        ) {
            return 0;
        }

        const winrateScore =
            stats.winrate;

        const profitScore =
            stats.profit > 0
                ? Math.min(
                      100,
                      stats.profit
                  )
                : Math.max(
                      -100,
                      stats.profit
                  );

        const rrScore =
            Math.min(
                100,
                stats.averageRR *
                    20
            );

        const consistency =
            Math.min(
                100,
                stats.trades *
                    5
            );

        return (
            winrateScore *
                0.35 +
            profitScore *
                0.30 +
            rrScore *
                0.20 +
            consistency *
                0.15
        );
    }

    function buildRanking(
        tradeList,
        property
    ) {
        const groups =
            {};

        tradeList.forEach(
            function (trade) {
                const value =
                    String(
                        trade[property] ||
                            "Non défini"
                    ).trim();

                if (
                    !groups[value]
                ) {
                    groups[value] =
                        [];
                }

                groups[value].push(
                    trade
                );
            }
        );

        return Object.keys(
            groups
        )
            .map(
                function (name) {
                    const stats =
                        calculateStats(
                            groups[name]
                        );

                    return {
                        name:
                            name,
                        stats:
                            stats,
                        score:
                            calculateRankingScore(
                                stats
                            )
                    };
                }
            )
            .sort(
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

                    return (
                        b.stats.profit -
                        a.stats.profit
                    );
                }
            );
    }

    function renderSetupRanking() {
        const body =
            document.getElementById(
                "v55SetupRankingBody"
            );

        if (!body) {
            return;
        }

        const ranking =
            buildRanking(
                getFilteredTrades(),
                "setup"
            );

        if (
            ranking.length ===
            0
        ) {
            body.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        style="text-align:center;"
                    >
                        Aucun trade disponible.
                    </td>
                </tr>
            `;

            return;
        }

        body.innerHTML =
            ranking
                .map(
                    function (
                        item,
                        index
                    ) {
                        const stats =
                            item.stats;

                        return `
                            <tr>
                                <td>
                                    ${index + 1}
                                </td>

                                <td>
                                    <strong>
                                        ${escapeValue(
                                            item.name
                                        )}
                                    </strong>
                                </td>

                                <td>
                                    ${stats.trades}
                                </td>

                                <td>
                                    ${stats.winrate.toFixed(
                                        1
                                    )}%
                                </td>

                                <td>
                                    ${formatMoney(
                                        stats.profit
                                    )}
                                </td>

                                <td>
                                    ${formatProfitFactor(
                                        stats.profitFactor
                                    )}
                                </td>

                                <td>
                                    ${stats.averageRR.toFixed(
                                        2
                                    )}
                                </td>

                                <td>
                                    ${item.score.toFixed(
                                        1
                                    )}
                                </td>
                            </tr>
                        `;
                    }
                )
                .join("");
    }

    /* ============================================================
       CLASSEMENT ACTIFS
       ============================================================ */

    function renderAssetRanking() {
        const body =
            document.getElementById(
                "v55AssetRankingBody"
            );

        if (!body) {
            return;
        }

        const ranking =
            buildRanking(
                getFilteredTrades(),
                "asset"
            );

        if (
            ranking.length ===
            0
        ) {
            body.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        style="text-align:center;"
                    >
                        Aucun trade disponible.
                    </td>
                </tr>
            `;

            return;
        }

        body.innerHTML =
            ranking
                .map(
                    function (
                        item,
                        index
                    ) {
                        const stats =
                            item.stats;

                        return `
                            <tr>
                                <td>
                                    ${index + 1}
                                </td>

                                <td>
                                    <strong>
                                        ${escapeValue(
                                            item.name
                                        )}
                                    </strong>
                                </td>

                                <td>
                                    ${stats.trades}
                                </td>

                                <td>
                                    ${stats.winrate.toFixed(
                                        1
                                    )}%
                                </td>

                                <td>
                                    ${formatMoney(
                                        stats.profit
                                    )}
                                </td>

                                <td>
                                    ${formatProfitFactor(
                                        stats.profitFactor
                                    )}
                                </td>

                                <td>
                                    ${stats.averageRR.toFixed(
                                        2
                                    )}
                                </td>

                                <td>
                                    ${item.score.toFixed(
                                        1
                                    )}
                                </td>
                            </tr>
                        `;
                    }
                )
                .join("");
    }

    /* ============================================================
       DETAIL PAR SETUP
       ============================================================ */

    function renderSetupDetails() {
        const body =
            document.getElementById(
                "v54SetupBody"
            );

        if (!body) {
            return;
        }

        const tradesList =
            getFilteredTrades();

        const ranking =
            buildRanking(
                tradesList,
                "setup"
            );

        if (
            ranking.length ===
            0
        ) {
            body.innerHTML = `
                <tr>
                    <td
                        colspan="11"
                        style="text-align:center;"
                    >
                        Aucun trade disponible.
                    </td>
                </tr>
            `;

            return;
        }

        body.innerHTML =
            ranking
                .map(
                    function (item) {
                        const setupTrades =
                            tradesList.filter(
                                function (
                                    trade
                                ) {
                                    return (
                                        String(
                                            trade.setup ||
                                                "Non défini"
                                        ).trim() ===
                                        item.name
                                    );
                                }
                            );

                        const stats =
                            calculateStats(
                                setupTrades
                            );

                        let best =
                            0;

                        let worst =
                            0;

                        setupTrades.forEach(
                            function (
                                trade
                            ) {
                                const pnl =
                                    getTradePnl(
                                        trade
                                    );

                                if (
                                    pnl >
                                    best
                                ) {
                                    best =
                                        pnl;
                                }

                                if (
                                    pnl <
                                    worst
                                ) {
                                    worst =
                                        pnl;
                                }
                            }
                        );

                        return `
                            <tr>
                                <td>
                                    <strong>
                                        ${escapeValue(
                                            item.name
                                        )}
                                    </strong>
                                </td>

                                <td>
                                    ${stats.trades}
                                </td>

                                <td>
                                    ${stats.tp}
                                </td>

                                <td>
                                    ${stats.sl}
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
                                        stats.profit
                                    )}
                                </td>

                                <td>
                                    ${stats.averageRR.toFixed(
                                        2
                                    )}
                                </td>

                                <td>
                                    ${formatProfitFactor(
                                        stats.profitFactor
                                    )}
                                </td>

                                <td>
                                    ${formatMoney(
                                        best
                                    )}
                                </td>

                                <td>
                                    ${formatMoney(
                                        worst
                                    )}
                                </td>
                            </tr>
                        `;
                    }
                )
                .join("");
    }

    /* ============================================================
       DETAIL PAR ACTIF
       ============================================================ */

    function renderAssetDetails() {
        const body =
            document.getElementById(
                "v54AssetBody"
            );

        if (!body) {
            return;
        }

        const tradesList =
            getFilteredTrades();

        const ranking =
            buildRanking(
                tradesList,
                "asset"
            );

        if (
            ranking.length ===
            0
        ) {
            body.innerHTML = `
                <tr>
                    <td
                        colspan="11"
                        style="text-align:center;"
                    >
                        Aucun trade disponible.
                    </td>
                </tr>
            `;

            return;
        }

        body.innerHTML =
            ranking
                .map(
                    function (item) {
                        const assetTrades =
                            tradesList.filter(
                                function (
                                    trade
                                ) {
                                    return (
                                        String(
                                            trade.asset ||
                                                "Non défini"
                                        ).trim() ===
                                        item.name
                                    );
                                }
                            );

                        const stats =
                            calculateStats(
                                assetTrades
                            );

                        let best =
                            0;

                        let worst =
                            0;

                        assetTrades.forEach(
                            function (
                                trade
                            ) {
                                const pnl =
                                    getTradePnl(
                                        trade
                                    );

                                if (
                                    pnl >
                                    best
                                ) {
                                    best =
                                        pnl;
                                }

                                if (
                                    pnl <
                                    worst
                                ) {
                                    worst =
                                        pnl;
                                }
                            }
                        );

                        return `
                            <tr>
                                <td>
                                    <strong>
                                        ${escapeValue(
                                            item.name
                                        )}
                                    </strong>
                                </td>

                                <td>
                                    ${stats.trades}
                                </td>

                                <td>
                                    ${stats.tp}
                                </td>

                                <td>
                                    ${stats.sl}
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
                                        stats.profit
                                    )}
                                </td>

                                <td>
                                    ${stats.averageRR.toFixed(
                                        2
                                    )}
                                </td>

                                <td>
                                    ${formatProfitFactor(
                                        stats.profitFactor
                                    )}
                                </td>

                                <td>
                                    ${formatMoney(
                                        best
                                    )}
                                </td>

                                <td>
                                    ${formatMoney(
                                        worst
                                    )}
                                </td>
                            </tr>
                        `;
                    }
                )
                .join("");
    }

    /* ============================================================
       GRAPHIQUE
       ============================================================ */

    function destroyV51Chart() {
        const canvas =
            document.getElementById(
                "v51PerformanceChart"
            );

        if (!canvas) {
            return;
        }

        if (
            canvas._v51Chart &&
            typeof canvas._v51Chart.destroy ===
                "function"
        ) {
            canvas._v51Chart.destroy();

            canvas._v51Chart =
                null;
        }
    }

    function renderPerformanceChart() {
        const canvas =
            document.getElementById(
                "v51PerformanceChart"
            );

        const empty =
            document.getElementById(
                "v51EmptyChart"
            );

        if (!canvas) {
            return;
        }

        destroyV51Chart();

        const list =
            getFilteredTrades();

        if (
            !list.length
        ) {
            if (empty) {
                empty.style.display =
                    "flex";
            }

            return;
        }

        if (empty) {
            empty.style.display =
                "none";
        }

        if (
            typeof Chart ===
            "undefined"
        ) {
            return;
        }

        const chronological =
            sortChronologically(
                list
            );

        let cumulative =
            0;

        const labels =
            chronological.map(
                function (
                    trade,
                    index
                ) {
                    return (
                        trade.date ||
                        `Trade ${
                            index + 1
                        }`
                    );
                }
            );

        const values =
            chronological.map(
                function (
                    trade
                ) {
                    cumulative +=
                        getTradePnl(
                            trade
                        );

                    return Number(
                        cumulative.toFixed(
                            2
                        )
                    );
                }
            );

        canvas._v51Chart =
            new Chart(
                canvas.getContext(
                    "2d"
                ),
                {
                    type:
                        "line",

                    data: {
                        labels:
                            labels,

                        datasets: [
                            {
                                label:
                                    "Profit cumulé",

                                data:
                                    values,

                                borderWidth:
                                    2,

                                tension:
                                    0.25,

                                fill:
                                    false,

                                pointRadius:
                                    3
                            }
                        ]
                    },

                    options: {
                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        interaction: {
                            mode:
                                "index",

                            intersect:
                                false
                        },

                        plugins: {
                            legend: {
                                display:
                                    true
                            },

                            tooltip: {
                                callbacks: {
                                    label:
                                        function (
                                            context
                                        ) {
                                            return (
                                                "Profit cumulé : " +
                                                formatMoney(
                                                    context.parsed.y
                                                )
                                            );
                                        }
                                }
                            }
                        },

                        scales: {
                            x: {
                                ticks: {
                                    maxRotation:
                                        45,

                                    minRotation:
                                        0
                                }
                            },

                            y: {
                                beginAtZero:
                                    false,

                                ticks: {
                                    callback:
                                        function (
                                            value
                                        ) {
                                            return formatMoney(
                                                value
                                            );
                                        }
                                }
                            }
                        }
                    }
                }
            );
    }

    /* ============================================================
       REFRESH GLOBAL
       ============================================================ */

    function refreshV58() {
        if (!isAnalysisPage()) {
            removeFilterSection();

            return;
        }

        if (
            !document.getElementById(
                "v51FilterCard"
            )
        ) {
            createFilterSection();
        }

        populateFilters();
        renderFilteredStats();
        renderSetupRanking();
        renderAssetRanking();
        renderSetupDetails();
        renderAssetDetails();
        renderPerformanceChart();
    }

    /* ============================================================
       EVENEMENTS
       ============================================================ */

    function attachFilterEvents() {
        if (!isAnalysisPage()) {
            return;
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

        if (
            periodSelect &&
            !periodSelect.dataset.v51Bound
        ) {
            periodSelect.dataset.v51Bound =
                "1";

            periodSelect.addEventListener(
                "change",
                function () {
                    populateFilters();
                    renderFilteredStats();
                    renderSetupRanking();
                    renderAssetRanking();
                    renderSetupDetails();
                    renderAssetDetails();
                    renderPerformanceChart();
                }
            );
        }

        if (
            assetSelect &&
            !assetSelect.dataset.v51Bound
        ) {
            assetSelect.dataset.v51Bound =
                "1";

            assetSelect.addEventListener(
                "change",
                function () {
                    renderFilteredStats();
                    renderSetupRanking();
                    renderAssetRanking();
                    renderSetupDetails();
                    renderAssetDetails();
                    renderPerformanceChart();
                }
            );
        }

        if (
            setupSelect &&
            !setupSelect.dataset.v51Bound
        ) {
            setupSelect.dataset.v51Bound =
                "1";

            setupSelect.addEventListener(
                "change",
                function () {
                    renderFilteredStats();
                    renderSetupRanking();
                    renderAssetRanking();
                    renderSetupDetails();
                    renderAssetDetails();
                    renderPerformanceChart();
                }
            );
        }
    }

    /* ============================================================
       REDIMENSIONNEMENT GRAPHIQUE
       ============================================================ */

    function attachChartResize() {
        if (
            chartResizeAttached
        ) {
            return;
        }

        chartResizeAttached =
            true;

        window.addEventListener(
            "resize",
            function () {
                if (
                    canvasExists()
                ) {
                    renderPerformanceChart();
                }
            }
        );
    }

    function canvasExists() {
        return Boolean(
            document.getElementById(
                "v51PerformanceChart"
            )
        );
    }

    /* ============================================================
       INITIALISATION
       ============================================================ */

    function initializeV51() {
        if (!isAnalysisPage()) {
            removeFilterSection();

            return;
        }

        createFilterSection();
        populateFilters();
        attachFilterEvents();
        attachChartResize();
        refreshV58();
    }

    /* ============================================================
       OBSERVER DOM
       ============================================================ */

    let observerStarted =
        false;

    function startObserver() {
        if (
            observerStarted ||
            !document.body
        ) {
            return;
        }

        observerStarted =
            true;

        const observer =
            new MutationObserver(
                function () {
                    if (
                        isAnalysisPage()
                    ) {
                        const card =
                            document.getElementById(
                                "v51FilterCard"
                            );

                        if (!card) {
                            initializeV51();
                        }
                    }
                }
            );

        observer.observe(
            document.body,
            {
                childList:
                    true,

                subtree:
                    true
            }
        );
    }

    /* ============================================================
       EVENEMENTS STORAGE
       ============================================================ */

    window.addEventListener(
        "storage",
        function (event) {
            if (
                event.key ===
                    "tradingTrades" ||
                event.key ===
                    "tradingCapitalArchives" ||
                event.key ===
                    "tradingActiveCapital"
            ) {
                setTimeout(
                    function () {
                        refreshV58();
                    },
                    50
                );
            }
        }
    );

    /* ============================================================
       EVENEMENTS PERSONNALISES
       ============================================================ */

    [
        "tradeAdded",
        "tradeUpdated",
        "tradeDeleted",
        "capitalChanged",
        "capitalArchived",
        "dashboardRefresh"
    ].forEach(
        function (eventName) {
            window.addEventListener(
                eventName,
                function () {
                    setTimeout(
                        function () {
                            refreshV58();
                        },
                        50
                    );
                }
            );
        }
    );

    /* ============================================================
       DOM READY
       ============================================================ */

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            function () {
                initializeV51();
                startObserver();
            }
        );
    } else {
        initializeV51();
        startObserver();
    }

    /* ============================================================
       API GLOBALE
       ============================================================ */

    window.V51Filters = {
        refresh:
            refreshV58,

        getFilteredTrades:
            getFilteredTrades,

        getCapitalTrades:
            getCapitalTrades,

        getAllCapitalTrades:
            getAllCapitalTrades,

        calculateStats:
            calculateStats,

        filterBySelectedPeriod:
            filterBySelectedPeriod
    };
})();
