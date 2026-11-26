import { AppError } from "../errors/AppError.js";

export function validarId(value: unknown): string {
    if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        throw new AppError(400, "ID inválido. Informe um UUID.");
    }
    return value;
}

export function validarKeyword(value: unknown): string {
    if (typeof value !== "string" || !value.trim()) {
        throw new AppError(400, "Palavra-chave não informada.");
    }
    // Evita que a entrada modifique a expressão de filtros do PostgREST.
    if (/[(),"\\%*]/.test(value)) {
        throw new AppError(400, "Palavra-chave contém caracteres não permitidos.");
    }
    return value.trim();
}
