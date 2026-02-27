<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Doctrine\ORM\EntityManagerInterface;
use App\Repository\GameRepository;
use App\Repository\GameSessionRepository;
use App\Repository\AvailabilityRepository;
use App\Entity\Game;
use App\Entity\GameSession;
use App\Form\GameFormType;
use App\Repository\UserRepository;

final class GameController extends AbstractController
{

    private $em;
    private $gameRepository;
    private $gameSessionRepository;
    private $availabilityRepository;

    /**
     * Class constructor.
     */
    public function __construct(EntityManagerInterface $em, GameRepository $gameRepository, GameSessionRepository $gameSessionRepository, AvailabilityRepository $availabilityRepository)
    {
        $this->em = $em;
        $this->gameRepository = $gameRepository;
        $this->gameSessionRepository = $gameSessionRepository;
        $this->availabilityRepository = $availabilityRepository;
    }

    #[Route('/games', name: 'games')]
    public function index(): Response
    {
        if ($this->isGranted('ROLE_ADMIN')) {
            $games = $this->gameRepository->findBy([], ['id' => 'ASC']);
        } else {
            $games = $this->gameRepository->findBy(['owner' => $this->getUser()], ['id' => 'ASC']);
        }

        return $this->render('game/index.html.twig', [
            'games' => $games,
        ]);
    }

    #[Route('/games/create', name: 'create_game')]
    public function create(Request $request): Response
    {
        $game = new Game();
        $game->setOwner($this->getUser());
        $form = $this->createForm(GameFormType::class, $game);

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            $newGame = $form->getData();
            $this->em->persist($newGame);
            $this->em->flush();

            return $this->redirectToRoute('games');
        }

        return $this->render('game/create.html.twig', [
            'form' => $form->createView()
        ]);
    }

    #[Route('games/edit/{id}', name: 'edit_game')]
    public function edit($id, Request $request): Response
    {
        $game = $this->gameRepository->find($id);
        $form = $this->createForm(GameFormType::class, $game);

        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $game->setName($form->get('name')->getData());
            $game->setActive($form->get('active')->getData());
            $game->setOwner($form->get('owner')->getData());
            $game->setPlayers($form->get('players')->getData());

            $this->em->persist($game);
            $this->em->flush();

            return $this->redirectToRoute('game', ['id' => $id]);
        }

        return $this->render('game/edit.html.twig', [
            'game'  => $game,
            'form'  => $form->createView()
        ]);
    }

    #[Route('/games/{id}', methods: ['GET'], name: 'game')]
    public function show($id, UserRepository $userRepository): Response
    {
        $game = $this->gameRepository->find($id);
        $players = $game->getPlayers()->toArray();

        $playersWithoutAvailibility = $userRepository
            ->findUsersWithoutAvailabilityForMonth($game, new \DateTime());

        $commonDatesRaw = $this->availabilityRepository
            ->findCommonAvailableDatesForUsersInMonth($players, new \DateTime());

        $sessionDatesRaw = $this->gameSessionRepository->findBy(['game' => $id]);

        $sessionDates = array_map(function($row) {
            return $row->getDate()->format('Y-m-d'); 
        }, $sessionDatesRaw);
        
        $commonDates = array_map(function($row) {
            return $row['date']->format('Y-m-d');
        }, $commonDatesRaw);


        return $this->render('game/show.html.twig', [
            'game'                          => $game,
            'commonDates'                   => $commonDates,
            'sessionDates'                  => $sessionDates,
            'playersWithoutAvailibility'    => $playersWithoutAvailibility
        ]);
    }

    #[Route('/games/{id}/reserve', name: 'game_reserve', methods: ['POST'])]
    public function reserve(Game $game, Request $request): JsonResponse
    {
        $date = new \DateTime($request->request->get('date'));
        $players = $game->getPlayers()->toArray();

        if (!$this->gameSessionRepository->isDateAvailableForGame($players, $date)) {
            return $this->json([
                'success'   => false,
                'message'   => 'Termin jest już zarezerwowany dla tych graczy'
            ], 409);
        }

        $session = new GameSession();
        $session->setGame($game);
        $session->setDate($date);

        $this->em->persist($session);

        $this->availabilityRepository->lockDateForPlayers($players, $date, true);

        $this->em->flush();

        return $this->json([
            'success' => true,
            'date' => $date->format('Y-m-d')
        ]);
    }

    #[Route('/games/{id}/cancel', name: 'game_cancel', methods: ['POST'])]
    public function cancel(Game $game, Request $request): JsonResponse
    {
        $date = new \DateTime($request->request->get('date'));
        $players = $game->getPlayers()->toArray();

        $session = $this->gameSessionRepository->findOneBy([
            'game' => $game,
            'date' => $date
        ]);

        if (!$session) {
            return $this->json([
                'success'   => false,
                'message'   => 'Nie ma sesji do anulowania'
            ], 404);
        }

        $this->em->remove($session);

        $this->availabilityRepository->lockDateForPlayers($players, $date, false);

        $this->em->flush();

        return $this->json([
            'success'   => true,
            'date'      => $date->format('Y-m-d')
        ]);
    }
}
