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
}
