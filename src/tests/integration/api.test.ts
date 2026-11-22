import request from "supertest";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app, client, repositories, resetDatabase } from "../helpers/database.js";
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
    it("rejeita plano inexistente e plano inativo sem persistir", async () => {
        await request(app).post("/alunos").send(alunoInput(randomUUID())).expect(400);
        const plano = await criarPlano({ ativo: false });
        await request(app).post("/alunos").send(alunoInput(plano.id)).expect(409);
        expect(await repositories.alunos.findAll()).toEqual([]);
    });
    it("permite editar vínculo antigo, mas rejeita transferência para inativo", async () => {
        const aluno = await criarAluno();
        await request(app).put(`/planos/${aluno.plano.id}`).send({ ...aluno.plano.input, ativo: false }).expect(200);
        await request(app).put(`/alunos/${aluno.id}`).send({ ...aluno.input, nome: "Novo nome" }).expect(200);
        const outro = await criarPlano({ ativo: false });
        await request(app).put(`/alunos/${aluno.id}`).send({ ...aluno.input, planoId: outro.id }).expect(409);
        expect(await repositories.alunos.findById(aluno.id)).toMatchObject({ planoId: aluno.plano.id, nome: "Novo nome" });
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
    it.each(["pendente", "cancelada"] as const)("DELETE remove cobrança %s", async status => {
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
    it("duas requisições concorrentes não criam duplicatas", async () => {
        const aluno = await criarAluno();
        const responses = await Promise.all([1, 2].map(() => request(app).post("/mensalidades").send(mensalidadeInput(aluno.id))));
        expect(responses.map(response => response.status).sort()).toEqual([201, 409]);
        expect(await repositories.mensalidades.findAll()).toHaveLength(1);
    });
    it("não exclui aluno com cobrança de qualquer status", async () => {
        const { aluno } = await criarMensalidade({ status: "cancelada" });
        await request(app).delete(`/alunos/${aluno.id}`).expect(409);
        expect(await repositories.alunos.findById(aluno.id)).not.toBeNull();
    });
    it("não recalcula cobrança após mudança de preço do plano e do aluno", async () => {
        const { id, aluno, input } = await criarMensalidade();
        await request(app).put(`/planos/${aluno.plano.id}`).send({ ...aluno.plano.input, valor_mensal: 300 }).expect(200);
        await request(app).put(`/alunos/${aluno.id}`).send({ ...aluno.input, valor_mensalidade: 200 }).expect(200);
        expect(await repositories.mensalidades.findById(id)).toMatchObject({ valor: input.valor });
    });
    it("permite quitar cobrança antiga de aluno inativo, sem criar uma nova", async () => {
        const { id, aluno, input } = await criarMensalidade();
        await request(app).put(`/alunos/${aluno.id}`).send({ ...aluno.input, ativo: false }).expect(200);
        await request(app).post("/mensalidades").send({ ...input, competencia: "2026-12-01" }).expect(409);
        await request(app).put(`/mensalidades/${id}`).send({ ...input, status: "paga", data_pagamento: "2026-11-01" }).expect(200);
    });
    it("rejeita aluno inexistente sem persistir cobrança", async () => {
        await request(app).post("/mensalidades").send(mensalidadeInput(randomUUID())).expect(400);
        expect(await repositories.mensalidades.findAll()).toEqual([]);
    });
});

describe.each(["planos", "alunos", "mensalidades"])("contratos HTTP: %s", entidade => {
    it("lista vazia tem status 200 e array vazio", async () => {
        const response = await request(app).get(`/${entidade}`).expect(200);
        expect(response.body).toEqual([]);
    });
    it("UUID inválido retorna 400 em consulta, alteração e exclusão", async () => {
        await request(app).get(`/${entidade}/abc`).expect(400);
        await request(app).put(`/${entidade}/abc`).send({}).expect(400);
        await request(app).delete(`/${entidade}/abc`).expect(400);
    });
    it("UUID inexistente retorna 404 em consulta e exclusão", async () => {
        const path = `/${entidade}/${randomUUID()}`;
        await request(app).get(path).expect(404);
        await request(app).delete(path).expect(404);
    });
    it("PUT de registro inexistente retorna 404 com corpo válido", async () => {
        const input = entidade === "planos" ? planoInput
            : entidade === "alunos" ? alunoInput(randomUUID()) : mensalidadeInput(randomUUID());
        await request(app).put(`/${entidade}/${randomUUID()}`).send(input).expect(404);
    });
    it("corpo inválido retorna erros em JSON sem criar registros", async () => {
        const response = await request(app).post(`/${entidade}`).send({}).expect(400);
        expect(response.body).toMatchObject({ message: "Dados inválidos.", erros: expect.any(Array) });
        expect((await request(app).get(`/${entidade}`).expect(200)).body).toEqual([]);
    });
});

describe("contratos gerais e garantias do banco", () => {
    it("raiz e rota inexistente respondem JSON", async () => {
        expect((await request(app).get("/").expect(200)).body.message).toBe("Academia System - API");
        expect((await request(app).get("/inexistente").expect(404)).body).toEqual({ message: "Rota não encontrada." });
    });
    it("JSON malformado e corpo excessivo têm erros controlados", async () => {
        const response = await request(app).post("/planos").set("Content-Type", "application/json").send('{"nome":').expect(400);
        expect(response.body.message).toBe("JSON inválido no corpo da requisição.");
        await request(app).post("/planos").send({ nome: "x".repeat(150000) }).expect(413);
    });
    it.each(["planos", "alunos"])("pesquisa inválida em %s retorna 400", async entidade => {
        await request(app).get(`/${entidade}/search`).expect(400);
        await request(app).get(`/${entidade}/search`).query({ keyword: "a,b" }).expect(400);
    });
    it("ausência é distinta de falha inesperada, que retorna 500 sem expor detalhes", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        // Somente este cenário injeta uma falha para exercitar o contrato HTTP de infraestrutura.
        vi.spyOn(repositories.planos, "findById").mockRejectedValueOnce(new Error("Detalhe interno"));
        const response = await request(app).get(`/planos/${randomUUID()}`).expect(500);
        expect(response.body).toEqual({ message: "Erro interno do servidor." });
    });
    it("FK e unicidade protegem persistência mesmo sem passar pelos Services", async () => {
        const { input, aluno } = await criarMensalidade();
        await expect(repositories.mensalidades.create(input)).rejects.toMatchObject({ code: "23505" });
        await expect(repositories.mensalidades.create({ ...input, alunoId: randomUUID() })).rejects.toMatchObject({ code: "23503" });
        await expect(repositories.alunos.remove(aluno.id)).rejects.toMatchObject({ code: "23503" });
        await expect(repositories.planos.remove(aluno.plano.id)).rejects.toMatchObject({ code: "23503" });
    });
    it("trigger impede alteração e exclusão de paga também pelo Repository", async () => {
        const { id, input } = await criarMensalidade({ status: "paga", data_pagamento: "2026-11-01" });
        await expect(repositories.mensalidades.update(id, { ...input, valor: 1 })).rejects.toMatchObject({ code: "P0001" });
        await expect(repositories.mensalidades.remove(id)).rejects.toMatchObject({ code: "P0001" });
        expect(await repositories.mensalidades.findById(id)).toMatchObject(input);
    });
    it("restrição SQL impede status paga sem data", async () => {
        const { id } = await criarMensalidade();
        const { error } = await client.from("mensalidades").update({ status: "paga" }).eq("id", id);
        expect(error?.code).toBe("23514");
        expect(await repositories.mensalidades.findById(id)).toMatchObject({ status: "pendente", data_pagamento: null });
    });
});
