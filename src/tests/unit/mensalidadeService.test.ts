import PlanoRepository from "../../repositories/PlanoRepository.js";
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
    it("cria cobrança com valor histórico próprio e descarta campos extras", async () => {
        const { repository, service } = setup();
        await expect(service.create({ ...input, extra: "ignorar" })).resolves.toEqual({ id, ...input });
        expect(repository.create).toHaveBeenCalledWith(input);
    });
    it.each([0, 0.29, 129.90, 99999999.99])("aceita valor monetário válido: %s", async valor => {
        await expect(setup().service.create({ ...input, valor })).resolves.toMatchObject({ valor });
    });
    it.each([
        { alunoId: "abc" }, { competencia: "2026-11-02" }, { competencia: "2026-13-01" },
        { competencia: "0000-01-01" }, { competencia: "2026-11" },
        { valor: -1 }, { valor: Infinity }, { valor: NaN }, { valor: "129.90" }, { valor: 1.001 }, { valor: 100000000 },
        { data_vencimento: "2026-02-29" }, { data_vencimento: "2026-04-31" },
        { status: "atrasada" }, { status: "paga", data_pagamento: null },
        { status: "paga", data_pagamento: "2026-11-18" },
        { status: "paga", data_pagamento: "2026-02-30" },
        { status: "pendente", data_pagamento: "2026-11-17" },
        { status: "cancelada", data_pagamento: "2026-11-17" },
        { data_pagamento: undefined }, { id }, { created_at: "hoje" },
    ])("rejeita dados inválidos sem consultar ou gravar: %j", async alteracao => {
        const { service, repository, alunos } = setup();
        await expect(service.create({ ...input, ...alteracao })).rejects.toMatchObject({ status: 400 });
        expect(repository.create).not.toHaveBeenCalled();
        expect(alunos.findById).not.toHaveBeenCalled();
    });
    it.each([null, undefined, [], "texto", 1])("rejeita corpo inválido: %j", async body => {
        await expect(setup().service.create(body)).rejects.toMatchObject({ status: 400 });
    });
    it("aceita data real de ano bissexto", async () => {
        await expect(setup().service.create({ ...input, data_vencimento: "2028-02-29" })).resolves.toHaveProperty("id");
    });
    it("considera a data de São Paulo na virada do dia UTC", async () => {
        vi.setSystemTime(new Date("2026-11-18T01:00:00Z"));
        const { service } = setup();
        await expect(service.create({ ...input, status: "paga", data_pagamento: "2026-11-18" })).rejects.toMatchObject({ status: 400 });
        await expect(service.create({ ...input, status: "paga", data_pagamento: "2026-11-17" })).resolves.toMatchObject({ status: "paga" });
    });
    it("não cria cobrança para aluno inexistente", async () => {
        const { alunos, service, repository } = setup();
        alunos.findById.mockResolvedValue(null);
        await expect(service.create(input)).rejects.toMatchObject({ status: 400 });
        expect(repository.create).not.toHaveBeenCalled();
    });
    it("não cria cobrança para aluno inativo", async () => {
        const { alunos, service, repository } = setup();
        alunos.findById.mockResolvedValue({ ...aluno, ativo: false });
        await expect(service.create(input)).rejects.toMatchObject({ status: 409 });
        expect(repository.create).not.toHaveBeenCalled();
    });
    it.each(["pendente", "paga", "cancelada"] as const)("reserva competência inclusive quando cobrança anterior está %s", async status => {
        const { service, repository } = setup();
        repository.findByAlunoCompetencia.mockResolvedValue({ id: outroId, ...input, status });
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
    it("impede toda alteração após pagamento", async () => {
        const { repository, service } = setup();
        repository.findById.mockResolvedValue({ id, ...input, status: "paga", data_pagamento: "2026-11-16" });
        await expect(service.update(id, input)).rejects.toMatchObject({ status: 409 });
        expect(repository.update).not.toHaveBeenCalled();
    });
    it("impede transferência de cobrança para aluno inativo", async () => {
        const { repository, alunos, service } = setup();
        alunos.findById.mockResolvedValue({ ...aluno, id: outroId, ativo: false });
        await expect(service.update(id, { ...input, alunoId: outroId })).rejects.toMatchObject({ status: 409 });
        expect(repository.update).not.toHaveBeenCalled();
    });
    it("permite corrigir vínculo para aluno ativo", async () => {
        await expect(setup().service.update(id, { ...input, alunoId: outroId })).resolves.toMatchObject({ alunoId: outroId });
    });
    it("bloqueia atualização para competência já ocupada", async () => {
        const { repository, service } = setup();
        repository.findByAlunoCompetencia.mockResolvedValue({ id: outroId, ...input });
        await expect(service.update(id, input)).rejects.toMatchObject({ status: 409 });
        expect(repository.update).not.toHaveBeenCalled();
    });
    it("PUT exige corpo completo", async () => {
        await expect(setup().service.update(id, { status: "paga" })).rejects.toMatchObject({ status: 400 });
    });
    it("não atualiza registro ausente", async () => {
        const { repository, service } = setup();
        repository.findById.mockResolvedValue(null);
        await expect(service.update(id, input)).rejects.toMatchObject({ status: 404 });
        expect(repository.update).not.toHaveBeenCalled();
    });
    it("detecta exclusão concorrente durante atualização", async () => {
        const { repository, service } = setup();
        repository.update.mockResolvedValue(null);
        await expect(service.update(id, input)).rejects.toMatchObject({ status: 404 });
    });
});

describe("MensalidadeService: consultas, exclusão e falhas", () => {
    it("lista cobranças e consulta pelo UUID", async () => {
        const { service } = setup();
        await expect(service.getAll()).resolves.toEqual([{ id, ...input }]);
        await expect(service.getById(id)).resolves.toEqual({ id, ...input });
    });
    it("retorna lista vazia sem cobranças", async () => {
        const { repository, service } = setup();
        repository.findAll.mockResolvedValue([]);
        await expect(service.getAll()).resolves.toEqual([]);
    });
    it("retorna 404 para cobrança ausente", async () => {
        const { repository, service } = setup();
        repository.findById.mockResolvedValue(null);
        await expect(service.getById(id)).rejects.toMatchObject({ status: 404 });
    });
    it("rejeita UUID inválido antes de consultar, atualizar ou excluir", async () => {
        const { repository, service } = setup();
        await expect(service.getById("abc")).rejects.toMatchObject({ status: 400 });
        await expect(service.update("abc", input)).rejects.toMatchObject({ status: 400 });
        await expect(service.remove("abc")).rejects.toMatchObject({ status: 400 });
        expect(repository.findById).not.toHaveBeenCalled();
    });
    it.each(["pendente", "cancelada"] as const)("exclui cobrança %s", async status => {
        const { repository, service } = setup();
        repository.findById.mockResolvedValue({ id, ...input, status });
        await service.remove(id);
        expect(repository.remove).toHaveBeenCalledWith(id);
    });
    it("impede excluir cobrança paga", async () => {
        const { repository, service } = setup();
        repository.findById.mockResolvedValue({ id, ...input, status: "paga", data_pagamento: "2026-11-16" });
        await expect(service.remove(id)).rejects.toMatchObject({ status: 409 });
        expect(repository.remove).not.toHaveBeenCalled();
    });
    it("detecta exclusão concorrente", async () => {
        const { repository, service } = setup();
        repository.remove.mockResolvedValue(null);
        await expect(service.remove(id)).rejects.toMatchObject({ status: 404 });
    });
    it.each(["create", "update"] as const)("traduz unicidade e FK concorrentes em %s", async operation => {
        for (const [code, status] of [["23505", 409], ["23503", 400]] as const) {
            const { repository, service } = setup();
            repository[operation].mockRejectedValue(new RepositoryError(code, "Erro do banco"));
            await expect(operation === "create" ? service.create(input) : service.update(id, input)).rejects.toMatchObject({ status });
        }
    });
    it.each(["update", "remove"] as const)("traduz proteção de pagamento concorrente em %s", async operation => {
        const { repository, service } = setup();
        repository[operation].mockRejectedValue(new RepositoryError("P0001", "Paga"));
        await expect(operation === "update" ? service.update(id, input) : service.remove(id)).rejects.toMatchObject({ status: 409 });
    });
    it.each(["create", "update", "remove", "findById", "findAll"] as const)("não disfarça erro inesperado de %s como erro de negócio", async operation => {
        const { repository, service } = setup();
        const erro = new RepositoryError("08006", "Conexão indisponível");
        repository[operation].mockRejectedValue(erro);
        const result = operation === "create" ? service.create(input)
            : operation === "update" ? service.update(id, input)
            : operation === "remove" ? service.remove(id)
            : operation === "findById" ? service.getById(id) : service.getAll();
        await expect(result).rejects.toBe(erro);
    });
});

// Unit tests use a mock database connection.
vi.mock("../../config/supabase.js", () => ({ default: {} }));
afterEach(() => vi.restoreAllMocks());
