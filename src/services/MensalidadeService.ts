import type { IMensalidadeRepository } from "../repositories/IMensalidadeRepository.js";
import type { IAlunoRepository } from "../repositories/IAlunoRepository.js";
import { AppError, RepositoryError } from "../errors/AppError.js";
import { validarId } from "../validators/common.js";
import { validarMensalidade } from "../validators/mensalidadeValidator.js";

export default class MensalidadeService {
    constructor(
        private readonly mensalidades: IMensalidadeRepository,
        private readonly alunos: Pick<IAlunoRepository, "findById">,
    ) {}

    getAll() { return this.mensalidades.findAll(); }

    async getById(id: unknown) {
        const mensalidade = await this.mensalidades.findById(validarId(id));
        if (!mensalidade) throw new AppError(404, "Mensalidade não encontrada.");
        return mensalidade;
    }

    private async validarAluno(alunoId: string, exigirAtivo: boolean) {
        const aluno = await this.alunos.findById(alunoId);
        if (!aluno) throw new AppError(400, "O aluno informado não existe.");
        if (exigirAtivo && !aluno.ativo) throw new AppError(409, "Não é possível criar ou transferir cobrança para aluno inativo.");
    }

    private async validarCompetencia(alunoId: string, competencia: string, id?: string) {
        const existente = await this.mensalidades.findByAlunoCompetencia(alunoId, competencia);
        if (existente && existente.id !== id) throw new AppError(409, "Já existe uma mensalidade para este aluno e competência.");
    }

    private tratarErro(error: unknown): never {
        if (error instanceof RepositoryError) {
            if (error.code === "23505") throw new AppError(409, "Já existe uma mensalidade para este aluno e competência.");
            if (error.code === "23503") throw new AppError(400, "O aluno informado não existe.");
            if (error.code === "P0001") throw new AppError(409, "Mensalidades pagas não podem ser alteradas ou excluídas.");
        }
        throw error;
    }

    async create(input: unknown) {
        const dados = validarMensalidade(input);
        await this.validarAluno(dados.alunoId, true);
        await this.validarCompetencia(dados.alunoId, dados.competencia);
        try { return await this.mensalidades.create(dados); }
        catch (error) { return this.tratarErro(error); }
    }

    async update(id: unknown, input: unknown) {
        const uuid = validarId(id);
        const dados = validarMensalidade(input);
        const atual = await this.getById(uuid);
        if (atual.status === "paga") throw new AppError(409, "Mensalidades pagas não podem ser alteradas.");
        // Permite quitar cobranças anteriores após a desativação do aluno.
        await this.validarAluno(dados.alunoId, dados.alunoId !== atual.alunoId);
        await this.validarCompetencia(dados.alunoId, dados.competencia, uuid);
        try {
            const mensalidade = await this.mensalidades.update(uuid, dados);
            if (!mensalidade) throw new AppError(404, "Mensalidade não encontrada.");
            return mensalidade;
        } catch (error) { return this.tratarErro(error); }
    }

    async remove(id: unknown) {
        const uuid = validarId(id);
        const atual = await this.getById(uuid);
        if (atual.status === "paga") throw new AppError(409, "Mensalidades pagas não podem ser excluídas.");
        try {
            const mensalidade = await this.mensalidades.remove(uuid);
            if (!mensalidade) throw new AppError(404, "Mensalidade não encontrada.");
        } catch (error) { return this.tratarErro(error); }
    }
}
