class ErroValidacao extends Error {
  constructor(erros) {
    super("Dados inválidos");
    this.name = "ErroValidacao";
    this.erros = erros;
  }
}

class ErroNaoEncontrado extends Error {
  constructor(mensagem = "Pessoa não encontrada") {
    super(mensagem);
    this.name = "ErroNaoEncontrado";
  }
}

class ErroConflito extends Error {
  constructor(mensagem, erros) {
    super(mensagem);
    this.name = "ErroConflito";
    this.erros = erros;
  }
}

module.exports = { ErroValidacao, ErroNaoEncontrado, ErroConflito };
