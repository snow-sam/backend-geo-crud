import { config } from "dotenv";
import { Client } from "@googlemaps/google-maps-services-js";
import * as XLSX from "xlsx";

config();
const client = new Client({});
const inputFile = "enderecos.xlsx";
const outputFile = "enderecos_com_placeid.xlsx";

// Função para buscar o place_id de um endereço
async function buscarPlaceId(endereco: string) {
  try {
    const response = await client.geocode({
      params: {
        address: endereco,
        region: "br",
        components: "administrative_area:SP|country:BR",
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });

    const result = response.data.results[0];
    if (!result) return null;

    return {
      endereco_formatado: result.formatted_address,
      place_id: result.place_id,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
    };
  } catch (error) {
    console.error("Erro ao buscar:", endereco, error.message);
    return null;
  }
}

async function processarPlanilha() {
  const workbook = XLSX.readFile(inputFile);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const enderecos = XLSX.utils.sheet_to_json<{ endereco: string }>(sheet);

  const resultados: any[] = [];

  for (const [i, item] of enderecos.entries()) {
    console.log(`(${i + 1}/${enderecos.length}) Buscando: ${item.endereco}`);
    const info = await buscarPlaceId(item.endereco);

    resultados.push({
      endereco_original: item.endereco,
      endereco_formatado: info?.endereco_formatado || "N/A",
      place_id: info?.place_id || "N/A",
      lat: info?.lat || null,
      lng: info?.lng || null,
    });

    // Espera 150ms entre chamadas para não atingir o limite de requisições
    await new Promise((r) => setTimeout(r, 150));
  }

  const novaPlanilha = XLSX.utils.json_to_sheet(resultados);
  const novoWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(novoWorkbook, novaPlanilha, "Resultados");
  XLSX.writeFile(novoWorkbook, outputFile);

  console.log(`✅ Planilha gerada: ${outputFile}`);
}

processarPlanilha();
