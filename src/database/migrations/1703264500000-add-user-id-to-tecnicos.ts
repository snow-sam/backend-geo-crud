import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration para adicionar userId na tabela de técnicos
 * para vincular técnicos a usuários do sistema de autenticação.
 */
export class AddUserIdToTecnicos1703264500000 implements MigrationInterface {
  name = 'AddUserIdToTecnicos1703264500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adiciona coluna userId na tabela tecnicos
    await queryRunner.query(`
      ALTER TABLE "tecnicos" 
      ADD COLUMN IF NOT EXISTS "userId" uuid;
    `);

    // Adiciona índice para performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tecnicos_userId" ON "tecnicos" ("userId");
    `);

    // Adiciona foreign key para users
    await queryRunner.query(`
      ALTER TABLE "tecnicos"
      ADD CONSTRAINT "FK_tecnicos_user" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") 
      ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key
    await queryRunner.query(`
      ALTER TABLE "tecnicos" DROP CONSTRAINT IF EXISTS "FK_tecnicos_user";
    `);

    // Remove índice
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tecnicos_userId";`);

    // Remove coluna
    await queryRunner.query(`ALTER TABLE "tecnicos" DROP COLUMN IF EXISTS "userId";`);
  }
}

