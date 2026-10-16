const botao = document.getElementById("calculate");
const resultado = document.getElementById("result");
const cpfInput = document.getElementById("document");

// máscara simples de CPF: 000.000.000-00
cpfInput.addEventListener("input", () => {
  const n = cpfInput.value.replace(/\D/g, "").slice(0, 11);
  cpfInput.value = n
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
});

function mostrar(html, erro = false) {
  // reinicia a animação do resultado a cada clique
  resultado.classList.add("again");
  void resultado.offsetWidth;
  resultado.classList.remove("again");
  resultado.classList.toggle("error", erro);
  resultado.innerHTML = html;
}

botao.addEventListener("click", () => {
  const campos = ["name", "gender", "document", "birthdate"].map((id) =>
    document.getElementById(id),
  );

  let valido = true;
  campos.forEach((campo) => {
    campo.classList.remove("invalid");
    if (!campo.value.trim()) {
      void campo.offsetWidth;
      campo.classList.add("invalid");
      valido = false;
    }
  });

  if (!valido) {
    mostrar("Preencha todos os campos.", true);
    return;
  }

  const [nome, genero, , data] = campos.map((c) => c.value.trim());
  const nasc = new Date(data + "T00:00:00");
  const hoje = new Date();

  if (nasc > hoje) {
    mostrar("A data de nascimento não pode estar no futuro.", true);
    return;
  }

  let anos = hoje.getFullYear() - nasc.getFullYear();
  let meses = hoje.getMonth() - nasc.getMonth();
  let dias = hoje.getDate() - nasc.getDate();

  if (dias < 0) {
    meses--;
    dias += new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate();
  }
  if (meses < 0) {
    anos--;
    meses += 12;
  }

  const saudacao =
    genero === "masculino"
      ? "Bem-vindo"
      : genero === "feminino"
        ? "Bem-vinda"
        : "Boas-vindas";

  mostrar(`
    <p class="greeting">${saudacao}, ${nome}</p>
    <p class="age"><strong>${anos}</strong> anos</p>
    <p class="details">${meses} meses e ${dias} dias desde o último aniversário</p>
  `);
});
