import { AppError } from "../errors/AppError.js";
import type { AlunoInput } from "../model/Aluno.js";

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONE = /^[0-9()+\-\s]{8,20}$/;
const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;

function dataValida(data: string) {
    if (!REGEX_DATA.test(data)) {
        return false;
    }

    const [ano, mes, dia] = data.split("-").map(Number);
    const dataInformada = new Date(Date.UTC(ano!, mes! - 1, dia!));

    return dataInformada.getUTCFullYear() === ano
        && dataInformada.getUTCMonth() === mes! - 1
        && dataInformada.getUTCDate() === dia;
}

function errosAluno(body: Record<string, unknown>) {
    const erros: string[] = [];

    if (!body || typeof body !== "object") {
        return ["Corpo da requisição não informado."];
    }

    if (typeof body.planoId !== "string" || !REGEX_UUID.test(body.planoId)) {
        erros.push("O campo 'planoId' é obrigatório e deve conter o UUID de um plano cadastrado.");
    }

    if (typeof body.nome !== "string" || body.nome.trim() === "") {
        erros.push("O campo 'nome' é obrigatório e deve ser um texto.");
    }

    if (typeof body.descricao !== "string" || body.descricao.trim() === "") {
        erros.push("O campo 'descricao' é obrigatório e deve ser um texto.");
    }

    if (typeof body.email !== "string" || !REGEX_EMAIL.test(body.email)) {
        erros.push("O campo 'email' é obrigatório e deve conter um e-mail válido.");
    }

    if (typeof body.telefone !== "string" || !REGEX_TELEFONE.test(body.telefone)) {
        erros.push("O campo 'telefone' é obrigatório e deve conter um telefone válido.");
    }

    if (typeof body.data_nascimento !== "string" || !dataValida(body.data_nascimento)) {
        erros.push("O campo 'data_nascimento' é obrigatório e deve estar no formato AAAA-MM-DD.");
    } else if (new Date(body.data_nascimento) > new Date()) {
        erros.push("O campo 'data_nascimento' não pode ser uma data futura.");
    }

    if (typeof body.valor_mensalidade !== "number" || !Number.isFinite(body.valor_mensalidade) || body.valor_mensalidade < 0) {
        erros.push("O campo 'valor_mensalidade' é obrigatório e deve ser um número maior ou igual a zero.");
    }

    if (typeof body.ativo !== "boolean") {
        erros.push("O campo 'ativo' é obrigatório e deve ser um booleano (true ou false).");
    }

    return erros;
}


export function validarAluno(input: unknown): AlunoInput {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new AppError(400, "Dados inválidos.", ["Corpo da requisição deve ser um objeto JSON."]);
    }
    const body = input as Record<string, unknown>;
    const erros = errosAluno(body);
    if ("id" in body || "created_at" in body) erros.push("id e created_at são gerados pelo banco e não podem ser enviados.");
    if (erros.length) throw new AppError(400, "Dados inválidos.", erros);
    return {
        planoId: body.planoId as string,
        nome: body.nome as string,
        descricao: body.descricao as string,
        email: body.email as string,
        telefone: body.telefone as string,
        data_nascimento: body.data_nascimento as string,
        valor_mensalidade: body.valor_mensalidade as number,
        ativo: body.ativo as boolean
    };
}
