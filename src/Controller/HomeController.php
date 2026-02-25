<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use App\Repository\GameSessionRepository;
use App\Entity\GameSession;

class HomeController extends AbstractController
{
    #[Route('/', name: 'app_home')]
    public function index(): Response
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        return $this->render('home/index.html.twig', [
            'user'      => $user,
            'userGames' => $user->getGames()
        ]);
    }

    #[Route('/calendar/events', name: 'calendar_events')]
    public function events(GameSessionRepository $gameSessionRepository): JsonResponse
    {
        $sessions = $gameSessionRepository->findAll();

        $plannedSessions = [];

        if (!empty($sessions)) {
            foreach ($sessions as $session) {
                $plannedSessions[] = [
                    'title' => $session->getGame()->getName(),
                    'start' => $session->getDate()->format('Y-m-d'),
                    'allDay' => true,
                    'extendedProps' => [
                        'icsUrl' => $this->generateUrl('session_calendar', [
                            'id' => $session->getId()
                        ])
                    ]
                ];
            }
        }

        return $this->json($plannedSessions);
    }

    #[Route('/session/{id}/calendar', name: 'session_calendar')]
    public function addToCalendar(GameSession $gameSession): Response
    {
        $date = $gameSession->getDate();

        $start = $date->format('Ymd');

        $title = $gameSession->getGame()->getName();

        $ics = "BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:$start
DTEND;VALUE=DATE:$start
SUMMARY:Sesja $title
DESCRIPTION:Sesja RPG
LOCATION: Discord 
END:VEVENT
END:VCALENDAR";

        return new Response($ics, 200, [
            'Content-Type' => 'text/calendar',
            'Content-Disposition' => 'attachment; filename="session.ics"',
        ]);
    }

}
