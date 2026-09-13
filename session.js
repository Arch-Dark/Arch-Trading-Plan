/* =========================================================
   SESSION.JS
   Trading Dashboard
   ---------------------------------------------------------
   Gestion :
   - Sydney
   - Tokyo
   - Londres
   - New York
   - Heure locale de chaque session
   - Heure Madagascar
   - Été / hiver
   - Week-end = marché fermé
   - Prochaine session
   - Compte à rebours
   - Affichage compact et esthétique
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIGURATION DES SESSIONS
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


    /* =====================================================
       PARAMÈTRES
       ===================================================== */

    const MADAGASCAR_TIMEZONE =
        "Indian/Antananarivo";

    let timer = null;


    /* =====================================================
       STYLE DU PANNEAU
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
               CONTENEUR PRINCIPAL
               ================================================= */

            #tradingSessionsPanel {

                position: relative;

                display: flex;

                align-items: center;

                gap: 12px;

                width: auto;

                max-width: 760px;

                min-width: 0;

                margin: 0 auto;

                padding: 8px 10px;

                border: 1px solid rgba(
                    255,
                    255,
                    255,
                    0.10
                );

                border-radius: 14px;

                background:
                    linear-gradient(
                        135deg,
                        rgba(255,255,255,0.075),
                        rgba(255,255,255,0.025)
                    );

                box-shadow:
                    0 8px 24px rgba(0,0,0,0.18),
                    inset 0 1px 0 rgba(
                        255,
                        255,
                        255,
                        0.05
                    );

                backdrop-filter: blur(12px);

                -webkit-backdrop-filter: blur(12px);

                box-sizing: border-box;

                flex: 0 1 auto !important;

                overflow: hidden;

            }


            /* =================================================
               ZONE ACTUELLE / PROCHAINE
               ================================================= */

            #tradingSessionsPanel .sessions-main {

                display: flex;

                align-items: stretch;

                gap: 0;

                min-width: 0;

                flex: 0 1 auto;

            }


            #tradingSessionsPanel .session-current,

            #tradingSessionsPanel .session-next {

                display: grid;

                grid-template-columns:
                    auto
                    auto
                    auto;

                align-items: center;

                gap: 5px 8px;

                min-width: 0;

                padding: 3px 11px;

            }


            #tradingSessionsPanel .session-current {

                border-right:
                    1px solid rgba(
                        255,
                        255,
                        255,
                        0.10
                    );

            }


            #tradingSessionsPanel .session-label {

                grid-column: 1 / -1;

                font-size: 8px;

                font-weight: 800;

                letter-spacing: 1px;

                text-transform: uppercase;

                opacity: 0.55;

                white-space: nowrap;

            }


            #tradingSessionsPanel
            .session-current-name,

            #tradingSessionsPanel
            .session-next-name {

                font-size: 12px;

                font-weight: 800;

                white-space: nowrap;

            }


            #tradingSessionsPanel
            .session-status {

                font-size: 10px;

                font-weight: 700;

                white-space: nowrap;

                opacity: 0.78;

            }


            #tradingSessionsPanel
            .session-countdown {

                font-size: 10px;

                font-weight: 800;

                white-space: nowrap;

                padding: 3px 7px;

                border-radius: 7px;

                background: rgba(
                    255,
                    255,
                    255,
                    0.07
                );

            }


            #tradingSessionsPanel
            .session-countdown.small {

                color: #7dd3fc;

                background: rgba(
                    56,
                    189,
                    248,
                    0.10
                );

            }


            #tradingSessionsPanel
            .session-time-line {

                font-size: 9px;

                opacity: 0.68;

                white-space: nowrap;

            }


            /* =================================================
               WEEK-END
               ================================================= */

            #tradingSessionsPanel .sessions-weekend {

                display: inline-flex;

                align-items: center;

                white-space: nowrap;

                font-size: 9px;

                font-weight: 700;

                padding: 4px 8px;

                border-radius: 7px;

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
               LISTE DES SESSIONS
               ================================================= */

            #tradingSessionsPanel .sessions-list {

                display: flex;

                align-items: center;

                gap: 5px;

                min-width: 0;

                flex: 0 1 auto;

            }


            /* =================================================
               MINI CARTES
               ================================================= */

            #tradingSessionsPanel
            .session-mini-card {

                display: grid;

                grid-template-columns:
                    auto
                    auto;

                align-items: center;

                column-gap: 6px;

                row-gap: 1px;

                min-width: 92px;

                padding: 5px 7px;

                border-radius: 9px;

                border: 1px solid rgba(
                    255,
                    255,
                    255,
                    0.07
                );

                background: rgba(
                    255,
                    255,
                    255,
                    0.035
                );

                transition:
                    transform 0.2s ease,
                    background 0.2s ease,
                    border-color 0.2s ease,
                    box-shadow 0.2s ease;

            }


            #tradingSessionsPanel
            .session-mini-card:hover {

                transform:
                    translateY(-1px);

                background: rgba(
                    255,
                    255,
                    255,
                    0.065
                );

            }


            #tradingSessionsPanel
            .session-mini-title {

                display: flex;

                align-items: center;

                gap: 4px;

                grid-column: 1 / -1;

                font-size: 9px;

                white-space: nowrap;

            }


            #tradingSessionsPanel
            .session-mini-title strong {

                font-size: 9px;

                font-weight: 800;

            }


            #tradingSessionsPanel
            .session-mini-status {

                font-size: 8px;

                font-weight: 700;

                white-space: nowrap;

                opacity: 0.70;

            }


            #tradingSessionsPanel
            .session-mini-hours {

                display: flex;

                align-items: center;

                gap: 3px;

                white-space: nowrap;

                font-size: 7px;

                opacity: 0.52;

            }


            #tradingSessionsPanel
            .session-mini-hours strong {

                font-size: 8px;

                font-weight: 700;

                opacity: 1;

            }


            /* =================================================
               SESSION OUVERTE
               ================================================= */

            #tradingSessionsPanel
            .session-mini-card.session-open {

                border-color: rgba(
                    34,
                    197,
                    94,
                    0.32
                );

                background: rgba(
                    34,
                    197,
                    94,
                    0.08
                );

                box-shadow:
                    0 0 12px rgba(
                        34,
                        197,
                        94,
                        0.08
                    );

            }


            #tradingSessionsPanel
            .session-mini-card.session-open
            .session-mini-status {

                color: #4ade80;

                opacity: 1;

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
                    0.10
                );

                background:
                    linear-gradient(
                        135deg,
                        rgba(255,255,255,0.92),
                        rgba(248,250,252,0.90)
                    );

                box-shadow:
                    0 8px 24px rgba(
                        15,
                        23,
                        42,
                        0.10
                    );

            }


            /* =================================================
               PETITS ÉCRANS
               ================================================= */

            @media (max-width: 1100px) {

                #tradingSessionsPanel {

                    max-width: 600px;

                }

                #tradingSessionsPanel
                .sessions-list {

                    display: none;

                }

            }


            @media (max-width: 760px) {

                #tradingSessionsPanel {

                    width: 100%;

                    max-width: none;

                    margin: 8px 0;

                    padding: 7px;

                    flex-wrap: wrap;

                    justify-content: center;

                }


                #tradingSessionsPanel
                .sessions-main {

                    width: 100%;

                    justify-content: center;

                }


                #tradingSessionsPanel
                .session-current,

                #tradingSessionsPanel
                .session-next {

                    flex: 1 1 0;

                }


                #tradingSessionsPanel
                .sessions-weekend {

                    display: inline-flex;

                }

            }


            @media (max-width: 520px) {

                #tradingSessionsPanel
                .sessions-main {

                    flex-direction: column;

                    gap: 4px;

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

                }


                #tradingSessionsPanel
                .session-current,

                #tradingSessionsPanel
                .session-next {

                    width: 100%;

                    justify-content: center;

                }


                #tradingSessionsPanel
                .session-time-line {

                    max-width: 150px;

                    overflow: hidden;

                    text-overflow: ellipsis;

                }

            }

        `;


        document.head.appendChild(style);

    }


    /* =====================================================
       OUTILS DATE / HEURE
       ===================================================== */

    function getParts(date, timezone) {

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

            if (part.type !== "literal") {

                result[part.type] =
                    Number(part.value);

            }

        });

        return result;

    }


    function getTimeString(parts) {

        return (
            String(parts.hour).padStart(2, "0") +
            ":" +
            String(parts.minute).padStart(2, "0")
        );

    }


    function getFullTimeString(parts) {

        return (
            String(parts.hour).padStart(2, "0") +
            ":" +
            String(parts.minute).padStart(2, "0") +
            ":" +
            String(parts.second).padStart(2, "0")
        );

    }


    function getDayOfWeek(date, timezone) {

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
       CONVERSION DATE LOCALE
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


        for (let i = 0; i < 3; i++) {

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


            if (difference > 720) {

                difference -= 1440;

            }


            if (difference < -720) {

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
       ÉTAT D'UNE SESSION
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
            currentMinutes >= openMinutes &&
            currentMinutes < closeMinutes;


        return {
            open: open,
            parts: parts,
            currentMinutes: currentMinutes,
            openMinutes: openMinutes,
            closeMinutes: closeMinutes
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


        for (let i = 0; i < 8; i++) {

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


            if (candidateDate > now) {

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
       FERMETURE D'UNE SESSION
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


        if (closeDate <= now) {

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

        if (milliseconds < 0) {

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
                (totalSeconds % 86400) / 3600
            );


        const minutes =
            Math.floor(
                (totalSeconds % 3600) / 60
            );


        const seconds =
            totalSeconds % 60;


        let result = "";


        if (days > 0) {

            result +=
                days +
                "j ";

        }


        result +=
            String(hours).padStart(2, "0") +
            "h " +
            String(minutes).padStart(2, "0") +
            "m " +
            String(seconds).padStart(2, "0") +
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
                document.createElement("div");

            panel.id =
                "tradingSessionsPanel";


            panel.innerHTML = `

                <div class="sessions-main">

                    <div class="session-current">

                        <div class="session-label">
                            SESSION ACTUELLE
                        </div>

                        <div
                            id="currentSessionName"
                            class="session-current-name"
                        >
                            —
                        </div>

                        <div
                            id="currentSessionStatus"
                            class="session-status"
                        >
                            —
                        </div>

                        <div
                            id="currentSessionCountdown"
                            class="session-countdown"
                        >
                            —
                        </div>

                    </div>


                    <div class="session-next">

                        <div class="session-label">
                            PROCHAINE SESSION
                        </div>

                        <div
                            id="nextSessionName"
                            class="session-next-name"
                        >
                            —
                        </div>

                        <div
                            id="nextSessionTime"
                            class="session-time-line"
                        >
                            —
                        </div>

                        <div
                            id="nextSessionCountdown"
                            class="session-countdown small"
                        >
                            —
                        </div>

                    </div>

                </div>


                <div
                    id="sessionsWeekend"
                    class="sessions-weekend"
                    style="display:none;"
                >
                    🛑 Week-end
                </div>


                <div
                    id="sessionsList"
                    class="sessions-list"
                ></div>

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
                panel.parentElement !== topbar
            ) {

                if (
                    themeButton &&
                    themeButton.parentElement === topbar
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
       CRÉATION DES MINI CARTES
       ===================================================== */

    function createSessionCards() {

        const container =
            document.getElementById(
                "sessionsList"
            );


        if (!container) {

            return;

        }


        container.innerHTML = "";


        SESSIONS.forEach(
            function (session) {

                const card =
                    document.createElement("div");


                card.className =
                    "session-mini-card";


                card.dataset.session =
                    session.id;


                card.innerHTML = `

                    <div class="session-mini-title">

                        <span>
                            ${session.country}
                        </span>

                        <strong>
                            ${session.name}
                        </strong>

                    </div>


                    <div
                        class="session-mini-status"
                        data-status
                    >
                        —
                    </div>


                    <div class="session-mini-hours">

                        <span>
                            Local
                        </span>

                        <strong data-local>
                            —
                        </strong>

                    </div>


                    <div class="session-mini-hours">

                        <span>
                            MG
                        </span>

                        <strong data-mada>
                            —
                        </strong>

                    </div>

                `;


                container.appendChild(
                    card
                );

            }
        );

    }


    /* =====================================================
       MISE À JOUR
       ===================================================== */

    function updatePanel() {

        const now =
            new Date();


        const weekend =
            isWeekend(now);


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
           ÉTATS
           ================================================= */

        const states =
            SESSIONS.map(
                function (session) {

                    return {
                        session: session,
                        state:
                            getSessionState(
                                session,
                                now
                            )
                    };

                }
            );


        /* =================================================
           SESSIONS OUVERTES
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
                        session: session,
                        date: nextDate
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
           MINI CARTES
           ================================================= */

        states.forEach(
            function (item) {

                const session =
                    item.session;


                const state =
                    item.state;


                const card =
                    document.querySelector(
                        '[data-session="' +
                        session.id +
                        '"]'
                    );


                if (!card) {

                    return;

                }


                const status =
                    card.querySelector(
                        "[data-status]"
                    );


                const local =
                    card.querySelector(
                        "[data-local]"
                    );


                const mada =
                    card.querySelector(
                        "[data-mada]"
                    );


                if (local) {

                    local.textContent =
                        getTimeString(
                            state.parts
                        );

                }


                if (mada) {

                    mada.textContent =
                        madaTime;

                }


                if (
                    state.open &&
                    !weekend
                ) {

                    card.classList.add(
                        "session-open"
                    );


                    if (status) {

                        status.textContent =
                            "🟢 Ouverte";

                    }

                }

                else {

                    card.classList.remove(
                        "session-open"
                    );


                    if (status) {

                        status.textContent =
                            weekend
                                ? "🔴 Fermée"
                                : "⚪ Fermée";

                    }

                }

            }
        );

    }


    /* =====================================================
       INITIALISATION
       ===================================================== */

    function init() {

        injectSessionStyles();

        createPanel();

        createSessionCards();

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
       ATTENTE DOM
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
