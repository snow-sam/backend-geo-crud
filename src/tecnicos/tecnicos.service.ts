import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as XLSX from 'xlsx';

import { Tecnico } from './tecnicos.entity';
import type { Repository } from 'typeorm';
import { GeocodingService } from '../geocoding/geocoding.service';
import type { ExcelTecnicoRow } from './dtos/import-tecnico.dto';
import { WorkspaceCrudService } from '../common/workspace-crud.service';
import { User } from '../users/user.entity';
import { Workspace } from '../workspaces/workspace.entity';
import { auth } from '../auth/better-auth.config';
import { CrudRequest } from '@dataui/crud';
import { request } from 'http';

@Injectable()
export class TecnicosService extends WorkspaceCrudService<Tecnico> {
  private readonly logger = new Logger(TecnicosService.name);

  constructor(
    @InjectRepository(Tecnico) repo: Repository<Tecnico>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Workspace) private readonly workspaceRepo: Repository<Workspace>,
    private readonly geocodingService: GeocodingService,
  ) {
    super(repo);
  }

  /**
   * Gera uma senha temporária caso a placa não seja informada
   */
  private generateTempPassword(): string {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
  }

  /**
   * Cria um usuário no Better Auth e na tabela local
   */
  private async createAuthUser(email: string, password: string): Promise<User> {
    try {
      // Cria usuário no Better Auth
      const authResult = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: email.split('@')[0],
        },
      });

      if (!authResult?.user) {
        throw new BadRequestException('Falha ao criar usuário no sistema de autenticação');
      }

      this.logger.log(`Usuário criado no Better Auth: ${authResult.user.id}`);

      // Cria usuário na tabela local
      const user = this.userRepo.create({
        authUserId: authResult.user.id,
        email,
      });

      await this.userRepo.save(user);
      this.logger.log(`Usuário criado localmente: ${user.id}`);

      return user;
    } catch (error) {
      this.logger.error(`Erro ao criar usuário: ${error.message}`);
      throw new BadRequestException(`Falha ao criar usuário: ${error.message}`);
    }
  }

  /**
   * Sobrescreve o método de criação para incluir criação de usuário
   */
  async createOneWithWorkspace(
    req: CrudRequest,
    dto: Partial<Tecnico>,
    workspaceId: string,
  ): Promise<Tecnico> {
    // Define a senha como a placa ou gera uma temporária
    const password = dto.placa || this.generateTempPassword();

    // Cria o usuário no sistema de autenticação
    const user = await this.createAuthUser(dto.email!, password);

    // Adiciona o userId ao DTO
    const entityWithUser = {
      ...dto,
      workspaceId,
      userId: user.id,
    } as unknown as Tecnico;

    return this.createOne(req, entityWithUser as any);
  }

  /**
   * Busca técnico pelo email do usuário autenticado
   */
  async findByEmail(email: string): Promise<Tecnico> {
    const tecnico = await this.repo.findOne({
      where: { email },
      relations: ['roteiros', 'roteiros.visitas', 'roteiros.visitas.cliente'],
    });

    if (!tecnico) {
      throw new NotFoundException('Técnico não encontrado para este email');
    }

    return tecnico;
  }

  /**
   * Deleta um técnico e seu usuário associado
   */
  async deleteOneByWorkspace(req: CrudRequest, workspaceId: string): Promise<void | Tecnico> {
    // Validar ownership e buscar o técnico com o usuário
    const tecnico = await this.validateWorkspaceOwnership(req, workspaceId);

    // Buscar o técnico completo com relação ao usuário
    const tecnicoCompleto = await this.repo.findOne({
      where: { id: tecnico.id } as any,
      relations: ['user'],
    });

    // Se o técnico tem um usuário associado, deletá-lo
    if (tecnicoCompleto?.userId && tecnicoCompleto.user) {
      try {
        // Deletar usuário no Better Auth
        await auth.api.deleteUser({
          body: {
            token: (request as any).session.token,
          },
        });
        this.logger.log(`Usuário ${tecnicoCompleto.user.email} deletado no Better Auth`);
      } catch (error) {
        this.logger.error(`Erro ao deletar usuário no Better Auth: ${error.message}`);
        // Continua com a deleção do técnico mesmo se falhar ao deletar o usuário
      }

      // Deletar usuário na tabela local
      try {
        await this.userRepo.remove(tecnicoCompleto.user);
        this.logger.log(`Usuário ${tecnicoCompleto.user.email} deletado localmente`);
      } catch (error) {
        this.logger.error(`Erro ao deletar usuário localmente: ${error.message}`);
        // Continua com a deleção do técnico mesmo se falhar ao deletar o usuário
      }
    }

    // Deletar o técnico
    return super.deleteOneByWorkspace(req, workspaceId);
  }

  async importFromExcel(fileBuffer: Buffer, workspaceId: string, activeOrganizationId: string): Promise<Tecnico[]> {
    // Ler o arquivo Excel do buffer
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Converter para JSON
    const rows = XLSX.utils.sheet_to_json<ExcelTecnicoRow>(sheet);

    if (rows.length === 0) {
      throw new BadRequestException('O arquivo Excel está vazio');
    }

    this.logger.log(`Importando ${rows.length} técnicos do Excel`);

    const savedTecnicos: Tecnico[] = [];
    const errors: string[] = [];

    for (const [index, row] of rows.entries()) {
      this.logger.log(
        `(${index + 1}/${rows.length}) Processando: ${row.nome}`,
      );

      // Validar campos obrigatórios
      if (!row.nome || !row.endereco || !row.telefone || !row.email) {
        errors.push(
          `Linha ${index + 2}: Nome, endereço, telefone e email são obrigatórios`,
        );
        continue;
      }

      const email = row.email.toString().trim().toLowerCase();
      const placa = row.placa?.toString().trim().toUpperCase() || undefined;

      // Criar usuário no sistema de autenticação
      let user: User;
      try {
        const password = `${placa}0` || this.generateTempPassword();
        user = await this.createAuthUser(email, password);
        this.logger.log(`Usuário criado para técnico: ${email}`);
      } catch (error) {
        errors.push(
          `Linha ${index + 2}: Erro ao criar usuário para "${email}": ${error.message}`,
        );
        continue;
      }

      // Buscar o workspace para obter o authOrganizationId
      const workspace = await this.workspaceRepo.findOne({
        where: { id: workspaceId },
        select: ['authOrganizationId'],
      });

      if (!workspace) {
        errors.push(
          `Linha ${index + 2}: Workspace não encontrado para o ID "${workspaceId}"`,
        );
        continue;
      }
      console.log('activeOrganizationId', activeOrganizationId);
      // Adicionar usuário à organização no Better Auth via API
      try {
        await auth.api.addMember({
          body: {
            organizationId: activeOrganizationId,
            userId: user.authUserId,
            role: 'member',
          },
        });

        this.logger.log(`Usuário ${email} adicionado à organização ${workspace.authOrganizationId}`);
      } catch (error) {
        this.logger.error(`Erro ao adicionar usuário à organização: ${error.message}`);
        // Não bloqueia a criação do técnico se falhar ao adicionar à organização
        // O usuário pode ser adicionado manualmente depois
      }

      // Buscar dados de geocodificação
      const geoData = await this.geocodingService.geocodeAddress(row.endereco);

      if (!geoData) {
        errors.push(
          `Linha ${index + 2}: Não foi possível geocodificar o endereço "${row.endereco}"`,
        );
        continue;
      }

      // Criar objeto do técnico com userId
      const tecnicoDto: Partial<Tecnico> = {
        nome: row.nome.trim(),
        telefone: row.telefone.toString().trim(),
        email,
        endereco: geoData.enderecoFormatado,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        placeId: geoData.placeId,
        placa,
        especialidade: row.especialidade?.toString().trim() || undefined,
        eAtivo: true,
        userId: user.id,
      };

      // Adicionar workspaceId ao DTO e salvar diretamente
      // O workspaceId já está garantido no DTO, então podemos usar repo.save() diretamente
      const tecnicoComWorkspace = {
        ...tecnicoDto,
        workspaceId,
      } as Tecnico;

      const savedTecnico = await this.repo.save(tecnicoComWorkspace);
      savedTecnicos.push(savedTecnico);

      // Delay de 150ms entre chamadas para evitar rate limiting da API
      await this.geocodingService.delay(150);
    }

    if (savedTecnicos.length === 0) {
      throw new BadRequestException(
        `Nenhum técnico válido para importar. Erros: ${errors.join('; ')}`,
      );
    }

    this.logger.log(
      `${savedTecnicos.length} técnicos importados com sucesso`,
    );

    if (errors.length > 0) {
      this.logger.warn(`Erros durante importação: ${errors.join('; ')}`);
    }

    return savedTecnicos;
  }
}