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
    mealTimes: {
        lunch: { enabled: true, start: "12:00", end: "13:30" },
        dinner: { enabled: true, start: "18:00", end: "19:30" }
    },
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
            end: "13:30",
            location: "Dining Hall",
            group: "All Students",
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
            group: "All Students",
            staff: ["james", "tom", "emma"]
        }
    ]
};

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function normaliseData(data) {
    if (!data || typeof data !== "object") data = clone(DEFAULT_DATA);

    if (!Array.isArray(data.staff)) {
        data.staff = Array.isArray(data.employees)
            ? data.employees.map(e => ({ id: e.id, name: e.name }))
            : [];
    }

    if (!Array.isArray(data.activities)) data.activities = [];

    if (!data.mealTimes || typeof data.mealTimes !== "object") {
        data.mealTimes = clone(DEFAULT_DATA.mealTimes);
    }

    ["lunch", "dinner"].forEach(meal => {
        if (!data.mealTimes[meal]) {
            data.mealTimes[meal] = clone(DEFAULT_DATA.mealTimes[meal]);
        }
    });

    data.staff.forEach(s => {
        if (!s.id) s.id = newId("staff");
        if (!s.name) s.name = "Unnamed staff";
    });

    data.activities.forEach(a => {
        if (!Array.isArray(a.staff)) {
            a.staff = a.staff ? [a.staff] : [];
        }
        a.staff = a.staff.filter(id => data.staff.some(s => s.id === id));
    });

    return data;
}

function getData() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        const data = clone(DEFAULT_DATA);
        saveData(data);
        return data;
    }

    try {
        const data = normaliseData(JSON.parse(saved));
        saveData(data);
        return data;
    } catch (e) {
        const data = clone(DEFAULT_DATA);
        saveData(data);
        return data;
    }
}

function dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function parseDate(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
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
    result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day));
    result.setHours(0, 0, 0, 0);
    return result;
}

function formatDate(date) {
    return date.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function minutes(time) {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function periodFor(time) {
    const h = Number(time.split(":")[0]);
    if (h < 12) return "Morning";
    if (h < 14) return "Midday";
    if (h < 18) return "Afternoon";
    return "Evening";
}

function getStaff(id) {
    return getData().staff.find(person => person.id === id);
}

function getActivitiesForDate(date) {
    return getData().activities
        .filter(a => a.date === dateKey(date))
        .sort((a, b) => minutes(a.start) - minutes(b.start));
}

function getStaffSchedule(staffId, date) {
    return getActivitiesForDate(date)
        .filter(a => Array.isArray(a.staff) && a.staff.includes(staffId));
}

function getStaffStatus(staffId, date) {
    const schedule = getStaffSchedule(staffId, date);
    const isToday = dateKey(date) === dateKey(TODAY);
    const now = new Date();
    const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : -1;

    const current = schedule.find(a =>
        currentMinutes >= minutes(a.start) &&
        currentMinutes < minutes(a.end)
    );

    const next = schedule.find(a => minutes(a.start) > currentMinutes);

    return {
        working: !!current || !!next,
        current: current || null,
        next: next || null,
        item: current || next || schedule[0] || null
    };
}

function getMealTimes() {
    return getData().mealTimes;
}

function mealBlocksForDate(date) {
    const meals = getMealTimes();
    const result = [];

    if (meals.lunch?.enabled && meals.lunch.start && meals.lunch.end) {
        result.push({
            meal: "Lunch",
            start: meals.lunch.start,
            end: meals.lunch.end
        });
    }

    if (meals.dinner?.enabled && meals.dinner.start && meals.dinner.end) {
        result.push({
            meal: "Dinner",
            start: meals.dinner.start,
            end: meals.dinner.end
        });
    }

    return result.sort((a, b) => minutes(a.start) - minutes(b.start));
}

function isMealDuty(activity, meal) {
    return (
        (meal === "Lunch" && activity.type === "lunch") ||
        (meal === "Dinner" && activity.type === "dinner")
    );
}

function iconFor(type) {
    const icons = {
        activity: "🟢",
        excursion: "🚌",
        duty: "📋",
        lunch: "🍽️",
        dinner: "🍽️"
    };
    return icons[type] || "📌";
}

function esc(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function newId(prefix = "item") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
