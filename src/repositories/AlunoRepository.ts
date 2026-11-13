import type { SupabaseClient } from "@supabase/supabase-js";
import type { Aluno, AlunoInput } from "../model/Aluno.js";
import type { IAlunoRepository } from "./IAlunoRepository.js";
import { RepositoryError } from "../errors/AppError.js";

export default class AlunoRepository implements IAlunoRepository {
    constructor(private readonly client: SupabaseClient) {}

    async findAll(): Promise<Aluno[]> {
        const { data, error } = await this.client.from("alunos").select("*").order("nome", { ascending: true });
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Aluno[];
    }

    async findById(id: string): Promise<Aluno | null> {
        const { data, error } = await this.client.from("alunos").select("*").eq("id", id).maybeSingle();
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Aluno | null;
    }

    async create(input: AlunoInput): Promise<Aluno> {
        const { data, error } = await this.client.from("alunos").insert(input).select().single();
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Aluno;
    }

    async update(id: string, input: AlunoInput): Promise<Aluno | null> {
        const { data, error } = await this.client.from("alunos").update(input).eq("id", id).select().maybeSingle();
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Aluno | null;
    }

    async remove(id: string): Promise<Aluno | null> {
        const { data, error } = await this.client.from("alunos").delete().eq("id", id).select().maybeSingle();
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Aluno | null;
    }

    async searchByKeyword(keyword: string): Promise<Aluno[]> {
        const { data, error } = await this.client.from("alunos").select("*").or(`nome.ilike.%${keyword}%,email.ilike.%${keyword}%`).order("nome", { ascending: true });
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Aluno[];
    }

    async findByPlano(planoId: string): Promise<Aluno[]> {
        const { data, error } = await this.client.from("alunos").select("*").eq("planoId", planoId).order("nome", { ascending: true });
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Aluno[];
    }

    async existsByPlano(planoId: string): Promise<boolean> {
        const { count, error } = await this.client.from("alunos").select("id", { count: "exact", head: true }).eq("planoId", planoId);
        if (error) throw new RepositoryError(error.code, error.message);
        return (count ?? 0) > 0;
    }
}
