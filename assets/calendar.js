import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import plLocale from '@fullcalendar/core/locales/pl';
import interactionPlugin from '@fullcalendar/interaction';

export function initCalendar(el) {
    const options = JSON.parse(el.dataset.options || '{}');
    const type = el.dataset.type || 'default';
    const availableDates = JSON.parse(el.dataset.availableDates || '[]');
    const commonDates = JSON.parse(el.dataset.commonDates || '[]');
    const sessionDates = JSON.parse(el.dataset.sessionDates || '[]');

    const baseOptions = {
        plugins: [dayGridPlugin, bootstrap5Plugin, interactionPlugin],
        themeSystem: 'slate',
        locale: plLocale,
        firstDay: 1,
        timeZone: 'local',
        headerToolbar: { left: 'title', center: '', right: 'today,prev,next' },
        showNonCurrentDates: false,
        height: 600,
        fixedWeekCount: false,
        expandRows: true,
    };

    let customOptions = {};

    if (type === 'availability' || type === 'game') {
        customOptions = {
            eventDidMount: function(info) {
                const date = info.event.start;
                const formatted = date.getFullYear() + '-' +
                                  String(date.getMonth() + 1).padStart(2,'0') + '-' +
                                  String(date.getDate()).padStart(2,'0');
                const dayCell = document.querySelector('[data-date="'+formatted+'"]');
                if (dayCell) dayCell.dataset.hasEvent = 'true';
            }
        };
    }

    if (type === 'availability') {
        customOptions = {
            ...customOptions,

            dayCellDidMount: function(info) {
                const date = info.date.getFullYear() + '-' +
                    String(info.date.getMonth() + 1).padStart(2,'0') + '-' +
                    String(info.date.getDate()).padStart(2,'0');

                info.el.classList.remove(
                    'fc-day-marked-available',
                    'fc-day-marked-unavailable'
                );
                if (availableDates.includes(date)) {
                    info.el.classList.add('fc-day-marked-available');
                }
                else {
                    info.el.classList.add('fc-day-marked-unavailable');
                }
            },

            dateClick: function(info) {
                if (info.dayEl.dataset.hasEvent === 'true') {
                    const date = info.date.getFullYear() + '-' +
                                 String(info.date.getMonth() + 1).padStart(2,'0') + '-' +
                                 String(info.date.getDate()).padStart(2,'0');
                    alert(`Na ${date} jest już zaplanowana sesja, powiadom swojego DMa`);
                    return;
                }

                fetch('/availability/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'date=' + info.dateStr
                })
                .then(r => r.json())
                .then(data => {
                    if (data.available) {
                        availableDates.push(info.dateStr);
                        info.dayEl.classList.remove('fc-day-marked-unavailable');
                        info.dayEl.classList.add('fc-day-marked-available');
                    } else {
                        const index = availableDates.indexOf(info.dateStr);
                        if (index > -1) availableDates.splice(index,1);
                        info.dayEl.classList.remove('fc-day-marked-available');
                        info.dayEl.classList.add('fc-day-marked-unavailable');
                    }
                });
            }
        };
    }

    if (type === 'game') {
        customOptions = {
            ...customOptions,

            dayCellDidMount: function(info) {
                const date = info.date.getFullYear() + '-' +
                    String(info.date.getMonth() + 1).padStart(2,'0') + '-' +
                    String(info.date.getDate()).padStart(2,'0');

                info.el.classList.remove(
                    'fc-day-marked-available',
                    'fc-day-marked-unavailable',
                    'fc-day-session'
                );
                info.el.dataset.available = 'true';
                info.el.dataset.reserved = 'false';

                if (sessionDates.includes(date)) {
                    info.el.classList.add('fc-day-session');
                    info.el.dataset.reserved = 'true';
                } else if(commonDates.includes(date)) {
                    info.el.classList.add('fc-day-marked-available');
                } else {
                    info.el.classList.add('fc-day-marked-unavailable');
                    info.el.dataset.available = 'false';
                }
            },

            dateClick: function(info) {
                if (info.dayEl.dataset.available !== 'true') {
                    alert('Ten termin jest niedostępny dla wszystkich graczy');
                    return;
                }
                let date = info.date.getFullYear() + '-' +
                    String(info.date.getMonth() + 1).padStart(2,'0') + '-' +
                    String(info.date.getDate()).padStart(2,'0');
                let isReserved = info.dayEl.dataset.reserved === 'true';

                if (isReserved) {
                    let ok = confirm(`Czy na pewno chcesz anulować rezerwację sesji z dnia ${date}?`);
                    if (!ok) return;
                }

                let url = isReserved
                    ? `/games/${window.gameId}/cancel`
                    : `/games/${window.gameId}/reserve`;

                fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'date=' + date
                })
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        if (isReserved) {
                            const eventsToRemove = calendar.getEvents().filter(event => 
                                event.startStr === info.dateStr
                            );
                            eventsToRemove.forEach(event => event.remove());
                            info.dayEl.classList.remove('fc-day-session');
                            info.dayEl.classList.add('fc-day-marked-available');
                            info.dayEl.dataset.reserved = 'false';
                        } else {
                            info.dayEl.classList.remove('fc-day-marked-available');
                            info.dayEl.classList.add('fc-day-session');
                            info.dayEl.dataset.reserved = 'true';
                        }
                    } else {
                        alert(data.message);
                    }
                });
            },
        };
    }

    const calendar = new Calendar(el, { 
        ...baseOptions, 
        ...options, 
        eventContent: function(arg) {
            let container = document.createElement('div');

            let title = document.createElement('div');
            title.innerText = arg.event.title;

            if (arg.event.extendedProps.icsUrl) {
                let link = document.createElement('a');
                link.href = arg.event.extendedProps.icsUrl;
                link.innerText = '📅';
                link.style.marginLeft = '6px';
                container.appendChild(link);
            }

            container.appendChild(title);

            return { domNodes: [container] };
        },
        ...customOptions });
    calendar.render();
}