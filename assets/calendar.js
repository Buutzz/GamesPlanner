import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import plLocale from '@fullcalendar/core/locales/pl';
import interactionPlugin from '@fullcalendar/interaction';
import { Modal } from 'bootstrap';

export function initCalendar(el) {

    let isAvailabilityView = false;
    let selectedDateForTime = null;
    let calendar;

    const options = JSON.parse(el.dataset.options || '{}');
    const type = el.dataset.type || 'default';
    const availableDates = JSON.parse(el.dataset.availableDates || '[]');
    const availableDatesTimes = JSON.parse(el.dataset.availableDatestimes || '[]');
    const commonDates = JSON.parse(el.dataset.commonDates || '[]');
    const sessionDates = JSON.parse(el.dataset.sessionDates || '[]');
    const hasAvailability = el.dataset.hasAvailability || 0;

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
        themeSystem: 'bootstrap5',
    };

    let customOptions = {};

    function renderAvailabilityView(info, dateStr) {

        const bottom = info.el.querySelector('.fc-daygrid-day-bottom');
        bottom.innerHTML = '';

        const dayData = window.playersAvailability?.[dateStr];
        if (!dayData) return;

        dayData.forEach(player => {
            let div = document.createElement('div');
            div.style.fontSize = '11px';

            div.innerHTML = player.available
                ? `<i class="bi bi-circle-fill text-success"></i> ${player.name}`
                : `<i class="bi bi-circle-fill text-danger"></i> ${player.name}`;

            bottom.appendChild(div);
        });
    }

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

            customButtons: {
                markWholeMonth: {
                    text: ' ',
                }
            },
            headerToolbar: { left: 'title', center: 'markWholeMonth', right: 'today,prev,next' },
            dayCellClassNames: function(info) {

                if (info.isOther) {
                    return [];
                }

                const date = info.date.getFullYear() + '-' +
                    String(info.date.getMonth() + 1).padStart(2,'0') + '-' +
                    String(info.date.getDate()).padStart(2,'0');

                if (availableDates.includes(date)) {
                    return ['fc-day-marked-available'];
                }

                return ['fc-day-marked-unavailable'];
            },

            dateClick: function(info) {

                if (info.jsEvent.target.closest('.fc-set-time')) {
                    return;
                }
                
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
            },
            dayCellDidMount: function(info) {

                const btn = document.createElement("button");
                btn.innerHTML= '<i class="bi bi-clock-fill"></i>';
                btn.classList = "fc-set-time btn btn-sm btn-warning";

                btn.addEventListener("click", function(e) {
                    e.stopPropagation();

                    selectedDateForTime = info.el.dataset.date;
                    if (availableDatesTimes[selectedDateForTime]) {
                        let existingTime = availableDatesTimes[selectedDateForTime];

                        let [hour, minute] = existingTime.split(':');
                        document.getElementById('hourInput').value = parseInt(hour);
                        document.getElementById('minuteInput').value = parseInt(minute);
                    }

                    const modal = new Modal(document.getElementById('timeModal'));
                    modal.show();
                });
                info.el.appendChild(btn);
                
                if (availableDatesTimes[info.el.dataset.date]) {
                    let dateTime = availableDatesTimes[info.el.dataset.date];

                    const badge = document.createElement('div');
                    badge.className = 'badge bg-secondary text-white';
                    badge.style.fontSize = '10px';
                    badge.style.marginTop = '2px';
                    badge.innerHTML = `<i class="bi bi-clock-fill"></i> ${dateTime}`;

                    const bottom = info.el.querySelector('.fc-daygrid-day-bottom');
                    bottom.appendChild(badge);
                }
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

    if (type === 'home') {
        customOptions = {
            ...customOptions,
            customButtons: {
                switchDisplayModeBtn: {
                    text: '',
                    click: function() {
                        isAvailabilityView = !isAvailabilityView;
                        calendar.destroy();
                        calendar.render();

                    }
                }
            },
            buttonIcons: {
                switchDisplayModeBtn: 'arrow-left-right',
            },
            headerToolbar: { left: 'title', center: 'switchDisplayModeBtn', right: 'today,prev,next' },
            dayCellDidMount: function(info) {

                const dateStr = info.date.getFullYear() + '-' +
                    String(info.date.getMonth() + 1).padStart(2,'0') + '-' +
                    String(info.date.getDate()).padStart(2,'0');
                if (isAvailabilityView) {
                    renderAvailabilityView(info, dateStr);
                    return;
                }
            }
        }
    }

    if (type === 'home-dm') {
        customOptions = {
            ...customOptions,

            customButtons: {
                switchDisplayModeBtn: {
                    text: '',
                    click: function() {
                        isAvailabilityView = !isAvailabilityView;
                        calendar.destroy();
                        calendar.render();

                    }
                }
            },
            buttonIcons: {
                switchDisplayModeBtn: 'arrow-left-right',
            },
            headerToolbar: { left: 'title', center: 'switchDisplayModeBtn', right: 'today,prev,next' },

            dayCellDidMount: function(info) {

                const dateStr = info.date.getFullYear() + '-' +
                    String(info.date.getMonth() + 1).padStart(2,'0') + '-' +
                    String(info.date.getDate()).padStart(2,'0');
                if (isAvailabilityView) {
                    renderAvailabilityView(info, dateStr);
                    return;
                }

                renderNormalView(info, dateStr);
            }
        }
        

        function renderNormalView(arg, dateStr) {
            let cellEl = arg.el;

            let gamesForDay = window.commonDates[dateStr];
            if (!gamesForDay) return;

            let sessionsOfTheDay = window.sessionsDays[dateStr] || false;
            
            let wrapper = document.createElement('div');
            wrapper.classList = 'games-wrapper';
            wrapper.style.display = 'none';

            let toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.innerHTML = '<i class="bi bi-clipboard2-check-fill"></i>';
            toggleBtn.classList = 'btn btn-outline-info btn-sm';

            toggleBtn.addEventListener('click', function() {
                wrapper.style.display = wrapper.style.display === 'none' ? 'block' : 'none';
            });
            window.gameOptions.forEach(game => {

                if (gamesForDay[game.id] !== true) {
                    return;
                }

                let isAvailable = false;
                if (sessionsOfTheDay) {
                    isAvailable = sessionsOfTheDay !== game.id ? true : false;
                }

                let checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `game-${game.id}-${dateStr}`;
                checkbox.classList = 'form-check-input';
                checkbox.disabled = isAvailable;
                checkbox.checked = !isAvailable === true && sessionsOfTheDay === game.id ? true : false;

                let label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.classList = 'form-check-label';
                label.textContent = game.name;

                checkbox.addEventListener('change', function(e) {
                    if (e.target.checked) {
                        let url = `/games/${game.id}/reserve`;

                        fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: 'date=' + dateStr
                        })
                        .then(r => r.json())
                        .then(data => {
                            if (!data.success) {
                                alert(data.message);
                                e.target.checked = false;
                            } else {
                                gamesForDay[game.id] = true;
                                window.location.reload();
                            }
                        });

                        return;
                    }

                    e.preventDefault();
                    e.target.checked = true;

                    const modalElement = document.getElementById('cancelSessionModal');
                    const cancelModal = new Modal(modalElement);
                    const confirmBtn = document.getElementById('cancelSessionBtn');
                    confirmBtn.onclick = function() {
                        fetch(`/games/${game.id}/cancel`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: 'date=' + dateStr
                        })
                        .then(r => r.json())
                        .then(data => {
                            if (!data.success) {
                                alert(data.message);
                            } else {
                                e.target.checked = false;
                                window.location.reload();
                            }
                        });

                        cancelModal.hide();
                    };
                    cancelModal.show();
                });

                let div = document.createElement('div');
                div.classList = 'form-check'
                div.appendChild(checkbox);
                div.appendChild(label);
                wrapper.appendChild(div);
            });

            let bottom = cellEl.querySelector('.fc-daygrid-day-bottom');
            bottom.appendChild(toggleBtn);
            bottom.appendChild(wrapper);
        }
    }

    calendar = new Calendar(el, { 
        ...baseOptions, 
        ...options, 
        eventContent: function(arg) {
            let container = document.createElement('div');

            let startTime = '';

            if (arg.event.start) {
                const h = arg.event.start.getHours().toString().padStart(2,'0');
                const m = arg.event.start.getMinutes().toString().padStart(2,'0');
                startTime = `${h}:${m} `;
            }

            let title = document.createElement('div');
            title.classList = 'text-primary';
            title.innerText = startTime + arg.event.title;

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

    const btn = el.querySelector('.fc-markWholeMonth-button');
    if (btn) {
        btn.id = 'markMonthBtn';
        btn.className = 'btn btn-secondary btn-sm';
        btn.setAttribute('data-has-availability', hasAvailability);

        btn.innerHTML = '<i class="bi bi-calendar2-check-fill"></i> Zaznacz cały miesiąc';
    }
    const saveTimeBtn = document.getElementById('saveTimeBtn');
    if (saveTimeBtn){
        saveTimeBtn.addEventListener('click', function() {

            const hour = String(hourInput.value).padStart(2,'0');
            const minute = String(minuteInput.value).padStart(2,'0');

            const time = `${hour}:${minute}`;

            if (!time || !selectedDateForTime) return;

            fetch('/availability/set-time', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'date=' + selectedDateForTime + '&time=' + time
            })
            .then(r => r.json())
            .then(data => {

                if (data.success) {

                    const modalEl = document.getElementById('timeModal');
                    Modal.getInstance(modalEl).hide();
                    alert('Zapisano preferowany czas!');
                    window.location.reload();
                }
            });
        });

        const hourInput = document.getElementById('hourInput');
        const minuteInput = document.getElementById('minuteInput');

        document.querySelector('.time-hour-up').onclick = () => {
            hourInput.value = (parseInt(hourInput.value) + 1) % 24;
        };

        document.querySelector('.time-hour-down').onclick = () => {
            hourInput.value = (parseInt(hourInput.value) + 23) % 24;
        };

        document.querySelector('.time-minute-up').onclick = () => {
            let m = parseInt(minuteInput.value) + 30;
            if (m >= 60) {
                m = 0;
                hourInput.value = (parseInt(hourInput.value) + 1) % 24;
            }
            minuteInput.value = m;
        };

        document.querySelector('.time-minute-down').onclick = () => {
            let m = parseInt(minuteInput.value) - 30;
            if (m < 0) {
                m = 30;
                hourInput.value = (parseInt(hourInput.value) + 23) % 24;
            }
            minuteInput.value = m;
        };
}
}