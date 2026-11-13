import type { Plano, PlanoInput } from "../model/Plano.js";

export interface IPlanoRepository {
    findAll(): Promise<Plano[]>;
    findById(id: string): Promise<Plano | null>;
    create(input: PlanoInput): Promise<Plano>;
    update(id: string, input: PlanoInput): Promise<Plano | null>;
    remove(id: string): Promise<Plano | null>;
    searchByKeyword(keyword: string): Promise<Plano[]>;
}
