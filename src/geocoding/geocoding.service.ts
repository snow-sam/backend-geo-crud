import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@googlemaps/google-maps-services-js';

export interface GeocodingResult {
  placeId: string;
  latitude: number;
  longitude: number;
  enderecoFormatado: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly client: Client;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new Client({});
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY')!;
  }

  async geocodeAddress(endereco: string): Promise<GeocodingResult | null> {
    try {
      const response = await this.client.geocode({
        params: {
          address: endereco,
          region: 'br',
          components: 'country:BR',
          key: this.apiKey,
        },
      });

      const result = response.data.results[0];
      if (!result) {
        this.logger.warn(`Nenhum resultado encontrado para: ${endereco}`);
        return null;
      }

      return {
        placeId: result.place_id,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        enderecoFormatado: result.formatted_address,
      };
    } catch (error) {
      this.logger.error(`Erro ao geocodificar endereço: ${endereco}`, error);
      return null;
    }
  }

  /**
   * Aguarda um tempo especificado para evitar rate limiting da API
   */
  async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
