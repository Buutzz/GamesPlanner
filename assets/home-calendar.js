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
                                            <input type="checkbox" id="game-${id}-${day.date}" class="form-check-input"
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
                                    <div class="text-primary">${day.plannedGame.time} ${day.plannedGame.name}</div>
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

    document.addEventListener('change', function (e) {
        if (!e.target.matches('.possible-games input[type="checkbox"]')) return;

        const input = e.target;
        const day = input.closest('.day').dataset.date;
        const gameId = input.id.split('-')[1];

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
                    window.location.reload();
                }
            });

            cancelModal.hide();
        };
        cancelModal.show();
    });

    return { 
        loadMonth, 
        currentDate, 
        getShowAvailability: () => showAvailability,
        getShowAvailabilityGameId: () => showAvailabilityGameId
    };
}