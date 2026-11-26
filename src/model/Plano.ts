import { AppError } from "../errors/AppError.js";

export interface Plano {
    id: string;
    created_at?: string | null;
    nome: string;
    descricao: string;
    icon: string;
    ordem_exibicao: number;
    valor_mensal: number;
    duracao_meses: number;
    ativo: boolean;
}

export type PlanoInput = Omit<Plano, "id" | "created_at">;

export function validarPlano(input: unknown): PlanoInput {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new AppError(400, "Dados inválidos.", ["Corpo da requisição deve ser um objeto JSON."]);
    }
    const body = input as Record<string, unknown>;
    const erros: string[] = [];

    if (typeof body.nome !== "string" || body.nome.trim() === "") {
        erros.push("O campo 'nome' é obrigatório e deve ser um texto.");
    }

    if (typeof body.descricao !== "string" || body.descricao.trim() === "") {
        erros.push("O campo 'descricao' é obrigatório e deve ser um texto.");
    }

    if (typeof body.icon !== "string" || body.icon.trim() === "") {
        erros.push("O campo 'icon' é obrigatório e deve ser um texto.");
    }

    if (typeof body.ordem_exibicao !== "number" || !Number.isInteger(body.ordem_exibicao) || body.ordem_exibicao < 0) {
        erros.push("O campo 'ordem_exibicao' é obrigatório e deve ser um número inteiro maior ou igual a zero.");
    }

    if (typeof body.valor_mensal !== "number" || !Number.isFinite(body.valor_mensal) || body.valor_mensal < 0) {
        erros.push("O campo 'valor_mensal' é obrigatório e deve ser um número maior ou igual a zero.");
    }

    if (typeof body.duracao_meses !== "number" || !Number.isInteger(body.duracao_meses) || body.duracao_meses < 1) {
        erros.push("O campo 'duracao_meses' é obrigatório e deve ser um número inteiro maior ou igual a 1.");
    }

    if (typeof body.ativo !== "boolean") {
        erros.push("O campo 'ativo' é obrigatório e deve ser um booleano (true ou false).");
    }
    if ("id" in body || "created_at" in body) erros.push("id e created_at são gerados pelo banco e não podem ser enviados.");
    if (erros.length) throw new AppError(400, "Dados inválidos.", erros);
    return {
        nome: body.nome as string,
        descricao: body.descricao as string,
        icon: body.icon as string,
        ordem_exibicao: body.ordem_exibicao as number,
        valor_mensal: body.valor_mensal as number,
        duracao_meses: body.duracao_meses as number,
        ativo: body.ativo as boolean
    };
}
