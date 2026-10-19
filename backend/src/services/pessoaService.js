const { randomUUID } = require("node:crypto");
const { formatarCpf } = require("../domain/cpf");
const { calcularIdade } = require("../domain/idade");
const { validarPessoa, normalizarPessoa } = require("../domain/pessoa");
const { ErroValidacao, ErroNaoEncontrado } = require("../errors");

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
    const pessoa = this.#prepararDados(dados);
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
    const pessoa = this.#prepararDados(dados);
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

  // A unicidade do CPF é garantida pelo repositório (lança ErroConflito).
  #prepararDados(dados) {
    const erros = validarPessoa(dados, this.relogio());
    if (Object.keys(erros).length > 0) throw new ErroValidacao(erros);
    return normalizarPessoa(dados);
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
