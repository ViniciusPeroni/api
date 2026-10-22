import validateUser from "../../src/services/validateUser.js";

describe("validateUser - testes unitários", () => {
  const usuarioValido = {
    cpf: "12345678901",
    email: "aluno@senai.br",
    password: "123",
    name: "Aluno",
    data_nascimento: "2005-05-10",
  };

  it("retorna null quando todos os dados são válidos", () => {
    expect(validateUser(usuarioValido)).toBeNull();
  });

  it("retorna erro quando falta algum campo obrigatório (data_nascimento)", () => {
    const { data_nascimento, ...semData } = usuarioValido;

    expect(validateUser(semData)).toEqual({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  it("retorna erro quando o CPF tem menos de 11 dígitos", () => {
    expect(validateUser({ ...usuarioValido, cpf: "123" })).toEqual({
      error: "CPF inválido. Deve conter exatamente 11 dígitos numéricos",
    });
  });

  it("retorna erro quando o CPF tem mais de 11 dígitos", () => {
    expect(validateUser({ ...usuarioValido, cpf: "123456789012" })).toEqual({
      error: "CPF inválido. Deve conter exatamente 11 dígitos numéricos",
    });
  });

  it("retorna erro quando o CPF contém letras", () => {
    expect(validateUser({ ...usuarioValido, cpf: "1234567890A" })).toEqual({
      error: "CPF inválido. Deve conter exatamente 11 dígitos numéricos",
    });
  });

  it("retorna erro quando o email não contém @", () => {
    expect(validateUser({ ...usuarioValido, email: "aluno.senai.br" })).toEqual({
      error: "Email inválido. Deve conter @",
    });
  });

  it("aceita email com @ mesmo sem domínio completo", () => {
    expect(validateUser({ ...usuarioValido, email: "aluno@" })).toBeNull();
  });

  it.each([
    ["password", ""],
    ["name", ""],
    ["data_nascimento", ""],
  ])("retorna erro quando %s está vazio", (campo, valor) => {
    expect(validateUser({ ...usuarioValido, [campo]: valor })).toEqual({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  it("aceita password quando contém apenas espaços pois a API não aplica trim", () => {
    // A validação atual verifica apenas `!password` (truthiness) sem .trim()
    expect(validateUser({ ...usuarioValido, password: "   " })).toBeNull();
  });

  it("retorna erro quando CPF tem pontos e hífen (formatado, 14 chars)", () => {
    expect(validateUser({ ...usuarioValido, cpf: "123.456.789-01" })).toEqual({
      error: "CPF inválido. Deve conter exatamente 11 dígitos numéricos",
    });
  });

  it("retorna erro quando cpf é undefined", () => {
    const { cpf, ...semCpf } = usuarioValido;
    expect(validateUser(semCpf)).toEqual({
      error: "Todos os campos devem ser preenchidos",
    });
  });
});
