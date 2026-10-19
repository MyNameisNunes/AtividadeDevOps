const {
  limparCpf,
  validarCpf,
  formatarCpf,
} = require("../../../src/domain/cpf");

describe("limparCpf", () => {
  it("remove pontos e traço, mantendo apenas os dígitos", () => {
    expect(limparCpf("529.982.247-25")).toBe("52998224725");
  });

  it("remove espaços nas extremidades", () => {
    expect(limparCpf("  52998224725  ")).toBe("52998224725");
  });

  it("retorna string vazia para valores que não são texto", () => {
    expect(limparCpf(undefined)).toBe("");
    expect(limparCpf(null)).toBe("");
    expect(limparCpf(52998224725)).toBe("");
  });
});

describe("validarCpf", () => {
  it.each([
    "529.982.247-25",
    "52998224725",
    "111.444.777-35",
    "000.000.001-91",
  ])("aceita o CPF válido %s", (cpf) => {
    expect(validarCpf(cpf)).toBe(true);
  });

  it("aceita CPF cujo resto do cálculo é 10 (dígito vira 0)", () => {
    // 123.456.789: soma ponderada = 210 -> (210 * 10) % 11 = 10 -> dígito 0
    expect(validarCpf("123.456.789-09")).toBe(true);
  });

  it("rejeita CPF com o primeiro dígito verificador errado", () => {
    expect(validarCpf("529.982.247-35")).toBe(false);
  });

  it("rejeita CPF com o segundo dígito verificador errado", () => {
    expect(validarCpf("529.982.247-26")).toBe(false);
  });

  it.each(["000.000.000-00", "111.111.111-11", "999.999.999-99"])(
    "rejeita CPF com todos os dígitos iguais (%s)",
    (cpf) => {
      expect(validarCpf(cpf)).toBe(false);
    },
  );

  it.each(["5299822472", "529982247250", "529.982.247-2"])(
    "rejeita CPF com quantidade de dígitos diferente de 11 (%s)",
    (cpf) => {
      expect(validarCpf(cpf)).toBe(false);
    },
  );

  it.each(["529.982.247-2a", "abc52998224725", "529 982 247 25"])(
    "rejeita CPF com caracteres fora do formato (%s)",
    (cpf) => {
      expect(validarCpf(cpf)).toBe(false);
    },
  );

  it.each([undefined, null, "", 52998224725, {}])(
    "rejeita valores vazios ou que não são texto (%p)",
    (cpf) => {
      expect(validarCpf(cpf)).toBe(false);
    },
  );
});

describe("formatarCpf", () => {
  it("aplica a máscara 000.000.000-00", () => {
    expect(formatarCpf("52998224725")).toBe("529.982.247-25");
  });

  it("normaliza um CPF já formatado", () => {
    expect(formatarCpf("529.982.247-25")).toBe("529.982.247-25");
  });
});
