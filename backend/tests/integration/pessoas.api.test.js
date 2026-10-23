const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const request = require("supertest");
const criarApp = require("../../src/app");
const PessoaRepository = require("../../src/repositories/pessoaRepository");
const PessoaService = require("../../src/services/pessoaService");

const HOJE = new Date(2026, 9, 18);

// Monta a aplicação real (rotas + serviço + repositório), sem mocks.
function montarApp({ arquivo, relogio = () => HOJE } = {}) {
  const repositorio = new PessoaRepository({ arquivo });
  const service = new PessoaService({ repositorio, relogio });
  return criarApp({ service });
}

const maria = {
  cpf: "529.982.247-25",
  nome: "Maria da Silva",
  dataNascimento: "1990-05-15",
};
const joao = {
  cpf: "111.444.777-35",
  nome: "João Souza",
  dataNascimento: "1990-12-25",
};

describe("API de pessoas", () => {
  let app;

  beforeEach(() => {
    app = montarApp();
  });

  describe("POST /api/pessoas", () => {
    it("cadastra uma pessoa e retorna 201 com a idade calculada", async () => {
      const resposta = await request(app).post("/api/pessoas").send(maria);

      expect(resposta.status).toBe(201);
      expect(resposta.body).toEqual({
        id: expect.any(String),
        cpf: "529.982.247-25",
        nome: "Maria da Silva",
        dataNascimento: "1990-05-15",
        idade: 36,
      });
      expect(resposta.headers.location).toBe(
        `/api/pessoas/${resposta.body.id}`,
      );
    });

    it("retorna 400 com os erros de cada campo", async () => {
      const resposta = await request(app)
        .post("/api/pessoas")
        .send({ cpf: "111.111.111-11", nome: "Maria", dataNascimento: "" });

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({
        mensagem: "Dados inválidos",
        erros: {
          cpf: "CPF inválido",
          nome: "Informe o nome completo (nome e sobrenome)",
          dataNascimento: "Data de nascimento é obrigatória",
        },
      });
    });

    it("retorna 400 quando a requisição não tem corpo", async () => {
      const resposta = await request(app).post("/api/pessoas");

      expect(resposta.status).toBe(400);
      expect(Object.keys(resposta.body.erros)).toEqual([
        "cpf",
        "nome",
        "dataNascimento",
      ]);
    });

    it("retorna 400 para JSON malformado", async () => {
      const resposta = await request(app)
        .post("/api/pessoas")
        .set("Content-Type", "application/json")
        .send('{"cpf": ');

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ mensagem: "JSON inválido" });
    });

    it("retorna 409 para CPF já cadastrado", async () => {
      await request(app).post("/api/pessoas").send(maria);
      const resposta = await request(app)
        .post("/api/pessoas")
        .send({ ...joao, cpf: "52998224725" });

      expect(resposta.status).toBe(409);
      expect(resposta.body).toEqual({
        mensagem: "CPF já cadastrado",
        erros: { cpf: "CPF já cadastrado" },
      });
    });
  });

  describe("GET /api/pessoas", () => {
    it("retorna lista vazia quando não há cadastros", async () => {
      const resposta = await request(app).get("/api/pessoas");
      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual([]);
    });

    it("lista as pessoas em ordem alfabética", async () => {
      await request(app).post("/api/pessoas").send(maria);
      await request(app).post("/api/pessoas").send(joao);

      const resposta = await request(app).get("/api/pessoas");
      expect(resposta.body.map((p) => [p.nome, p.idade])).toEqual([
        ["João Souza", 35],
        ["Maria da Silva", 36],
      ]);
    });
  });

  describe("GET /api/pessoas/:id", () => {
    it("retorna a pessoa cadastrada", async () => {
      const { body: criada } = await request(app)
        .post("/api/pessoas")
        .send(maria);

      const resposta = await request(app).get(`/api/pessoas/${criada.id}`);
      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual(criada);
    });

    it("retorna 404 para id inexistente", async () => {
      const resposta = await request(app).get("/api/pessoas/nao-existe");
      expect(resposta.status).toBe(404);
      expect(resposta.body).toEqual({ mensagem: "Pessoa não encontrada" });
    });
  });

  describe("PUT /api/pessoas/:id", () => {
    it("atualiza os dados e recalcula a idade", async () => {
      const { body: criada } = await request(app)
        .post("/api/pessoas")
        .send(maria);

      const resposta = await request(app)
        .put(`/api/pessoas/${criada.id}`)
        .send({ ...maria, nome: "Maria Souza", dataNascimento: "2000-02-29" });

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({
        id: criada.id,
        cpf: "529.982.247-25",
        nome: "Maria Souza",
        dataNascimento: "2000-02-29",
        idade: 26,
      });
    });

    it("retorna 400 para dados inválidos", async () => {
      const { body: criada } = await request(app)
        .post("/api/pessoas")
        .send(maria);

      const resposta = await request(app)
        .put(`/api/pessoas/${criada.id}`)
        .send({ ...maria, dataNascimento: "2030-01-01" });

      expect(resposta.status).toBe(400);
      expect(resposta.body.erros).toEqual({
        dataNascimento: "Data de nascimento não pode estar no futuro",
      });
    });

    it("retorna 404 para id inexistente", async () => {
      const resposta = await request(app)
        .put("/api/pessoas/nao-existe")
        .send(maria);
      expect(resposta.status).toBe(404);
    });

    it("retorna 409 ao usar o CPF de outra pessoa", async () => {
      await request(app).post("/api/pessoas").send(maria);
      const { body: criado } = await request(app)
        .post("/api/pessoas")
        .send(joao);

      const resposta = await request(app)
        .put(`/api/pessoas/${criado.id}`)
        .send({ ...joao, cpf: maria.cpf });
      expect(resposta.status).toBe(409);
    });
  });

  describe("DELETE /api/pessoas/:id", () => {
    it("remove a pessoa e retorna 204 sem corpo", async () => {
      const { body: criada } = await request(app)
        .post("/api/pessoas")
        .send(maria);

      const resposta = await request(app).delete(`/api/pessoas/${criada.id}`);
      expect(resposta.status).toBe(204);
      expect(resposta.text).toBe("");

      const busca = await request(app).get(`/api/pessoas/${criada.id}`);
      expect(busca.status).toBe(404);
    });

    it("retorna 404 para id inexistente", async () => {
      const resposta = await request(app).delete("/api/pessoas/nao-existe");
      expect(resposta.status).toBe(404);
    });
  });

  it("percorre o fluxo completo: cadastrar, listar, editar e excluir", async () => {
    const criada = await request(app).post("/api/pessoas").send(joao);
    expect(criada.status).toBe(201);
    const url = criada.headers.location;

    const lista = await request(app).get("/api/pessoas");
    expect(lista.body).toHaveLength(1);

    const editada = await request(app)
      .put(url)
      .send({ ...joao, nome: "João Pedro Souza" });
    expect(editada.body.nome).toBe("João Pedro Souza");

    const consultada = await request(app).get(url);
    expect(consultada.body).toEqual(editada.body);

    expect((await request(app).delete(url)).status).toBe(204);
    expect((await request(app).get("/api/pessoas")).body).toEqual([]);
  });

  it("calcula a idade conforme a data da consulta", async () => {
    let agora = new Date(2026, 11, 24);
    const appComRelogio = montarApp({ relogio: () => agora });
    const { headers } = await request(appComRelogio)
      .post("/api/pessoas")
      .send(joao);

    expect(
      (await request(appComRelogio).get(headers.location)).body.idade,
    ).toBe(35);
    agora = new Date(2026, 11, 25); // aniversário
    expect(
      (await request(appComRelogio).get(headers.location)).body.idade,
    ).toBe(36);
  });
});

describe("persistência em arquivo", () => {
  let pasta;

  beforeEach(() => {
    pasta = fs.mkdtempSync(path.join(os.tmpdir(), "api-pessoas-"));
  });

  afterEach(() => {
    fs.rmSync(pasta, { recursive: true, force: true });
  });

  it("mantém os cadastros depois que a aplicação é reiniciada", async () => {
    const arquivo = path.join(pasta, "pessoas.json");
    await request(montarApp({ arquivo })).post("/api/pessoas").send(maria);

    const reiniciada = montarApp({ arquivo });
    const resposta = await request(reiniciada).get("/api/pessoas");
    expect(resposta.body.map((p) => p.cpf)).toEqual(["529.982.247-25"]);
  });
});

describe("infraestrutura HTTP", () => {
  const app = montarApp();

  it("GET /health responde 200 para o healthcheck do container", async () => {
    const resposta = await request(app).get("/health");
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ status: "ok" });
  });

  it("serve o front-end na raiz", async () => {
    const resposta = await request(app).get("/");
    expect(resposta.status).toBe(200);
    expect(resposta.headers["content-type"]).toMatch(/text\/html/);
  });

  it("retorna 404 em JSON para rotas de API inexistentes", async () => {
    const resposta = await request(app).get("/api/nao-existe");
    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ mensagem: "Rota não encontrada" });
  });

  it("não expõe o cabeçalho X-Powered-By", async () => {
    const resposta = await request(app).get("/health");
    expect(resposta.headers).not.toHaveProperty("x-powered-by");
  });

  it("retorna 500 genérico sem vazar detalhes de erros inesperados", async () => {
    const serviceQuebrado = {
      listar: async () => {
        throw new Error("detalhe interno sensível");
      },
    };
    const silenciar = jest.spyOn(console, "error").mockImplementation(() => {});

    const resposta = await request(criarApp({ service: serviceQuebrado })).get(
      "/api/pessoas",
    );

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ mensagem: "Erro interno do servidor" });
    expect(silenciar).toHaveBeenCalled();
    silenciar.mockRestore();
  });
});
