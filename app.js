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
        { id: "activity-1", name: "Morning Registration", type: "duty", date: dateKey(TODAY), start: "09:00", end: "10:00", location: "Main Hall", group: "All Students", staff: ["james", "sarah"] },
        { id: "activity-2", name: "English Classes", type: "activity", date: dateKey(TODAY), start: "10:00", end: "12:00", location: "Classroom 4", group: "Group B", staff: ["james"] },
        { id: "activity-3", name: "Sports Activities", type: "activity", date: dateKey(TODAY), start: "14:00", end: "16:00", location: "Basketball Court", group: "Group B", staff: ["james", "tom"] },
        { id: "activity-4", name: "Dinner Duty", type: "dinner", date: dateKey(TODAY), start: "18:00", end: "19:30", location: "Dining Hall", group: "", staff: ["james", "tom", "emma"] }
    ],
    mealTimes: {
        lunch: { enabled: true, start: "12:00", end: "14:00" },
        dinner: { enabled: true, start: "18:00", end: "19:30" }
    }
};

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

function formatDate(date) {
    return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function minutes(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function esc(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function newId(prefix = "item") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
        const fresh = structuredClone(DEFAULT_DATA);
        saveData(fresh);
        return fresh;
    }
    try {
        const data = JSON.parse(saved);
        if (!Array.isArray(data.staff) && Array.isArray(data.employees)) {
            data.staff = data.employees.map(e => ({ id: e.id, name: e.name }));
        }
        if (!Array.isArray(data.staff)) data.staff = [];
        if (!Array.isArray(data.activities)) data.activities = [];
        if (!data.mealTimes) data.mealTimes = structuredClone(DEFAULT_DATA.mealTimes);
        if (!data.mealTimes.lunch) data.mealTimes.lunch = { ...DEFAULT_DATA.mealTimes.lunch };
        if (!data.mealTimes.dinner) data.mealTimes.dinner = { ...DEFAULT_DATA.mealTimes.dinner };
        return data;
    } catch (e) {
        const fresh = structuredClone(DEFAULT_DATA);
        saveData(fresh);
        return fresh;
    }
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getStaff(id) {
    return getData().staff.find(person => person.id === id);
}

function getActivitiesForDate(date) {
    return getData().activities.filter(a => a.date === dateKey(date)).sort((a, b) => minutes(a.start) - minutes(b.start));
}

function getStaffSchedule(staffId, date) {
    return getActivitiesForDate(date).filter(a => a.staff.includes(staffId));
}

function getStaffStatus(staffId, date) {
    const schedule = getStaffSchedule(staffId, date);
    const isToday = dateKey(date) === dateKey(TODAY);
    const now = new Date();
    const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : -1;
    const current = schedule.find(a => currentMinutes >= minutes(a.start) && currentMinutes < minutes(a.end));
    const next = schedule.find(a => minutes(a.start) > currentMinutes);
    return { working: !!current || !!next, current: current || null, next: next || null, item: current || next || schedule[0] || null };
}

function getMealTimes() {
    return getData().mealTimes;
}

function mealBlocksForDate(date) {
    const meals = getMealTimes();
    const result = [];
    if (meals.lunch?.enabled && meals.lunch.start && meals.lunch.end) result.push({ type: "meal", meal: "Lunch", name: "Lunch", start: meals.lunch.start, end: meals.lunch.end });
    if (meals.dinner?.enabled && meals.dinner.start && meals.dinner.end) result.push({ type: "meal", meal: "Dinner", name: "Dinner", start: meals.dinner.start, end: meals.dinner.end });
    return result;
}

function iconFor(type) {
    if (type === "lunch") return "🍽️";
    if (type === "dinner") return "🍽️";
    if (type === "excursion") return "🚌";
    if (type === "duty") return "👤";
    return "🟢";
}

function typeLabel(type) {
    if (type === "lunch") return "Lunch duty";
    if (type === "dinner") return "Dinner duty";
    if (type === "excursion") return "Excursion";
    if (type === "duty") return "Duty";
    return "Activity";
}
