<?php

namespace App\Repository;

use App\Entity\GameSession;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<GameSession>
 */
class GameSessionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, GameSession::class);
    }

    public function isDateAvailableForGame(array $players, \DateTimeInterface $date): bool
    {
        $qb = $this->createQueryBuilder('s')
            ->join('s.game', 'g')
            ->join('g.players', 'p')
            ->andWhere('p IN (:players)')
            ->andWhere('s.date = :date')
            ->setParameter('players', $players)
            ->setParameter('date', $date)
            ->getQuery();

        $result = $qb->getResult();

        return count($result) === 0;
    }

    public function findUpcoming($start, $end): array
    {
        return $this->createQueryBuilder('s')
            ->where('s.date >= :start')
            ->andWhere('s.date <= :end')
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->orderBy('s.date', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function userHasSessionOnDate(User $user, \DateTimeInterface $date): ?GameSession
    {
        return $this->createQueryBuilder('gs')
            ->join('gs.game', 'g')
            ->leftJoin('g.players', 'p')
            ->where('gs.date = :date')
            ->andWhere('g.owner = :user OR p = :user')
            ->setParameter('date', $date)
            ->setParameter('user', $user)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
