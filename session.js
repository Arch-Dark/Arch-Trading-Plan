/* =========================================================
   SESSION.JS
   PANNEAU DES SESSIONS DE TRADING

   IMPORTANT :
   - Ce fichier ne touche PAS aux trades.
   - Ce fichier ne touche PAS aux capitaux.
   - Ce fichier ne touche PAS aux calculs.
   - Ce fichier ne touche PAS au localStorage.
   - Ce fichier sert uniquement à afficher les sessions.

   Sessions :
   Sydney
   Tokyo
   Londres
   New York

   Les fuseaux horaires IANA permettent de suivre
   automatiquement les changements hiver / été.

   Week-end :
   Samedi et dimanche = marché fermé.
   ========================================================= */

(function () {

    "use strict";


    /* =========================================================
       CONFIGURATION
       ========================================================= */

    const SESSIONS = [

        {
            id: "sydney",
            name: "Sydney",
            country: "Australie",
            city: "Sydney",
            timezone: "Australia/Sydney",
            open: "08:00",
            close: "17:00"
        },

        {
            id: "tokyo",
            name: "Tokyo",
            country: "Japon",
            city: "Tokyo",
            timezone: "Asia/Tokyo",
            open: "09:00",
            close: "18:00"
        },

        {
            id: "london",
            name: "Londres",
            country: "Royaume-Uni",
            city: "Londres",
            timezone: "Europe/London",
            open: "08:00",
            close: "17:00"
        },

        {
            id: "newyork",
            name: "New York",
            country: "États-Unis",
            city: "New York",
            timezone: "America/New_York",
            open: "08:00",
            close: "17:00"
        }

    ];


    /* =========================================================
       OUTILS DATE / HEURE
       ========================================================= */

    function getParts(date, timezone) {

        const formatter = new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone: timezone,
                weekday: "short",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            }
        );

        const parts = formatter.formatToParts(date);

        const result = {};

        parts.forEach(function (part) {

            if (part.type !== "literal") {
                result[part.type] = part.value;
            }

        });

        return result;
    }


    function getTime(date, timezone) {

        const formatter = new Intl.DateTimeFormat(
            "fr-FR",
            {
                timeZone: timezone,
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            }
        );

        return formatter.format(date);
    }


    function getDate(date, timezone) {

        const formatter = new Intl.DateTimeFormat(
            "fr-FR",
            {
                timeZone: timezone,
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

        return formatter.format(date);
    }


    /* =========================================================
       WEEK-END
       ========================================================= */

    function isWeekend(date) {

        /*
         * On utilise Madagascar comme référence pour le
         * fonctionnement général du panneau.
         */

        const parts = getParts(
            date,
            "Indian/Antananarivo"
        );

        return (
            parts.weekday === "Sat" ||
            parts.weekday === "Sun"
        );
    }


    /* =========================================================
       MINUTES
       ========================================================= */

    function timeToMinutes(time) {

        const pieces = time.split(":");

        return (
            Number(pieces[0]) * 60 +
            Number(pieces[1])
        );
    }


    /* =========================================================
       SESSION OUVERTE ?
       ========================================================= */

    function isSessionOpen(session, date) {

        if (isWeekend(date)) {
            return false;
        }

        const parts = getParts(
            date,
            session.timezone
        );

        const currentMinutes =
            Number(parts.hour) * 60 +
            Number(parts.minute);

        const openMinutes =
            timeToMinutes(session.open);

        const closeMinutes =
            timeToMinutes(session.close);

        return (
            currentMinutes >= openMinutes &&
            currentMinutes < closeMinutes
        );
    }


    /* =========================================================
       SESSION ACTUELLE
       ========================================================= */

    function getCurrentSession(date) {

        for (let i = 0; i < SESSIONS.length; i++) {

            if (
                isSessionOpen(
                    SESSIONS[i],
                    date
                )
            ) {

                return SESSIONS[i];

            }

        }

        return null;
    }


    /* =========================================================
       PROCHAINE OUVERTURE
       ========================================================= */

    function getNextOpening(session, date) {

        /*
         * Recherche jusqu'à 7 jours dans le futur.
         */

        const maxMinutes =
            7 * 24 * 60;


        for (
            let minute = 1;
            minute <= maxMinutes;
            minute++
        ) {

            const testDate =
                new Date(
                    date.getTime() +
                    minute * 60 * 1000
                );


            /*
             * On vérifie l'heure locale de la session.
             */

            const parts =
                getParts(
                    testDate,
                    session.timezone
                );


            const currentHour =
                Number(parts.hour);


            const currentMinute =
                Number(parts.minute);


            const opening =
                timeToMinutes(
                    session.open
                );


            const current =
                currentHour * 60 +
                currentMinute;


            if (
                current === opening &&
                !isWeekend(testDate)
            ) {

                return testDate;

            }

        }


        return null;
    }


    /* =========================================================
       PROCHAINE SESSION
       ========================================================= */

    function getNextSession(date) {

        let result = null;


        for (
            let i = 0;
            i < SESSIONS.length;
            i++
        ) {

            const session =
                SESSIONS[i];


            const opening =
                getNextOpening(
                    session,
                    date
                );


            if (!opening) {
                continue;
            }


            if (
                !result ||
                opening.getTime() <
                result.opening.getTime()
            ) {

                result = {
                    session: session,
                    opening: opening
                };

            }

        }


        return result;
    }


    /* =========================================================
       CRÉATION DU PANNEAU
       ========================================================= */

    function createPanel() {

        /*
         * Si le panneau existe déjà,
         * on ne le recrée pas.
         */

        if (
            document.getElementById(
                "tradingSessionPanel"
            )
        ) {

            return;

        }


        const topbar =
            document.querySelector(
                ".topbar"
            );


        if (!topbar) {
            return;
        }


        /*
         * Recherche du bouton thème.
         */

        const themeButton =
            document.getElementById(
                "themeToggle"
            );


        const panel =
            document.createElement("div");


        panel.id =
            "tradingSessionPanel";


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
         * Insertion du panneau dans le topbar.
         *
         * Aucun autre élément de l'application
         * n'est modifié.
         */

        if (themeButton) {

            topbar.insertBefore(
                panel,
                themeButton
            );

        } else {

            topbar.appendChild(
                panel
            );

        }

    }


    /* =========================================================
       AFFICHAGE SESSION ACTUELLE
       ========================================================= */

    function updateCurrentSession(date) {

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


        /*
         * WEEK-END
         */

        if (isWeekend(date)) {

            name.textContent =
                "🔴 Marchés fermés";


            name.classList.remove(
                "session-open"
            );


            times.innerHTML =
                "🇲🇬 Madagascar : <strong>" +
                getTime(
                    date,
                    "Indian/Antananarivo"
                ) +
                "</strong>";


            return;

        }


        /*
         * SESSION NORMALE
         */

        const session =
            getCurrentSession(date);


        if (!session) {

            name.textContent =
                "⏸️ Entre deux sessions";


            name.classList.remove(
                "session-open"
            );


            times.innerHTML =
                "🇲🇬 Madagascar : <strong>" +
                getTime(
                    date,
                    "Indian/Antananarivo"
                ) +
                "</strong>";


            return;

        }


        name.textContent =
            "🟢 " + session.name;


        name.classList.add(
            "session-open"
        );


        const localTime =
            getTime(
                date,
                session.timezone
            );


        const madagascarTime =
            getTime(
                date,
                "Indian/Antananarivo"
            );


        times.innerHTML =

            "🌍 " +
            session.city +
            " : <strong>" +
            localTime +
            "</strong>" +

            " &nbsp;|&nbsp; " +

            "🇲🇬 Madagascar : <strong>" +
            madagascarTime +
            "</strong>";

    }


    /* =========================================================
       AFFICHAGE PROCHAINE SESSION
       ========================================================= */

    function updateNextSession(date) {

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


        const next =
            getNextSession(date);


        if (!next) {

            name.textContent =
                "—";


            times.textContent =
                "—";


            return;

        }


        const session =
            next.session;


        const opening =
            next.opening;


        name.textContent =
            "⏭️ " + session.name;


        const sessionOpening =
            getTime(
                opening,
                session.timezone
            );


        const madagascarOpening =
            getTime(
                opening,
                "Indian/Antananarivo"
            );


        const sessionDate =
            getDate(
                opening,
                session.timezone
            );


        const madagascarDate =
            getDate(
                opening,
                "Indian/Antananarivo"
            );


        times.innerHTML =

            "🌍 " +
            session.city +
            " : <strong>" +
            sessionOpening +
            "</strong> (" +
            sessionDate +
            ")" +

            " &nbsp;|&nbsp; " +

            "🇲🇬 Madagascar : <strong>" +
            madagascarOpening +
            "</strong> (" +
            madagascarDate +
            ")";

    }


    /* =========================================================
       MISE À JOUR
       ========================================================= */

    function updatePanel() {

        const now =
            new Date();


        updateCurrentSession(
            now
        );


        updateNextSession(
            now
        );

    }


    /* =========================================================
       INITIALISATION
       ========================================================= */

    function init() {

        createPanel();

        updatePanel();


        /*
         * Mise à jour toutes les 30 secondes.
         */

        window.setInterval(
            updatePanel,
            30000
        );

    }


    /* =========================================================
       LANCEMENT
       ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();

    }


    /* =========================================================
       API OPTIONNELLE
       ========================================================= */

    window.TradingSessions = {

        update: updatePanel,

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
