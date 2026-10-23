const FORMATO_DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

// Converte "AAAA-MM-DD" em { ano, mes, dia } sem passar por fuso horário.
// Retorna null se o formato estiver errado ou a data não existir no calendário.
function lerDataIso(texto) {
  if (typeof texto !== "string") return null;
  const partes = FORMATO_DATA_ISO.exec(texto);
  if (!partes) return null;

  const [ano, mes, dia] = partes.slice(1).map(Number);
  const data = new Date(ano, mes - 1, dia);
  const existe =
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia;
  return existe ? { ano, mes, dia } : null;
}

function validarDataIso(texto) {
  return lerDataIso(texto) !== null;
}

function calcularIdade(dataNascimento, referencia = new Date()) {
  const nascimento = lerDataIso(dataNascimento);
  if (!nascimento) throw new RangeError("Data de nascimento inválida");

  const hoje = {
    ano: referencia.getFullYear(),
    mes: referencia.getMonth() + 1,
    dia: referencia.getDate(),
  };

  const comoNumero = ({ ano, mes, dia }) => ano * 10000 + mes * 100 + dia;
  if (comoNumero(nascimento) > comoNumero(hoje)) {
    throw new RangeError("Data de nascimento não pode estar no futuro");
  }

  const aniversarioAindaNaoChegou =
    hoje.mes < nascimento.mes ||
    (hoje.mes === nascimento.mes && hoje.dia < nascimento.dia);

  return hoje.ano - nascimento.ano - (aniversarioAindaNaoChegou ? 1 : 0);
}

module.exports = { calcularIdade, validarDataIso };
