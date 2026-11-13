export interface Plano {
    id: string;
    created_at?: string | null;
    nome: string;
    descricao: string;
    icon: string;
    ordem_exibicao: number;
    valor_mensal: number;
    duracao_meses: number;
    ativo: boolean;
}

export type PlanoInput = Omit<Plano, "id" | "created_at">;
