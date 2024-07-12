
// Helper function to get the day count from January 1st, 2024
export function getDayCountFrom2024() {
    const startDate = new Date("2024-01-01");
    const today = new Date();
    const timeDiff = today - startDate;
    const dayCount = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    return dayCount;
}

export function getHoursUntilNextDay() {
    const now = new Date();
    const nextDay = new Date(now);
    nextDay.setDate(now.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0); // Set to the start of the next day

    const timeDiff = nextDay - now;
    const hoursUntilNextDay = timeDiff / (1000 * 60 * 60); // Convert milliseconds to hours

    return hoursUntilNextDay;
}

// Helper function to format numbers to 1 decimal place
export function formatNumber(num) {
    return parseFloat(Number(num).toFixed(1)).toString();
}
