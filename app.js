const STORAGE_KEY = "summerSchoolData";

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const DEFAULT_DATA = {
    staff: [
        { id: "james", name: "James Hall" },
        { id: "sarah", name: "Sarah Smith" },
        { id: "tom", name: "Tom Jones" },
        { id: "emma", name: "Emma Brown" }
    ],

    activities: [
        {
            id: "activity-1",
            name: "Morning Registration",
            type: "duty",
            date: "2026-08-19",
            start: "09:00",
            end: "10:00",
            location: "Main Hall",
            group: "All Students",
            staff: ["james", "sarah"]
        },

        {
            id: "activity-2",
            name: "English Classes",
            type: "activity",
            date: "2026-08-19",
            start: "10:00",
            end: "12:00",
            location: "Classroom 4",
            group: "Group B",
            staff: ["james"]
        },

        {
            id: "activity-3",
            name: "Lunch Duty",
            type: "lunch",
            date: "2026-08-19",
            start: "12:00",
            end: "14:00",
            location: "Dining Hall",
            group: "",
            staff: ["james", "sarah"]
        },

        {
            id: "activity-4",
            name: "Sports Activities",
            type: "activity",
            date: "2026-08-19",
            start: "14:00",
            end: "16:00",
            location: "Basketball Court",
            group: "Group B",
            staff: ["james", "tom"]
        },

        {
            id: "activity-5",
            name: "Dinner Duty",
            type: "dinner",
            date: "2026-08-19",
            start: "18:00",
            end: "19:30",
            location: "Dining Hall",
            group: "",
            staff: ["james", "tom", "emma"]
        }
    ]
};


/* =====================================================
   DATA
===================================================== */

function getData() {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {

        saveData(DEFAULT_DATA);

        return structuredClone(DEFAULT_DATA);
    }

    try {

        const data = JSON.parse(saved);

        // Compatibility with older version
        if (!data.staff && data.employees) {

            data.staff = data.employees.map(e => ({
                id: e.id,
                name: e.name
            }));

        }

        if (!data.activities) {
            data.activities = [];
        }

        if (!data.staff) {
            data.staff = [];
        }

        return data;

    } catch (error) {

        saveData(DEFAULT_DATA);

        return structuredClone(DEFAULT_DATA);
    }
}


function saveData(data) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}


/* =====================================================
   DATES
===================================================== */

function dateKey(date) {

    const year = date.getFullYear();

    const month =
        String(date.getMonth() + 1).padStart(2, "0");

    const day =
        String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function parseDate(key) {

    const parts = key.split("-");

    return new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );
}


function addDays(date, amount) {

    const result = new Date(date);

    result.setDate(
        result.getDate() + amount
    );

    result.setHours(0, 0, 0, 0);

    return result;
}


function formatDate(date) {

    return date.toLocaleDateString(
        "en-GB",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}


/* =====================================================
   TIME
===================================================== */

function minutes(time) {

    const parts = time.split(":");

    return (
        Number(parts[0]) * 60 +
        Number(parts[1])
    );
}


/* =====================================================
   STAFF
===================================================== */

function getStaff(id) {

    const data = getData();

    return data.staff.find(
        person => person.id === id
    );
}


/* =====================================================
   ACTIVITIES
===================================================== */

function getActivitiesForDate(date) {

    const data = getData();

    return data.activities
        .filter(
            activity =>
                activity.date === dateKey(date)
        )
        .sort(
            (a, b) =>
                minutes(a.start) -
                minutes(b.start)
        );
}


function getStaffSchedule(staffId, date) {

    return getActivitiesForDate(date)
        .filter(
            activity =>
                activity.staff.includes(staffId)
        );
}


/* =====================================================
   STATUS
===================================================== */

function getStaffStatus(staffId, date) {

    const schedule =
        getStaffSchedule(
            staffId,
            date
        );

    const isToday =
        dateKey(date) === dateKey(TODAY);

    let currentMinutes = -1;

    if (isToday) {

        const now = new Date();

        currentMinutes =
            now.getHours() * 60 +
            now.getMinutes();
    }


    const current =
        schedule.find(activity => {

            return (
                currentMinutes >=
                    minutes(activity.start) &&

                currentMinutes <
                    minutes(activity.end)
            );

        });


    const next =
        schedule.find(activity => {

            return (
                minutes(activity.start) >
                currentMinutes
            );

        });


    return {

        working: !!current || !!next,

        current: current || null,

        next: next || null,

        item:
            current ||
            next ||
            schedule[0] ||
            null
    };
}


/* =====================================================
   HTML ESCAPING
===================================================== */

function esc(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =====================================================
   ID
===================================================== */

function newId(prefix = "item") {

    return (
        prefix +
        "-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );
}


/* =====================================================
   PERIOD
===================================================== */

function periodFor(time) {

    const hour =
        Number(time.split(":")[0]);

    if (hour < 12) return "Morning";

    if (hour < 14) return "Midday";

    if (hour < 18) return "Afternoon";

    return "Evening";
}
