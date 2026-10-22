import { jest } from "@jest/globals";

describe("userController - testes unitários", () => {
  let userController;
  let connect;
  let bcrypt;
  let jwt;
  let validateUser;
  let validateCpf;

  beforeEach(async () => {
    jest.resetModules();

    connect = { query: jest.fn() };
    bcrypt = {
      hash: jest.fn(async () => "hashed-password"),
      compareSync: jest.fn(() => true),
    };
    jwt = {
      sign: jest.fn(() => "fake-token"),
    };
    validateUser = jest.fn(() => null);
    validateCpf = jest.fn(async () => null);

    jest.unstable_mockModule("../../src/db/connect.js", () => ({ default: connect }));
    jest.unstable_mockModule("bcrypt", () => ({ default: bcrypt }));
    jest.unstable_mockModule("jsonwebtoken", () => ({ default: jwt }));
    jest.unstable_mockModule("../../src/services/validateUser.js", () => ({ default: validateUser }));
    jest.unstable_mockModule("../../src/services/validateCpf.js", () => ({ default: validateCpf }));

    userController = (await import("../../src/controllers/userController.js")).default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── createUser ────────────────────────────────────────────────────────────

  it("createUser retorna 400 quando a validação de campos falha", async () => {
    validateUser.mockReturnValue({ error: "Todos os campos devem ser preenchidos" });

    const req = { body: { cpf: "123" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await userController.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Todos os campos devem ser preenchidos" });
  });

  it("createUser retorna 400 quando CPF já está cadastrado", async () => {
    validateCpf.mockResolvedValue({ error: "CPF já cadastrado" });

    const req = {
      body: {
        cpf: "12345678901",
        email: "aluno@senai.br",
        password: "123",
        name: "Aluno",
        data_nascimento: "2005-05-10",
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await userController.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "CPF já cadastrado" });
  });

  it("createUser retorna 400 quando email já está cadastrado (ER_DUP_ENTRY)", async () => {
    const req = {
      body: {
        cpf: "12345678901",
        email: "duplicado@senai.br",
        password: "123",
        name: "Aluno",
        data_nascimento: "2005-05-10",
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    const dbErr = { code: "ER_DUP_ENTRY", message: "Duplicate entry for key email" };
    connect.query.mockImplementation((q, v, cb) => cb(dbErr));

    await userController.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Email já cadastrado" });
  });

  it("createUser cria o usuário com sucesso e retorna 201", async () => {
    const req = {
      body: {
        cpf: "12345678901",
        email: "aluno@senai.br",
        password: "123",
        name: "Aluno",
        data_nascimento: "2005-05-10",
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null, { insertId: 1 }));

    await userController.createUser(req, res);

    expect(validateCpf).toHaveBeenCalledWith("12345678901");
    expect(bcrypt.hash).toHaveBeenCalledWith("123", 10);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: "Usuário criado com sucesso" });
  });

  // ─── getAllUsers ────────────────────────────────────────────────────────────

  it("getAllUsers retorna 200 com lista de usuários", async () => {
    const fakeUsers = [{ id_usuario: 1, name: "Aluno", email: "aluno@senai.br" }];
    connect.query.mockImplementation((q, cb) => cb(null, fakeUsers));

    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await userController.getAllUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Obtendo todos os usuários",
      users: fakeUsers,
    });
  });

  it("getAllUsers retorna 500 quando ocorre erro no banco", async () => {
    connect.query.mockImplementation((q, cb) => cb(new Error("DB error"), null));

    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await userController.getAllUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  // ─── updateUser ────────────────────────────────────────────────────────────

  it("updateUser retorna 400 quando a validação falha", async () => {
    validateUser.mockReturnValue({ error: "Todos os campos devem ser preenchidos" });

    const req = { body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await userController.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("updateUser retorna 404 quando usuário não é encontrado", async () => {
    const req = {
      body: {
        id: 999,
        cpf: "12345678901",
        email: "aluno@senai.br",
        password: "123",
        name: "Aluno",
        data_nascimento: "2005-05-10",
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 0 }));

    await userController.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Usuário não encontrado" });
  });

  it("updateUser retorna 200 quando atualização é bem-sucedida", async () => {
    const req = {
      body: {
        id: 1,
        cpf: "12345678901",
        email: "aluno@senai.br",
        password: "123",
        name: "Aluno",
        data_nascimento: "2005-05-10",
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 1 }));

    await userController.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Usuário atualizado com sucesso" });
  });

  // ─── deleteUser ────────────────────────────────────────────────────────────

  it("deleteUser retorna 200 quando usuário é excluído com sucesso", async () => {
    const req = { params: { id: "1" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 1 }));

    await userController.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Usuário excluído com ID: 1" });
  });

  it("deleteUser retorna 404 quando usuário não é encontrado", async () => {
    const req = { params: { id: "999" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 0 }));

    await userController.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Usuário não encontrado" });
  });

  // ─── loginUser ─────────────────────────────────────────────────────────────

  it("loginUser retorna 400 quando email ou senha não são fornecidos", async () => {
    const req = { body: { email: "aluno@senai.br" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await userController.loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Email e senha são obrigatórios" });
  });

  it("loginUser retorna 401 quando usuário não é encontrado", async () => {
    connect.query.mockImplementation((q, v, cb) => cb(null, []));

    const req = { body: { email: "inexistente@senai.br", password: "123" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await userController.loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Usuário não encontrado" });
  });

  it("loginUser retorna 401 quando a senha está incorreta", async () => {
    bcrypt.compareSync.mockReturnValue(false);
    connect.query.mockImplementation((q, v, cb) =>
      cb(null, [{ id_usuario: 1, email: "aluno@senai.br", password: "hashed" }])
    );

    const req = { body: { email: "aluno@senai.br", password: "senha-errada" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await userController.loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Senha incorreta" });
  });

  it("loginUser retorna 200 com token quando as credenciais são válidas", async () => {
    connect.query.mockImplementation((q, v, cb) =>
      cb(null, [
        {
          id_usuario: 5,
          email: "aluno@senai.br",
          password: "hashed-password",
          name: "Aluno",
          data_nascimento: "2005-05-10",
        },
      ])
    );

    const req = { body: { email: "aluno@senai.br", password: "123" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await userController.loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 5 },
      "test_secret_key_for_jest",
      { expiresIn: "60s" }
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Login bem-sucedido",
        token: "fake-token",
      })
    );
  });
});
