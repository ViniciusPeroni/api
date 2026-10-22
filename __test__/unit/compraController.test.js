import { jest } from "@jest/globals";

/**
 * compraController - testes unitários
 *
 * NOTA: O compraController possui um bug estrutural identificado:
 * usa `const [rows] = connect.query(...)` como se fosse uma função síncrona
 * que retorna um array (padrão mysql2/promise), mas `connect` é um pool
 * callback-based (mysql2). Os testes abaixo documentam o comportamento
 * atual e expõem os caminhos de falha sem alterar o código fonte.
 */
describe("compraController - testes unitários", () => {
  let compraController;
  let connect;

  beforeEach(async () => {
    jest.resetModules();

    connect = { query: jest.fn() };
    jest.unstable_mockModule("../../src/db/connect.js", () => ({ default: connect }));

    compraController = (
      await import("../../src/controllers/compraController.js")
    ).default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("createCompra retorna 400 quando data_compra está faltando", async () => {
    const req = {
      body: {
        id_usuario: 1,
        ingressos: [{ id_ingresso: 1, quantidade: 2 }],
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await compraController.createCompra(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Dados inválidos. Verifique os parâmetros enviados.",
    });
  });

  it("createCompra retorna 400 quando ingressos é um array vazio", async () => {
    const req = {
      body: {
        data_compra: "2025-12-01",
        id_usuario: 1,
        ingressos: [],
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await compraController.createCompra(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Dados inválidos. Verifique os parâmetros enviados.",
    });
  });

  it("createCompra retorna 400 quando ingressos não é um array", async () => {
    const req = {
      body: {
        data_compra: "2025-12-01",
        id_usuario: 1,
        ingressos: "nao-e-array",
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await compraController.createCompra(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("createCompra retorna 500 quando ocorre erro interno (bug: query não retorna promise)", async () => {
    /**
     * O controller tenta `const [rows] = connect.query(...)` mas connect.query
     * não retorna valor (é callback-based). Isso gera TypeError ao tentar
     * fazer destructuring de undefined. O teste documenta esse comportamento.
     */
    const req = {
      body: {
        data_compra: "2025-12-01",
        id_usuario: 1,
        ingressos: [{ id_ingresso: 1, quantidade: 1 }],
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    // connect.query retorna undefined (comportamento real do mock sem implementação)
    connect.query.mockReturnValue(undefined);

    await compraController.createCompra(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Erro ao realizar compra." })
    );
  });
});
