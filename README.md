# Cadastro de Pessoas

Aplicação CRUD em JavaScript para gerenciar cadastros com **CPF**, **nome completo** e **data de nascimento**. A **idade é calculada automaticamente** a partir da data de nascimento.

- **Back-end:** Node.js + Express (API REST)
- **Front-end:** HTML, CSS e JavaScript puro, servido pela própria API
- **Testes:** Jest (unitários) + Supertest (integração)
- **Qualidade:** ESLint (análise estática) + Prettier (formatação)
- **Deploy:** imagem Docker + Docker Compose
- **CI:** GitHub Actions roda tudo isso a cada pull request

## Como executar

### Com Docker (recomendado)

```bash
docker compose up --build
```

Acesse <http://localhost:3000>. Os cadastros ficam no volume `dados` e sobrevivem a reinícios do container.

Sem o Compose:

```bash
docker build -t cadastro-pessoas .
docker run -p 3000:3000 -v cadastro-dados:/app/data cadastro-pessoas
```

### Localmente (Node.js 22 ou superior)

```bash
npm install
npm start          # ou: npm run dev (reinicia ao salvar)
```

Sem a variável `DATA_FILE`, os dados ficam só em memória. Para persistir:

```bash
DATA_FILE=./data/pessoas.json npm start
```

| Variável    | Padrão                                                   | Descrição                               |
| ----------- | -------------------------------------------------------- | --------------------------------------- |
| `PORT`      | `3000`                                                   | Porta HTTP                              |
| `DATA_FILE` | _(vazio: memória)_ / no Docker: `/app/data/pessoas.json` | Arquivo JSON onde os dados são gravados |
| `TZ`        | no Docker: `America/Sao_Paulo`                           | Fuso usado para saber qual é "hoje"     |

## Scripts

| Comando                    | O que faz                                    |
| -------------------------- | -------------------------------------------- |
| `npm test`                 | Roda todos os testes                         |
| `npm run test:unit`        | Só os testes unitários (regras de negócio)   |
| `npm run test:integration` | Só os testes de integração (API completa)    |
| `npm run test:coverage`    | Testes + relatório de cobertura (mínimo 90%) |
| `npm run lint`             | Análise estática com ESLint                  |
| `npm run format:check`     | Verifica a formatação com Prettier           |
| `npm run format`           | Corrige a formatação                         |

## API

Base: `/api/pessoas`. Corpo das requisições em JSON.

| Método   | Rota               | Sucesso                         | Erros               |
| -------- | ------------------ | ------------------------------- | ------------------- |
| `GET`    | `/api/pessoas`     | `200` lista em ordem alfabética |                     |
| `GET`    | `/api/pessoas/:id` | `200` pessoa                    | `404`               |
| `POST`   | `/api/pessoas`     | `201` pessoa + `Location`       | `400`, `409`        |
| `PUT`    | `/api/pessoas/:id` | `200` pessoa                    | `400`, `404`, `409` |
| `DELETE` | `/api/pessoas/:id` | `204` sem corpo                 | `404`               |
| `GET`    | `/health`          | `200 {"status":"ok"}`           |                     |

Exemplo:

```bash
curl -X POST http://localhost:3000/api/pessoas \
  -H "Content-Type: application/json" \
  -d '{"cpf":"529.982.247-25","nome":"Maria da Silva","dataNascimento":"1990-05-15"}'
```

```json
{
  "id": "3f0c2a7e-…",
  "cpf": "529.982.247-25",
  "nome": "Maria da Silva",
  "dataNascimento": "1990-05-15",
  "idade": 36
}
```

Erros de validação vêm por campo, para o front-end mostrar cada mensagem no lugar certo:

```json
{
  "mensagem": "Dados inválidos",
  "erros": {
    "cpf": "CPF inválido",
    "nome": "Informe o nome completo (nome e sobrenome)"
  }
}
```

## Regras de negócio

**CPF**

- Aceito com ou sem máscara (`529.982.247-25` ou `52998224725`), armazenado só com dígitos.
- Validado pelos dois dígitos verificadores; sequências repetidas (`111.111.111-11`) são rejeitadas.
- Único no cadastro (`409` se já existir, inclusive em requisições simultâneas).

**Nome completo**

- Obrigatório, com nome e sobrenome, até 100 caracteres.
- Apenas letras (com acentos), espaço, apóstrofo, hífen e ponto: `José D'Ávila`, `Ana-Clara Souza`, `João Pedro Jr.`.
- Espaços extras são removidos.

**Data de nascimento e idade**

- Formato `AAAA-MM-DD`, precisa existir no calendário (`2023-02-30` é rejeitada).
- Não pode estar no futuro; idade máxima de 130 anos.
- A idade é o número de **anos completos**: só aumenta no dia do aniversário.
- Quem nasceu em 29/02 completa o ano em 01/03 nos anos não bissextos.
- A idade **não é armazenada**: é calculada a cada consulta, então nunca fica desatualizada.

## Arquitetura

```
backend/
  src/
    domain/          regras puras: cpf.js, idade.js, pessoa.js
    repositories/    armazenamento (memória + arquivo JSON opcional)
    services/        casos de uso do CRUD
    routes/          rotas HTTP
    middlewares/     tradução de erros em respostas HTTP
    app.js           monta a aplicação Express
    server.js        ponto de entrada (porta, variáveis, sinais)
  tests/
    unit/            regras de negócio, repositório e serviço
    integration/     API de ponta a ponta com Supertest
frontend/            interface servida em /
```

O serviço recebe o repositório e o relógio por injeção de dependência. Assim, os testes fixam a data de "hoje" e o cálculo da idade fica determinístico.

## Desenvolvimento orientado a testes (TDD)

Cada regra foi escrita no ciclo **red → green**, e o histórico de commits mostra isso: um commit `test: … (red)` com os testes falhando, seguido de um commit `feat: … (green)` com a implementação que os faz passar.

```bash
git log --oneline --reverse
```

Exemplo: um teste de requisições simultâneas revelou que o mesmo CPF podia ser cadastrado duas vezes. O teste foi escrito primeiro (`test: reproduz cadastro duplicado…`) e a correção veio depois (`fix: garante CPF único…`).

## Fluxo de trabalho

O desenvolvimento acontece em uma branch de feature e entra na `main` por **pull request**. O GitHub Actions (`.github/workflows/ci.yml`) roda, a cada PR:

1. ESLint, Prettier, testes unitários, testes de integração e cobertura
2. Build da imagem Docker e um teste de fumaça com o container rodando

## Integrantes

| Nome         | GitHub                                             |
| ------------ | -------------------------------------------------- |
| Thiago Nunes | [@tnunes-kz](https://github.com/tnunes-kz)         |
| Vinicius     | [@ViniciusLedro](https://github.com/ViniciusLedro) |
