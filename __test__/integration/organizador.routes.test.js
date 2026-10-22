import { jest } from "@jest/globals";
import request from "supertest";

describe("Rotas de Organizador - testes de integração", () => {
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

  const organizadorValido = {
    nome: "Empresa de Eventos",
    email: "contato@empresa.com",
    senha: "senhaSegura123",
    telefone: "11987654321",
  };

  // ─── POST /api/v1/organizador ──────────────────────────────────────────────

  it("POST /api/v1/organizador → 400 quando campos obrigatórios estão faltando", async () => {
    const response = await request(app).post("/api/v1/organizador").send({
      nome: "Empresa",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  it("POST /api/v1/organizador → 400 quando o telefone é inválido", async () => {
    const response = await request(app).post("/api/v1/organizador").send({
      ...organizadorValido,
      telefone: "123",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Telefone inválido. Deve conter exatamente 11 dígitos numéricos",
    });
  });

  it("POST /api/v1/organizador → 201 quando organizador é criado com sucesso", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, { insertId: 5 }));

    const response = await request(app)
      .post("/api/v1/organizador")
      .send(organizadorValido);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: "Organizador criado com sucesso",
    });
  });

  // ─── GET /api/v1/organizador ───────────────────────────────────────────────

  it("GET /api/v1/organizador → 200 com lista de organizadores", async () => {
    const lista = [
      { id_organizador: 1, nome: "Org 1", email: "org1@eventos.br" },
    ];
    connect.query.mockImplementation((q, cb) => cb(null, lista));

    const response = await request(app).get("/api/v1/organizador");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Obtendo todos os organizadores",
      organizadores: lista,
    });
  });

  // ─── PUT /api/v1/organizador ───────────────────────────────────────────────

  it("PUT /api/v1/organizador → 200 quando atualização é bem-sucedida", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 1 }));

    const response = await request(app).put("/api/v1/organizador").send({
      id: 1,
      ...organizadorValido,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Organizador atualizado com sucesso",
    });
  });

  // ─── DELETE /api/v1/organizador/:id ────────────────────────────────────────

  it("DELETE /api/v1/organizador/:id → 200 quando organizador é excluído com sucesso", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 1 }));

    const response = await request(app).delete("/api/v1/organizador/1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Organizador excluído com sucesso",
    });
  });

  it("DELETE /api/v1/organizador/:id → 404 quando organizador não é encontrado", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 0 }));

    const response = await request(app).delete("/api/v1/organizador/999");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: "Organizador não encontrado",
    });
  });
});
