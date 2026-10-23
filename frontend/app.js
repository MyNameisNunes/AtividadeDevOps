const API = "/api/pessoas";

const form = document.getElementById("form-pessoa");
const tituloForm = document.getElementById("titulo-form");
const botaoSalvar = document.getElementById("salvar");
const botaoCancelar = document.getElementById("cancelar");
const mensagem = document.getElementById("mensagem");
const lista = document.getElementById("lista");
const vazio = document.getElementById("vazio");
const contador = document.getElementById("contador");
const campos = {
  cpf: document.getElementById("cpf"),
  nome: document.getElementById("nome"),
  dataNascimento: document.getElementById("dataNascimento"),
};

// id da pessoa sendo editada; null quando o formulário está cadastrando
let idEmEdicao = null;

// ---------- utilitários ----------

// máscara simples de CPF: 000.000.000-00
function mascararCpf(valor) {
  const n = valor.replace(/\D/g, "").slice(0, 11);
  return n
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

// "1990-05-15" -> "15/05/1990"
function formatarData(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function hojeIso() {
  const hoje = new Date();
  const doisDigitos = (n) => String(n).padStart(2, "0");
  return `${hoje.getFullYear()}-${doisDigitos(hoje.getMonth() + 1)}-${doisDigitos(hoje.getDate())}`;
}

// Faz a requisição e lança um erro com { erros } quando a API recusa.
async function requisitar(url, opcoes = {}) {
  const resposta = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opcoes,
  });
  if (resposta.status === 204) return null;

  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const erro = new Error(corpo.mensagem || "Erro inesperado");
    erro.erros = corpo.erros || {};
    throw erro;
  }
  return corpo;
}

// ---------- feedback ----------

function mostrarMensagem(texto, tipo = "sucesso") {
  // reinicia a animação a cada nova mensagem
  mensagem.className = "";
  void mensagem.offsetWidth;
  mensagem.className = tipo;
  mensagem.textContent = texto;
}

function limparErros() {
  Object.entries(campos).forEach(([nome, campo]) => {
    campo.classList.remove("invalid");
    campo.removeAttribute("aria-invalid");
    document.getElementById(`erro-${nome}`).textContent = "";
  });
}

function mostrarErros(erros) {
  Object.entries(erros).forEach(([nome, texto]) => {
    const campo = campos[nome];
    if (!campo) return;
    void campo.offsetWidth;
    campo.classList.add("invalid");
    campo.setAttribute("aria-invalid", "true");
    document.getElementById(`erro-${nome}`).textContent = texto;
  });
  const primeiroInvalido = Object.keys(erros).find((nome) => campos[nome]);
  if (primeiroInvalido) campos[primeiroInvalido].focus();
}

// ---------- lista ----------

function criarItem(pessoa) {
  const item = document.createElement("li");
  item.className = "pessoa";
  item.dataset.id = pessoa.id;
  if (pessoa.id === idEmEdicao) item.classList.add("editando");

  const dados = document.createElement("div");
  dados.className = "pessoa-dados";

  const nome = document.createElement("p");
  nome.className = "pessoa-nome";
  nome.textContent = pessoa.nome;

  const detalhes = document.createElement("p");
  detalhes.className = "pessoa-detalhes";
  detalhes.textContent = `CPF ${pessoa.cpf} · nasceu em ${formatarData(pessoa.dataNascimento)}`;

  const acoes = document.createElement("div");
  acoes.className = "pessoa-acoes";
  const editar = document.createElement("button");
  editar.type = "button";
  editar.textContent = "Editar";
  editar.setAttribute("aria-label", `Editar ${pessoa.nome}`);
  editar.addEventListener("click", () => iniciarEdicao(pessoa));
  const excluir = document.createElement("button");
  excluir.type = "button";
  excluir.className = "perigo";
  excluir.textContent = "Excluir";
  excluir.setAttribute("aria-label", `Excluir ${pessoa.nome}`);
  excluir.addEventListener("click", () => excluirPessoa(pessoa));
  acoes.append(editar, excluir);

  dados.append(nome, detalhes, acoes);

  const idade = document.createElement("p");
  idade.className = "pessoa-idade";
  const numero = document.createElement("strong");
  numero.textContent = pessoa.idade;
  idade.append(numero, pessoa.idade === 1 ? " ano" : " anos");

  item.append(dados, idade);
  return item;
}

function renderizar(pessoas) {
  lista.replaceChildren(...pessoas.map(criarItem));
  vazio.hidden = pessoas.length > 0;
  contador.textContent = pessoas.length;
}

async function carregar() {
  try {
    renderizar(await requisitar(API));
  } catch (erro) {
    mostrarMensagem(
      `Não foi possível carregar a lista: ${erro.message}`,
      "erro",
    );
  }
}

// ---------- ações ----------

function iniciarEdicao(pessoa) {
  idEmEdicao = pessoa.id;
  campos.cpf.value = pessoa.cpf;
  campos.nome.value = pessoa.nome;
  campos.dataNascimento.value = pessoa.dataNascimento;
  tituloForm.textContent = "Editar pessoa";
  botaoSalvar.textContent = "Salvar alterações";
  botaoCancelar.hidden = false;
  limparErros();
  mensagem.className = "";
  mensagem.textContent = "";
  lista.querySelectorAll(".pessoa").forEach((item) => {
    item.classList.toggle("editando", item.dataset.id === pessoa.id);
  });
  campos.nome.focus();
}

function encerrarEdicao() {
  idEmEdicao = null;
  form.reset();
  tituloForm.textContent = "Nova pessoa";
  botaoSalvar.textContent = "Cadastrar";
  botaoCancelar.hidden = true;
  limparErros();
  lista
    .querySelectorAll(".editando")
    .forEach((item) => item.classList.remove("editando"));
}

async function salvar(evento) {
  evento.preventDefault();
  limparErros();

  const dados = {
    cpf: campos.cpf.value,
    nome: campos.nome.value,
    dataNascimento: campos.dataNascimento.value,
  };
  const editando = idEmEdicao !== null;

  botaoSalvar.disabled = true;
  try {
    const pessoa = await requisitar(editando ? `${API}/${idEmEdicao}` : API, {
      method: editando ? "PUT" : "POST",
      body: JSON.stringify(dados),
    });
    encerrarEdicao();
    mostrarMensagem(
      `Cadastro de ${pessoa.nome} ${editando ? "atualizado" : "criado"} · ${pessoa.idade} ${pessoa.idade === 1 ? "ano" : "anos"}`,
    );
    await carregar();
  } catch (erro) {
    mostrarErros(erro.erros || {});
    mostrarMensagem(erro.message, "erro");
  } finally {
    botaoSalvar.disabled = false;
  }
}

async function excluirPessoa(pessoa) {
  if (!window.confirm(`Excluir o cadastro de ${pessoa.nome}?`)) return;
  try {
    await requisitar(`${API}/${pessoa.id}`, { method: "DELETE" });
    if (pessoa.id === idEmEdicao) encerrarEdicao();
    mostrarMensagem(`Cadastro de ${pessoa.nome} excluído`);
  } catch (erro) {
    mostrarMensagem(erro.message, "erro");
  }
  await carregar();
}

// ---------- eventos ----------

campos.cpf.addEventListener("input", () => {
  campos.cpf.value = mascararCpf(campos.cpf.value);
});
campos.dataNascimento.max = hojeIso();
form.addEventListener("submit", salvar);
botaoCancelar.addEventListener("click", encerrarEdicao);

carregar();
