<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use App\Repository\GameSessionRepository;
use App\Repository\GameRepository;
use App\Repository\AvailabilityRepository;
use App\Entity\GameSession;

class HomeController extends AbstractController
{


    private $gameRepository;
    private $availabilityRepository;
    private $gameSessionRepository;

    /**
     * Class constructor.
     */
    public function __construct(GameRepository $gameRepository, AvailabilityRepository $availabilityRepository, GameSessionRepository $gameSessionRepository)
    {
        $this->gameRepository = $gameRepository;
        $this->availabilityRepository = $availabilityRepository;
        $this->gameSessionRepository = $gameSessionRepository;
    }

    #[Route('/', name: 'app_home')]
    public function index(): Response
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $parameters = [
            'user'      => $user,
            'userGames' => $user->getGames()
        ];

        if ($this->isGranted('ROLE_DM')) { 
            $games = $this->gameRepository->findAll();
            $commonDates = $this->availabilityRepository->findCommonAvailableDatesForGames($games, new \DateTime());

            $gameOptions = [];
            foreach ($games as $game) {
                $gameOptions[] = ['id'=>$game->getId(), 'name'=>$game->getName()];
            }

            $sessionsDaysRaw = $this->gameSessionRepository->findAll();
            
            $sessionsDays = array_column(
                array_map(function ($row) {
                    return [
                        'date' => $row->getDate()->format('Y-m-d'),
                        'gameId' => $row->getGame()->getId()
                    ];
                }, $sessionsDaysRaw),
                'gameId',
                'date'
            );
            $parameters['commonDates'] = $commonDates;
            $parameters['gameOptions'] = $gameOptions;
            $parameters['sessionsDays'] = $sessionsDays;
        }

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
