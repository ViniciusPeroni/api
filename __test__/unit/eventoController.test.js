import { jest } from "@jest/globals";

describe("eventoController - testes unitários", () => {
  let eventoController;
  let connect;

  beforeEach(async () => {
    jest.resetModules();

    connect = { query: jest.fn() };
    jest.unstable_mockModule("../../src/db/connect.js", () => ({ default: connect }));

    eventoController = (await import("../../src/controllers/eventoController.js")).default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const bodyValido = {
    nome: "Show de Rock",
    descricao: "Um show incrível",
    data_hora: "2025-12-01 20:00:00",
    local: "Arena SP",
    fk_id_organizador: 1,
  };

  // ─── createEvento ──────────────────────────────────────────────────────────

  it("createEvento retorna 400 quando campos obrigatórios estão faltando", async () => {
    const req = { body: { nome: "Show" }, file: null };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await eventoController.createEvento(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  it("createEvento retorna 201 quando evento é criado com sucesso", async () => {
    const req = { body: bodyValido, file: null };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null));

    await eventoController.createEvento(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: "Evento criado com sucesso" });
  });

  it("createEvento retorna 500 quando ocorre erro no banco", async () => {
    const req = { body: bodyValido, file: null };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(new Error("DB error")));

    await eventoController.createEvento(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Erro ao criar o evento" });
  });

  // ─── getAllEventos ──────────────────────────────────────────────────────────

  it("getAllEventos retorna 200 com lista de eventos", async () => {
    const eventos = [{ id_evento: 1, nome: "Show" }];
    connect.query.mockImplementation((q, cb) => cb(null, eventos));

    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await eventoController.getAllEventos(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Eventos obtidos com sucesso",
      events: eventos,
    });
  });

  it("getAllEventos retorna 500 quando ocorre erro no banco", async () => {
    connect.query.mockImplementation((q, cb) => cb(new Error("DB error"), null));

    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await eventoController.getAllEventos(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  // ─── updateEvento ──────────────────────────────────────────────────────────

  it("updateEvento retorna 400 quando campos obrigatórios estão faltando", async () => {
    const req = { body: { nome: "Incompleto" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await eventoController.updateEvento(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  it("updateEvento retorna 404 quando evento não é encontrado", async () => {
    const req = {
      body: { ...bodyValido, id_evento: 999 },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 0 }));

    await eventoController.updateEvento(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Evento não encontrado" });
  });

  it("updateEvento retorna 200 quando evento é atualizado com sucesso", async () => {
    const req = {
      body: { ...bodyValido, id_evento: 1 },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 1 }));

    await eventoController.updateEvento(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Evento atualizado com sucesso" });
  });

  // ─── deleteEvento ──────────────────────────────────────────────────────────

  it("deleteEvento retorna 404 quando evento não é encontrado", async () => {
    const req = { params: { id: "999" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 0 }));

    await eventoController.deleteEvento(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Evento não encontrado" });
  });

  it("deleteEvento retorna 200 quando evento é excluído com sucesso", async () => {
    const req = { params: { id: "1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 1 }));

    await eventoController.deleteEvento(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Evento excluído com sucesso" });
  });
});
