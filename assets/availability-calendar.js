import { Modal } from 'bootstrap';
import { updateLabel } from './common.js';

export function initAvailabilityCalendar() {
    const calendar = document.getElementById('availability-calendar');
    if (!calendar) return null;

    let currentDate = new Date();
    let selectedDateForTime = null;

    async function loadMonth(year, month) {
        const res = await fetch(`/availability/month?year=${year}&month=${month}`);
        const data = await res.json();

        renderCalendar(data.days);
        updateLabel(year, month);
    }

    function renderCalendar(days) {
        const container = document.getElementById('calendar');

        container.innerHTML = `
            <div class="calendar">
            ${days.map(day => `
                <div class="
                    day
                    ${day.isCurrentMonth ? '' : 'other-month'}
                    ${day.available ? 'available' : 'unavailable'}
                " 
                data-date="${day.date}"
                ${day.isCurrentMonth ? 'data-active=true' : ''}>

                ${
                    day.isCurrentMonth ? `
                        <div class="day-header">
                            ${
                                day.available
                                ? `<button class="set-time-btn btn btn-sm btn-warning"
                                    ${day.time?.trim() ? `data-time="${day.time}"` : ''}
                                    ${day.endTime?.trim() ? `data-end-time="${day.endTime}"` : ''}
                                >
                                    <i class="bi bi-clock-fill"></i>
                                </button>`
                                : '<span></span>'
                            }
                            <span class="text-primary">${day.dayNumber}</span>
                        </div>

                        ${
                            day.time || day.endTime
                            ? `<div class="time text-secondary-emphasis">
                                    <span class="badge bg-info text-secondary-emphasis">
                                        <i class="bi bi-clock-fill"></i> ${day.time ? day.time : '19:30'} ${day.endTime ? ` - ${day.endTime}`: ''}
                                    </span>
                            </div>`
                            : ''
                        }
                    ` : ''
                }

                </div>
            `).join('')}
            </div>
        `;

        attachListeners();
    }

    function attachListeners() {
        document.querySelectorAll('.day[data-active]').forEach(el => {
            el.addEventListener('click', async (e) => {
                if (e.target.closest('.set-time-btn')) return;

                const date = el.dataset.date;

                try {
                    const res = await fetch('/availability/toggle', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: 'date=' + encodeURIComponent(date)
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        const modalEl = document.getElementById('sessionPlannedForThisDayModal');
                        const modal = new Modal(modalEl);
                        modal.show();
                        return;
                    }

                    el.classList.toggle('available', data.available);
                    el.classList.toggle('unavailable', !data.available);
                    const header = el.querySelector('.day-header');
                    const timeBtn = header.querySelector('.set-time-btn');

                    if (!data.available) {
                        if (timeBtn) {
                            timeBtn.replaceWith(document.createElement('span'));
                        }
                    } else {
                        if (!timeBtn) {
                            const btn = document.createElement('button');
                            btn.className = 'set-time-btn btn btn-sm btn-warning';
                            btn.innerHTML = `<i class="bi bi-clock-fill"></i>`;
                            header.prepend(btn);
                        }
                    }
                } catch (err) {
                    alert(err.message);
                }
            });
        });
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.set-time-btn');
        if (!btn) return;

        e.stopPropagation();

        const dayElement = btn.closest('.day');
        selectedDateForTime = dayElement.dataset.date;

        document.getElementById('endHourInput').value = '';
        document.getElementById('endMinuteInput').value = '';
        document.getElementById('addEndingTimeCheckbox').checked = false;
        document.getElementById('ending-time').style.display = 'none';

        if (btn.dataset.time) {
            const [hour, minute] = btn.dataset.time.split(':');
            document.getElementById('hourInput').value = Number(hour);
            document.getElementById('minuteInput').value = Number(minute);
        }

        if (btn.dataset.endTime) {
            const [endHour, endMinute] = btn.dataset.endTime.split(':');
            document.getElementById('endHourInput').value = Number(endHour);
            document.getElementById('endMinuteInput').value = Number(endMinute);
            document.getElementById('addEndingTimeCheckbox').checked = true;
            document.getElementById('ending-time').style.display = 'flex';
        }

        new Modal(document.getElementById('timeModal')).show();
    });

    document.getElementById('timeModal').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('saveTimeBtn').click();
        }
    });

    loadMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);

    const saveTimeBtn = document.getElementById('saveTimeBtn');
    if (saveTimeBtn){

        function timeFormValidation() {
            const hour = parseInt(hourInput.value);
            const minute = parseInt(minuteInput.value);

            if (isNaN(hour) || hour < 0 || hour > 23) {
                alert('Godzina rozpoczęcia musi być liczbą od 0 do 23.');
                console.log(hour);
                return false;
            }

            if (isNaN(minute) || minute < 0 || minute > 59) {
                alert('Minuta musi być liczbą od 0 do 59.');
                console.log(minute);
                return false;
            }

            if (document.getElementById('addEndingTimeCheckbox').checked) {
                const endingHour = parseInt(endHourInput.value);
                const endingMinute = parseInt(endMinuteInput.value);

                if (isNaN(endingHour) || endingHour < 0 || endingHour > 23) {
                    alert('Godzina zakończenia musi być liczbą od 0 do 23.');
                    return false;
                }

                if (isNaN(endingMinute) || endingMinute < 0 || endingMinute > 59) {
                    alert('Minuta zakończenia musi być liczbą od 0 do 59.');
                    return false;
                }

                const startingTime = new Date();
                startingTime.setHours(hour, minute, 0, 0);

                const endingTime = new Date();
                endingTime.setHours(endingHour, endingMinute, 0, 0);

                if (endingTime <= startingTime) {
                    document.getElementById('ending-time-error').style.display = 'block';
                    return false;
                } else {
                    document.getElementById('ending-time-error').style.display = 'none';
                }
            }

            return true;
        }

        saveTimeBtn.addEventListener('click', function() {

            let isValid = timeFormValidation();

            if (!isValid) return;

            const hour = String(hourInput.value).padStart(2,'0');
            const minute = String(minuteInput.value).padStart(2,'0');

            const time = `${hour}:${minute}`;
            let endingTime = '00:00';
            
            if (document.getElementById('addEndingTimeCheckbox').checked) {
                const endingHour = String(endHourInput.value).padStart(2,'0');
                const endingMinute = String(endMinuteInput.value).padStart(2,'0');
                endingTime = `${endingHour}:${endingMinute}`;
            } 

            if (!time || !selectedDateForTime) return;

            fetch('/availability/set-time', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'date=' + selectedDateForTime + '&time=' + time + '&ending_time=' + endingTime
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

        document.addEventListener('click', event => {
            const button = event.target.closest('.time-hour-up');

            if (!button) {
                return;
            }

            const hourInput = button
                .closest('.time-setting')
                .querySelector('.hour-input');

            hourInput.value = (parseInt(hourInput.value, 10) + 1) % 24;
        });

        document.addEventListener('click', event => {
            const button = event.target.closest('.time-hour-down');

            if (!button) {
                return;
            }

            const hourInput = button
                .closest('.time-setting')
                .querySelector('.hour-input');

            hourInput.value = (parseInt(hourInput.value) + 23) % 24;
        });

        document.addEventListener('click', event => {
            const button = event.target.closest('.time-minute-up');

            if (!button) {
                return;
            }

            const minuteInput = button
                .closest('.time-setting')
                .querySelector('.minute-input');

            minuteInput.value = (parseInt(minuteInput.value, 10) + 30) % 60;
        });

        document.addEventListener('click', event => {
            const button = event.target.closest('.time-minute-down');

            if (!button) {
                return;
            }

            const minuteInput = button
                .closest('.time-setting')
                .querySelector('.minute-input');

            minuteInput.value = (parseInt(minuteInput.value, 10) + 30) % 60;
        });
    }

    document.getElementById('addEndingTimeCheckbox').addEventListener('change', function() {
        document.getElementById('ending-time').style.display = this.checked ? 'flex' : 'none';
    });

    document.getElementById('markWholeMonthAvailableBtn')?.addEventListener('click', (e) => {
        
        fetch('/availability/month/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'date=' + currentDate.toISOString()
        })
        .then(r => r.json())
        .then(data => {

            const form = document.getElementById('markMonthForm');
            form.querySelector('#markWholeMonthDate').value = currentDate.toISOString();

            if (data.hasAvailability) {
                const modalEl = document.getElementById('confirmMonthModal');
                const confirmBtn = document.getElementById('confirmMonthBtn');
                const modal = new Modal(modalEl);
                modal.show();

                if (confirmBtn) {
                    confirmBtn.addEventListener('click', () => form.submit());
                }
            } else {
                form.submit();
            }
        });
    });
    
    return { 
        loadMonth, 
        currentDate,
        getShowAvailability: () => false,
        getShowAvailabilityGameId: () => false
    };
}