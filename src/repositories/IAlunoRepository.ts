import type { Aluno, AlunoInput } from "../model/Aluno.js";

export interface IAlunoRepository {
    findAll(): Promise<Aluno[]>;
    findById(id: string): Promise<Aluno | null>;
    create(input: AlunoInput): Promise<Aluno>;
    update(id: string, input: AlunoInput): Promise<Aluno | null>;
    remove(id: string): Promise<Aluno | null>;
    searchByKeyword(keyword: string): Promise<Aluno[]>;
    findByPlano(planoId: string): Promise<Aluno[]>;
    existsByPlano(planoId: string): Promise<boolean>;
}
