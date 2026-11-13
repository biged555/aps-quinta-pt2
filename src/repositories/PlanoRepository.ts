import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plano, PlanoInput } from "../model/Plano.js";
import type { IPlanoRepository } from "./IPlanoRepository.js";
import { RepositoryError } from "../errors/AppError.js";

export default class PlanoRepository implements IPlanoRepository {
    constructor(private readonly client: SupabaseClient) {}

    async findAll(): Promise<Plano[]> {
        const { data, error } = await this.client.from("planos").select("*").order("ordem_exibicao", { ascending: true });
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Plano[];
    }

    async findById(id: string): Promise<Plano | null> {
        const { data, error } = await this.client.from("planos").select("*").eq("id", id).maybeSingle();
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Plano | null;
    }

    async create(input: PlanoInput): Promise<Plano> {
        const { data, error } = await this.client.from("planos").insert(input).select().single();
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Plano;
    }

    async update(id: string, input: PlanoInput): Promise<Plano | null> {
        const { data, error } = await this.client.from("planos").update(input).eq("id", id).select().maybeSingle();
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Plano | null;
    }

    async remove(id: string): Promise<Plano | null> {
        const { data, error } = await this.client.from("planos").delete().eq("id", id).select().maybeSingle();
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Plano | null;
    }

    async searchByKeyword(keyword: string): Promise<Plano[]> {
        const { data, error } = await this.client.from("planos").select("*").or(`nome.ilike.%${keyword}%,descricao.ilike.%${keyword}%`).order("ordem_exibicao", { ascending: true });
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Plano[];
    }
}
