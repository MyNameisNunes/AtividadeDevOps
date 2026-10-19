const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const PessoaRepository = require("../../../src/repositories/pessoaRepository");

const maria = {
  id: "id-maria",
  cpf: "52998224725",
  nome: "Maria da Silva",
  dataNascimento: "1990-05-15",
};
const joao = {
  id: "id-joao",
  cpf: "11144477735",
  nome: "João Souza",
  dataNascimento: "1985-12-01",
};

describe("PessoaRepository em memória", () => {
  let repositorio;

  beforeEach(() => {
    repositorio = new PessoaRepository();
  });

  it("começa vazio", async () => {
    expect(await repositorio.listar()).toEqual([]);
  });

  it("insere e busca uma pessoa pelo id", async () => {
    await repositorio.inserir(maria);
    expect(await repositorio.buscarPorId("id-maria")).toEqual(maria);
  });

  it("retorna null ao buscar id inexistente", async () => {
    expect(await repositorio.buscarPorId("nao-existe")).toBeNull();
  });

  it("busca uma pessoa pelo CPF", async () => {
    await repositorio.inserir(maria);
    await repositorio.inserir(joao);
    expect(await repositorio.buscarPorCpf("11144477735")).toEqual(joao);
    expect(await repositorio.buscarPorCpf("00000000191")).toBeNull();
  });

  it("lista as pessoas na ordem de inserção", async () => {
    await repositorio.inserir(maria);
    await repositorio.inserir(joao);
    expect(await repositorio.listar()).toEqual([maria, joao]);
  });

  it("atualiza uma pessoa existente", async () => {
    await repositorio.inserir(maria);
    const alterada = { ...maria, nome: "Maria Souza" };

    expect(await repositorio.atualizar("id-maria", alterada)).toEqual(alterada);
    expect(await repositorio.buscarPorId("id-maria")).toEqual(alterada);
  });

  it("retorna null ao atualizar id inexistente", async () => {
    expect(await repositorio.atualizar("nao-existe", maria)).toBeNull();
    expect(await repositorio.listar()).toEqual([]);
  });

  it("remove uma pessoa existente", async () => {
    await repositorio.inserir(maria);
    expect(await repositorio.remover("id-maria")).toBe(true);
    expect(await repositorio.buscarPorId("id-maria")).toBeNull();
  });

  it("retorna false ao remover id inexistente", async () => {
    expect(await repositorio.remover("nao-existe")).toBe(false);
  });

  it("não deixa alterações externas modificarem os dados guardados", async () => {
    const original = { ...maria };
    await repositorio.inserir(original);
    original.nome = "Alterado por fora";

    const buscada = await repositorio.buscarPorId("id-maria");
    buscada.nome = "Alterado depois da busca";
    (await repositorio.listar())[0].nome = "Alterado na listagem";

    expect((await repositorio.buscarPorId("id-maria")).nome).toBe(
      "Maria da Silva",
    );
  });
});

describe("PessoaRepository com persistência em arquivo", () => {
  let pasta;
  let arquivo;

  beforeEach(() => {
    pasta = fs.mkdtempSync(path.join(os.tmpdir(), "pessoas-"));
    arquivo = path.join(pasta, "subpasta", "pessoas.json");
  });

  afterEach(() => {
    fs.rmSync(pasta, { recursive: true, force: true });
  });

  it("começa vazio quando o arquivo ainda não existe", async () => {
    const repositorio = new PessoaRepository({ arquivo });
    expect(await repositorio.listar()).toEqual([]);
  });

  it("grava inserções, atualizações e remoções no arquivo", async () => {
    const repositorio = new PessoaRepository({ arquivo });
    await repositorio.inserir(maria);
    await repositorio.inserir(joao);
    await repositorio.atualizar("id-maria", { ...maria, nome: "Maria Souza" });
    await repositorio.remover("id-joao");

    const gravado = JSON.parse(fs.readFileSync(arquivo, "utf8"));
    expect(gravado).toEqual([{ ...maria, nome: "Maria Souza" }]);
  });

  it("recarrega os dados gravados em uma nova instância", async () => {
    await new PessoaRepository({ arquivo }).inserir(maria);

    const recarregado = new PessoaRepository({ arquivo });
    expect(await recarregado.listar()).toEqual([maria]);
  });

  it("mantém o arquivo consistente com escritas concorrentes", async () => {
    const repositorio = new PessoaRepository({ arquivo });
    await Promise.all([repositorio.inserir(maria), repositorio.inserir(joao)]);

    const gravado = JSON.parse(fs.readFileSync(arquivo, "utf8"));
    expect(gravado).toEqual([maria, joao]);
  });

  it("falha ao iniciar com arquivo corrompido em vez de apagar os dados", () => {
    fs.mkdirSync(path.dirname(arquivo), { recursive: true });
    fs.writeFileSync(arquivo, "{ isso não é json");

    expect(() => new PessoaRepository({ arquivo })).toThrow(
      /Não foi possível ler/,
    );
    expect(fs.readFileSync(arquivo, "utf8")).toBe("{ isso não é json");
  });
});
