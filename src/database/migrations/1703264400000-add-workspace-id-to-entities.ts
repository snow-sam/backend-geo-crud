import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration para adicionar workspaceId em todas as entidades principais
 * para suportar multi-tenancy baseado em workspace.
 */
export class AddWorkspaceIdToEntities1703264400000 implements MigrationInterface {
  name = 'AddWorkspaceIdToEntities1703264400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adiciona coluna workspaceId nas tabelas
    await queryRunner.query(`
      ALTER TABLE "clientes" 
      ADD COLUMN IF NOT EXISTS "workspaceId" uuid;
    `);

    await queryRunner.query(`
      ALTER TABLE "tecnicos" 
      ADD COLUMN IF NOT EXISTS "workspaceId" uuid;
    `);

    await queryRunner.query(`
      ALTER TABLE "chamados" 
      ADD COLUMN IF NOT EXISTS "workspaceId" uuid;
    `);

    await queryRunner.query(`
      ALTER TABLE "roteiros" 
      ADD COLUMN IF NOT EXISTS "workspaceId" uuid;
    `);

    await queryRunner.query(`
      ALTER TABLE "visitas" 
      ADD COLUMN IF NOT EXISTS "workspaceId" uuid;
    `);

    // Adiciona índices para performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_clientes_workspaceId" ON "clientes" ("workspaceId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tecnicos_workspaceId" ON "tecnicos" ("workspaceId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_chamados_workspaceId" ON "chamados" ("workspaceId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_roteiros_workspaceId" ON "roteiros" ("workspaceId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_visitas_workspaceId" ON "visitas" ("workspaceId");
    `);

    // Adiciona foreign keys
    await queryRunner.query(`
      ALTER TABLE "clientes"
      ADD CONSTRAINT "FK_clientes_workspace" 
      FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") 
      ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "tecnicos"
      ADD CONSTRAINT "FK_tecnicos_workspace" 
      FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") 
      ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "chamados"
      ADD CONSTRAINT "FK_chamados_workspace" 
      FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") 
      ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "roteiros"
      ADD CONSTRAINT "FK_roteiros_workspace" 
      FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") 
      ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "visitas"
      ADD CONSTRAINT "FK_visitas_workspace" 
      FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") 
      ON DELETE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign keys
    await queryRunner.query(`
      ALTER TABLE "visitas" DROP CONSTRAINT IF EXISTS "FK_visitas_workspace";
    `);

    await queryRunner.query(`
      ALTER TABLE "roteiros" DROP CONSTRAINT IF EXISTS "FK_roteiros_workspace";
    `);

    await queryRunner.query(`
      ALTER TABLE "chamados" DROP CONSTRAINT IF EXISTS "FK_chamados_workspace";
    `);

    await queryRunner.query(`
      ALTER TABLE "tecnicos" DROP CONSTRAINT IF EXISTS "FK_tecnicos_workspace";
    `);

    await queryRunner.query(`
      ALTER TABLE "clientes" DROP CONSTRAINT IF EXISTS "FK_clientes_workspace";
    `);

    // Remove índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_visitas_workspaceId";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_roteiros_workspaceId";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_chamados_workspaceId";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tecnicos_workspaceId";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clientes_workspaceId";`);

    // Remove colunas
    await queryRunner.query(`ALTER TABLE "visitas" DROP COLUMN IF EXISTS "workspaceId";`);
    await queryRunner.query(`ALTER TABLE "roteiros" DROP COLUMN IF EXISTS "workspaceId";`);
    await queryRunner.query(`ALTER TABLE "chamados" DROP COLUMN IF EXISTS "workspaceId";`);
    await queryRunner.query(`ALTER TABLE "tecnicos" DROP COLUMN IF EXISTS "workspaceId";`);
    await queryRunner.query(`ALTER TABLE "clientes" DROP COLUMN IF EXISTS "workspaceId";`);
  }
}

