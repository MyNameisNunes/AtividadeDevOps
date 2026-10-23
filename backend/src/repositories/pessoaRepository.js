const fs = require("node:fs");
const path = require("node:path");
const { ErroConflito } = require("../errors");

const copiar = (pessoa) => (pessoa ? { ...pessoa } : null);

function carregarArquivo(arquivo) {
  if (!fs.existsSync(arquivo)) return [];
  try {
    const dados = JSON.parse(fs.readFileSync(arquivo, "utf8"));
    if (!Array.isArray(dados)) throw new Error("conteúdo não é uma lista");
    return dados;
  } catch (erro) {
    throw new Error(`Não foi possível ler ${arquivo}: ${erro.message}`, {
      cause: erro,
    });
  }
}

// Armazena as pessoas em memória. Se `arquivo` for informado, carrega os dados
// ao iniciar e grava o arquivo inteiro a cada alteração.
class PessoaRepository {
  #pessoas = new Map();
  #arquivo;
  #filaDeEscrita = Promise.resolve();

  constructor({ arquivo } = {}) {
    this.#arquivo = arquivo;
    if (arquivo) {
      carregarArquivo(arquivo).forEach((p) => this.#pessoas.set(p.id, p));
    }
  }

  async listar() {
    return [...this.#pessoas.values()].map(copiar);
  }

  async buscarPorId(id) {
    return copiar(this.#pessoas.get(id));
  }

  async buscarPorCpf(cpf) {
    const encontrada = [...this.#pessoas.values()].find((p) => p.cpf === cpf);
    return copiar(encontrada);
  }

  async inserir(pessoa) {
    this.#garantirCpfUnico(pessoa.cpf, pessoa.id);
    this.#pessoas.set(pessoa.id, copiar(pessoa));
    await this.#persistir();
    return copiar(pessoa);
  }

  async atualizar(id, pessoa) {
    if (!this.#pessoas.has(id)) return null;
    this.#garantirCpfUnico(pessoa.cpf, id);
    this.#pessoas.set(id, { ...pessoa, id });
    await this.#persistir();
    return copiar(this.#pessoas.get(id));
  }

  async remover(id) {
    const removida = this.#pessoas.delete(id);
    if (removida) await this.#persistir();
    return removida;
  }

  // Funciona como uma constraint UNIQUE: a checagem e a gravação acontecem sem
  // nenhum await entre elas, então duas requisições simultâneas não passam juntas.
  #garantirCpfUnico(cpf, id) {
    const dono = [...this.#pessoas.values()].find((p) => p.cpf === cpf);
    if (dono && dono.id !== id) {
      throw new ErroConflito("CPF já cadastrado", { cpf: "CPF já cadastrado" });
    }
  }

  // Escritas são enfileiradas para que duas gravações nunca se sobreponham.
  #persistir() {
    if (!this.#arquivo) return Promise.resolve();
    const escrita = this.#filaDeEscrita.then(() => this.#gravarArquivo());
    this.#filaDeEscrita = escrita.catch(() => {});
    return escrita;
  }

  async #gravarArquivo() {
    const temporario = `${this.#arquivo}.tmp`;
    const conteudo = JSON.stringify([...this.#pessoas.values()], null, 2);
    await fs.promises.mkdir(path.dirname(this.#arquivo), { recursive: true });
    // grava em um arquivo temporário e renomeia: nunca deixa o JSON pela metade
    await fs.promises.writeFile(temporario, conteudo);
    await fs.promises.rename(temporario, this.#arquivo);
  }
}

module.exports = PessoaRepository;
