const { validarCpf, limparCpf } = require("./cpf");
const { calcularIdade, validarDataIso } = require("./idade");

const IDADE_MAXIMA = 130;
const TAMANHO_MAXIMO_NOME = 100;
// letras (inclusive acentuadas), espaço, apóstrofo, hífen e ponto; começa por letra
const CARACTERES_NOME = /^\p{L}[\p{L}\s'.-]*$/u;

const textoOuVazio = (valor) => (typeof valor === "string" ? valor.trim() : "");
const normalizarNome = (nome) => textoOuVazio(nome).replace(/\s+/g, " ");

function validarCampoCpf(cpf) {
  if (!textoOuVazio(cpf)) return "CPF é obrigatório";
  if (!validarCpf(cpf)) return "CPF inválido";
  return null;
}

function validarCampoNome(nome) {
  const normalizado = normalizarNome(nome);
  if (!normalizado) return "Nome é obrigatório";
  if (normalizado.length > TAMANHO_MAXIMO_NOME) {
    return `Nome deve ter no máximo ${TAMANHO_MAXIMO_NOME} caracteres`;
  }
  if (!CARACTERES_NOME.test(normalizado)) {
    return "Nome deve conter apenas letras";
  }
  if (normalizado.split(" ").length < 2) {
    return "Informe o nome completo (nome e sobrenome)";
  }
  return null;
}

function validarCampoDataNascimento(dataNascimento, hoje) {
  if (!textoOuVazio(dataNascimento)) return "Data de nascimento é obrigatória";
  if (!validarDataIso(dataNascimento)) {
    return "Data de nascimento inválida (use AAAA-MM-DD)";
  }
  try {
    if (calcularIdade(dataNascimento, hoje) > IDADE_MAXIMA) {
      return `Idade não pode ser superior a ${IDADE_MAXIMA} anos`;
    }
  } catch (erro) {
    return erro.message; // data no futuro
  }
  return null;
}

// Retorna um objeto { campo: mensagem } com os erros encontrados (vazio se válido).
function validarPessoa(dados, hoje = new Date()) {
  const { cpf, nome, dataNascimento } =
    dados && typeof dados === "object" && !Array.isArray(dados) ? dados : {};

  const erros = {
    cpf: validarCampoCpf(cpf),
    nome: validarCampoNome(nome),
    dataNascimento: validarCampoDataNascimento(dataNascimento, hoje),
  };

  return Object.fromEntries(
    Object.entries(erros).filter(([, mensagem]) => mensagem !== null),
  );
}

// Formato canônico usado para armazenar (assume dados já validados).
function normalizarPessoa({ cpf, nome, dataNascimento }) {
  return {
    cpf: limparCpf(cpf),
    nome: normalizarNome(nome),
    dataNascimento,
  };
}

module.exports = { validarPessoa, normalizarPessoa, IDADE_MAXIMA };
