-- Execute depois de schema.sql no SQL Editor do Supabase.
-- Execute uma única vez: cada execução insere novos registros de exemplo.
-- Os alunos usam os UUIDs dos planos criados nesta mesma execução.
BEGIN;

WITH planos_inseridos AS (
    INSERT INTO public.planos
        (nome, descricao, icon, ordem_exibicao, valor_mensal, duracao_meses, ativo)
    VALUES
        ('Musculação', 'Treino de força com pesos livres e máquinas.', '💪', 1, 129.90, 12, true),
        ('Cross Training', 'Treino funcional de alta intensidade.', '🏋️', 2, 189.90, 6, true),
        ('Funcional', 'Aulas em grupo com foco em condicionamento.', '🤸', 3, 149.90, 6, true),
        ('Natação', 'Aulas de natação para adultos.', '🏊', 4, 219.90, 12, false)
    RETURNING id, nome
)
INSERT INTO public.alunos
    ("planoId", nome, descricao, email, telefone, data_nascimento, valor_mensalidade, ativo)
SELECT
    planos.id,
    exemplos.nome,
    exemplos.descricao,
    exemplos.email,
    exemplos.telefone,
    exemplos.data_nascimento,
    exemplos.valor_mensalidade,
    exemplos.ativo
FROM (
    VALUES
        ('Musculação', 'Eduardo Lopes', 'Aluno iniciante, foco em hipertrofia.',
         'eduardo.lopes@email.com', '(41) 99999-1111', DATE '2003-05-14', 129.90, true),
        ('Cross Training', 'Diogo Yudi', 'Aluno intermediário, foco em condicionamento.',
         'diogo.yudi@email.com', '(41) 98888-2222', DATE '2002-11-02', 189.90, true)
) AS exemplos (plano_nome, nome, descricao, email, telefone, data_nascimento, valor_mensalidade, ativo)
JOIN planos_inseridos AS planos ON planos.nome = exemplos.plano_nome;

COMMIT;
