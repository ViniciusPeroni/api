import { jest } from "@jest/globals";

describe("verifyJWT - testes unitários (middleware)", () => {
  let verifyJWT;
  let jwt;

  beforeEach(async () => {
    jest.resetModules();

    jwt = {
      verify: jest.fn(),
    };

    jest.unstable_mockModule("jsonwebtoken", () => ({ default: jwt }));

    verifyJWT = (await import("../../src/services/verifyJWT.js")).default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("retorna 401 quando o header authorization não é fornecido", () => {
    const req = { headers: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    verifyJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      auth: false,
      message: "Token não foi fornecido",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("retorna 403 quando o token é inválido", () => {
    jwt.verify.mockImplementation((token, secret, callback) =>
      callback(new Error("invalid token"), null)
    );

    const req = { headers: { authorization: "token-invalido" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    verifyJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      auth: false,
      message: "Falha na autenticação do Token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("chama next() e define req.userId quando o token é válido", () => {
    jwt.verify.mockImplementation((token, secret, callback) =>
      callback(null, { id: 42 })
    );

    const req = { headers: { authorization: "token-valido" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    verifyJWT(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toBe(42);
    expect(res.status).not.toHaveBeenCalled();
  });
});
