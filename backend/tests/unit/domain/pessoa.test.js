const {
  validarPessoa,
  normalizarPessoa,
} = require("../../../src/domain/pessoa");

const HOJE = new Date(2026, 9, 18);

const pessoaValida = (sobrescrever = {}) => ({
  cpf: "529.982.247-25",
  nome: "Maria da Silva",
  dataNascimento: "1990-05-15",
  ...sobrescrever,
});

describe("validarPessoa", () => {
  it("não retorna erros para uma pessoa válida", () => {
    expect(validarPessoa(pessoaValida(), HOJE)).toEqual({});
  });

  it("exige todos os campos", () => {
    expect(validarPessoa({}, HOJE)).toEqual({
      cpf: "CPF é obrigatório",
      nome: "Nome é obrigatório",
      dataNascimento: "Data de nascimento é obrigatória",
    });
  });

  it.each([null, undefined, "texto", ["a"]])(
    "trata dados que não são objeto como vazios (%p)",
    (dados) => {
      expect(Object.keys(validarPessoa(dados, HOJE))).toEqual([
        "cpf",
        "nome",
        "dataNascimento",
      ]);
    },
  );

  describe("CPF", () => {
    it("rejeita CPF inválido", () => {
      expect(
        validarPessoa(pessoaValida({ cpf: "123.456.789-00" }), HOJE),
      ).toEqual({ cpf: "CPF inválido" });
    });

    it("trata CPF só com espaços como ausente", () => {
      expect(validarPessoa(pessoaValida({ cpf: "   " }), HOJE)).toEqual({
        cpf: "CPF é obrigatório",
      });
    });
  });

  describe("nome completo", () => {
    it.each([
      "Maria da Silva",
      "José D'Ávila",
      "Ana-Clara Souza",
      "João Pedro Jr.",
      "  Maria   Silva  ",
    ])("aceita %p", (nome) => {
      expect(validarPessoa(pessoaValida({ nome }), HOJE)).toEqual({});
    });

    it("trata nome só com espaços como ausente", () => {
      expect(validarPessoa(pessoaValida({ nome: "   " }), HOJE)).toEqual({
        nome: "Nome é obrigatório",
      });
    });

    it("exige nome e sobrenome", () => {
      expect(validarPessoa(pessoaValida({ nome: "Maria" }), HOJE)).toEqual({
        nome: "Informe o nome completo (nome e sobrenome)",
      });
    });

    it.each(["Maria 123", "Maria <script>", "Maria_Silva Souza", "- Silva"])(
      "rejeita caracteres que não são letras (%p)",
      (nome) => {
        expect(validarPessoa(pessoaValida({ nome }), HOJE)).toEqual({
          nome: "Nome deve conter apenas letras",
        });
      },
    );

    it("rejeita nome com mais de 100 caracteres", () => {
      const nome = `Maria ${"a".repeat(100)}`;
      expect(validarPessoa(pessoaValida({ nome }), HOJE)).toEqual({
        nome: "Nome deve ter no máximo 100 caracteres",
      });
    });

    it("rejeita nome que não é texto", () => {
      expect(validarPessoa(pessoaValida({ nome: 42 }), HOJE)).toEqual({
        nome: "Nome é obrigatório",
      });
    });
  });

  describe("data de nascimento", () => {
    it("rejeita data em formato inválido", () => {
      expect(
        validarPessoa(pessoaValida({ dataNascimento: "15/05/1990" }), HOJE),
      ).toEqual({
        dataNascimento: "Data de nascimento inválida (use AAAA-MM-DD)",
      });
    });

    it("rejeita data no futuro", () => {
      expect(
        validarPessoa(pessoaValida({ dataNascimento: "2026-10-19" }), HOJE),
      ).toEqual({
        dataNascimento: "Data de nascimento não pode estar no futuro",
      });
    });

    it("aceita quem nasceu hoje", () => {
      expect(
        validarPessoa(pessoaValida({ dataNascimento: "2026-10-18" }), HOJE),
      ).toEqual({});
    });

    it("aceita idade de até 130 anos (completa 131 amanhã)", () => {
      expect(
        validarPessoa(pessoaValida({ dataNascimento: "1895-10-19" }), HOJE),
      ).toEqual({});
    });

    it("rejeita idade acima de 130 anos (completou 131 hoje)", () => {
      expect(
        validarPessoa(pessoaValida({ dataNascimento: "1895-10-18" }), HOJE),
      ).toEqual({
        dataNascimento: "Idade não pode ser superior a 130 anos",
      });
    });
  });

  it("acumula erros de vários campos", () => {
    const erros = validarPessoa(
      { cpf: "111", nome: "Ana", dataNascimento: "2030-01-01" },
      HOJE,
    );
    expect(Object.keys(erros)).toEqual(["cpf", "nome", "dataNascimento"]);
  });

  it("usa a data atual quando a referência não é informada", () => {
    jest.useFakeTimers().setSystemTime(HOJE);
    try {
      expect(
        validarPessoa(pessoaValida({ dataNascimento: "2026-10-19" })),
      ).toHaveProperty("dataNascimento");
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("normalizarPessoa", () => {
  it("guarda o CPF só com dígitos, remove espaços extras do nome e mantém a data", () => {
    expect(
      normalizarPessoa({
        cpf: " 529.982.247-25 ",
        nome: "  Maria   da  Silva ",
        dataNascimento: "1990-05-15",
        campoExtra: "ignorado",
      }),
    ).toEqual({
      cpf: "52998224725",
      nome: "Maria da Silva",
      dataNascimento: "1990-05-15",
    });
  });
});
