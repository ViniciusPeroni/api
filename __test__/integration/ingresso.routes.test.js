import { jest } from "@jest/globals";
import request from "supertest";

describe("Rotas de Ingresso - testes de integração", () => {
  let app;
  let connect;

  beforeEach(async () => {
    jest.resetModules();

    connect = { query: jest.fn() };

    jest.unstable_mockModule("dotenv-safe/config.js", () => ({}));
    jest.unstable_mockModule("../../src/db/connect.js", () => ({ default: connect }));
    jest.unstable_mockModule("../../src/db/testConnect.js", () => ({ default: jest.fn() }));

    app = (await import("../../src/index.js")).default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const ingressoValido = {
    preco: 120.0,
    tipo: "Pista Premium",
    fk_id_evento: 1,
  };

  // ─── POST /api/v1/ingresso ─────────────────────────────────────────────────

  it("POST /api/v1/ingresso → 400 quando campos obrigatórios estão faltando", async () => {
    const response = await request(app).post("/api/v1/ingresso").send({
      preco: 100.0,
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  it("POST /api/v1/ingresso → 200 quando ingresso é criado com sucesso", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, { insertId: 1 }));

    const response = await request(app)
      .post("/api/v1/ingresso")
      .send(ingressoValido);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Ingresso criado com sucesso",
    });
  });

  // ─── GET /api/v1/ingresso ──────────────────────────────────────────────────

  it("GET /api/v1/ingresso → 200 com lista de ingressos", async () => {
    const lista = [
      { id_ingresso: 1, preco: 120.0, tipo: "VIP", fk_id_evento: 1 },
    ];
    connect.query.mockImplementation((q, cb) => cb(null, lista));

    const response = await request(app).get("/api/v1/ingresso");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Ingressos obtidos com sucesso",
      ingressos: lista,
    });
  });

  // ─── GET /api/v1/ingresso/evento/:id ───────────────────────────────────────

  it("GET /api/v1/ingresso/evento/:id → 200 com ingressos vinculados ao evento", async () => {
    const listaEvento = [
      { id_ingresso: 1, preco: 120.0, tipo: "VIP", fk_id_evento: 1, nome_evento: "Festival" },
    ];
    connect.query.mockImplementation((q, v, cb) => cb(null, listaEvento));

    const response = await request(app).get("/api/v1/ingresso/evento/1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Ingressos do evento obtidos com sucesso",
      ingressos: listaEvento,
    });
  });

  // ─── PUT /api/v1/ingresso ──────────────────────────────────────────────────

  it("PUT /api/v1/ingresso → 200 quando ingresso é atualizado com sucesso", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 1 }));

    const response = await request(app).put("/api/v1/ingresso").send({
      id_ingresso: 1,
      ...ingressoValido,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Ingresso atualizado com sucesso",
    });
  });

  it("PUT /api/v1/ingresso → 404 quando ingresso não é encontrado", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 0 }));

    const response = await request(app).put("/api/v1/ingresso").send({
      id_ingresso: 999,
      ...ingressoValido,
    });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: "Ingresso não encontrado",
    });
  });

  // ─── DELETE /api/v1/ingresso/:id ───────────────────────────────────────────

  it("DELETE /api/v1/ingresso/:id → 200 quando ingresso é excluído com sucesso", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 1 }));

    const response = await request(app).delete("/api/v1/ingresso/1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Ingresso excluído com sucesso",
    });
  });

  it("DELETE /api/v1/ingresso/:id → 404 quando ingresso não é encontrado", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 0 }));

    const response = await request(app).delete("/api/v1/ingresso/999");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: "Ingresso não encontrado",
    });
  });
});
