/* =========================================================
   SESSION.JS
   Trading Dashboard
   ---------------------------------------------------------
   Gestion :
   - Session actuelle
   - Prochaine session
   - Sydney
   - Tokyo
   - Londres
   - New York
   - Heure locale
   - Heure Madagascar
   - Été / hiver
   - Week-end
   - Compte à rebours
   - Affichage compact
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIGURATION
       ===================================================== */

    const SESSIONS = [

        {
            id: "sydney",
            name: "Sydney",
            country: "🇦🇺",
            timezone: "Australia/Sydney",
            openHour: 8,
            closeHour: 17
        },

        {
            id: "tokyo",
            name: "Tokyo",
            country: "🇯🇵",
            timezone: "Asia/Tokyo",
            openHour: 9,
            closeHour: 18
        },

        {
            id: "london",
            name: "Londres",
            country: "🇬🇧",
            timezone: "Europe/London",
            openHour: 8,
            closeHour: 17
        },

        {
            id: "newyork",
            name: "New York",
            country: "🇺🇸",
            timezone: "America/New_York",
            openHour: 8,
            closeHour: 17
        }

    ];


    const MADAGASCAR_TIMEZONE =
        "Indian/Antananarivo";


    let timer = null;


    /* =====================================================
       STYLE
       ===================================================== */

    function injectSessionStyles() {

        if (
            document.getElementById(
                "tradingSessionStyles"
            )
        ) {
            return;
        }


        const style =
            document.createElement("style");


        style.id =
            "tradingSessionStyles";


        style.textContent = `

            /* =================================================
               PANNEAU PRINCIPAL
               ================================================= */

            #tradingSessionsPanel {

                display: flex;

                align-items: center;

                justify-content: center;

                gap: 0;

                width: auto;

                max-width: 690px;

                min-width: 500px;

                margin: 0 auto;

                padding: 9px 12px;

                box-sizing: border-box;

                border-radius: 15px;

                border: 1px solid rgba(
                    255,
                    255,
                    255,
                    0.12
                );

                background:
                    linear-gradient(
                        135deg,
                        rgba(255,255,255,0.085),
                        rgba(255,255,255,0.035)
                    );

                box-shadow:
                    0 8px 26px rgba(
                        0,
                        0,
                        0,
                        0.18
                    ),
                    inset 0 1px 0 rgba(
                        255,
                        255,
                        255,
                        0.06
                    );

                backdrop-filter: blur(14px);

                -webkit-backdrop-filter: blur(14px);

                flex: 0 1 auto !important;

                overflow: hidden;

            }


            /* =================================================
               ZONE INTERNE
               ================================================= */

            #tradingSessionsPanel
            .sessions-main {

                display: flex;

                align-items: center;

                justify-content: center;

                width: 100%;

                min-width: 0;

            }


            /* =================================================
               SESSION ACTUELLE
               ================================================= */

            #tradingSessionsPanel
            .session-current,

            #tradingSessionsPanel
            .session-next {

                display: flex;

                align-items: center;

                gap: 8px;

                min-width: 0;

                padding: 2px 14px;

                white-space: nowrap;

            }


            #tradingSessionsPanel
            .session-current {

                border-right:
                    1px solid rgba(
                        255,
                        255,
                        255,
                        0.11
                    );

            }


            /* =================================================
               TITRE
               ================================================= */

            #tradingSessionsPanel
            .session-label {

                font-size: 8px;

                font-weight: 800;

                letter-spacing: 1px;

                text-transform: uppercase;

                opacity: 0.50;

                white-space: nowrap;

            }


            /* =================================================
               NOM SESSION
               ================================================= */

            #tradingSessionsPanel
            .session-current-name,

            #tradingSessionsPanel
            .session-next-name {

                font-size: 12px;

                font-weight: 800;

                line-height: 1;

                white-space: nowrap;

            }


            /* =================================================
               STATUT
               ================================================= */

            #tradingSessionsPanel
            .session-status {

                font-size: 9px;

                font-weight: 700;

                white-space: nowrap;

                opacity: 0.72;

            }


            /* =================================================
               INFORMATIONS
               ================================================= */

            #tradingSessionsPanel
            .session-time-line {

                font-size: 9px;

                white-space: nowrap;

                opacity: 0.68;

            }


            /* =================================================
               COMPTE À REBOURS
               ================================================= */

            #tradingSessionsPanel
            .session-countdown {

                display: inline-flex;

                align-items: center;

                justify-content: center;

                padding: 5px 8px;

                border-radius: 8px;

                font-size: 9px;

                font-weight: 800;

                line-height: 1;

                white-space: nowrap;

                background: rgba(
                    255,
                    255,
                    255,
                    0.07
                );

                border: 1px solid rgba(
                    255,
                    255,
                    255,
                    0.06
                );

            }


            #tradingSessionsPanel
            .session-countdown.small {

                color: #7dd3fc;

                background: rgba(
                    56,
                    189,
                    248,
                    0.11
                );

                border-color: rgba(
                    56,
                    189,
                    248,
                    0.16
                );

            }


            /* =================================================
               WEEK-END
               ================================================= */

            #tradingSessionsPanel
            .sessions-weekend {

                display: inline-flex;

                align-items: center;

                margin-left: 10px;

                padding: 5px 8px;

                border-radius: 8px;

                font-size: 8px;

                font-weight: 800;

                white-space: nowrap;

                color: #fca5a5;

                background: rgba(
                    239,
                    68,
                    68,
                    0.10
                );

                border: 1px solid rgba(
                    239,
                    68,
                    68,
                    0.16
                );

            }


            /* =================================================
               SESSION OUVERTE
               ================================================= */

            #tradingSessionsPanel
            .session-current-name.open {

                color: #4ade80;

            }


            /* =================================================
               MODE CLAIR
               ================================================= */

            body.light-theme
            #tradingSessionsPanel,

            body.light
            #tradingSessionsPanel {

                border-color: rgba(
                    15,
                    23,
                    42,
                    0.11
                );

                background:
                    linear-gradient(
                        135deg,
                        rgba(255,255,255,0.96),
                        rgba(248,250,252,0.92)
                    );

                box-shadow:
                    0 8px 26px rgba(
                        15,
                        23,
                        42,
                        0.10
                    );

            }


            /* =================================================
               ÉCRAN MOYEN
               ================================================= */

            @media (max-width: 1200px) {

                #tradingSessionsPanel {

                    max-width: 620px;

                    min-width: 440px;

                }

                #tradingSessionsPanel
                .session-current,

                #tradingSessionsPanel
                .session-next {

                    padding-left: 9px;

                    padding-right: 9px;

                    gap: 6px;

                }

            }


            /* =================================================
               TABLETTE
               ================================================= */

            @media (max-width: 900px) {

                #tradingSessionsPanel {

                    max-width: 540px;

                    min-width: 0;

                }

                #tradingSessionsPanel
                .session-label {

                    display: none;

                }

            }


            /* =================================================
               PETIT ÉCRAN
               ================================================= */

            @media (max-width: 650px) {

                #tradingSessionsPanel {

                    width: calc(100% - 12px);

                    max-width: none;

                    min-width: 0;

                    margin: 7px auto;

                }


                #tradingSessionsPanel
                .sessions-main {

                    flex-wrap: wrap;

                    row-gap: 5px;

                }


                #tradingSessionsPanel
                .session-current,

                #tradingSessionsPanel
                .session-next {

                    padding: 2px 7px;

                }


                #tradingSessionsPanel
                .sessions-weekend {

                    margin-left: 4px;

                }

            }


            /* =================================================
               TRÈS PETIT ÉCRAN
               ================================================= */

            @media (max-width: 480px) {

                #tradingSessionsPanel {

                    padding: 8px;

                }


                #tradingSessionsPanel
                .sessions-main {

                    flex-direction: column;

                    align-items: stretch;

                }


                #tradingSessionsPanel
                .session-current {

                    border-right: none;

                    border-bottom:
                        1px solid rgba(
                            255,
                            255,
                            255,
                            0.08
                        );

                    padding-bottom: 7px;

                }


                #tradingSessionsPanel
                .session-current,

                #tradingSessionsPanel
                .session-next {

                    justify-content: center;

                }

            }

        `;


        document.head.appendChild(style);

    }


    /* =====================================================
       DATE / HEURE
       ===================================================== */

    function getParts(
        date,
        timezone
    ) {

        const formatter =
            new Intl.DateTimeFormat(
                "en-US",
                {
                    timeZone: timezone,
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hourCycle: "h23"
                }
            );


        const parts =
            formatter.formatToParts(date);


        const result = {};


        parts.forEach(function (part) {

            if (
                part.type !== "literal"
            ) {

                result[part.type] =
                    Number(part.value);

            }

        });


        return result;

    }


    function getTimeString(parts) {

        return (
            String(parts.hour).padStart(
                2,
                "0"
            ) +
            ":" +
            String(parts.minute).padStart(
                2,
                "0"
            )
        );

    }


    function getFullTimeString(parts) {

        return (
            String(parts.hour).padStart(
                2,
                "0"
            ) +
            ":" +
            String(parts.minute).padStart(
                2,
                "0"
            ) +
            ":" +
            String(parts.second).padStart(
                2,
                "0"
            )
        );

    }


    function getDayOfWeek(
        date,
        timezone
    ) {

        const formatter =
            new Intl.DateTimeFormat(
                "en-US",
                {
                    timeZone: timezone,
                    weekday: "short"
                }
            );


        return formatter.format(date);

    }


    function isWeekend(date) {

        const day =
            getDayOfWeek(
                date,
                MADAGASCAR_TIMEZONE
            );


        return (
            day === "Sat" ||
            day === "Sun"
        );

    }


    /* =====================================================
       CONVERSION DATE
       ===================================================== */

    function createDateFromParts(
        parts,
        timezone,
        hour,
        minute,
        second
    ) {

        const utcGuess =
            Date.UTC(
                parts.year,
                parts.month - 1,
                parts.day,
                hour,
                minute,
                second
            );


        let date =
            new Date(utcGuess);


        for (
            let i = 0;
            i < 3;
            i++
        ) {

            const actual =
                getParts(
                    date,
                    timezone
                );


            const desiredMinutes =
                hour * 60 +
                minute;


            const actualMinutes =
                actual.hour * 60 +
                actual.minute;


            let difference =
                desiredMinutes -
                actualMinutes;


            if (
                difference > 720
            ) {

                difference -= 1440;

            }


            if (
                difference < -720
            ) {

                difference += 1440;

            }


            date =
                new Date(
                    date.getTime() +
                    difference *
                    60 *
                    1000
                );

        }


        return date;

    }


    /* =====================================================
       ÉTAT SESSION
       ===================================================== */

    function getSessionState(
        session,
        now
    ) {

        const parts =
            getParts(
                now,
                session.timezone
            );


        const currentMinutes =
            parts.hour * 60 +
            parts.minute +
            parts.second / 60;


        const openMinutes =
            session.openHour * 60;


        const closeMinutes =
            session.closeHour * 60;


        const open =
            currentMinutes >=
            openMinutes &&
            currentMinutes <
            closeMinutes;


        return {

            open: open,

            parts: parts,

            currentMinutes:
                currentMinutes,

            openMinutes:
                openMinutes,

            closeMinutes:
                closeMinutes

        };

    }


    /* =====================================================
       PROCHAINE OUVERTURE
       ===================================================== */

    function getNextOpenDate(
        session,
        now
    ) {

        let candidate =
            new Date(now);


        for (
            let i = 0;
            i < 8;
            i++
        ) {

            const parts =
                getParts(
                    candidate,
                    session.timezone
                );


            const candidateDate =
                createDateFromParts(
                    parts,
                    session.timezone,
                    session.openHour,
                    0,
                    0
                );


            if (
                candidateDate > now
            ) {

                return candidateDate;

            }


            candidate =
                new Date(
                    candidate.getTime() +
                    24 *
                    60 *
                    60 *
                    1000
                );

        }


        return null;

    }


    /* =====================================================
       FERMETURE SESSION
       ===================================================== */

    function getCloseDate(
        session,
        now
    ) {

        const parts =
            getParts(
                now,
                session.timezone
            );


        const closeDate =
            createDateFromParts(
                parts,
                session.timezone,
                session.closeHour,
                0,
                0
            );


        if (
            closeDate <= now
        ) {

            return new Date(
                closeDate.getTime() +
                24 *
                60 *
                60 *
                1000
            );

        }


        return closeDate;

    }


    /* =====================================================
       COMPTE À REBOURS
       ===================================================== */

    function formatCountdown(
        milliseconds
    ) {

        if (
            milliseconds < 0
        ) {

            milliseconds = 0;

        }


        const totalSeconds =
            Math.floor(
                milliseconds / 1000
            );


        const days =
            Math.floor(
                totalSeconds / 86400
            );


        const hours =
            Math.floor(
                (
                    totalSeconds % 86400
                ) / 3600
            );


        const minutes =
            Math.floor(
                (
                    totalSeconds % 3600
                ) / 60
            );


        const seconds =
            totalSeconds % 60;


        let result = "";


        if (
            days > 0
        ) {

            result +=
                days +
                "j ";

        }


        result +=
            String(hours).padStart(
                2,
                "0"
            ) +
            "h " +
            String(minutes).padStart(
                2,
                "0"
            ) +
            "m " +
            String(seconds).padStart(
                2,
                "0"
            ) +
            "s";


        return result;

    }


    /* =====================================================
       CRÉATION DU PANNEAU
       ===================================================== */

    function createPanel() {

        let panel =
            document.getElementById(
                "tradingSessionsPanel"
            );


        if (!panel) {

            panel =
                document.createElement(
                    "div"
                );


            panel.id =
                "tradingSessionsPanel";


            panel.innerHTML = `

                <div class="sessions-main">

                    <div class="session-current">

                        <span class="session-label">
                            SESSION ACTUELLE
                        </span>

                        <span
                            id="currentSessionName"
                            class="session-current-name"
                        >
                            —
                        </span>

                        <span
                            id="currentSessionStatus"
                            class="session-status"
                        >
                            —
                        </span>

                        <span
                            id="currentSessionCountdown"
                            class="session-countdown"
                        >
                            —
                        </span>

                    </div>


                    <div class="session-next">

                        <span class="session-label">
                            PROCHAINE
                        </span>

                        <span
                            id="nextSessionName"
                            class="session-next-name"
                        >
                            —
                        </span>

                        <span
                            id="nextSessionTime"
                            class="session-time-line"
                        >
                            —
                        </span>

                        <span
                            id="nextSessionCountdown"
                            class="session-countdown small"
                        >
                            —
                        </span>

                    </div>

                </div>


                <div
                    id="sessionsWeekend"
                    class="sessions-weekend"
                    style="display:none;"
                >
                    🛑 Week-end
                </div>

            `;

        }


        const topbar =
            document.querySelector(
                ".topbar"
            );


        const themeButton =
            document.getElementById(
                "themeToggle"
            );


        if (topbar) {

            if (
                panel.parentElement !==
                topbar
            ) {

                if (
                    themeButton &&
                    themeButton.parentElement ===
                    topbar
                ) {

                    topbar.insertBefore(
                        panel,
                        themeButton
                    );

                }

                else {

                    topbar.appendChild(
                        panel
                    );

                }

            }

        }

        else if (
            !panel.parentElement
        ) {

            document.body.prepend(
                panel
            );

        }


        panel.style.flex =
            "0 1 auto";

        panel.style.minWidth =
            "0";

    }


    /* =====================================================
       MISE À JOUR
       ===================================================== */

    function updatePanel() {

        const now =
            new Date();


        const weekend =
            isWeekend(now);


        /* =================================================
           HEURE MADAGASCAR
           ================================================= */

        const madaParts =
            getParts(
                now,
                MADAGASCAR_TIMEZONE
            );


        const madaTime =
            getFullTimeString(
                madaParts
            );


        /* =================================================
           ÉTATS DES SESSIONS
           ================================================= */

        const states =
            SESSIONS.map(
                function (session) {

                    return {

                        session:
                            session,

                        state:
                            getSessionState(
                                session,
                                now
                            )

                    };

                }
            );


        /* =================================================
           SESSION ACTUELLE
           ================================================= */

        let currentSessions =
            states.filter(
                function (item) {

                    return item.state.open;

                }
            );


        if (weekend) {

            currentSessions = [];

        }


        const current =
            currentSessions.length > 0
                ? currentSessions[0]
                : null;


        const currentName =
            document.getElementById(
                "currentSessionName"
            );


        const currentStatus =
            document.getElementById(
                "currentSessionStatus"
            );


        const currentCountdown =
            document.getElementById(
                "currentSessionCountdown"
            );


        if (
            currentName &&
            currentStatus &&
            currentCountdown
        ) {

            if (current) {

                currentName.textContent =
                    current.session.country +
                    " " +
                    current.session.name;


                currentName.classList.add(
                    "open"
                );


                currentStatus.textContent =
                    "🟢 Ouverte";


                const closeDate =
                    getCloseDate(
                        current.session,
                        now
                    );


                currentCountdown.textContent =
                    "Fermeture " +
                    formatCountdown(
                        closeDate.getTime() -
                        now.getTime()
                    );

            }

            else {

                currentName.classList.remove(
                    "open"
                );


                currentName.textContent =
                    weekend
                        ? "🛑 Marché fermé"
                        : "Aucune session";


                currentStatus.textContent =
                    weekend
                        ? "Week-end"
                        : "Entre deux sessions";


                currentCountdown.textContent =
                    "🇲🇬 " +
                    madaTime;

            }

        }


        /* =================================================
           PROCHAINE SESSION
           ================================================= */

        const upcoming = [];


        SESSIONS.forEach(
            function (session) {

                const nextDate =
                    getNextOpenDate(
                        session,
                        now
                    );


                if (nextDate) {

                    upcoming.push({

                        session:
                            session,

                        date:
                            nextDate

                    });

                }

            }
        );


        upcoming.sort(
            function (a, b) {

                return (
                    a.date.getTime() -
                    b.date.getTime()
                );

            }
        );


        let next = null;


        for (
            let i = 0;
            i < upcoming.length;
            i++
        ) {

            const item =
                upcoming[i];


            const state =
                getSessionState(
                    item.session,
                    now
                );


            if (
                !state.open ||
                weekend
            ) {

                next = item;

                break;

            }

        }


        const nextName =
            document.getElementById(
                "nextSessionName"
            );


        const nextTime =
            document.getElementById(
                "nextSessionTime"
            );


        const nextCountdown =
            document.getElementById(
                "nextSessionCountdown"
            );


        if (
            nextName &&
            nextTime &&
            nextCountdown
        ) {

            if (next) {

                const localParts =
                    getParts(
                        next.date,
                        next.session.timezone
                    );


                const nextMadaParts =
                    getParts(
                        next.date,
                        MADAGASCAR_TIMEZONE
                    );


                nextName.textContent =
                    next.session.country +
                    " " +
                    next.session.name;


                nextTime.textContent =
                    getTimeString(
                        localParts
                    ) +
                    " " +
                    next.session.name +
                    " • " +
                    getTimeString(
                        nextMadaParts
                    ) +
                    " MG";


                nextCountdown.textContent =
                    "⏱ " +
                    formatCountdown(
                        next.date.getTime() -
                        now.getTime()
                    );

            }

            else {

                nextName.textContent =
                    "—";


                nextTime.textContent =
                    "—";


                nextCountdown.textContent =
                    "—";

            }

        }


        /* =================================================
           WEEK-END
           ================================================= */

        const weekendElement =
            document.getElementById(
                "sessionsWeekend"
            );


        if (weekendElement) {

            weekendElement.style.display =
                weekend
                    ? "inline-flex"
                    : "none";

        }

    }


    /* =====================================================
       INITIALISATION
       ===================================================== */

    function init() {

        injectSessionStyles();

        createPanel();

        updatePanel();


        if (timer) {

            clearInterval(
                timer
            );

        }


        timer =
            setInterval(
                updatePanel,
                1000
            );

    }


    /* =====================================================
       DOM
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    }

    else {

        init();

    }

})();
