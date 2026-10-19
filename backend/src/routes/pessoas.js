const express = require("express");

function criarRotasPessoas(service) {
  const rotas = express.Router();

  rotas.get("/", async (_req, res) => {
    res.json(await service.listar());
  });

  rotas.get("/:id", async (req, res) => {
    res.json(await service.buscarPorId(req.params.id));
  });

  rotas.post("/", async (req, res) => {
    const criada = await service.criar(req.body);
    res.status(201).location(`/api/pessoas/${criada.id}`).json(criada);
  });

  rotas.put("/:id", async (req, res) => {
    res.json(await service.atualizar(req.params.id, req.body));
  });

  rotas.delete("/:id", async (req, res) => {
    await service.remover(req.params.id);
    res.status(204).end();
  });

  return rotas;
}

module.exports = criarRotasPessoas;
