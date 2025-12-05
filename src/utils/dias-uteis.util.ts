import * as moment from 'moment-business-days';

// Configura idioma
moment.locale('pt-br');

export interface DiasUteisOptions {
  ano?: number;
  mes?: number;
  inicioEm?: string | Date; // data de referência opcional
  feriados?: string[];
}

export function gerarDiasUteisMes({
  ano,
  mes,
  inicioEm,
  feriados = [],
}: DiasUteisOptions): string[] {
  // Define data de referência
  const referencia = inicioEm
    ? moment(inicioEm)
    : moment(`${ano}-${String(mes).padStart(2, '0')}-01`);

  if (!referencia.isValid()) {
    throw new Error('Data de referência inválida.');
  }

  // Atualiza locale com feriados customizados
  moment.updateLocale('pt-br', {
    holidays: feriados,
    holidayFormat: 'YYYY-MM-DD',
  });

  // Se recebeu inicioEm, começa a partir desse dia.
  // Caso contrário, começa do primeiro dia do mês.
  const inicio = inicioEm ? referencia.clone() : referencia.clone().startOf('month');
  const fim = referencia.clone().endOf('month');
  const diasUteis: string[] = [];

  for (let dia = inicio.clone(); dia.isSameOrBefore(fim); dia.add(1, 'day')) {
    if (dia.isBusinessDay()) {
      diasUteis.push(dia.format('YYYY-MM-DD'));
    }
  }

  return diasUteis;
}
