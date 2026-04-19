/*
 * Welcome to your app's main JavaScript file!
 *
 * This file will be included onto the page via the importmap() Twig function,
 * which should already be in your base.html.twig.
 */
import './styles/app.scss';
import 'bootstrap';
import { Tooltip, Modal } from 'bootstrap';
import { initAvailabilityCalendar } from './availability-calendar.js';
import { initHomeCalendar } from './home-calendar.js';
import { initCommon } from './common.js';

const calendarApi =
    initAvailabilityCalendar() ??
    initHomeCalendar();

initCommon(calendarApi);

document.addEventListener('DOMContentLoaded', () => {

    // Initialize tooltips
    Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]')).forEach(el => {
        new Tooltip(el);
    });
});