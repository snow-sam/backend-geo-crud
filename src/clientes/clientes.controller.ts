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

import { Cliente } from './clientes.entity';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dtos/create-cliente.dto';
import { UpdateClienteDto } from './dtos/update-cliente.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Crud({
  model: { type: Cliente },
  dto: {
    create: CreateClienteDto,
    update: UpdateClienteDto,
  },
})
@ApiTags('clientes')
@UseGuards(AuthGuard)
@Controller('clientes')
export class ClientesController implements CrudController<Cliente> {
  constructor(public service: ClientesService) {}

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
  ): Promise<Cliente> {
    const workspaceId = (request as any).workspace.id;
    return this.service.getOneByWorkspace(req, workspaceId);
  }

  @Override()
  async createOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: CreateClienteDto,
    @Req() request: Request,
  ): Promise<Cliente> {
    const workspaceId = (request as any).workspace.id;
    return this.service.createOneWithWorkspace(req, dto as any, workspaceId);
  }

  @Override()
  async updateOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: UpdateClienteDto,
    @Req() request: Request,
  ): Promise<Cliente> {
    const workspaceId = (request as any).workspace.id;
    return this.service.updateOneByWorkspace(req, dto as any, workspaceId);
  }

  @Override()
  async deleteOne(
    @ParsedRequest() req: CrudRequest,
    @Req() request: Request,
  ): Promise<void | Cliente> {
    const workspaceId = (request as any).workspace.id;
    return this.service.deleteOneByWorkspace(req, workspaceId);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Importar clientes via arquivo Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo Excel (.xlsx) com os clientes',
        },
      },
    },
  })
  async importFromExcel(
    @UploadedFile() file: MulterFile,
    @Req() request: Request,
  ): Promise<Cliente[]> {
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
    return this.service.importFromExcel(file.buffer, workspaceId);
  }
}
