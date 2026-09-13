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

    const MADAGASCAR_TIMEZONE = "Indian/Antananarivo";

    let timer = null;


    /* =====================================================
       OUTILS DATE / HEURE
       ===================================================== */

    function getParts(date, timezone) {

        const formatter = new Intl.DateTimeFormat(
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

        const parts = formatter.formatToParts(date);

        const result = {};

        parts.forEach(function (part) {

            if (part.type !== "literal") {
                result[part.type] = Number(part.value);
            }

        });

        return result;
    }


    function getDateKey(parts) {

        return (
            parts.year +
            "-" +
            String(parts.month).padStart(2, "0") +
            "-" +
            String(parts.day).padStart(2, "0")
        );

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

        const formatter = new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone: timezone,
                weekday: "short"
            }
        );

        return formatter.format(date);

    }


    function isWeekend(date) {

        const day = getDayOfWeek(
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

        /*
         * On utilise une approximation initiale puis
         * une correction basée sur le fuseau demandé.
         */

        const utcGuess = Date.UTC(
            parts.year,
            parts.month - 1,
            parts.day,
            hour,
            minute,
            second
        );

        let date = new Date(utcGuess);

        for (let i = 0; i < 3; i++) {

            const actual = getParts(
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

            /*
             * Correction du changement de jour.
             */

            if (difference > 720) {
                difference -= 1440;
            }

            if (difference < -720) {
                difference += 1440;
            }

            date = new Date(
                date.getTime() +
                difference * 60 * 1000
            );

        }

        return date;

    }


    /* =====================================================
       ÉTAT D'UNE SESSION
       ===================================================== */

    function getSessionState(session, now) {

        const parts = getParts(
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
            open,
            parts,
            currentMinutes,
            openMinutes,
            closeMinutes
        };

    }


    /* =====================================================
       PROCHAINE OUVERTURE D'UNE SESSION
       ===================================================== */

    function getNextOpenDate(session, now) {

        let candidate = new Date(now);

        for (let i = 0; i < 8; i++) {

            const parts = getParts(
                candidate,
                session.timezone
            );

            const candidateDate = createDateFromParts(
                parts,
                session.timezone,
                session.openHour,
                0,
                0
            );

            if (candidateDate > now) {

                return candidateDate;

            }

            /*
             * Jour suivant.
             */

            candidate = new Date(
                candidate.getTime() +
                24 * 60 * 60 * 1000
            );

        }

        return null;

    }


    /* =====================================================
       FERMETURE D'UNE SESSION
       ===================================================== */

    function getCloseDate(session, now) {

        const parts = getParts(
            now,
            session.timezone
        );

        const closeDate = createDateFromParts(
            parts,
            session.timezone,
            session.closeHour,
            0,
            0
        );

        if (closeDate <= now) {

            return new Date(
                closeDate.getTime() +
                24 * 60 * 60 * 1000
            );

        }

        return closeDate;

    }


    /* =====================================================
       FORMATAGE COMPTE À REBOURS
       ===================================================== */

    function formatCountdown(milliseconds) {

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
            result += days + "j ";
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

        if (
            document.getElementById(
                "tradingSessionsPanel"
            )
        ) {
            return;
        }


        const panel =
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

                🛑 Marché fermé — week-end

            </div>


            <div
                id="sessionsList"
                class="sessions-list"
            ></div>

        `;


        const topbar =
            document.querySelector(
                ".topbar"
            );


        if (topbar) {

            topbar.appendChild(panel);

        }

        else {

            document.body.prepend(panel);

        }

    }


    /* =====================================================
       CRÉATION LISTE DES SESSIONS
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


        SESSIONS.forEach(function (session) {

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
                        Madagascar
                    </span>

                    <strong data-mada>
                        —
                    </strong>

                </div>

            `;


            container.appendChild(card);

        });

    }


    /* =====================================================
       MISE À JOUR DU PANNEAU
       ===================================================== */

    function updatePanel() {

        const now =
            new Date();


        /*
         * Week-end
         */

        const weekend =
            isWeekend(now);


        const weekendElement =
            document.getElementById(
                "sessionsWeekend"
            );


        if (weekendElement) {

            weekendElement.style.display =
                weekend
                    ? "block"
                    : "none";

        }


        /*
         * Heure Madagascar
         */

        const madaParts =
            getParts(
                now,
                MADAGASCAR_TIMEZONE
            );


        const madaTime =
            getFullTimeString(
                madaParts
            );


        /*
         * États des sessions
         */

        const states =
            SESSIONS.map(function (session) {

                return {
                    session,
                    state: getSessionState(
                        session,
                        now
                    )
                };

            });


        /*
         * Session actuellement ouverte.
         */

        let currentSessions =
            states.filter(function (item) {

                return item.state.open;

            });


        /*
         * Pendant le week-end :
         * aucune session considérée active.
         */

        if (weekend) {
            currentSessions = [];
        }


        /*
         * Session principale.
         *
         * En cas de chevauchement,
         * on choisit la première dans
         * l'ordre Sydney -> Tokyo -> Londres -> NY.
         */

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


        if (current) {

            currentName.textContent =
                current.session.country +
                " " +
                current.session.name;


            currentStatus.textContent =
                "🟢 Session ouverte";


            const closeDate =
                getCloseDate(
                    current.session,
                    now
                );


            currentCountdown.textContent =
                "Fermeture dans " +
                formatCountdown(
                    closeDate.getTime() -
                    now.getTime()
                );

        }

        else {

            currentName.textContent =
                weekend
                    ? "🛑 Marché fermé"
                    : "Aucune session ouverte";


            currentStatus.textContent =
                weekend
                    ? "Week-end"
                    : "Entre deux sessions";


            currentCountdown.textContent =
                madaTime +
                " — heure Madagascar";

        }


        /* =================================================
           PROCHAINE SESSION
           ================================================= */

        const upcoming =
            [];


        SESSIONS.forEach(function (session) {

            let nextDate =
                getNextOpenDate(
                    session,
                    now
                );


            /*
             * Pendant le week-end,
             * les prochaines ouvertures
             * restent valides mais on ne
             * considère aucune session active.
             */

            if (nextDate) {

                upcoming.push({
                    session,
                    date: nextDate
                });

            }

        });


        upcoming.sort(function (a, b) {

            return (
                a.date.getTime() -
                b.date.getTime()
            );

        });


        let next = null;


        for (let i = 0; i < upcoming.length; i++) {

            /*
             * Si la session trouvée est actuellement
             * ouverte, on cherche la suivante.
             */

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
                "Ouverture : " +
                getTimeString(
                    localParts
                ) +
                " " +
                next.session.name +
                " • " +
                getTimeString(
                    nextMadaParts
                ) +
                " Madagascar";


            nextCountdown.textContent =
                "Dans " +
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


        /* =================================================
           MINI CARTES
           ================================================= */

        states.forEach(function (item) {

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


            local.textContent =
                getTimeString(
                    state.parts
                );


            mada.textContent =
                madaTime;


            if (
                state.open &&
                !weekend
            ) {

                card.classList.add(
                    "session-open"
                );


                status.textContent =
                    "🟢 Ouverte";

            }

            else {

                card.classList.remove(
                    "session-open"
                );


                status.textContent =
                    weekend
                        ? "🔴 Fermée"
                        : "⚪ Fermée";

            }

        });

    }


    /* =====================================================
       INITIALISATION
       ===================================================== */

    function init() {

        createPanel();

        createSessionCards();

        updatePanel();


        /*
         * Actualisation chaque seconde
         * pour le compte à rebours.
         */

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
