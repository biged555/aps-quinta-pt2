-- Execute primeiro este arquivo no SQL Editor do Supabase.
-- Destinado a um banco onde as tabelas ainda não foram criadas.
BEGIN;

CREATE TABLE public.planos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    descricao text NOT NULL,
    icon text NOT NULL,
    ordem_exibicao int4 NOT NULL DEFAULT 0,
    valor_mensal numeric NOT NULL DEFAULT 0,
    duracao_meses int4 NOT NULL DEFAULT 1,
    ativo bool NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.alunos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "planoId" uuid NOT NULL,
    nome text NOT NULL,
    descricao text NOT NULL,
    email text NOT NULL,
    telefone text NOT NULL,
    data_nascimento date NOT NULL,
    valor_mensalidade numeric NOT NULL DEFAULT 0,
    ativo bool NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT "alunos_planoId_fkey"
        FOREIGN KEY ("planoId") REFERENCES public.planos (id)
);

-- A aplicação acessa as tabelas pelo servidor com a chave de serviço.
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

COMMIT;
