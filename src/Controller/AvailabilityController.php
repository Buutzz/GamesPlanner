<?php

namespace App\Controller;

use App\Repository\AvailabilityRepository;
use App\Repository\GameSessionRepository;
use App\Entity\Availability;
use App\Service\AvailabilityService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;


final class AvailabilityController extends AbstractController
{

    private $em;
    private $availabilityRepository;
    private $availabilityService;

    public function __construct(
        EntityManagerInterface $em,
        AvailabilityRepository $availabilityRepository,
        AvailabilityService $availabilityService
    ) {
        $this->em = $em;
        $this->availabilityRepository = $availabilityRepository;
        $this->availabilityService = $availabilityService;
    }

    #[Route('/availability', name: 'availability_calendar')]
    public function calendar(): Response
    {
        return $this->render('availability/calendar.html.twig');
    }
    

    #[Route('/availability/toggle', name: 'availability_toggle', methods: ['POST'])]
    public function toogle(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $date = new \DateTime($request->request->get('date'));

        $existing = $this->availabilityRepository->findOneBy([
            'user'  => $user,
            'date'  => $date
        ]);

        if ($existing) {
            $this->em->remove($existing);
            $available = false;
        } else {
            $availability = new Availability();
            $availability->setUser($user);
            $availability->setDate($date);
            $availability->setAvailable(true);
            
            $this->em->persist($availability);
            $available = true;
        }

        $this->em->flush();

        return $this->json([
            'available' => $available
        ]);
    }

    #[Route('/availability/mark-month', name: 'availability_mark_month', methods: ['POST'])]
    public function markMonth(Request $request): Response
    {
        if (!$this->isCsrfTokenValid('mark_month', $request->request->get('_token'))) {
            throw $this->createAccessDeniedException();
        }

        $start = (new \DateTimeImmutable((new \DateTime())->format('Y-m-01')))->setTime(0, 0, 0);
        $end = $start->modify('last day of this month')->setTime(23, 59, 59);
        $userId = $this->getUser()->getId();

        $this->availabilityRepository
            ->insertMonthForUserRaw($userId, $start, $end);
        $this->availabilityRepository
            ->markMonthAvailableForUser($userId, $start, $end);

        $this->addFlash('success', 'Miesiąc został ustawiony jako dostępny.');
        
        return $this->redirectToRoute('availability_calendar');
    }

    #[Route('/availability/set-time', methods: ['POST'])]
    public function setTime(Request $request, GameSessionRepository $gameSessionRepository,): JsonResponse
    {
        $date = new \DateTime($request->request->get('date'));
        $time = $request->request->get('time');

        $availability = $this->availabilityRepository->findOneBy([
            'user' => $this->getUser(),
            'date' => $date
        ]);

        if (!$availability) {
            return $this->json(['success' => false]);
        }

        $availability->setStartingTime(\DateTime::createFromFormat('H:i', $time));

        $dateSession = $gameSessionRepository->userHasSessionOnDate($this->getUser(), $date);

        if ($dateSession) {
            $timeObj = \DateTime::createFromFormat('H:i', $time);
            $dateSession->setSessionStartingTime($timeObj);
        }

        $this->em->flush();

        return $this->json(['success' => true]);
    }

    #[Route('/availability/month', name: 'availability_month', methods: ['GET'])]
    public function month(
        Request $request,
    ): JsonResponse {
        $year = (int)$request->query->get('year');
        $month = (int)$request->query->get('month');

        $days = $this->availabilityService->getMonthData(
            $this->getUser(),
            $year,
            $month
        );

        return $this->json([
            'days' => $days,
        ]);
    }
}
