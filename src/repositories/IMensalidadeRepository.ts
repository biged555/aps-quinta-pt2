import type { Mensalidade, MensalidadeInput } from "../model/Mensalidade.js";

export interface IMensalidadeRepository {
    findAll(): Promise<Mensalidade[]>;
    findById(id: string): Promise<Mensalidade | null>;
    findByAlunoCompetencia(alunoId: string, competencia: string): Promise<Mensalidade | null>;
    existsByAluno(alunoId: string): Promise<boolean>;
    create(input: MensalidadeInput): Promise<Mensalidade>;
    update(id: string, input: MensalidadeInput): Promise<Mensalidade | null>;
    remove(id: string): Promise<Mensalidade | null>;
}
