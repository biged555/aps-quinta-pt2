import type { NextFunction, Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError, RepositoryError } from "../../errors/AppError.js";
import { errorHandler } from "../../middlewares/errorHandler.js";

afterEach(() => vi.restoreAllMocks());

function handle(error: unknown, headersSent = false) {
    const response = { headersSent, status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    errorHandler(error, {} as Request, response as unknown as Response, next as NextFunction);
    return { response, next };
}

describe("tratamento central de erros", () => {
    it("preserva status e lista de validações de erros conhecidos", () => {
        const { response } = handle(new AppError(400, "Dados inválidos.", ["Nome obrigatório."]));
        expect(response.status).toHaveBeenCalledWith(400);
        expect(response.json).toHaveBeenCalledWith({ message: "Dados inválidos.", erros: ["Nome obrigatório."] });
    });
    it("não expõe detalhes de infraestrutura", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        const { response } = handle(new RepositoryError("08006", "Detalhe interno do banco"));
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({ message: "Erro interno do servidor." });
    });
    it("retorna JSON e status 400 para JSON malformado", () => {
        const { response } = handle(Object.assign(new SyntaxError("Unexpected token"), { type: "entity.parse.failed" }));
        expect(response.status).toHaveBeenCalledWith(400);
        expect(response.json).toHaveBeenCalledWith({ message: "JSON inválido no corpo da requisição." });
    });
    it("retorna 413 para corpo acima do limite", () => {
        const { response } = handle({ type: "entity.too.large" });
        expect(response.status).toHaveBeenCalledWith(413);
    });
    it("delega erro quando a resposta já começou", () => {
        const error = new Error("Falha");
        const { response, next } = handle(error, true);
        expect(next).toHaveBeenCalledWith(error);
        expect(response.json).not.toHaveBeenCalled();
    });
});
