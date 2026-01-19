import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Crud, CrudController, CrudRequest, Override, ParsedRequest, ParsedBody } from '@dataui/crud';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';

// Interface para o arquivo do Multer
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

import { Tecnico } from './tecnicos.entity';
import { TecnicosService } from './tecnicos.service';
import { CreateTecnicoDto } from './dtos/create-tecnico.dto';
import { UpdateTecnicoDto } from './dtos/update-tecnico.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Inject } from '@nestjs/common';
import { BETTER_AUTH_TOKEN } from '../auth/auth.module';

@Crud({
  model: { type: Tecnico },
  dto: {
    create: CreateTecnicoDto,
    update: UpdateTecnicoDto,
  },
})
@ApiTags('tecnicos')
@UseGuards(AuthGuard)
@Controller('tecnicos')
export class TecnicosController implements CrudController<Tecnico> {
  constructor(
    public service: TecnicosService,
    @Inject(BETTER_AUTH_TOKEN) private readonly auth: ReturnType<typeof import('../auth/better-auth.config').createBetterAuth>,
  ) {}

  @Override()
  async getMany(
    @ParsedRequest() req: CrudRequest,
    @Req() request: Request,
  ) {
    const workspaceId = (request as any).workspace.id;
    return this.service.getManyByWorkspace(req, workspaceId);
  }

  @Override()
  async getOne(
    @ParsedRequest() req: CrudRequest,
    @Req() request: Request,
  ): Promise<Tecnico> {
    const workspaceId = (request as any).workspace.id;
    return this.service.getOneByWorkspace(req, workspaceId);
  }

  @Override()
  async createOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: CreateTecnicoDto,
    @Req() request: Request,
  ): Promise<Tecnico> {
    const workspaceId = (request as any).workspace.id;
    return this.service.createOneWithWorkspace(req, dto as any, workspaceId);
  }

  @Override()
  async updateOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: UpdateTecnicoDto,
    @Req() request: Request,
  ): Promise<Tecnico> {
    const workspaceId = (request as any).workspace.id;
    return this.service.updateOneByWorkspace(req, dto as any, workspaceId);
  }

  @Override()
  async deleteOne(
    @ParsedRequest() req: CrudRequest,
    @Req() request: Request,
  ): Promise<void | Tecnico> {
    const workspaceId = (request as any).workspace.id;
    const session = await this.auth.api.getSession({
      headers: {
        cookie: request.headers.cookie ?? '',
      },
    });
    return this.service.deleteOneByWorkspace(req, workspaceId, session?.session?.token || '');
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Importar técnicos via arquivo Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo Excel (.xlsx) com os técnicos',
        },
      },
    },
  })
  async importFromExcel(
    @UploadedFile() file: MulterFile,
    @Req() request: Request,
  ): Promise<Tecnico[]> {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado');
    }

    const validExtensions = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!validExtensions.includes(file.mimetype)) {
      throw new BadRequestException(
        'Formato de arquivo inválido. Envie um arquivo Excel (.xlsx ou .xls)',
      );
    }

    const workspaceId = (request as any).workspace.id;
    const session = await this.auth.api.getSession({
      headers: {
        cookie: request.headers.cookie ?? '',
      },
    });
    return this.service.importFromExcel(file.buffer, workspaceId, session?.session?.activeOrganizationId || '');
  }
}
