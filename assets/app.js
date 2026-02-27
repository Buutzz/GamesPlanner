/*
 * Welcome to your app's main JavaScript file!
 *
 * This file will be included onto the page via the importmap() Twig function,
 * which should already be in your base.html.twig.
 */
import './styles/app.scss';
import 'bootstrap';
import { initCalendar } from './calendar';
import { Tooltip, Modal } from 'bootstrap';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize calendars
    document.querySelectorAll('.js-calendar').forEach(el => initCalendar(el));

    // Initialize tooltips
    Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]')).forEach(el => {
        new Tooltip(el);
    });

    // Handle "Mark Month" button logic
    const markBtn = document.getElementById('markMonthBtn');
    const form = document.getElementById('markMonthForm');
    const modalEl = document.getElementById('confirmMonthModal');
    const confirmBtn = document.getElementById('confirmMonthBtn');

    if (markBtn && form && modalEl) {
        const modal = new Modal(modalEl);

        markBtn.addEventListener('click', () => {
            const hasAvailability = markBtn.dataset.hasAvailability === '1';
            if (!hasAvailability) {
                form.submit();
            } else {
                modal.show();
            }
        });

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => form.submit());
        }
    }
});