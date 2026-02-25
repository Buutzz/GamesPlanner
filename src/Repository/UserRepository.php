<?php

namespace App\Repository;

use App\Entity\User;
use App\Entity\Game;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    /**
     * Used to upgrade (rehash) the user's password automatically over time.
     */
    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
        }

        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->persist($user);
        $this->getEntityManager()->flush();
    }

    public function findUsersWithoutAvailabilityForMonth(Game $game, \DateTimeInterface $month): array
    {
        $start = new \DateTimeImmutable($month->format('Y-m-01 00:00:00'));
        $end   = $start->modify('last day of this month 23:59:59');

        return $this->createQueryBuilder('u')
            ->join('u.games', 'g')
            ->leftJoin(
                'u.availabilities',
                'a',
                'WITH',
                'a.date BETWEEN :start AND :end'
            )
            ->where('g = :game')
            ->andWhere('a.id IS NULL')
            ->setParameter('game', $game)
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->getQuery()
            ->getResult();
    }
}
