import { AppError } from "../errors/AppError.js";
import { validarId } from "./validacao.js";

export type StatusMensalidade = "pendente" | "paga" | "cancelada";

export interface Mensalidade {
    id: string;
    alunoId: string;
    competencia: string;
    valor: number;
    data_vencimento: string;
    data_pagamento: string | null;
    status: StatusMensalidade;
    created_at?: string;
}

export type MensalidadeInput = Omit<Mensalidade, "id" | "created_at">;

function dataValida(value: unknown): value is string {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// A regra de data civil usa o fuso da academia, independente do servidor.
export function hojeNaAcademia(): string {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const get = (type: string) => parts.find(part => part.type === type)!.value;
    return `${get("year")}-${get("month")}-${get("day")}`;
}

export function validarMensalidade(input: unknown): MensalidadeInput {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new AppError(400, "Dados inválidos.", ["Corpo da requisição deve ser um objeto JSON."]);
    }
    const body = input as Record<string, unknown>;
    const erros: string[] = [];
    try { validarId(body.alunoId); }
    catch { erros.push("O campo 'alunoId' deve conter um UUID válido."); }
    if (!dataValida(body.competencia) || !body.competencia.endsWith("-01")) {
        erros.push("A competência deve ser uma data válida no primeiro dia do mês (AAAA-MM-01).");
    }
    if (typeof body.valor !== "number" || !Number.isFinite(body.valor) || body.valor < 0
        || body.valor > 99999999.99 || Math.abs(body.valor * 100 - Math.round(body.valor * 100)) > 0.000001) {
        erros.push("O valor deve estar entre 0 e 99999999.99, com no máximo duas casas decimais.");
    }
    if (!dataValida(body.data_vencimento)) erros.push("A data de vencimento deve ser válida (AAAA-MM-DD).");
    if (!["pendente", "paga", "cancelada"].includes(body.status as string)) {
        erros.push("O status deve ser pendente, paga ou cancelada.");
    }
    if (body.status === "paga") {
        if (!dataValida(body.data_pagamento)) erros.push("Mensalidade paga exige uma data de pagamento válida.");
        else if (body.data_pagamento > hojeNaAcademia()) erros.push("A data de pagamento não pode ser futura.");
    } else if (body.data_pagamento !== null) {
        erros.push("O campo 'data_pagamento' deve ser null para mensalidades pendentes ou canceladas.");
    }
    if ("id" in body || "created_at" in body) erros.push("id e created_at são gerados pelo banco e não podem ser enviados.");
    if (erros.length) throw new AppError(400, "Dados inválidos.", erros);
    return {
        alunoId: body.alunoId as string,
        competencia: body.competencia as string,
        valor: body.valor as number,
        data_vencimento: body.data_vencimento as string,
        data_pagamento: body.data_pagamento as string | null,
        status: body.status as StatusMensalidade,
    };
}
