import { jest } from "@jest/globals";
import request from "supertest";

describe("Rotas de Evento - testes de integração", () => {
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

  const eventoValido = {
    nome: "Festival de Música",
    descricao: "Festival anual de música ao vivo",
    data_hora: "2025-11-20 18:00:00",
    local: "Parque Ibirapuera",
    fk_id_organizador: 1,
  };

  // ─── POST /api/v1/evento ───────────────────────────────────────────────────

  it("POST /api/v1/evento → 400 quando campos obrigatórios estão faltando", async () => {
    const response = await request(app)
      .post("/api/v1/evento")
      .field("nome", "Festival sem outros campos");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  it("POST /api/v1/evento → 201 quando evento é criado com sucesso", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, { insertId: 10 }));

    const response = await request(app)
      .post("/api/v1/evento")
      .field("nome", eventoValido.nome)
      .field("descricao", eventoValido.descricao)
      .field("data_hora", eventoValido.data_hora)
      .field("local", eventoValido.local)
      .field("fk_id_organizador", eventoValido.fk_id_organizador);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: "Evento criado com sucesso" });
  });

  // ─── GET /api/v1/evento ────────────────────────────────────────────────────

  it("GET /api/v1/evento → 200 com lista de eventos", async () => {
    const eventos = [
      { id_evento: 1, nome: "Show", local: "Arena", fk_id_organizador: 1 },
    ];
    connect.query.mockImplementation((q, cb) => cb(null, eventos));

    const response = await request(app).get("/api/v1/evento");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Eventos obtidos com sucesso",
      events: eventos,
    });
  });

  // ─── PUT /api/v1/evento ────────────────────────────────────────────────────

  it("PUT /api/v1/evento → 400 quando campos obrigatórios estão faltando", async () => {
    const response = await request(app).put("/api/v1/evento").send({
      id_evento: 1,
      nome: "Apenas nome",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  it("PUT /api/v1/evento → 404 quando evento não é encontrado", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 0 }));

    const response = await request(app).put("/api/v1/evento").send({
      id_evento: 999,
      ...eventoValido,
    });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Evento não encontrado" });
  });

  it("PUT /api/v1/evento → 200 quando atualização é bem-sucedida", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 1 }));

    const response = await request(app).put("/api/v1/evento").send({
      id_evento: 1,
      ...eventoValido,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Evento atualizado com sucesso" });
  });

  // ─── DELETE /api/v1/evento/:id ─────────────────────────────────────────────

  it("DELETE /api/v1/evento/:id → 200 quando evento é excluído com sucesso", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 1 }));

    const response = await request(app).delete("/api/v1/evento/1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Evento excluído com sucesso" });
  });

  it("DELETE /api/v1/evento/:id → 404 quando evento não é encontrado", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 0 }));

    const response = await request(app).delete("/api/v1/evento/999");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Evento não encontrado" });
  });
});
