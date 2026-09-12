const TRADES_KEY = "tradingTrades";
const CAPITAL_KEY = "tradingActiveCapital";
const ARCHIVES_KEY = "tradingCapitalArchives";
const THEME_KEY = "tradingDashboardTheme";

const MIN_RR = 2.00;
const LOT_STEP = 0.01;
const MIN_LOT = 0.01;

const MADAGASCAR_TIMEZONE =
    "Indian/Antananarivo";

let trades = [];
let archives = [];
let activeCapital = null;
let currentPeriod = "today";

let editingExistingCapital = false;
let editingArchiveId = null;


/* ==========================================================
   ACTIFS
========================================================== */

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


/* ==========================================================
   UTILITAIRES
========================================================== */

function parseNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    const normalized =
        String(value)
            .replace(/\s/g, "")
            .replace(",", ".");

    const number =
        Number(normalized);

    return Number.isFinite(number)
        ? number
        : 0;
}


function money(value) {

    const number =
        parseNumber(value);

    return new Intl.NumberFormat(
        "fr-FR",
        {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(number);
}


function formatNumber(
    value,
    decimals = 2
) {

    const number =
        parseNumber(value);

    return number.toLocaleString(
        "fr-FR",
        {
            minimumFractionDigits:
                decimals,

            maximumFractionDigits:
                decimals
        }
    );
}


function generateId() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .slice(2)
    );
}


function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ==========================================================
   DATE / HEURE MADAGASCAR UTC+3
========================================================== */

function getMadagascarDateTime(
    date = new Date()
) {

    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            timeZone:
                MADAGASCAR_TIMEZONE,

            day: "2-digit",
            month: "2-digit",
            year: "numeric",

            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",

            hour12: false
        }
    ).format(date);
}


function getMadagascarDate() {

    const parts =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    MADAGASCAR_TIMEZONE,

                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).formatToParts(
            new Date()
        );

    const result = {};

    parts.forEach(
        part => {

            if (
                part.type !==
                "literal"
            ) {

                result[
                    part.type
                ] =
                    part.value;
            }
        }
    );

    return (
        `${result.year}-${result.month}-${result.day}`
    );
}


function formatStoredDateTime(
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

        return String(value);
    }

    return getMadagascarDateTime(
        date
    );
}


/* ==========================================================
   ACTIFS
========================================================== */

function normalizeAsset(asset) {

    const value =
        String(asset || "")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "");

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
        "GOLD": "XAUUSD",

        "BTCUSD": "BTCUSD",
        "BTC/USD": "BTCUSD"
    };

    return (
        aliases[value] ||
        String(asset || "").trim()
    );
}


function getAssetSpec(asset) {

    return (
        ASSET_SPECS[
            normalizeAsset(asset)
        ] || null
    );
}


/* ==========================================================
   PIPS
========================================================== */

function calculatePips(
    asset,
    direction,
    entry,
    exit
) {

    const normalizedAsset =
        normalizeAsset(asset);

    const spec =
        getAssetSpec(
            normalizedAsset
        );

    const e =
        parseNumber(entry);

    const x =
        parseNumber(exit);

    if (
        !spec ||
        e <= 0 ||
        x <= 0
    ) {

        return 0;
    }

    let difference;

    if (
        String(direction)
            .toUpperCase() ===
        "SELL"
    ) {

        difference =
            e - x;

    } else {

        difference =
            x - e;
    }

    return (
        difference *
        spec.pipMultiplier
    );
}


/* ==========================================================
   CAPITAL MM
========================================================== */

function getCapitalRisk(
    capital = activeCapital
) {

    if (!capital) {
        return 0;
    }

    return parseNumber(
        capital.riskPerTrade ??
        capital.riskReference ??
        0
    );
}


function getCapitalRR(
    capital = activeCapital
) {

    if (!capital) {
        return 0;
    }

    if (
        capital.rrTarget !==
        undefined &&
        capital.rrTarget !==
        null
    ) {

        const rr =
            parseNumber(
                capital.rrTarget
            );

        if (rr > 0) {
            return rr;
        }
    }

    const risk =
        parseNumber(
            capital.riskPerTrade
        );

    const objective =
        parseNumber(
            capital.objectivePerTrade
        );

    if (
        risk > 0 &&
        objective > 0
    ) {

        return (
            objective /
            risk
        );
    }

    return 0;
}


function getCapitalObjective(
    capital = activeCapital
) {

    const risk =
        getCapitalRisk(
            capital
        );

    const rr =
        getCapitalRR(
            capital
        );

    if (
        risk <= 0 ||
        rr <= 0
    ) {

        return 0;
    }

    return (
        risk *
        rr
    );
}


/* ==========================================================
   P/L
========================================================== */

function calculateAutomaticPnL(
    result,
    realRisk,
    rr
) {

    const risk =
        parseNumber(
            realRisk
        );

    const rewardRatio =
        parseNumber(
            rr
        );

    if (
        risk <= 0
    ) {

        return null;
    }

    if (
        result === "TP"
    ) {

        if (
            rewardRatio <
            MIN_RR
        ) {

            return null;
        }

        return (
            risk *
            rewardRatio
        );
    }

    if (
        result === "SL"
    ) {

        return -risk;
    }

    if (
        result === "BE"
    ) {

        return 0;
    }

    return null;
}


function updateAutomaticPnL() {

    const profitInput =
        document.getElementById(
            "profit"
        );

    const resultInput =
        document.getElementById(
            "result"
        );

    const riskField =
        document.getElementById(
            "tradeRealRisk"
        );

    const rrField =
        document.getElementById(
            "calculatedRR"
        );

    if (
        !profitInput ||
        !resultInput ||
        !riskField ||
        !rrField
    ) {

        return;
    }

    const risk =
        parseNumber(
            riskField.value
        );

    const rr =
        parseNumber(
            rrField.value
        );

    const pnl =
        calculateAutomaticPnL(
            resultInput.value,
            risk,
            rr
        );

    profitInput.value =
        pnl === null
            ? ""
            : pnl.toFixed(2);
}


/* ==========================================================
   VALEUR PIP
========================================================== */

function getPipValuePerLotUSD(
    asset,
    entry
) {

    const normalizedAsset =
        normalizeAsset(asset);

    const spec =
        getAssetSpec(
            normalizedAsset
        );

    const e =
        parseNumber(entry);

    if (
        !spec ||
        e <= 0
    ) {

        return 0;
    }

    if (
        spec.type ===
        "forex" &&
        spec.pipValuePerLot
    ) {

        return (
            spec.pipValuePerLot
        );
    }

    if (
        spec.type ===
        "forexQuoteConversion"
    ) {

        return 10 / e;
    }

    if (
        spec.type ===
        "jpy"
    ) {

        return 1000 / e;
    }

    return 0;
}


/* ==========================================================
   LOT
========================================================== */

function calculateRawLot(
    asset,
    entry,
    sl,
    riskAmount
) {

    const normalizedAsset =
        normalizeAsset(asset);

    const spec =
        getAssetSpec(
            normalizedAsset
        );

    const e =
        parseNumber(entry);

    const s =
        parseNumber(sl);

    const risk =
        parseNumber(riskAmount);

    if (
        !spec ||
        e <= 0 ||
        s <= 0 ||
        risk <= 0
    ) {

        return 0;
    }

    const riskDistance =
        Math.abs(
            e - s
        );

    if (
        riskDistance <= 0
    ) {

        return 0;
    }

    if (
        spec.type ===
        "gold"
    ) {

        return (
            risk /
            (
                riskDistance *
                spec.contractSize
            )
        );
    }

    if (
        spec.type ===
        "crypto"
    ) {

        return (
            risk /
            riskDistance
        );
    }

    const pipDistance =
        riskDistance *
        spec.pipMultiplier;

    if (
        pipDistance <= 0
    ) {

        return 0;
    }

    const pipValue =
        getPipValuePerLotUSD(
            normalizedAsset,
            e
        );

    if (
        pipValue <= 0
    ) {

        return 0;
    }

    return (
        risk /
        (
            pipDistance *
            pipValue
        )
    );
}


function floorToLotStep(
    value,
    step = LOT_STEP
) {

    if (
        !Number.isFinite(value) ||
        value <= 0
    ) {

        return 0;
    }

    const floored =
        Math.floor(
            (
                value +
                Number.EPSILON
            ) /
            step
        ) *
        step;

    return Number(
        floored.toFixed(2)
    );
}


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
        rawLot <
        MIN_LOT
    ) {

        return 0;
    }

    return floorToLotStep(
        rawLot
    );
}


function calculateRiskForLot(
    asset,
    entry,
    sl,
    lot
) {

    const normalizedAsset =
        normalizeAsset(asset);

    const spec =
        getAssetSpec(
            normalizedAsset
        );

    const e =
        parseNumber(entry);

    const s =
        parseNumber(sl);

    const l =
        parseNumber(lot);

    if (
        !spec ||
        e <= 0 ||
        s <= 0 ||
        l <= 0
    ) {

        return 0;
    }

    const riskDistance =
        Math.abs(
            e - s
        );

    if (
        riskDistance <= 0
    ) {

        return 0;
    }

    if (
        spec.type ===
        "gold"
    ) {

        return (
            riskDistance *
            spec.contractSize *
            l
        );
    }

    if (
        spec.type ===
        "crypto"
    ) {

        return (
            riskDistance *
            l
        );
    }

    const pipDistance =
        riskDistance *
        spec.pipMultiplier;

    const pipValue =
        getPipValuePerLotUSD(
            normalizedAsset,
            e
        );

    if (
        pipValue <= 0
    ) {

        return 0;
    }

    return (
        pipDistance *
        pipValue *
        l
    );
}


/* ==========================================================
   TP
========================================================== */

function calculateAutomaticTP(
    direction,
    entry,
    sl,
    rr
) {

    const e =
        parseNumber(entry);

    const s =
        parseNumber(sl);

    const rewardRatio =
        parseNumber(rr);

    if (
        e <= 0 ||
        s <= 0 ||
        rewardRatio <
        MIN_RR
    ) {

        return 0;
    }

    const riskDistance =
        Math.abs(
            e - s
        );

    if (
        riskDistance <= 0
    ) {

        return 0;
    }

    const rewardDistance =
        riskDistance *
        rewardRatio;

    if (
        String(direction)
            .toUpperCase() ===
        "SELL"
    ) {

        return (
            e -
            rewardDistance
        );
    }

    return (
        e +
        rewardDistance
    );
}


/* ==========================================================
   VALIDATION
========================================================== */

function isValidStop(
    direction,
    entry,
    sl
) {

    const e =
        parseNumber(entry);

    const s =
        parseNumber(sl);

    if (
        e <= 0 ||
        s <= 0
    ) {

        return false;
    }

    if (
        String(direction)
            .toUpperCase() ===
        "BUY"
    ) {

        return s < e;
    }

    return s > e;
}


/* ==========================================================
   TRADE AUTOMATIQUE
========================================================== */

function updateAutomaticTradeValues() {

    const assetInput =
        document.getElementById(
            "asset"
        );

    const directionInput =
        document.getElementById(
            "direction"
        );

    const entryInput =
        document.getElementById(
            "entry"
        );

    const slInput =
        document.getElementById(
            "sl"
        );

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

    const info =
        document.getElementById(
            "tradeMMInfo"
        );

    if (
        !assetInput ||
        !directionInput ||
        !entryInput ||
        !slInput ||
        !lotInput ||
        !tpInput ||
        !rrInput ||
        !info
    ) {

        return;
    }

    let realRiskHidden =
        document.getElementById(
            "tradeRealRisk"
        );

    if (!realRiskHidden) {

        realRiskHidden =
            document.createElement(
                "input"
            );

        realRiskHidden.type =
            "hidden";

        realRiskHidden.id =
            "tradeRealRisk";

        document
            .getElementById(
                "tradeForm"
            )
            ?.appendChild(
                realRiskHidden
            );
    }

    const asset =
        normalizeAsset(
            assetInput.value
        );

    const direction =
        directionInput.value;

    const entry =
        parseNumber(
            entryInput.value
        );

    const sl =
        parseNumber(
            slInput.value
        );

    lotInput.value =
        "";

    tpInput.value =
        "";

    rrInput.value =
        "0.00";

    realRiskHidden.value =
        "";

    if (!activeCapital) {

        info.innerHTML =
            "⚠️ Aucun capital actif n'est configuré.";

        updateAutomaticPnL();

        return;
    }

    const referenceRisk =
        getCapitalRisk();

    const rrTarget =
        getCapitalRR();

    if (
        referenceRisk <= 0
    ) {

        info.innerHTML =
            "⚠️ Configurez un risque de référence supérieur à 0.";

        updateAutomaticPnL();

        return;
    }

    if (
        rrTarget <
        MIN_RR
    ) {

        info.innerHTML =
            "⚠️ Le RR cible doit être au minimum de 2.00.";

        updateAutomaticPnL();

        return;
    }

    rrInput.value =
        rrTarget.toFixed(2);

    if (
        !getAssetSpec(asset)
    ) {

        info.innerHTML =
            "ℹ️ Sélectionnez un actif reconnu.";

        updateAutomaticPnL();

        return;
    }

    if (
        entry <= 0 ||
        sl <= 0
    ) {

        info.innerHTML = `
            Risque de référence :
            <strong>${money(
                referenceRisk
            )}</strong>

            &nbsp; | &nbsp;

            RR cible :
            <strong>${rrTarget.toFixed(
                2
            )}</strong>
        `;

        updateAutomaticPnL();

        return;
    }

    if (
        !isValidStop(
            direction,
            entry,
            sl
        )
    ) {

        info.innerHTML =
            `⚠️ SL invalide pour un ${direction}.`;

        updateAutomaticPnL();

        return;
    }

    const rawLot =
        calculateRawLot(
            asset,
            entry,
            sl,
            referenceRisk
        );

    if (
        rawLot <
        MIN_LOT
    ) {

        info.innerHTML = `
            ⚠️ Risque de référence trop faible pour ce SL.
            <br>
            Lot théorique :
            <strong>${rawLot.toFixed(
                4
            )}</strong>

            <br>

            Lot minimum :
            <strong>0.01</strong>
        `;

        updateAutomaticPnL();

        return;
    }

    const lot =
        calculateAutomaticLot(
            asset,
            entry,
            sl,
            referenceRisk
        );

    if (
        lot <
        MIN_LOT
    ) {

        info.innerHTML =
            "⚠️ Le lot automatique est inférieur au minimum de 0.01.";

        updateAutomaticPnL();

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

        info.innerHTML =
            "⚠️ Impossible de calculer le risque réel.";

        updateAutomaticPnL();

        return;
    }

    const tp =
        calculateAutomaticTP(
            direction,
            entry,
            sl,
            rrTarget
        );

    const realObjective =
        realRisk *
        rrTarget;

    lotInput.value =
        lot.toFixed(2);

    tpInput.value =
        tp
            .toFixed(5)
            .replace(
                /0+$/,
                ""
            )
            .replace(
                /\.$/,
                ""
            );

    rrInput.value =
        rrTarget.toFixed(2);

    realRiskHidden.value =
        realRisk.toFixed(8);

    const difference =
        realRisk -
        referenceRisk;

    let riskStatus =
        "Risque réel conforme";

    if (
        difference <
        -0.000001
    ) {

        riskStatus =
            `Sous-risque : ${money(
                Math.abs(
                    difference
                )
            )}`;
    }

    if (
        difference >
        0.000001
    ) {

        riskStatus =
            `Dépassement : ${money(
                difference
            )}`;
    }

    info.innerHTML = `
        <strong>MM automatique</strong>

        <br><br>

        Risque de référence :
        <strong>${money(
            referenceRisk
        )}</strong>

        &nbsp; | &nbsp;

        Risque réel :
        <strong>${money(
            realRisk
        )}</strong>

        <br>

        Lot :
        <strong>${lot.toFixed(
            2
        )}</strong>

        &nbsp; | &nbsp;

        Lot théorique :
        <strong>${rawLot.toFixed(
            4
        )}</strong>

        <br>

        RR cible :
        <strong>${rrTarget.toFixed(
            2
        )}</strong>

        <br>

        Objectif théorique :
        <strong>${money(
            referenceRisk *
            rrTarget
        )}</strong>

        <br>

        Gain réel si TP :
        <strong>${money(
            realObjective
        )}</strong>

        <br>

        ${riskStatus}
    `;

    updateAutomaticPnL();
}


/* ==========================================================
   STOCKAGE / MIGRATION
========================================================== */

function saveTrades() {

    localStorage.setItem(
        TRADES_KEY,
        JSON.stringify(
            trades
        )
    );
}


function saveArchives() {

    localStorage.setItem(
        ARCHIVES_KEY,
        JSON.stringify(
            archives
        )
    );
}


function saveActiveCapital() {

    if (activeCapital) {

        localStorage.setItem(
            CAPITAL_KEY,
            JSON.stringify(
                activeCapital
            )
        );

    } else {

        localStorage.removeItem(
            CAPITAL_KEY
        );
    }
}


function migrateCapital(
    capital
) {

    if (!capital) {
        return;
    }

    if (!capital.id) {

        capital.id =
            generateId();
    }

    if (
        capital.riskPerTrade ===
            undefined &&
        capital.riskReference !==
            undefined
    ) {

        capital.riskPerTrade =
            parseNumber(
                capital.riskReference
            );
    }

    const risk =
        parseNumber(
            capital.riskPerTrade
        );

    let rr =
        parseNumber(
            capital.rrTarget
        );

    if (
        rr <= 0 &&
        risk > 0 &&
        parseNumber(
            capital.objectivePerTrade
        ) > 0
    ) {

        rr =
            parseNumber(
                capital.objectivePerTrade
            ) /
            risk;
    }

    if (
        rr <= 0
    ) {

        rr =
            MIN_RR;
    }

    capital.riskReference =
        risk;

    capital.rrTarget =
        rr;

    capital.objectivePerTrade =
        risk * rr;

    if (
        capital.createdAt ===
        undefined
    ) {

        capital.createdAt =
            null;
    }

    if (
        capital.archivedAt ===
        undefined
    ) {

        capital.archivedAt =
            null;
    }
}


function loadData() {

    try {

        const storedTrades =
            JSON.parse(
                localStorage.getItem(
                    TRADES_KEY
                )
            );

        const storedArchives =
            JSON.parse(
                localStorage.getItem(
                    ARCHIVES_KEY
                )
            );

        const storedCapital =
            JSON.parse(
                localStorage.getItem(
                    CAPITAL_KEY
                )
            );

        trades =
            Array.isArray(
                storedTrades
            )
                ? storedTrades
                : [];

        archives =
            Array.isArray(
                storedArchives
            )
                ? storedArchives
                : [];

        activeCapital =
            storedCapital &&
            typeof storedCapital ===
                "object"
                ? storedCapital
                : null;

    } catch (
        error
    ) {

        console.error(
            "Erreur de chargement :",
            error
        );

        trades = [];
        archives = [];
        activeCapital = null;
    }

    if (
        activeCapital
    ) {

        migrateCapital(
            activeCapital
        );
    }

    archives.forEach(
        migrateCapital
    );

    trades =
        trades.map(
            trade => {

                const migrated = {
                    ...trade
                };

                if (
                    !migrated.id
                ) {

                    migrated.id =
                        generateId();
                }

                migrated.asset =
                    normalizeAsset(
                        migrated.asset
                    );

                if (
                    migrated.pnl ===
                        undefined &&
                    migrated.profit !==
                        undefined
                ) {

                    migrated.pnl =
                        parseNumber(
                            migrated.profit
                        );
                }

                if (
                    migrated.profit ===
                        undefined &&
                    migrated.pnl !==
                        undefined
                ) {

                    migrated.profit =
                        parseNumber(
                            migrated.pnl
                        );
                }

                if (
                    migrated.lot ===
                        undefined
                ) {

                    migrated.lot =
                        0;
                }

                if (
                    migrated.pips ===
                        undefined ||
                    migrated.pips ===
                        null
                ) {

                    const exit =
                        migrated.result ===
                            "TP"
                            ? migrated.tp
                            : migrated.result ===
                                "SL"
                                ? migrated.sl
                                : migrated.entry;

                    migrated.pips =
                        calculatePips(
                            migrated.asset,
                            migrated.direction,
                            migrated.entry,
                            exit
                        );
                }

                if (
                    migrated.createdAt ===
                    undefined
                ) {

                    migrated.createdAt =
                        null;
                }

                return migrated;
            }
        );

    saveTrades();
    saveArchives();
    saveActiveCapital();
}


/* ==========================================================
   CAPITALS / TRADES
========================================================== */

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


function getCapitalProfit(
    capitalId
) {

    return getCapitalTrades(
        capitalId
    ).reduce(
        (
            sum,
            trade
        ) =>
            sum +
            parseNumber(
                trade.pnl
            ),
        0
    );
}


function getCapitalBalance(
    capital
) {

    if (!capital) {
        return 0;
    }

    return (
        parseNumber(
            capital.initialCapital
        ) +
        getCapitalProfit(
            capital.id
        )
    );
}


/* ==========================================================
   CAPITAL OBJECT
========================================================== */

function buildCapitalObject(
    name,
    initialCapital,
    risk,
    rr
) {

    return {

        id:
            generateId(),

        name,

        initialCapital,

        riskPerTrade:
            risk,

        riskReference:
            risk,

        rrTarget:
            rr,

        objectivePerTrade:
            risk * rr,

        createdAt:
            new Date()
                .toISOString(),

        archivedAt:
            null
    };
}


/* ==========================================================
   ARCHIVAGE
========================================================== */

function archiveCurrentCapital(
    askConfirmation = true,
    refreshAfter = true
) {

    if (!activeCapital) {
        return false;
    }

    const capitalTrades =
        getActiveCapitalTrades();

    if (
        askConfirmation &&
        capitalTrades.length > 0
    ) {

        const confirmed =
            confirm(
                `Archiver "${activeCapital.name}" ?\n\n` +
                `${capitalTrades.length} trade(s) seront conservés.\n\n` +
                `Le capital sera placé dans les archives avec sa date et son heure.`
            );

        if (!confirmed) {
            return false;
        }
    }

    const profit =
        getCapitalProfit(
            activeCapital.id
        );

    const finalBalance =
        parseNumber(
            activeCapital.initialCapital
        ) +
        profit;

    const archive = {

        ...activeCapital,

        archivedAt:
            new Date()
                .toISOString(),

        finalBalance,

        totalProfit:
            profit,

        trades:
            capitalTrades.map(
                trade => ({
                    ...trade
                })
            )
    };

    const existingIndex =
        archives.findIndex(
            item =>
                item.id ===
                activeCapital.id
        );

    if (
        existingIndex >= 0
    ) {

        archives[
            existingIndex
        ] = archive;

    } else {

        archives.push(
            archive
        );
    }

    activeCapital = null;

    saveArchives();
    saveActiveCapital();
    saveTrades();

    if (
        refreshAfter
    ) {

        refreshAll();
    }

    return true;
}


/* ==========================================================
   NOUVEAU CAPITAL
========================================================== */

function createNewCapital(
    preserveCurrent = true
) {

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

    if (
        !nameInput ||
        !amountInput ||
        !riskInput ||
        !rrInput
    ) {

        return;
    }

    const name =
        nameInput.value.trim() ||
        `Capital ${
            archives.length + 1
        }`;

    const initialCapital =
        parseNumber(
            amountInput.value
        );

    const risk =
        parseNumber(
            riskInput.value
        );

    const rr =
        parseNumber(
            rrInput.value
        );

    if (
        initialCapital <= 0
    ) {

        alert(
            "Le capital initial doit être supérieur à 0."
        );

        return;
    }

    if (
        risk <= 0
    ) {

        alert(
            "Le risque de référence doit être supérieur à 0."
        );

        return;
    }

    if (
        rr <
        MIN_RR
    ) {

        alert(
            "Le RR cible doit être au minimum de 2.00."
        );

        return;
    }

    if (
        activeCapital &&
        preserveCurrent
    ) {

        const archived =
            archiveCurrentCapital(
                true,
                false
            );

        if (!archived) {
            return;
        }
    }

    activeCapital =
        buildCapitalObject(
            name,
            initialCapital,
            risk,
            rr
        );

    saveActiveCapital();

    closeCapitalModal();

    refreshAll();
}


/* ==========================================================
   MODIFICATION CAPITAL ACTIF
========================================================== */

function saveCapitalModification() {

    if (!activeCapital) {
        return;
    }

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

    const name =
        nameInput.value.trim() ||
        activeCapital.name ||
        "Capital";

    const requestedInitialCapital =
        parseNumber(
            amountInput.value
        );

    const risk =
        parseNumber(
            riskInput.value
        );

    const rr =
        parseNumber(
            rrInput.value
        );

    if (
        requestedInitialCapital <= 0
    ) {

        alert(
            "Le capital initial doit être supérieur à 0."
        );

        return;
    }

    if (
        risk <= 0
    ) {

        alert(
            "Le risque de référence doit être supérieur à 0."
        );

        return;
    }

    if (
        rr <
        MIN_RR
    ) {

        alert(
            "Le RR cible doit être au minimum de 2.00."
        );

        return;
    }

    const existingTrades =
        getActiveCapitalTrades();

    activeCapital.name =
        name;

    activeCapital.riskPerTrade =
        risk;

    activeCapital.riskReference =
        risk;

    activeCapital.rrTarget =
        rr;

    activeCapital.objectivePerTrade =
        risk * rr;

    if (
        existingTrades.length === 0
    ) {

        activeCapital.initialCapital =
            requestedInitialCapital;
    }

    saveActiveCapital();

    closeCapitalModal();

    refreshAll();
}


/* ==========================================================
   MODIFICATION ARCHIVE
========================================================== */

function saveArchiveModification() {

    if (
        !editingArchiveId
    ) {

        return;
    }

    const archiveIndex =
        archives.findIndex(
            archive =>
                archive.id ===
                editingArchiveId
        );

    if (
        archiveIndex < 0
    ) {

        alert(
            "Archive introuvable."
        );

        return;
    }

    const archive =
        archives[
            archiveIndex
        ];

    const nameInput =
        document.getElementById(
            "capitalNameInput"
        );

    const riskInput =
        document.getElementById(
            "capitalRiskInput"
        );

    const rrInput =
        document.getElementById(
            "capitalRRInput"
        );

    const name =
        nameInput.value.trim() ||
        archive.name ||
        "Capital archivé";

    const risk =
        parseNumber(
            riskInput.value
        );

    const rr =
        parseNumber(
            rrInput.value
        );

    if (
        risk <= 0
    ) {

        alert(
            "Le risque de référence doit être supérieur à 0."
        );

        return;
    }

    if (
        rr <
        MIN_RR
    ) {

        alert(
            "Le RR cible doit être au minimum de 2.00."
        );

        return;
    }

    archive.name =
        name;

    archive.riskPerTrade =
        risk;

    archive.riskReference =
        risk;

    archive.rrTarget =
        rr;

    archive.objectivePerTrade =
        risk * rr;

    archives[
        archiveIndex
    ] = archive;

    saveArchives();

    editingArchiveId =
        null;

    closeCapitalModal();

    refreshAll();
}


/* ==========================================================
   MODAL CAPITAL
========================================================== */

function openCapitalModal(
    edit = false,
    archiveId = null
) {

    const modal =
        document.getElementById(
            "capitalModal"
        );

    if (!modal) {
        return;
    }

    const title =
        document.getElementById(
            "capitalModalTitle"
        );

    const subtitle =
        document.getElementById(
            "capitalModalSubtitle"
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

    const amountHelp =
        document.getElementById(
            "capitalAmountHelp"
        );

    editingExistingCapital =
        false;

    editingArchiveId =
        null;

    if (
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

        title.textContent =
            "Modifier le capital archivé";

        subtitle.textContent =
            "Modifier les paramètres sans changer son historique";

        nameInput.value =
            archive.name ||
            "";

        amountInput.value =
            parseNumber(
                archive.initialCapital
            );

        amountInput.disabled =
            true;

        riskInput.value =
            getCapitalRisk(
                archive
            );

        rrInput.value =
            getCapitalRR(
                archive
            ).toFixed(2);

        amountHelp.textContent =
            "Capital initial verrouillé pour protéger l'historique.";

    } else if (
        edit &&
        activeCapital
    ) {

        editingExistingCapital =
            true;

        title.textContent =
            "Modifier le capital";

        subtitle.textContent =
            "Modifier le capital actif et son MM";

        nameInput.value =
            activeCapital.name ||
            "";

        amountInput.value =
            parseNumber(
                activeCapital.initialCapital
            );

        const hasTrades =
            getActiveCapitalTrades()
                .length > 0;

        amountInput.disabled =
            hasTrades;

        amountHelp.textContent =
            hasTrades
                ? "Capital initial verrouillé car ce capital possède déjà des trades."
                : "Capital initial du compte.";

        riskInput.value =
            getCapitalRisk(
                activeCapital
            );

        rrInput.value =
            getCapitalRR(
                activeCapital
            ).toFixed(2);

    } else {

        title.textContent =
            "Nouveau capital";

        subtitle.textContent =
            "Créer un nouveau capital et son MM";

        nameInput.value =
            "";

        amountInput.value =
            "";

        amountInput.disabled =
            false;

        amountHelp.textContent =
            "Capital initial du compte.";

        riskInput.value =
            "";

        rrInput.value =
            MIN_RR.toFixed(2);
    }

    updateCapitalModalPreview();

    modal.classList.add(
        "show"
    );
}


function closeCapitalModal() {

    const modal =
        document.getElementById(
            "capitalModal"
        );

    if (modal) {

        modal.classList.remove(
            "show"
        );
    }

    editingArchiveId =
        null;
}


function updateCapitalModalPreview() {

    const riskInput =
        document.getElementById(
            "capitalRiskInput"
        );

    const rrInput =
        document.getElementById(
            "capitalRRInput"
        );

    const riskPreview =
        document.getElementById(
            "capitalModalRiskPreview"
        );

    const rrPreview =
        document.getElementById(
            "capitalModalRR"
        );

    const objectivePreview =
        document.getElementById(
            "capitalModalObjective"
        );

    if (
        !riskInput ||
        !rrInput
    ) {

        return;
    }

    const risk =
        parseNumber(
            riskInput.value
        );

    const rr =
        parseNumber(
            rrInput.value
        );

    const objective =
        risk *
        rr;

    if (
        riskPreview
    ) {

        riskPreview.textContent =
            money(risk);
    }

    if (
        rrPreview
    ) {

        rrPreview.textContent =
            rr.toFixed(2);
    }

    if (
        objectivePreview
    ) {

        objectivePreview.textContent =
            money(objective);
    }
}


/* ==========================================================
   CAPITAL ACTIF
========================================================== */

function renderActiveCapital() {

    const name =
        document.getElementById(
            "activeCapitalName"
        );

    const created =
        document.getElementById(
            "activeCapitalCreatedAt"
        );

    const initial =
        document.getElementById(
            "initialCapital"
        );

    const balance =
        document.getElementById(
            "currentBalance"
        );

    const totalProfit =
        document.getElementById(
            "totalProfit"
        );

    const activeRisk =
        document.getElementById(
            "activeRisk"
        );

    const activeObjective =
        document.getElementById(
            "activeObjective"
        );

    const activeRR =
        document.getElementById(
            "activeCapitalRR"
        );

    if (!activeCapital) {

        if (name) {
            name.textContent =
                "Aucun capital actif";
        }

        if (created) {
            created.textContent =
                "-";
        }

        if (initial) {
            initial.textContent =
                money(0);
        }

        if (balance) {
            balance.textContent =
                money(0);
        }

        if (totalProfit) {
            totalProfit.textContent =
                money(0);
        }

        if (activeRisk) {
            activeRisk.textContent =
                money(0);
        }

        if (activeObjective) {
            activeObjective.textContent =
                money(0);
        }

        if (activeRR) {
            activeRR.textContent =
                "0.00";
        }

        return;
    }

    const profit =
        getCapitalProfit(
            activeCapital.id
        );

    const currentBalance =
        parseNumber(
            activeCapital.initialCapital
        ) +
        profit;

    const risk =
        getCapitalRisk(
            activeCapital
        );

    const rr =
        getCapitalRR(
            activeCapital
        );

    const objective =
        risk *
        rr;

    if (name) {

        name.textContent =
            activeCapital.name ||
            "Capital actif";
    }

    if (created) {

        created.textContent =
            `Créé le : ${
                formatStoredDateTime(
                    activeCapital.createdAt
                )
            }`;
    }

    if (initial) {

        initial.textContent =
            money(
                activeCapital.initialCapital
            );
    }

    if (balance) {

        balance.textContent =
            money(
                currentBalance
            );
    }

    if (totalProfit) {

        totalProfit.textContent =
            money(
                profit
            );
    }

    if (activeRisk) {

        activeRisk.textContent =
            money(
                risk
            );
    }

    if (activeRR) {

        activeRR.textContent =
            rr.toFixed(2);
    }

    if (activeObjective) {

        activeObjective.textContent =
            money(
                objective
            );
    }
}


/* ==========================================================
   ARCHIVES
========================================================== */

function renderArchives() {

    const container =
        document.getElementById(
            "archivesList"
        );

    if (!container) {
        return;
    }

    if (
        !archives.length
    ) {

        container.innerHTML = `
            <div class="empty-chart-message">
                Aucun capital archivé.
            </div>
        `;

        return;
    }

    const sorted =
        [...archives].sort(
            (
                a,
                b
            ) =>
                String(
                    b.archivedAt ||
                    b.createdAt ||
                    ""
                ).localeCompare(
                    String(
                        a.archivedAt ||
                        a.createdAt ||
                        ""
                    )
                )
        );

    container.innerHTML =
        sorted
            .map(
                (
                    archive,
                    index
                ) => {

                    const initial =
                        parseNumber(
                            archive.initialCapital
                        );

                    const archiveTrades =
                        Array.isArray(
                            archive.trades
                        )
                            ? archive.trades
                            : getCapitalTrades(
                                archive.id
                            );

                    const profit =
                        archiveTrades.reduce(
                            (
                                sum,
                                trade
                            ) =>
                                sum +
                                parseNumber(
                                    trade.pnl
                                ),
                            0
                        );

                    const finalBalance =
                        initial +
                        profit;

                    const rr =
                        getCapitalRR(
                            archive
                        );

                    const risk =
                        getCapitalRisk(
                            archive
                        );

                    return `
                        <div
                            class="archive-item"
                            data-archive-id="${escapeHtml(
                                archive.id
                            )}"
                        >

                            <div>

                                <strong>
                                    ${escapeHtml(
                                        archive.name ||
                                        `Capital ${
                                            index + 1
                                        }`
                                    )}
                                </strong>

                                <div>
                                    🟢 Créé le :
                                    ${escapeHtml(
                                        formatStoredDateTime(
                                            archive.createdAt
                                        )
                                    )}
                                </div>

                                <div>
                                    🔴 Archivé le :
                                    ${escapeHtml(
                                        formatStoredDateTime(
                                            archive.archivedAt
                                        )
                                    )}
                                </div>

                                <div>
                                    Capital initial :
                                    ${money(
                                        initial
                                    )}
                                </div>

                                <div>
                                    Capital final :
                                    ${money(
                                        finalBalance
                                    )}
                                </div>

                                <div>
                                    Profit :
                                    ${money(
                                        profit
                                    )}
                                </div>

                                <div>
                                    Risque :
                                    ${money(
                                        risk
                                    )}
                                    &nbsp; | &nbsp;
                                    RR :
                                    ${rr.toFixed(
                                        2
                                    )}
                                </div>

                                <div>
                                    Trades :
                                    ${archiveTrades.length}
                                </div>

                            </div>


                            <div
                                style="
                                    display: flex;
                                    gap: 8px;
                                    flex-wrap: wrap;
                                "
                            >

                                <button
                                    type="button"
                                    class="secondary-btn archive-edit-btn"
                                    data-archive-id="${escapeHtml(
                                        archive.id
                                    )}"
                                >
                                    ✏️ Modifier
                                </button>


                                <button
                                    type="button"
                                    class="secondary-btn archive-chart-btn"
                                    data-archive-id="${escapeHtml(
                                        archive.id
                                    )}"
                                >
                                    📈 Voir graphique
                                </button>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");


    container
        .querySelectorAll(
            ".archive-edit-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openCapitalModal(
                            false,
                            button.dataset
                                .archiveId
                        );
                    }
                );
            }
        );


    container
        .querySelectorAll(
            ".archive-chart-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openArchiveChart(
                            button.dataset
                                .archiveId
                        );
                    }
                );
            }
        );
}


/* ==========================================================
   PÉRIODES
========================================================== */

function getDateOnly(
    dateValue
) {

    if (!dateValue) {
        return null;
    }

    const date =
        new Date(
            `${dateValue}T00:00:00`
        );

    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;
}


function getStartOfWeek(
    date
) {

    const result =
        new Date(date);

    const day =
        result.getDay();

    const diff =
        day === 0
            ? -6
            : 1 - day;

    result.setDate(
        result.getDate() +
        diff
    );

    result.setHours(
        0,
        0,
        0,
        0
    );

    return result;
}


function isTradeInPeriod(
    trade,
    period
) {

    const tradeDate =
        getDateOnly(
            trade.date
        );

    if (!tradeDate) {
        return false;
    }

    const now =
        new Date();

    now.setHours(
        0,
        0,
        0,
        0
    );

    if (
        period === "all"
    ) {

        return true;
    }

    if (
        period === "today"
    ) {

        return (
            tradeDate.getTime() ===
            now.getTime()
        );
    }

    if (
        period === "week"
    ) {

        const start =
            getStartOfWeek(
                now
            );

        const end =
            new Date(
                start
            );

        end.setDate(
            end.getDate() +
            7
        );

        return (
            tradeDate >= start &&
            tradeDate < end
        );
    }

    if (
        period === "month"
    ) {

        return (
            tradeDate.getFullYear() ===
                now.getFullYear() &&
            tradeDate.getMonth() ===
                now.getMonth()
        );
    }

    if (
        period === "year"
    ) {

        return (
            tradeDate.getFullYear() ===
            now.getFullYear()
        );
    }

    return false;
}


function getFilteredTrades() {

    if (!activeCapital) {
        return [];
    }

    return getActiveCapitalTrades()
        .filter(
            trade =>
                isTradeInPeriod(
                    trade,
                    currentPeriod
                )
        );
}


/* ==========================================================
   STATISTIQUES AVANCÉES
========================================================== */

function sortTradesChronologically(
    list
) {

    return [...list].sort(
        (
            a,
            b
        ) => {

            const dateA =
                String(
                    a.date || ""
                );

            const dateB =
                String(
                    b.date || ""
                );

            if (
                dateA !==
                dateB
            ) {

                return (
                    dateA.localeCompare(
                        dateB
                    )
                );
            }

            const timeA =
                a.createdAt
                    ? new Date(
                        a.createdAt
                    ).getTime()
                    : 0;

            const timeB =
                b.createdAt
                    ? new Date(
                        b.createdAt
                    ).getTime()
                    : 0;

            return (
                timeA -
                timeB
            );
        }
    );
}


function calculateProfitFactor(
    list
) {

    let grossProfit = 0;
    let grossLoss = 0;

    list.forEach(
        trade => {

            const pnl =
                parseNumber(
                    trade.pnl
                );

            if (
                pnl > 0
            ) {

                grossProfit += pnl;

            } else if (
                pnl < 0
            ) {

                grossLoss +=
                    Math.abs(pnl);
            }
        }
    );

    if (
        grossLoss <= 0
    ) {

        return grossProfit > 0
            ? Infinity
            : 0;
    }

    return (
        grossProfit /
        grossLoss
    );
}


function calculateAverageTrade(
    list
) {

    if (!list.length) {
        return 0;
    }

    const total =
        list.reduce(
            (
                sum,
                trade
            ) =>
                sum +
                parseNumber(
                    trade.pnl
                ),
            0
        );

    return (
        total /
        list.length
    );
}


function calculateAverageWin(
    list
) {

    const winners =
        list
            .map(
                trade =>
                    parseNumber(
                        trade.pnl
                    )
            )
            .filter(
                pnl =>
                    pnl > 0
            );

    if (!winners.length) {
        return 0;
    }

    return (
        winners.reduce(
            (
                sum,
                pnl
            ) =>
                sum + pnl,
            0
        ) /
        winners.length
    );
}


function calculateAverageLoss(
    list
) {

    const losses =
        list
            .map(
                trade =>
                    parseNumber(
                        trade.pnl
                    )
            )
            .filter(
                pnl =>
                    pnl < 0
            );

    if (!losses.length) {
        return 0;
    }

    return (
        losses.reduce(
            (
                sum,
                pnl
            ) =>
                sum + pnl,
            0
        ) /
        losses.length
    );
}


function calculateBestTrade(
    list
) {

    if (!list.length) {
        return 0;
    }

    return Math.max(
        ...list.map(
            trade =>
                parseNumber(
                    trade.pnl
                )
        )
    );
}


function calculateWorstTrade(
    list
) {

    if (!list.length) {
        return 0;
    }

    return Math.min(
        ...list.map(
            trade =>
                parseNumber(
                    trade.pnl
                )
        )
    );
}


function calculateMaxWinStreak(
    list
) {

    const sorted =
        sortTradesChronologically(
            list
        );

    let current = 0;
    let maximum = 0;

    sorted.forEach(
        trade => {

            if (
                String(
                    trade.result
                ).toUpperCase() ===
                "TP"
            ) {

                current++;

                if (
                    current >
                    maximum
                ) {

                    maximum =
                        current;
                }

            } else {

                current = 0;
            }
        }
    );

    return maximum;
}


function calculateMaxLossStreak(
    list
) {

    const sorted =
        sortTradesChronologically(
            list
        );

    let current = 0;
    let maximum = 0;

    sorted.forEach(
        trade => {

            if (
                String(
                    trade.result
                ).toUpperCase() ===
                "SL"
            ) {

                current++;

                if (
                    current >
                    maximum
                ) {

                    maximum =
                        current;
                }

            } else {

                current = 0;
            }
        }
    );

    return maximum;
}


function calculateMaxDrawdown(
    list
) {

    if (
        !list.length ||
        !activeCapital
    ) {

        return 0;
    }

    const sorted =
        sortTradesChronologically(
            list
        );

    /*
     * Pour une période donnée, on part du capital
     * initial du capital actif.
     *
     * Cela donne une mesure simple et cohérente
     * de la baisse du capital à l'intérieur
     * de la période sélectionnée.
     */
    let balance =
        parseNumber(
            activeCapital.initialCapital
        );

    let peak =
        balance;

    let maxDrawdown =
        0;

    sorted.forEach(
        trade => {

            balance +=
                parseNumber(
                    trade.pnl
                );

            if (
                balance >
                peak
            ) {

                peak =
                    balance;
            }

            const drawdown =
                peak -
                balance;

            if (
                drawdown >
                maxDrawdown
            ) {

                maxDrawdown =
                    drawdown;
            }
        }
    );

    return maxDrawdown;
}


function formatProfitFactor(
    value
) {

    if (
        value === Infinity
    ) {

        return "∞";
    }

    return Number.isFinite(
        value
    )
        ? value.toFixed(2)
        : "0.00";
}


/* ==========================================================
   DERNIER TRADE
========================================================== */

function getLastKnownTrade() {

    const activeTrades =
        getActiveCapitalTrades();

    if (
        !activeTrades.length
    ) {

        return null;
    }

    return [...activeTrades].sort(
        (
            a,
            b
        ) => {

            const aTime =
                a.createdAt
                    ? new Date(
                        a.createdAt
                    ).getTime()
                    : 0;

            const bTime =
                b.createdAt
                    ? new Date(
                        b.createdAt
                    ).getTime()
                    : 0;

            if (
                aTime !==
                bTime
            ) {

                return (
                    bTime -
                    aTime
                );
            }

            return String(
                b.date ||
                ""
            ).localeCompare(
                String(
                    a.date ||
                    ""
                )
            );
        }
    )[0];
}


/* ==========================================================
   PERFORMANCE
========================================================== */

function calculateAverageRR(
    list
) {

    if (
        !list.length
    ) {

        return 0;
    }

    const total =
        list.reduce(
            (
                sum,
                trade
            ) => {

                const rr =
                    parseNumber(
                        trade.rrTarget ??
                        trade.rr ??
                        getCapitalRR()
                    );

                return sum + rr;
            },
            0
        );

    return (
        total /
        list.length
    );
}


function calculateWinrate(
    list
) {

    if (
        !list.length
    ) {

        return 0;
    }

    const winners =
        list.filter(
            trade =>
                String(
                    trade.result
                ).toUpperCase() ===
                "TP"
        ).length;

    return (
        winners /
        list.length *
        100
    );
}


function calculateBestSetup(
    list
) {

    if (!list.length) {
        return "-";
    }

    const groups = {};

    list.forEach(
        trade => {

            const setup =
                trade.setup ||
                "Sans setup";

            if (
                !groups[setup]
            ) {

                groups[setup] = {
                    trades: 0,
                    profit: 0
                };
            }

            groups[setup].trades++;

            groups[setup].profit +=
                parseNumber(
                    trade.pnl
                );
        }
    );

    const sorted =
        Object.entries(
            groups
        ).sort(
            (
                a,
                b
            ) => {

                if (
                    b[1].profit !==
                    a[1].profit
                ) {

                    return (
                        b[1].profit -
                        a[1].profit
                    );
                }

                return (
                    b[1].trades -
                    a[1].trades
                );
            }
        );

    return (
        sorted[0]?.[0] ||
        "-"
    );
}


function renderPerformance() {

    const list =
        getFilteredTrades();

    const totalProfit =
        list.reduce(
            (
                sum,
                trade
            ) =>
                sum +
                parseNumber(
                    trade.pnl
                ),
            0
        );

    const baseBalance =
        activeCapital
            ? parseNumber(
                activeCapital.initialCapital
            )
            : 0;

    const currentBalance =
        activeCapital
            ? getCapitalBalance(
                activeCapital
            )
            : 0;

    const balanceElement =
        document.getElementById(
            "statBalance"
        );

    const profitElement =
        document.getElementById(
            "statProfit"
        );

    const winrateElement =
        document.getElementById(
            "statWinrate"
        );

    const averageRRElement =
        document.getElementById(
            "statAverageRR"
        );

    const tradesElement =
        document.getElementById(
            "statTrades"
        );

    const bestSetupElement =
        document.getElementById(
            "statBestSetup"
        );

    const lastTradeElement =
        document.getElementById(
            "statLastTrade"
        );

    const profitFactorElement =
        document.getElementById(
            "statProfitFactor"
        );

    const averageTradeElement =
        document.getElementById(
            "statAverageTrade"
        );

    const averageWinElement =
        document.getElementById(
            "statAverageWin"
        );

    const averageLossElement =
        document.getElementById(
            "statAverageLoss"
        );

    const bestTradeElement =
        document.getElementById(
            "statBestTrade"
        );

    const worstTradeElement =
        document.getElementById(
            "statWorstTrade"
        );

    const maxWinStreakElement =
        document.getElementById(
            "statMaxWinStreak"
        );

    const maxLossStreakElement =
        document.getElementById(
            "statMaxLossStreak"
        );

    const maxDrawdownElement =
        document.getElementById(
            "statMaxDrawdown"
        );


    if (
        balanceElement
    ) {

        balanceElement.textContent =
            money(
                currentPeriod ===
                    "all"
                    ? currentBalance
                    : baseBalance +
                        totalProfit
            );
    }


    if (
        profitElement
    ) {

        profitElement.textContent =
            money(
                totalProfit
            );
    }


    if (
        winrateElement
    ) {

        winrateElement.textContent =
            `${formatNumber(
                calculateWinrate(
                    list
                ),
                2
            )}%`;
    }


    if (
        averageRRElement
    ) {

        averageRRElement.textContent =
            calculateAverageRR(
                list
            ).toFixed(2);
    }


    if (
        tradesElement
    ) {

        tradesElement.textContent =
            String(
                list.length
            );
    }


    if (
        bestSetupElement
    ) {

        bestSetupElement.textContent =
            calculateBestSetup(
                list
            );
    }


    if (
        lastTradeElement
    ) {

        const lastTrade =
            getLastKnownTrade();

        if (
            lastTrade &&
            lastTrade.createdAt
        ) {

            lastTradeElement.textContent =
                formatStoredDateTime(
                    lastTrade.createdAt
                );

        } else {

            lastTradeElement.textContent =
                "-";
        }
    }


    if (
        profitFactorElement
    ) {

        profitFactorElement.textContent =
            formatProfitFactor(
                calculateProfitFactor(
                    list
                )
            );
    }


    if (
        averageTradeElement
    ) {

        averageTradeElement.textContent =
            money(
                calculateAverageTrade(
                    list
                )
            );
    }


    if (
        averageWinElement
    ) {

        averageWinElement.textContent =
            money(
                calculateAverageWin(
                    list
                )
            );
    }


    if (
        averageLossElement
    ) {

        averageLossElement.textContent =
            money(
                calculateAverageLoss(
                    list
                )
            );
    }


    if (
        bestTradeElement
    ) {

        bestTradeElement.textContent =
            money(
                calculateBestTrade(
                    list
                )
            );
    }


    if (
        worstTradeElement
    ) {

        worstTradeElement.textContent =
            money(
                calculateWorstTrade(
                    list
                )
            );
    }


    if (
        maxWinStreakElement
    ) {

        maxWinStreakElement.textContent =
            String(
                calculateMaxWinStreak(
                    list
                )
            );
    }


    if (
        maxLossStreakElement
    ) {

        maxLossStreakElement.textContent =
            String(
                calculateMaxLossStreak(
                    list
                )
            );
    }


    if (
        maxDrawdownElement
    ) {

        maxDrawdownElement.textContent =
            money(
                calculateMaxDrawdown(
                    list
                )
            );
    }
}


/* ==========================================================
   TABLE SETUPS
========================================================== */

function renderSetupTable() {

    const body =
        document.getElementById(
            "setupTableBody"
        );

    if (!body) {
        return;
    }

    const list =
        getFilteredTrades();

    if (
        !list.length
    ) {

        body.innerHTML = `
            <tr>
                <td colspan="5">
                    Aucun trade pour cette période.
                </td>
            </tr>
        `;

        return;
    }

    const setups = {};

    list.forEach(
        trade => {

            const setup =
                trade.setup ||
                "Sans setup";

            if (
                !setups[setup]
            ) {

                setups[setup] = {
                    trades: 0,
                    wins: 0,
                    profit: 0
                };
            }

            setups[setup].trades++;

            if (
                String(
                    trade.result
                ).toUpperCase() ===
                "TP"
            ) {

                setups[setup].wins++;
            }

            setups[setup].profit +=
                parseNumber(
                    trade.pnl
                );
        }
    );

    body.innerHTML =
        Object.entries(
            setups
        )
        .sort(
            (
                a,
                b
            ) =>
                b[1].profit -
                a[1].profit
        )
        .map(
            (
                [
                    setup,
                    stats
                ]
            ) => {

                const winrate =
                    stats.trades >
                    0
                        ? (
                            stats.wins /
                            stats.trades *
                            100
                        )
                        : 0;

                return `
                    <tr>

                        <td>
                            ${escapeHtml(
                                setup
                            )}
                        </td>

                        <td>
                            ${stats.trades}
                        </td>

                        <td>
                            ${stats.wins}
                        </td>

                        <td>
                            ${formatNumber(
                                winrate,
                                2
                            )}%
                        </td>

                        <td>
                            ${money(
                                stats.profit
                            )}
                        </td>

                    </tr>
                `;
            }
        )
        .join("");
}


/* ==========================================================
   HISTORIQUE
========================================================== */

function renderHistory() {

    const body =
        document.getElementById(
            "historyBody"
        );

    if (!body) {
        return;
    }

    const list =
        getActiveCapitalTrades()
            .sort(
                (
                    a,
                    b
                ) => {

                    const aDate =
                        String(
                            a.date ||
                            ""
                        );

                    const bDate =
                        String(
                            b.date ||
                            ""
                        );

                    if (
                        aDate !==
                        bDate
                    ) {

                        return (
                            bDate.localeCompare(
                                aDate
                            )
                        );
                    }

                    const aTime =
                        a.createdAt
                            ? new Date(
                                a.createdAt
                            ).getTime()
                            : 0;

                    const bTime =
                        b.createdAt
                            ? new Date(
                                b.createdAt
                            ).getTime()
                            : 0;

                    return (
                        bTime -
                        aTime
                    );
                }
            );

    if (!list.length) {

        body.innerHTML = `
            <tr>
                <td colspan="14">
                    Aucun trade enregistré.
                </td>
            </tr>
        `;

        return;
    }

    body.innerHTML =
        list
            .map(
                trade => {

                    const rr =
                        parseNumber(
                            trade.rrTarget ??
                            trade.rr ??
                            getCapitalRR()
                        );

                    const pnl =
                        parseNumber(
                            trade.pnl ??
                            trade.profit
                        );

                    const pnlClass =
                        pnl > 0
                            ? "profit-positive"
                            : pnl < 0
                                ? "profit-negative"
                                : "";

                    const resultClass =
                        trade.result ===
                            "TP"
                            ? "profit-positive"
                            : trade.result ===
                                "SL"
                                ? "profit-negative"
                                : "";

                    const recordedAt =
                        trade.createdAt
                            ? formatStoredDateTime(
                                trade.createdAt
                            )
                            : "-";

                    return `
                        <tr>

                            <td>
                                ${escapeHtml(
                                    trade.date ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    recordedAt
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    normalizeAsset(
                                        trade.asset
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    trade.direction ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    trade.lot,
                                    2
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    trade.entry,
                                    5
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    trade.sl,
                                    5
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    trade.tp,
                                    5
                                )}
                            </td>

                            <td>
                                ${rr.toFixed(
                                    2
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    trade.pips,
                                    2
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    trade.setup ||
                                    "-"
                                )}
                            </td>

                            <td class="${resultClass}">
                                ${escapeHtml(
                                    trade.result ||
                                    "-"
                                )}
                            </td>

                            <td class="${pnlClass}">
                                ${money(
                                    pnl
                                )}
                            </td>

                            <td>
                                <button
                                    type="button"
                                    class="danger-btn delete-trade-btn"
                                    data-trade-id="${escapeHtml(
                                        trade.id
                                    )}"
                                >
                                    Supprimer
                                </button>
                            </td>

                        </tr>
                    `;
                }
            )
            .join("");

    body
        .querySelectorAll(
            ".delete-trade-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteTrade(
                            button.dataset
                                .tradeId
                        );
                    }
                );
            }
        );
}


function deleteTrade(
    tradeId
) {

    const trade =
        trades.find(
            item =>
                item.id ===
                tradeId
        );

    if (!trade) {
        return;
    }

    const confirmed =
        confirm(
            "Supprimer ce trade de l'historique ?"
        );

    if (!confirmed) {
        return;
    }

    trades =
        trades.filter(
            item =>
                item.id !==
                tradeId
        );

    archives =
        archives.map(
            archive => {

                if (
                    !Array.isArray(
                        archive.trades
                    )
                ) {

                    return archive;
                }

                const updatedTrades =
                    archive.trades.filter(
                        item =>
                            item.id !==
                            tradeId
                    );

                const profit =
                    updatedTrades.reduce(
                        (
                            sum,
                            item
                        ) =>
                            sum +
                            parseNumber(
                                item.pnl
                            ),
                        0
                    );

                return {

                    ...archive,

                    trades:
                        updatedTrades,

                    totalProfit:
                        profit,

                    finalBalance:
                        parseNumber(
                            archive.initialCapital
                        ) +
                        profit
                };
            }
        );

    saveTrades();
    saveArchives();

    refreshAll();
}


function clearActiveCapitalTrades() {

    if (!activeCapital) {
        return;
    }

    const activeTrades =
        getActiveCapitalTrades();

    if (!activeTrades.length) {

        alert(
            "Aucun trade à effacer."
        );

        return;
    }

    const confirmed =
        confirm(
            "Attention : tous les trades du capital actif seront supprimés. Continuer ?"
        );

    if (!confirmed) {
        return;
    }

    const activeId =
        activeCapital.id;

    trades =
        trades.filter(
            trade =>
                trade.capitalId !==
                activeId
        );

    saveTrades();

    refreshAll();
}


/* ==========================================================
   AJOUT TRADE
========================================================== */

function addTrade(
    event
) {

    event.preventDefault();

    if (!activeCapital) {

        alert(
            "Créez d'abord un capital actif."
        );

        return;
    }

    const asset =
        normalizeAsset(
            document.getElementById(
                "asset"
            )?.value
        );

    const date =
        document.getElementById(
            "date"
        )?.value;

    const direction =
        document.getElementById(
            "direction"
        )?.value;

    const orderType =
        document.getElementById(
            "orderType"
        )?.value;

    const entry =
        parseNumber(
            document.getElementById(
                "entry"
            )?.value
        );

    const sl =
        parseNumber(
            document.getElementById(
                "sl"
            )?.value
        );

    const result =
        document.getElementById(
            "result"
        )?.value;

    const setup =
        document.getElementById(
            "setup"
        )?.value;

    const comment =
        document.getElementById(
            "comment"
        )?.value.trim();

    const referenceRisk =
        getCapitalRisk();

    const rrTarget =
        getCapitalRR();

    if (
        !getAssetSpec(asset)
    ) {

        alert(
            "Actif non reconnu."
        );

        return;
    }

    if (!date) {

        alert(
            "Veuillez sélectionner une date."
        );

        return;
    }

    if (
        entry <= 0 ||
        sl <= 0
    ) {

        alert(
            "Entry et SL doivent être supérieurs à 0."
        );

        return;
    }

    if (
        !isValidStop(
            direction,
            entry,
            sl
        )
    ) {

        alert(
            direction === "BUY"
                ? "Pour un BUY, le SL doit être inférieur à l'Entry."
                : "Pour un SELL, le SL doit être supérieur à l'Entry."
        );

        return;
    }

    if (
        rrTarget <
        MIN_RR
    ) {

        alert(
            "Le RR cible du capital doit être au minimum de 2.00."
        );

        return;
    }

    const lot =
        calculateAutomaticLot(
            asset,
            entry,
            sl,
            referenceRisk
        );

    if (
        lot <
        MIN_LOT
    ) {

        alert(
            "Le lot automatique est inférieur à 0.01. Réduisez la distance du SL ou augmentez le risque de référence."
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
        referenceRisk +
        0.000001
    ) {

        alert(
            "Le risque réel dépasse le risque de référence. Le trade n'a pas été enregistré."
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

    if (
        tp <= 0
    ) {

        alert(
            "Impossible de calculer le Take Profit."
        );

        return;
    }

    const realObjective =
        realRisk *
        rrTarget;

    const pnl =
        calculateAutomaticPnL(
            result,
            realRisk,
            rrTarget
        );

    if (
        pnl === null
    ) {

        alert(
            "Impossible de calculer le P/L automatique."
        );

        return;
    }

    const exit =
        result === "TP"
            ? tp
            : result === "SL"
                ? sl
                : entry;

    const pips =
        calculatePips(
            asset,
            direction,
            entry,
            exit
        );

    const createdAt =
        new Date()
            .toISOString();

    const trade = {

        id:
            generateId(),

        capitalId:
            activeCapital.id,

        asset,

        date,

        direction,

        orderType,

        lot,

        entry,

        sl,

        tp,

        rr:
            rrTarget,

        rrTarget,

        pips,

        result,

        setup,

        pnl,

        profit:
            pnl,

        riskTarget:
            referenceRisk,

        riskReference:
            referenceRisk,

        realRisk,

        realObjective,

        comment,

        createdAt
    };

    trades.push(
        trade
    );

    saveTrades();

    const form =
        document.getElementById(
            "tradeForm"
        );

    if (form) {
        form.reset();
    }

    const dateInput =
        document.getElementById(
            "date"
        );

    if (dateInput) {

        dateInput.value =
            getMadagascarDate();
    }

    const directionInput =
        document.getElementById(
            "direction"
        );

    if (directionInput) {

        directionInput.value =
            "BUY";
    }

    const resultInput =
        document.getElementById(
            "result"
        );

    if (resultInput) {

        resultInput.value =
            "TP";
    }

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

    if (lotInput) {
        lotInput.value = "";
    }

    if (tpInput) {
        tpInput.value = "";
    }

    if (rrInput) {
        rrInput.value =
            "0.00";
    }

    if (profitInput) {
        profitInput.value =
            "";
    }

    const hiddenRisk =
        document.getElementById(
            "tradeRealRisk"
        );

    if (hiddenRisk) {
        hiddenRisk.value =
            "";
    }

    refreshAll();
}


/* ==========================================================
   GRAPHIQUE CAPITAL
========================================================== */

function getCapitalChartData() {

    if (!activeCapital) {
        return [];
    }

    const capitalTrades =
        getActiveCapitalTrades()
            .slice()
            .sort(
                (
                    a,
                    b
                ) => {

                    const da =
                        new Date(
                            `${a.date}T00:00:00`
                        ).getTime();

                    const db =
                        new Date(
                            `${b.date}T00:00:00`
                        ).getTime();

                    if (
                        da !== db
                    ) {

                        return da - db;
                    }

                    const aTime =
                        a.createdAt
                            ? new Date(
                                a.createdAt
                            ).getTime()
                            : 0;

                    const bTime =
                        b.createdAt
                            ? new Date(
                                b.createdAt
                            ).getTime()
                            : 0;

                    return (
                        aTime -
                        bTime
                    );
                }
            );

    let balance =
        parseNumber(
            activeCapital.initialCapital
        );

    const points = [
        {
            label:
                "Départ",
            balance
        }
    ];

    capitalTrades.forEach(
        trade => {

            balance +=
                parseNumber(
                    trade.pnl
                );

            points.push({
                label:
                    trade.date ||
                    "",
                balance
            });
        }
    );

    return points;
}


function drawCapitalChart(
    canvas,
    points
) {

    if (!canvas) {
        return;
    }

    const ctx =
        canvas.getContext(
            "2d"
        );

    if (!ctx) {
        return;
    }

    const width =
        canvas.clientWidth ||
        canvas.width ||
        800;

    const height =
        canvas.clientHeight ||
        canvas.height ||
        350;

    const dpr =
        window.devicePixelRatio ||
        1;

    canvas.width =
        width *
        dpr;

    canvas.height =
        height *
        dpr;

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    ctx.clearRect(
        0,
        0,
        width,
        height
    );

    if (
        !points.length
    ) {

        return;
    }

    const padding =
        45;

    const plotWidth =
        width -
        padding * 2;

    const plotHeight =
        height -
        padding * 2;

    const values =
        points.map(
            point =>
                point.balance
        );

    let min =
        Math.min(
            ...values
        );

    let max =
        Math.max(
            ...values
        );

    if (
        min === max
    ) {

        min -= 1;
        max += 1;
    }

    const range =
        max -
        min;

    const xStep =
        points.length > 1
            ? plotWidth /
                (
                    points.length -
                    1
                )
            : 0;

    ctx.beginPath();

    for (
        let i = 0;
        i <= 4;
        i++
    ) {

        const y =
            padding +
            plotHeight *
            i /
            4;

        ctx.moveTo(
            padding,
            y
        );

        ctx.lineTo(
            width -
            padding,
            y
        );
    }

    ctx.strokeStyle =
        "rgba(128,128,128,0.25)";

    ctx.lineWidth =
        1;

    ctx.stroke();

    ctx.beginPath();

    points.forEach(
        (
            point,
            index
        ) => {

            const x =
                padding +
                xStep *
                index;

            const normalized =
                (
                    point.balance -
                    min
                ) /
                range;

            const y =
                padding +
                plotHeight *
                (
                    1 -
                    normalized
                );

            if (
                index === 0
            ) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );
            }
        }
    );

    ctx.strokeStyle =
        getComputedStyle(
            document.body
        )
            .getPropertyValue(
                "--accent"
            )
            .trim() ||
        "#4da3ff";

    ctx.lineWidth =
        3;

    ctx.stroke();

    points.forEach(
        (
            point,
            index
        ) => {

            const x =
                padding +
                xStep *
                index;

            const normalized =
                (
                    point.balance -
                    min
                ) /
                range;

            const y =
                padding +
                plotHeight *
                (
                    1 -
                    normalized
                );

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                4,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                getComputedStyle(
                    document.body
                )
                    .getPropertyValue(
                        "--accent"
                    )
                    .trim() ||
                "#4da3ff";

            ctx.fill();
        }
    );

    ctx.fillStyle =
        getComputedStyle(
            document.body
        )
            .getPropertyValue(
                "--text"
            )
            .trim() ||
        "#888";

    ctx.font =
        "12px sans-serif";

    ctx.fillText(
        money(max),
        5,
        padding
    );

    ctx.fillText(
        money(min),
        5,
        height -
        padding
    );
}


function renderCapitalChart() {

    const canvas =
        document.getElementById(
            "capitalChart"
        );

    const emptyMessage =
        document.getElementById(
            "emptyChartMessage"
        );

    const points =
        getCapitalChartData();

    if (!canvas) {
        return;
    }

    const hasTrades =
        points.length > 1;

    if (
        emptyMessage
    ) {

        emptyMessage.style.display =
            hasTrades
                ? "none"
                : "block";
    }

    drawCapitalChart(
        canvas,
        hasTrades
            ? points
            : [
                {
                    label: "",
                    balance:
                        activeCapital
                            ? parseNumber(
                                activeCapital.initialCapital
                            )
                            : 0
                }
            ]
    );
}


/* ==========================================================
   GRAPHIQUE ARCHIVE
========================================================== */

function openArchiveChart(
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

    const modal =
        document.getElementById(
            "archiveChartModal"
        );

    if (!modal) {
        return;
    }

    const title =
        document.getElementById(
            "archiveChartTitle"
        );

    const subtitle =
        document.getElementById(
            "archiveChartSubtitle"
        );

    const initial =
        document.getElementById(
            "archiveChartInitial"
        );

    const final =
        document.getElementById(
            "archiveChartFinal"
        );

    const profit =
        document.getElementById(
            "archiveChartProfit"
        );

    const initialCapital =
        parseNumber(
            archive.initialCapital
        );

    const archiveTrades =
        Array.isArray(
            archive.trades
        )
            ? [
                ...archive.trades
            ]
            : [];

    const totalProfit =
        archiveTrades.reduce(
            (
                sum,
                trade
            ) =>
                sum +
                parseNumber(
                    trade.pnl
                ),
            0
        );

    const finalBalance =
        initialCapital +
        totalProfit;

    if (title) {

        title.textContent =
            archive.name ||
            "Capital archivé";
    }

    if (subtitle) {

        subtitle.textContent =
            `Créé le ${
                formatStoredDateTime(
                    archive.createdAt
                )
            } | Archivé le ${
                formatStoredDateTime(
                    archive.archivedAt
                )
            }`;
    }

    if (initial) {

        initial.textContent =
            money(
                initialCapital
            );
    }

    if (final) {

        final.textContent =
            money(
                finalBalance
            );
    }

    if (profit) {

        profit.textContent =
            money(
                totalProfit
            );
    }

    const points = [
        {
            label:
                "Départ",
            balance:
                initialCapital
        }
    ];

    let balance =
        initialCapital;

    archiveTrades.sort(
        (
            a,
            b
        ) => {

            const dateA =
                String(
                    a.date ||
                    ""
                );

            const dateB =
                String(
                    b.date ||
                    ""
                );

            if (
                dateA !==
                dateB
            ) {

                return (
                    dateA.localeCompare(
                        dateB
                    )
                );
            }

            const aTime =
                a.createdAt
                    ? new Date(
                        a.createdAt
                    ).getTime()
                    : 0;

            const bTime =
                b.createdAt
                    ? new Date(
                        b.createdAt
                    ).getTime()
                    : 0;

            return (
                aTime -
                bTime
            );
        }
    );

    archiveTrades.forEach(
        trade => {

            balance +=
                parseNumber(
                    trade.pnl
                );

            points.push({
                label:
                    trade.date ||
                    "",
                balance
            });
        }
    );

    const canvas =
        document.getElementById(
            "archiveChart"
        );

    drawCapitalChart(
        canvas,
        points
    );

    modal.classList.add(
        "show"
    );
}


function closeArchiveChart() {

    const modal =
        document.getElementById(
            "archiveChartModal"
        );

    if (modal) {

        modal.classList.remove(
            "show"
        );
    }
}


/* ==========================================================
   THÈME
========================================================== */

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

    const isLight =
        document.body.classList.contains(
            "light-theme"
        );

    if (isLight) {

        document.body.classList.remove(
            "light-theme"
        );

        localStorage.setItem(
            THEME_KEY,
            "dark"
        );

    } else {

        document.body.classList.add(
            "light-theme"
        );

        localStorage.setItem(
            THEME_KEY,
            "light"
        );
    }

    updateThemeButton();

    renderCapitalChart();
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


/* ==========================================================
   ÉVÉNEMENTS
========================================================== */

function setupEvents() {

    const tradeForm =
        document.getElementById(
            "tradeForm"
        );

    if (tradeForm) {

        tradeForm.addEventListener(
            "submit",
            addTrade
        );
    }


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


    const riskInput =
        document.getElementById(
            "capitalRiskInput"
        );

    const rrInput =
        document.getElementById(
            "capitalRRInput"
        );

    if (riskInput) {

        riskInput.addEventListener(
            "input",
            updateCapitalModalPreview
        );
    }

    if (rrInput) {

        rrInput.addEventListener(
            "input",
            updateCapitalModalPreview
        );
    }


    const newCapitalBtn =
        document.getElementById(
            "newCapitalBtn"
        );

    if (newCapitalBtn) {

        newCapitalBtn.addEventListener(
            "click",
            () =>
                openCapitalModal(
                    false
                )
        );
    }


    const changeCapitalBtn =
        document.getElementById(
            "changeCapitalBtn"
        );

    if (changeCapitalBtn) {

        changeCapitalBtn.addEventListener(
            "click",
            () => {

                if (!activeCapital) {

                    openCapitalModal(
                        false
                    );

                    return;
                }

                openCapitalModal(
                    true
                );
            }
        );
    }


    const archiveCapitalBtn =
        document.getElementById(
            "archiveCapitalBtn"
        );

    if (archiveCapitalBtn) {

        archiveCapitalBtn.addEventListener(
            "click",
            () =>
                archiveCurrentCapital(
                    true,
                    true
                )
        );
    }


    const saveCapitalBtn =
        document.getElementById(
            "saveCapitalBtn"
        );

    if (saveCapitalBtn) {

        saveCapitalBtn.addEventListener(
            "click",
            () => {

                if (
                    editingArchiveId
                ) {

                    saveArchiveModification();

                } else if (
                    editingExistingCapital
                ) {

                    saveCapitalModification();

                } else {

                    createNewCapital(
                        true
                    );
                }
            }
        );
    }


    const cancel1 =
        document.getElementById(
            "cancelCapitalBtn"
        );

    const cancel2 =
        document.getElementById(
            "cancelCapitalBtn2"
        );

    if (cancel1) {

        cancel1.addEventListener(
            "click",
            closeCapitalModal
        );
    }

    if (cancel2) {

        cancel2.addEventListener(
            "click",
            closeCapitalModal
        );
    }


    const clearBtn =
        document.getElementById(
            "clearBtn"
        );

    if (clearBtn) {

        clearBtn.addEventListener(
            "click",
            clearActiveCapitalTrades
        );
    }


    const themeToggle =
        document.getElementById(
            "themeToggle"
        );

    if (themeToggle) {

        themeToggle.addEventListener(
            "click",
            toggleTheme
        );
    }


    const periodButtons =
        document.querySelectorAll(
            ".period-btn"
        );

    periodButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    periodButtons.forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );

                    button.classList.add(
                        "active"
                    );

                    currentPeriod =
                        button.dataset.period ||
                        "today";

                    refreshPerformance();

                    renderSetupTable();
                }
            );
        }
    );


    const archiveChartClose =
        document.getElementById(
            "closeArchiveChartBtn"
        );

    if (archiveChartClose) {

        archiveChartClose.addEventListener(
            "click",
            closeArchiveChart
        );
    }


    const capitalModal =
        document.getElementById(
            "capitalModal"
        );

    if (capitalModal) {

        capitalModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    capitalModal
                ) {

                    closeCapitalModal();
                }
            }
        );
    }


    const archiveChartModal =
        document.getElementById(
            "archiveChartModal"
        );

    if (archiveChartModal) {

        archiveChartModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    archiveChartModal
                ) {

                    closeArchiveChart();
                }
            }
        );
    }


    window.addEventListener(
        "resize",
        () => {

            renderCapitalChart();
        }
    );
}


/* ==========================================================
   REFRESH
========================================================== */

function refreshPerformance() {

    renderPerformance();

    renderSetupTable();
}


function refreshAll() {

    renderActiveCapital();

    renderHistory();

    renderArchives();

    refreshPerformance();

    renderCapitalChart();

    updateAutomaticTradeValues();
}


/* ==========================================================
   INITIALISATION
========================================================== */

function init() {

    loadData();

    loadTheme();

    setupEvents();

    const dateInput =
        document.getElementById(
            "date"
        );

    if (
        dateInput &&
        !dateInput.value
    ) {

        dateInput.value =
            getMadagascarDate();
    }

    if (!activeCapital) {

        openCapitalModal(
            false
        );
    }

    refreshAll();
}


document.addEventListener(
    "DOMContentLoaded",
    init
);
