const STORAGE_KEY = "summerSchoolData";

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function newId(prefix = "item") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function addDays(date, amount) {
    const result = new Date(date);
    result.setDate(result.getDate() + amount);
    result.setHours(0, 0, 0, 0);
    return result;
}

function getMonday(date) {
    const result = new Date(date);
    const day = result.getDay();

    result.setDate(
        result.getDate() + (day === 0 ? -6 : 1 - day)
    );

    result.setHours(0, 0, 0, 0);
    return result;
}

function minutes(time) {
    if (!time) return 0;

    const [hours, mins] = time.split(":").map(Number);

    return hours * 60 + mins;
}

function periodFor(time) {
    const hour = Number(time.split(":")[0]);

    if (hour < 12) return "Morning";
    if (hour < 14) return "Midday";
    if (hour < 18) return "Afternoon";

    return "Evening";
}

function formatDate(date) {
    return date.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function esc(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getStaff(id) {
    return getData().staff.find(person => person.id === id);
}

function saveData(data) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}

const DEFAULT_DATA = {
    staff: [
        {
            id: "james",
            name: "James Hall"
        },
        {
            id: "sarah",
            name: "Sarah Smith"
        },
        {
            id: "tom",
            name: "Tom Jones"
        }
    ],

    activities: []
};

function normaliseData(data) {

    if (!data || typeof data !== "object") {
        data = clone(DEFAULT_DATA);
    }

    if (!Array.isArray(data.staff)) {
        data.staff = [];
    }

    if (!Array.isArray(data.activities)) {
        data.activities = [];
    }

    data.staff.forEach(person => {

        if (!person.id) {
            person.id = newId("staff");
        }

        if (!person.name) {
            person.name = "Unnamed staff";
        }
    });

    data.activities.forEach(activity => {

        if (!activity.id) {
            activity.id = newId(
                activity.type === "meal"
                    ? "meal"
                    : "activity"
            );
        }

        if (!Array.isArray(activity.staff)) {
            activity.staff = activity.staff
                ? [activity.staff]
                : [];
        }

        if (!Array.isArray(activity.dutyStaff)) {
            activity.dutyStaff = [];
        }

        /*
         * Convert older lunch/dinner records
         * into the new meal format.
         */
        if (
            activity.type === "lunch" ||
            activity.type === "dinner"
        ) {
            const mealType = activity.type;

            activity.type = "meal";
            activity.meal = mealType;
            activity.name =
                mealType === "dinner"
                    ? "Dinner"
                    : "Lunch";

            activity.dutyStaff =
                activity.staff.slice();

            activity.staff = [];
        }

        if (activity.type === "meal") {

            activity.meal =
                activity.meal === "dinner"
                    ? "dinner"
                    : "lunch";

            activity.name =
                activity.meal === "dinner"
                    ? "Dinner"
                    : "Lunch";
        }

        activity.staff =
            activity.staff.filter(id =>
                data.staff.some(
                    person => person.id === id
                )
            );

        activity.dutyStaff =
            activity.dutyStaff.filter(id =>
                data.staff.some(
                    person => person.id === id
                )
            );
    });

    return data;
}

function getData() {

    const saved =
        localStorage.getItem(STORAGE_KEY);

    if (!saved) {

        const data = clone(DEFAULT_DATA);

        saveData(data);

        return data;
    }

    try {

        const data =
            normaliseData(JSON.parse(saved));

        saveData(data);

        return data;

    } catch (error) {

        const data = clone(DEFAULT_DATA);

        saveData(data);

        return data;
    }
}

function getActivitiesForDate(date) {

    return getData()
        .activities
        .filter(activity =>
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
        .filter(activity => {

            if (activity.type === "meal") {

                return activity.dutyStaff
                    .includes(staffId);
            }

            return activity.staff
                .includes(staffId);
        });
}

function getStaffStatus(staffId, date) {

    const schedule =
        getStaffSchedule(
            staffId,
            date
        );

    const today =
        dateKey(date) === dateKey(TODAY);

    const now = new Date();

    const currentMinutes = today
        ? now.getHours() * 60 +
          now.getMinutes()
        : -1;

    const current =
        schedule.find(activity =>
            currentMinutes >=
                minutes(activity.start) &&
            currentMinutes <
                minutes(activity.end)
        );

    const next =
        schedule.find(activity =>
            minutes(activity.start) >
            currentMinutes
        );

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

function iconFor(type) {

    if (type === "meal") {
        return "🍽️";
    }

    if (type === "excursion") {
        return "🚌";
    }

    if (type === "duty") {
        return "📋";
    }

    return "🟢";
}

function getMealLabel(activity) {

    return activity.meal === "dinner"
        ? "Dinner"
        : "Lunch";
}

function isMealDuty(activity, staffId) {

    return (
        activity.type === "meal" &&
        activity.dutyStaff.includes(staffId)
    );
}
