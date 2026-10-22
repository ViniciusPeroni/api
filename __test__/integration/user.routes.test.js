import { jest } from "@jest/globals";
import request from "supertest";

describe("Rotas de Usuário - testes de integração", () => {
  let app;
  let connect;
  let bcrypt;
  let jwt;

  beforeEach(async () => {
    jest.resetModules();

    connect = { query: jest.fn() };
    bcrypt = {
      hash: jest.fn(async () => "hashed-password"),
      compareSync: jest.fn(() => true),
    };
    jwt = {
      sign: jest.fn(() => "fake-token"),
      verify: jest.fn((token, secret, callback) => callback(null, { id: 7 })),
    };

    jest.unstable_mockModule("dotenv-safe/config.js", () => ({}));
    jest.unstable_mockModule("../../src/db/connect.js", () => ({ default: connect }));
    jest.unstable_mockModule("../../src/db/testConnect.js", () => ({ default: jest.fn() }));
    jest.unstable_mockModule("bcrypt", () => ({ default: bcrypt }));
    jest.unstable_mockModule("jsonwebtoken", () => ({ default: jwt }));
    jest.unstable_mockModule("../../src/services/validateCpf.js", () => ({
      default: async () => null,
    }));

    app = (await import("../../src/index.js")).default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── POST /api/v1/user ─────────────────────────────────────────────────────

  it("POST /api/v1/user → 400 quando CPF é inválido (menos de 11 dígitos)", async () => {
    const response = await request(app).post("/api/v1/user").send({
      cpf: "123",
      email: "aluno@senai.br",
      password: "123",
      name: "Aluno",
      data_nascimento: "2005-05-10",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "CPF inválido. Deve conter exatamente 11 dígitos numéricos",
    });
  });

  it("POST /api/v1/user → 400 quando campos obrigatórios estão faltando", async () => {
    const response = await request(app).post("/api/v1/user").send({
      email: "aluno@senai.br",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  it("POST /api/v1/user → 201 quando usuário é criado com sucesso", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, { insertId: 1 }));

    const response = await request(app).post("/api/v1/user").send({
      cpf: "12345678901",
      email: "aluno@senai.br",
      password: "123",
      name: "Aluno",
      data_nascimento: "2005-05-10",
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: "Usuário criado com sucesso" });
    expect(bcrypt.hash).toHaveBeenCalledWith("123", 10);
  });

  // ─── POST /api/v1/login ────────────────────────────────────────────────────

  it("POST /api/v1/login → 400 quando email ou senha não são fornecidos", async () => {
    const response = await request(app).post("/api/v1/login").send({
      email: "aluno@senai.br",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Email e senha são obrigatórios" });
  });

  it("POST /api/v1/login → 401 quando usuário não é encontrado", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, []));

    const response = await request(app).post("/api/v1/login").send({
      email: "inexistente@senai.br",
      password: "123",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Usuário não encontrado" });
  });

  it("POST /api/v1/login → 200 com token quando credenciais são válidas", async () => {
    connect.query.mockImplementation((q, v, cb) =>
      cb(null, [
        {
          id_usuario: 7,
          cpf: "12345678901",
          email: "aluno@senai.br",
          name: "Aluno",
          password: "hashed-password",
          data_nascimento: "2005-05-10",
        },
      ])
    );

    const response = await request(app).post("/api/v1/login").send({
      email: "aluno@senai.br",
      password: "123",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login bem-sucedido");
    expect(response.body.token).toBe("fake-token");
    expect(bcrypt.compareSync).toHaveBeenCalledWith("123", "hashed-password");
  });

  // ─── GET /api/v1/user ──────────────────────────────────────────────────────

  it("GET /api/v1/user → 401 sem token de autorização", async () => {
    const response = await request(app).get("/api/v1/user");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      auth: false,
      message: "Token não foi fornecido",
    });
  });

  it("GET /api/v1/user → 200 com token válido", async () => {
    const users = [{ id_usuario: 7, name: "Aluno", email: "aluno@senai.br" }];
    connect.query.mockImplementation((q, cb) => cb(null, users));

    const response = await request(app)
      .get("/api/v1/user")
      .set("authorization", "fake-token");

    expect(response.status).toBe(200);
    expect(response.body.users).toEqual(users);
  });

  // ─── DELETE /api/v1/user/:id ───────────────────────────────────────────────

  it("DELETE /api/v1/user/:id → 200 quando usuário é excluído com sucesso", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 1 }));

    const response = await request(app).delete("/api/v1/user/1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Usuário excluído com ID: 1" });
  });

  it("DELETE /api/v1/user/:id → 404 quando usuário não é encontrado", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 0 }));

    const response = await request(app).delete("/api/v1/user/999");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Usuário não encontrado" });
  });
});
