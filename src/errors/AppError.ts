export class AppError extends Error {
    constructor(public readonly status: number, message: string, public readonly erros?: string[]) {
        super(message);
        this.name = "AppError";
    }
}

export class RepositoryError extends Error {
    constructor(public readonly code: string, message: string) {
        super(message);
        this.name = "RepositoryError";
    }
}
