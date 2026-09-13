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
   - Heure Madagascar
   - Été / hiver
   - Week-end
   - Compte à rebours
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

        const oldStyle =
            document.getElementById(
                "tradingSessionStyles"
            );


        if (oldStyle) {

            oldStyle.remove();

        }


        const style =
            document.createElement("style");


        style.id =
            "tradingSessionStyles";


        style.textContent = `

            /* =================================================
               PANNEAU SESSION
               ================================================= */

            #tradingSessionsPanel {

                display: block !important;

                box-sizing: border-box !important;

                width: 620px !important;

                min-width: 620px !important;

                max-width: 620px !important;

                flex: 0 0 620px !important;

                height: auto !important;

                margin: 0 auto !important;

                padding: 9px 12px !important;

                border-radius: 14px !important;

                border: 1px solid rgba(
                    255,
                    255,
                    255,
                    0.12
                ) !important;

                background:
                    linear-gradient(
                        135deg,
                        rgba(255,255,255,0.09),
                        rgba(255,255,255,0.035)
                    ) !important;

                box-shadow:
                    0 7px 24px rgba(
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
                    ) !important;

                backdrop-filter:
                    blur(14px);

                -webkit-backdrop-filter:
                    blur(14px);

                overflow: visible !important;

            }


            /* =================================================
               CONTENEUR DES 2 SESSIONS
               ================================================= */

            #tradingSessionsPanel
            .sessions-main {

                display: grid !important;

                grid-template-columns:
                    minmax(0, 1fr)
                    1px
                    minmax(0, 1fr) !important;

                align-items: center !important;

                width: 100% !important;

                min-width: 0 !important;

                gap: 0 !important;

            }


            /* =================================================
               BLOC SESSION ACTUELLE / PROCHAINE
               ================================================= */

            #tradingSessionsPanel
            .session-current,

            #tradingSessionsPanel
            .session-next {

                display: flex !important;

                align-items: center !important;

                justify-content: center !important;

                gap: 8px !important;

                min-width: 0 !important;

                width: 100% !important;

                box-sizing: border-box !important;

                padding: 2px 12px !important;

                white-space: nowrap !important;

            }


            #tradingSessionsPanel
            .session-current {

                grid-column: 1;

                border-right: none !important;

            }


            #tradingSessionsPanel
            .session-next {

                grid-column: 3;

            }


            /* =================================================
               SÉPARATEUR
               ================================================= */

            #tradingSessionsPanel
            .sessions-main::after {

                content: "";

                grid-column: 2;

                grid-row: 1;

                width: 1px;

                height: 30px;

                justify-self: center;

                background: rgba(
                    255,
                    255,
                    255,
                    0.13
                );

            }


            /* =================================================
               LABELS
               ================================================= */

            #tradingSessionsPanel
            .session-label {

                display: inline-block !important;

                flex: 0 0 auto !important;

                font-size: 8px !important;

                font-weight: 800 !important;

                letter-spacing: 0.8px !important;

                text-transform: uppercase !important;

                opacity: 0.48 !important;

                white-space: nowrap !important;

            }


            /* =================================================
               NOM
               ================================================= */

            #tradingSessionsPanel
            .session-current-name,

            #tradingSessionsPanel
            .session-next-name {

                display: inline-block !important;

                flex: 0 0 auto !important;

                font-size: 12px !important;

                font-weight: 800 !important;

                line-height: 1.2 !important;

                white-space: nowrap !important;

            }


            #tradingSessionsPanel
            .session-current-name.open {

                color: #4ade80 !important;

            }


            /* =================================================
               STATUT
               ================================================= */

            #tradingSessionsPanel
            .session-status {

                display: inline-block !important;

                flex: 0 0 auto !important;

                font-size: 9px !important;

                font-weight: 700 !important;

                opacity: 0.70 !important;

                white-space: nowrap !important;

            }


            /* =================================================
               HEURE PROCHAINE SESSION
               ================================================= */

            #tradingSessionsPanel
            .session-time-line {

                display: inline-block !important;

                flex: 0 0 auto !important;

                font-size: 9px !important;

                font-weight: 600 !important;

                opacity: 0.68 !important;

                white-space: nowrap !important;

            }


            /* =================================================
               COMPTE À REBOURS
               ================================================= */

            #tradingSessionsPanel
            .session-countdown {

                display: inline-flex !important;

                align-items: center !important;

                justify-content: center !important;

                flex: 0 0 auto !important;

                box-sizing: border-box !important;

                min-width: max-content !important;

                padding: 5px 8px !important;

                border-radius: 7px !important;

                font-size: 9px !important;

                font-weight: 800 !important;

                line-height: 1 !important;

                white-space: nowrap !important;

                background: rgba(
                    255,
                    255,
                    255,
                    0.07
                ) !important;

                border: 1px solid rgba(
                    255,
                    255,
                    255,
                    0.06
                ) !important;

            }


            #tradingSessionsPanel
            .session-countdown.small {

                color: #7dd3fc !important;

                background: rgba(
                    56,
                    189,
                    248,
                    0.10
                ) !important;

                border-color: rgba(
                    56,
                    189,
                    248,
                    0.16
                ) !important;

            }


            /* =================================================
               WEEK-END
               ================================================= */

            #tradingSessionsPanel
            .sessions-weekend {

                display: inline-flex;

                align-items: center;

                justify-content: center;

                box-sizing: border-box;

                margin-top: 6px;

                width: 100%;

                padding: 4px 8px;

                border-radius: 7px;

                font-size: 8px;

                font-weight: 800;

                white-space: nowrap;

                color: #fca5a5;

                background: rgba(
                    239,
                    68,
                    68,
                    0.09
                );

                border: 1px solid rgba(
                    239,
                    68,
                    68,
                    0.14
                );

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
                ) !important;

                background:
                    linear-gradient(
                        135deg,
                        rgba(255,255,255,0.96),
                        rgba(248,250,252,0.93)
                    ) !important;

                box-shadow:
                    0 7px 24px rgba(
                        15,
                        23,
                        42,
                        0.10
                    ) !important;

            }


            /* =================================================
               ÉCRAN MOYEN
               ================================================= */

            @media (max-width: 1150px) {

                #tradingSessionsPanel {

                    width: 560px !important;

                    min-width: 560px !important;

                    max-width: 560px !important;

                    flex-basis: 560px !important;

                }


                #tradingSessionsPanel
                .session-label {

                    display: none !important;

                }

            }


            /* =================================================
               TABLETTE / PETIT DESKTOP
               ================================================= */

            @media (max-width: 900px) {

                #tradingSessionsPanel {

                    width: 100% !important;

                    min-width: 0 !important;

                    max-width: 100% !important;

                    flex: 1 1 100% !important;

                    margin: 6px 0 !important;

                }

            }


            /* =================================================
               PETIT ÉCRAN
               ================================================= */

            @media (max-width: 650px) {

                #tradingSessionsPanel {

                    padding: 8px !important;

                }


                #tradingSessionsPanel
                .sessions-main {

                    grid-template-columns:
                        minmax(0, 1fr) !important;

                    gap: 7px !important;

                }


                #tradingSessionsPanel
                .session-current,

                #tradingSessionsPanel
                .session-next {

                    grid-column: 1 !important;

                    justify-content: center !important;

                    flex-wrap: wrap !important;

                    row-gap: 5px !important;

                    white-space: normal !important;

                }


                #tradingSessionsPanel
                .session-next {

                    padding-top: 7px !important;

                    border-top:
                        1px solid rgba(
                            255,
                            255,
                            255,
                            0.09
                        );

                }


                #tradingSessionsPanel
                .sessions-main::after {

                    display: none !important;

                }

            }


            /* =================================================
               TRÈS PETIT ÉCRAN
               ================================================= */

            @media (max-width: 430px) {

                #tradingSessionsPanel
                .session-current,

                #tradingSessionsPanel
                .session-next {

                    justify-content: flex-start !important;

                }


                #tradingSessionsPanel
                .session-time-line {

                    white-space: normal !important;

                    text-align: left;

                }

            }

        `;


        document.head.appendChild(style);

    }


    /* =====================================================
       OUTILS DATE / HEURE
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


        parts.forEach(
            function (part) {

                if (
                    part.type !== "literal"
                ) {

                    result[part.type] =
                        Number(part.value);

                }

            }
        );


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
       CRÉATION DATE DANS TIMEZONE
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
       FERMETURE
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
       CRÉATION PANNEAU
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
           SESSION ACTUELLE
           ================================================= */

        let current = null;


        if (!weekend) {

            for (
                let i = 0;
                i < SESSIONS.length;
                i++
            ) {

                const session =
                    SESSIONS[i];


                const state =
                    getSessionState(
                        session,
                        now
                    );


                if (
                    state.open
                ) {

                    current = {

                        session:
                            session,

                        state:
                            state

                    };

                    break;

                }

            }

        }


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

            clearInterval(timer);

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
