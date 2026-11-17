import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PlanoService from "../../services/PlanoService.js";
import AlunoService from "../../services/AlunoService.js";
import type { IPlanoRepository } from "../../repositories/IPlanoRepository.js";
import type { IAlunoRepository } from "../../repositories/IAlunoRepository.js";
import { RepositoryError } from "../../errors/AppError.js";

const id = "11111111-1111-4111-8111-111111111111";
const outroId = "22222222-2222-4222-8222-222222222222";
const planoInput = { nome: "Musculação", descricao: "Treino", icon: "💪", ordem_exibicao: 1, valor_mensal: 120, duracao_meses: 12, ativo: true };
const alunoInput = { nome: "Eduardo", descricao: "Aluno", planoId: id, email: "eduardo@example.com", telefone: "41999991111", data_nascimento: "2000-01-01", valor_mensalidade: 100, ativo: true };

function fixtures() {
    const planos = {
        findAll: vi.fn<IPlanoRepository["findAll"]>().mockResolvedValue([{ id, ...planoInput }]),
        findById: vi.fn<IPlanoRepository["findById"]>().mockResolvedValue({ id, ...planoInput }),
        create: vi.fn<IPlanoRepository["create"]>().mockResolvedValue({ id, ...planoInput }),
        update: vi.fn<IPlanoRepository["update"]>().mockResolvedValue({ id, ...planoInput }),
        remove: vi.fn<IPlanoRepository["remove"]>().mockResolvedValue({ id, ...planoInput }),
        searchByKeyword: vi.fn<IPlanoRepository["searchByKeyword"]>().mockResolvedValue([]),
    };
    const alunos = {
        findAll: vi.fn<IAlunoRepository["findAll"]>().mockResolvedValue([{ id, ...alunoInput }]),
        findById: vi.fn<IAlunoRepository["findById"]>().mockResolvedValue({ id, ...alunoInput }),
        create: vi.fn<IAlunoRepository["create"]>().mockResolvedValue({ id, ...alunoInput }),
        update: vi.fn<IAlunoRepository["update"]>().mockResolvedValue({ id, ...alunoInput }),
        remove: vi.fn<IAlunoRepository["remove"]>().mockResolvedValue({ id, ...alunoInput }),
        searchByKeyword: vi.fn<IAlunoRepository["searchByKeyword"]>().mockResolvedValue([]),
        findByPlano: vi.fn<IAlunoRepository["findByPlano"]>().mockResolvedValue([]),
        existsByPlano: vi.fn<IAlunoRepository["existsByPlano"]>().mockResolvedValue(false),
    };
    const mensalidades = { existsByAluno: vi.fn().mockResolvedValue(false) };
    return { planos, alunos, mensalidades, planoService: new PlanoService(planos, alunos), alunoService: new AlunoService(alunos, planos, mensalidades) };
}

describe("PlanoService", () => {
    it("cria plano e envia somente campos editáveis ao repository", async () => {
        const { planos, planoService } = fixtures();
        await expect(planoService.create({ ...planoInput, extra: "ignorar" })).resolves.toMatchObject({ id });
        expect(planos.create).toHaveBeenCalledWith(planoInput);
    });
    it.each([{ valor_mensal: -1 }, { valor_mensal: Infinity }, { duracao_meses: 0 }, { duracao_meses: 1.5 }, { ordem_exibicao: -1 }, { ativo: "true" }, { nome: " " }, { id }, { created_at: "hoje" }])("rejeita entrada inválida sem gravar: %j", async (alteracao) => {
        const { planos, planoService } = fixtures();
        await expect(planoService.create({ ...planoInput, ...alteracao })).rejects.toMatchObject({ status: 400 });
        expect(planos.create).not.toHaveBeenCalled();
    });
    it.each([null, [], "texto", 1])("rejeita corpo que não é objeto: %j", async (input) => {
        await expect(fixtures().planoService.create(input)).rejects.toMatchObject({ status: 400 });
    });
    it("bloqueia exclusão de plano com alunos", async () => {
        const { alunos, planos, planoService } = fixtures();
        alunos.existsByPlano.mockResolvedValue(true);
        await expect(planoService.remove(id)).rejects.toMatchObject({ status: 409 });
        expect(planos.remove).not.toHaveBeenCalled();
    });
    it("trata conflito da FK se um vínculo surgir durante a exclusão", async () => {
        const { planos, planoService } = fixtures();
        planos.remove.mockRejectedValue(new RepositoryError("23503", "FK"));
        await expect(planoService.remove(id)).rejects.toMatchObject({ status: 409 });
    });
    it("exclui plano sem alunos", async () => {
        const { planos, planoService } = fixtures();
        await planoService.remove(id);
        expect(planos.remove).toHaveBeenCalledWith(id);
    });
    it("atualiza plano existente", async () => {
        const { planos, planoService } = fixtures();
        await planoService.update(id, planoInput);
        expect(planos.update).toHaveBeenCalledWith(id, planoInput);
    });
    it("não atualiza plano inexistente", async () => {
        const { planos, planoService } = fixtures();
        planos.findById.mockResolvedValue(null);
        await expect(planoService.update(id, planoInput)).rejects.toMatchObject({ status: 404 });
        expect(planos.update).not.toHaveBeenCalled();
    });
});

describe("AlunoService", () => {
    it("impede exclusão de aluno com mensalidades", async () => {
        const { mensalidades, alunos, alunoService } = fixtures();
        mensalidades.existsByAluno.mockResolvedValue(true);
        await expect(alunoService.remove(id)).rejects.toMatchObject({ status: 409 });
        expect(alunos.remove).not.toHaveBeenCalled();
    });
    it("trata cobrança criada entre verificação e exclusão do aluno", async () => {
        const { alunos, alunoService } = fixtures();
        alunos.remove.mockRejectedValue(new RepositoryError("23503", "FK"));
        await expect(alunoService.remove(id)).rejects.toMatchObject({ status: 409 });
    });
    it("exclui aluno sem mensalidades", async () => {
        const { alunos, alunoService } = fixtures();
        await alunoService.remove(id);
        expect(alunos.remove).toHaveBeenCalledWith(id);
    });
    beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-12T12:00:00Z")); });
    afterEach(() => { vi.useRealTimers(); });
    it("cria aluno com plano ativo e preserva valor negociado", async () => {
        const { alunos, alunoService } = fixtures();
        await alunoService.create(alunoInput);
        expect(alunos.create).toHaveBeenCalledWith(alunoInput);
    });
    it.each([{ email: "inválido" }, { telefone: "abc" }, { data_nascimento: "2001-02-29" }, { data_nascimento: "2026-11-13" }, { valor_mensalidade: -1 }, { valor_mensalidade: Infinity }, { planoId: "abc" }, { ativo: 1 }])("rejeita aluno inválido sem gravar: %j", async (alteracao) => {
        const { alunos, alunoService } = fixtures();
        await expect(alunoService.create({ ...alunoInput, ...alteracao })).rejects.toMatchObject({ status: 400 });
        expect(alunos.create).not.toHaveBeenCalled();
    });
    it("rejeita plano inexistente", async () => {
        const { planos, alunos, alunoService } = fixtures();
        planos.findById.mockResolvedValue(null);
        await expect(alunoService.create(alunoInput)).rejects.toMatchObject({ status: 400 });
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
    it("permite transferência para plano ativo", async () => {
        const { alunos, alunoService } = fixtures();
        await alunoService.update(id, { ...alunoInput, planoId: outroId });
        expect(alunos.update).toHaveBeenCalledWith(id, { ...alunoInput, planoId: outroId });
    });
    it("traduz FK removida entre consulta e gravação", async () => {
        const { alunos, alunoService } = fixtures();
        alunos.create.mockRejectedValue(new RepositoryError("23503", "FK"));
        await expect(alunoService.create(alunoInput)).rejects.toMatchObject({ status: 400 });
    });
    it("filtra alunos por plano e valida UUID antes da consulta", async () => {
        const { alunos, alunoService } = fixtures();
        await alunoService.getByPlano(id);
        expect(alunos.findByPlano).toHaveBeenCalledWith(id);
        expect(() => alunoService.getByPlano("abc")).toThrow("UUID");
    });
});

describe.each(["plano", "aluno"] as const)("comportamentos comuns: %s", (entity) => {
    function setup() {
        const f = fixtures();
        return entity === "plano" ? { service: f.planoService, repository: f.planos } : { service: f.alunoService, repository: f.alunos };
    }
    it("lista e consulta registros existentes", async () => {
        const { service } = setup();
        await expect(service.getAll()).resolves.toHaveLength(1);
        await expect(service.getById(id)).resolves.toMatchObject({ id });
    });
    it("retorna 404 somente quando não existe registro", async () => {
        const { service, repository } = setup();
        repository.findById.mockResolvedValue(null);
        await expect(service.getById(id)).rejects.toMatchObject({ status: 404 });
    });
    it("preserva falhas de infraestrutura sem transformar em 404", async () => {
        const { service, repository } = setup();
        const erro = new Error("Conexão indisponível");
        repository.findById.mockRejectedValue(erro);
        await expect(service.getById(id)).rejects.toBe(erro);
    });
    it("não consulta UUID inválido", async () => {
        const { service, repository } = setup();
        await expect(service.getById("abc")).rejects.toMatchObject({ status: 400 });
        expect(repository.findById).not.toHaveBeenCalled();
    });
    it("pesquisa palavra-chave sem espaços externos", async () => {
        const { service, repository } = setup();
        await service.getByKeyword(" Eduardo ");
        expect(repository.searchByKeyword).toHaveBeenCalledWith("Eduardo");
    });
    it.each([undefined, " ", ["abc"], "a,b", "a%", "a)"])("rejeita pesquisa inválida: %j", (keyword) => {
        const { service, repository } = setup();
        expect(() => service.getByKeyword(keyword)).toThrow();
        expect(repository.searchByKeyword).not.toHaveBeenCalled();
    });
    it("não oculta falha inesperada na exclusão", async () => {
        const { service, repository } = setup();
        const erro = new Error("Sem conexão");
        repository.remove.mockRejectedValue(erro);
        await expect(service.remove(id)).rejects.toBe(erro);
    });
    it("informa registro removido concorrentemente", async () => {
        const { service, repository } = setup();
        repository.remove.mockResolvedValue(null);
        await expect(service.remove(id)).rejects.toMatchObject({ status: 404 });
    });
});
