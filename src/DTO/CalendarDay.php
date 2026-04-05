<?php

namespace App\DTO;

class CalendarDay
{
    public function __construct(
        public string $date,
        public int $dayNumber,
        public bool $isCurrentMonth,
        public bool $available,
        public ?string $time
    ) {}
}