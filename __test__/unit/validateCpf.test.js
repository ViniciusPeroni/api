import { jest } from "@jest/globals";

describe("validateCpf - testes unitários", () => {
  let validateCpf;
  let connect;

  beforeEach(async () => {
    jest.resetModules();

    connect = { query: jest.fn() };
    jest.unstable_mockModule("../../src/db/connect.js", () => ({ default: connect }));

    validateCpf = (await import("../../src/services/validateCpf.js")).default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("retorna null quando CPF não está cadastrado", async () => {
    connect.query.mockImplementation((query, values, callback) =>
      callback(null, [])
    );

    const result = await validateCpf("12345678901");

    expect(result).toBeNull();
  });

  it("retorna erro quando CPF já está cadastrado (create)", async () => {
    connect.query.mockImplementation((query, values, callback) =>
      callback(null, [{ id_usuario: 1 }])
    );

    const result = await validateCpf("12345678901");

    expect(result).toEqual({ error: "CPF já cadastrado" });
  });

  it("retorna null quando CPF pertence ao mesmo usuário (update)", async () => {
    connect.query.mockImplementation((query, values, callback) =>
      callback(null, [{ id_usuario: 5 }])
    );

    const result = await validateCpf("12345678901", 5);

    expect(result).toBeNull();
  });

  it("retorna erro quando CPF pertence a outro usuário (update)", async () => {
    connect.query.mockImplementation((query, values, callback) =>
      callback(null, [{ id_usuario: 99 }])
    );

    const result = await validateCpf("12345678901", 5);

    expect(result).toEqual({ error: "CPF já cadastrado para outro usuário" });
  });

  it("rejeita a promise quando ocorre erro no banco", async () => {
    connect.query.mockImplementation((query, values, callback) =>
      callback(new Error("DB error"), null)
    );

    await expect(validateCpf("12345678901")).rejects.toMatch("Erro ao verificar CPF");
  });
});
