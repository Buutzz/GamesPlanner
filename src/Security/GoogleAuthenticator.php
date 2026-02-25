<?php

namespace App\Security;

use KnpU\OAuth2ClientBundle\Client\ClientRegistry;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Routing\RouterInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;
use Symfony\Component\Security\Core\User\UserProviderInterface;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\User;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\HttpFoundation\Response;

class GoogleAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        private ClientRegistry $clientRegistry,
        private EntityManagerInterface $em,
        private RouterInterface $router
    ) {}

    public function supports(Request $request): ?bool
    {
        return $request->attributes->get('_route') === 'connect_google_check';
    }

    public function authenticate(Request $request): SelfValidatingPassport
    {
        $client = $this->clientRegistry->getClient('google');
        $googleUser = $client->fetchUser();

        return new SelfValidatingPassport(
            new UserBadge($googleUser->getEmail(), function () use ($googleUser) {
                $userRepository = $this->em->getRepository(User::class);
                $user = $userRepository->findOneBy(['googleId' => $googleUser->getId()]);

                if ($user) {
                    return $user;
                }

                $user = $userRepository->findOneBy(['email' => $googleUser->getEmail()]);

                if ($user) {
                    $user->setGoogleId($googleUser->getId());
                    $this->em->flush();
                    return $user;
                }

                if (!$user) {
                    $user = new User();
                    $user->setEmail($googleUser->getEmail());
                    $user->setName($googleUser->getName());
                    $user->setGoogleId($googleUser->getId());
                    $user->setPassword(bin2hex(random_bytes(32)));
                    $user->setRoles(['ROLE_USER']);
                    $this->em->persist($user);
                    $this->em->flush();
                }

                return $user;
            })
        );
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): RedirectResponse
    {
        return new RedirectResponse('/');
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        // możesz przekierować np. na login
        return new RedirectResponse('/login');
    }
}
