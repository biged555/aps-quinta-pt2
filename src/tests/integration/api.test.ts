import request from "supertest";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app, repositories, resetDatabase } from "../helpers/database.js";
import type { PlanoInput } from "../../model/Plano.js";
import type { AlunoInput } from "../../model/Aluno.js";
import type { MensalidadeInput } from "../../model/Mensalidade.js";

const planoInput: PlanoInput = { nome: "Musculação", descricao: "Treino de força", icon: "💪", ordem_exibicao: 2, valor_mensal: 129.9, duracao_meses: 12, ativo: true };
const alunoInput = (planoId: string): AlunoInput => ({ planoId, nome: "Eduardo Teste", descricao: "Aluno de teste", email: "eduardo@example.com", telefone: "41999991111", data_nascimento: "2000-02-29", valor_mensalidade: 119.9, ativo: true });
const mensalidadeInput = (alunoId: string): MensalidadeInput => ({ alunoId, competencia: "2026-11-01", valor: 119.9, data_vencimento: "2026-11-10", data_pagamento: null, status: "pendente" });

async function criarPlano(overrides: Partial<PlanoInput> = {}) {
    const input = { ...planoInput, ...overrides };
    const response = await request(app).post("/planos").send(input).expect(201);
    return { id: response.body.id as string, input };
}
async function criarAluno(overrides: Partial<AlunoInput> = {}) {
    const plano = await criarPlano();
    const input = { ...alunoInput(plano.id), ...overrides };
    const response = await request(app).post("/alunos").send(input).expect(201);
    return { id: response.body.id as string, plano, input };
}
async function criarMensalidade(overrides: Partial<MensalidadeInput> = {}) {
    const aluno = await criarAluno();
    const input = { ...mensalidadeInput(aluno.id), ...overrides };
    const response = await request(app).post("/mensalidades").send(input).expect(201);
    return { id: response.body.id as string, aluno, input };
}

beforeEach(resetDatabase);
afterEach(() => { vi.restoreAllMocks(); resetDatabase(); });

describe("Planos: HTTP até PostgreSQL", () => {
    it("POST persiste o registro com UUID e valores corretos", async () => {
        const { id, input } = await criarPlano();
        expect(id).toMatch(/^[a-f0-9-]{36}$/);
        expect(await repositories.planos.findById(id)).toMatchObject({ id, ...input, created_at: expect.any(String) });
    });
    it("GET lista em ordem de exibição", async () => {
        const segundo = await criarPlano();
        const primeiro = await criarPlano({ nome: "Funcional", ordem_exibicao: 1 });
        const response = await request(app).get("/planos").expect(200);
        expect(response.body.map((row: { id: string }) => row.id)).toEqual([primeiro.id, segundo.id]);
    });
    it("GET por ID retorna o registro esperado", async () => {
        const { id, input } = await criarPlano();
        const response = await request(app).get(`/planos/${id}`).expect(200);
        expect(response.body).toMatchObject({ id, ...input });
    });
    it("PUT persiste todos os campos editáveis", async () => {
        const { id, input } = await criarPlano();
        const update = { ...input, nome: "Premium", valor_mensal: 199.9, ativo: false };
        const response = await request(app).put(`/planos/${id}`).send(update).expect(200);
        expect(response.body).toMatchObject({ id, ...update });
        expect(await repositories.planos.findById(id)).toMatchObject(update);
    });
    it("DELETE remove o registro e GET posterior retorna 404", async () => {
        const { id } = await criarPlano();
        const response = await request(app).delete(`/planos/${id}`).expect(200);
        expect(response.body).toEqual({ message: "Plano removido com sucesso." });
        expect(await repositories.planos.findById(id)).toBeNull();
        await request(app).get(`/planos/${id}`).expect(404);
    });
    it("pesquisa nome e descrição sem distinguir maiúsculas", async () => {
        const { id } = await criarPlano();
        for (const keyword of ["MUSCULA", "força"]) {
            const response = await request(app).get("/planos/search").query({ keyword }).expect(200);
            expect(response.body.map((row: { id: string }) => row.id)).toEqual([id]);
        }
    });
    it("não exclui plano com aluno nem altera os vínculos", async () => {
        const aluno = await criarAluno();
        await request(app).delete(`/planos/${aluno.plano.id}`).expect(409);
        expect(await repositories.planos.findById(aluno.plano.id)).not.toBeNull();
        expect(await repositories.alunos.findById(aluno.id)).toMatchObject({ planoId: aluno.plano.id });
    });
});

describe("Alunos: HTTP até PostgreSQL", () => {
    it("POST persiste aluno e vínculo com plano", async () => {
        const { id, input } = await criarAluno();
        expect(await repositories.alunos.findById(id)).toMatchObject({ id, ...input });
    });
    it("GET lista por nome", async () => {
        const segundo = await criarAluno({ nome: "Zelia" });
        const primeiro = await criarAluno({ nome: "Ana" });
        const response = await request(app).get("/alunos").expect(200);
        expect(response.body.map((row: { id: string }) => row.id)).toEqual([primeiro.id, segundo.id]);
    });
    it("GET por ID retorna os dados cadastrados", async () => {
        const { id, input } = await criarAluno();
        const response = await request(app).get(`/alunos/${id}`).expect(200);
        expect(response.body).toMatchObject({ id, ...input });
    });
    it("PUT transfere para outro plano ativo e mantém o valor negociado", async () => {
        const { id, input } = await criarAluno();
        const plano = await criarPlano({ nome: "Outro" });
        const update = { ...input, planoId: plano.id, nome: "Atualizado", valor_mensalidade: 99.9 };
        const response = await request(app).put(`/alunos/${id}`).send(update).expect(200);
        expect(response.body).toMatchObject(update);
        expect(await repositories.alunos.findById(id)).toMatchObject(update);
    });
    it("DELETE remove aluno sem cobranças", async () => {
        const { id } = await criarAluno();
        const response = await request(app).delete(`/alunos/${id}`).expect(200);
        expect(response.body).toEqual({ message: "Aluno removido com sucesso." });
        expect(await repositories.alunos.findById(id)).toBeNull();
        await request(app).get(`/alunos/${id}`).expect(404);
    });
    it("pesquisa por nome e email com ponto", async () => {
        const { id } = await criarAluno();
        for (const keyword of ["EDUARDO", "example.com"]) {
            const response = await request(app).get("/alunos/search").query({ keyword }).expect(200);
            expect(response.body.map((row: { id: string }) => row.id)).toEqual([id]);
        }
    });
    it("filtra somente alunos do plano solicitado", async () => {
        const aluno = await criarAluno();
        await criarAluno({ nome: "Outro aluno" });
        const response = await request(app).get(`/alunos/plano/${aluno.plano.id}`).expect(200);
        expect(response.body.map((row: { id: string }) => row.id)).toEqual([aluno.id]);
        await request(app).get("/alunos/plano/abc").expect(400);
    });

});

describe("Mensalidades: HTTP até PostgreSQL", () => {
    it("POST persiste cobrança com seu próprio valor", async () => {
        const { id, input } = await criarMensalidade({ valor: 79.9 });
        expect(await repositories.mensalidades.findById(id)).toMatchObject({ id, ...input });
    });
    it("GET lista por competência decrescente", async () => {
        const antiga = await criarMensalidade({ competencia: "2026-10-01" });
        const nova = await criarMensalidade();
        const response = await request(app).get("/mensalidades").expect(200);
        expect(response.body.map((row: { id: string }) => row.id)).toEqual([nova.id, antiga.id]);
    });
    it("GET por ID retorna cobrança completa", async () => {
        const { id, input } = await criarMensalidade();
        const response = await request(app).get(`/mensalidades/${id}`).expect(200);
        expect(response.body).toMatchObject({ id, ...input });
    });
    it("PUT registra pagamento e persiste data e status", async () => {
        const { id, input } = await criarMensalidade();
        const update = { ...input, status: "paga", data_pagamento: "2026-11-01" };
        const response = await request(app).put(`/mensalidades/${id}`).send(update).expect(200);
        expect(response.body).toMatchObject(update);
        expect(await repositories.mensalidades.findById(id)).toMatchObject(update);
        await request(app).put(`/mensalidades/${id}`).send(input).expect(409);
        await request(app).delete(`/mensalidades/${id}`).expect(409);
    });
    it.each(["pendente"] as const)("DELETE remove cobrança %s", async status => {
        const { id } = await criarMensalidade({ status });
        const response = await request(app).delete(`/mensalidades/${id}`).expect(200);
        expect(response.body).toEqual({ message: "Mensalidade removida com sucesso." });
        expect(await repositories.mensalidades.findById(id)).toBeNull();
        await request(app).get(`/mensalidades/${id}`).expect(404);
    });
    it("rejeita duplicidade, inclusive em cobrança cancelada", async () => {
        const { input } = await criarMensalidade({ status: "cancelada" });
        await request(app).post("/mensalidades").send(input).expect(409);
        expect(await repositories.mensalidades.findAll()).toHaveLength(1);
    });

    it("não exclui aluno com cobrança de qualquer status", async () => {
        const { aluno } = await criarMensalidade({ status: "cancelada" });
        await request(app).delete(`/alunos/${aluno.id}`).expect(409);
        expect(await repositories.alunos.findById(aluno.id)).not.toBeNull();
    });

});

describe.each(["planos", "alunos", "mensalidades"])("contratos HTTP: %s", entidade => {

    it("UUID inválido retorna 400 em consulta, alteração e exclusão", async () => {
        await request(app).get(`/${entidade}/abc`).expect(400);
        await request(app).put(`/${entidade}/abc`).send({}).expect(400);
        await request(app).delete(`/${entidade}/abc`).expect(400);
    });

    it("corpo inválido retorna erros em JSON sem criar registros", async () => {
        const response = await request(app).post(`/${entidade}`).send({}).expect(400);
        expect(response.body).toMatchObject({ message: "Dados inválidos.", erros: expect.any(Array) });
        expect((await request(app).get(`/${entidade}`).expect(200)).body).toEqual([]);
    });
});

describe("contratos gerais e garantias do banco", () => {
    it("publica OpenAPI e Swagger com assets locais", async () => {
        const document = await request(app).get("/openapi.json").expect(200);
        expect(document.body.openapi).toBe("3.0.3");
        expect(document.body.paths).toHaveProperty("/mensalidades/{id}");
        const page = await request(app).get("/api-docs/").expect(200);
        expect(page.headers["content-type"]).toContain("text/html");
        expect(page.text).toContain("swagger-ui");
        await request(app).get("/api-docs/swagger-ui.css").expect(200);
        const script = await request(app).get("/api-docs/swagger-ui-init.js").expect(200);
        expect(script.text).toContain("Mensalidades");
    });
    it("raiz e rota inexistente respondem JSON", async () => {
        expect((await request(app).get("/").expect(200)).body.message).toBe("Academia System - API");
        expect((await request(app).get("/inexistente").expect(404)).body).toEqual({ message: "Rota não encontrada." });
    });

    it("ausência é distinta de falha inesperada, que retorna 500 sem expor detalhes", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        // Somente este cenário injeta uma falha para exercitar o contrato HTTP de infraestrutura.
        vi.spyOn(repositories.planos, "findById").mockRejectedValueOnce(new Error("Detalhe interno"));
        const response = await request(app).get(`/planos/${randomUUID()}`).expect(500);
        expect(response.body).toEqual({ message: "Erro interno do servidor." });
    });

    it("trigger impede alteração e exclusão de paga também pelo Repository", async () => {
        const { id, input } = await criarMensalidade({ status: "paga", data_pagamento: "2026-11-01" });
        await expect(repositories.mensalidades.update(id, { ...input, valor: 1 })).rejects.toMatchObject({ code: "P0001" });
        await expect(repositories.mensalidades.remove(id)).rejects.toMatchObject({ code: "P0001" });
        expect(await repositories.mensalidades.findById(id)).toMatchObject(input);
    });

});
