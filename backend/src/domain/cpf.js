const FORMATO_CPF = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;

function limparCpf(cpf) {
  if (typeof cpf !== "string") return "";
  return cpf.trim().replace(/\D/g, "");
}

// Calcula um dígito verificador a partir dos dígitos anteriores.
// Pesos decrescentes começando em (quantidade de dígitos + 1).
function calcularDigito(digitos) {
  const pesoInicial = digitos.length + 1;
  const soma = digitos
    .split("")
    .reduce(
      (total, digito, i) => total + Number(digito) * (pesoInicial - i),
      0,
    );
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

function validarCpf(cpf) {
  if (typeof cpf !== "string" || !FORMATO_CPF.test(cpf.trim())) return false;

  const digitos = limparCpf(cpf);
  // sequências como 111.111.111-11 passam no cálculo, mas não são CPFs válidos
  if (/^(\d)\1{10}$/.test(digitos)) return false;

  const primeiro = calcularDigito(digitos.slice(0, 9));
  const segundo = calcularDigito(digitos.slice(0, 10));
  return primeiro === Number(digitos[9]) && segundo === Number(digitos[10]);
}

function formatarCpf(cpf) {
  return limparCpf(cpf).replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    "$1.$2.$3-$4",
  );
}

module.exports = { limparCpf, validarCpf, formatarCpf };
