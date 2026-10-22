import { jest } from "@jest/globals";

describe("ingressoController - testes unitários", () => {
  let ingressoController;
  let connect;

  beforeEach(async () => {
    jest.resetModules();

    connect = { query: jest.fn() };
    jest.unstable_mockModule("../../src/db/connect.js", () => ({ default: connect }));

    ingressoController = (
      await import("../../src/controllers/ingressoController.js")
    ).default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const bodyValido = {
    preco: 50.0,
    tipo: "VIP",
    fk_id_evento: 1,
  };

  // ─── createIngresso ────────────────────────────────────────────────────────

  it("createIngresso retorna 400 quando campos obrigatórios estão faltando", async () => {
    const req = { body: { preco: 50 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await ingressoController.createIngresso(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  it("createIngresso retorna 200 quando ingresso é criado com sucesso", async () => {
    const req = { body: bodyValido };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null));

    await ingressoController.createIngresso(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Ingresso criado com sucesso" });
  });

  it("createIngresso retorna 500 quando ocorre erro no banco", async () => {
    const req = { body: bodyValido };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(new Error("DB error")));

    await ingressoController.createIngresso(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Erro ao criar o ingresso" });
  });

  // ─── getAllIngressos ────────────────────────────────────────────────────────

  it("getAllIngressos retorna 200 com lista de ingressos", async () => {
    const ingressos = [{ id_ingresso: 1, preco: 50, tipo: "VIP", nome_evento: "Show" }];
    connect.query.mockImplementation((q, cb) => cb(null, ingressos));

    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await ingressoController.getAllIngressos(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Ingressos obtidos com sucesso",
      ingressos,
    });
  });

  it("getAllIngressos retorna 500 quando ocorre erro no banco", async () => {
    connect.query.mockImplementation((q, cb) => cb(new Error("DB error"), null));

    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await ingressoController.getAllIngressos(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  // ─── getByIdEvento ─────────────────────────────────────────────────────────

  it("getByIdEvento retorna 200 com ingressos do evento", async () => {
    const ingressos = [{ id_ingresso: 1, preco: 50, nome_evento: "Rock Show" }];
    connect.query.mockImplementation((q, v, cb) => cb(null, ingressos));

    const req = { params: { id: "1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await ingressoController.getByIdEvento(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Ingressos do evento obtidos com sucesso",
      ingressos,
    });
  });

  it("getByIdEvento retorna 500 quando ocorre erro no banco", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(new Error("DB error"), null));

    const req = { params: { id: "1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await ingressoController.getByIdEvento(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  // ─── updateIngresso ────────────────────────────────────────────────────────

  it("updateIngresso retorna 400 quando campos obrigatórios estão faltando", async () => {
    const req = { body: { preco: 50 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await ingressoController.updateIngresso(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  it("updateIngresso retorna 404 quando ingresso não é encontrado", async () => {
    const req = { body: { ...bodyValido, id_ingresso: 999 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 0 }));

    await ingressoController.updateIngresso(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Ingresso não encontrado" });
  });

  it("updateIngresso retorna 200 quando atualização é bem-sucedida", async () => {
    const req = { body: { ...bodyValido, id_ingresso: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 1 }));

    await ingressoController.updateIngresso(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Ingresso atualizado com sucesso" });
  });

  // ─── deleteIngresso ────────────────────────────────────────────────────────

  it("deleteIngresso retorna 404 quando ingresso não é encontrado", async () => {
    const req = { params: { id: "999" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 0 }));

    await ingressoController.deleteIngresso(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Ingresso não encontrado" });
  });

  it("deleteIngresso retorna 200 quando exclusão é bem-sucedida", async () => {
    const req = { params: { id: "1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 1 }));

    await ingressoController.deleteIngresso(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Ingresso excluído com sucesso" });
  });
});
