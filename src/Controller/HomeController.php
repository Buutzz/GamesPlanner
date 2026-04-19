<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use App\Repository\GameSessionRepository;
use App\Repository\GameRepository;
use App\Repository\AvailabilityRepository;
use App\Repository\UserRepository;
use App\Entity\GameSession;
use App\Service\HomeService;

class HomeController extends AbstractController
{


    private $gameRepository;
    private $availabilityRepository;
    private $gameSessionRepository;
    private $homeService;

    /**
     * Class constructor.
     */
    public function __construct(
        GameRepository $gameRepository, 
        AvailabilityRepository $availabilityRepository, 
        GameSessionRepository $gameSessionRepository,
        HomeService $homeService
    )
    {
        $this->gameRepository = $gameRepository;
        $this->availabilityRepository = $availabilityRepository;
        $this->gameSessionRepository = $gameSessionRepository;
        $this->homeService = $homeService;
    }

    #[Route('/', name: 'app_home')]
    public function index(UserRepository $userRepository): Response
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $parameters = [
            'user'      => $user,
            'userGames' => $user->getGames()
        ];
        
        $parameters['activeGames'] = $this->gameRepository->findBy(['active' => true]);

        return $this->render('home/index.html.twig', $parameters);
    }

    #[Route('/calendar/events', name: 'calendar_events')]
    public function events(): JsonResponse
    {
        $sessions = $this->gameSessionRepository->findAll();

        $plannedSessions = [];

        if (!empty($sessions)) {
            foreach ($sessions as $session) {
                $plannedSessions[] = [
                    'title' => $session->getGame()->getName(),
                    'start' => $session->getDate()->format('Y-m-d').'T'.($session->getSessionStartingTime()?->format('H:i:s') ?? '19:30:00'),
                    'allDay' => false,
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

        $start = $date->format('Ymd').'T'.$gameSession->getSessionStartingTime()?->format('His');
        $end = $date->format('Ymd').'T230000';

        $title = $gameSession->getGame()->getName();

        $ics = "BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:GamesCalendar-Arbutz
DTSTART;TZID=Europe/Warsaw:$start
DTEND;TZID=Europe/Warsaw:$end
SUMMARY:Sesja $title
DESCRIPTION:Sesja RPG
LOCATION: Discord 
END:VEVENT
END:VCALENDAR";
        $fileName = $title.' - '.$date->format('Ymd');
        return new Response($ics, 200, [
            'Content-Type' => 'text/calendar',
            'Content-Disposition' => 'attachment; filename="'.$fileName.'.ics"',
        ]);
    }

    #[Route('/calendar/month', name: 'calendar_month', methods: ['GET'])]
    public function month(
        Request $request,
    ): JsonResponse {
        $year = (int)$request->query->get('year');
        $month = (int)$request->query->get('month');
        $params = [];

        if (!empty($request->query->get('availability'))) {
            $params['availability'] = $request->query->get('availability');
        }

        if (!empty($request->query->get('gameId'))) {
            $params['gameId'] = (int)$request->query->get('gameId');
        }

        $days = $this->homeService->getMonthData(
            $year,
            $month,
            $params
        );

        return $this->json([
            'days' => $days,
        ]);
    }
}
