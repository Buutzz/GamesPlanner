<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use App\Repository\GameRepository;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: GameRepository::class)]
#[ORM\Table(name: '`game`')]
class Game
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $name;

    #[ORM\ManyToOne(inversedBy: 'ownedGames')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $owner = null;

    #[ORM\ManyToMany(targetEntity: User::class, inversedBy: 'games')]
    #[ORM\JoinTable(name: 'game_players')]
    private Collection $players;

    #[ORM\Column(type: 'boolean')]
    private bool $active = true;

    #[ORM\Column(type: 'bigint', nullable: true)]
    private ?string $discordChannelId;

    #[ORM\Column(type: 'bigint', nullable: true)]
    private ?string $discordRoleId;

    public function __construct()
    {
        $this->players = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;
        return $this;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): self
    {
        $this->owner = $owner;
        return $this;
    }

    /**
     * @return Collection<int, User>
     */
    public function getPlayers(): Collection
    {
        return $this->players;
    }

    public function setPlayers(Collection $players): self
    {
        $this->players = $players;
        return $this;
    }

    public function addPlayers(User $user): self
    {
        if (!$this->players->contains($user)) {
            $this->players->add($user);
        }

        return $this;
    }

    public function removePlayer(User $user): self
    {
        $this->players->removeElement($user);
        return $this;
    }

    public function isActive(): bool
    {
        return $this->active;
    }

    public function setActive(bool $active): self
    {
        $this->active = $active;
        return $this;
    }

    public function getAllParticipants(): array
    {
        $participants = $this->players->toArray();

        if (!in_array($this->owner, $participants, true)) {
            $participants[] = $this->owner;
        }

        return $participants;
    }

    public function setDiscordChannelId(string $discordChannelId): self
    {
            $this->discordChannelId = $discordChannelId;
            return $this;
    }

    public function getDiscordChannelId(): ?string
    {
        return $this->discordChannelId;
    }

    public function setDiscordRoleId(string $discordRoleId): self
    {
            $this->discordRoleId = $discordRoleId;
            return $this;
    }

    public function getDiscordRoleId(): ?string
    {
        return $this->discordRoleId;
    }
}
