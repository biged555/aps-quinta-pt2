-- Banco existente da primeira etapa: execute este arquivo uma única vez.
-- Não execute após schema.sql atualizado, pois ele já contém esta estrutura.
-- Não remove nem altera os registros de planos e alunos.
BEGIN;

CREATE TABLE public.mensalidades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "alunoId" uuid NOT NULL,
    competencia date NOT NULL,
    valor numeric(10,2) NOT NULL,
    data_vencimento date NOT NULL,
    data_pagamento date,
    status text NOT NULL DEFAULT 'pendente',
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "mensalidades_alunoId_fkey"
        FOREIGN KEY ("alunoId") REFERENCES public.alunos (id) ON DELETE RESTRICT,
    CONSTRAINT mensalidades_aluno_competencia_key UNIQUE ("alunoId", competencia),
    CONSTRAINT mensalidades_competencia_check
        CHECK (isfinite(competencia) AND EXTRACT(DAY FROM competencia) = 1),
    CONSTRAINT mensalidades_valor_check CHECK (valor >= 0 AND valor <= 99999999.99),
    CONSTRAINT mensalidades_vencimento_check CHECK (isfinite(data_vencimento)),
    CONSTRAINT mensalidades_status_check CHECK (status IN ('pendente', 'paga', 'cancelada')),
    CONSTRAINT mensalidades_pagamento_check CHECK (
        (status = 'paga' AND data_pagamento IS NOT NULL AND isfinite(data_pagamento))
        OR (status IN ('pendente', 'cancelada') AND data_pagamento IS NULL)
    )
);

-- A chave única já indexa alunoId. Este índice apoia a ordenação da listagem.
CREATE INDEX mensalidades_competencia_idx ON public.mensalidades (competencia DESC, id);
CREATE INDEX IF NOT EXISTS alunos_plano_id_idx ON public.alunos ("planoId");

-- Protege o histórico inclusive em atualizações/exclusões concorrentes.
CREATE FUNCTION public.proteger_mensalidade_paga()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    IF OLD.status = 'paga' THEN
        RAISE EXCEPTION 'Mensalidades pagas não podem ser alteradas ou excluídas.'
            USING ERRCODE = 'P0001';
    END IF;
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER mensalidades_proteger_pagas
BEFORE UPDATE OR DELETE ON public.mensalidades
FOR EACH ROW EXECUTE FUNCTION public.proteger_mensalidade_paga();

ALTER TABLE public.mensalidades ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mensalidades TO service_role;

COMMIT;
