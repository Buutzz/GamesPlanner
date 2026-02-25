<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use App\Form\UserEditFormType;
use Doctrine\ORM\EntityManagerInterface;

final class UserPanelController extends AbstractController
{

    private $em;

    public function __construct(EntityManagerInterface $em)
    {
        $this->em = $em;
    }

    #[Route('/user/panel', name: 'app_user_panel')]
    public function index(): Response
    {
        $user = $this->getUser();

        return $this->render('user_panel/index.html.twig', [
            'user' => $user,
        ]);
    }

    #[Route('/user/panel/edit', name: 'app_user_name_edit')]
    public function save(Request $request): Response
    {
        $user = $this->getUser();
        $userForm = $this->createForm(UserEditFormType::class, $user);

        $userForm->handleRequest($request);

        if ($userForm->isSubmitted() && $userForm->isValid()) {
            $user->setName($userForm->get('name')->getData());

            $this->em->persist($user);
            $this->em->flush();

            return $this->redirectToRoute('app_user_panel');
        }

        return $this->render('user_panel/edit.html.twig', [
            'user'  => $user,
            'form'  => $userForm->createView()
        ]);
    }

    /*
     if ($form->isSubmitted() && $form->isValid()) {
            $game->setName($form->get('name')->getData());
            $game->setActive($form->get('active')->getData());
            $game->setOwner($form->get('owner')->getData());
            $game->setPlayers($form->get('players')->getData());

            $this->em->persist($game);
            $this->em->flush();

            return $this->redirectToRoute('game', ['id' => $id]);
        }

        return $this->render('game/edit.html.twig',[
            'game'  => $game,
            'form'  => $form->createView()
        ]);
        */
}
