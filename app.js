const TRADES_KEY = "tradingTrades";
const CAPITAL_KEY = "tradingActiveCapital";
const ARCHIVES_KEY = "tradingCapitalArchives";
const THEME_KEY = "tradingDashboardTheme";

const MIN_RR = 2.00;
const MIN_LOT = 0.01;
const LOT_STEP = 0.01;

const MADAGASCAR_TIMEZONE = "Indian/Antananarivo";

const ASSETS = [
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

let trades = [];
let archives = [];
let activeCapital = null;

let currentPeriod = "today";
let editingExistingCapital = false;
let editingArchiveId = null;


// ============================================================
// UTILITAIRES
// ============================================================

function parseNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return NaN;
    }

    return Number(
        String(value).replace(",", ".")
    );
}


function money(value) {

    const number =
        Number(value) || 0;

    return "$" + number.toFixed(2);
}


function formatNumber(
    value,
    decimals = 2
) {

    const number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {
        return "-";
    }

    return number.toFixed(
        decimals
    );
}


function generateId() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2)
    );
}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function getTodayDate() {

    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone:
                MADAGASCAR_TIMEZONE
        }
    ).format(
        new Date()
    );
}


function getMadagascarDateTime(
    value
) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }

    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            timeZone:
                MADAGASCAR_TIMEZONE,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    )
        .format(date)
        .replace(",", " à");
}


function formatStoredDateTime(
    value
) {
    return getMadagascarDateTime(
        value
    );
}


// ============================================================
// STOCKAGE
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
// CAPITAL
// ============================================================

function getCapitalRisk(
    capital = activeCapital
) {

    const risk =
        Number(
            capital?.riskReference ??
            capital?.riskPerTrade ??
            0
        );

    return (
        Number.isFinite(risk) &&
        risk > 0
    )
        ? risk
        : 0;
}


function getCapitalRR(
    capital = activeCapital
) {

    const rr =
        Number(
            capital?.rrTarget ??
            capital?.rr ??
            2
        );

    return (
        Number.isFinite(rr) &&
        rr >= MIN_RR
    )
        ? rr
        : MIN_RR;
}


function getCapitalObjective(
    capital = activeCapital
) {

    return (
        getCapitalRisk(capital) *
        getCapitalRR(capital)
    );
}


function getCapitalTrades(
    capitalId
) {

    return trades.filter(
        trade =>
            trade.capitalId ===
            capitalId
    );
}


function getActiveCapitalTrades() {

    if (!activeCapital) {
        return [];
    }

    return getCapitalTrades(
        activeCapital.id
    );
}


function calculateProfit(
    tradeList
) {

    return tradeList.reduce(
        (sum, trade) =>
            sum +
            (
                Number(trade.pnl) ||
                0
            ),
        0
    );
}


function calculateCurrentBalance() {

    return (
        Number(
            activeCapital.initialCapital
        ) || 0
    ) +
        calculateProfit(
            getActiveCapitalTrades()
        );
}


// ============================================================
// CHARGEMENT / MIGRATION
// ============================================================

function loadData() {

    try {

        trades =
            JSON.parse(
                localStorage.getItem(
                    TRADES_KEY
                )
            ) || [];

    } catch {

        trades = [];
    }


    try {

        archives =
            JSON.parse(
                localStorage.getItem(
                    ARCHIVES_KEY
                )
            ) || [];

    } catch {

        archives = [];
    }


    try {

        activeCapital =
            JSON.parse(
                localStorage.getItem(
                    CAPITAL_KEY
                )
            );

    } catch {

        activeCapital = null;
    }


    if (
        !Array.isArray(trades)
    ) {
        trades = [];
    }


    if (
        !Array.isArray(archives)
    ) {
        archives = [];
    }


    if (!activeCapital) {

        activeCapital = {

            id:
                generateId(),

            name:
                "Capital 1",

            initialCapital:
                0,

            riskReference:
                1,

            rrTarget:
                MIN_RR,

            createdAt:
                new Date().toISOString()
        };


        saveActiveCapital();
    }


    let changed = false;


    if (
        activeCapital.createdAt ===
        undefined
    ) {

        activeCapital.createdAt =
            null;

        changed = true;
    }


    if (
        activeCapital.riskReference ===
        undefined
    ) {

        if (
            activeCapital.riskPerTrade !==
            undefined
        ) {

            activeCapital.riskReference =
                Number(
                    activeCapital.riskPerTrade
                );

        } else {

            activeCapital.riskReference =
                1;
        }

        changed = true;
    }


    if (
        activeCapital.rrTarget ===
        undefined
    ) {

        if (
            activeCapital.objectivePerTrade !==
                undefined &&
            Number(
                activeCapital.riskReference
            ) > 0
        ) {

            activeCapital.rrTarget =
                Number(
                    activeCapital
                        .objectivePerTrade
                ) /
                Number(
                    activeCapital
                        .riskReference
                );

        } else {

            activeCapital.rrTarget =
                MIN_RR;
        }

        changed = true;
    }


    if (
        !Number.isFinite(
            Number(
                activeCapital.rrTarget
            )
        ) ||
        Number(
            activeCapital.rrTarget
        ) < MIN_RR
    ) {

        activeCapital.rrTarget =
            MIN_RR;

        changed = true;
    }


    trades.forEach(
        trade => {

            if (!trade.capitalId) {

                trade.capitalId =
                    activeCapital.id;

                changed = true;
            }


            if (
                trade.pnl ===
                    undefined &&
                trade.profit !==
                    undefined
            ) {

                trade.pnl =
                    parseNumber(
                        trade.profit
                    );

                changed = true;
            }


            if (
                trade.position ===
                    undefined &&
                trade.direction !==
                    undefined
            ) {

                trade.position =
                    trade.direction;

                changed = true;
            }


            if (
                trade.createdAt ===
                undefined
            ) {

                trade.createdAt =
                    null;

                changed = true;
            }


            if (
                trade.rrTarget ===
                    undefined &&
                trade.rr !==
                    undefined
            ) {

                trade.rrTarget =
                    Number(
                        trade.rr
                    );

                changed = true;
            }

        }
    );


    if (changed) {

        saveTrades();
        saveActiveCapital();
    }
}


// ============================================================
// PERIODES
// ============================================================

function parseTradeDate(
    date
) {

    if (!date) {
        return null;
    }


    const parts =
        date.split("-")
            .map(Number);


    if (
        parts.length !== 3
    ) {
        return null;
    }


    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );
}


function isSameDay(
    date
) {

    const tradeDate =
        parseTradeDate(date);


    const today =
        parseTradeDate(
            getTodayDate()
        );


    if (
        !tradeDate ||
        !today
    ) {

        return false;
    }


    return (
        tradeDate.getFullYear() ===
            today.getFullYear() &&
        tradeDate.getMonth() ===
            today.getMonth() &&
        tradeDate.getDate() ===
            today.getDate()
    );
}


function isThisWeek(
    date
) {

    const tradeDate =
        parseTradeDate(date);


    const today =
        parseTradeDate(
            getTodayDate()
        );


    if (
        !tradeDate ||
        !today
    ) {

        return false;
    }


    const day =
        today.getDay();


    const diff =
        day === 0
            ? 6
            : day - 1;


    const monday =
        new Date(today);


    monday.setDate(
        monday.getDate() -
        diff
    );


    monday.setHours(
        0,
        0,
        0,
        0
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


function isThisMonth(
    date
) {

    const tradeDate =
        parseTradeDate(date);


    const today =
        parseTradeDate(
            getTodayDate()
        );


    if (
        !tradeDate ||
        !today
    ) {

        return false;
    }


    return (
        tradeDate.getFullYear() ===
            today.getFullYear() &&
        tradeDate.getMonth() ===
            today.getMonth()
    );
}


function isThisYear(
    date
) {

    const tradeDate =
        parseTradeDate(date);


    const today =
        parseTradeDate(
            getTodayDate()
        );


    if (
        !tradeDate ||
        !today
    ) {

        return false;
    }


    return (
        tradeDate.getFullYear() ===
        today.getFullYear()
    );
}


function filterByPeriod(
    tradeList
) {

    if (
        currentPeriod ===
        "all"
    ) {

        return [
            ...tradeList
        ];
    }


    return tradeList.filter(
        trade => {

            if (!trade.date) {
                return false;
            }


            if (
                currentPeriod ===
                "today"
            ) {

                return isSameDay(
                    trade.date
                );
            }


            if (
                currentPeriod ===
                "week"
            ) {

                return isThisWeek(
                    trade.date
                );
            }


            if (
                currentPeriod ===
                "month"
            ) {

                return isThisMonth(
                    trade.date
                );
            }


            if (
                currentPeriod ===
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


// ============================================================
// STATISTIQUES
// ============================================================

function calculateWinrate(
    tradeList
) {

    if (
        tradeList.length === 0
    ) {

        return 0;
    }


    const winners =
        tradeList.filter(
            trade =>
                trade.result ===
                "TP"
        ).length;


    return (
        winners /
        tradeList.length
    ) * 100;
}


function calculateAverageRR(
    tradeList
) {

    const values =
        tradeList
            .map(
                trade =>
                    Number(
                        trade.rrTarget ??
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


    if (
        values.length === 0
    ) {

        return 0;
    }


    return (
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        ) /
        values.length
    );
}


function calculateProfitFactor(
    tradeList
) {

    const wins =
        tradeList
            .filter(
                trade =>
                    Number(
                        trade.pnl
                    ) > 0
            )
            .reduce(
                (sum, trade) =>
                    sum +
                    Number(
                        trade.pnl
                    ),
                0
            );


    const losses =
        tradeList
            .filter(
                trade =>
                    Number(
                        trade.pnl
                    ) < 0
            )
            .reduce(
                (sum, trade) =>
                    sum +
                    Math.abs(
                        Number(
                            trade.pnl
                        )
                    ),
                0
            );


    if (
        losses === 0 &&
        wins > 0
    ) {

        return Infinity;
    }


    if (
        losses === 0
    ) {

        return 0;
    }


    return wins / losses;
}


function calculateAverageTrade(
    tradeList
) {

    if (
        tradeList.length === 0
    ) {

        return 0;
    }


    return (
        calculateProfit(
            tradeList
        ) /
        tradeList.length
    );
}


function calculateAverageWin(
    tradeList
) {

    const wins =
        tradeList
            .filter(
                trade =>
                    Number(
                        trade.pnl
                    ) > 0
            )
            .map(
                trade =>
                    Number(
                        trade.pnl
                    )
            );


    if (
        wins.length === 0
    ) {

        return 0;
    }


    return (
        wins.reduce(
            (sum, value) =>
                sum + value,
            0
        ) /
        wins.length
    );
}


function calculateAverageLoss(
    tradeList
) {

    const losses =
        tradeList
            .filter(
                trade =>
                    Number(
                        trade.pnl
                    ) < 0
            )
            .map(
                trade =>
                    Number(
                        trade.pnl
                    )
            );


    if (
        losses.length === 0
    ) {

        return 0;
    }


    return (
        losses.reduce(
            (sum, value) =>
                sum + value,
            0
        ) /
        losses.length
    );
}


function calculateBestTrade(
    tradeList
) {

    if (
        tradeList.length === 0
    ) {

        return 0;
    }


    return Math.max(
        ...tradeList.map(
            trade =>
                Number(
                    trade.pnl
                ) || 0
        )
    );
}


function calculateWorstTrade(
    tradeList
) {

    if (
        tradeList.length === 0
    ) {

        return 0;
    }


    return Math.min(
        ...tradeList.map(
            trade =>
                Number(
                    trade.pnl
                ) || 0
        )
    );
}


function calculateMaxWinStreak(
    tradeList
) {

    let current = 0;
    let max = 0;


    tradeList.forEach(
        trade => {

            if (
                trade.result ===
                "TP"
            ) {

                current++;

                max =
                    Math.max(
                        max,
                        current
                    );

            } else {

                current = 0;
            }
        }
    );


    return max;
}


function calculateMaxLossStreak(
    tradeList
) {

    let current = 0;
    let max = 0;


    tradeList.forEach(
        trade => {

            if (
                trade.result ===
                "SL"
            ) {

                current++;

                max =
                    Math.max(
                        max,
                        current
                    );

            } else {

                current = 0;
            }
        }
    );


    return max;
}


function calculateMaxDrawdown(
    tradeList
) {

    if (
        tradeList.length === 0
    ) {

        return 0;
    }


    const chronological =
        [...tradeList].sort(
            (a, b) => {

                const dateDifference =
                    parseTradeDate(
                        a.date
                    ) -
                    parseTradeDate(
                        b.date
                    );


                if (
                    dateDifference !== 0
                ) {

                    return dateDifference;
                }


                return (
                    new Date(
                        a.createdAt ||
                        0
                    ) -
                    new Date(
                        b.createdAt ||
                        0
                    )
                );
            }
        );


    let balance =
        Number(
            activeCapital.initialCapital
        ) || 0;


    let peak =
        balance;


    let maxDrawdown =
        0;


    chronological.forEach(
        trade => {

            balance +=
                Number(
                    trade.pnl
                ) || 0;


            peak =
                Math.max(
                    peak,
                    balance
                );


            maxDrawdown =
                Math.max(
                    maxDrawdown,
                    peak - balance
                );
        }
    );


    return maxDrawdown;
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


function findBestSetup(
    tradeList
) {

    if (
        tradeList.length === 0
    ) {

        return "-";
    }


    const stats = {};


    tradeList.forEach(
        trade => {

            if (!trade.setup) {
                return;
            }


            if (
                !stats[
                    trade.setup
                ]
            ) {

                stats[
                    trade.setup
                ] = {

                    trades: 0,

                    winners: 0
                };
            }


            stats[
                trade.setup
            ].trades++;


            if (
                trade.result ===
                "TP"
            ) {

                stats[
                    trade.setup
                ].winners++;
            }
        }
    );


    let bestSetup =
        "-";

    let bestWinrate =
        -1;

    let bestTrades =
        -1;


    Object.entries(stats)
        .forEach(
            ([setup, value]) => {

                const winrate =
                    value.trades >
                    0
                        ? value.winners /
                          value.trades
                        : 0;


                if (
                    winrate >
                        bestWinrate ||
                    (
                        winrate ===
                            bestWinrate &&
                        value.trades >
                            bestTrades
                    )
                ) {

                    bestSetup =
                        setup;

                    bestWinrate =
                        winrate;

                    bestTrades =
                        value.trades;
                }
            }
        );


    return bestSetup;
}


function getLastKnownTrade(
    tradeList
) {

    if (
        tradeList.length === 0
    ) {

        return null;
    }


    return [
        ...tradeList
    ].sort(
        (a, b) =>
            new Date(
                b.createdAt || 0
            ) -
            new Date(
                a.createdAt || 0
            )
    )[0];
}


// ============================================================
// PERFORMANCE
// ============================================================

function renderPerformance() {

    const currentTrades =
        getActiveCapitalTrades();


    const periodTrades =
        filterByPeriod(
            currentTrades
        );


    document.getElementById(
        "statBalance"
    ).textContent =
        money(
            calculateCurrentBalance()
        );


    document.getElementById(
        "statProfit"
    ).textContent =
        money(
            calculateProfit(
                periodTrades
            )
        );


    document.getElementById(
        "statWinrate"
    ).textContent =
        calculateWinrate(
            periodTrades
        ).toFixed(1) +
        "%";


    document.getElementById(
        "statAverageRR"
    ).textContent =
        calculateAverageRR(
            periodTrades
        ).toFixed(2);


    document.getElementById(
        "statTrades"
    ).textContent =
        periodTrades.length;


    document.getElementById(
        "statBestSetup"
    ).textContent =
        findBestSetup(
            periodTrades
        );


    const lastTrade =
        getLastKnownTrade(
            currentTrades
        );


    document.getElementById(
        "statLastTrade"
    ).textContent =
        lastTrade &&
        lastTrade.createdAt
            ? formatStoredDateTime(
                  lastTrade.createdAt
              )
            : "-";


    document.getElementById(
        "statProfitFactor"
    ).textContent =
        formatProfitFactor(
            calculateProfitFactor(
                periodTrades
            )
        );


    document.getElementById(
        "statAverageTrade"
    ).textContent =
        money(
            calculateAverageTrade(
                periodTrades
            )
        );


    document.getElementById(
        "statAverageWin"
    ).textContent =
        money(
            calculateAverageWin(
                periodTrades
            )
        );


    document.getElementById(
        "statAverageLoss"
    ).textContent =
        money(
            calculateAverageLoss(
                periodTrades
            )
        );


    document.getElementById(
        "statBestTrade"
    ).textContent =
        money(
            calculateBestTrade(
                periodTrades
            )
        );


    document.getElementById(
        "statWorstTrade"
    ).textContent =
        money(
            calculateWorstTrade(
                periodTrades
            )
        );


    document.getElementById(
        "statMaxWinStreak"
    ).textContent =
        calculateMaxWinStreak(
            periodTrades
        );


    document.getElementById(
        "statMaxLossStreak"
    ).textContent =
        calculateMaxLossStreak(
            periodTrades
        );


    document.getElementById(
        "statMaxDrawdown"
    ).textContent =
        money(
            calculateMaxDrawdown(
                periodTrades
            )
        );
}


// ============================================================
// PERFORMANCE SETUPS
// ============================================================

function renderSetupTable() {

    const tbody =
        document.getElementById(
            "setupTableBody"
        );


    tbody.innerHTML = "";


    const periodTrades =
        filterByPeriod(
            getActiveCapitalTrades()
        );


    SETUPS.forEach(
        setup => {

            const setupTrades =
                periodTrades.filter(
                    trade =>
                        trade.setup ===
                        setup
                );


            const winners =
                setupTrades.filter(
                    trade =>
                        trade.result ===
                        "TP"
                ).length;


            const winrate =
                setupTrades.length >
                0
                    ? (
                        winners /
                        setupTrades.length
                    ) * 100
                    : 0;


            const profit =
                calculateProfit(
                    setupTrades
                );


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `
                <td>${escapeHtml(setup)}</td>
                <td>${setupTrades.length}</td>
                <td>${winners}</td>
                <td>${winrate.toFixed(1)}%</td>
                <td>${money(profit)}</td>
            `;


            tbody.appendChild(
                row
            );
        }
    );
}


// ============================================================
// PERFORMANCE ACTIFS
// ============================================================

function renderAssetTable() {

    const tbody =
        document.getElementById(
            "assetTableBody"
        );


    tbody.innerHTML = "";


    const periodTrades =
        filterByPeriod(
            getActiveCapitalTrades()
        );


    ASSETS.forEach(
        asset => {

            const assetTrades =
                periodTrades.filter(
                    trade =>
                        String(
                            trade.asset ||
                            ""
                        ).trim() ===
                        asset
                );


            const winners =
                assetTrades.filter(
                    trade =>
                        trade.result ===
                        "TP"
                ).length;


            const losers =
                assetTrades.filter(
                    trade =>
                        trade.result ===
                        "SL"
                ).length;


            const be =
                assetTrades.filter(
                    trade =>
                        trade.result ===
                        "BE"
                ).length;


            const winrate =
                assetTrades.length >
                0
                    ? (
                        winners /
                        assetTrades.length
                    ) * 100
                    : 0;


            const profit =
                calculateProfit(
                    assetTrades
                );


            const averageRR =
                calculateAverageRR(
                    assetTrades
                );


            const best =
                calculateBestTrade(
                    assetTrades
                );


            const worst =
                calculateWorstTrade(
                    assetTrades
                );


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `
                <td>
                    <strong>
                        ${escapeHtml(asset)}
                    </strong>
                </td>

                <td>
                    ${assetTrades.length}
                </td>

                <td>
                    ${winners}
                </td>

                <td>
                    ${losers}
                </td>

                <td>
                    ${be}
                </td>

                <td>
                    ${winrate.toFixed(1)}%
                </td>

                <td class="${
                    profit > 0
                        ? "profit-positive"
                        : profit < 0
                            ? "profit-negative"
                            : ""
                }">
                    ${money(profit)}
                </td>

                <td>
                    ${averageRR.toFixed(2)}
                </td>

                <td class="${
                    best > 0
                        ? "profit-positive"
                        : ""
                }">
                    ${
                        assetTrades.length > 0
                            ? money(best)
                            : "-"
                    }
                </td>

                <td class="${
                    worst < 0
                        ? "profit-negative"
                        : ""
                }">
                    ${
                        assetTrades.length > 0
                            ? money(worst)
                            : "-"
                    }
                </td>
            `;


            tbody.appendChild(
                row
            );
        }
    );
}


// ============================================================
// HISTORIQUE
// ============================================================

function calculatePips(
    asset,
    direction,
    entry,
    exit
) {

    if (
        !Number.isFinite(
            Number(entry)
        ) ||
        !Number.isFinite(
            Number(exit)
        )
    ) {

        return 0;
    }


    const difference =
        direction === "SELL"
            ? Number(entry) -
              Number(exit)
            : Number(exit) -
              Number(entry);


    let multiplier =
        10000;


    if (
        asset ===
        "USD/JPY"
    ) {

        multiplier = 100;
    }


    if (
        asset ===
        "XAUUSD"
    ) {

        multiplier = 100;
    }


    if (
        asset ===
        "BTCUSD"
    ) {

        multiplier = 100;
    }


    return (
        difference *
        multiplier
    );
}


function renderHistory() {

    const tbody =
        document.getElementById(
            "historyBody"
        );


    tbody.innerHTML = "";


    const currentTrades =
        getActiveCapitalTrades();


    const sortedTrades =
        [...currentTrades].sort(
            (a, b) => {

                const dateDifference =
                    parseTradeDate(
                        b.date
                    ) -
                    parseTradeDate(
                        a.date
                    );


                if (
                    dateDifference !==
                    0
                ) {

                    return dateDifference;
                }


                return (
                    new Date(
                        b.createdAt ||
                        0
                    ) -
                    new Date(
                        a.createdAt ||
                        0
                    )
                );
            }
        );


    if (
        sortedTrades.length === 0
    ) {

        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `
            <td
                colspan="14"
                class="empty-table"
            >
                Aucun trade enregistré.
            </td>
        `;


        tbody.appendChild(
            row
        );

        return;
    }


    sortedTrades.forEach(
        trade => {

            const entry =
                Number(
                    trade.entry
                );


            const sl =
                Number(
                    trade.sl
                );


            const tp =
                Number(
                    trade.tp
                );


            const exit =
                trade.result ===
                "TP"
                    ? tp
                    : trade.result ===
                      "SL"
                        ? sl
                        : entry;


            const pips =
                calculatePips(
                    trade.asset,
                    trade.position,
                    entry,
                    exit
                );


            const pnl =
                Number(
                    trade.pnl
                ) || 0;


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `
                <td>
                    ${escapeHtml(
                        trade.date || "-"
                    )}
                </td>

                <td>
                    ${
                        trade.createdAt
                            ? escapeHtml(
                                  formatStoredDateTime(
                                      trade.createdAt
                                  )
                              )
                            : "-"
                    }
                </td>

                <td>
                    ${escapeHtml(
                        trade.asset || "-"
                    )}
                </td>

                <td>
                    <span class="position-badge ${
                        trade.position ===
                        "SELL"
                            ? "sell"
                            : "buy"
                    }">
                        ${
                            trade.position ===
                            "SELL"
                                ? "Sell"
                                : "Buy"
                        }
                    </span>
                </td>

                <td>
                    ${
                        Number.isFinite(
                            Number(
                                trade.lot
                            )
                        )
                            ? Number(
                                  trade.lot
                              ).toFixed(2)
                            : "-"
                    }
                </td>

                <td>
                    ${formatNumber(entry)}
                </td>

                <td>
                    ${formatNumber(sl)}
                </td>

                <td>
                    ${formatNumber(tp)}
                </td>

                <td>
                    ${
                        Number.isFinite(
                            Number(
                                trade.rrTarget ??
                                trade.rr
                            )
                        )
                            ? Number(
                                  trade.rrTarget ??
                                  trade.rr
                              ).toFixed(2)
                            : "0.00"
                    }
                </td>

                <td>
                    ${pips.toFixed(1)}
                </td>

                <td>
                    ${escapeHtml(
                        trade.setup || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        trade.result || "-"
                    )}
                </td>

                <td class="${
                    pnl > 0
                        ? "profit-positive"
                        : pnl < 0
                            ? "profit-negative"
                            : ""
                }">
                    ${money(pnl)}
                </td>

                <td>
                    <button
                        class="delete-trade-btn"
                        data-id="${escapeHtml(
                            trade.id
                        )}"
                        title="Supprimer"
                    >
                        🗑️
                    </button>
                </td>
            `;


            tbody.appendChild(
                row
            );
        }
    );


    document
        .querySelectorAll(
            ".delete-trade-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteTrade(
                            button.dataset.id
                        );
                    }
                );
            }
        );
}


// ============================================================
// MONEY MANAGEMENT
// ============================================================

function getPipValuePerLotUSD(
    asset,
    entry
) {

    const price =
        Number(entry);


    if (
        !Number.isFinite(
            price
        ) ||
        price <= 0
    ) {

        return 0;
    }


    if (
        asset === "EUR/USD" ||
        asset === "GBP/USD" ||
        asset === "AUD/USD" ||
        asset === "NZD/USD"
    ) {

        return 10;
    }


    if (
        asset === "USD/CAD" ||
        asset === "USD/CHF"
    ) {

        return 10 / price;
    }


    if (
        asset === "USD/JPY"
    ) {

        return 1000 / price;
    }


    return 0;
}


function calculateRawLot(
    asset,
    entry,
    sl,
    riskReference
) {

    const distance =
        Math.abs(
            Number(entry) -
            Number(sl)
        );


    if (
        !Number.isFinite(
            distance
        ) ||
        distance <= 0
    ) {

        return 0;
    }


    if (
        asset === "XAUUSD"
    ) {

        return (
            Number(
                riskReference
            ) /
            (
                distance *
                100
            )
        );
    }


    if (
        asset === "BTCUSD"
    ) {

        return (
            Number(
                riskReference
            ) /
            distance
        );
    }


    const pipValue =
        getPipValuePerLotUSD(
            asset,
            entry
        );


    if (
        pipValue <= 0
    ) {

        return 0;
    }


    let multiplier =
        10000;


    if (
        asset ===
        "USD/JPY"
    ) {

        multiplier = 100;
    }


    const pips =
        distance *
        multiplier;


    return (
        Number(
            riskReference
        ) /
        (
            pips *
            pipValue
        )
    );
}


function floorToLotStep(
    lot
) {

    if (
        !Number.isFinite(
            lot
        )
    ) {

        return 0;
    }


    return Number(
        (
            Math.floor(
                lot /
                LOT_STEP
            ) *
            LOT_STEP
        ).toFixed(2)
    );
}


function calculateAutomaticLot(
    asset,
    entry,
    sl,
    riskReference
) {

    const rawLot =
        calculateRawLot(
            asset,
            entry,
            sl,
            riskReference
        );


    const lot =
        floorToLotStep(
            rawLot
        );


    return lot >= MIN_LOT
        ? lot
        : 0;
}


function calculateRiskForLot(
    asset,
    entry,
    sl,
    lot
) {

    const distance =
        Math.abs(
            Number(entry) -
            Number(sl)
        );


    const volume =
        Number(lot);


    if (
        !Number.isFinite(
            distance
        ) ||
        distance <= 0 ||
        !Number.isFinite(
            volume
        ) ||
        volume <= 0
    ) {

        return 0;
    }


    if (
        asset ===
        "XAUUSD"
    ) {

        return (
            distance *
            100 *
            volume
        );
    }


    if (
        asset ===
        "BTCUSD"
    ) {

        return (
            distance *
            volume
        );
    }


    const pipValue =
        getPipValuePerLotUSD(
            asset,
            entry
        );


    let multiplier =
        10000;


    if (
        asset ===
        "USD/JPY"
    ) {

        multiplier = 100;
    }


    const pips =
        distance *
        multiplier;


    return (
        pips *
        pipValue *
        volume
    );
}


function calculateAutomaticTP(
    direction,
    entry,
    sl,
    rr
) {

    const distance =
        Math.abs(
            Number(entry) -
            Number(sl)
        );


    if (
        distance <= 0
    ) {

        return NaN;
    }


    if (
        direction ===
        "BUY"
    ) {

        return (
            Number(entry) +
            distance *
            Number(rr)
        );
    }


    return (
        Number(entry) -
        distance *
        Number(rr)
    );
}


function calculateAutomaticPnL(
    result,
    realRisk,
    rr
) {

    if (
        result ===
        "TP"
    ) {

        return (
            realRisk *
            rr
        );
    }


    if (
        result ===
        "SL"
    ) {

        return -realRisk;
    }


    return 0;
}


// ============================================================
// P/L SELON RESULTAT
// ============================================================

function updateProfitFieldState() {

    const result =
        document.getElementById(
            "result"
        ).value;


    const profitInput =
        document.getElementById(
            "profit"
        );


    const profitLabel =
        document.getElementById(
            "profitLabel"
        );


    if (
        result ===
        "BE"
    ) {

        profitInput.readOnly =
            false;

        profitInput.required =
            true;

        profitInput.placeholder =
            "Exemple : -0.20";


        profitLabel.textContent =
            "P/L réel du BE (manuel)";

    } else {

        profitInput.readOnly =
            true;

        profitInput.required =
            false;

        profitInput.placeholder =
            "Calculé automatiquement";


        profitLabel.textContent =
            "P/L automatique";
    }
}


function updateAutomaticTradeValues() {

    updateProfitFieldState();


    const asset =
        document.getElementById(
            "asset"
        ).value.trim();


    const direction =
        document.getElementById(
            "direction"
        ).value;


    const entry =
        parseNumber(
            document.getElementById(
                "entry"
            ).value
        );


    const sl =
        parseNumber(
            document.getElementById(
                "sl"
            ).value
        );


    const result =
        document.getElementById(
            "result"
        ).value;


    const lotInput =
        document.getElementById(
            "lot"
        );


    const tpInput =
        document.getElementById(
            "tp"
        );


    const rrInput =
        document.getElementById(
            "calculatedRR"
        );


    const profitInput =
        document.getElementById(
            "profit"
        );


    const info =
        document.getElementById(
            "tradeMMInfo"
        );


    if (
        !asset ||
        !Number.isFinite(
            entry
        ) ||
        !Number.isFinite(
            sl
        )
    ) {

        lotInput.value = "";
        tpInput.value = "";
        rrInput.value = "0.00";

        if (
            result !==
            "BE"
        ) {

            profitInput.value =
                "";
        }


        info.textContent =
            result === "BE"
                ? "Pour un BE, le P/L réel sera saisi manuellement."
                : "Le lot et le TP seront calculés automatiquement à partir du risque de référence et du RR cible.";

        return;
    }


    const riskReference =
        getCapitalRisk();


    const rr =
        getCapitalRR();


    const lot =
        calculateAutomaticLot(
            asset,
            entry,
            sl,
            riskReference
        );


    lotInput.value =
        lot > 0
            ? lot.toFixed(2)
            : "";


    if (
        lot <= 0
    ) {

        tpInput.value = "";
        rrInput.value =
            rr.toFixed(2);

        if (
            result !==
            "BE"
        ) {

            profitInput.value =
                "";
        }


        info.textContent =
            "Le lot calculé est inférieur à 0.01. Le trade ne peut pas être enregistré sans dépasser le risque de référence.";

        return;
    }


    const realRisk =
        calculateRiskForLot(
            asset,
            entry,
            sl,
            lot
        );


    const tp =
        calculateAutomaticTP(
            direction,
            entry,
            sl,
            rr
        );


    tpInput.value =
        Number.isFinite(tp)
            ? tp.toFixed(5)
            : "";


    rrInput.value =
        rr.toFixed(2);


    if (
        result ===
        "BE"
    ) {

        info.textContent =
            `Risque de référence : ${money(
                riskReference
            )} | ` +
            `Risque réel : ${money(
                realRisk
            )} | ` +
            `BE : P/L réel à saisir manuellement | ` +
            `RR théorique : ${rr.toFixed(2)}`;

    } else {

        const automaticPnL =
            calculateAutomaticPnL(
                result,
                realRisk,
                rr
            );


        profitInput.value =
            automaticPnL.toFixed(2);


        info.textContent =
            `Risque de référence : ${money(
                riskReference
            )} | ` +
            `Risque réel : ${money(
                realRisk
            )} | ` +
            `Objectif : ${money(
                realRisk * rr
            )} | ` +
            `Lot : ${lot.toFixed(2)} | ` +
            `RR : ${rr.toFixed(2)}`;
    }
}


// ============================================================
// VALIDATION TRADE
// ============================================================

function validateTrade(
    direction,
    entry,
    sl
) {

    if (
        !Number.isFinite(entry)
    ) {

        alert(
            "Veuillez entrer un Entry valide."
        );

        return false;
    }


    if (
        !Number.isFinite(sl)
    ) {

        alert(
            "Veuillez entrer un Stop Loss valide."
        );

        return false;
    }


    if (
        direction ===
            "BUY" &&
        sl >= entry
    ) {

        alert(
            "Pour un Buy, le Stop Loss doit être inférieur à l'Entry."
        );

        return false;
    }


    if (
        direction ===
            "SELL" &&
        sl <= entry
    ) {

        alert(
            "Pour un Sell, le Stop Loss doit être supérieur à l'Entry."
        );

        return false;
    }


    return true;
}


// ============================================================
// AJOUT TRADE
// ============================================================

function addTrade(event) {

    event.preventDefault();


    const asset =
        document.getElementById(
            "asset"
        ).value.trim();


    const date =
        document.getElementById(
            "date"
        ).value;


    const direction =
        document.getElementById(
            "direction"
        ).value;


    const orderType =
        document.getElementById(
            "orderType"
        ).value;


    const entry =
        parseNumber(
            document.getElementById(
                "entry"
            ).value
        );


    const sl =
        parseNumber(
            document.getElementById(
                "sl"
            ).value
        );


    const setup =
        document.getElementById(
            "setup"
        ).value;


    const result =
        document.getElementById(
            "result"
        ).value;


    const comment =
        document.getElementById(
            "comment"
        ).value.trim();


    const manualPnL =
        parseNumber(
            document.getElementById(
                "profit"
            ).value
        );


    if (!asset) {

        alert(
            "Veuillez sélectionner un actif."
        );

        return;
    }


    if (!date) {

        alert(
            "Veuillez sélectionner la date du trade."
        );

        return;
    }


    if (
        !validateTrade(
            direction,
            entry,
            sl
        )
    ) {

        return;
    }


    const riskReference =
        getCapitalRisk();


    const rrTarget =
        getCapitalRR();


    const lot =
        calculateAutomaticLot(
            asset,
            entry,
            sl,
            riskReference
        );


    if (
        lot < MIN_LOT
    ) {

        alert(
            "Le lot calculé est inférieur à 0.01. Le trade est bloqué afin de ne pas dépasser le risque de référence."
        );

        return;
    }


    const realRisk =
        calculateRiskForLot(
            asset,
            entry,
            sl,
            lot
        );


    if (
        realRisk <= 0
    ) {

        alert(
            "Impossible de calculer le risque réel."
        );

        return;
    }


    if (
        realRisk >
        riskReference +
        0.0000001
    ) {

        alert(
            "Le risque réel dépasse le risque de référence."
        );

        return;
    }


    const tp =
        calculateAutomaticTP(
            direction,
            entry,
            sl,
            rrTarget
        );


    let pnl = 0;


    if (
        result ===
        "BE"
    ) {

        if (
            !Number.isFinite(
                manualPnL
            )
        ) {

            alert(
                "Pour un BE, veuillez saisir manuellement le P/L réel."
            );

            return;
        }


        pnl =
            manualPnL;

    } else {

        pnl =
            calculateAutomaticPnL(
                result,
                realRisk,
                rrTarget
            );
    }


    const realObjective =
        realRisk *
        rrTarget;


    const trade = {

        id:
            generateId(),

        capitalId:
            activeCapital.id,

        asset,

        date,

        direction,

        position:
            direction,

        orderType,

        lot,

        entry,

        sl,

        tp,

        rr:
            rrTarget,

        rrTarget,

        result,

        setup,

        pnl,

        profit:
            pnl,

        riskTarget:
            riskReference,

        riskReference,

        realRisk,

        realObjective,

        comment,

        createdAt:
            new Date().toISOString()
    };


    trades.push(
        trade
    );


    saveTrades();


    document
        .getElementById(
            "tradeForm"
        )
        .reset();


    document.getElementById(
        "date"
    ).value =
        getTodayDate();


    document.getElementById(
        "direction"
    ).value =
        "BUY";


    document.getElementById(
        "orderType"
    ).value =
        "Market";


    document.getElementById(
        "result"
    ).value =
        "TP";


    document.getElementById(
        "setup"
    ).value =
        "LDP+QML";


    document.getElementById(
        "lot"
    ).value = "";


    document.getElementById(
        "tp"
    ).value = "";


    document.getElementById(
        "calculatedRR"
    ).value =
        "0.00";


    document.getElementById(
        "profit"
    ).value = "";


    updateProfitFieldState();


    refreshAll();


    alert(
        result === "BE"
            ? "Trade BE enregistré avec son P/L réel !"
            : "Trade enregistré avec succès !"
    );
}


// ============================================================
// SUPPRESSION TRADE
// ============================================================

function deleteTrade(
    id
) {

    const trade =
        trades.find(
            item =>
                item.id === id
        );


    if (!trade) {
        return;
    }


    const confirmed =
        confirm(
            "Voulez-vous vraiment supprimer ce trade ?"
        );


    if (!confirmed) {
        return;
    }


    trades =
        trades.filter(
            item =>
                item.id !== id
        );


    saveTrades();


    refreshAll();
}


// ============================================================
// CAPITAL MODAL
// ============================================================

function updateCapitalModalPreview() {

    const risk =
        parseNumber(
            document.getElementById(
                "capitalRiskInput"
            ).value
        );


    const rr =
        parseNumber(
            document.getElementById(
                "capitalRRInput"
            ).value
        );


    const safeRisk =
        Number.isFinite(risk)
            ? risk
            : 0;


    const safeRR =
        Number.isFinite(rr) &&
        rr >= MIN_RR
            ? rr
            : MIN_RR;


    document.getElementById(
        "capitalModalRiskPreview"
    ).textContent =
        "Risque : " +
        money(safeRisk);


    document.getElementById(
        "capitalModalRR"
    ).textContent =
        "RR cible : " +
        safeRR.toFixed(2);


    document.getElementById(
        "capitalModalObjective"
    ).textContent =
        money(
            safeRisk *
            safeRR
        );
}


function openCapitalModal(
    mode = "new"
) {

    const modal =
        document.getElementById(
            "capitalModal"
        );


    const title =
        document.getElementById(
            "capitalModalTitle"
        );


    const nameInput =
        document.getElementById(
            "capitalNameInput"
        );


    const amountInput =
        document.getElementById(
            "capitalAmountInput"
        );


    const riskInput =
        document.getElementById(
            "capitalRiskInput"
        );


    const rrInput =
        document.getElementById(
            "capitalRRInput"
        );


    editingExistingCapital =
        mode === "edit";


    editingArchiveId =
        null;


    if (
        mode ===
        "edit"
    ) {

        title.textContent =
            "Modifier le capital";


        nameInput.value =
            activeCapital.name;


        amountInput.value =
            activeCapital.initialCapital;


        riskInput.value =
            getCapitalRisk();


        rrInput.value =
            getCapitalRR();


        const currentTrades =
            getActiveCapitalTrades();


        amountInput.disabled =
            currentTrades.length >
            0;


        document.getElementById(
            "capitalAmountHelp"
        ).textContent =
            currentTrades.length >
            0
                ? "Capital initial verrouillé car ce capital contient des trades."
                : "Le capital initial sera verrouillé après le premier trade.";

    } else {

        title.textContent =
            "Nouveau capital";


        nameInput.value =
            "Capital " +
            (
                archives.length +
                1
            );


        amountInput.value =
            "";


        riskInput.value =
            "";


        rrInput.value =
            MIN_RR;


        amountInput.disabled =
            false;


        document.getElementById(
            "capitalAmountHelp"
        ).textContent =
            "Le capital initial est verrouillé après le premier trade.";
    }


    updateCapitalModalPreview();


    modal.classList.add(
        "show"
    );
}


function closeCapitalModal() {

    document.getElementById(
        "capitalModal"
    ).classList.remove(
        "show"
    );
}


// ============================================================
// NOUVEAU CAPITAL
// ============================================================

function createNewCapital() {

    const name =
        document.getElementById(
            "capitalNameInput"
        ).value.trim();


    const amount =
        parseNumber(
            document.getElementById(
                "capitalAmountInput"
            ).value
        );


    const risk =
        parseNumber(
            document.getElementById(
                "capitalRiskInput"
            ).value
        );


    const rr =
        parseNumber(
            document.getElementById(
                "capitalRRInput"
            ).value
        );


    if (!name) {

        alert(
            "Veuillez donner un nom au capital."
        );

        return;
    }


    if (
        !Number.isFinite(amount) ||
        amount < 0
    ) {

        alert(
            "Veuillez entrer un capital valide."
        );

        return;
    }


    if (
        !Number.isFinite(risk) ||
        risk <= 0
    ) {

        alert(
            "Veuillez entrer un risque de référence valide."
        );

        return;
    }


    if (
        !Number.isFinite(rr) ||
        rr < MIN_RR
    ) {

        alert(
            "Le RR cible minimum est 2.00."
        );

        return;
    }


    const currentTrades =
        getActiveCapitalTrades();


    if (
        currentTrades.length >
        0
    ) {

        createArchiveFromCurrentCapital();
    }


    activeCapital = {

        id:
            generateId(),

        name,

        initialCapital:
            amount,

        riskReference:
            risk,

        rrTarget:
            rr,

        createdAt:
            new Date().toISOString()
    };


    saveActiveCapital();


    closeCapitalModal();


    refreshAll();
}


// ============================================================
// MODIFICATION CAPITAL
// ============================================================

function saveCapitalModification() {

    const name =
        document.getElementById(
            "capitalNameInput"
        ).value.trim();


    const amount =
        parseNumber(
            document.getElementById(
                "capitalAmountInput"
            ).value
        );


    const risk =
        parseNumber(
            document.getElementById(
                "capitalRiskInput"
            ).value
        );


    const rr =
        parseNumber(
            document.getElementById(
                "capitalRRInput"
            ).value
        );


    if (!name) {

        alert(
            "Veuillez donner un nom au capital."
        );

        return;
    }


    if (
        !Number.isFinite(amount) ||
        amount < 0
    ) {

        alert(
            "Veuillez entrer un capital valide."
        );

        return;
    }


    if (
        !Number.isFinite(risk) ||
        risk <= 0
    ) {

        alert(
            "Veuillez entrer un risque de référence valide."
        );

        return;
    }


    if (
        !Number.isFinite(rr) ||
        rr < MIN_RR
    ) {

        alert(
            "Le RR cible minimum est 2.00."
        );

        return;
    }


    const currentTrades =
        getActiveCapitalTrades();


    if (
        currentTrades.length >
        0 &&
        amount !==
        Number(
            activeCapital.initialCapital
        )
    ) {

        alert(
            "Le capital initial est verrouillé car ce capital contient déjà des trades."
        );

        return;
    }


    activeCapital.name =
        name;


    activeCapital.riskReference =
        risk;


    activeCapital.rrTarget =
        rr;


    saveActiveCapital();


    closeCapitalModal();


    refreshAll();
}


// ============================================================
// ARCHIVE
// ============================================================

function createArchiveFromCurrentCapital() {

    const currentTrades =
        getActiveCapitalTrades();


    const archive = {

        id:
            generateId(),

        name:
            activeCapital.name,

        initialCapital:
            Number(
                activeCapital.initialCapital
            ) || 0,

        finalBalance:
            calculateCurrentBalance(),

        totalProfit:
            calculateProfit(
                currentTrades
            ),

        totalTrades:
            currentTrades.length,

        winrate:
            calculateWinrate(
                currentTrades
            ),

        riskReference:
            getCapitalRisk(),

        rrTarget:
            getCapitalRR(),

        objectivePerTrade:
            getCapitalObjective(),

        createdAt:
            activeCapital.createdAt ??
            null,

        archivedAt:
            new Date().toISOString(),

        trades:
            JSON.parse(
                JSON.stringify(
                    currentTrades
                )
            )
    };


    archives.push(
        archive
    );


    saveArchives();


    return archive;
}


function archiveCurrentCapital() {

    const confirmed =
        confirm(
            "Voulez-vous archiver le capital actuel ?"
        );


    if (!confirmed) {
        return;
    }


    const previousRisk =
        getCapitalRisk();


    const previousRR =
        getCapitalRR();


    createArchiveFromCurrentCapital();


    trades =
        trades.filter(
            trade =>
                trade.capitalId !==
                activeCapital.id
        );


    activeCapital = {

        id:
            generateId(),

        name:
            "Capital " +
            (
                archives.length +
                1
            ),

        initialCapital:
            0,

        riskReference:
            previousRisk ||
            1,

        rrTarget:
            previousRR ||
            MIN_RR,

        createdAt:
            new Date().toISOString()
    };


    saveTrades();
    saveActiveCapital();


    refreshAll();
}


// ============================================================
// MODIFIER ARCHIVE
// ============================================================

function openArchiveEdit(
    archiveId
) {

    const archive =
        archives.find(
            item =>
                item.id ===
                archiveId
        );


    if (!archive) {
        return;
    }


    editingArchiveId =
        archiveId;


    editingExistingCapital =
        false;


    document.getElementById(
        "capitalModalTitle"
    ).textContent =
        "Modifier le capital archivé";


    document.getElementById(
        "capitalNameInput"
    ).value =
        archive.name;


    document.getElementById(
        "capitalAmountInput"
    ).value =
        archive.initialCapital;


    document.getElementById(
        "capitalAmountInput"
    ).disabled =
        true;


    document.getElementById(
        "capitalRiskInput"
    ).value =
        getCapitalRisk(
            archive
        );


    document.getElementById(
        "capitalRRInput"
    ).value =
        getCapitalRR(
            archive
        );


    document.getElementById(
        "capitalAmountHelp"
    ).textContent =
        "Le capital initial d'une archive est verrouillé.";


    updateCapitalModalPreview();


    document.getElementById(
        "capitalModal"
    ).classList.add(
        "show"
    );
}


function saveArchiveModification() {

    if (
        !editingArchiveId
    ) {

        return;
    }


    const archive =
        archives.find(
            item =>
                item.id ===
                editingArchiveId
        );


    if (!archive) {
        return;
    }


    const name =
        document.getElementById(
            "capitalNameInput"
        ).value.trim();


    const risk =
        parseNumber(
            document.getElementById(
                "capitalRiskInput"
            ).value
        );


    const rr =
        parseNumber(
            document.getElementById(
                "capitalRRInput"
            ).value
        );


    if (!name) {

        alert(
            "Veuillez donner un nom."
        );

        return;
    }


    if (
        !Number.isFinite(risk) ||
        risk <= 0
    ) {

        alert(
            "Veuillez entrer un risque valide."
        );

        return;
    }


    if (
        !Number.isFinite(rr) ||
        rr < MIN_RR
    ) {

        alert(
            "Le RR minimum est 2.00."
        );

        return;
    }


    archive.name =
        name;


    archive.riskReference =
        risk;


    archive.rrTarget =
        rr;


    archive.objectivePerTrade =
        risk * rr;


    saveArchives();


    editingArchiveId =
        null;


    closeCapitalModal();


    refreshAll();
}


// ============================================================
// AFFICHAGE ARCHIVES
// ============================================================

function renderArchives() {

    const container =
        document.getElementById(
            "archivesList"
        );


    container.innerHTML = "";


    if (
        archives.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-archives">
                Aucun capital archivé pour le moment.
            </div>
        `;

        return;
    }


    const sorted =
        [...archives].sort(
            (a, b) =>
                new Date(
                    b.archivedAt || 0
                ) -
                new Date(
                    a.archivedAt || 0
                )
        );


    sorted.forEach(
        archive => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "archive-card";


            card.innerHTML = `

                <div class="archive-card-header">

                    <div>

                        <h3>
                            ${escapeHtml(
                                archive.name
                            )}
                        </h3>

                        <small>
                            Créé le
                            ${
                                archive.createdAt
                                    ? escapeHtml(
                                          formatStoredDateTime(
                                              archive.createdAt
                                          )
                                      )
                                    : "-"
                            }

                            <br>

                            Archivé le
                            ${
                                archive.archivedAt
                                    ? escapeHtml(
                                          formatStoredDateTime(
                                              archive.archivedAt
                                          )
                                      )
                                    : "-"
                            }
                        </small>

                    </div>

                </div>


                <div class="archive-stats">

                    <div>
                        <span>Initial</span>
                        <strong>
                            ${money(
                                archive.initialCapital
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Final</span>
                        <strong>
                            ${money(
                                archive.finalBalance
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Profit</span>
                        <strong>
                            ${money(
                                archive.totalProfit
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Trades</span>
                        <strong>
                            ${
                                archive.totalTrades ??
                                (
                                    Array.isArray(
                                        archive.trades
                                    )
                                        ? archive.trades.length
                                        : 0
                                )
                            }
                        </strong>
                    </div>

                    <div>
                        <span>Winrate</span>
                        <strong>
                            ${Number(
                                archive.winrate || 0
                            ).toFixed(1)}%
                        </strong>
                    </div>

                    <div>
                        <span>RR</span>
                        <strong>
                            ${Number(
                                archive.rrTarget ||
                                MIN_RR
                            ).toFixed(2)}
                        </strong>
                    </div>

                </div>


                <div class="archive-actions">

                    <button
                        class="secondary-btn view-archive-chart"
                        data-id="${archive.id}"
                    >
                        📈 Voir le graphique
                    </button>

                    <button
                        class="secondary-btn edit-archive"
                        data-id="${archive.id}"
                    >
                        ✏️ Modifier
                    </button>

                    <button
                        class="danger-btn delete-archive"
                        data-id="${archive.id}"
                    >
                        🗑️ Supprimer
                    </button>

                </div>
            `;


            container.appendChild(
                card
            );
        }
    );


    document
        .querySelectorAll(
            ".view-archive-chart"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const archive =
                            archives.find(
                                item =>
                                    item.id ===
                                    button.dataset.id
                            );


                        if (archive) {

                            openArchiveChart(
                                archive
                            );
                        }
                    }
                );
            }
        );


    document
        .querySelectorAll(
            ".edit-archive"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openArchiveEdit(
                            button.dataset.id
                        );
                    }
                );
            }
        );


    document
        .querySelectorAll(
            ".delete-archive"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteArchive(
                            button.dataset.id
                        );
                    }
                );
            }
        );
}


// ============================================================
// SUPPRIMER ARCHIVE
// ============================================================

function deleteArchive(
    id
) {

    const confirmed =
        confirm(
            "Voulez-vous vraiment supprimer cette archive ? Cette action est irréversible."
        );


    if (!confirmed) {
        return;
    }


    archives =
        archives.filter(
            archive =>
                archive.id !==
                id
        );


    saveArchives();


    renderArchives();
}


// ============================================================
// GRAPHIQUE
// ============================================================

function calculateChartScale(
    values
) {

    if (
        values.length === 0
    ) {

        return {
            min: 0,
            max: 100,
            step: 10
        };
    }


    const minValue =
        Math.min(
            ...values
        );


    const maxValue =
        Math.max(
            ...values
        );


    const range =
        maxValue -
        minValue;


    let step = 5;


    const absoluteMax =
        Math.max(
            Math.abs(
                minValue
            ),
            Math.abs(
                maxValue
            )
        );


    if (
        absoluteMax >
        1000
    ) {

        step = 100;

    } else if (
        absoluteMax >
        500
    ) {

        step = 50;

    } else if (
        range >
        200
    ) {

        step = 25;

    } else if (
        range >
        100
    ) {

        step = 10;
    }


    if (
        range <
        step
    ) {

        step = 1;
    }


    let min =
        Math.floor(
            minValue /
            step
        ) * step;


    let max =
        Math.ceil(
            maxValue /
            step
        ) * step;


    if (
        max <= min
    ) {

        max =
            min +
            step;
    }


    return {
        min,
        max,
        step
    };
}


function drawCapitalChart() {

    const canvas =
        document.getElementById(
            "capitalChart"
        );


    const emptyMessage =
        document.getElementById(
            "emptyChartMessage"
        );


    if (!canvas) {
        return;
    }


    const currentTrades =
        getActiveCapitalTrades();


    const sorted =
        [...currentTrades].sort(
            (a, b) =>
                parseTradeDate(
                    a.date
                ) -
                parseTradeDate(
                    b.date
                )
        );


    if (
        sorted.length === 0
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


    const ctx =
        canvas.getContext(
            "2d"
        );


    const rect =
        canvas.getBoundingClientRect();


    const dpr =
        window.devicePixelRatio ||
        1;


    const width =
        Math.max(
            rect.width,
            300
        );


    const height =
        Math.max(
            rect.height,
            300
        );


    canvas.width =
        width * dpr;


    canvas.height =
        height * dpr;


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    const values = [

        Number(
            activeCapital.initialCapital
        ) || 0

    ];


    let balance =
        Number(
            activeCapital.initialCapital
        ) || 0;


    sorted.forEach(
        trade => {

            balance +=
                Number(
                    trade.pnl
                ) || 0;


            values.push(
                balance
            );
        }
    );


    const scale =
        calculateChartScale(
            values
        );


    const paddingLeft = 65;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 45;


    const chartWidth =
        width -
        paddingLeft -
        paddingRight;


    const chartHeight =
        height -
        paddingTop -
        paddingBottom;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    ctx.font =
        "12px Arial";


    ctx.textAlign =
        "right";


    ctx.textBaseline =
        "middle";


    for (
        let value =
            scale.min;

        value <=
            scale.max +
            0.0001;

        value +=
            scale.step
    ) {

        const ratio =
            (
                value -
                scale.min
            ) /
            (
                scale.max -
                scale.min
            );


        const y =
            paddingTop +
            chartHeight -
            ratio *
            chartHeight;


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
            "rgba(148,163,184,0.20)";


        ctx.lineWidth =
            1;


        ctx.stroke();


        ctx.fillStyle =
            "#64748b";


        ctx.fillText(
            "$" +
            value.toFixed(0),
            paddingLeft - 8,
            y
        );
    }


    const points = [];


    values.forEach(
        (value, index) => {

            const x =
                paddingLeft +
                (
                    index /
                    Math.max(
                        values.length -
                        1,
                        1
                    )
                ) *
                chartWidth;


            const ratio =
                (
                    value -
                    scale.min
                ) /
                (
                    scale.max -
                    scale.min
                );


            const y =
                paddingTop +
                chartHeight -
                ratio *
                chartHeight;


            points.push({
                x,
                y
            });
        }
    );


    for (
        let i = 0;
        i <
            points.length -
            1;
        i++
    ) {

        const pnl =
            Number(
                sorted[i].pnl
            ) || 0;


        let color =
            "#64748b";


        if (
            pnl > 0
        ) {

            color =
                "#16a34a";
        }


        if (
            pnl < 0
        ) {

            color =
                "#dc2626";
        }


        ctx.beginPath();


        ctx.moveTo(
            points[i].x,
            points[i].y
        );


        ctx.lineTo(
            points[
                i + 1
            ].x,
            points[
                i + 1
            ].y
        );


        ctx.strokeStyle =
            color;


        ctx.lineWidth =
            3;


        ctx.lineCap =
            "round";


        ctx.stroke();
    }
}


// ============================================================
// GRAPHIQUE ARCHIVE
// ============================================================

function drawArchiveChart(
    archive
) {

    const canvas =
        document.getElementById(
            "archiveChart"
        );


    if (!canvas) {
        return;
    }


    const archivedTrades =
        Array.isArray(
            archive.trades
        )
            ? archive.trades
            : [];


    const sorted =
        [...archivedTrades].sort(
            (a, b) =>
                parseTradeDate(
                    a.date
                ) -
                parseTradeDate(
                    b.date
                )
        );


    const initial =
        Number(
            archive.initialCapital
        ) || 0;


    const values = [
        initial
    ];


    let balance =
        initial;


    sorted.forEach(
        trade => {

            balance +=
                Number(
                    trade.pnl
                ) || 0;


            values.push(
                balance
            );
        }
    );


    const ctx =
        canvas.getContext(
            "2d"
        );


    const rect =
        canvas.getBoundingClientRect();


    const dpr =
        window.devicePixelRatio ||
        1;


    const width =
        Math.max(
            rect.width,
            300
        );


    const height =
        Math.max(
            rect.height,
            300
        );


    canvas.width =
        width * dpr;


    canvas.height =
        height * dpr;


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    const scale =
        calculateChartScale(
            values
        );


    const paddingLeft = 65;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 45;


    const chartWidth =
        width -
        paddingLeft -
        paddingRight;


    const chartHeight =
        height -
        paddingTop -
        paddingBottom;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    ctx.font =
        "12px Arial";


    ctx.textAlign =
        "right";


    ctx.textBaseline =
        "middle";


    for (
        let value =
            scale.min;

        value <=
            scale.max +
            0.0001;

        value +=
            scale.step
    ) {

        const ratio =
            (
                value -
                scale.min
            ) /
            (
                scale.max -
                scale.min
            );


        const y =
            paddingTop +
            chartHeight -
            ratio *
            chartHeight;


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
            "rgba(148,163,184,0.20)";


        ctx.stroke();


        ctx.fillStyle =
            "#64748b";


        ctx.fillText(
            "$" +
            value.toFixed(0),
            paddingLeft - 8,
            y
        );
    }


    const points = [];


    values.forEach(
        (value, index) => {

            const x =
                paddingLeft +
                (
                    index /
                    Math.max(
                        values.length -
                        1,
                        1
                    )
                ) *
                chartWidth;


            const ratio =
                (
                    value -
                    scale.min
                ) /
                (
                    scale.max -
                    scale.min
                );


            const y =
                paddingTop +
                chartHeight -
                ratio *
                chartHeight;


            points.push({
                x,
                y
            });
        }
    );


    for (
        let i = 0;
        i <
            points.length -
            1;
        i++
    ) {

        const pnl =
            Number(
                sorted[i].pnl
            ) || 0;


        let color =
            "#64748b";


        if (
            pnl > 0
        ) {

            color =
                "#16a34a";
        }


        if (
            pnl < 0
        ) {

            color =
                "#dc2626";
        }


        ctx.beginPath();


        ctx.moveTo(
            points[i].x,
            points[i].y
        );


        ctx.lineTo(
            points[
                i + 1
            ].x,
            points[
                i + 1
            ].y
        );


        ctx.strokeStyle =
            color;


        ctx.lineWidth =
            3;


        ctx.lineCap =
            "round";


        ctx.stroke();
    }
}


function openArchiveChart(
    archive
) {

    document.getElementById(
        "archiveChartTitle"
    ).textContent =
        archive.name;


    document.getElementById(
        "archiveChartSubtitle"
    ).textContent =
        "Évolution du capital archivé";


    document.getElementById(
        "archiveChartInitial"
    ).textContent =
        money(
            archive.initialCapital
        );


    document.getElementById(
        "archiveChartFinal"
    ).textContent =
        money(
            archive.finalBalance
        );


    document.getElementById(
        "archiveChartProfit"
    ).textContent =
        money(
            archive.totalProfit
        );


    document.getElementById(
        "archiveChartModal"
    ).classList.add(
        "show"
    );


    setTimeout(
        () => {

            drawArchiveChart(
                archive
            );

        },
        50
    );
}


function closeArchiveChart() {

    document.getElementById(
        "archiveChartModal"
    ).classList.remove(
        "show"
    );
}


// ============================================================
// EFFACER TRADES
// ============================================================

function clearCurrentTrades() {

    const currentTrades =
        getActiveCapitalTrades();


    if (
        currentTrades.length ===
        0
    ) {

        alert(
            "Il n'y a aucun trade à effacer."
        );

        return;
    }


    const confirmed =
        confirm(
            "Voulez-vous vraiment supprimer tous les trades du capital actif ?"
        );


    if (!confirmed) {
        return;
    }


    trades =
        trades.filter(
            trade =>
                trade.capitalId !==
                activeCapital.id
        );


    saveTrades();


    refreshAll();
}


// ============================================================
// THEME
// ============================================================

function loadTheme() {

    const theme =
        localStorage.getItem(
            THEME_KEY
        );


    if (
        theme ===
        "light"
    ) {

        document.body.classList.add(
            "light-theme"
        );

    } else {

        document.body.classList.remove(
            "light-theme"
        );
    }


    updateThemeButton();
}


function toggleTheme() {

    document.body.classList.toggle(
        "light-theme"
    );


    const isLight =
        document.body.classList.contains(
            "light-theme"
        );


    localStorage.setItem(
        THEME_KEY,
        isLight
            ? "light"
            : "dark"
    );


    updateThemeButton();
}


function updateThemeButton() {

    const button =
        document.getElementById(
            "themeToggle"
        );


    if (!button) {
        return;
    }


    const isLight =
        document.body.classList.contains(
            "light-theme"
        );


    button.textContent =
        isLight
            ? "☀️"
            : "🌙";
}


// ============================================================
// REFRESH
// ============================================================

function renderActiveCapital() {

    document.getElementById(
        "activeCapitalName"
    ).textContent =
        activeCapital.name;


    document.getElementById(
        "activeCapitalCreatedAt"
    ).textContent =
        activeCapital.createdAt
            ? "Créé le " +
              formatStoredDateTime(
                  activeCapital.createdAt
              )
            : "Créé le -";


    document.getElementById(
        "initialCapital"
    ).textContent =
        money(
            activeCapital.initialCapital
        );


    document.getElementById(
        "currentBalance"
    ).textContent =
        money(
            calculateCurrentBalance()
        );


    document.getElementById(
        "totalProfit"
    ).textContent =
        money(
            calculateProfit(
                getActiveCapitalTrades()
            )
        );


    document.getElementById(
        "riskReference"
    ).textContent =
        money(
            getCapitalRisk()
        );


    document.getElementById(
        "rrTarget"
    ).textContent =
        getCapitalRR().toFixed(2);


    document.getElementById(
        "theoreticalObjective"
    ).textContent =
        money(
            getCapitalObjective()
        );
}


function refreshAll() {

    renderActiveCapital();

    renderPerformance();

    renderSetupTable();

    renderAssetTable();

    renderHistory();

    renderArchives();

    drawCapitalChart();

    updateAutomaticTradeValues();
}


// ============================================================
// EVENEMENTS
// ============================================================

function setupEvents() {

    document.getElementById(
        "tradeForm"
    ).addEventListener(
        "submit",
        addTrade
    );


    [
        "asset",
        "direction",
        "entry",
        "sl",
        "result"
    ].forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.addEventListener(
                    "input",
                    updateAutomaticTradeValues
                );


                element.addEventListener(
                    "change",
                    updateAutomaticTradeValues
                );
            }
        }
    );


    document
        .querySelectorAll(
            ".period-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".period-btn"
                            )
                            .forEach(
                                btn =>
                                    btn.classList.remove(
                                        "active"
                                    )
                            );


                        button.classList.add(
                            "active"
                        );


                        currentPeriod =
                            button.dataset.period;


                        renderPerformance();

                        renderSetupTable();

                        renderAssetTable();
                    }
                );
            }
        );


    document.getElementById(
        "changeCapitalBtn"
    ).addEventListener(
        "click",
        () => {

            openCapitalModal(
                "edit"
            );
        }
    );


    document.getElementById(
        "newCapitalBtn"
    ).addEventListener(
        "click",
        () => {

            openCapitalModal(
                "new"
            );
        }
    );


    document.getElementById(
        "archiveCapitalBtn"
    ).addEventListener(
        "click",
        archiveCurrentCapital
    );


    document.getElementById(
        "saveCapitalBtn"
    ).addEventListener(
        "click",
        () => {

            if (
                editingArchiveId
            ) {

                saveArchiveModification();

                return;
            }


            if (
                editingExistingCapital
            ) {

                saveCapitalModification();

            } else {

                createNewCapital();
            }
        }
    );


    [
        "capitalRiskInput",
        "capitalRRInput"
    ].forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.addEventListener(
                    "input",
                    updateCapitalModalPreview
                );


                element.addEventListener(
                    "change",
                    updateCapitalModalPreview
                );
            }
        }
    );


    document.getElementById(
        "cancelCapitalBtn"
    ).addEventListener(
        "click",
        closeCapitalModal
    );


    document.getElementById(
        "cancelCapitalBtn2"
    ).addEventListener(
        "click",
        closeCapitalModal
    );


    document.getElementById(
        "closeArchiveChartBtn"
    ).addEventListener(
        "click",
        closeArchiveChart
    );


    document.getElementById(
        "clearBtn"
    ).addEventListener(
        "click",
        clearCurrentTrades
    );


    document.getElementById(
        "themeToggle"
    ).addEventListener(
        "click",
        toggleTheme
    );


    document.getElementById(
        "capitalModal"
    ).addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "capitalModal"
            ) {

                closeCapitalModal();
            }
        }
    );


    document.getElementById(
        "archiveChartModal"
    ).addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "archiveChartModal"
            ) {

                closeArchiveChart();
            }
        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeCapitalModal();

                closeArchiveChart();
            }
        }
    );


    window.addEventListener(
        "resize",
        drawCapitalChart
    );
}


// ============================================================
// INITIALISATION
// ============================================================

function init() {

    loadData();

    loadTheme();


    const dateInput =
        document.getElementById(
            "date"
        );


    if (
        dateInput &&
        !dateInput.value
    ) {

        dateInput.value =
            getTodayDate();
    }


    setupEvents();

    refreshAll();


    updateProfitFieldState();


    if (
        Number(
            activeCapital.initialCapital
        ) === 0
    ) {

        setTimeout(
            () => {

                openCapitalModal(
                    "new"
                );

            },
            150
        );
    }
}


document.addEventListener(
    "DOMContentLoaded",
    init
);
