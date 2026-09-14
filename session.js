/* ============================================================
   TRADING SESSIONS — HEURE MADAGASCAR
   ============================================================ */

(function () {

    "use strict";


    /* ============================================================
       CONFIGURATION
       ============================================================ */

    const MADAGASCAR_TIMEZONE =
        "Indian/Antananarivo";


    const SESSIONS = [

        {
            name: "Sydney",
            short: "Sydney",
            emoji: "🌏",
            startUTC: 22,
            endUTC: 7
        },

        {
            name: "Tokyo",
            short: "Tokyo",
            emoji: "🇯🇵",
            startUTC: 0,
            endUTC: 9
        },

        {
            name: "Londres",
            short: "Londres",
            emoji: "🇬🇧",
            startUTC: 8,
            endUTC: 17
        },

        {
            name: "New York",
            short: "New York",
            emoji: "🇺🇸",
            startUTC: 13,
            endUTC: 22
        }

    ];


    /* ============================================================
       STYLE DU PANNEAU
       ============================================================ */

    function injectSessionStyles() {

        const existing =
            document.getElementById(
                "tradingSessionStyles"
            );


        if (existing) {
            existing.remove();
        }


        const style =
            document.createElement("style");


        style.id =
            "tradingSessionStyles";


        style.textContent = `

            /* ====================================================
               PANNEAU PRINCIPAL
               ==================================================== */

            #tradingSessionsPanel {

                position: absolute !important;

                /*
                 * CENTRAGE EXACT DU PANNEAU
                 */
                left: 50% !important;

                top: 50% !important;

                transform:
                    translate(-50%, -50%) !important;

                z-index: 2 !important;

                box-sizing: border-box !important;

                width:
                    min(
                        720px,
                        calc(100% - 430px)
                    ) !important;

                min-width:
                    520px !important;

                max-width:
                    720px !important;

                margin:
                    0 !important;

                padding:
                    9px 16px !important;

                display:
                    block !important;

                border-radius:
                    14px !important;

                border:
                    1px solid
                    rgba(255,255,255,0.12) !important;

                background:
                    linear-gradient(
                        135deg,
                        rgba(255,255,255,0.09),
                        rgba(255,255,255,0.035)
                    ) !important;

                box-shadow:
                    0 8px 28px
                    rgba(0,0,0,0.18) !important;

                backdrop-filter:
                    blur(14px) !important;

                -webkit-backdrop-filter:
                    blur(14px) !important;

                color:
                    inherit !important;

                overflow:
                    hidden !important;

                box-sizing:
                    border-box !important;
            }


            /* ====================================================
               CONTENU PRINCIPAL
               ==================================================== */

            #tradingSessionsPanel .sessions-main {

                display:
                    grid !important;

                grid-template-columns:
                    minmax(0, 1fr)
                    1px
                    minmax(0, 1fr) !important;

                align-items:
                    center !important;

                width:
                    100% !important;

                min-width:
                    0 !important;

                gap:
                    0 !important;
            }


            /* ====================================================
               SESSION ACTUELLE + SESSION SUIVANTE
               ==================================================== */

            #tradingSessionsPanel .session-current,
            #tradingSessionsPanel .session-next {

                display:
                    flex !important;

                align-items:
                    center !important;

                justify-content:
                    flex-start !important;

                gap:
                    9px !important;

                min-width:
                    0 !important;

                width:
                    100% !important;

                box-sizing:
                    border-box !important;

                padding:
                    2px 14px !important;

                white-space:
                    nowrap !important;

                text-align:
                    left !important;

                overflow:
                    hidden !important;
            }


            /* ====================================================
               SÉPARATEUR
               ==================================================== */

            #tradingSessionsPanel .session-divider {

                width:
                    1px !important;

                height:
                    30px !important;

                background:
                    rgba(255,255,255,0.12) !important;

                flex:
                    0 0 1px !important;
            }


            /* ====================================================
               TEXTES
               ==================================================== */

            #tradingSessionsPanel span,
            #tradingSessionsPanel strong,
            #tradingSessionsPanel div {

                box-sizing:
                    border-box !important;
            }


            #tradingSessionsPanel .session-icon {

                flex:
                    0 0 auto !important;

                font-size:
                    1.05rem !important;

                line-height:
                    1 !important;
            }


            #tradingSessionsPanel .session-label {

                display:
                    flex !important;

                flex-direction:
                    column !important;

                justify-content:
                    center !important;

                align-items:
                    flex-start !important;

                min-width:
                    0 !important;

                line-height:
                    1.15 !important;
            }


            #tradingSessionsPanel .session-title {

                font-size:
                    0.82rem !important;

                font-weight:
                    800 !important;

                white-space:
                    nowrap !important;
            }


            #tradingSessionsPanel .session-info {

                margin-top:
                    2px !important;

                font-size:
                    0.70rem !important;

                opacity:
                    0.72 !important;

                white-space:
                    nowrap !important;
            }


            #tradingSessionsPanel .session-countdown {

                margin-left:
                    auto !important;

                flex:
                    0 0 auto !important;

                font-size:
                    0.72rem !important;

                font-weight:
                    700 !important;

                opacity:
                    0.82 !important;

                white-space:
                    nowrap !important;
            }


            /* ====================================================
               WEEK-END
               ==================================================== */

            #tradingSessionsPanel .sessions-weekend {

                display:
                    none !important;

                width:
                    100% !important;

                text-align:
                    center !important;

                font-size:
                    0.76rem !important;

                opacity:
                    0.78 !important;

                padding:
                    3px 0 0 !important;
            }


            #tradingSessionsPanel.weekend
            .sessions-main {

                display:
                    none !important;
            }


            #tradingSessionsPanel.weekend
            .sessions-weekend {

                display:
                    block !important;
            }


            /* ====================================================
               ÉTAT ACTIF
               ==================================================== */

            #tradingSessionsPanel .active-dot {

                width:
                    7px !important;

                height:
                    7px !important;

                border-radius:
                    50% !important;

                background:
                    #22c55e !important;

                box-shadow:
                    0 0 8px
                    rgba(34,197,94,0.65) !important;

                flex:
                    0 0 7px !important;
            }


            /* ====================================================
               RESPONSIVE TABLETTE
               ==================================================== */

            @media (max-width: 1100px) {

                #tradingSessionsPanel {

                    width:
                        calc(100% - 360px) !important;

                    min-width:
                        360px !important;

                    max-width:
                        680px !important;
                }

            }


            /* ====================================================
               RESPONSIVE MOBILE LARGE
               ==================================================== */

            @media (max-width: 900px) {

                .topbar {

                    min-height:
                        150px !important;
                }


                #tradingSessionsPanel {

                    left:
                        50% !important;

                    top:
                        auto !important;

                    bottom:
                        14px !important;

                    transform:
                        translateX(-50%) !important;

                    width:
                        calc(100% - 40px) !important;

                    max-width:
                        680px !important;

                    min-width:
                        0 !important;
                }

            }


            /* ====================================================
               MOBILE
               ==================================================== */

            @media (max-width: 700px) {

                .topbar {

                    padding:
                        18px 4% !important;

                    min-height:
                        190px !important;

                    align-items:
                        flex-start !important;
                }


                #tradingSessionsPanel {

                    left:
                        4% !important;

                    right:
                        4% !important;

                    bottom:
                        12px !important;

                    width:
                        auto !important;

                    max-width:
                        none !important;

                    min-width:
                        0 !important;

                    transform:
                        none !important;

                    padding:
                        8px 10px !important;
                }


                #tradingSessionsPanel
                .session-current,
                #tradingSessionsPanel
                .session-next {

                    padding:
                        2px 7px !important;

                    gap:
                        6px !important;
                }


                #tradingSessionsPanel
                .session-title {

                    font-size:
                        0.76rem !important;
                }


                #tradingSessionsPanel
                .session-info {

                    font-size:
                        0.64rem !important;
                }


                #tradingSessionsPanel
                .session-countdown {

                    font-size:
                        0.64rem !important;
                }

            }


            /* ====================================================
               PETIT MOBILE
               ==================================================== */

            @media (max-width: 500px) {

                #tradingSessionsPanel
                .sessions-main {

                    grid-template-columns:
                        minmax(0, 1fr)
                        1px
                        minmax(0, 1fr) !important;
                }


                #tradingSessionsPanel
                .session-countdown {

                    display:
                        none !important;
                }

            }

        `;


        document.head.appendChild(style);

    }


    /* ============================================================
       UTILITAIRES TEMPS
       ============================================================ */

    function getMadagascarDate() {

        const now =
            new Date();


        const parts =
            new Intl.DateTimeFormat(
                "en-US",
                {
                    timeZone:
                        MADAGASCAR_TIMEZONE,

                    year:
                        "numeric",

                    month:
                        "2-digit",

                    day:
                        "2-digit",

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    second:
                        "2-digit",

                    hourCycle:
                        "h23"
                }
            ).formatToParts(now);


        const values = {};


        parts.forEach(
            function (part) {

                if (
                    part.type !==
                    "literal"
                ) {

                    values[part.type] =
                        Number(part.value);

                }

            }
        );


        return {

            year:
                values.year,

            month:
                values.month,

            day:
                values.day,

            hour:
                values.hour,

            minute:
                values.minute,

            second:
                values.second
        };

    }


    function getUTCDateForMadagascar() {

        const madagascar =
            getMadagascarDate();


        return new Date(
            Date.UTC(
                madagascar.year,
                madagascar.month - 1,
                madagascar.day,
                madagascar.hour,
                madagascar.minute,
                madagascar.second
            )
        );

    }


    function formatTime(
        hour,
        minute
    ) {

        return (
            String(hour).padStart(2, "0")
            +
            ":"
            +
            String(minute).padStart(2, "0")
        );

    }


    function formatCountdown(
        milliseconds
    ) {

        if (
            milliseconds <= 0
        ) {

            return "00:00:00";

        }


        const totalSeconds =
            Math.floor(
                milliseconds / 1000
            );


        const hours =
            Math.floor(
                totalSeconds / 3600
            );


        const minutes =
            Math.floor(
                (totalSeconds % 3600) / 60
            );


        const seconds =
            totalSeconds % 60;


        return (
            String(hours).padStart(2, "0")
            +
            ":"
            +
            String(minutes).padStart(2, "0")
            +
            ":"
            +
            String(seconds).padStart(2, "0")
        );

    }


    /* ============================================================
       CONVERSION SESSION
       ============================================================ */

    function getSessionWindow(
        session,
        referenceDate
    ) {

        const year =
            referenceDate.getUTCFullYear();


        const month =
            referenceDate.getUTCMonth();


        const day =
            referenceDate.getUTCDate();


        let start =
            new Date(
                Date.UTC(
                    year,
                    month,
                    day,
                    session.startUTC,
                    0,
                    0
                )
            );


        let end =
            new Date(
                Date.UTC(
                    year,
                    month,
                    day,
                    session.endUTC,
                    0,
                    0
                )
            );


        /*
         * Les sessions Sydney et autres pouvant
         * traverser minuit UTC.
         */
        if (
            session.endUTC <=
            session.startUTC
        ) {

            end.setUTCDate(
                end.getUTCDate() + 1
            );

        }


        return {
            start,
            end
        };

    }


    /* ============================================================
       SESSION ACTUELLE
       ============================================================ */

    function getCurrentSession(
        now
    ) {

        for (
            let i = 0;
            i < SESSIONS.length;
            i++
        ) {

            const session =
                SESSIONS[i];


            const window =
                getSessionWindow(
                    session,
                    now
                );


            if (
                now >= window.start &&
                now < window.end
            ) {

                return {
                    session,
                    start:
                        window.start,
                    end:
                        window.end,
                    index:
                        i
                };

            }

        }


        /*
         * Cas où une session commencée
         * la veille traverse minuit.
         */
        const yesterday =
            new Date(now);


        yesterday.setUTCDate(
            yesterday.getUTCDate() - 1
        );


        for (
            let i = 0;
            i < SESSIONS.length;
            i++
        ) {

            const session =
                SESSIONS[i];


            const window =
                getSessionWindow(
                    session,
                    yesterday
                );


            if (
                now >= window.start &&
                now < window.end
            ) {

                return {
                    session,
                    start:
                        window.start,
                    end:
                        window.end,
                    index:
                        i
                };

            }

        }


        return null;

    }


    /* ============================================================
       SESSION SUIVANTE
       ============================================================ */

    function getNextSession(
        now
    ) {

        let best =
            null;


        for (
            let dayOffset = 0;
            dayOffset <= 2;
            dayOffset++
        ) {

            const reference =
                new Date(now);


            reference.setUTCDate(
                reference.getUTCDate()
                +
                dayOffset
            );


            for (
                let i = 0;
                i < SESSIONS.length;
                i++
            ) {

                const session =
                    SESSIONS[i];


                const window =
                    getSessionWindow(
                        session,
                        reference
                    );


                if (
                    window.start <= now
                ) {

                    continue;

                }


                if (
                    !best ||
                    window.start <
                    best.start
                ) {

                    best = {
                        session,
                        start:
                            window.start,
                        end:
                            window.end,
                        index:
                            i
                    };

                }

            }

        }


        return best;

    }


    /* ============================================================
       CRÉATION DU PANNEAU
       ============================================================ */

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

                    <div
                        class="session-current"
                        id="sessionCurrent"
                    ></div>


                    <div
                        class="session-divider"
                    ></div>


                    <div
                        class="session-next"
                        id="sessionNext"
                    ></div>

                </div>


                <div
                    class="sessions-weekend"
                    id="sessionsWeekend"
                >
                    💤 Marché fermé — reprise prochaine session
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


        return panel;

    }


    /* ============================================================
       MISE À JOUR DU PANNEAU
       ============================================================ */

    function updatePanel() {

        const panel =
            document.getElementById(
                "tradingSessionsPanel"
            );


        if (!panel) {
            return;
        }


        const currentElement =
            document.getElementById(
                "sessionCurrent"
            );


        const nextElement =
            document.getElementById(
                "sessionNext"
            );


        const weekendElement =
            document.getElementById(
                "sessionsWeekend"
            );


        if (
            !currentElement ||
            !nextElement
        ) {

            return;

        }


        const now =
            getUTCDateForMadagascar();


        const madagascarNow =
            getMadagascarDate();


        /*
         * Samedi = 6
         * Dimanche = 0
         */
        const day =
            new Date(
                Date.UTC(
                    madagascarNow.year,
                    madagascarNow.month - 1,
                    madagascarNow.day
                )
            ).getUTCDay();


        /*
         * Fermeture du marché durant le week-end.
         */
        if (
            day === 0 ||
            day === 6
        ) {

            panel.classList.add(
                "weekend"
            );


            if (weekendElement) {

                weekendElement.textContent =
                    "💤 Marché fermé — reprise des sessions lundi";

            }


            return;

        }


        panel.classList.remove(
            "weekend"
        );


        const current =
            getCurrentSession(
                now
            );


        const next =
            getNextSession(
                now
            );


        /* ========================================================
           SESSION ACTUELLE
           ======================================================== */

        if (current) {

            const remaining =
                current.end.getTime()
                -
                now.getTime();


            currentElement.innerHTML = `

                <span class="session-icon">
                    ${current.session.emoji}
                </span>

                <span class="active-dot"></span>

                <span class="session-label">

                    <strong class="session-title">
                        ${current.session.short}
                    </strong>

                    <span class="session-info">
                        Active ·
                        ${formatSessionTime(
                            current.session,
                            current.start
                        )}
                    </span>

                </span>

                <span class="session-countdown">
                    ${formatCountdown(remaining)}
                </span>

            `;

        }

        else {

            currentElement.innerHTML = `

                <span class="session-icon">
                    🌙
                </span>

                <span class="session-label">

                    <strong class="session-title">
                        Aucune session
                    </strong>

                    <span class="session-info">
                        Marché entre deux sessions
                    </span>

                </span>

            `;

        }


        /* ========================================================
           SESSION SUIVANTE
           ======================================================== */

        if (next) {

            const untilNext =
                next.start.getTime()
                -
                now.getTime();


            nextElement.innerHTML = `

                <span class="session-icon">
                    ${next.session.emoji}
                </span>

                <span class="session-label">

                    <strong class="session-title">
                        ${next.session.short}
                    </strong>

                    <span class="session-info">
                        Prochaine ·
                        ${formatSessionTime(
                            next.session,
                            next.start
                        )}
                    </span>

                </span>

                <span class="session-countdown">
                    ${formatCountdown(untilNext)}
                </span>

            `;

        }

        else {

            nextElement.innerHTML = `

                <span class="session-icon">
                    🌙
                </span>

                <span class="session-label">

                    <strong class="session-title">
                        Prochaine session
                    </strong>

                    <span class="session-info">
                        Calcul en cours...
                    </span>

                </span>

            `;

        }

    }


    /* ============================================================
       AFFICHAGE DES HORAIRES EN HEURE MADAGASCAR
       ============================================================ */

    function formatSessionTime(
        session,
        utcDate
    ) {

        const parts =
            new Intl.DateTimeFormat(
                "fr-FR",
                {
                    timeZone:
                        MADAGASCAR_TIMEZONE,

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    hourCycle:
                        "h23"
                }
            ).formatToParts(
                utcDate
            );


        let hour =
            "00";


        let minute =
            "00";


        parts.forEach(
            function (part) {

                if (
                    part.type ===
                    "hour"
                ) {

                    hour =
                        part.value;

                }


                if (
                    part.type ===
                    "minute"
                ) {

                    minute =
                        part.value;

                }

            }
        );


        return (
            hour
            +
            ":"
            +
            minute
            +
            " Mada"
        );

    }


    /* ============================================================
       INITIALISATION
       ============================================================ */

    function initialize() {

        injectSessionStyles();

        createPanel();

        updatePanel();


        setInterval(
            updatePanel,
            1000
        );

    }


    /* ============================================================
       ATTENDRE QUE LE DOM SOIT PRÊT
       ============================================================ */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    }

    else {

        initialize();

    }

})();
