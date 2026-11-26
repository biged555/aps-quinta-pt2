import AlunoRepository from "../../repositories/AlunoRepository.js";
import MensalidadeRepository from "../../repositories/MensalidadeRepository.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MensalidadeService from "../../services/MensalidadeService.js";
import type { MensalidadeInput } from "../../model/Mensalidade.js";
import { RepositoryError } from "../../errors/AppError.js";

const id = "11111111-1111-4111-8111-111111111111";
const alunoId = "22222222-2222-4222-8222-222222222222";
const outroId = "33333333-3333-4333-8333-333333333333";
const input: MensalidadeInput = {
    alunoId, competencia: "2026-11-01", valor: 129.90,
    data_vencimento: "2026-11-10", data_pagamento: null, status: "pendente",
};
const aluno = {
    id: alunoId, planoId: outroId, nome: "Aluno", descricao: "Teste", email: "aluno@example.com",
    telefone: "41999999999", data_nascimento: "2000-01-01", valor_mensalidade: 150, ativo: true,
};

function setup() {
    const repository = {
        findAll: vi.spyOn(MensalidadeRepository, "findAll").mockResolvedValue([{ id, ...input }]),
        findById: vi.spyOn(MensalidadeRepository, "findById").mockResolvedValue({ id, ...input }),
        findByAlunoCompetencia: vi.spyOn(MensalidadeRepository, "findByAlunoCompetencia").mockResolvedValue(null),
        existsByAluno: vi.spyOn(MensalidadeRepository, "existsByAluno").mockResolvedValue(false),
        create: vi.spyOn(MensalidadeRepository, "create").mockImplementation(async data => ({ id, ...data })),
        update: vi.spyOn(MensalidadeRepository, "update").mockImplementation(async (uuid, data) => ({ id: uuid, ...data })),
        remove: vi.spyOn(MensalidadeRepository, "remove").mockResolvedValue({ id, ...input }),
    };
    const alunos = { findById: vi.spyOn(AlunoRepository, "findById").mockResolvedValue(aluno) };
    return { repository, alunos, service: new MensalidadeService() };
}

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-17T12:00:00Z")); });
afterEach(() => vi.useRealTimers());

describe("MensalidadeService: criação e validação", () => {

    it.each([
        { alunoId: "abc" }, { competencia: "2026-11-02" }, { valor: -1 },
        { data_vencimento: "2026-02-29" }, { status: "atrasada" },
        { status: "paga", data_pagamento: null }, { data_pagamento: "2026-11-17" },
    ])("rejeita dados inválidos sem consultar ou gravar: %j", async alteracao => {
        const { service, repository, alunos } = setup();
        await expect(service.create({ ...input, ...alteracao })).rejects.toMatchObject({ status: 400 });
        expect(repository.create).not.toHaveBeenCalled();
        expect(alunos.findById).not.toHaveBeenCalled();
    });
    it.each([null])("rejeita corpo inválido: %j", async body => {
        await expect(setup().service.create(body)).rejects.toMatchObject({ status: 400 });
    });

    it("considera a data de São Paulo na virada do dia UTC", async () => {
        vi.setSystemTime(new Date("2026-11-18T01:00:00Z"));
        const { service } = setup();
        await expect(service.create({ ...input, status: "paga", data_pagamento: "2026-11-18" })).rejects.toMatchObject({ status: 400 });
        await expect(service.create({ ...input, status: "paga", data_pagamento: "2026-11-17" })).resolves.toMatchObject({ status: "paga" });
    });

    it("não cria cobrança para aluno inativo", async () => {
        const { alunos, service, repository } = setup();
        alunos.findById.mockResolvedValue({ ...aluno, ativo: false });
        await expect(service.create(input)).rejects.toMatchObject({ status: 409 });
        expect(repository.create).not.toHaveBeenCalled();
    });

});

describe("MensalidadeService: atualização e pagamento", () => {
    it("registra pagamento pelo PUT, inclusive para aluno posteriormente inativado", async () => {
        const { service, alunos, repository } = setup();
        alunos.findById.mockResolvedValue({ ...aluno, ativo: false });
        repository.findByAlunoCompetencia.mockResolvedValue({ id, ...input });
        const dados = { ...input, status: "paga", data_pagamento: "2026-11-17" };
        await expect(service.update(id, dados)).resolves.toMatchObject(dados);
        expect(repository.update).toHaveBeenCalledWith(id, dados);
    });
    it("cancela cobrança pendente", async () => {
        await expect(setup().service.update(id, { ...input, status: "cancelada" })).resolves.toMatchObject({ status: "cancelada", data_pagamento: null });
    });

    it("impede transferência de cobrança para aluno inativo", async () => {
        const { repository, alunos, service } = setup();
        alunos.findById.mockResolvedValue({ ...aluno, id: outroId, ativo: false });
        await expect(service.update(id, { ...input, alunoId: outroId })).rejects.toMatchObject({ status: 409 });
        expect(repository.update).not.toHaveBeenCalled();
    });

    it("bloqueia atualização para competência já ocupada", async () => {
        const { repository, service } = setup();
        repository.findByAlunoCompetencia.mockResolvedValue({ id: outroId, ...input });
        await expect(service.update(id, input)).rejects.toMatchObject({ status: 409 });
        expect(repository.update).not.toHaveBeenCalled();
    });

});

describe("MensalidadeService: consultas, exclusão e falhas", () => {

    it.each(["create"] as const)("traduz unicidade e FK concorrentes em %s", async operation => {
        for (const [code, status] of [["23505", 409], ["23503", 400]] as const) {
            const { repository, service } = setup();
            repository[operation].mockRejectedValue(new RepositoryError(code, "Erro do banco"));
            await expect(operation === "create" ? service.create(input) : service.update(id, input)).rejects.toMatchObject({ status });
        }
    });
    it.each(["update"] as const)("traduz proteção de pagamento concorrente em %s", async operation => {
        const { repository, service } = setup();
        repository[operation].mockRejectedValue(new RepositoryError("P0001", "Paga"));
        await expect(operation === "update" ? service.update(id, input) : service.remove(id)).rejects.toMatchObject({ status: 409 });
    });

});

// Unit tests use a mock database connection.
vi.mock("../../config/supabase.js", () => ({ default: {} }));
afterEach(() => vi.restoreAllMocks());
