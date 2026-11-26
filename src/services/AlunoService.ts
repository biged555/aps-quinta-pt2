import AlunoRepository from "../repositories/AlunoRepository.js";
import PlanoRepository from "../repositories/PlanoRepository.js";
import { AppError, RepositoryError } from "../errors/AppError.js";
import { validarAluno } from "../model/Aluno.js";
import { validarId, validarKeyword } from "../model/validacao.js";
import MensalidadeRepository from "../repositories/MensalidadeRepository.js";

export default class AlunoService {
    getAll() {
        return AlunoRepository.findAll();
    }
    getByKeyword(keyword: unknown) {
        return AlunoRepository.searchByKeyword(validarKeyword(keyword));
    }
    getByPlano(planoId: unknown) {
        return AlunoRepository.findByPlano(validarId(planoId));
    }
    async getById(id: unknown) {
        const aluno = await AlunoRepository.findById(validarId(id));
        if (!aluno) throw new AppError(404, "Aluno não encontrado.");
        return aluno;
    }
    private async validarPlano(planoId: string, exigirAtivo: boolean) {
        const plano = await PlanoRepository.findById(planoId);
        if (!plano) throw new AppError(400, "O plano informado não existe.");
        if (exigirAtivo && !plano.ativo) throw new AppError(409, "Não é possível vincular o aluno a um plano inativo.");
    }
    private tratarErroDeVinculo(error: unknown): never {
        if (error instanceof RepositoryError && error.code === "23503") {
            throw new AppError(400, "O plano informado não existe.");
        }
        throw error;
    }
    async create(input: unknown) {
        const dados = validarAluno(input);
        await this.validarPlano(dados.planoId, true);
        try {
            return await AlunoRepository.create(dados);
        } catch (error) {
            return this.tratarErroDeVinculo(error);
        }
    }
    async update(id: unknown, input: unknown) {
        const uuid = validarId(id);
        const dados = validarAluno(input);
        const atual = await this.getById(uuid);
        await this.validarPlano(dados.planoId, atual.planoId !== dados.planoId);
        try {
            const aluno = await AlunoRepository.update(uuid, dados);
            if (!aluno) throw new AppError(404, "Aluno não encontrado.");
            return aluno;
        } catch (error) {
            return this.tratarErroDeVinculo(error);
        }
    }
    async remove(id: unknown) {
        const uuid = validarId(id);
        await this.getById(uuid);
        if (await MensalidadeRepository.existsByAluno(uuid)) {
            throw new AppError(409, "Não foi possível remover o aluno. Existem mensalidades vinculadas a ele.");
        }
        try {
            const aluno = await AlunoRepository.remove(uuid);
            if (!aluno) throw new AppError(404, "Aluno não encontrado.");
        } catch (error) {
            if (error instanceof RepositoryError && error.code === "23503") {
                throw new AppError(409, "Não foi possível remover o aluno. Existem mensalidades vinculadas a ele.");
            }
            throw error;
        }
    }
}
