import { jest } from "@jest/globals";

describe("organizadorController - testes unitários", () => {
  let organizadorController;
  let connect;

  beforeEach(async () => {
    jest.resetModules();

    connect = { query: jest.fn() };
    jest.unstable_mockModule("../../src/db/connect.js", () => ({ default: connect }));

    organizadorController = (
      await import("../../src/controllers/organizadorController.js")
    ).default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const bodyValido = {
    nome: "Org Eventos",
    email: "org@eventos.br",
    senha: "senha123",
    telefone: "11999998888",
  };

  // ─── createOrganizador ─────────────────────────────────────────────────────

  it("createOrganizador retorna 400 quando campos obrigatórios estão faltando", async () => {
    const req = { body: { nome: "Sem Email" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await organizadorController.createOrganizador(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  it("createOrganizador retorna 400 quando o email não contém @", async () => {
    const req = { body: { ...bodyValido, email: "emailinvalido.br" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await organizadorController.createOrganizador(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Email inválido. Deve conter @" });
  });

  it("createOrganizador retorna 400 quando o telefone tem menos de 11 dígitos", async () => {
    const req = { body: { ...bodyValido, telefone: "1199999" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await organizadorController.createOrganizador(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Telefone inválido. Deve conter exatamente 11 dígitos numéricos",
    });
  });

  it("createOrganizador retorna 400 quando o telefone contém letras", async () => {
    const req = { body: { ...bodyValido, telefone: "1199999AAAA" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await organizadorController.createOrganizador(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("createOrganizador retorna 400 quando email já está cadastrado (ER_DUP_ENTRY)", async () => {
    const req = { body: bodyValido };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) =>
      cb({ code: "ER_DUP_ENTRY", message: "email" })
    );

    await organizadorController.createOrganizador(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Email já cadastrado" });
  });

  it("createOrganizador retorna 201 quando organizador é criado com sucesso", async () => {
    const req = { body: bodyValido };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null));

    await organizadorController.createOrganizador(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: "Organizador criado com sucesso" });
  });

  // ─── getAllOrganizadores ────────────────────────────────────────────────────

  it("getAllOrganizadores retorna 200 com lista de organizadores", async () => {
    const organizadores = [{ id_organizador: 1, nome: "Org Eventos" }];
    connect.query.mockImplementation((q, cb) => cb(null, organizadores));

    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await organizadorController.getAllOrganizadores(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Obtendo todos os organizadores",
      organizadores,
    });
  });

  it("getAllOrganizadores retorna 500 quando ocorre erro no banco", async () => {
    connect.query.mockImplementation((q, cb) => cb(new Error("DB error"), null));

    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await organizadorController.getAllOrganizadores(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  // ─── updateOrganizador ─────────────────────────────────────────────────────

  it("updateOrganizador retorna 400 quando campos estão faltando", async () => {
    const req = { body: { nome: "Incompleto" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await organizadorController.updateOrganizador(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("updateOrganizador retorna 404 quando organizador não é encontrado", async () => {
    const req = { body: { ...bodyValido, id: 999 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 0 }));

    await organizadorController.updateOrganizador(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Organizador não encontrado" });
  });

  it("updateOrganizador retorna 200 quando atualização é bem-sucedida", async () => {
    const req = { body: { ...bodyValido, id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 1 }));

    await organizadorController.updateOrganizador(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Organizador atualizado com sucesso" });
  });

  // ─── deleteOrganizador ─────────────────────────────────────────────────────

  it("deleteOrganizador retorna 404 quando organizador não é encontrado", async () => {
    const req = { params: { id: "999" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 0 }));

    await organizadorController.deleteOrganizador(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Organizador não encontrado" });
  });

  it("deleteOrganizador retorna 200 quando exclusão é bem-sucedida", async () => {
    const req = { params: { id: "1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 1 }));

    await organizadorController.deleteOrganizador(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Organizador excluído com sucesso" });
  });
});
