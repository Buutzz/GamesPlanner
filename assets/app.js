/*
 * Welcome to your app's main JavaScript file!
 *
 * This file will be included onto the page via the importmap() Twig function,
 * which should already be in your base.html.twig.
 */
import './styles/app.scss';
import 'bootstrap';
import { initCalendar } from './calendar';
import { Tooltip } from 'bootstrap';

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.js-calendar').forEach(el => {
        initCalendar(el);
    });

    const tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );

    tooltipTriggerList.forEach(el => {
        new Tooltip(el);
    });
});