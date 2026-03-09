<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260307112824 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE game ADD discord_role_id BIGINT DEFAULT NULL');
        $this->addSql('ALTER TABLE game ALTER discord_channel_id TYPE BIGINT');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE "game" DROP discord_role_id');
        $this->addSql('ALTER TABLE "game" ALTER discord_channel_id TYPE INT');
    }
}
