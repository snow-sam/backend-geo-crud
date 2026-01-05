import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as XLSX from 'xlsx';

import { Cliente } from './clientes.entity';
import type { Repository } from 'typeorm';
import { GeocodingService } from '../geocoding/geocoding.service';
import type { ExcelClienteRow } from './dtos/import-cliente.dto';
import { WorkspaceCrudService } from '../common/workspace-crud.service';

@Injectable()
export class ClientesService extends WorkspaceCrudService<Cliente> {
  private readonly logger = new Logger(ClientesService.name);

  constructor(
    @InjectRepository(Cliente) repo: Repository<Cliente>,
    private readonly geocodingService: GeocodingService,
  ) {
    super(repo);
  }

  async importFromExcel(fileBuffer: Buffer, workspaceId: string): Promise<Cliente[]> {
    // Ler o arquivo Excel do buffer
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Converter para JSON
    const rows = XLSX.utils.sheet_to_json<ExcelClienteRow>(sheet);

    if (rows.length === 0) {
      throw new BadRequestException('O arquivo Excel está vazio');
    }

    this.logger.log(`Importando ${rows.length} clientes do Excel`);

    const clientesToCreate: Partial<Cliente>[] = [];
    const errors: string[] = [];

    for (const [index, row] of rows.entries()) {
      this.logger.log(
        `(${index + 1}/${rows.length}) Processando: ${row.nome}`,
      );

      // Validar campos obrigatórios
      if (!row.nome || !row.endereco) {
        errors.push(
          `Linha ${index + 2}: Nome e endereço são obrigatórios`,
        );
        continue;
      }

      // Buscar dados de geocodificação
      const geoData = await this.geocodingService.geocodeAddress(row.endereco);

      if (!geoData) {
        errors.push(
          `Linha ${index + 2}: Não foi possível geocodificar o endereço "${row.endereco}"`,
        );
        continue;
      }

      // Criar objeto do cliente
      const cliente: Partial<Cliente> = {
        nome: row.nome.trim(),
        endereco: geoData.enderecoFormatado,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        placeId: geoData.placeId,
        telefone: row.telefone?.toString().trim() || undefined,
        email: row.email?.toString().trim() || undefined,
        descricao: row.descricao?.toString().trim() || undefined,
        ultimaVisita: row.ultimaVisita
          ? new Date(row.ultimaVisita)
          : undefined,
        workspaceId,
      };

      clientesToCreate.push(cliente);

      // Delay de 150ms entre chamadas para evitar rate limiting da API
      await this.geocodingService.delay(150);
    }

    if (clientesToCreate.length === 0) {
      throw new BadRequestException(
        `Nenhum cliente válido para importar. Erros: ${errors.join('; ')}`,
      );
    }

    // Salvar todos os clientes em batch
    const savedClientes = await this.repo.save(clientesToCreate as Cliente[]);

    this.logger.log(
      `${savedClientes.length} clientes importados com sucesso`,
    );

    if (errors.length > 0) {
      this.logger.warn(`Erros durante importação: ${errors.join('; ')}`);
    }

    return savedClientes;
  }
}