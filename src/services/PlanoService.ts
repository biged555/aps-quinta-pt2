import type { IPlanoRepository } from "../repositories/IPlanoRepository.js";
import type { IAlunoRepository } from "../repositories/IAlunoRepository.js";
import { AppError, RepositoryError } from "../errors/AppError.js";
import { validarPlano } from "../validators/planoValidator.js";
import { validarId, validarKeyword } from "../validators/common.js";

export default class PlanoService {
    constructor(private readonly planos: IPlanoRepository, private readonly alunos: Pick<IAlunoRepository, "existsByPlano">) {}

    getAll() { return this.planos.findAll(); }
    getByKeyword(keyword: unknown) { return this.planos.searchByKeyword(validarKeyword(keyword)); }
    async getById(id: unknown) {
        const plano = await this.planos.findById(validarId(id));
        if (!plano) throw new AppError(404, "Plano não encontrado.");
        return plano;
    }
    async create(input: unknown) { return this.planos.create(validarPlano(input)); }
    async update(id: unknown, input: unknown) {
        const uuid = validarId(id);
        const dados = validarPlano(input);
        await this.getById(uuid);
        const plano = await this.planos.update(uuid, dados);
        if (!plano) throw new AppError(404, "Plano não encontrado.");
        return plano;
    }
    async remove(id: unknown) {
        const uuid = validarId(id);
        await this.getById(uuid);
        if (await this.alunos.existsByPlano(uuid)) {
            throw new AppError(409, "Não foi possível remover o plano. Existem alunos vinculados a ele.");
        }
        try {
            const plano = await this.planos.remove(uuid);
            if (!plano) throw new AppError(404, "Plano não encontrado.");
        } catch (error) {
            // A FK também protege contra vínculos criados após a verificação acima.
            if (error instanceof RepositoryError && error.code === "23503") {
                throw new AppError(409, "Não foi possível remover o plano. Existem alunos vinculados a ele.");
            }
            throw error;
        }
    }
}
