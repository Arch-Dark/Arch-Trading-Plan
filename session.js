/* =========================================================
   SESSION.JS
   Trading Sessions — Madagascar Time
   ========================================================= */

(function () {
    "use strict";


    /* =====================================================
       CONFIGURATION
       ===================================================== */

    const MADAGASCAR_TIMEZONE =
        "Indian/Antananarivo";


    const SESSIONS = [
        {
            id: "sydney",
            name: "Sydney",
            open: "22:00",
            close: "07:00"
        },

        {
            id: "tokyo",
            name: "Tokyo",
            open: "00:00",
            close: "09:00"
        },

        {
            id: "london",
            name: "Londres",
            open: "08:00",
            close: "17:00"
        },

        {
            id: "newyork",
            name: "New York",
            open: "13:00",
            close: "22:00"
        }
    ];


    /* =====================================================
       UTILITAIRES
       ===================================================== */

    function pad(value) {
        return String(value).padStart(2, "0");
    }


    function getMadagascarParts(date) {

        const formatter =
            new Intl.DateTimeFormat(
                "en-GB",
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
            );


        const parts =
            formatter.formatToParts(date);


        const result = {};


        parts.forEach(
            function (part) {

                if (
                    part.type !==
                    "literal"
                ) {
                    result[part.type] =
                        part.value;
                }
            }
        );


        return {
            year:
                Number(result.year),

            month:
                Number(result.month),

            day:
                Number(result.day),

            hour:
                Number(result.hour),

            minute:
                Number(result.minute),

            second:
                Number(result.second)
        };
    }


    function minutesFromMidnight(
        hour,
        minute
    ) {

        return (
            Number(hour) * 60 +
            Number(minute)
        );
    }


    function timeToMinutes(
        time
    ) {

        const parts =
            String(time).split(":");


        return (
            Number(parts[0]) * 60 +
            Number(parts[1])
        );
    }


    function formatCountdown(
        milliseconds
    ) {

        if (
            !Number.isFinite(
                milliseconds
            )
        ) {
            return "--:--:--";
        }


        if (
            milliseconds < 0
        ) {
            milliseconds = 0;
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
                (totalSeconds % 3600) /
                60
            );


        const seconds =
            totalSeconds % 60;


        return (
            pad(hours) +
            ":" +
            pad(minutes) +
            ":" +
            pad(seconds)
        );
    }


    /* =====================================================
       CRÉATION D'UNE DATE MADAGASCAR
       ===================================================== */

    function createMadagascarDate(
        year,
        month,
        day,
        hour,
        minute,
        second
    ) {

        const target =
            Date.UTC(
                year,
                month - 1,
                day,
                hour,
                minute,
                second || 0
            );


        /*
         * Madagascar est UTC+3.
         * On convertit ici l'heure locale
         * de Madagascar vers un timestamp UTC.
         */

        return new Date(
            target -
            (3 * 60 * 60 * 1000)
        );
    }


    /* =====================================================
       CALCUL D'UNE SESSION
       ===================================================== */

    function getSessionWindow(
        session,
        currentDate
    ) {

        const parts =
            getMadagascarParts(
                currentDate
            );


        const currentMinutes =
            minutesFromMidnight(
                parts.hour,
                parts.minute
            );


        const openMinutes =
            timeToMinutes(
                session.open
            );


        const closeMinutes =
            timeToMinutes(
                session.close
            );


        let isOpen =
            false;


        /*
         * Session normale :
         * 08:00 -> 17:00
         */

        if (
            openMinutes <
            closeMinutes
        ) {

            isOpen =
                currentMinutes >=
                openMinutes &&
                currentMinutes <
                closeMinutes;

        } else {

            /*
             * Session qui traverse minuit :
             * 22:00 -> 07:00
             */

            isOpen =
                currentMinutes >=
                openMinutes ||
                currentMinutes <
                closeMinutes;
        }


        let openDate;
        let closeDate;


        if (
            openMinutes <
            closeMinutes
        ) {

            openDate =
                createMadagascarDate(
                    parts.year,
                    parts.month,
                    parts.day,
                    Number(
                        session.open
                            .split(":")[0]
                    ),
                    Number(
                        session.open
                            .split(":")[1]
                    ),
                    0
                );


            closeDate =
                createMadagascarDate(
                    parts.year,
                    parts.month,
                    parts.day,
                    Number(
                        session.close
                            .split(":")[0]
                    ),
                    Number(
                        session.close
                            .split(":")[1]
                    ),
                    0
                );

        } else {

            if (
                currentMinutes <
                closeMinutes
            ) {

                const previousDay =
                    new Date(
                        createMadagascarDate(
                            parts.year,
                            parts.month,
                            parts.day,
                            0,
                            0,
                            0
                        ).getTime()
                    );


                previousDay.setUTCDate(
                    previousDay.getUTCDate() -
                    1
                );


                const previousParts =
                    getMadagascarParts(
                        previousDay
                    );


                openDate =
                    createMadagascarDate(
                        previousParts.year,
                        previousParts.month,
                        previousParts.day,
                        Number(
                            session.open
                                .split(":")[0]
                        ),
                        Number(
                            session.open
                                .split(":")[1]
                        ),
                        0
                    );


                closeDate =
                    createMadagascarDate(
                        parts.year,
                        parts.month,
                        parts.day,
                        Number(
                            session.close
                                .split(":")[0]
                        ),
                        Number(
                            session.close
                                .split(":")[1]
                        ),
                        0
                    );

            } else {

                openDate =
                    createMadagascarDate(
                        parts.year,
                        parts.month,
                        parts.day,
                        Number(
                            session.open
                                .split(":")[0]
                        ),
                        Number(
                            session.open
                                .split(":")[1]
                        ),
                        0
                    );


                const nextDay =
                    new Date(
                        openDate.getTime()
                    );


                nextDay.setUTCDate(
                    nextDay.getUTCDate() +
                    1
                );


                const nextParts =
                    getMadagascarParts(
                        nextDay
                    );


                closeDate =
                    createMadagascarDate(
                        nextParts.year,
                        nextParts.month,
                        nextParts.day,
                        Number(
                            session.close
                                .split(":")[0]
                        ),
                        Number(
                            session.close
                                .split(":")[1]
                        ),
                        0
                    );
            }
        }


        return {
            session:
                session,

            isOpen:
                isOpen,

            openDate:
                openDate,

            closeDate:
                closeDate
        };
    }


    /* =====================================================
       SESSION ACTUELLE
       ===================================================== */

    function getCurrentSession(
        now
    ) {

        const activeSessions =
            [];


        SESSIONS.forEach(
            function (session) {

                const window =
                    getSessionWindow(
                        session,
                        now
                    );


                if (
                    window.isOpen
                ) {

                    activeSessions.push(
                        window
                    );
                }
            }
        );


        if (
            activeSessions.length === 0
        ) {
            return null;
        }


        /*
         * Si plusieurs sessions sont
         * ouvertes simultanément,
         * on garde celle qui a commencé
         * le plus récemment.
         */

        activeSessions.sort(
            function (a, b) {

                return (
                    b.openDate.getTime() -
                    a.openDate.getTime()
                );
            }
        );


        return activeSessions[0];
    }


    /* =====================================================
       PROCHAINE SESSION
       ===================================================== */

    function getNextSession(
        now
    ) {

        const candidates =
            [];


        const nowParts =
            getMadagascarParts(
                now
            );


        SESSIONS.forEach(
            function (session) {

                const openMinutes =
                    timeToMinutes(
                        session.open
                    );


                let candidate =
                    createMadagascarDate(
                        nowParts.year,
                        nowParts.month,
                        nowParts.day,
                        Number(
                            session.open
                                .split(":")[0]
                        ),
                        Number(
                            session.open
                                .split(":")[1]
                        ),
                        0
                    );


                if (
                    candidate.getTime() <=
                    now.getTime()
                ) {

                    candidate.setUTCDate(
                        candidate.getUTCDate() +
                        1
                    );
                }


                candidates.push({
                    session:
                        session,

                    date:
                        candidate,

                    minutes:
                        openMinutes
                });
            }
        );


        candidates.sort(
            function (a, b) {

                return (
                    a.date.getTime() -
                    b.date.getTime()
                );
            }
        );


        return (
            candidates.length
                ? candidates[0]
                : null
        );
    }


    /* =====================================================
       WEEK-END
       ===================================================== */

    function isWeekend(
        date
    ) {

        const parts =
            getMadagascarParts(
                date
            );


        const localDate =
            createMadagascarDate(
                parts.year,
                parts.month,
                parts.day,
                12,
                0,
                0
            );


        const day =
            localDate.getUTCDay();


        return (
            day === 0 ||
            day === 6
        );
    }


    /* =====================================================
       INJECTION DU CSS
       ===================================================== */

    function injectSessionStyles() {

        const existing =
            document.getElementById(
                "tradingSessionStyles"
            );


        if (existing) {
            existing.remove();
        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "tradingSessionStyles";


        style.textContent = `

/* =====================================================
   SESSION PANEL
   ===================================================== */

#tradingSessionsPanel {

    position: absolute !important;

    left: calc(50% - 35px) !important;

    top: 50% !important;

    transform:
        translate(-50%, -50%) !important;

    z-index: 2 !important;

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

    box-sizing:
        border-box !important;

    flex:
        none !important;

    flex-shrink:
        0 !important;

    border:
        1px solid
        rgba(
            255,
            255,
            255,
            0.12
        ) !important;

    border-radius:
        14px !important;

    background:
        linear-gradient(
            135deg,
            rgba(
                255,
                255,
                255,
                0.09
            ),
            rgba(
                255,
                255,
                255,
                0.035
            )
        ) !important;

    box-shadow:
        0 7px 24px
        rgba(
            0,
            0,
            0,
            0.18
        ),
        inset 0 1px 0
        rgba(
            255,
            255,
            255,
            0.06
        ) !important;

    backdrop-filter:
        blur(14px) !important;

    -webkit-backdrop-filter:
        blur(14px) !important;

    overflow:
        visible !important;

    pointer-events:
        auto !important;
}


/* =====================================================
   CONTENU PRINCIPAL
   ===================================================== */

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


/* =====================================================
   SESSION ACTUELLE / PROCHAINE
   ===================================================== */

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

    padding:
        3px 16px !important;

    box-sizing:
        border-box !important;

    text-align:
        left !important;

    white-space:
        nowrap !important;
}


#tradingSessionsPanel .session-current {

    grid-column:
        1 !important;

    grid-row:
        1 !important;

    padding-right:
        28px !important;
}


#tradingSessionsPanel .session-next {

    grid-column:
        3 !important;

    grid-row:
        1 !important;

    padding-left:
        28px !important;
}


/* =====================================================
   SÉPARATEUR
   ===================================================== */

#tradingSessionsPanel .sessions-main::after {

    content:
        "" !important;

    grid-column:
        2 !important;

    grid-row:
        1 !important;

    width:
        1px !important;

    height:
        30px !important;

    justify-self:
        center !important;

    background:
        rgba(
            255,
            255,
            255,
            0.14
        ) !important;
}


/* =====================================================
   LABELS
   ===================================================== */

#tradingSessionsPanel .session-label {

    display:
        inline-block !important;

    flex:
        0 0 auto !important;

    font-size:
        8px !important;

    font-weight:
        800 !important;

    letter-spacing:
        0.8px !important;

    text-transform:
        uppercase !important;

    opacity:
        0.48 !important;

    white-space:
        nowrap !important;
}


/* =====================================================
   NOMS
   ===================================================== */

#tradingSessionsPanel .session-current-name,
#tradingSessionsPanel .session-next-name {

    display:
        inline-block !important;

    flex:
        0 0 auto !important;

    font-size:
        12px !important;

    font-weight:
        800 !important;

    line-height:
        1.2 !important;

    white-space:
        nowrap !important;
}


#tradingSessionsPanel .session-current-name.open {

    color:
        #4ade80 !important;
}


/* =====================================================
   STATUT
   ===================================================== */

#tradingSessionsPanel .session-status {

    display:
        inline-block !important;

    flex:
        0 0 auto !important;

    font-size:
        9px !important;

    font-weight:
        700 !important;

    opacity:
        0.70 !important;

    white-space:
        nowrap !important;
}


/* =====================================================
   HEURE
   ===================================================== */

#tradingSessionsPanel .session-time-line {

    display:
        inline-block !important;

    flex:
        0 0 auto !important;

    font-size:
        9px !important;

    font-weight:
        600 !important;

    opacity:
        0.68 !important;

    white-space:
        nowrap !important;
}


/* =====================================================
   COUNTDOWN
   ===================================================== */

#tradingSessionsPanel .session-countdown {

    display:
        inline-flex !important;

    align-items:
        center !important;

    justify-content:
        center !important;

    flex:
        0 0 auto !important;

    min-width:
        max-content !important;

    padding:
        5px 8px !important;

    border-radius:
        7px !important;

    font-size:
        9px !important;

    font-weight:
        800 !important;

    line-height:
        1 !important;

    white-space:
        nowrap !important;

    background:
        rgba(
            255,
            255,
            255,
            0.07
        ) !important;

    border:
        1px solid
        rgba(
            255,
            255,
            255,
            0.06
        ) !important;
}


#tradingSessionsPanel .session-countdown.small {

    color:
        #7dd3fc !important;

    background:
        rgba(
            56,
            189,
            248,
            0.10
        ) !important;

    border-color:
        rgba(
            56,
            189,
            248,
            0.16
        ) !important;
}


/* =====================================================
   WEEK-END
   ===================================================== */

#tradingSessionsPanel .sessions-weekend {

    display:
        inline-flex !important;

    align-items:
        center !important;

    justify-content:
        center !important;

    width:
        100% !important;

    box-sizing:
        border-box !important;

    margin-top:
        6px !important;

    padding:
        4px 8px !important;

    border-radius:
        7px !important;

    font-size:
        8px !important;

    font-weight:
        800 !important;

    white-space:
        nowrap !important;

    color:
        #fca5a5 !important;

    background:
        rgba(
            239,
            68,
            68,
            0.09
        ) !important;

    border:
        1px solid
        rgba(
            239,
            68,
            68,
            0.14
        ) !important;
}


/* =====================================================
   TABLETTE
   ===================================================== */

@media (max-width: 1100px) {

    #tradingSessionsPanel {

        left:
            calc(
                50% - 20px
            ) !important;

        width:
            min(
                620px,
                calc(100% - 360px)
            ) !important;

        min-width:
            440px !important;

        max-width:
            620px !important;
    }


    #tradingSessionsPanel
    .session-current {

        padding-right:
            18px !important;
    }


    #tradingSessionsPanel
    .session-next {

        padding-left:
            18px !important;
    }


    #tradingSessionsPanel
    .session-label {

        display:
            none !important;
    }
}


/* =====================================================
   TABLETTE / PETIT ÉCRAN
   ===================================================== */

@media (max-width: 900px) {

    #tradingSessionsPanel {

        top:
            auto !important;

        bottom:
            14px !important;

        left:
            50% !important;

        transform:
            translateX(-50%) !important;

        width:
            calc(
                100% - 40px
            ) !important;

        max-width:
            680px !important;

        min-width:
            0 !important;
    }
}


/* =====================================================
   MOBILE
   ===================================================== */

@media (max-width: 700px) {

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
            8px 12px !important;
    }


    #tradingSessionsPanel
    .sessions-main {

        grid-template-columns:
            1fr !important;

        gap:
            8px !important;
    }


    #tradingSessionsPanel
    .session-current,
    #tradingSessionsPanel
    .session-next {

        grid-column:
            1 !important;

        grid-row:
            auto !important;

        width:
            100% !important;

        justify-content:
            flex-start !important;

        padding:
            4px 8px !important;

        flex-wrap:
            wrap !important;

        white-space:
            normal !important;
    }


    #tradingSessionsPanel
    .session-next {

        padding-top:
            9px !important;

        border-top:
            1px solid
            rgba(
                255,
                255,
                255,
                0.09
            );
    }


    #tradingSessionsPanel
    .sessions-main::after {

        display:
            none !important;
    }


    #tradingSessionsPanel
    .session-time-line {

        white-space:
            normal !important;

        text-align:
            left !important;
    }
}


/* =====================================================
   TRÈS PETIT MOBILE
   ===================================================== */

@media (max-width: 430px) {

    #tradingSessionsPanel
    .session-current,
    #tradingSessionsPanel
    .session-next {

        gap:
            6px !important;
    }
}

        `;


        document.head.appendChild(
            style
        );
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
        }


        panel.innerHTML = `

            <div class="sessions-main">

                <div class="session-current">

                    <span class="session-label">
                        SESSION ACTUELLE
                    </span>

                    <strong
                        class="session-current-name"
                        id="currentSessionName"
                    >
                        —
                    </strong>

                    <span
                        class="session-status"
                        id="currentSessionStatus"
                    >
                        —
                    </span>

                    <span
                        class="session-countdown"
                        id="currentSessionCountdown"
                    >
                        —
                    </span>

                </div>


                <div class="session-next">

                    <span class="session-label">
                        PROCHAINE
                    </span>

                    <strong
                        class="session-next-name"
                        id="nextSessionName"
                    >
                        —
                    </strong>

                    <span
                        class="session-time-line"
                        id="nextSessionTime"
                    >
                        —
                    </span>

                    <span
                        class="session-countdown small"
                        id="nextSessionCountdown"
                    >
                        —
                    </span>

                </div>

            </div>

            <div
                class="sessions-weekend"
                id="sessionsWeekend"
                style="display:none;"
            >
                Marché fermé — Week-end
            </div>
        `;


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

                } else {

                    topbar.appendChild(
                        panel
                    );
                }
            }
        }


        return panel;
    }


    /* =====================================================
       MISE À JOUR DU PANNEAU
       ===================================================== */

    function updatePanel() {

        const panel =
            document.getElementById(
                "tradingSessionsPanel"
            );


        if (!panel) {
            return;
        }


        const now =
            new Date();


        const weekend =
            isWeekend(
                now
            );


        const weekendElement =
            document.getElementById(
                "sessionsWeekend"
            );


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


        /*
         * WEEK-END
         */

        if (weekend) {

            if (weekendElement) {
                weekendElement.style.display =
                    "inline-flex";
            }


            if (currentName) {
                currentName.textContent =
                    "Marché fermé";
            }


            if (currentStatus) {
                currentStatus.textContent =
                    "";
            }


            if (currentCountdown) {
                currentCountdown.textContent =
                    "WEEK-END";
            }


            if (nextName) {
                nextName.textContent =
                    "Sydney";
            }


            if (nextTime) {
                nextTime.textContent =
                    "Ouverture lundi";
            }


            if (nextCountdown) {

                /*
                 * Recherche de la prochaine
                 * ouverture après le week-end.
                 */

                const next =
                    getNextSession(
                        now
                    );


                if (next) {

                    let nextDate =
                        next.date;


                    /*
                     * Si le candidat tombe
                     * pendant le week-end,
                     * on avance jusqu'à lundi.
                     */

                    while (
                        isWeekend(
                            nextDate
                        )
                    ) {

                        nextDate =
                            new Date(
                                nextDate.getTime() +
                                24 *
                                60 *
                                60 *
                                1000
                            );
                    }


                    nextCountdown.textContent =
                        formatCountdown(
                            nextDate.getTime() -
                            now.getTime()
                        );
                }
            }


            return;
        }


        if (weekendElement) {
            weekendElement.style.display =
                "none";
        }


        /*
         * SESSION ACTUELLE
         */

        const current =
            getCurrentSession(
                now
            );


        if (current) {

            if (currentName) {

                currentName.textContent =
                    current.session.name;

                currentName.classList.add(
                    "open"
                );
            }


            if (currentStatus) {

                currentStatus.textContent =
                    "OUVERTE";
            }


            if (currentCountdown) {

                currentCountdown.textContent =
                    formatCountdown(
                        current.closeDate.getTime() -
                        now.getTime()
                    );
            }

        } else {

            if (currentName) {

                currentName.textContent =
                    "Aucune";

                currentName.classList.remove(
                    "open"
                );
            }


            if (currentStatus) {

                currentStatus.textContent =
                    "FERMÉE";
            }


            if (currentCountdown) {

                currentCountdown.textContent =
                    "—";
            }
        }


        /*
         * PROCHAINE SESSION
         */

        const next =
            getNextSession(
                now
            );


        if (next) {

            if (nextName) {

                nextName.textContent =
                    next.session.name;
            }


            if (nextTime) {

                nextTime.textContent =
                    next.session.open +
                    " → " +
                    next.session.close;
            }


            if (nextCountdown) {

                nextCountdown.textContent =
                    formatCountdown(
                        next.date.getTime() -
                        now.getTime()
                    );
            }
        }
    }


    /* =====================================================
       INITIALISATION
       ===================================================== */

    function init() {

        injectSessionStyles();

        createPanel();

        updatePanel();


        setInterval(
            updatePanel,
            1000
        );
    }


    /* =====================================================
       DÉMARRAGE
       ===================================================== */

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

})();
