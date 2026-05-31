export function initCommon(calendarApi) {
    if (!calendarApi) return;

    const { 
        loadMonth, 
        currentDate, 
        getShowAvailability, 
        getShowAvailabilityGameId 
    } = calendarApi;

    function changeMonth(date, type) {
        const d = new Date(date);
        const day = d.getDate();
        d.setMonth(d.getMonth() + (type === 'next' ? 1 : -1));

        if (d.getDate() !== day) {
            d.setDate(0);
        }

        return d;
    }

    document.getElementById('prevMonth')?.addEventListener('click', () => {
        calendarApi.currentDate = changeMonth(calendarApi.currentDate, 'prev');
        loadMonth(
            calendarApi.currentDate.getFullYear(), 
            calendarApi.currentDate.getMonth() + 1, 
            getShowAvailability(),
            getShowAvailabilityGameId() 
        );
    });

    document.getElementById('nextMonth')?.addEventListener('click', () => {
        calendarApi.currentDate = changeMonth(calendarApi.currentDate, 'next');
        loadMonth(
            calendarApi.currentDate.getFullYear(),
            calendarApi.currentDate.getMonth() + 1,
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