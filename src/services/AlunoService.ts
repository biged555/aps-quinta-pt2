import type { IAlunoRepository } from "../repositories/IAlunoRepository.js";
import type { IPlanoRepository } from "../repositories/IPlanoRepository.js";
import { AppError, RepositoryError } from "../errors/AppError.js";
import { validarAluno } from "../validators/alunoValidator.js";
import { validarId, validarKeyword } from "../validators/common.js";
import type { IMensalidadeRepository } from "../repositories/IMensalidadeRepository.js";

export default class AlunoService {
    constructor(
        private readonly alunos: IAlunoRepository,
        private readonly planos: Pick<IPlanoRepository, "findById">,
        private readonly mensalidades: Pick<IMensalidadeRepository, "existsByAluno">,
    ) {}

    getAll() { return this.alunos.findAll(); }
    getByKeyword(keyword: unknown) { return this.alunos.searchByKeyword(validarKeyword(keyword)); }
    getByPlano(planoId: unknown) { return this.alunos.findByPlano(validarId(planoId)); }
    async getById(id: unknown) {
        const aluno = await this.alunos.findById(validarId(id));
        if (!aluno) throw new AppError(404, "Aluno não encontrado.");
        return aluno;
    }
    private async validarPlano(planoId: string, exigirAtivo: boolean) {
        const plano = await this.planos.findById(planoId);
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
        try { return await this.alunos.create(dados); }
        catch (error) { return this.tratarErroDeVinculo(error); }
    }
    async update(id: unknown, input: unknown) {
        const uuid = validarId(id);
        const dados = validarAluno(input);
        const atual = await this.getById(uuid);
        await this.validarPlano(dados.planoId, atual.planoId !== dados.planoId);
        try {
            const aluno = await this.alunos.update(uuid, dados);
            if (!aluno) throw new AppError(404, "Aluno não encontrado.");
            return aluno;
        } catch (error) { return this.tratarErroDeVinculo(error); }
    }
    async remove(id: unknown) {
        const uuid = validarId(id);
        await this.getById(uuid);
        if (await this.mensalidades.existsByAluno(uuid)) {
            throw new AppError(409, "Não foi possível remover o aluno. Existem mensalidades vinculadas a ele.");
        }
        try {
            const aluno = await this.alunos.remove(uuid);
            if (!aluno) throw new AppError(404, "Aluno não encontrado.");
        } catch (error) {
            if (error instanceof RepositoryError && error.code === "23503") {
                throw new AppError(409, "Não foi possível remover o aluno. Existem mensalidades vinculadas a ele.");
            }
            throw error;
        }
    }
}
