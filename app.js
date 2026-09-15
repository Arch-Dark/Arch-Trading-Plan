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

/*
 * Gestion fiable du modal capital.
 *
 * new     = Nouveau capital
 * edit    = Modifier le capital actif
 * archive = Modifier une archive
 */
let currentCapitalModalMode = "new";
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


function getAllCapitalTrades() {

    const result = [];

    if (Array.isArray(archives)) {
        archives.forEach(
            archive => {
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
        Array.isArray(trades)
    ) {
        result.push(
            ...trades
        );
    }

    return result;
}


function calculateAllCapitalsBalance() {

    let balance = 0;

    if (Array.isArray(archives)) {
        archives.forEach(
            archive => {
                balance +=
                    Number(
                        archive.initialCapital
                    ) || 0;

                balance +=
                    calculateProfit(
                        Array.isArray(
                            archive.trades
                        )
                            ? archive.trades
                            : []
                    );
            }
        );
    }

    if (activeCapital) {
        balance +=
            Number(
                activeCapital.initialCapital
            ) || 0;

        balance +=
            calculateProfit(
                getActiveCapitalTrades()
            );
    }

    return balance;
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
            activeCapital?.initialCapital
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


    /*
     * Migration :
     * les anciennes opérations sans capitalId
     * sont rattachées au capital actif.
     */
    if (activeCapital) {

        trades.forEach(
            trade => {

                if (
                    !trade.capitalId
                ) {
                    trade.capitalId =
                        activeCapital.id;
                }

            }
        );

        saveTrades();
    }
}


// ============================================================
// PÉRIODES
// ============================================================

function getTradeDate(
    trade
) {

    return (
        trade.date ||
        trade.tradeDate ||
        trade.createdAt ||
        trade.recordedAt ||
        ""
    );
}


function getTradeDateObject(
    trade
) {

    const raw =
        getTradeDate(trade);

    if (!raw) {
        return null;
    }

    const date =
        new Date(raw);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    return date;
}


function isToday(
    trade
) {

    const date =
        getTradeDateObject(trade);

    if (!date) {
        return false;
    }

    const today =
        getTodayDate();

    const tradeDate =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    MADAGASCAR_TIMEZONE
            }
        ).format(date);

    return (
        tradeDate === today
    );
}


function isThisWeek(
    trade
) {

    const date =
        getTradeDateObject(trade);

    if (!date) {
        return false;
    }

    const now =
        new Date();

    const localNow =
        new Date(
            now.toLocaleString(
                "en-US",
                {
                    timeZone:
                        MADAGASCAR_TIMEZONE
                }
            )
        );

    const localDate =
        new Date(
            date.toLocaleString(
                "en-US",
                {
                    timeZone:
                        MADAGASCAR_TIMEZONE
                }
            )
        );

    const day =
        localNow.getDay();

    const diffToMonday =
        day === 0
            ? 6
            : day - 1;

    const monday =
        new Date(
            localNow
        );

    monday.setHours(
        0,
        0,
        0,
        0
    );

    monday.setDate(
        monday.getDate() -
        diffToMonday
    );

    const nextMonday =
        new Date(
            monday
        );

    nextMonday.setDate(
        nextMonday.getDate() + 7
    );

    return (
        localDate >= monday &&
        localDate < nextMonday
    );
}


function isThisMonth(
    trade
) {

    const date =
        getTradeDateObject(trade);

    if (!date) {
        return false;
    }

    const now =
        new Date();

    const localNow =
        new Date(
            now.toLocaleString(
                "en-US",
                {
                    timeZone:
                        MADAGASCAR_TIMEZONE
                }
            )
        );

    const localDate =
        new Date(
            date.toLocaleString(
                "en-US",
                {
                    timeZone:
                        MADAGASCAR_TIMEZONE
                }
            )
        );

    return (
        localDate.getFullYear() ===
            localNow.getFullYear() &&
        localDate.getMonth() ===
            localNow.getMonth()
    );
}


function isThisYear(
    trade
) {

    const date =
        getTradeDateObject(trade);

    if (!date) {
        return false;
    }

    const now =
        new Date();

    const localNow =
        new Date(
            now.toLocaleString(
                "en-US",
                {
                    timeZone:
                        MADAGASCAR_TIMEZONE
                }
            )
        );

    const localDate =
        new Date(
            date.toLocaleString(
                "en-US",
                {
                    timeZone:
                        MADAGASCAR_TIMEZONE
                }
            )
        );

    return (
        localDate.getFullYear() ===
        localNow.getFullYear()
    );
}


function filterTradesByPeriod(
    tradeList,
    period = currentPeriod
) {

    if (!Array.isArray(tradeList)) {
        return [];
    }

    switch (period) {

        case "today":
            return tradeList.filter(
                isToday
            );

        case "week":
            return tradeList.filter(
                isThisWeek
            );

        case "month":
            return tradeList.filter(
                isThisMonth
            );

        case "year":
            return tradeList.filter(
                isThisYear
            );

        case "all":
        case "all-capitals":
        default:
            return [...tradeList];
    }
}


function getTradesForPeriod(
    period = currentPeriod
) {

    if (
        period ===
        "all-capitals"
    ) {
        return filterTradesByPeriod(
            getAllCapitalTrades(),
            period
        );
    }

    return filterTradesByPeriod(
        getActiveCapitalTrades(),
        period
    );
}
