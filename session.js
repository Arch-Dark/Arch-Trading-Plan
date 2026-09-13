```javascript
/* =========================================================
   SESSION.JS
   Gestion automatique des sessions de trading

   Sessions :
   - Sydney
   - Tokyo
   - Londres
   - New York

   Le système utilise les fuseaux horaires IANA.
   Cela permet de suivre automatiquement les changements
   hiver / été (DST) selon les pays.

   IMPORTANT :
   Ce fichier ne modifie AUCUN calcul de trading.
   ========================================================= */

(function () {

    "use strict";


    /* =========================================================
       CONFIGURATION DES SESSIONS
       ========================================================= */

    const tradingSessions = [

        {
            id: "sydney",
            name: "Sydney",
            country: "Australie",
            timezone: "Australia/Sydney",
            city: "Sydney",

            // Horaires locaux de la session
            openHour: 8,
            closeHour: 17
        },

        {
            id: "tokyo",
            name: "Tokyo",
            country: "Japon",
            timezone: "Asia/Tokyo",
            city: "Tokyo",

            openHour: 9,
            closeHour: 18
        },

        {
            id: "london",
            name: "Londres",
            country: "Royaume-Uni",
            timezone: "Europe/London",
            city: "Londres",

            openHour: 8,
            closeHour: 17
        },

        {
            id: "newyork",
            name: "New York",
            country: "États-Unis",
            timezone: "America/New_York",
            city: "New York",

            openHour: 8,
            closeHour: 17
        }

    ];


    /* =========================================================
       ÉLÉMENTS DU PANNEAU
       ========================================================= */

    let currentSessionElement = null;
    let nextSessionElement = null;


    /* =========================================================
       CRÉATION DU PANNEAU
       ========================================================= */

    function createSessionPanel() {

        if (document.getElementById("tradingSessionPanel")) {
            return;
        }


        const topbar = document.querySelector(".topbar");

        if (!topbar) {
            return;
        }


        const panel = document.createElement("div");

        panel.id = "tradingSessionPanel";

        panel.innerHTML = `

            <div class="session-panel-inner">

                <div class="session-current">

                    <div class="session-label">
                        SESSION ACTUELLE
                    </div>

                    <div
                        id="currentSessionName"
                        class="session-name"
                    >
                        —
                    </div>

                    <div
                        id="currentSessionTimes"
                        class="session-times"
                    >
                        —
                    </div>

                </div>


                <div class="session-divider"></div>


                <div class="session-next">

                    <div class="session-label">
                        PROCHAINE SESSION
                    </div>

                    <div
                        id="nextSessionName"
                        class="session-name"
                    >
                        —
                    </div>

                    <div
                        id="nextSessionTimes"
                        class="session-times"
                    >
                        —
                    </div>

                </div>

            </div>

        `;


        /*
         * Le panneau est placé entre le bloc texte du topbar
         * et le bouton thème.
         */

        const themeButton =
            document.getElementById("themeToggle");


        if (themeButton) {

            topbar.insertBefore(
                panel,
                themeButton
            );

        } else {

            topbar.appendChild(panel);

        }


        currentSessionElement =
            document.getElementById("currentSessionName");


        nextSessionElement =
            document.getElementById("nextSessionName");

    }


    /* =========================================================
       OBTENIR L'HEURE DANS UN FUSEAU
       ========================================================= */

    function getTimeInTimezone(timezone, date) {

        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                timeZone: timezone,
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            }
        ).format(date);

    }


    /* =========================================================
       OBTENIR DATE + HEURE DANS UN FUSEAU
       ========================================================= */

    function getDateParts(timezone, date) {

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
                    hour12: false
                }
            );


        const parts =
            formatter.formatToParts(date);


        const result = {};


        parts.forEach(function (part) {

            if (part.type !== "literal") {
                result[part.type] = part.value;
            }

        });


        return result;

    }


    /* =========================================================
       VÉRIFIER SI UNE SESSION EST OUVERTE
       ========================================================= */

    function isSessionOpen(session, date) {

        const parts =
            getDateParts(
                session.timezone,
                date
            );


        const hour =
            Number(parts.hour);


        const minute =
            Number(parts.minute);


        const currentMinutes =
            hour * 60 + minute;


        const openMinutes =
            session.openHour * 60;


        const closeMinutes =
            session.closeHour * 60;


        return (
            currentMinutes >= openMinutes &&
            currentMinutes < closeMinutes
        );

    }


    /* =========================================================
       FORMATER L'HEURE
       ========================================================= */

    function formatHour(hour) {

        return String(hour).padStart(2, "0") + ":00";

    }


    /* =========================================================
       OBTENIR L'HEURE DE MADAGASCAR
       ========================================================= */

    function getMadagascarTime(date) {

        return getTimeInTimezone(
            "Indian/Antananarivo",
            date
        );

    }


    /* =========================================================
       OBTENIR LA DATE DU JOUR À MADAGASCAR
       ========================================================= */

    function getMadagascarDateParts(date) {

        return getDateParts(
            "Indian/Antananarivo",
            date
        );

    }


    /* =========================================================
       CALCUL DE LA PROCHAINE OUVERTURE
       ========================================================= */

    function getNextOpening(session, now) {

        /*
         * On cherche minute par minute à partir de maintenant.
         *
         * Cela permet de respecter correctement les changements
         * de jour et les fuseaux horaires.
         */

        const maxMinutes = 60 * 48;


        for (
            let i = 0;
            i <= maxMinutes;
            i++
        ) {

            const testDate =
                new Date(
                    now.getTime() +
                    i * 60 * 1000
                );


            const parts =
                getDateParts(
                    session.timezone,
                    testDate
                );


            const hour =
                Number(parts.hour);


            const minute =
                Number(parts.minute);


            if (
                hour === session.openHour &&
                minute === 0
            ) {

                if (
                    testDate.getTime() >
                    now.getTime()
                ) {

                    return testDate;

                }

            }

        }


        return null;

    }


    /* =========================================================
       TROUVER SESSION ACTUELLE
       ========================================================= */

    function getCurrentSession(now) {

        const openedSessions =
            tradingSessions.filter(
                function (session) {

                    return isSessionOpen(
                        session,
                        now
                    );

                }
            );


        /*
         * Plusieurs sessions peuvent être ouvertes
         * simultanément pendant les périodes de chevauchement.
         *
         * On conserve la première selon l'ordre :
         * Sydney → Tokyo → Londres → New York.
         */

        if (openedSessions.length > 0) {
            return openedSessions[0];
        }


        return null;

    }


    /* =========================================================
       TROUVER PROCHAINE SESSION
       ========================================================= */

    function getNextSession(now) {

        let nextSession = null;
        let nextOpening = null;


        tradingSessions.forEach(
            function (session) {

                const opening =
                    getNextOpening(
                        session,
                        now
                    );


                if (!opening) {
                    return;
                }


                if (
                    !nextOpening ||
                    opening.getTime() <
                    nextOpening.getTime()
                ) {

                    nextOpening = opening;
                    nextSession = session;

                }

            }
        );


        if (!nextSession) {
            return null;
        }


        return {
            session: nextSession,
            opening: nextOpening
        };

    }


    /* =========================================================
       TEXTE SESSION ACTUELLE
       ========================================================= */

    function updateCurrentSession(session, now) {

        const name =
            document.getElementById(
                "currentSessionName"
            );


        const times =
            document.getElementById(
                "currentSessionTimes"
            );


        if (!name || !times) {
            return;
        }


        if (!session) {

            name.textContent =
                "Aucune session principale";

            name.classList.remove(
                "session-open"
            );


            times.textContent =
                "Marché entre deux sessions";

            return;

        }


        name.textContent =
            "🟢 " + session.name;


        name.classList.add(
            "session-open"
        );


        const sessionLocalTime =
            getTimeInTimezone(
                session.timezone,
                now
            );


        const madaTime =
            getMadagascarTime(now);


        times.innerHTML =
            "🌍 " +
            session.city +
            " : <strong>" +
            sessionLocalTime +
            "</strong>" +
            " &nbsp;|&nbsp; " +
            "🇲🇬 Madagascar : <strong>" +
            madaTime +
            "</strong>";

    }


    /* =========================================================
       TEXTE PROCHAINE SESSION
       ========================================================= */

    function updateNextSession(nextData, now) {

        const name =
            document.getElementById(
                "nextSessionName"
            );


        const times =
            document.getElementById(
                "nextSessionTimes"
            );


        if (!name || !times) {
            return;
        }


        if (!nextData) {

            name.textContent =
                "—";

            times.textContent =
                "—";

            return;

        }


        const session =
            nextData.session;


        const opening =
            nextData.opening;


        name.textContent =
            "⏭️ " + session.name;


        const sessionOpeningTime =
            getTimeInTimezone(
                session.timezone,
                opening
            );


        const madaOpeningTime =
            getMadagascarTime(
                opening
            );


        times.innerHTML =
            "🌍 Ouverture " +
            session.city +
            " : <strong>" +
            sessionOpeningTime +
            "</strong>" +
            " &nbsp;|&nbsp; " +
            "🇲🇬 Madagascar : <strong>" +
            madaOpeningTime +
            "</strong>";

    }


    /* =========================================================
       MISE À JOUR GÉNÉRALE
       ========================================================= */

    function updateSessions() {

        const now = new Date();


        const currentSession =
            getCurrentSession(now);


        const nextSession =
            getNextSession(now);


        updateCurrentSession(
            currentSession,
            now
        );


        updateNextSession(
            nextSession,
            now
        );

    }


    /* =========================================================
       INITIALISATION
       ========================================================= */

    function initSessionSystem() {

        createSessionPanel();

        updateSessions();


        /*
         * Mise à jour toutes les 30 secondes.
         */

        setInterval(
            updateSessions,
            30000
        );

    }


    /* =========================================================
       LANCEMENT APRÈS CHARGEMENT DE LA PAGE
       ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initSessionSystem
        );

    } else {

        initSessionSystem();

    }


    /* =========================================================
       EXPOSITION OPTIONNELLE
       ========================================================= */

    window.TradingSessions = {

        update: updateSessions,

        getCurrent: function () {

            return getCurrentSession(
                new Date()
            );

        },

        getNext: function () {

            return getNextSession(
                new Date()
            );

        }

    };

})();
```
