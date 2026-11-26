import PlanoRepository from "../../repositories/PlanoRepository.js";
import AlunoRepository from "../../repositories/AlunoRepository.js";
import MensalidadeRepository from "../../repositories/MensalidadeRepository.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PlanoService from "../../services/PlanoService.js";
import AlunoService from "../../services/AlunoService.js";

const id = "11111111-1111-4111-8111-111111111111";
const outroId = "22222222-2222-4222-8222-222222222222";
const planoInput = { nome: "Musculação", descricao: "Treino", icon: "💪", ordem_exibicao: 1, valor_mensal: 120, duracao_meses: 12, ativo: true };
const alunoInput = { nome: "Eduardo", descricao: "Aluno", planoId: id, email: "eduardo@example.com", telefone: "41999991111", data_nascimento: "2000-01-01", valor_mensalidade: 100, ativo: true };

function fixtures() {
    const planos = {
        findAll: vi.spyOn(PlanoRepository, "findAll").mockResolvedValue([{ id, ...planoInput }]),
        findById: vi.spyOn(PlanoRepository, "findById").mockResolvedValue({ id, ...planoInput }),
        create: vi.spyOn(PlanoRepository, "create").mockResolvedValue({ id, ...planoInput }),
        update: vi.spyOn(PlanoRepository, "update").mockResolvedValue({ id, ...planoInput }),
        remove: vi.spyOn(PlanoRepository, "remove").mockResolvedValue({ id, ...planoInput }),
        searchByKeyword: vi.spyOn(PlanoRepository, "searchByKeyword").mockResolvedValue([]),
    };
    const alunos = {
        findAll: vi.spyOn(AlunoRepository, "findAll").mockResolvedValue([{ id, ...alunoInput }]),
        findById: vi.spyOn(AlunoRepository, "findById").mockResolvedValue({ id, ...alunoInput }),
        create: vi.spyOn(AlunoRepository, "create").mockResolvedValue({ id, ...alunoInput }),
        update: vi.spyOn(AlunoRepository, "update").mockResolvedValue({ id, ...alunoInput }),
        remove: vi.spyOn(AlunoRepository, "remove").mockResolvedValue({ id, ...alunoInput }),
        searchByKeyword: vi.spyOn(AlunoRepository, "searchByKeyword").mockResolvedValue([]),
        findByPlano: vi.spyOn(AlunoRepository, "findByPlano").mockResolvedValue([]),
        existsByPlano: vi.spyOn(AlunoRepository, "existsByPlano").mockResolvedValue(false),
    };
    const mensalidades = { existsByAluno: vi.spyOn(MensalidadeRepository, "existsByAluno").mockResolvedValue(false) };
    return { planos, alunos, mensalidades, planoService: new PlanoService(), alunoService: new AlunoService() };
}

describe("PlanoService", () => {

    it.each([{ valor_mensal: -1 }, { duracao_meses: 0 }, { ativo: "true" }, { nome: " " }])("rejeita entrada inválida sem gravar: %j", async (alteracao) => {
        const { planos, planoService } = fixtures();
        await expect(planoService.create({ ...planoInput, ...alteracao })).rejects.toMatchObject({ status: 400 });
        expect(planos.create).not.toHaveBeenCalled();
    });
    it.each([null])("rejeita corpo que não é objeto: %j", async (input) => {
        await expect(fixtures().planoService.create(input)).rejects.toMatchObject({ status: 400 });
    });

});

describe("AlunoService", () => {

    beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-12T12:00:00Z")); });
    afterEach(() => { vi.useRealTimers(); });

    it.each([{ email: "abc" }, { telefone: "abc" }, { data_nascimento: "2001-02-29" }, { valor_mensalidade: -1 }])("rejeita aluno inválido sem gravar: %j", async (alteracao) => {
        const { alunos, alunoService } = fixtures();
        await expect(alunoService.create({ ...alunoInput, ...alteracao })).rejects.toMatchObject({ status: 400 });
        expect(alunos.create).not.toHaveBeenCalled();
    });

    it("rejeita nova adesão a plano inativo", async () => {
        const { planos, alunos, alunoService } = fixtures();
        planos.findById.mockResolvedValue({ id, ...planoInput, ativo: false });
        await expect(alunoService.create(alunoInput)).rejects.toMatchObject({ status: 409 });
        expect(alunos.create).not.toHaveBeenCalled();
    });
    it("permite editar aluno mantendo plano que foi desativado", async () => {
        const { planos, alunos, alunoService } = fixtures();
        planos.findById.mockResolvedValue({ id, ...planoInput, ativo: false });
        await alunoService.update(id, { ...alunoInput, nome: "Nome atualizado" });
        expect(alunos.update).toHaveBeenCalledWith(id, { ...alunoInput, nome: "Nome atualizado" });
    });
    it("bloqueia transferência para plano inativo", async () => {
        const { planos, alunos, alunoService } = fixtures();
        planos.findById.mockResolvedValue({ id: outroId, ...planoInput, ativo: false });
        await expect(alunoService.update(id, { ...alunoInput, planoId: outroId })).rejects.toMatchObject({ status: 409 });
        expect(alunos.update).not.toHaveBeenCalled();
    });

});

describe.each(["plano", "aluno"] as const)("comportamentos comuns: %s", (entity) => {
    function setup() {
        const f = fixtures();
        return entity === "plano" ? { service: f.planoService, repository: f.planos } : { service: f.alunoService, repository: f.alunos };
    }

    it.each([" ", "a,b"])("rejeita pesquisa inválida: %j", (keyword) => {
        const { service, repository } = setup();
        expect(() => service.getByKeyword(keyword)).toThrow();
        expect(repository.searchByKeyword).not.toHaveBeenCalled();
    });

});

// Unit tests use a mock database connection.
vi.mock("../../config/supabase.js", () => ({ default: {} }));
afterEach(() => vi.restoreAllMocks());
