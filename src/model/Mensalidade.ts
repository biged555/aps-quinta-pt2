export type StatusMensalidade = "pendente" | "paga" | "cancelada";

export interface Mensalidade {
    id: string;
    alunoId: string;
    competencia: string;
    valor: number;
    data_vencimento: string;
    data_pagamento: string | null;
    status: StatusMensalidade;
    created_at?: string;
}

export type MensalidadeInput = Omit<Mensalidade, "id" | "created_at">;
