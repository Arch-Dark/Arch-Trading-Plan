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
            flag: "🇦🇺",
            open: "22:00",
            close: "07:00"
        },

        {
            id: "tokyo",
            name: "Tokyo",
            flag: "🇯🇵",
            open: "00:00",
            close: "09:00"
        },

        {
            id: "london",
            name: "Londres",
            flag: "🇬🇧",
            open: "08:00",
            close: "17:00"
        },

        {
            id: "newyork",
            name: "New York",
            flag: "🇺🇸",
            open: "13:00",
            close: "22:00"
        }

    ];


    /* =====================================================
       JOURS DE LA SEMAINE
       ===================================================== */

    const DAYS_FR = [

        "Dimanche",
        "Lundi",
        "Mardi",
        "Mercredi",
        "Jeudi",
        "Vendredi",
        "Samedi"

    ];


    const MONTHS_FR = [

        "Janvier",
        "Février",
        "Mars",
        "Avril",
        "Mai",
        "Juin",
        "Juillet",
        "Août",
        "Septembre",
        "Octobre",
        "Novembre",
        "Décembre"

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

                    weekday:
                        "long",

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


    /* =====================================================
       DATE COMPLÈTE — MADAGASCAR
       ===================================================== */

    function getFullMadagascarDate(
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


        const dayName =
            DAYS_FR[day];


        const monthName =
            MONTHS_FR[
                parts.month - 1
            ];


        return (
            dayName +
            " " +
            parts.day +
            " " +
            monthName +
            " " +
            parts.year
        );

    }


    /* =====================================================
       MINUTES DEPUIS MINUIT
       ===================================================== */

    function minutesFromMidnight(
        hour,
        minute
    ) {

        return (
            Number(hour) * 60 +
            Number(minute)
        );

    }


    /* =====================================================
       CONVERSION HEURE → MINUTES
       ===================================================== */

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


    /* =====================================================
       FORMAT COMPTE À REBOURS
       ===================================================== */

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
       CRÉATION DATE MADAGASCAR
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
         * Madagascar = UTC+3
         */

        return new Date(
            target -
            (
                3 *
                60 *
                60 *
                1000
            )
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
         * SESSION NORMALE
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

        }

        /*
         * SESSION TRAVERSANT MINUIT
         */

        else {

            isOpen =
                currentMinutes >=
                openMinutes ||
                currentMinutes <
                closeMinutes;

        }


        let openDate;
        let closeDate;


        /*
         * SESSION NORMALE
         */

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

        }

        /*
         * SESSION TRAVERSANT MINUIT
         */

        else {

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

            }

            else {

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
         * ouvertes, on garde celle
         * qui a commencé le plus récemment.
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

    position: relative !important;

    left: auto !important;
    right: auto !important;
    top: auto !important;
    bottom: auto !important;

    transform: none !important;

    z-index: 5 !important;

    width: 100% !important;

    min-width: 0 !important;

    max-width: none !important;

    margin: 0 !important;

    padding: 9px 14px !important;

    display: block !important;

    box-sizing: border-box !important;

    flex: none !important;

    flex-shrink: 1 !important;

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
   DATE
   ===================================================== */

#tradingSessionsPanel .sessions-date {

    display:
        flex !important;

    align-items:
        center !important;

    justify-content:
        center !important;

    width:
        100% !important;

    margin:
        0 0 7px 0 !important;

    font-size:
        10px !important;

    font-weight:
        800 !important;

    letter-spacing:
        0.25px !important;

    opacity:
        0.82 !important;

    white-space:
        nowrap !important;
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
        8px !important;

    min-width:
        0 !important;

    width:
        100% !important;

    padding:
        3px 12px !important;

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
        24px !important;
}


#tradingSessionsPanel .session-next {

    grid-column:
        3 !important;

    grid-row:
        1 !important;

    padding-left:
        24px !important;
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
        0.7px !important;

    text-transform:
        uppercase !important;

    opacity:
        0.48 !important;

    white-space:
        nowrap !important;
}


/* =====================================================
   NOMS DES SESSIONS
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
        flex !important;

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
        5px 8px !important;

    border-radius:
        7px !important;

    font-size:
        9px !important;

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

    #tradingSessionsPanel
    .session-label {

        display:
            none !important;
    }


    #tradingSessionsPanel
    .session-current {

        padding-right:
            16px !important;
    }


    #tradingSessionsPanel
    .session-next {

        padding-left:
            16px !important;
    }

}


/* =====================================================
   PETIT ÉCRAN
   ===================================================== */

@media (max-width: 900px) {

    #tradingSessionsPanel {

        width:
            100% !important;

        min-width:
            0 !important;

        max-width:
            100% !important;
    }

}


/* =====================================================
   MOBILE
   ===================================================== */

@media (max-width: 700px) {

    #tradingSessionsPanel {

        padding:
            8px 10px !important;
    }


    #tradingSessionsPanel .sessions-date {

        font-size:
            9px !important;

        margin-bottom:
            6px !important;
    }


    #tradingSessionsPanel
    .sessions-main {

        grid-template-columns:
            1fr !important;

        gap:
            7px !important;
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

        padding:
            4px 6px !important;

        flex-wrap:
            wrap !important;

        white-space:
            normal !important;
    }


    #tradingSessionsPanel
    .session-next {

        padding-top:
            8px !important;

        border-top:
            1px solid
            rgba(
                255,
                255,
                255,
                0.09
            ) !important;
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


    #tradingSessionsPanel
    .session-current-name,
    #tradingSessionsPanel
    .session-next-name {

        font-size:
            11px !important;
    }


    #tradingSessionsPanel
    .session-countdown {

        font-size:
            8px !important;

        padding:
            4px 6px !important;
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

            <div
                class="sessions-date"
                id="sessionsDate"
            >
                —
            </div>


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
                🔴 Marché fermé — Week-end
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


        /* =================================================
           DATE
           ================================================= */

        const dateElement =
            document.getElementById(
                "sessionsDate"
            );


        if (dateElement) {

            dateElement.textContent =
                "📅 " +
                getFullMadagascarDate(
                    now
                );

        }


        /* =================================================
           ÉLÉMENTS
           ================================================= */

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


        /* =================================================
           WEEK-END
           ================================================= */

        if (weekend) {

            if (weekendElement) {

                weekendElement.style.display =
                    "flex";

            }


            if (currentName) {

                currentName.textContent =
                    "Marché fermé";

                currentName.classList.remove(
                    "open"
                );

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
                    "🇦🇺 Sydney";

            }


            if (nextTime) {

                nextTime.textContent =
                    "Ouverture lundi 22:00";

            }


            if (nextCountdown) {

                const next =
                    getNextSession(
                        now
                    );


                if (next) {

                    let nextDate =
                        next.date;


                    while (
                        isWeekend(
                            nextDate
                        )
                    ) {

                        nextDate =
                            new Date(
                                nextDate.getTime() +
                                (
                                    24 *
                                    60 *
                                    60 *
                                    1000
                                )
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


        /* =================================================
           JOUR OUVRABLE
           ================================================= */

        if (weekendElement) {

            weekendElement.style.display =
                "none";

        }


        /* =================================================
           SESSION ACTUELLE
           ================================================= */

        const current =
            getCurrentSession(
                now
            );


        if (current) {

            if (currentName) {

                currentName.textContent =
                    current.session.flag +
                    " " +
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

        }

        else {

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


        /* =================================================
           PROCHAINE SESSION
           ================================================= */

        const next =
            getNextSession(
                now
            );


        if (next) {

            if (nextName) {

                nextName.textContent =
                    next.session.flag +
                    " " +
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

    }

    else {

        init();

    }


})();
