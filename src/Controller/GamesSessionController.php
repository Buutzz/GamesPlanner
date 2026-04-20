<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use App\Repository\GameSessionRepository;

#[Route('/api')]
class GamesSessionController extends AbstractController
{
    #[Route('/sessions/upcoming', methods: ['GET'], name:'api_sessions_upcoming')]
    public function upcoming(
        Request $request,
        GameSessionRepository $repo
    ): JsonResponse {

        $token = $request->headers->get('X-API-TOKEN');

        if ($token !== $_ENV['BOT_API_TOKEN']) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        $start = new \DateTimeImmutable((new \DateTime())->format('Y-m-d 00:00:01'));
        $end = $start->modify('last day of +1 month')->setTime(23, 59, 59);

        $sessions = $repo->findUpcoming($start, $end);

        $data = [];

        foreach ($sessions as $session) {
            $game = $session->getGame();

            $data[] = [
                'id' => $session->getId(),
                'game' => $game->getName(),
                'date' => $session->getDate()->format('Y-m-d'),
                'time' => $session->getSessionStartingTime()?->format('H:i') ?? "19:30",
                'channel_id' => $game->getDiscordChannelId(),
                'role_id' => $game->getDiscordRoleId(),
            ];
        }

        return $this->json($data);
    }
}