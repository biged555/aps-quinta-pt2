# Relatório de cobertura

Gerado em: 25/11/2026, 22:44:21 (America/Sao_Paulo).

Comando: `npm run test:coverage`. Provedor: Vitest/V8. Limite global: 60% em cada métrica.

SHA-256 dos fontes, testes e configuração Vitest (quebras normalizadas): `6c883fd078979b395ad9fb022e7901619a5ec17a751c0185251b34a79ac18f0f`.

| Arquivo | Linhas | Instruções | Funções | Ramificações |
| --- | --- | --- | --- | --- |
| total | 97.99% | 93.59% | 98.73% | 90.26% |
| src/app.ts | 100% | 100% | 100% | 100% |
| src/server.ts | 0% | 0% | 0% | 0% |
| src/controller/AlunoController.ts | 100% | 100% | 100% | 100% |
| src/controller/MensalidadeController.ts | 100% | 100% | 100% | 100% |
| src/controller/PlanoController.ts | 100% | 100% | 100% | 100% |
| src/docs/openapi.ts | 100% | 100% | 100% | 100% |
| src/errors/AppError.ts | 100% | 100% | 100% | 100% |
| src/middlewares/errorHandler.ts | 100% | 100% | 100% | 100% |
| src/model/Aluno.ts | 94.11% | 91.66% | 100% | 93.87% |
| src/model/Mensalidade.ts | 100% | 100% | 100% | 100% |
| src/model/Plano.ts | 100% | 100% | 100% | 100% |
| src/model/validacao.ts | 100% | 100% | 100% | 100% |
| src/repositories/AlunoRepository.ts | 100% | 78.12% | 100% | 55.55% |
| src/repositories/MensalidadeRepository.ts | 100% | 85.71% | 100% | 68.75% |
| src/repositories/PlanoRepository.ts | 100% | 79.16% | 100% | 58.33% |
| src/routes/alunoRoutes.ts | 100% | 100% | 100% | 100% |
| src/routes/mensalidadeRoutes.ts | 100% | 100% | 100% | 100% |
| src/routes/planoRoutes.ts | 100% | 100% | 100% | 100% |
| src/services/AlunoService.ts | 94.44% | 92.68% | 100% | 90.9% |
| src/services/MensalidadeService.ts | 100% | 100% | 100% | 100% |
| src/services/PlanoService.ts | 100% | 96% | 100% | 91.66% |

Todos os fontes em src são incluídos, mesmo sem execução. Apenas src/tests e src/config são excluídos. Controllers, Services, Repositories, Routes, validadores, middleware e server.ts permanecem na medição.

O HTML detalhado é gerado em coverage/index.html; o resumo por arquivo está em [coverage-summary.json](coverage-summary.json). Este relatório só é atualizado após testes e limites aprovados.

A integração usa Supertest, cliente Supabase e Repositories reais contra PostgreSQL/PostgREST locais descartáveis. Ela não valida infraestrutura, autenticação ou configurações do projeto Supabase hospedado.
