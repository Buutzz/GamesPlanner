export function initCommon(calendarApi) {
    if (!calendarApi) return;

    const { 
        loadMonth, 
        currentDate, 
        getShowAvailability, 
        getShowAvailabilityGameId 
    } = calendarApi;

    document.getElementById('prevMonth')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        loadMonth(
            currentDate.getFullYear(), 
            currentDate.getMonth() + 1, 
            getShowAvailability(),
            getShowAvailabilityGameId() 
        );
    });

    document.getElementById('nextMonth')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        loadMonth(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            getShowAvailability(),
            getShowAvailabilityGameId()
        );
    });
}

export function updateLabel(year, month) {
    const label = document.getElementById('currentMonthLabel');
    if (!label) return;

    label.textContent = `${year}-${String(month).padStart(2, '0')}`;
}