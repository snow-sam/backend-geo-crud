import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { CrudRequest } from '@dataui/crud';

const PARSED_CRUD_REQUEST_KEY = 'NESTJSX_PARSED_CRUD_REQUEST_KEY';

/**
 * Interceptor que adiciona filtro de workspaceId automaticamente
 * em todas as requisições CRUD.
 * 
 * NOTA: Este interceptor não funciona corretamente porque é executado
 * ANTES do CrudRequestInterceptor do @dataui/crud, então o crudRequest
 * ainda não foi populado. 
 * 
 * A solução recomendada é sobrescrever os métodos getMany/getOne nos
 * controllers usando @Override() e chamar os métodos getManyByWorkspace/
 * getOneByWorkspace do WorkspaceCrudService.
 * 
 * @deprecated Use @Override() nos controllers em vez deste interceptor
 */
@Injectable()
export class WorkspaceCrudInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const workspace = (request as any).workspace;

    if (!workspace) {
      return next.handle();
    }

    const crudRequest: CrudRequest = request[PARSED_CRUD_REQUEST_KEY];

    if (crudRequest) {
      const workspaceFilter = { workspaceId: { $eq: workspace.id } };
      const existingSearch = crudRequest.parsed.search;

      if (!existingSearch || Object.keys(existingSearch).length === 0) {
        crudRequest.parsed.search = { $and: [workspaceFilter] };
      } else if (existingSearch.$and && Array.isArray(existingSearch.$and)) {
        existingSearch.$and.push(workspaceFilter);
      } else if (existingSearch.$or && Array.isArray(existingSearch.$or)) {
        crudRequest.parsed.search = {
          $and: [{ $or: existingSearch.$or }, workspaceFilter],
        };
      } else {
        const { $and, $or, ...otherFilters } = existingSearch;
        
        if (Object.keys(otherFilters).length > 0) {
          crudRequest.parsed.search = {
            $and: [otherFilters, workspaceFilter],
          };
        } else {
          crudRequest.parsed.search = { $and: [workspaceFilter] };
        }
      }

      request[PARSED_CRUD_REQUEST_KEY] = crudRequest;
    }

    return next.handle();
  }
}

