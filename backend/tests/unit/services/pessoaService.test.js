const PessoaService = require("../../../src/services/pessoaService");
const PessoaRepository = require("../../../src/repositories/pessoaRepository");
const {
  ErroValidacao,
  ErroNaoEncontrado,
  ErroConflito,
} = require("../../../src/errors");

const dadosMaria = {
  cpf: "529.982.247-25",
  nome: "  Maria   da Silva ",
  dataNascimento: "1990-05-15",
};
const dadosJoao = {
  cpf: "111.444.777-35",
  nome: "João Souza",
  dataNascimento: "1990-12-25",
};

describe("PessoaService", () => {
  let repositorio;
  let service;
  let agora;

  beforeEach(() => {
    let contador = 0;
    agora = new Date(2026, 9, 18);
    repositorio = new PessoaRepository();
    service = new PessoaService({
      repositorio,
      gerarId: () => `id-${++contador}`,
      relogio: () => agora,
    });
  });

  describe("criar", () => {
    it("retorna a pessoa criada com id, CPF formatado, nome normalizado e idade", async () => {
      expect(await service.criar(dadosMaria)).toEqual({
        id: "id-1",
        cpf: "529.982.247-25",
        nome: "Maria da Silva",
        dataNascimento: "1990-05-15",
        idade: 36,
      });
    });

    it("armazena o CPF só com dígitos e não armazena a idade", async () => {
      await service.criar(dadosMaria);
      expect(await repositorio.buscarPorId("id-1")).toEqual({
        id: "id-1",
        cpf: "52998224725",
        nome: "Maria da Silva",
        dataNascimento: "1990-05-15",
      });
    });

    it("ignora campos que não fazem parte do cadastro", async () => {
      const criada = await service.criar({
        ...dadosMaria,
        id: "id-escolhido-pelo-cliente",
        idade: 99,
        admin: true,
      });
      expect(criada.id).toBe("id-1");
      expect(criada.idade).toBe(36);
      expect(criada).not.toHaveProperty("admin");
    });

    it("lança ErroValidacao com os erros por campo e não salva nada", async () => {
      const promessa = service.criar({ ...dadosMaria, cpf: "123" });

      await expect(promessa).rejects.toBeInstanceOf(ErroValidacao);
      await expect(promessa).rejects.toMatchObject({
        erros: { cpf: "CPF inválido" },
      });
      expect(await repositorio.listar()).toEqual([]);
    });

    it("lança ErroConflito para CPF já cadastrado, mesmo com outra formatação", async () => {
      await service.criar(dadosMaria);
      const promessa = service.criar({ ...dadosJoao, cpf: "52998224725" });

      await expect(promessa).rejects.toBeInstanceOf(ErroConflito);
      await expect(promessa).rejects.toMatchObject({
        erros: { cpf: "CPF já cadastrado" },
      });
      expect(await repositorio.listar()).toHaveLength(1);
    });

    it("não cadastra o mesmo CPF duas vezes em requisições simultâneas", async () => {
      const resultados = await Promise.allSettled([
        service.criar(dadosMaria),
        service.criar({ ...dadosJoao, cpf: dadosMaria.cpf }),
      ]);

      expect(resultados.map((r) => r.status).sort()).toEqual([
        "fulfilled",
        "rejected",
      ]);
      expect(
        resultados.find((r) => r.status === "rejected").reason,
      ).toBeInstanceOf(ErroConflito);
      expect(await repositorio.listar()).toHaveLength(1);
    });
  });

  describe("listar", () => {
    it("retorna lista vazia quando não há cadastros", async () => {
      expect(await service.listar()).toEqual([]);
    });

    it("lista em ordem alfabética respeitando acentos, com idade calculada", async () => {
      await service.criar(dadosMaria);
      await service.criar(dadosJoao);
      await service.criar({
        cpf: "000.000.001-91",
        nome: "Álvaro Lima",
        dataNascimento: "2000-01-01",
      });

      const lista = await service.listar();
      expect(lista.map((p) => [p.nome, p.idade])).toEqual([
        ["Álvaro Lima", 26],
        ["João Souza", 35],
        ["Maria da Silva", 36],
      ]);
    });
  });

  describe("buscarPorId", () => {
    it("retorna a pessoa encontrada", async () => {
      await service.criar(dadosMaria);
      expect(await service.buscarPorId("id-1")).toMatchObject({
        id: "id-1",
        nome: "Maria da Silva",
        idade: 36,
      });
    });

    it("lança ErroNaoEncontrado para id inexistente", async () => {
      await expect(service.buscarPorId("nao-existe")).rejects.toBeInstanceOf(
        ErroNaoEncontrado,
      );
    });
  });

  describe("atualizar", () => {
    beforeEach(async () => {
      await service.criar(dadosMaria);
    });

    it("substitui os dados, mantém o id e recalcula a idade", async () => {
      const atualizada = await service.atualizar("id-1", {
        cpf: "529.982.247-25",
        nome: "Maria Souza",
        dataNascimento: "2000-02-29",
      });

      expect(atualizada).toEqual({
        id: "id-1",
        cpf: "529.982.247-25",
        nome: "Maria Souza",
        dataNascimento: "2000-02-29",
        idade: 26,
      });
      expect(await service.buscarPorId("id-1")).toEqual(atualizada);
    });

    it("permite trocar o CPF por outro que esteja livre", async () => {
      const atualizada = await service.atualizar("id-1", {
        ...dadosMaria,
        cpf: "000.000.001-91",
      });
      expect(atualizada.cpf).toBe("000.000.001-91");
    });

    it("lança ErroNaoEncontrado para id inexistente", async () => {
      await expect(
        service.atualizar("nao-existe", dadosJoao),
      ).rejects.toBeInstanceOf(ErroNaoEncontrado);
    });

    it("lança ErroValidacao para dados inválidos sem alterar o cadastro", async () => {
      await expect(
        service.atualizar("id-1", { ...dadosMaria, nome: "Maria" }),
      ).rejects.toMatchObject({
        erros: { nome: "Informe o nome completo (nome e sobrenome)" },
      });
      expect((await service.buscarPorId("id-1")).nome).toBe("Maria da Silva");
    });

    it("lança ErroConflito ao usar o CPF de outra pessoa", async () => {
      await service.criar(dadosJoao);
      await expect(
        service.atualizar("id-2", { ...dadosJoao, cpf: dadosMaria.cpf }),
      ).rejects.toBeInstanceOf(ErroConflito);
    });
  });

  describe("remover", () => {
    it("remove a pessoa cadastrada", async () => {
      await service.criar(dadosMaria);
      await service.remover("id-1");
      await expect(service.buscarPorId("id-1")).rejects.toBeInstanceOf(
        ErroNaoEncontrado,
      );
    });

    it("lança ErroNaoEncontrado para id inexistente", async () => {
      await expect(service.remover("nao-existe")).rejects.toBeInstanceOf(
        ErroNaoEncontrado,
      );
    });
  });

  it("calcula a idade no momento da consulta (não fica desatualizada)", async () => {
    await service.criar(dadosJoao); // aniversário em 25/12
    expect((await service.buscarPorId("id-1")).idade).toBe(35);

    agora = new Date(2026, 11, 25);
    expect((await service.buscarPorId("id-1")).idade).toBe(36);
  });

  it("gera ids no formato UUID por padrão", async () => {
    const servicePadrao = new PessoaService({ repositorio });
    const criada = await servicePadrao.criar(dadosMaria);
    expect(criada.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
