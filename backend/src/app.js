const path = require("node:path");
const express = require("express");
const criarRotasPessoas = require("./routes/pessoas");
const tratarErros = require("./middlewares/tratarErros");

const PASTA_FRONTEND = path.join(__dirname, "..", "..", "frontend");

function criarApp({ service }) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/pessoas", criarRotasPessoas(service));
  app.use("/api", (_req, res) =>
    res.status(404).json({ mensagem: "Rota não encontrada" }),
  );
  app.use(express.static(PASTA_FRONTEND));

  app.use(tratarErros);
  return app;
}

module.exports = criarApp;
