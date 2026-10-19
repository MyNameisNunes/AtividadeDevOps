const { randomUUID } = require("node:crypto");
const { formatarCpf } = require("../domain/cpf");
const { calcularIdade } = require("../domain/idade");
const { validarPessoa, normalizarPessoa } = require("../domain/pessoa");
const { ErroValidacao, ErroNaoEncontrado, ErroConflito } = require("../errors");

const compararNomes = new Intl.Collator("pt-BR", { sensitivity: "base" })
  .compare;

class PessoaService {
  constructor({
    repositorio,
    gerarId = randomUUID,
    relogio = () => new Date(),
  }) {
    this.repositorio = repositorio;
    this.gerarId = gerarId;
    this.relogio = relogio;
  }

  async criar(dados) {
    const pessoa = await this.#prepararDados(dados);
    const criada = await this.repositorio.inserir({
      id: this.gerarId(),
      ...pessoa,
    });
    return this.#apresentar(criada);
  }

  async listar() {
    const pessoas = await this.repositorio.listar();
    return pessoas
      .sort((a, b) => compararNomes(a.nome, b.nome))
      .map((p) => this.#apresentar(p));
  }

  async buscarPorId(id) {
    return this.#apresentar(await this.#buscarExistente(id));
  }

  async atualizar(id, dados) {
    await this.#buscarExistente(id);
    const pessoa = await this.#prepararDados(dados, id);
    return this.#apresentar(await this.repositorio.atualizar(id, pessoa));
  }

  async remover(id) {
    const removida = await this.repositorio.remover(id);
    if (!removida) throw new ErroNaoEncontrado();
  }

  async #buscarExistente(id) {
    const pessoa = await this.repositorio.buscarPorId(id);
    if (!pessoa) throw new ErroNaoEncontrado();
    return pessoa;
  }

  // Valida, normaliza e garante que o CPF não pertence a outra pessoa.
  async #prepararDados(dados, idAtual = null) {
    const erros = validarPessoa(dados, this.relogio());
    if (Object.keys(erros).length > 0) throw new ErroValidacao(erros);

    const pessoa = normalizarPessoa(dados);
    const mesmoCpf = await this.repositorio.buscarPorCpf(pessoa.cpf);
    if (mesmoCpf && mesmoCpf.id !== idAtual) {
      throw new ErroConflito("CPF já cadastrado", { cpf: "CPF já cadastrado" });
    }
    return pessoa;
  }

  // A idade não é armazenada: é calculada a cada leitura para nunca ficar velha.
  #apresentar(pessoa) {
    return {
      id: pessoa.id,
      cpf: formatarCpf(pessoa.cpf),
      nome: pessoa.nome,
      dataNascimento: pessoa.dataNascimento,
      idade: calcularIdade(pessoa.dataNascimento, this.relogio()),
    };
  }
}

module.exports = PessoaService;
