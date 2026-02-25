<?php

namespace App\Twig\Extension;

use App\Twig\Runtime\AppExtensionRuntime;
use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;
use Twig\TwigFunction;

class AppExtension extends AbstractExtension
{
    public function getFilters(): array
    {
        return [
            new TwigFilter('role_name', [$this, 'roleName']),
        ];
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('function_name', [AppExtensionRuntime::class, 'doSomething']),
        ];
    }

    public function roleName(string $role): string
    {
        $map = [
            'ROLE_USER' => 'Gracz',
            'ROLE_ADMIN' => 'Admin',
            'ROLE_DM' => 'Mistrz Gry',
        ];

        return $map[$role] ?? $role;
    }
}
