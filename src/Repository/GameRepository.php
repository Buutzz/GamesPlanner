<?php

namespace App\Repository;

use App\Entity\Game;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Game>
 */
class GameRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Game::class);
    }

    public function findAllActiveGamesArray(): array
    {
        $games = $this->findBy(['active' => true], ['id' => 'ASC']);

        $gamesArray = [];
        foreach ($games as $game){
            $gamesArray[$game->getId()] = $game->getName();
        }

        return $gamesArray;
    }
}