import { updateLabel } from './common.js';
import { Modal } from 'bootstrap';

export function initHomeCalendar() {
    const calendar = document.getElementById('home-calendar') || document.getElementById('gamemaster-calendar');
    if (!calendar) return null;

    let currentDate = new Date();
    let showAvailability = false;
    let showAvailabilityGameId = false;

    async function loadMonth(year, month, availability = false, gameId = false) {
        const params = new URLSearchParams({
            year,
            month
        });

        if (availability === 0) {
            document.getElementById('gameAvailabilitySwitcher').style="display:none";
        } else if (availability !== false) {
            document.getElementById('gameAvailabilitySwitcher').style="display:block";
            params.append('availability', availability);
        }

        if (gameId !== false) {
            params.append('gameId', gameId);
        }

        const res = await fetch(`/calendar/month?${params.toString()}`);
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
                " 
                data-date="${day.date}"
                ${day.isCurrentMonth ? 'data-active=true' : ''}>

                ${
                    day.isCurrentMonth ? 
                        `
                        <div class="day-header">
                            ${
                                day.availableGames && Object.keys(day.availableGames).length > 0
                                ? `<button type="button" class="btn btn-outline-info btn-sm toggle-games">
                                        <i class="bi bi-clipboard2-check-fill"></i>
                                    </button>`
                                : '<span></span>'
                            }
                            ${
                                day.plannedGame && Object.keys(day.plannedGame).length > 0
                                ? `<button 
                                        type="button"
                                        class="btn btn-outline-warning btn-sm game-starting-time" 
                                        data-time="${day.plannedGame.time}"
                                        data-end-time="${day.plannedGame.endTime || ''}"
                                        data-session-id="${day.plannedGame.id}"
                                    >
                                        <i class="bi bi-clock-fill"></i>
                                    </button>`
                                : '<span></span>'
                            }
                            <span class="text-light">${day.dayNumber}</span>
                        </div>

                        ${
                            Array.isArray(day.playersAvailibility) && day.playersAvailibility.length
                            ? `
                                <div class="players-availibility">
                                    ${day.playersAvailibility.map(player => `
                                        <div class="player ${player.available ? 'is-available' : 'is-unavailable'}">
                                            ${player.name}
                                        </div>
                                    `).join('')}
                                </div>
                            `
                            : ''
                        }

                        ${
                            day.availableGames && Object.keys(day.availableGames).length > 0
                            ? `
                                <div class="possible-games" style="display:none;">
                                    ${Object.entries(day.availableGames || {}).map(([id, nazwa]) => `
                                        <div class="form-check">
                                            <input type="checkbox" data-game-id="${id}" class="form-check-input"
                                                ${day.plannedGame && Object.keys(day.plannedGame).length > 0 && day.plannedGame.gameId == id 
                                                    ? 'checked'
                                                    : day.plannedGame && Object.keys(day.plannedGame).length > 0 && day.plannedGame.gameId != id 
                                                        ? 'disabled'
                                                        : ''
                                                }
                                            >
                                            <label for="game-${id}-${day.date}" class="form-check-label">${nazwa}</label>
                                        </div>
                                    `).join('')}
                                </div>
                            `
                            : ''
                        }

                        ${
                            day.plannedGame && Object.keys(day.plannedGame).length > 0
                            ? `
                                <a href="/session/${day.plannedGame.id}/calendar" class="game-planned btn btn-info text-primary-emphasis">
                                    <i class="bi bi-calendar-event text-primary-emphasis"></i>
                                    <div class="text-primary text-start">
                                        ${day.plannedGame.time}
                                        ${day.plannedGame.endTime ? ` - ${day.plannedGame.endTime}<br/>`: ''}
                                        ${day.plannedGame.name.trim()}
                                    </div>
                                </a>
                            `
                            : ''
                        }

                    ` : ''
                }

                </div>
            `).join('')}
            </div>
        `;
    }

    loadMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);
    
    document.getElementById('switchDisplayModeBtn')?.addEventListener('click', () => {
        showAvailability = !showAvailability;
        loadMonth(currentDate.getFullYear(), currentDate.getMonth() + 1, showAvailability ? 1 : 0);
    });

    document.getElementById('gameAvailabilitySwitcher')?.addEventListener('change', (e) => {
        let gameId = e.target.value ? e.target.value : false;
        loadMonth(currentDate.getFullYear(), currentDate.getMonth() + 1, showAvailability ? 1 : 0, gameId);
    });

    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.toggle-games');
        if (!btn) return;

        const dayDiv = btn.closest('.day');
        const gamesDiv = dayDiv.querySelector('.possible-games');

        if (gamesDiv) {
            gamesDiv.style.display =
            gamesDiv.style.display === 'none' ? 'block' : 'none';
        }
    });

    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.game-starting-time');
        if (!btn) return;

        const gameTime = btn.dataset.time;
        const [startHour, startMinute] = gameTime.split(':');
        const gameEndTime = btn.dataset.endTime;
        const sessionId = btn.dataset.sessionId;

        document.getElementById('endHourInput').value = '';
        document.getElementById('endMinuteInput').value = '';
        document.getElementById('addEndingTimeCheckbox').checked = false;
        document.getElementById('ending-time').style.display = 'none';

        const modalElement = document.getElementById('gameTimeModal');
        const gameTimeModal = new Modal(modalElement);
        modalElement.querySelector('#plannedGameTime').textContent = gameTime;
        modalElement.querySelector('#hourInput').value = Number(startHour);
        modalElement.querySelector('#minuteInput').value = Number(startMinute);
        modalElement.querySelector('#timeSessionId').value = sessionId;
        if (gameEndTime) {
            const [endHour, endMinute] = gameEndTime.split(':');
            document.getElementById('addEndingTimeCheckbox').checked = true;
            document.getElementById('ending-time').style.display = 'flex';
            document.getElementById('endHourInput').value = endHour;
            document.getElementById('endMinuteInput').value = endMinute;
            
        }
        gameTimeModal.show();

    });

    document.addEventListener('change', function (e) {
        if (!e.target.matches('.possible-games input[type="checkbox"]')) return;

        const input = e.target;
        const day = input.closest('.day').dataset.date;
        const gameId = input.dataset.gameId;

        if (input.checked) {

            let url = `/games/${gameId}/reserve`;

            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'date=' + day
            })
            .then(r => r.json())
            .then(data => {
                if (!data.success) {
                    alert(data.message);
                    e.target.checked = false;
                } else {
                    let info = data.data;
                    const a = document.createElement('a');
                    a.href = `/session/${info.id}/calendar`;
                    a.className = 'game-planned btn btn-info text-primary-emphasis';
                    a.innerHTML = `
                        <i class="bi bi-calendar-event text-primary-emphasis"></i>
                        <div class="text-primary text-start">
                            ${info.time}
                            ${info.endTime ? ` - ${info.endTime}<br/>`: ''}
                            ${info.name.trim()}
                        </div>
                    `;
                    input.closest('.day').appendChild(a);
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
            fetch(`/games/${gameId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'date=' + day
            })
            .then(r => r.json())
            .then(data => {
                if (!data.success) {
                    alert(data.message);
                } else {
                    input.closest('.day').querySelector('.game-planned')?.remove();
                    input.checked = false;
                }
            });

            cancelModal.hide();
        };
        cancelModal.show();
    });

    const saveTimeBtn = document.getElementById('saveNewSessionTimeBtn');
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
            const sessionId = parseInt(document.getElementById('timeSessionId').value);

            let url = `/games/${sessionId}/change-time`;

            const time = `${hour}:${minute}`;
            let endingTime = '00:00';
            
            if (document.getElementById('addEndingTimeCheckbox').checked) {
                const endingHour = String(endHourInput.value).padStart(2,'0');
                const endingMinute = String(endMinuteInput.value).padStart(2,'0');
                endingTime = `${endingHour}:${endingMinute}`;
            } 

            if (!time || !sessionId) return;

            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'starting_time=' + time + '&ending_time=' + endingTime
            })
            .then(r => r.json())
            .then(data => {

                if (data.success) {

                    const modalEl = document.getElementById('gameTimeModal');
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

    return { 
        loadMonth, 
        currentDate, 
        getShowAvailability: () => showAvailability,
        getShowAvailabilityGameId: () => showAvailabilityGameId
    };
}