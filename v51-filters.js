        /* ============================================================
           FIN RISQUE
           ============================================================ */

        function displayRiskStats(
            filteredTrades
        ) {
            if (!isAnalysisPage()) {
                return;
            }

            const stats =
                calculateRiskStats(
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
                "v51AverageRisk",
                stats.averageRisk !== null
                    ? formatMoney(
                          stats.averageRisk
                      )
                    : "-"
            );

            setText(
                "v51MinimumRisk",
                stats.minimumRisk !== null
                    ? formatMoney(
                          stats.minimumRisk
                      )
                    : "-"
            );

            setText(
                "v51MaximumRisk",
                stats.maximumRisk !== null
                    ? formatMoney(
                          stats.maximumRisk
                      )
                    : "-"
            );

            setText(
                "v51ReferenceRisk",
                stats.referenceRisk !== null
                    ? formatMoney(
                          stats.referenceRisk
                      )
                    : "-"
            );

            setText(
                "v51AverageDeviation",
                stats.averageDeviation !== null
                    ? stats.averageDeviation.toFixed(
                          1
                      ) + "%"
                    : "-"
            );

            setText(
                "v51RiskRegularity",
                stats.riskRegularity !== null
                    ? stats.riskRegularity.toFixed(
                          1
                      ) + "%"
                    : "-"
            );

            setText(
                "v51CompliantTrades",
                String(
                    stats.compliantTrades
                )
            );

            setText(
                "v51NonCompliantTrades",
                String(
                    stats.nonCompliantTrades
                )
            );
        }

        /* ============================================================
           RR / OBJECTIF
           ============================================================ */

        function calculateRRStats(
            filteredTrades
        ) {
            const records = [];

            filteredTrades.forEach(
                function (trade) {
                    const rr =
                        getTradeTargetRR(
                            trade
                        );

                    if (
                        rr !== null
                    ) {
                        records.push(
                            rr
                        );
                    }
                }
            );

            if (
                records.length ===
                0
            ) {
                return {
                    averageRR: null,
                    minimumRR: null,
                    maximumRR: null
                };
            }

            const total =
                records.reduce(
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

            return {
                averageRR:
                    total /
                    records.length,

                minimumRR:
                    Math.min(
                        ...records
                    ),

                maximumRR:
                    Math.max(
                        ...records
                    )
            };
        }

        function displayRRStats(
            filteredTrades
        ) {
            if (!isAnalysisPage()) {
                return;
            }

            const stats =
                calculateRRStats(
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
                "v51AverageTargetRR",
                stats.averageRR !== null
                    ? stats.averageRR.toFixed(
                          2
                      )
                    : "-"
            );

            setText(
                "v51MinimumTargetRR",
                stats.minimumRR !== null
                    ? stats.minimumRR.toFixed(
                          2
                      )
                    : "-"
            );

            setText(
                "v51MaximumTargetRR",
                stats.maximumRR !== null
                    ? stats.maximumRR.toFixed(
                          2
                      )
                    : "-"
            );
        }

        /* ============================================================
           PERFORMANCE PAR SETUP
           ============================================================ */

        function buildSetupStats(
            filteredTrades
        ) {
            const map =
                {};

            filteredTrades.forEach(
                function (trade) {
                    const setup =
                        String(
                            trade.setup ||
                                "Sans setup"
                        ).trim() ||
                        "Sans setup";

                    if (!map[setup]) {
                        map[setup] = {
                            setup:
                                setup,

                            trades:
                                0,

                            wins:
                                0,

                            losses:
                                0,

                            be:
                                0,

                            profit:
                                0
                        };
                    }

                    map[setup].trades++;

                    const result =
                        String(
                            trade.result ||
                                ""
                        ).toUpperCase();

                    if (
                        result ===
                        "TP"
                    ) {
                        map[setup].wins++;
                    } else if (
                        result ===
                        "SL"
                    ) {
                        map[setup].losses++;
                    } else if (
                        result ===
                        "BE"
                    ) {
                        map[setup].be++;
                    }

                    map[setup].profit +=
                        Number(
                            trade.pnl
                        ) || 0;
                }
            );

            return Object.values(
                map
            ).sort(
                function (
                    a,
                    b
                ) {
                    return (
                        b.profit -
                        a.profit
                    );
                }
            );
        }

        function renderSetupPerformance(
            filteredTrades
        ) {
            if (!isAnalysisPage()) {
                return;
            }

            const rows =
                buildSetupStats(
                    filteredTrades
                );

            const tbody =
                document.getElementById(
                    "v51SetupPerformanceBody"
                );

            if (!tbody) {
                return;
            }

            if (
                rows.length ===
                0
            ) {
                tbody.innerHTML = `
                    <tr>
                        <td
                            colspan="7"
                            class="empty-table"
                        >
                            Aucun trade pour cette période.
                        </td>
                    </tr>
                `;

                return;
            }

            tbody.innerHTML =
                rows
                    .map(
                        function (
                            item
                        ) {
                            const winrate =
                                item.trades >
                                0
                                    ? (
                                          item.wins /
                                          item.trades
                                      ) *
                                      100
                                    : 0;

                            return `
                                <tr>
                                    <td>
                                        ${escapeValue(
                                            item.setup
                                        )}
                                    </td>

                                    <td>
                                        ${item.trades}
                                    </td>

                                    <td>
                                        ${item.wins}
                                    </td>

                                    <td>
                                        ${item.losses}
                                    </td>

                                    <td>
                                        ${winrate.toFixed(
                                            1
                                        )}%
                                    </td>

                                    <td>
                                        ${item.be}
                                    </td>

                                    <td class="${
                                        item.profit > 0
                                            ? "profit-positive"
                                            : item.profit < 0
                                                ? "profit-negative"
                                                : ""
                                    }">
                                        ${formatMoney(
                                            item.profit
                                        )}
                                    </td>
                                </tr>
                            `;
                        }
                    )
                    .join("");
        }

        /* ============================================================
           PERFORMANCE PAR ACTIF
           ============================================================ */

        function buildAssetStats(
            filteredTrades
        ) {
            const map =
                {};

            filteredTrades.forEach(
                function (trade) {
                    const asset =
                        String(
                            trade.asset ||
                                "Sans actif"
                        ).trim() ||
                        "Sans actif";

                    if (!map[asset]) {
                        map[asset] = {
                            asset:
                                asset,

                            trades:
                                0,

                            wins:
                                0,

                            losses:
                                0,

                            be:
                                0,

                            profit:
                                0
                        };
                    }

                    map[asset].trades++;

                    const result =
                        String(
                            trade.result ||
                                ""
                        ).toUpperCase();

                    if (
                        result ===
                        "TP"
                    ) {
                        map[asset].wins++;
                    } else if (
                        result ===
                        "SL"
                    ) {
                        map[asset].losses++;
                    } else if (
                        result ===
                        "BE"
                    ) {
                        map[asset].be++;
                    }

                    map[asset].profit +=
                        Number(
                            trade.pnl
                        ) || 0;
                }
            );

            return Object.values(
                map
            ).sort(
                function (
                    a,
                    b
                ) {
                    return (
                        b.profit -
                        a.profit
                    );
                }
            );
        }

        function renderAssetPerformance(
            filteredTrades
        ) {
            if (!isAnalysisPage()) {
                return;
            }

            const rows =
                buildAssetStats(
                    filteredTrades
                );

            const tbody =
                document.getElementById(
                    "v51AssetPerformanceBody"
                );

            if (!tbody) {
                return;
            }

            if (
                rows.length ===
                0
            ) {
                tbody.innerHTML = `
                    <tr>
                        <td
                            colspan="7"
                            class="empty-table"
                        >
                            Aucun trade pour cette période.
                        </td>
                    </tr>
                `;

                return;
            }

            tbody.innerHTML =
                rows
                    .map(
                        function (
                            item
                        ) {
                            const winrate =
                                item.trades >
                                0
                                    ? (
                                          item.wins /
                                          item.trades
                                      ) *
                                      100
                                    : 0;

                            return `
                                <tr>
                                    <td>
                                        ${escapeValue(
                                            item.asset
                                        )}
                                    </td>

                                    <td>
                                        ${item.trades}
                                    </td>

                                    <td>
                                        ${item.wins}
                                    </td>

                                    <td>
                                        ${item.losses}
                                    </td>

                                    <td>
                                        ${winrate.toFixed(
                                            1
                                        )}%
                                    </td>

                                    <td>
                                        ${item.be}
                                    </td>

                                    <td class="${
                                        item.profit > 0
                                            ? "profit-positive"
                                            : item.profit < 0
                                                ? "profit-negative"
                                                : ""
                                    }">
                                        ${formatMoney(
                                            item.profit
                                        )}
                                    </td>
                                </tr>
                            `;
                        }
                    )
                    .join("");
        }

        /* ============================================================
           CLASSEMENT DES SETUPS
           ============================================================ */

        function calculateSetupRanking(
            filteredTrades
        ) {
            const rows =
                buildSetupStats(
                    filteredTrades
                );

            return rows
                .map(
                    function (
                        item
                    ) {
                        const winrate =
                            item.trades >
                            0
                                ? (
                                      item.wins /
                                      item.trades
                                  ) *
                                  100
                                : 0;

                        return {
                            setup:
                                item.setup,

                            trades:
                                item.trades,

                            winrate:
                                winrate,

                            profit:
                                item.profit
                        };
                    }
                )
                .sort(
                    function (
                        a,
                        b
                    ) {
                        if (
                            b.profit !==
                            a.profit
                        ) {
                            return (
                                b.profit -
                                a.profit
                            );
                        }

                        return (
                            b.winrate -
                            a.winrate
                        );
                    }
                );
        }

        function renderSetupRanking(
            filteredTrades
        ) {
            if (!isAnalysisPage()) {
                return;
            }

            const rows =
                calculateSetupRanking(
                    filteredTrades
                );

            const container =
                document.getElementById(
                    "v51SetupRanking"
                );

            if (!container) {
                return;
            }

            if (
                rows.length ===
                0
            ) {
                container.innerHTML =
                    `
                    <div class="empty-table">
                        Aucun setup disponible.
                    </div>
                `;

                return;
            }

            container.innerHTML =
                rows
                    .map(
                        function (
                            item,
                            index
                        ) {
                            return `
                                <div
                                    class="v51-ranking-row"
                                >
                                    <div
                                        class="v51-ranking-position"
                                    >
                                        #${
                                            index +
                                            1
                                        }
                                    </div>

                                    <div
                                        class="v51-ranking-main"
                                    >
                                        <strong>
                                            ${escapeValue(
                                                item.setup
                                            )}
                                        </strong>

                                        <span>
                                            ${
                                                item.trades
                                            } trade${
                                                item.trades >
                                                1
                                                    ? "s"
                                                    : ""
                                            }
                                            ·
                                            ${
                                                item.winrate.toFixed(
                                                    1
                                                )
                                            }%
                                        </span>
                                    </div>

                                    <div
                                        class="${
                                            item.profit > 0
                                                ? "profit-positive"
                                                : item.profit < 0
                                                    ? "profit-negative"
                                                    : ""
                                        }"
                                    >
                                        ${formatMoney(
                                            item.profit
                                        )}
                                    </div>
                                </div>
                            `;
                        }
                    )
                    .join("");
        }

        /* ============================================================
           RECOMMANDATIONS
           ============================================================ */

        function generateRecommendations(
            filteredTrades
        ) {
            const recommendations =
                [];

            if (
                !filteredTrades ||
                filteredTrades.length ===
                    0
            ) {
                recommendations.push(
                    "Pas encore assez de trades pour générer des recommandations."
                );

                return recommendations;
            }

            const stats =
                calculateAdvancedStats(
                    filteredTrades
                );

            const setupStats =
                calculateSetupRanking(
                    filteredTrades
                );

            if (
                stats.winrate <
                40
            ) {
                recommendations.push(
                    "La winrate est faible : vérifie surtout la qualité des confirmations avant l'entrée."
                );
            } else if (
                stats.winrate >=
                60
            ) {
                recommendations.push(
                    "La winrate est solide sur cette période : conserve les setups qui produisent réellement le résultat."
                );
            }

            if (
                stats.maxLossStreak >=
                3
            ) {
                recommendations.push(
                    "Une série d'au moins 3 pertes a été observée : évite d'augmenter le risque après une perte."
                );
            }

            if (
                stats.maxDrawdown <
                0
            ) {
                recommendations.push(
                    "Un drawdown a été observé : surveille la régularité du risque et évite le sur-trading."
                );
            }

            if (
                setupStats.length >
                0
            ) {
                const best =
                    setupStats[0];

                recommendations.push(
                    `Le setup actuellement le plus performant est ${best.setup} avec ${formatMoney(
                        best.profit
                    )} de résultat.`
                );
            }

            const riskStats =
                calculateRiskStats(
                    filteredTrades
                );

            if (
                riskStats.averageDeviation !==
                    null &&
                Math.abs(
                    riskStats.averageDeviation
                ) >
                    RISK_TOLERANCE *
                        100
            ) {
                recommendations.push(
                    "Le risque moyen s'écarte de la référence : vérifie le lot utilisé et la distance du Stop Loss."
                );
            }

            if (
                recommendations.length ===
                0
            ) {
                recommendations.push(
                    "La période sélectionnée présente des données cohérentes. Continue à journaliser les trades pour obtenir une analyse plus fiable."
                );
            }

            return recommendations;
        }

        function renderRecommendations(
            filteredTrades
        ) {
            if (!isAnalysisPage()) {
                return;
            }

            const container =
                document.getElementById(
                    "v51Recommendations"
                );

            if (!container) {
                return;
            }

            const recommendations =
                generateRecommendations(
                    filteredTrades
                );

            container.innerHTML =
                recommendations
                    .map(
                        function (
                            recommendation
                        ) {
                            return `
                                <div
                                    class="v51-recommendation"
                                >
                                    ${escapeValue(
                                        recommendation
                                    )}
                                </div>
                            `;
                        }
                    )
                    .join("");
        }

        /* ============================================================
           CALENDRIER
           ============================================================ */

        function getCalendarTrades(
            filteredTrades
        ) {
            const map =
                {};

            filteredTrades.forEach(
                function (trade) {
                    const date =
                        String(
                            trade.date ||
                                ""
                        ).slice(
                            0,
                            10
                        );

                    if (!date) {
                        return;
                    }

                    if (!map[date]) {
                        map[date] = {
                            date:
                                date,

                            trades:
                                0,

                            profit:
                                0
                        };
                    }

                    map[date].trades++;

                    map[date].profit +=
                        Number(
                            trade.pnl
                        ) || 0;
                }
            );

            return map;
        }

        function renderCalendar(
            filteredTrades
        ) {
            if (!isAnalysisPage()) {
                return;
            }

            const container =
                document.getElementById(
                    "v51Calendar"
                );

            if (!container) {
                return;
            }

            const calendarMap =
                getCalendarTrades(
                    filteredTrades
                );

            const now =
                new Date();

            if (
                !Number.isFinite(
                    calendarMonth
                )
            ) {
                calendarMonth =
                    now.getMonth();

                calendarYear =
                    now.getFullYear();
            }

            const firstDay =
                new Date(
                    calendarYear,
                    calendarMonth,
                    1
                );

            const lastDay =
                new Date(
                    calendarYear,
                    calendarMonth + 1,
                    0
                );

            const startWeekday =
                firstDay.getDay();

            const totalDays =
                lastDay.getDate();

            let html =
                `
                    <div class="v51-calendar-header">
                        <button
                            type="button"
                            id="v51CalendarPrev"
                        >
                            ‹
                        </button>

                        <strong>
                            ${firstDay.toLocaleDateString(
                                "fr-FR",
                                {
                                    month:
                                        "long",
                                    year:
                                        "numeric"
                                }
                            )}
                        </strong>

                        <button
                            type="button"
                            id="v51CalendarNext"
                        >
                            ›
                        </button>
                    </div>

                    <div class="v51-calendar-weekdays">
                        <span>Lun</span>
                        <span>Mar</span>
                        <span>Mer</span>
                        <span>Jeu</span>
                        <span>Ven</span>
                        <span>Sam</span>
                        <span>Dim</span>
                    </div>

                    <div class="v51-calendar-grid">
                `;

            let offset =
                startWeekday ===
                0
                    ? 6
                    : startWeekday -
                      1;

            for (
                let i = 0;
                i < offset;
                i++
            ) {
                html +=
                    `<span class="v51-calendar-empty"></span>`;
            }

            for (
                let day = 1;
                day <= totalDays;
                day++
            ) {
                const monthString =
                    String(
                        calendarMonth +
                            1
                    ).padStart(
                        2,
                        "0"
                    );

                const dayString =
                    String(
                        day
                    ).padStart(
                        2,
                        "0"
                    );

                const dateKey =
                    `${calendarYear}-${monthString}-${dayString}`;

                const item =
                    calendarMap[
                        dateKey
                    ];

                let className =
                    "v51-calendar-day";

                if (item) {
                    if (
                        item.profit >
                        0
                    ) {
                        className +=
                            " profit";
                    } else if (
                        item.profit <
                        0
                    ) {
                        className +=
                            " loss";
                    } else {
                        className +=
                            " neutral";
                    }
                }

                html += `
                    <div
                        class="${className}"
                        title="${
                            item
                                ? `${item.trades} trade(s) · ${formatMoney(
                                      item.profit
                                  )}`
                                : "Aucun trade"
                        }"
                    >
                        <span>
                            ${day}
                        </span>

                        ${
                            item
                                ? `
                                    <small>
                                        ${formatMoney(
                                            item.profit
                                        )}
                                    </small>
                                `
                                : ""
                        }
                    </div>
                `;
            }

            html +=
                `
                    </div>
                `;

            container.innerHTML =
                html;

            const previousButton =
                document.getElementById(
                    "v51CalendarPrev"
                );

            const nextButton =
                document.getElementById(
                    "v51CalendarNext"
                );

            if (
                previousButton
            ) {
                previousButton.onclick =
                    function () {
                        calendarMonth--;

                        if (
                            calendarMonth <
                            0
                        ) {
                            calendarMonth =
                                11;

                            calendarYear--;
                        }

                        renderCalendar(
                            filteredTrades
                        );
                    };
            }

            if (
                nextButton
            ) {
                nextButton.onclick =
                    function () {
                        calendarMonth++;

                        if (
                            calendarMonth >
                            11
                        ) {
                            calendarMonth =
                                0;

                            calendarYear++;
                        }

                        renderCalendar(
                            filteredTrades
                        );
                    };
            }
        }
