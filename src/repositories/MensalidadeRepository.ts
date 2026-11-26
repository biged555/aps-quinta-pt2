import supabase from "../config/supabase.js";
import type { Mensalidade, MensalidadeInput } from "../model/Mensalidade.js";
import { RepositoryError } from "../errors/AppError.js";

class MensalidadeRepository {
    async findAll(): Promise<Mensalidade[]> {
        const { data, error } = await supabase.from("mensalidades").select("*")
            .order("competencia", { ascending: false }).order("id", { ascending: true });
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Mensalidade[];
    }

    async findById(id: string): Promise<Mensalidade | null> {
        const { data, error } = await supabase.from("mensalidades").select("*").eq("id", id).maybeSingle();
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Mensalidade | null;
    }

    async findByAlunoCompetencia(alunoId: string, competencia: string): Promise<Mensalidade | null> {
        const { data, error } = await supabase.from("mensalidades").select("*")
            .eq("alunoId", alunoId).eq("competencia", competencia).maybeSingle();
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Mensalidade | null;
    }

    async existsByAluno(alunoId: string): Promise<boolean> {
        const { count, error } = await supabase.from("mensalidades").select("id", { count: "exact", head: true }).eq("alunoId", alunoId);
        if (error) throw new RepositoryError(error.code, error.message);
        return (count ?? 0) > 0;
    }

    async create(input: MensalidadeInput): Promise<Mensalidade> {
        const { data, error } = await supabase.from("mensalidades").insert(input).select().single();
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Mensalidade;
    }

    async update(id: string, input: MensalidadeInput): Promise<Mensalidade | null> {
        const { data, error } = await supabase.from("mensalidades").update(input).eq("id", id).select().maybeSingle();
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Mensalidade | null;
    }

    async remove(id: string): Promise<Mensalidade | null> {
        const { data, error } = await supabase.from("mensalidades").delete().eq("id", id).select().maybeSingle();
        if (error) throw new RepositoryError(error.code, error.message);
        return data as Mensalidade | null;
    }
}

export default new MensalidadeRepository();
