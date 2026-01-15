import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { ObjectLiteral, Repository, FindOptionsWhere } from 'typeorm';
import { CrudRequest, CreateManyDto } from '@dataui/crud';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

export interface WorkspaceEntity extends ObjectLiteral {
  id: string;
  workspaceId: string;
}

export abstract class WorkspaceCrudService<
  T extends WorkspaceEntity,
> extends TypeOrmCrudService<T> {
  constructor(repo: Repository<T>) {
    super(repo);
  }

  /**
   * Adiciona filtro de workspace ao CrudRequest
   */
  protected addWorkspaceFilter(req: CrudRequest, workspaceId: string): CrudRequest {
    const workspaceFilter = { workspaceId: { $eq: workspaceId } };
    const existingSearch = req.parsed.search;

    // Se não existe search ou está vazio, cria um novo $and com apenas o filtro de workspace
    if (!existingSearch || Object.keys(existingSearch).length === 0) {
      req.parsed.search = { $and: [workspaceFilter] };
    } else if (existingSearch.$and && Array.isArray(existingSearch.$and)) {
      // Se já existe um $and, adiciona o filtro de workspace a ele
      existingSearch.$and.push(workspaceFilter);
    } else if (existingSearch.$or && Array.isArray(existingSearch.$or)) {
      // Se existe um $or, envolve tudo em um $and
      req.parsed.search = {
        $and: [{ $or: existingSearch.$or }, workspaceFilter],
      };
    } else {
      // Se existe outro tipo de filtro, envolve tudo em um $and
      const { $and, $or, ...otherFilters } = existingSearch;

      if (Object.keys(otherFilters).length > 0) {
        req.parsed.search = {
          $and: [otherFilters, workspaceFilter],
        };
      } else {
        req.parsed.search = { $and: [workspaceFilter] };
      }
    }

    return req;
  }

  /**
   * Busca muitos registros filtrados por workspace
   */
  async getManyByWorkspace(req: CrudRequest, workspaceId: string): Promise<T[] | { data: T[]; count: number; total: number; page: number; pageCount: number }> {
    this.addWorkspaceFilter(req, workspaceId);
    return this.getMany(req);
  }

  /**
   * Busca um registro por ID, validando pertencimento ao workspace
   */
  async getOneByWorkspace(req: CrudRequest, workspaceId: string): Promise<T> {
    this.addWorkspaceFilter(req, workspaceId);
    return this.getOne(req);
  }

  /**
   * Cria um registro com workspaceId
   */
  async createOneWithWorkspace(req: CrudRequest, dto: Partial<T>, workspaceId: string): Promise<T> {
    const entityWithWorkspace = {
      ...dto,
      workspaceId,
    } as unknown as T;

    return this.createOne(req, entityWithWorkspace as any);
  }

  /**
   * Cria múltiplos registros com workspaceId
   */
  async createManyWithWorkspace(
    req: CrudRequest,
    dto: CreateManyDto<T>,
    workspaceId: string,
  ): Promise<T[]> {
    const entitiesWithWorkspace = dto.bulk.map((item) => ({
      ...item,
      workspaceId,
    }));

    return this.createMany(req, { bulk: entitiesWithWorkspace } as CreateManyDto<T>);
  }

  /**
   * Atualiza um registro, validando pertencimento ao workspace
   */
  async updateOneByWorkspace(
    req: CrudRequest,
    dto: Partial<T>,
    workspaceId: string,
  ): Promise<T> {
    await this.validateWorkspaceOwnership(req, workspaceId);
    return this.updateOne(req, dto as any);
  }

  /**
   * Substitui um registro, validando pertencimento ao workspace
   */
  async replaceOneByWorkspace(
    req: CrudRequest,
    dto: Partial<T>,
    workspaceId: string,
  ): Promise<T> {
    await this.validateWorkspaceOwnership(req, workspaceId);
    const entityWithWorkspace = {
      ...dto,
      workspaceId,
    } as unknown as T;
    return this.replaceOne(req, entityWithWorkspace as any);
  }

  /**
   * Deleta um registro, validando pertencimento ao workspace
   */
  async deleteOneByWorkspace(req: CrudRequest, workspaceId: string, token?: string): Promise<void | T> {
    await this.validateWorkspaceOwnership(req, workspaceId);
    return this.deleteOne(req);
  }

  /**
   * Valida se o registro pertence ao workspace
   */
  protected async validateWorkspaceOwnership(
    req: CrudRequest,
    workspaceId: string,
  ): Promise<T> {
    const id = req.parsed.paramsFilter?.find((p) => p.field === 'id')?.value;

    if (!id) {
      throw new NotFoundException('ID não encontrado na requisição');
    }

    const entity = await this.repo.findOne({
      where: { id } as FindOptionsWhere<T>,
    });

    if (!entity) {
      throw new NotFoundException('Registro não encontrado');
    }

    if (entity.workspaceId !== workspaceId) {
      throw new ForbiddenException('Este registro não pertence ao seu workspace');
    }

    return entity;
  }

  /**
   * Busca direta por ID com validação de workspace
   */
  async findByIdAndWorkspace(id: string, workspaceId: string): Promise<T | null> {
    return this.repo.findOne({
      where: { id, workspaceId } as FindOptionsWhere<T>,
    });
  }
}

