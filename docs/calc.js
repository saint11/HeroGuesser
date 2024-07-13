
// Helper function to get the day count from July 4th, 2024
export function getDayCountFromCreation() {
    const startDate = new Date("2024-07-04T00:00:00");
    const today = new Date();

    // Calculate the difference in milliseconds
    const diffTime = Math.abs(today -startDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}


// Get how many hours are left in current day
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
