<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\User;

#[Route('/admin')]
final class AdminController extends AbstractController
{
    #[Route('/users', name: 'admin_users')]
    public function users(UserRepository $userRepository): Response
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $users = $userRepository->findBy([], ['id' => 'ASC']);

        return $this->render('admin/users.html.twig', [
            'users' => $users
        ]);
    }

    #[Route('/grant-dm/{id}', name: 'admin_grant_dm')]
    public function grantDm(User $user, EntityManagerInterface $em): Response
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $roles = $user->getRoles();

        if (!in_array('ROLE_DM', $roles)) {
            $roles[] = 'ROLE_DM';
            $user->setRoles($roles);

            $em->flush();
        }

        return $this->redirectToRoute('admin_users');
    }

    #[Route('/remove-dm/{id}', name: 'admin_remove_dm')]
    public function removeDm(User $user, EntityManagerInterface $em): Response
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $roles = array_filter(
            $user->getRoles(),
            fn($role) => $role !== 'ROLE_DM'
        );

        $user->setRoles($roles);
        $em->flush();

        return $this->redirectToRoute('admin_users');
    }
}
