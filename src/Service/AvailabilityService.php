<?php

namespace App\Service;

use App\Repository\AvailabilityRepository;

class AvailabilityService
{
    public function __construct(
        private AvailabilityRepository $availabilityRepository
    ) {}

    public function getMonthData($user, int $year, int $month): array
    {
        $start = new \DateTimeImmutable("$year-$month-01");
        $end = $start->modify('last day of this month');

        $records = $this->availabilityRepository
            ->findByUserAndDateRange($user, $start, $end);

        $map = [];
        foreach ($records as $r) {
            $map[$r->getDate()->format('Y-m-d')] = [
                'available' => true,
                'time' => $r->getStartingTime()?->format('H:i'),
            ];
        }

        return $this->buildCalendarGrid($start, $end, $map);
    }

    private function buildCalendarGrid($start, $end, array $map): array
    {
        $gridStart = $start->modify('monday this week');
        $gridEnd = $end->modify('sunday this week');

        $days = [];

        for ($d = $gridStart; $d <= $gridEnd; $d = $d->modify('+1 day')) {
            $dateStr = $d->format('Y-m-d');

            $days[] = [
                'date' => $dateStr,
                'dayNumber' => (int)$d->format('j'),
                'isCurrentMonth' => $d->format('m') === $start->format('m'),
                'available' => $map[$dateStr]['available'] ?? false,
                'time' => $map[$dateStr]['time'] ?? null,
            ];
        }

        return $days;
    }
}