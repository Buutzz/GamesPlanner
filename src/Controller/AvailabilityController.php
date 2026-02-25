<?php

namespace App\Controller;

use App\Repository\AvailabilityRepository;
use App\Entity\Availability;
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

    public function __construct(EntityManagerInterface $em, AvailabilityRepository $availabilityRepository)
    {
        $this->em = $em;
        $this->availabilityRepository = $availabilityRepository;
    }

    #[Route('/availability', name: 'availability_calendar')]
    public function calendar(): Response
    {
        $user = $this->getUser();

        $records = $this->availabilityRepository->findBy(['user' => $user]);

        $dates = array_map(
            fn($a) => $a->getDate()->format('Y-m-d'),
            $records
        );
    
        return $this->render('availability/calendar.html.twig', [
            'availableDates' => $dates
        ]);
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
}
