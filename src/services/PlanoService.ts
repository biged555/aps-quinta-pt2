import PlanoRepository from "../repositories/PlanoRepository.js";
import AlunoRepository from "../repositories/AlunoRepository.js";
import { AppError, RepositoryError } from "../errors/AppError.js";
import { validarPlano } from "../model/Plano.js";
import { validarId, validarKeyword } from "../model/validacao.js";

export default class PlanoService {
    getAll() {
        return PlanoRepository.findAll();
    }
    getByKeyword(keyword: unknown) {
        return PlanoRepository.searchByKeyword(validarKeyword(keyword));
    }
    async getById(id: unknown) {
        const plano = await PlanoRepository.findById(validarId(id));
        if (!plano) throw new AppError(404, "Plano não encontrado.");
        return plano;
    }
    async create(input: unknown) {
        return PlanoRepository.create(validarPlano(input));
    }
    async update(id: unknown, input: unknown) {
        const uuid = validarId(id);
        const dados = validarPlano(input);
        await this.getById(uuid);
        const plano = await PlanoRepository.update(uuid, dados);
        if (!plano) throw new AppError(404, "Plano não encontrado.");
        return plano;
    }
    async remove(id: unknown) {
        const uuid = validarId(id);
        await this.getById(uuid);
        if (await AlunoRepository.existsByPlano(uuid)) {
            throw new AppError(409, "Não foi possível remover o plano. Existem alunos vinculados a ele.");
        }
        try {
            const plano = await PlanoRepository.remove(uuid);
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
