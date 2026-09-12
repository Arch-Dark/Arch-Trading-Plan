const TRADES_KEY = "tradingTrades";
const CAPITAL_KEY = "tradingActiveCapital";
const ARCHIVES_KEY = "tradingCapitalArchives";
const THEME_KEY = "tradingDashboardTheme";

let trades = [];
let archives = [];
let activeCapital = null;
let currentPeriod = "today";

let capitalChart = null;
let archiveChart = null;


// ============================================================
// CONFIGURATION DES ACTIFS / PIPS / MM
// ============================================================

const ASSET_SPECS = {

    "EUR/USD": {
        type: "forex",
        pipMultiplier: 10000,
        pipValuePerLot: 10
    },

    "GBP/USD": {
        type: "forex",
        pipMultiplier: 10000,
        pipValuePerLot: 10
    },

    "AUD/USD": {
        type: "forex",
        pipMultiplier: 10000,
        pipValuePerLot: 10
    },

    "NZD/USD": {
        type: "forex",
        pipMultiplier: 10000,
        pipValuePerLot: 10
    },

    "USD/CAD": {
        type: "forexQuoteConversion",
        pipMultiplier: 10000
    },

    "USD/CHF": {
        type: "forexQuoteConversion",
        pipMultiplier: 10000
    },

    "USD/JPY": {
        type: "jpy",
        pipMultiplier: 100,
        pipValuePerLot: null
    },

    "XAUUSD": {
        type: "gold",
        pipMultiplier: 100,
        contractSize: 100
    },

    "BTCUSD": {
        type: "crypto",
        pipMultiplier: 100,
        contractSize: 1
    }
};


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

    if (!Number.isFinite(number)) {
        return "-";
    }

    return number.toFixed(decimals);
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


// ============================================================
// ACTIFS
// ============================================================

function normalizeAsset(asset) {

    if (!asset) {
        return "";
    }

    const value =
        String(asset)
            .trim()
            .toUpperCase();

    const aliases = {

        "EURUSD": "EUR/USD",
        "EUR/USD": "EUR/USD",

        "GBPUSD": "GBP/USD",
        "GBP/USD": "GBP/USD",

        "AUDUSD": "AUD/USD",
        "AUD/USD": "AUD/USD",

        "NZDUSD": "NZD/USD",
        "NZD/USD": "NZD/USD",

        "USDCAD": "USD/CAD",
        "USD/CAD": "USD/CAD",

        "USDCHF": "USD/CHF",
        "USD/CHF": "USD/CHF",

        "USDJPY": "USD/JPY",
        "USD/JPY": "USD/JPY",

        "XAUUSD": "XAUUSD",
        "XAU/USD": "XAUUSD",
        "XAUUSDC": "XAUUSD",
        "XAUUSD C": "XAUUSD",
        "GOLD": "XAUUSD",

        "BTCUSD": "BTCUSD",
        "BTC/USD": "BTCUSD",
        "BITCOIN": "BTCUSD"
    };

    return aliases[value] || value;
}


function getAssetSpec(asset) {

    const normalized =
        normalizeAsset(asset);

    return ASSET_SPECS[normalized] || null;
}


// ============================================================
// CALCUL PIPS
// ============================================================

function calculatePips(
    asset,
    direction,
    entry,
    sl,
    tp,
    result
) {

    const spec =
        getAssetSpec(asset);

    if (!spec) {
        return null;
    }

    if (!Number.isFinite(entry)) {
        return null;
    }

    if (result === "BE") {
        return 0;
    }

    let exitPrice = NaN;

    if (result === "TP") {
        exitPrice = tp;
    }

    if (result === "SL") {
        exitPrice = sl;
    }

    if (!Number.isFinite(exitPrice)) {
        return null;
    }

    let priceDifference = 0;

    if (direction === "BUY") {

        priceDifference =
            exitPrice - entry;

    } else {

        priceDifference =
            entry - exitPrice;
    }

    return (
        priceDifference *
        spec.pipMultiplier
    );
}


function formatPips(pips) {

    if (!Number.isFinite(Number(pips))) {
        return "-";
    }

    const value =
        Number(pips);

    if (value > 0) {
        return "+" + value.toFixed(1);
    }

    if (value < 0) {
        return value.toFixed(1);
    }

    return "0.0";
}


// ============================================================
// MM DU CAPITAL
// ============================================================

function getCapitalRisk() {

    if (!activeCapital) {
        return 0;
    }

    return Number(
        activeCapital.riskPerTrade
    ) || 0;
}


function getCapitalObjective() {

    if (!activeCapital) {
        return 0;
    }

    return Number(
        activeCapital.objectivePerTrade
    ) || 0;
}


function calculateCapitalRR(
    risk = getCapitalRisk(),
    objective = getCapitalObjective()
) {

    risk =
        Number(risk) || 0;

    objective =
        Number(objective) || 0;

    if (
        risk <= 0 ||
        objective <= 0
    ) {
        return 0;
    }

    return objective / risk;
}


// ============================================================
// VALEUR DU PIP SELON L'ACTIF
// ============================================================

function getPipValuePerLotUSD(
    asset,
    entry
) {

    const normalized =
        normalizeAsset(asset);

    const spec =
        getAssetSpec(normalized);

    if (!spec) {
        return null;
    }


    // EUR/USD, GBP/USD, AUD/USD, NZD/USD
    if (
        spec.type === "forex"
    ) {

        return spec.pipValuePerLot;
    }


    // USD/CAD et USD/CHF
    // 1 lot = 100000 unités de devise de base
    // 1 pip = 0.0001
    // Valeur = 10 unités de devise quote
    // Conversion approximate en USD :
    // 10 / prix
    if (
        spec.type === "forexQuoteConversion"
    ) {

        if (
            !Number.isFinite(entry) ||
            entry <= 0
        ) {
            return null;
        }

        return 10 / entry;
    }


    // USD/JPY
    // 1 lot = 100000 USD
    // 1 pip = 0.01 JPY
    // = 1000 JPY
    // Conversion approximative en USD :
    // 1000 / prix
    if (
        spec.type === "jpy"
    ) {

        if (
            !Number.isFinite(entry) ||
            entry <= 0
        ) {
            return null;
        }

        return 1000 / entry;
    }

    return null;
}


// ============================================================
// CALCUL LOT THÉORIQUE
// ============================================================

function calculateRawLot(
    asset,
    entry,
    sl,
    riskAmount
) {

    const spec =
        getAssetSpec(asset);

    if (
        !spec ||
        !Number.isFinite(entry) ||
        !Number.isFinite(sl) ||
        !Number.isFinite(riskAmount) ||
        riskAmount <= 0
    ) {
        return null;
    }

    const distance =
        Math.abs(entry - sl);

    if (distance <= 0) {
        return null;
    }


    let lot = 0;


    // --------------------------------------------------------
    // FOREX
    // --------------------------------------------------------

    if (
        spec.type === "forex"
    ) {

        const pips =
            distance *
            spec.pipMultiplier;

        lot =
            riskAmount /
            (
                pips *
                spec.pipValuePerLot
            );
    }


    // --------------------------------------------------------
    // USD/CAD et USD/CHF
    // --------------------------------------------------------

    else if (
        spec.type === "forexQuoteConversion"
    ) {

        const pips =
            distance *
            spec.pipMultiplier;

        const pipValuePerLot =
            getPipValuePerLotUSD(
                asset,
                entry
            );

        if (
            !Number.isFinite(
                pipValuePerLot
            ) ||
            pipValuePerLot <= 0
        ) {
            return null;
        }

        lot =
            riskAmount /
            (
                pips *
                pipValuePerLot
            );
    }


    // --------------------------------------------------------
    // USD/JPY
    // --------------------------------------------------------

    else if (
        spec.type === "jpy"
    ) {

        const pips =
            distance *
            spec.pipMultiplier;

        const pipValuePerLot =
            getPipValuePerLotUSD(
                asset,
                entry
            );

        if (
            !Number.isFinite(
                pipValuePerLot
            ) ||
            pipValuePerLot <= 0
        ) {
            return null;
        }

        lot =
            riskAmount /
            (
                pips *
                pipValuePerLot
            );
    }


    // --------------------------------------------------------
    // XAUUSD
    // 1 lot = 100 oz
    // --------------------------------------------------------

    else if (
        spec.type === "gold"
    ) {

        lot =
            riskAmount /
            (
                distance *
                spec.contractSize
            );
    }


    // --------------------------------------------------------
    // BTCUSD
    // Convention du journal :
    // 1 lot = 1 BTC
    // --------------------------------------------------------

    else if (
        spec.type === "crypto"
    ) {

        lot =
            riskAmount /
            distance;
    }


    if (
        !Number.isFinite(lot) ||
        lot <= 0
    ) {
        return null;
    }


    return lot;
}


// ============================================================
// CALCUL LOT AUTOMATIQUE
// ============================================================

function calculateAutomaticLot(
    asset,
    entry,
    sl,
    riskAmount
) {

    const rawLot =
        calculateRawLot(
            asset,
            entry,
            sl,
            riskAmount
        );

    if (
        rawLot === null
    ) {
        return null;
    }


    // Arrondi vers le bas au pas de 0.01
    const lot =
        Math.floor(
            rawLot * 100
        ) / 100;


    if (
        lot < 0.01
    ) {
        return 0;
    }


    return lot;
}


// ============================================================
// CALCUL DU RISQUE RÉEL POUR UN LOT
// ============================================================

function calculateRiskForLot(
    asset,
    entry,
    sl,
    lot
) {

    const spec =
        getAssetSpec(asset);

    if (
        !spec ||
        !Number.isFinite(entry) ||
        !Number.isFinite(sl) ||
        !Number.isFinite(lot) ||
        lot <= 0
    ) {
        return null;
    }

    const distance =
        Math.abs(entry - sl);

    if (distance <= 0) {
        return null;
    }


    // --------------------------------------------------------
    // FOREX
    // --------------------------------------------------------

    if (
        spec.type === "forex"
    ) {

        const pips =
            distance *
            spec.pipMultiplier;

        return (
            pips *
            spec.pipValuePerLot *
            lot
        );
    }


    // --------------------------------------------------------
    // USD/CAD / USD/CHF
    // --------------------------------------------------------

    if (
        spec.type ===
        "forexQuoteConversion"
    ) {

        const pips =
            distance *
            spec.pipMultiplier;

        const pipValuePerLot =
            getPipValuePerLotUSD(
                asset,
                entry
            );

        if (
            !Number.isFinite(
                pipValuePerLot
            )
        ) {
            return null;
        }

        return (
            pips *
            pipValuePerLot *
            lot
        );
    }


    // --------------------------------------------------------
    // USD/JPY
    // --------------------------------------------------------

    if (
        spec.type === "jpy"
    ) {

        const pips =
            distance *
            spec.pipMultiplier;

        const pipValuePerLot =
            getPipValuePerLotUSD(
                asset,
                entry
            );

        if (
            !Number.isFinite(
                pipValuePerLot
            )
        ) {
            return null;
        }

        return (
            pips *
            pipValuePerLot *
            lot
        );
    }


    // --------------------------------------------------------
    // XAUUSD
    // --------------------------------------------------------

    if (
        spec.type === "gold"
    ) {

        return (
            distance *
            spec.contractSize *
            lot
        );
    }


    // --------------------------------------------------------
    // BTCUSD
    // --------------------------------------------------------

    if (
        spec.type === "crypto"
    ) {

        return (
            distance *
            lot
        );
    }


    return null;
}


// ============================================================
// CALCUL TP AUTOMATIQUE
// ============================================================

function calculateAutomaticTP(
    direction,
    entry,
    sl,
    riskAmount,
    objectiveAmount
) {

    if (
        !Number.isFinite(entry) ||
        !Number.isFinite(sl) ||
        !Number.isFinite(riskAmount) ||
        !Number.isFinite(objectiveAmount)
    ) {
        return null;
    }

    if (
        riskAmount <= 0 ||
        objectiveAmount <= 0
    ) {
        return null;
    }

    const riskDistance =
        Math.abs(entry - sl);

    if (
        riskDistance <= 0
    ) {
        return null;
    }

    const rr =
        objectiveAmount /
        riskAmount;

    const rewardDistance =
        riskDistance *
        rr;


    if (
        direction === "BUY"
    ) {

        return (
            entry +
            rewardDistance
        );

    } else {

        return (
            entry -
            rewardDistance
        );
    }
}


// ============================================================
// MISE À JOUR AUTOMATIQUE DU MM
// ============================================================

function updateAutomaticTradeValues() {

    const assetElement =
        document.getElementById(
            "asset"
        );

    const entryElement =
        document.getElementById(
            "entry"
        );

    const slElement =
        document.getElementById(
            "sl"
        );

    const tpElement =
        document.getElementById(
            "tp"
        );

    const lotElement =
        document.getElementById(
            "lot"
        );

    const rrElement =
        document.getElementById(
            "calculatedRR"
        );

    const directionElement =
        document.getElementById(
            "direction"
        );

    const mmInfo =
        document.getElementById(
            "tradeMMInfo"
        );


    if (
        !assetElement ||
        !entryElement ||
        !slElement ||
        !tpElement ||
        !lotElement ||
        !rrElement ||
        !directionElement
    ) {
        return;
    }


    const asset =
        normalizeAsset(
            assetElement.value
        );

    const entry =
        parseNumber(
            entryElement.value
        );

    const sl =
        parseNumber(
            slElement.value
        );

    const direction =
        directionElement.value;


    const risk =
        getCapitalRisk();

    const objective =
        getCapitalObjective();


    tpElement.value = "";

    lotElement.value = "";

    rrElement.value = "0.00";


    if (
        risk <= 0 ||
        objective <= 0
    ) {

        if (mmInfo) {

            mmInfo.textContent =
                "Configurez le risque et l'objectif du capital actif.";

        }

        return;
    }


    const rr =
        objective /
        risk;


    rrElement.value =
        rr.toFixed(2);


    if (
        !asset ||
        !getAssetSpec(asset)
    ) {

        if (mmInfo) {

            mmInfo.textContent =
                `Risque souhaité : ${money(risk)} | Objectif : ${money(objective)} | RR : ${rr.toFixed(2)}`;

        }

        return;
    }


    if (
        !Number.isFinite(entry) ||
        !Number.isFinite(sl)
    ) {

        if (mmInfo) {

            mmInfo.textContent =
                `Risque souhaité : ${money(risk)} | Objectif : ${money(objective)} | RR : ${rr.toFixed(2)}`;

        }

        return;
    }


    if (
        entry === sl
    ) {

        if (mmInfo) {

            mmInfo.textContent =
                "Entry et SL doivent être différents.";

        }

        return;
    }


    const rawLot =
        calculateRawLot(
            asset,
            entry,
            sl,
            risk
        );


    const lot =
        calculateAutomaticLot(
            asset,
            entry,
            sl,
            risk
        );


    const tp =
        calculateAutomaticTP(
            direction,
            entry,
            sl,
            risk,
            objective
        );


    // --------------------------------------------------------
    // Le lot théorique est inférieur à 0.01
    // --------------------------------------------------------

    if (
        rawLot === null
    ) {

        if (mmInfo) {

            mmInfo.textContent =
                "Impossible de calculer le lot automatiquement. Vérifiez Entry, SL et le risque.";

        }

        return;
    }


    if (
        rawLot < 0.01 ||
        lot === 0
    ) {

        const minimumLotRisk =
            calculateRiskForLot(
                asset,
                entry,
                sl,
                0.01
            );


        let message =
            `Risque souhaité : ${money(risk)} | Lot théorique : ${rawLot.toFixed(4)} | Minimum broker : 0.01 lot`;


        if (
            Number.isFinite(
                minimumLotRisk
            )
        ) {

            message +=
                ` | Risque à 0.01 lot : ${money(minimumLotRisk)}`;
        }


        message +=
            " | 0.01 lot dépasserait le risque souhaité.";


        if (mmInfo) {

            mmInfo.textContent =
                message;
        }


        return;
    }


    if (
        tp === null
    ) {

        if (mmInfo) {

            mmInfo.textContent =
                "Impossible de calculer le TP.";

        }

        return;
    }


    const realRisk =
        calculateRiskForLot(
            asset,
            entry,
            sl,
            lot
        );


    const riskDifference =
        Number.isFinite(realRisk)
            ? risk - realRisk
            : null;


    lotElement.value =
        lot.toFixed(2);


    tpElement.value =
        tp.toFixed(5);


    if (mmInfo) {

        let message =
            `Risque souhaité : ${money(risk)} | Lot : ${lot.toFixed(2)}`;


        if (
            Number.isFinite(
                rawLot
            )
        ) {

            message +=
                ` | Théorique : ${rawLot.toFixed(4)}`;
        }


        if (
            Number.isFinite(
                realRisk
            )
        ) {

            message +=
                ` | Risque réel : ${money(realRisk)}`;
        }


        if (
            Number.isFinite(
                riskDifference
            )
        ) {

            if (
                riskDifference > 0.004
            ) {

                message +=
                    ` | Sous-risque : ${money(riskDifference)}`;

            } else if (
                riskDifference < -0.004
            ) {

                message +=
                    ` | Dépassement : ${money(Math.abs(riskDifference))}`;

            } else {

                message +=
                    " | Risque atteint";
            }
        }


        message +=
            ` | Objectif : ${money(objective)} | RR : ${rr.toFixed(2)}`;


        mmInfo.textContent =
            message;
    }
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


function loadData() {

    try {

        trades =
            JSON.parse(
                localStorage.getItem(TRADES_KEY)
            ) || [];

    } catch {

        trades = [];
    }


    try {

        archives =
            JSON.parse(
                localStorage.getItem(ARCHIVES_KEY)
            ) || [];

    } catch {

        archives = [];
    }


    try {

        activeCapital =
            JSON.parse(
                localStorage.getItem(CAPITAL_KEY)
            );

    } catch {

        activeCapital = null;
    }


    if (!activeCapital) {

        activeCapital = {

            id:
                generateId(),

            name:
                "Capital 1",

            initialCapital:
                0,

            riskPerTrade:
                0,

            objectivePerTrade:
                0,

            createdAt:
                new Date().toISOString()
        };

        saveActiveCapital();
    }


    // Compatibilité avec les anciens capitaux
    if (
        activeCapital.riskPerTrade === undefined
    ) {

        activeCapital.riskPerTrade = 0;
    }


    if (
        activeCapital.objectivePerTrade === undefined
    ) {

        activeCapital.objectivePerTrade = 0;
    }


    saveActiveCapital();


    let changed = false;


    trades.forEach(
        trade => {

            if (!trade.capitalId) {

                trade.capitalId =
                    activeCapital.id;

                changed = true;
            }


            if (
                trade.lot === undefined ||
                trade.lot === null ||
                trade.lot === ""
            ) {

                trade.lot = 0;

                changed = true;
            }


            if (
                trade.pnl === undefined &&
                trade.profit !== undefined
            ) {

                trade.pnl =
                    parseNumber(
                        trade.profit
                    );

                changed = true;
            }


            if (
                trade.position === undefined &&
                trade.direction !== undefined
            ) {

                trade.position =
                    trade.direction;

                changed = true;
            }


            if (trade.asset) {

                const normalizedAsset =
                    normalizeAsset(
                        trade.asset
                    );

                if (
                    normalizedAsset &&
                    normalizedAsset !== trade.asset
                ) {

                    trade.asset =
                        normalizedAsset;

                    changed = true;
                }
            }


            const calculatedPips =
                calculatePips(
                    trade.asset,
                    trade.position,
                    parseNumber(trade.entry),
                    parseNumber(trade.sl),
                    parseNumber(trade.tp),
                    trade.result
                );


            if (
                calculatedPips !== null &&
                trade.pips !== calculatedPips
            ) {

                trade.pips =
                    calculatedPips;

                changed = true;
            }
        }
    );


    if (changed) {
        saveTrades();
    }
}


// ============================================================
// CAPITAL
// ============================================================

function getCurrentCapitalTrades() {

    return trades.filter(
        trade =>
            trade.capitalId ===
            activeCapital.id
    );
}


function calculateCurrentBalance() {

    const currentTrades =
        getCurrentCapitalTrades();

    const profit =
        currentTrades.reduce(
            (sum, trade) =>
                sum +
                (Number(trade.pnl) || 0),
            0
        );

    return (
        Number(
            activeCapital.initialCapital || 0
        ) +
        profit
    );
}


function calculateProfit(tradeList) {

    return tradeList.reduce(
        (sum, trade) =>
            sum +
            (Number(trade.pnl) || 0),
        0
    );
}


// ============================================================
// PERIODES
// ============================================================

function isSameDay(date) {

    const tradeDate =
        new Date(
            date + "T00:00:00"
        );

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


function isThisWeek(date) {

    const tradeDate =
        new Date(
            date + "T00:00:00"
        );

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
        monday.getDate() + 7
    );

    return (
        tradeDate >= monday &&
        tradeDate < nextMonday
    );
}


function isThisMonth(date) {

    const tradeDate =
        new Date(
            date + "T00:00:00"
        );

    const today =
        new Date();

    return (
        tradeDate.getFullYear() ===
            today.getFullYear() &&

        tradeDate.getMonth() ===
            today.getMonth()
    );
}


function isThisYear(date) {

    const tradeDate =
        new Date(
            date + "T00:00:00"
        );

    const today =
        new Date();

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
        return tradeList;
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
                trade.result === "TP"
        ).length;

    return (
        winners /
        tradeList.length
    ) * 100;
}


function calculateAverageRR(
    tradeList
) {

    if (
        tradeList.length === 0
    ) {
        return 0;
    }

    const validRR =
        tradeList
            .map(
                trade =>
                    Number(trade.rr)
            )
            .filter(
                rr =>
                    Number.isFinite(rr) &&
                    rr > 0
            );

    if (
        validRR.length === 0
    ) {
        return 0;
    }

    const total =
        validRR.reduce(
            (sum, rr) =>
                sum + rr,
            0
        );

    return (
        total /
        validRR.length
    );
}


function findBestSetup(
    tradeList
) {

    if (
        tradeList.length === 0
    ) {
        return "-";
    }

    const setupStats = {};


    tradeList.forEach(
        trade => {

            if (!trade.setup) {
                return;
            }

            if (
                !setupStats[trade.setup]
            ) {

                setupStats[trade.setup] = {

                    trades: 0,

                    winners: 0
                };
            }

            setupStats[
                trade.setup
            ].trades++;


            if (
                trade.result ===
                "TP"
            ) {

                setupStats[
                    trade.setup
                ].winners++;
            }
        }
    );


    let bestSetup = "-";

    let bestWinrate = -1;

    let bestTrades = -1;


    Object.entries(
        setupStats
    ).forEach(
        ([setup, stats]) => {

            const winrate =
                stats.trades > 0
                    ? stats.winners /
                      stats.trades
                    : 0;


            if (
                winrate >
                    bestWinrate ||

                (
                    winrate ===
                        bestWinrate &&

                    stats.trades >
                        bestTrades
                )
            ) {

                bestSetup =
                    setup;

                bestWinrate =
                    winrate;

                bestTrades =
                    stats.trades;
            }
        }
    );


    return bestSetup;
}


// ============================================================
// AFFICHAGE CAPITAL
// ============================================================

function updateCapitalDisplay() {

    document.getElementById(
        "activeCapitalName"
    ).textContent =
        activeCapital.name;


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


    const currentTrades =
        getCurrentCapitalTrades();


    const totalProfit =
        calculateProfit(
            currentTrades
        );


    document.getElementById(
        "totalProfit"
    ).textContent =
        money(totalProfit);


    const riskElement =
        document.getElementById(
            "activeRisk"
        );


    const objectiveElement =
        document.getElementById(
            "activeObjective"
        );


    const rrElement =
        document.getElementById(
            "activeCapitalRR"
        );


    if (riskElement) {

        riskElement.textContent =
            money(
                activeCapital.riskPerTrade
            );
    }


    if (objectiveElement) {

        objectiveElement.textContent =
            money(
                activeCapital.objectivePerTrade
            );
    }


    if (rrElement) {

        rrElement.textContent =
            calculateCapitalRR().toFixed(2);
    }
}


// ============================================================
// AFFICHAGE STATISTIQUES
// ============================================================

function updateStats() {

    const currentTrades =
        getCurrentCapitalTrades();

    const periodTrades =
        filterByPeriod(
            currentTrades
        );

    const profit =
        calculateProfit(
            periodTrades
        );

    const winrate =
        calculateWinrate(
            periodTrades
        );

    const averageRR =
        calculateAverageRR(
            periodTrades
        );

    const bestSetup =
        findBestSetup(
            periodTrades
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
        money(profit);


    document.getElementById(
        "statWinrate"
    ).textContent =
        winrate.toFixed(1) +
        "%";


    document.getElementById(
        "statAverageRR"
    ).textContent =
        averageRR.toFixed(2);


    document.getElementById(
        "statTrades"
    ).textContent =
        periodTrades.length;


    document.getElementById(
        "statBestSetup"
    ).textContent =
        bestSetup;
}


// ============================================================
// TABLEAU SETUPS
// ============================================================

function updateSetupTable() {

    const tbody =
        document.getElementById(
            "setupTableBody"
        );

    tbody.innerHTML = "";


    const currentTrades =
        getCurrentCapitalTrades();

    const periodTrades =
        filterByPeriod(
            currentTrades
        );


    const setupNames = [

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


    setupNames.forEach(
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
                setupTrades.length > 0
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

                <td>
                    ${escapeHtml(setup)}
                </td>

                <td>
                    ${setupTrades.length}
                </td>

                <td>
                    ${winners}
                </td>

                <td>
                    ${winrate.toFixed(1)}%
                </td>

                <td>
                    ${money(profit)}
                </td>
            `;


            tbody.appendChild(row);
        }
    );
}


// ============================================================
// HISTORIQUE
// ============================================================

function renderHistory() {

    const tbody =
        document.getElementById(
            "historyBody"
        );

    tbody.innerHTML = "";


    const currentTrades =
        getCurrentCapitalTrades();


    const sortedTrades =
        [...currentTrades].sort(
            (a, b) => {

                return (
                    new Date(b.date) -
                    new Date(a.date)
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
                colspan="13"
                class="empty-table"
            >
                Aucun trade enregistré.
            </td>
        `;


        tbody.appendChild(row);

        return;
    }


    sortedTrades.forEach(
        trade => {

            const row =
                document.createElement(
                    "tr"
                );


            const position =
                trade.position ===
                "SELL"
                    ? "Sell"
                    : "Buy";


            const lotValue =
                Number(trade.lot) > 0
                    ? Number(
                        trade.lot
                    ).toFixed(2)
                    : "-";


            const sl =
                Number.isFinite(
                    Number(trade.sl)
                )
                    ? formatNumber(
                        trade.sl
                    )
                    : "-";


            const tp =
                Number.isFinite(
                    Number(trade.tp)
                )
                    ? formatNumber(
                        trade.tp,
                        5
                    )
                    : "-";


            const entry =
                Number.isFinite(
                    Number(trade.entry)
                )
                    ? formatNumber(
                        trade.entry,
                        5
                    )
                    : "-";


            const rr =
                Number.isFinite(
                    Number(trade.rr)
                )
                    ? Number(
                        trade.rr
                    ).toFixed(2)
                    : "0.00";


            const pips =
                Number.isFinite(
                    Number(trade.pips)
                )
                    ? Number(
                        trade.pips
                    )
                    : null;


            const pnl =
                Number(trade.pnl) || 0;


            let pnlClass = "";


            if (pnl > 0) {

                pnlClass =
                    "profit-positive";

            } else if (pnl < 0) {

                pnlClass =
                    "profit-negative";
            }


            let pipsClass = "";


            if (
                Number.isFinite(pips)
            ) {

                if (pips > 0) {

                    pipsClass =
                        "profit-positive";

                } else if (pips < 0) {

                    pipsClass =
                        "profit-negative";
                }
            }


            row.innerHTML = `

                <td>
                    ${escapeHtml(
                        trade.date || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        normalizeAsset(
                            trade.asset
                        ) || "-"
                    )}
                </td>

                <td>

                    <span
                        class="position-badge ${
                            trade.position ===
                            "SELL"
                                ? "sell"
                                : "buy"
                        }"
                    >
                        ${position}
                    </span>

                </td>

                <td>
                    <strong>
                        ${lotValue}
                    </strong>
                </td>

                <td>
                    ${entry}
                </td>

                <td>
                    ${sl}
                </td>

                <td>
                    ${tp}
                </td>

                <td>
                    ${rr}
                </td>

                <td class="${pipsClass}">
                    ${
                        Number.isFinite(pips)
                            ? formatPips(pips)
                            : "-"
                    }
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

                <td class="${pnlClass}">
                    ${money(pnl)}
                </td>

                <td>

                    <button
                        class="delete-trade-btn"
                        data-id="${trade.id}"
                        title="Supprimer ce trade"
                    >
                        🗑️
                    </button>

                </td>
            `;


            tbody.appendChild(row);
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
// SUPPRESSION TRADE
// ============================================================

function deleteTrade(id) {

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
// CALCUL RR
// ============================================================

function calculateRR() {

    updateAutomaticTradeValues();
}


// ============================================================
// VALIDATION TRADE
// ============================================================

function validateTrade(
    direction,
    entry,
    sl,
    tp,
    result
) {

    if (
        !Number.isFinite(entry)
    ) {

        alert(
            "Veuillez entrer un prix d'entrée valide."
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
        !Number.isFinite(tp)
    ) {

        alert(
            "Le Take Profit n'a pas pu être calculé."
        );

        return false;
    }


    if (
        result === "TP" &&
        !Number.isFinite(tp)
    ) {

        alert(
            "Un trade terminé en TP doit avoir un Take Profit."
        );

        return false;
    }


    if (
        result === "SL" &&
        !Number.isFinite(sl)
    ) {

        alert(
            "Un trade terminé en SL doit avoir un Stop Loss."
        );

        return false;
    }


    if (
        direction ===
        "BUY"
    ) {

        if (
            sl >= entry
        ) {

            alert(
                "Pour un Buy, le Stop Loss doit être inférieur à l'Entry."
            );

            return false;
        }


        if (
            tp <= entry
        ) {

            alert(
                "Pour un Buy, le Take Profit doit être supérieur à l'Entry."
            );

            return false;
        }

    } else {

        if (
            sl <= entry
        ) {

            alert(
                "Pour un Sell, le Stop Loss doit être supérieur à l'Entry."
            );

            return false;
        }


        if (
            tp >= entry
        ) {

            alert(
                "Pour un Sell, le Take Profit doit être inférieur à l'Entry."
            );

            return false;
        }
    }


    return true;
}


// ============================================================
// AJOUT TRADE
// ============================================================

function addTrade(event) {

    event.preventDefault();


    const asset =
        normalizeAsset(
            document.getElementById(
                "asset"
            ).value
        );


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


    const lot =
        parseNumber(
            document.getElementById(
                "lot"
            ).value
        );


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


    const tp =
        parseNumber(
            document.getElementById(
                "tp"
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


    const pnl =
        parseNumber(
            document.getElementById(
                "profit"
            ).value
        );


    const comment =
        document.getElementById(
            "comment"
        ).value.trim();


    const risk =
        getCapitalRisk();


    const objective =
        getCapitalObjective();


    // --------------------------------------------------------
    // Vérifications MM
    // --------------------------------------------------------

    if (
        risk <= 0 ||
        objective <= 0
    ) {

        alert(
            "Veuillez d'abord configurer le Risque par trade et l'Objectif par trade du capital actif."
        );

        return;
    }


    // --------------------------------------------------------
    // Vérification actif
    // --------------------------------------------------------

    if (
        !getAssetSpec(asset)
    ) {

        alert(
            "Veuillez sélectionner un actif valide."
        );

        return;
    }


    // --------------------------------------------------------
    // Vérification lot
    // --------------------------------------------------------

    if (
        !Number.isFinite(lot) ||
        lot < 0.01
    ) {

        alert(
            "Le lot automatique est inférieur au minimum de 0.01 pour cet actif."
        );

        return;
    }


    // --------------------------------------------------------
    // Vérification P/L
    // --------------------------------------------------------

    if (
        !Number.isFinite(pnl)
    ) {

        alert(
            "Veuillez entrer un P/L valide."
        );

        return;
    }


    // --------------------------------------------------------
    // Vérification prix
    // --------------------------------------------------------

    if (
        !validateTrade(
            direction,
            entry,
            sl,
            tp,
            result
        )
    ) {

        return;
    }


    // --------------------------------------------------------
    // RR
    // --------------------------------------------------------

    const rr =
        objective /
        risk;


    // --------------------------------------------------------
    // PIPS
    // --------------------------------------------------------

    const pips =
        calculatePips(
            asset,
            direction,
            entry,
            sl,
            tp,
            result
        );


    if (
        pips === null
    ) {

        alert(
            "Impossible de calculer les pips. Vérifiez Entry, SL, TP et Résultat."
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


    const trade = {

        id:
            generateId(),

        capitalId:
            activeCapital.id,

        date:
            date,

        asset:
            asset,

        position:
            direction,

        orderType:
            orderType,

        lot:
            lot,

        entry:
            entry,

        sl:
            sl,

        tp:
            tp,

        rr:
            rr,

        pips:
            pips,

        setup:
            setup,

        result:
            result,

        pnl:
            pnl,

        comment:
            comment,

        riskTarget:
            risk,

        realRisk:
            Number.isFinite(realRisk)
                ? realRisk
                : null
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
        "calculatedRR"
    ).value =
        calculateCapitalRR().toFixed(2);


    updateAutomaticTradeValues();


    refreshAll();


    alert(
        "Trade enregistré avec succès !"
    );
}


// ============================================================
// DATE DU JOUR
// ============================================================

function getTodayDate() {

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${year}-${month}-${day}`
    );
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


    let minValue =
        Math.min(
            ...values
        );


    let maxValue =
        Math.max(
            ...values
        );


    let step = 5;


    const range =
        maxValue -
        minValue;


    if (
        maxValue > 1000
    ) {

        step = 100;

    } else if (
        maxValue > 500
    ) {

        step = 50;

    } else if (
        maxValue > 200
    ) {

        step = 25;

    } else if (
        maxValue > 100
    ) {

        step = 10;

    } else {

        step = 5;
    }


    if (
        range > 500
    ) {

        step =
            Math.max(
                step,
                50
            );

    } else if (
        range > 200
    ) {

        step =
            Math.max(
                step,
                25
            );

    } else if (
        range > 100
    ) {

        step =
            Math.max(
                step,
                10
            );
    }


    let min =
        Math.floor(
            minValue / step
        ) * step;


    let max =
        Math.ceil(
            maxValue / step
        ) * step;


    if (
        minValue >= 0
    ) {

        min =
            Math.max(
                0,
                min
            );
    }


    if (
        max <= min
    ) {

        max =
            min + step;
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
        getCurrentCapitalTrades();


    const sortedTrades =
        [...currentTrades].sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );


    if (
        sortedTrades.length === 0
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
        canvas.getContext("2d");


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


    sortedTrades.forEach(
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
        let value = scale.min;
        value <= scale.max;
        value += scale.step
    ) {

        const y =
            paddingTop +
            chartHeight -
            (
                (value -
                    scale.min) /
                (
                    scale.max -
                    scale.min
                )
            ) *
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

        ctx.lineWidth = 1;

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


    ctx.beginPath();

    ctx.moveTo(
        paddingLeft,
        paddingTop
    );

    ctx.lineTo(
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
        "rgba(100,116,139,0.5)";

    ctx.stroke();


    const points = [];


    values.forEach(
        (value, index) => {

            const x =
                paddingLeft +
                (
                    index /
                    Math.max(
                        values.length - 1,
                        1
                    )
                ) *
                chartWidth;


            const y =
                paddingTop +
                chartHeight -
                (
                    (value -
                        scale.min) /
                    (
                        scale.max -
                        scale.min
                    )
                ) *
                chartHeight;


            points.push({

                x,

                y,

                value
            });
        }
    );


    for (
        let i = 0;
        i < points.length - 1;
        i++
    ) {

        const trade =
            sortedTrades[i];


        const pnl =
            Number(
                trade.pnl
            ) || 0;


        let lineColor =
            "#64748b";


        if (
            pnl > 0
        ) {

            lineColor =
                "#16a34a";

        } else if (
            pnl < 0
        ) {

            lineColor =
                "#dc2626";
        }


        ctx.beginPath();


        ctx.moveTo(
            points[i].x,
            points[i].y
        );


        ctx.lineTo(
            points[i + 1].x,
            points[i + 1].y
        );


        ctx.strokeStyle =
            lineColor;


        ctx.lineWidth = 3;

        ctx.lineCap =
            "round";


        ctx.stroke();
    }


    points.forEach(
        (point, index) => {

            let pointColor =
                "#64748b";


            if (
                index > 0
            ) {

                const pnl =
                    Number(
                        sortedTrades[
                            index - 1
                        ].pnl
                    ) || 0;


                if (
                    pnl > 0
                ) {

                    pointColor =
                        "#16a34a";

                } else if (
                    pnl < 0
                ) {

                    pointColor =
                        "#dc2626";
                }
            }


            ctx.beginPath();


            ctx.arc(
                point.x,
                point.y,
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


    ctx.textAlign =
        "center";


    ctx.textBaseline =
        "top";


    points.forEach(
        (point, index) => {

            if (
                index === 0 ||
                index ===
                    points.length - 1 ||
                points.length <= 10
            ) {

                ctx.fillStyle =
                    "#64748b";


                ctx.font =
                    "11px Arial";


                ctx.fillText(

                    index === 0
                        ? "Départ"
                        : "#" + index,

                    point.x,

                    height -
                        paddingBottom +
                        10
                );
            }
        }
    );
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


    const sortedTrades =
        [...archivedTrades].sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );


    const ctx =
        canvas.getContext("2d");


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


    const initial =
        Number(
            archive.initialCapital
        ) || 0;


    const values = [
        initial
    ];


    let balance =
        initial;


    sortedTrades.forEach(
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
        let value = scale.min;
        value <= scale.max;
        value += scale.step
    ) {

        const y =
            paddingTop +
            chartHeight -
            (
                (value -
                    scale.min) /
                (
                    scale.max -
                    scale.min
                )
            ) *
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

        ctx.lineWidth = 1;

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


    ctx.beginPath();


    ctx.moveTo(
        paddingLeft,
        paddingTop
    );


    ctx.lineTo(
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
        "rgba(100,116,139,0.5)";


    ctx.stroke();


    const points = [];


    values.forEach(
        (value, index) => {

            const x =
                paddingLeft +
                (
                    index /
                    Math.max(
                        values.length - 1,
                        1
                    )
                ) *
                chartWidth;


            const y =
                paddingTop +
                chartHeight -
                (
                    (value -
                        scale.min) /
                    (
                        scale.max -
                        scale.min
                    )
                ) *
                chartHeight;


            points.push({

                x,

                y,

                value
            });
        }
    );


    for (
        let i = 0;
        i < points.length - 1;
        i++
    ) {

        const trade =
            sortedTrades[i];


        const pnl =
            Number(
                trade.pnl
            ) || 0;


        let lineColor =
            "#64748b";


        if (
            pnl > 0
        ) {

            lineColor =
                "#16a34a";

        } else if (
            pnl < 0
        ) {

            lineColor =
                "#dc2626";
        }


        ctx.beginPath();


        ctx.moveTo(
            points[i].x,
            points[i].y
        );


        ctx.lineTo(
            points[i + 1].x,
            points[i + 1].y
        );


        ctx.strokeStyle =
            lineColor;


        ctx.lineWidth = 3;

        ctx.lineCap =
            "round";


        ctx.stroke();
    }


    points.forEach(
        (point, index) => {

            let pointColor =
                "#64748b";


            if (
                index > 0
            ) {

                const pnl =
                    Number(
                        sortedTrades[
                            index - 1
                        ].pnl
                    ) || 0;


                if (
                    pnl > 0
                ) {

                    pointColor =
                        "#16a34a";

                } else if (
                    pnl < 0
                ) {

                    pointColor =
                        "#dc2626";
                }
            }


            ctx.beginPath();


            ctx.arc(
                point.x,
                point.y,
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


    ctx.textAlign =
        "center";


    ctx.textBaseline =
        "top";


    points.forEach(
        (point, index) => {

            if (
                index === 0 ||
                index ===
                    points.length - 1 ||
                points.length <= 10
            ) {

                ctx.fillStyle =
                    "#64748b";


                ctx.font =
                    "11px Arial";


                ctx.fillText(

                    index === 0
                        ? "Départ"
                        : "#" + index,

                    point.x,

                    height -
                        paddingBottom +
                        10
                );
            }
        }
    );
}


// ============================================================
// ARCHIVES
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


    const sortedArchives =
        [...archives].sort(
            (a, b) =>
                new Date(b.archivedAt) -
                new Date(a.archivedAt)
        );


    sortedArchives.forEach(
        archive => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "archive-card";


            card.innerHTML = `

                <div
                    class="archive-card-header"
                >

                    <div>

                        <h3>
                            ${escapeHtml(
                                archive.name
                            )}
                        </h3>


                        <small>

                            Archivé le

                            ${escapeHtml(
                                formatDateTime(
                                    archive.archivedAt
                                )
                            )}

                        </small>

                    </div>

                </div>


                <div
                    class="archive-stats"
                >

                    <div>

                        <span>
                            Initial
                        </span>

                        <strong>
                            ${money(
                                archive.initialCapital
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Final
                        </span>

                        <strong>
                            ${money(
                                archive.finalBalance
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Risque
                        </span>

                        <strong>
                            ${money(
                                archive.riskPerTrade
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Objectif
                        </span>

                        <strong>
                            ${money(
                                archive.objectivePerTrade
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            RR
                        </span>

                        <strong>
                            ${Number(
                                archive.rr || 0
                            ).toFixed(2)}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Profit
                        </span>

                        <strong>
                            ${money(
                                archive.totalProfit
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Trades
                        </span>

                        <strong>
                            ${archive.totalTrades}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Winrate
                        </span>

                        <strong>
                            ${
                                Number(
                                    archive.winrate ||
                                    0
                                ).toFixed(1)
                            }%

                        </strong>

                    </div>

                </div>


                <div
                    class="archive-actions"
                >

                    <button
                        class="secondary-btn view-archive-chart"
                        data-id="${archive.id}"
                    >
                        📈 Voir le graphique
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


function formatDateTime(
    dateString
) {

    if (!dateString) {
        return "-";
    }


    const date =
        new Date(dateString);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }


    return date.toLocaleString(
        "fr-FR",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );
}


function createArchiveFromCurrentCapital() {

    const currentTrades =
        getCurrentCapitalTrades();


    const totalProfit =
        calculateProfit(
            currentTrades
        );


    const finalBalance =
        calculateCurrentBalance();


    const winrate =
        calculateWinrate(
            currentTrades
        );


    const archive = {

        id:
            generateId(),

        name:
            activeCapital.name,

        initialCapital:
            Number(
                activeCapital.initialCapital
            ) || 0,

        riskPerTrade:
            Number(
                activeCapital.riskPerTrade
            ) || 0,

        objectivePerTrade:
            Number(
                activeCapital.objectivePerTrade
            ) || 0,

        rr:
            calculateCapitalRR(),

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


    const objective =
        parseNumber(
            document.getElementById(
                "capitalObjectiveInput"
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
            "Veuillez entrer un Risque par trade valide."
        );

        return;
    }


    if (
        !Number.isFinite(objective) ||
        objective <= 0
    ) {

        alert(
            "Veuillez entrer un Objectif par trade valide."
        );

        return;
    }


    const currentTrades =
        getCurrentCapitalTrades();


    if (
        currentTrades.length > 0
    ) {

        createArchiveFromCurrentCapital();
    }


    activeCapital = {

        id:
            generateId(),

        name:
            name,

        initialCapital:
            amount,

        riskPerTrade:
            risk,

        objectivePerTrade:
            objective,

        createdAt:
            new Date().toISOString()
    };


    saveActiveCapital();


    closeCapitalModal();


    refreshAll();


    alert(
        `Capital créé avec succès ! RR configuré : ${(objective / risk).toFixed(2)}`
    );
}


// ============================================================
// MODIFIER CAPITAL
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


    const objective =
        parseNumber(
            document.getElementById(
                "capitalObjectiveInput"
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
            "Veuillez entrer un Risque par trade valide."
        );

        return;
    }


    if (
        !Number.isFinite(objective) ||
        objective <= 0
    ) {

        alert(
            "Veuillez entrer un Objectif par trade valide."
        );

        return;
    }


    const currentTrades =
        getCurrentCapitalTrades();


    if (
        amount !==
        Number(
            activeCapital.initialCapital
        )
    ) {

        if (
            currentTrades.length > 0
        ) {

            createArchiveFromCurrentCapital();
        }


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
                name,

            initialCapital:
                amount,

            riskPerTrade:
                risk,

            objectivePerTrade:
                objective,

            createdAt:
                new Date().toISOString()
        };

    } else {

        activeCapital.name =
            name;

        activeCapital.riskPerTrade =
            risk;

        activeCapital.objectivePerTrade =
            objective;
    }


    saveTrades();

    saveActiveCapital();


    closeCapitalModal();


    refreshAll();


    alert(
        `Capital modifié ! RR configuré : ${(objective / risk).toFixed(2)}`
    );
}


// ============================================================
// ARCHIVER MANUELLEMENT
// ============================================================

function archiveCurrentCapital() {

    const currentTrades =
        getCurrentCapitalTrades();


    const confirmed =
        confirm(
            "Voulez-vous archiver le capital actuel ?"
        );


    if (!confirmed) {
        return;
    }


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
                archives.length + 1
            ),

        initialCapital:
            0,

        riskPerTrade:
            0,

        objectivePerTrade:
            0,

        createdAt:
            new Date().toISOString()
    };


    saveTrades();

    saveActiveCapital();


    refreshAll();
}


// ============================================================
// SUPPRIMER ARCHIVE
// ============================================================

function deleteArchive(id) {

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
                archive.id !== id
        );


    saveArchives();


    renderArchives();
}


// ============================================================
// MODAL CAPITAL
// ============================================================

function updateCapitalModalRR() {

    const riskInput =
        document.getElementById(
            "capitalRiskInput"
        );

    const objectiveInput =
        document.getElementById(
            "capitalObjectiveInput"
        );

    const rrDisplay =
        document.getElementById(
            "capitalModalRR"
        );


    if (
        !riskInput ||
        !objectiveInput ||
        !rrDisplay
    ) {
        return;
    }


    const risk =
        parseNumber(
            riskInput.value
        );

    const objective =
        parseNumber(
            objectiveInput.value
        );


    const rr =
        calculateCapitalRR(
            risk,
            objective
        );


    rrDisplay.textContent =
        rr > 0
            ? rr.toFixed(2)
            : "0.00";
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


    const objectiveInput =
        document.getElementById(
            "capitalObjectiveInput"
        );


    if (
        mode === "edit"
    ) {

        title.textContent =
            "Modifier le capital";


        nameInput.value =
            activeCapital.name;


        amountInput.value =
            activeCapital.initialCapital;


        riskInput.value =
            activeCapital.riskPerTrade;


        objectiveInput.value =
            activeCapital.objectivePerTrade;

    } else {

        title.textContent =
            "Nouveau capital";


        nameInput.value =
            "Capital " +
            (
                archives.length + 1
            );


        amountInput.value =
            "";

        riskInput.value =
            "";

        objectiveInput.value =
            "";
    }


    updateCapitalModalRR();


    modal.classList.add(
        "show"
    );
}


function closeCapitalModal() {

    document
        .getElementById(
            "capitalModal"
        )
        .classList.remove(
            "show"
        );
}


// ============================================================
// MODAL GRAPHIQUE ARCHIVE
// ============================================================

function openArchiveChart(
    archive
) {

    const modal =
        document.getElementById(
            "archiveChartModal"
        );


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


    modal.classList.add(
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

    document
        .getElementById(
            "archiveChartModal"
        )
        .classList.remove(
            "show"
        );
}


// ============================================================
// EFFACER LES TRADES
// ============================================================

function clearCurrentTrades() {

    const currentTrades =
        getCurrentCapitalTrades();


    if (
        currentTrades.length === 0
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
        theme === "light"
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
// REFRESH GENERAL
// ============================================================

function refreshAll() {

    updateCapitalDisplay();

    updateStats();

    updateSetupTable();

    renderHistory();

    renderArchives();

    drawCapitalChart();

    updateAutomaticTradeValues();
}


// ============================================================
// EVENEMENTS
// ============================================================

function setupEvents() {

    // Trade
    document
        .getElementById(
            "tradeForm"
        )
        .addEventListener(
            "submit",
            addTrade
        );


    // MM automatique
    [
        "asset",
        "direction",
        "entry",
        "sl"
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


    // Mise à jour RR dans la fenêtre Capital
    [
        "capitalRiskInput",
        "capitalObjectiveInput"
    ].forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.addEventListener(
                    "input",
                    updateCapitalModalRR
                );


                element.addEventListener(
                    "change",
                    updateCapitalModalRR
                );
            }
        }
    );


    // Périodes
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


                        updateStats();

                        updateSetupTable();
                    }
                );
            }
        );


    // Modifier capital
    document
        .getElementById(
            "changeCapitalBtn"
        )
        .addEventListener(
            "click",
            () => {

                openCapitalModal(
                    "edit"
                );
            }
        );


    // Nouveau capital
    document
        .getElementById(
            "newCapitalBtn"
        )
        .addEventListener(
            "click",
            () => {

                openCapitalModal(
                    "new"
                );
            }
        );


    // Archiver
    document
        .getElementById(
            "archiveCapitalBtn"
        )
        .addEventListener(
            "click",
            archiveCurrentCapital
        );


    // Sauvegarder capital
    document
        .getElementById(
            "saveCapitalBtn"
        )
        .addEventListener(
            "click",
            () => {

                const title =
                    document.getElementById(
                        "capitalModalTitle"
                    ).textContent;


                if (
                    title.includes(
                        "Modifier"
                    )
                ) {

                    saveCapitalModification();

                } else {

                    createNewCapital();
                }
            }
        );


    // Annuler modal
    document
        .getElementById(
            "cancelCapitalBtn"
        )
        .addEventListener(
            "click",
            closeCapitalModal
        );


    document
        .getElementById(
            "cancelCapitalBtn2"
        )
        .addEventListener(
            "click",
            closeCapitalModal
        );


    // Fermer graphique archive
    document
        .getElementById(
            "closeArchiveChartBtn"
        )
        .addEventListener(
            "click",
            closeArchiveChart
        );


    // Effacer trades
    document
        .getElementById(
            "clearBtn"
        )
        .addEventListener(
            "click",
            clearCurrentTrades
        );


    // Theme
    document
        .getElementById(
            "themeToggle"
        )
        .addEventListener(
            "click",
            toggleTheme
        );


    // Fermer modal en cliquant dehors
    document
        .getElementById(
            "capitalModal"
        )
        .addEventListener(
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


    document
        .getElementById(
            "archiveChartModal"
        )
        .addEventListener(
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


    // Escape
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


    // Redimensionnement graphique
    window.addEventListener(
        "resize",
        () => {

            drawCapitalChart();
        }
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
}


document.addEventListener(
    "DOMContentLoaded",
    init
);
