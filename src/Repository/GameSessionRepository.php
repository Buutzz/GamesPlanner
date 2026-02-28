<?php

namespace App\Repository;

use App\Entity\GameSession;
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
}
