const criarApp = require("./app");
const PessoaRepository = require("./repositories/pessoaRepository");
const PessoaService = require("./services/pessoaService");

const PORTA = Number(process.env.PORT) || 3000;
// sem DATA_FILE os dados ficam só em memória
const ARQUIVO_DADOS = process.env.DATA_FILE;

const repositorio = new PessoaRepository({ arquivo: ARQUIVO_DADOS });
const service = new PessoaService({ repositorio });
const servidor = criarApp({ service }).listen(PORTA, () => {
  console.log(`Servidor ouvindo em http://localhost:${PORTA}`);
  console.log(
    ARQUIVO_DADOS
      ? `Dados persistidos em ${ARQUIVO_DADOS}`
      : "Dados em memória (defina DATA_FILE para persistir)",
  );
});

// encerra de forma limpa quando o container recebe `docker stop`
for (const sinal of ["SIGTERM", "SIGINT"]) {
  process.on(sinal, () => {
    console.log(`${sinal} recebido, encerrando...`);
    servidor.close(() => process.exit(0));
  });
}
