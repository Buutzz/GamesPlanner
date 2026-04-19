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
                                >
                                    <i class="bi bi-clock-fill"></i>
                                </button>`
                                : '<span></span>'
                            }
                            <span class="text-primary">${day.dayNumber}</span>
                        </div>

                        ${
                            day.time
                            ? `<div class="time text-secondary-emphasis">
                                    <span class="badge bg-info text-secondary-emphasis">
                                        <i class="bi bi-clock-fill"></i> ${day.time}
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

                const res = await fetch('/availability/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'date=' + date
                });

                const data = await res.json();

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
            });
        });
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.set-time-btn');
        if (!btn) return;

        e.stopPropagation();

        const dayElement = btn.closest('.day');
        selectedDateForTime = dayElement.dataset.date;

        if (btn.dataset.time) {
            const [hour, minute] = btn.dataset.time.split(':');
            document.getElementById('hourInput').value = Number(hour);
            document.getElementById('minuteInput').value = Number(minute);
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