const { ErroValidacao, ErroNaoEncontrado, ErroConflito } = require("../errors");

// Converte os erros da aplicação em respostas HTTP. Erros inesperados viram 500
// sem expor detalhes internos ao cliente.
// O Express só reconhece um middleware de erro quando ele tem 4 parâmetros.
function tratarErros(erro, _req, res, _next) {
  if (erro instanceof ErroValidacao) {
    return res.status(400).json({ mensagem: erro.message, erros: erro.erros });
  }
  if (erro instanceof ErroConflito) {
    return res.status(409).json({ mensagem: erro.message, erros: erro.erros });
  }
  if (erro instanceof ErroNaoEncontrado) {
    return res.status(404).json({ mensagem: erro.message });
  }
  if (erro.type === "entity.parse.failed") {
    return res.status(400).json({ mensagem: "JSON inválido" });
  }

  console.error(erro);
  return res.status(500).json({ mensagem: "Erro interno do servidor" });
}

module.exports = tratarErros;
