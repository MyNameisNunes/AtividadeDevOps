const { calcularIdade, validarDataIso } = require("../../../src/domain/idade");

// meses em Date são 0-based: new Date(2026, 9, 18) = 18/10/2026
const HOJE = new Date(2026, 9, 18);

describe("validarDataIso", () => {
  it.each(["1990-05-15", "2000-02-29", "2026-12-31"])(
    "aceita a data existente %s",
    (data) => {
      expect(validarDataIso(data)).toBe(true);
    },
  );

  it.each(["2001-02-29", "2023-04-31", "1990-13-01", "1990-00-10"])(
    "rejeita a data inexistente %s",
    (data) => {
      expect(validarDataIso(data)).toBe(false);
    },
  );

  it.each(["15/05/1990", "1990-5-15", "1990-05-15T00:00:00", "", "abc"])(
    "rejeita formato diferente de AAAA-MM-DD (%s)",
    (data) => {
      expect(validarDataIso(data)).toBe(false);
    },
  );

  it.each([undefined, null, 19900515, new Date()])(
    "rejeita valores que não são texto (%p)",
    (data) => {
      expect(validarDataIso(data)).toBe(false);
    },
  );
});

describe("calcularIdade", () => {
  it("conta os anos completos quando o aniversário já passou no ano", () => {
    expect(calcularIdade("1990-05-15", HOJE)).toBe(36);
  });

  it("desconta um ano quando o aniversário ainda não chegou", () => {
    expect(calcularIdade("1990-12-25", HOJE)).toBe(35);
  });

  it("completa o ano exatamente no dia do aniversário", () => {
    expect(calcularIdade("1990-10-18", HOJE)).toBe(36);
  });

  it("ainda não completa o ano na véspera do aniversário", () => {
    expect(calcularIdade("1990-10-19", HOJE)).toBe(35);
  });

  it("retorna 0 para quem nasceu hoje", () => {
    expect(calcularIdade("2026-10-18", HOJE)).toBe(0);
  });

  it("retorna 0 para quem ainda não completou o primeiro ano", () => {
    expect(calcularIdade("2025-10-19", HOJE)).toBe(0);
  });

  describe("nascidos em 29 de fevereiro", () => {
    it("não completa o ano em 28/02 de ano não bissexto", () => {
      expect(calcularIdade("2000-02-29", new Date(2025, 1, 28))).toBe(24);
    });

    it("completa o ano em 01/03 de ano não bissexto", () => {
      expect(calcularIdade("2000-02-29", new Date(2025, 2, 1))).toBe(25);
    });

    it("completa o ano em 29/02 de ano bissexto", () => {
      expect(calcularIdade("2000-02-29", new Date(2024, 1, 29))).toBe(24);
    });
  });

  it("considera só o dia da data de referência, ignorando o horário", () => {
    const vesperaQuaseMeiaNoite = new Date(2026, 9, 17, 23, 59, 59);
    expect(calcularIdade("1990-10-18", vesperaQuaseMeiaNoite)).toBe(35);
  });

  describe("usando a data atual como referência", () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(HOJE);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("usa a data de hoje quando a referência não é informada", () => {
      expect(calcularIdade("1990-05-15")).toBe(36);
    });
  });

  it.each(["15/05/1990", "2023-02-30", "", undefined])(
    "lança erro para data de nascimento inválida (%p)",
    (data) => {
      expect(() => calcularIdade(data, HOJE)).toThrow(
        "Data de nascimento inválida",
      );
    },
  );

  it("lança erro para data de nascimento no futuro", () => {
    expect(() => calcularIdade("2026-10-19", HOJE)).toThrow(
      "Data de nascimento não pode estar no futuro",
    );
  });
});
