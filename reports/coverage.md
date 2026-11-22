# Relatório de cobertura

Gerado em: 22/11/2026, 16:17:57 (America/Sao_Paulo).

Comando: `npm run test:coverage`. Provedor: Vitest/V8. Limite global: 60% em cada métrica.

SHA-256 dos fontes, testes e configuração Vitest (quebras normalizadas): `9c99fa94693385d0093c18bd0c5aad3e58d665a5c57f5d81fbd4662b0a0faf74`.

| Arquivo | Linhas | Instruções | Funções | Ramificações |
| --- | --- | --- | --- | --- |
| total | 97.45% | 93.24% | 98.93% | 89.81% |
| src/app.ts | 100% | 100% | 100% | 100% |
| src/server.ts | 0% | 0% | 0% | 0% |
| src/controller/AlunoController.ts | 100% | 100% | 100% | 100% |
| src/controller/MensalidadeController.ts | 100% | 100% | 100% | 100% |
| src/controller/PlanoController.ts | 100% | 100% | 100% | 100% |
| src/docs/openapi.ts | 100% | 100% | 100% | 100% |
| src/errors/AppError.ts | 100% | 100% | 100% | 100% |
| src/middlewares/errorHandler.ts | 100% | 100% | 100% | 100% |
| src/model/Aluno.ts | 0% | 0% | 0% | 0% |
| src/model/Mensalidade.ts | 0% | 0% | 0% | 0% |
| src/model/Plano.ts | 0% | 0% | 0% | 0% |
| src/repositories/AlunoRepository.ts | 100% | 78.78% | 100% | 55.55% |
| src/repositories/IAlunoRepository.ts | 0% | 0% | 0% | 0% |
| src/repositories/IMensalidadeRepository.ts | 0% | 0% | 0% | 0% |
| src/repositories/IPlanoRepository.ts | 0% | 0% | 0% | 0% |
| src/repositories/MensalidadeRepository.ts | 100% | 86.2% | 100% | 68.75% |
| src/repositories/PlanoRepository.ts | 100% | 80% | 100% | 58.33% |
| src/routes/alunoRoutes.ts | 100% | 100% | 100% | 100% |
| src/routes/mensalidadeRoutes.ts | 100% | 100% | 100% | 100% |
| src/routes/planoRoutes.ts | 100% | 100% | 100% | 100% |
| src/services/AlunoService.ts | 94.73% | 93.18% | 100% | 90.9% |
| src/services/MensalidadeService.ts | 100% | 100% | 100% | 100% |
| src/services/PlanoService.ts | 100% | 96.29% | 100% | 91.66% |
| src/validators/alunoValidator.ts | 92.1% | 90% | 100% | 92.45% |
| src/validators/common.ts | 100% | 100% | 100% | 100% |
| src/validators/mensalidadeValidator.ts | 100% | 100% | 100% | 100% |
| src/validators/planoValidator.ts | 96% | 96.29% | 100% | 97.72% |

Todos os fontes em src são incluídos, mesmo sem execução. Apenas src/tests e src/config são excluídos. Controllers, Services, Repositories, Routes, validadores, middleware e server.ts permanecem na medição.

O HTML detalhado é gerado em coverage/index.html; o resumo por arquivo está em [coverage-summary.json](coverage-summary.json). Este relatório só é atualizado após testes e limites aprovados.

A integração usa Supertest, cliente Supabase e Repositories reais contra PostgreSQL/PostgREST locais descartáveis. Ela não valida infraestrutura, autenticação ou configurações do projeto Supabase hospedado.
