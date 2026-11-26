import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof AppError) {
        res.status(error.status).json({ message: error.message, ...(error.erros ? { erros: error.erros } : {}) });
        return;
    }
    if (error instanceof SyntaxError && "type" in error && error.type === "entity.parse.failed") {
        res.status(400).json({ message: "JSON inválido no corpo da requisição." });
        return;
    }
    if (error && typeof error === "object" && "type" in error && error.type === "entity.too.large") {
        res.status(413).json({ message: "Corpo da requisição excede o tamanho permitido." });
        return;
    }
    console.error("Erro inesperado na API:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
};
