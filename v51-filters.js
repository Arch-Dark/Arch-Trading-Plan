"use strict";

/*
============================================================
V5.2 — ANALYSE FILTRÉE + GRAPHIQUE
Trading Dashboard
============================================================

Filtres :
- Période
- Actif
- Setup

Statistiques :
- Trades
- Gagnants
- Perdants
- BE
- Winrate
- Profit
- RR moyen

Graphique :
- évolution du résultat filtré
- respecte Période + Actif + Setup
- départ à 0
- chaque point correspond à un trade
============================================================
*/

(function () {


    /* ========================================================
       LISTES
    ======================================================== */

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


    /* ========================================================
       ETAT
    ======================================================== */

    let selectedPeriod = "today";

    let selectedAsset = "ALL";

    let selectedSetup = "ALL";

    let filterChartResizeHandler = null;



    /* ========================================================
       UTILITAIRES
    ======================================================== */

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

                localStorage.getItem(
                    "tradingTrades"
                )

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

            const capital = JSON.parse(

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



    /* ========================================================
       PERIODE
    ======================================================== */

    function filterBySelectedPeriod(
        tradeList
    ) {

        if (
            selectedPeriod === "all"
        ) {

            return [...tradeList];

        }


        return tradeList.filter(

            trade => {

                if (!trade.date) {

                    return false;

                }


                const tradeDate = new Date(

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


                /* =========================
                   AUJOURD'HUI
                ========================= */

                if (
                    selectedPeriod ===
                    "today"
                ) {

                    return (

                        tradeDate.getFullYear() ===
                            today.getFullYear()

                        &&

                        tradeDate.getMonth() ===
                            today.getMonth()

                        &&

                        tradeDate.getDate() ===
                            today.getDate()

                    );

                }


                /* =========================
                   SEMAINE
                ========================= */

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

                        today.getDate()
                        -
                        diffToMonday

                    );


                    const nextMonday =
                        new Date(monday);


                    nextMonday.setDate(

                        monday.getDate()
                        + 7

                    );


                    return (

                        tradeDate >=
                            monday

                        &&

                        tradeDate <
                            nextMonday

                    );

                }


                /* =========================
                   MOIS
                ========================= */

                if (
                    selectedPeriod ===
                    "month"
                ) {

                    return (

                        tradeDate.getFullYear() ===
                            today.getFullYear()

                        &&

                        tradeDate.getMonth() ===
                            today.getMonth()

                    );

                }


                /* =========================
                   ANNEE
                ========================= */

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



    /* ========================================================
       FILTRES COMBINES
    ======================================================== */

    function applyCombinedFilters(
        tradeList
    ) {

        let filtered =
            filterBySelectedPeriod(
                tradeList
            );


        if (
            selectedAsset !== "ALL"
        ) {

            filtered = filtered.filter(

                trade =>
                    trade.asset ===
                    selectedAsset

            );

        }


        if (
            selectedSetup !== "ALL"
        ) {

            filtered = filtered.filter(

                trade =>
                    trade.setup ===
                    selectedSetup

            );

        }


        /*
        Trier par date puis par enregistrement
        pour que le graphique soit logique.
        */

        filtered.sort(

            (a, b) => {

                const dateA =
                    new Date(
                        a.date ||
                        "1970-01-01"
                    ).getTime();


                const dateB =
                    new Date(
                        b.date ||
                        "1970-01-01"
                    ).getTime();


                if (
                    dateA !== dateB
                ) {

                    return dateA -
                        dateB;

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


                return createdA -
                    createdB;

            }

        );


        return filtered;

    }



    /* ========================================================
       STATISTIQUES
    ======================================================== */

    function calculateStats(
        tradeList
    ) {

        const tradesCount =
            tradeList.length;


        const winners =
            tradeList.filter(

                trade =>
                    trade.result ===
                    "TP"

            ).length;


        const losers =
            tradeList.filter(

                trade =>
                    trade.result ===
                    "SL"

            ).length;


        const breakevens =
            tradeList.filter(

                trade =>
                    trade.result ===
                    "BE"

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



    /* ========================================================
       CREATION INTERFACE
    ======================================================== */

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

                                        ${escapeHtml(
                                            period.label
                                        )}

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
                                                : escapeHtml(
                                                    asset
                                                )
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
                                                : escapeHtml(
                                                    setup
                                                )
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



            <!-- STATS -->

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



            <!-- GRAPHIQUE FILTRE -->

            <div
                style="
                    margin-top:24px;
                "
            >

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:12px;
                        margin-bottom:12px;
                        flex-wrap:wrap;
                    "
                >

                    <div>

                        <h3
                            style="
                                margin:0;
                            "
                        >
                            📈 Évolution de la performance filtrée
                        </h3>

                        <p
                            style="
                                margin:5px 0 0;
                                opacity:0.7;
                                font-size:0.9rem;
                            "
                        >
                            Résultat cumulé des trades sélectionnés
                        </p>

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
                        style="
                            position:absolute;
                            inset:0;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            text-align:center;
                            opacity:0.7;
                            padding:20px;
                        "
                    >
                        Aucun trade correspondant
                        aux filtres sélectionnés.
                    </div>

                </div>

            </div>


        `;


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
        ===============================
        EVENEMENT PERIODE
        ===============================
        */

        const periodSelect =
            document.getElementById(
                "v51PeriodFilter"
            );


        if (periodSelect) {

            periodSelect.value =
                selectedPeriod;


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
        ===============================
        EVENEMENT ACTIF
        ===============================
        */

        const assetSelect =
            document.getElementById(
                "v51AssetFilter"
            );


        if (assetSelect) {

            assetSelect.value =
                selectedAsset;


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
        ===============================
        EVENEMENT SETUP
        ===============================
        */

        const setupSelect =
            document.getElementById(
                "v51SetupFilter"
            );


        if (setupSelect) {

            setupSelect.value =
                selectedSetup;


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



    /* ========================================================
       RESUME
    ======================================================== */

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



    /* ========================================================
       GRAPHIQUE
    ======================================================== */

    function drawFilteredPerformanceChart(
        tradeList
    ) {

        const canvas =
            document.getElementById(
                "v51PerformanceChart"
            );


        const emptyMessage =
            document.getElementById(
                "v51EmptyChart"
            );


        if (
            !canvas
        ) {

            return;

        }


        /*
        Pas de trade
        */

        if (
            tradeList.length === 0
        ) {

            canvas.style.display =
                "none";


            if (emptyMessage) {

                emptyMessage.style.display =
                    "flex";

            }

            return;

        }


        canvas.style.display =
            "block";


        if (emptyMessage) {

            emptyMessage.style.display =
                "none";

        }


        const container =
            document.getElementById(
                "v51ChartContainer"
            );


        const rect =
            container
                ? container.getBoundingClientRect()

                : canvas.getBoundingClientRect();


        const dpr =
            window.devicePixelRatio || 1;


        const width =
            Math.max(
                rect.width,
                300
            );


        const height =
            320;


        canvas.width =
            width * dpr;


        canvas.height =
            height * dpr;


        const ctx =
            canvas.getContext(
                "2d"
            );


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



        /*
        ===============================
        DONNEES
        ===============================
        */

        let cumulative =
            0;


        const values = [

            0

        ];


        tradeList.forEach(

            trade => {

                cumulative +=
                    Number(
                        trade.pnl
                    ) || 0;

                values.push(
                    cumulative
                );

            }

        );



        /*
        ===============================
        ECHELLE
        ===============================
        */

        let minValue =
            Math.min(
                ...values
            );


        let maxValue =
            Math.max(
                ...values
            );


        if (
            minValue === maxValue
        ) {

            minValue -= 1;

            maxValue += 1;

        }


        const range =
            maxValue -
            minValue;


        const extra =
            Math.max(
                range * 0.15,
                1
            );


        minValue -=
            extra;


        maxValue +=
            extra;



        /*
        ===============================
        DIMENSIONS
        ===============================
        */

        const paddingLeft =
            65;


        const paddingRight =
            20;


        const paddingTop =
            25;


        const paddingBottom =
            45;


        const chartWidth =
            width -
            paddingLeft -
            paddingRight;


        const chartHeight =
            height -
            paddingTop -
            paddingBottom;



        /*
        ===============================
        GRILLE
        ===============================
        */

        const gridLines =
            5;


        ctx.font =
            "12px Arial";


        ctx.textAlign =
            "right";


        ctx.textBaseline =
            "middle";


        for (
            let i = 0;
            i <= gridLines;
            i++
        ) {

            const ratio =
                i /
                gridLines;


            const value =
                maxValue -
                (
                    ratio *
                    (
                        maxValue -
                        minValue
                    )
                );


            const y =
                paddingTop +
                (
                    ratio *
                    chartHeight
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
                "rgba(148,163,184,0.20)";


            ctx.lineWidth =
                1;


            ctx.stroke();


            ctx.fillStyle =
                "#64748b";


            ctx.fillText(

                money(value),

                paddingLeft -
                8,

                y

            );

        }



        /*
        ===============================
        AXES
        ===============================
        */

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


        ctx.lineWidth =
            1;


        ctx.stroke();



        /*
        ===============================
        POINTS
        ===============================
        */

        const points =
            [];


        values.forEach(

            (value, index) => {

                const ratioX =
                    index /
                    Math.max(
                        values.length -
                        1,
                        1
                    );


                const ratioY =
                    (
                        maxValue -
                        value
                    ) /
                    (
                        maxValue -
                        minValue
                    );


                const x =
                    paddingLeft +
                    (
                        ratioX *
                        chartWidth
                    );


                const y =
                    paddingTop +
                    (
                        ratioY *
                        chartHeight
                    );


                points.push({

                    x,

                    y,

                    value

                });

            }

        );



        /*
        ===============================
        ZONE ZERO
        ===============================
        */

        if (
            0 >= minValue &&
            0 <= maxValue
        ) {

            const zeroRatio =
                (
                    maxValue -
                    0
                ) /
                (
                    maxValue -
                    minValue
                );


            const zeroY =
                paddingTop +
                (
                    zeroRatio *
                    chartHeight
                );


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


            ctx.setLineDash([
                5,
                5
            ]);


            ctx.strokeStyle =
                "rgba(100,116,139,0.55)";


            ctx.stroke();


            ctx.setLineDash([]);

        }



        /*
        ===============================
        LIGNE
        ===============================
        */

        for (
            let i = 0;
            i <
            points.length - 1;
            i++
        ) {

            const current =
                points[i];


            const next =
                points[i + 1];


            const pnl =
                Number(
                    tradeList[i].pnl
                ) || 0;


            let lineColor =
                "#64748b";


            if (
                pnl > 0
            ) {

                lineColor =
                    "#16a34a";

            }


            if (
                pnl < 0
            ) {

                lineColor =
                    "#dc2626";

            }


            if (
                pnl === 0
            ) {

                lineColor =
                    "#64748b";

            }


            ctx.beginPath();


            ctx.moveTo(
                current.x,
                current.y
            );


            ctx.lineTo(
                next.x,
                next.y
            );


            ctx.strokeStyle =
                lineColor;


            ctx.lineWidth =
                3;


            ctx.lineCap =
                "round";


            ctx.stroke();

        }



        /*
        ===============================
        POINTS
        ===============================
        */

        points.forEach(

            (point, index) => {

                let pointColor =
                    "#64748b";


                if (
                    index > 0
                ) {

                    const pnl =
                        Number(
                            tradeList[
                                index - 1
                            ].pnl
                        ) || 0;


                    if (
                        pnl > 0
                    ) {

                        pointColor =
                            "#16a34a";

                    }


                    if (
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


                ctx.lineWidth =
                    2;


                ctx.stroke();

            }

        );



        /*
        ===============================
        LABELS X
        ===============================
        */

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

                            : "#" +
                              index,

                        point.x,

                        height -
                        paddingBottom +
                        10

                    );

                }

            }

        );

    }



    /* ========================================================
       TABLEAUX
    ======================================================== */

    function updateFilteredTables(
        filteredTrades
    ) {

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



    /* ========================================================
       TABLE SETUPS
    ======================================================== */

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
                    trade.setup ||
                    "-";


                if (
                    !grouped[setup]
                ) {

                    grouped[setup] = {

                        trades: 0,

                        winners: 0,

                        profit: 0

                    };

                }


                grouped[setup].trades++;


                if (
                    trade.result ===
                    "TP"
                ) {

                    grouped[
                        setup
                    ].winners++;

                }


                grouped[setup].profit +=
                    Number(
                        trade.pnl
                    ) || 0;

            }

        );


        tbody.innerHTML = "";


        const entries =
            Object.entries(
                grouped
            );


        if (
            entries.length ===
            0
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



    /* ========================================================
       TABLE ACTIFS
    ======================================================== */

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
                    trade.asset ||
                    "-";


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


                grouped[
                    asset
                ].trades++;


                if (
                    trade.result ===
                    "TP"
                ) {

                    grouped[
                        asset
                    ].winners++;

                }


                if (
                    trade.result ===
                    "SL"
                ) {

                    grouped[
                        asset
                    ].losers++;

                }


                if (
                    trade.result ===
                    "BE"
                ) {

                    grouped[
                        asset
                    ].be++;

                }


                grouped[
                    asset
                ].profit +=
                    Number(
                        trade.pnl
                    ) || 0;


                grouped[
                    asset
                ].pnl.push(

                    Number(
                        trade.pnl
                    ) || 0

                );


                const rr =
                    Number(
                        trade.rr
                    );


                if (

                    Number.isFinite(
                        rr
                    )

                    &&

                    rr > 0

                ) {

                    grouped[
                        asset
                    ].rr.push(
                        rr
                    );

                }

            }

        );


        tbody.innerHTML = "";


        const entries =
            Object.entries(
                grouped
            );


        if (
            entries.length ===
            0
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



    /* ========================================================
       REFRESH GLOBAL
    ======================================================== */

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



        /*
        ===============================
        STATS
        ===============================
        */

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


        if (
            tradesElement
        ) {

            tradesElement.textContent =
                stats.trades;

        }


        if (
            winnersElement
        ) {

            winnersElement.textContent =
                stats.winners;

        }


        if (
            losersElement
        ) {

            losersElement.textContent =
                stats.losers;

        }


        if (
            beElement
        ) {

            beElement.textContent =
                stats.breakevens;

        }


        if (
            winrateElement
        ) {

            winrateElement.textContent =
                stats.winrate.toFixed(
                    1
                ) +
                "%";

        }


        if (
            profitElement
        ) {

            profitElement.textContent =
                money(
                    stats.profit
                );

        }


        if (
            rrElement
        ) {

            rrElement.textContent =
                stats.averageRR.toFixed(
                    2
                );

        }



        /*
        ===============================
        RESUME
        ===============================
        */

        updateSummary();



        /*
        ===============================
        TABLEAUX
        ===============================
        */

        updateFilteredTables(
            filteredTrades
        );



        /*
        ===============================
        GRAPHIQUE
        ===============================
        */

        drawFilteredPerformanceChart(
            filteredTrades
        );

    }



    /* ========================================================
       REDIMENSIONNEMENT
    ======================================================== */

    function setupResizeHandler() {

        if (
            filterChartResizeHandler
        ) {

            window.removeEventListener(
                "resize",
                filterChartResizeHandler
            );

        }


        filterChartResizeHandler =
            function () {

                const trades =
                    applyCombinedFilters(
                        getCurrentCapitalTrades()
                    );


                drawFilteredPerformanceChart(
                    trades
                );

            };


        window.addEventListener(
            "resize",
            filterChartResizeHandler
        );

    }



    /* ========================================================
       INITIALISATION
    ======================================================== */

    function initialize() {

        createFilterInterface();

        setupResizeHandler();

        refreshV51();

    }



    /*
    Laisser app.js finir
    son chargement.
    */

    setTimeout(

        initialize,

        500

    );



    /*
    Synchronisation.
    */

    setInterval(

        function () {

            refreshV51();

        },

        1000

    );


})();
