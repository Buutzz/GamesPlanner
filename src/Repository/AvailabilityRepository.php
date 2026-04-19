<?php

namespace App\Repository;

use App\Entity\Availability;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Availability>
 */
class AvailabilityRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Availability::class);
    }

    public function findCommonAvailableDatesForUsersInMonth(array $users, \DateTimeInterface $month): array
    {
        if (count($users) === 0) {
            return [];
        }

        $start = (new \DateTimeImmutable($month->format('Y-m-01')))->setTime(0, 0, 0);
        $end = $start->modify('last day of this month')->setTime(23, 59, 59);

        return $this->createQueryBuilder('a')
            ->select('a.date')
            ->andWhere('a.user IN (:users)')
            ->andWhere('a.available = true')
            ->andWhere('a.date BETWEEN :start and :end')
            ->setParameter('users', $users)
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->groupBy('a.date')
            ->having('COUNT(DISTINCT a.user) = :userCount')
            ->setParameter('userCount', count($users))
            ->getQuery()
            ->getResult();
    }

    public function lockDateForPlayers(array $players, \DateTimeInterface $date, bool $locked): int
    {
        return $this->createQueryBuilder('a')
            ->update()
            ->set('a.locked', ':locked')
            ->where('a.user IN (:players)')
            ->andWhere('a.date = :date')
            ->setParameter('locked', $locked)
            ->setParameter('players', $players)
            ->setParameter('date', $date)
            ->getQuery()
            ->execute();
    }

    public function insertMonthForUserRaw(int $userId, \DateTimeInterface $start, \DateTimeInterface $end): void
    {
        $conn = $this->getEntityManager()->getConnection();

        $sql = "
            INSERT INTO availability (user_id, available, date, locked)
            SELECT :user_id, true, date::date, false
            FROM generate_series(:start_date::date, :end_date::date, interval '1 day') AS date
            ON CONFLICT (user_id, date) DO NOTHING
        ";

        $conn->executeStatement($sql, [
            'user_id' => $userId,
            'start_date' => $start->format('Y-m-d'),
            'end_date' => $end->format('Y-m-d'),
        ]);
    }

    public function markMonthAvailableForUser(int $userId, \DateTimeInterface $start, \DateTimeInterface $end): int
    {
        return $this->createQueryBuilder('a')
            ->update()
            ->set('a.available', ':available')
            ->where('a.user = :user')
            ->andWhere('a.date BETWEEN :start AND :end')
            ->setParameter('available', true)
            ->setParameter('user', $userId)
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->getQuery()
            ->execute();
    }

    public function findCommonAvailableDatesForGames(array $games, \DateTimeInterface $month): array
    {
        $start = (new \DateTimeImmutable($month->format('Y-m-01')))->setTime(0, 0, 0);
        $end = $start->modify('last day of this month')->setTime(23, 59, 59);

        $dates = [];

        foreach ($games as $game) {
            $players = $game->getAllParticipants();
            if (count($players) === 0) continue;

            $result = $this->createQueryBuilder('a')
                ->select('a.date')
                ->andWhere('a.user IN (:users)')
                ->andWhere('a.available = true')
                ->andWhere('a.date BETWEEN :start AND :end')
                ->setParameter('users', $players)
                ->setParameter('start', $start)
                ->setParameter('end', $end)
                ->groupBy('a.date')
                ->having('COUNT(DISTINCT a.user) = :userCount')
                ->setParameter('userCount', count($players))
                ->getQuery()
                ->getResult();

            foreach ($result as $row) {
                $dateStr = $row['date']->format('Y-m-d');
                if (!isset($dates[$dateStr])) $dates[$dateStr] = [];
                $dates[$dateStr][$game->getId()] = $game->getName();
            }
        }

        return $dates;
    }

    public function findPlayersAvailability($users, \DateTimeInterface $start, \DateTimeInterface $end): array
    {

        $availabilities = $this->createQueryBuilder('a')
            ->join('a.user', 'u')
            ->addSelect('u')
            ->where('a.date BETWEEN :start AND :end')
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->getQuery()
            ->getResult();

        $availabilityMap = [];

        foreach ($availabilities as $availability) {
            $dateKey = $availability->getDate()->format('Y-m-d');
            $userId = $availability->getUser()->getId();

            $availabilityMap[$dateKey][$userId] = true;
        }

        $result = [];
        $period = new \DatePeriod(
            $start,
            new \DateInterval('P1D'),
            $end
        );

        foreach ($period as $date) {
            $dateKey = $date->format('Y-m-d');

            foreach ($users as $user) {
                $result[$dateKey][] = [
                    'name' => $user->getName(),
                    'available' => $availabilityMap[$dateKey][$user->getId()] ?? false
                ];
            }
        }

        return $result;
    }

    public function getStartingTimefromUsers(array $players, \DateTimeInterface $date): ?Availability
    {
        return $this->createQueryBuilder('a')
            ->where('a.user IN (:players)')
            ->andwhere('a.date = :date')
            ->andWhere('a.startingTime IS NOT NULL')
            ->setParameter('players', $players)
            ->setParameter('date', $date)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findByUserAndDateRange($user, \DateTimeInterface $start, \DateTimeInterface $end): array
    {
        return $this->createQueryBuilder('a')
            ->andWhere('a.user = :user')
            ->andWhere('a.date BETWEEN :start AND :end')
            ->setParameter('user', $user)
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->orderBy('a.date', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function checkIfUserHasAvailibilityAlready($user, \DateTimeInterface $start, \DateTimeInterface $end): bool
    {
        return (int) $this->createQueryBuilder('a')
            ->select('COUNT(a.id)')
            ->andWhere('a.user = :user')
            ->andWhere('a.date BETWEEN :start AND :end')
            ->andWhere('a.available = true')
            ->setParameter('user', $user)
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->getQuery()
            ->getSingleScalarResult() > 0;
    }
}