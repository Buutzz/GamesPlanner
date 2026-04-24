<?php

namespace App\Service;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use App\Repository\AvailabilityRepository;
use App\Repository\UserRepository;
use App\Repository\GameRepository;
use App\Repository\GameSessionRepository;

class HomeService extends AbstractController {

    public function __construct(
        private AvailabilityRepository $availabilityRepository,
        private UserRepository $userRepository,
        private GameRepository $gameRepository,
        private GameSessionRepository $gameSessionRepository
    ) {}

    public function getMonthData(int $year, int $month, array $params = []): array
    {
        $start = new \DateTimeImmutable("$year-$month-01");
        $end = $start->modify('last day of this month')->setTime(23, 59, 59);

        $map = [];

        if (!empty($params['availability'])) {
            if (empty($params['gameId'])) {
                $users = $this->userRepository->findAll();
            } else {
                $game = $this->gameRepository->findOneBy(['id' => (int)$params['gameId'],]);
                $users = $game->getAllParticipants();
            }
            $map['availibility'] = $this->availabilityRepository->findPlayersAvailability($users, $start, $end);
        }

        $plannedGames = $this->gameSessionRepository->findUpcoming($start, $end);

        if (!empty($plannedGames)) {
            foreach($plannedGames as $game) {
                $map['session'][$game->getDate()->format('Y-m-d')] = [
                    'id'    => $game->getId(),
                    'gameId'    => $game->getGame()->getId(),
                    'name'  => $game->getGame()->getName(),
                    'time'  => $game->getSessionStartingTime()?->format('H:i') ?? '19:30',
                ];
            }
        }

        return $this->buildCalendarGrid($start, $end, $map);
    }

    private function buildCalendarGrid($start, $end, array $map): array
    {
        $gridStart = $start->modify('monday this week');
        $gridEnd = $end->modify('sunday this week');

        $days = [];
        $possibleGames = null;

        if ($this->isGranted('ROLE_DM')) {
            $possibleGames = $this->availabilityRepository->findCommonAvailableDatesForGames($this->gameRepository->findBy(['active' => true], ['id' => 'ASC']), $start);
        }

        for ($d = $gridStart; $d <= $gridEnd; $d = $d->modify('+1 day')) {
            $dateStr = $d->format('Y-m-d');
            
            if ($d->format('m') === $start->format('m')) {
                $days[] = [
                    'date' => $dateStr,
                    'dayNumber' => (int)$d->format('j'),
                    'isCurrentMonth' => $d->format('m') === $start->format('m'),
                    'playersAvailibility' => $map['availibility'][$dateStr] ?? [],
                    'availableGames' => $possibleGames[$dateStr] ?? [],
                    'plannedGame' => $map['session'][$dateStr] ?? [],
                ];
            } else {
                $days[] = [
                    'date' => $dateStr,
                    'isCurrentMonth' => $d->format('m') === $start->format('m'),
                ];
            }
        }

        return $days;
    }
}