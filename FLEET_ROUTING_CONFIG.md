# Configuração do Google Fleet Routing

Este documento descreve como configurar a integração com o Google Cloud Route Optimization API (Fleet Routing).

## Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# ID do projeto no Google Cloud Platform
GOOGLE_CLOUD_PROJECT=seu-projeto-id

# Caminho para o arquivo JSON da Service Account
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
```

## Passo a Passo

### 1. Criar Projeto no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione um existente
3. Anote o **Project ID** (será usado na variável `GOOGLE_CLOUD_PROJECT`)

### 2. Ativar a API Route Optimization

1. No console, vá para **APIs & Services** > **Library**
2. Busque por "Route Optimization API"
3. Clique em **Enable**

### 3. Criar Service Account

1. Vá para **IAM & Admin** > **Service Accounts**
2. Clique em **Create Service Account**
3. Preencha:
   - **Nome**: `fleet-routing-backend`
   - **Descrição**: Service Account para otimização de rotas
4. Clique em **Create and Continue**
5. Adicione o papel: **Route Optimization Editor**
6. Clique em **Done**

### 4. Gerar Chave JSON

1. Na lista de Service Accounts, clique na conta criada
2. Vá para a aba **Keys**
3. Clique em **Add Key** > **Create new key**
4. Selecione **JSON** e clique em **Create**
5. O arquivo será baixado automaticamente
6. Renomeie para `service-account.json` e coloque na raiz do projeto

### 5. Verificar Configuração

Após configurar, você pode verificar se está tudo correto acessando:

```
GET /agenda/fleet-routing/config
```

Deve retornar:
```json
{
  "projectId": "seu-projeto-id",
  "configured": true
}
```

## Endpoints Disponíveis

### POST /agenda/roteiro-dia

Gera roteiros otimizados para um dia específico.

**Request:**
```json
{
  "data": "2025-01-15",
  "salvar": true
}
```

**Response:**
```json
{
  "data": "2025-01-15",
  "roteiros": [
    {
      "tecnico": { "id": "...", "nome": "João" },
      "visitas": [
        {
          "cliente": { "id": "...", "nome": "Cliente A" },
          "ordem": 1,
          "estimativaChegada": "2025-01-15T08:30:00Z"
        }
      ],
      "distanciaTotalKM": 45.5,
      "tempoTotalMinutos": 90
    }
  ],
  "sucessoTotal": true,
  "roteirosCriados": 1,
  "roteiroClientesCriados": 5
}
```

## Custos

A Route Optimization API tem custos baseados no número de requisições. Consulte a [página de preços](https://cloud.google.com/optimization/pricing) para mais detalhes.

## Troubleshooting

### Erro de autenticação

Se receber erro de autenticação, verifique:
1. O arquivo `service-account.json` existe na raiz do projeto
2. A variável `GOOGLE_APPLICATION_CREDENTIALS` aponta para o caminho correto
3. A Service Account tem o papel `Route Optimization Editor`

### API não habilitada

Se receber erro "API not enabled":
1. Verifique se a Route Optimization API está ativada no projeto
2. Aguarde alguns minutos após ativar (pode demorar para propagar)


