<?php

namespace App\Entity;

use App\Repository\GameSessionRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: GameSessionRepository::class)]
class GameSession
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Game::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Game $game = null;

    #[ORM\Column(type: 'date')]
    private ?\DateTimeInterface $date = null;

    #[ORM\Column(type: 'time', nullable: true)]
    private ?\DateTimeInterface $sessionStartingTime = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getGame(): ?Game 
    { 
        return $this->game;
    }
    
    public function setGame(Game $game): self 
    { 
        $this->game = $game;
        return $this; 
    }
    
    public function getDate(): ?\DateTimeInterface 
    { 
        return $this->date;
    }
    
    public function setDate(\DateTimeInterface $date): self 
    { 
        $this->date = $date;
        return $this;
    }

    public function getSessionStartingTime(): ?\DateTimeInterface
    {
        return $this->sessionStartingTime;
    }

    public function setSessionStartingTime(?\DateTimeInterface $sessionStartingTime): self
    {
        $this->sessionStartingTime = $sessionStartingTime;

        return $this;
    }
}
