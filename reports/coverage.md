# Relatório de cobertura

Gerado em: 22/11/2026, 15:48:29 (America/Sao_Paulo).

Comando: `npm run test:coverage`. Provedor: Vitest/V8. Limite global: 60% em cada métrica.

SHA-256 dos fontes, testes e configuração Vitest (quebras normalizadas): `cd88d22b2f7a902c624db0981c46f2c8d8361b86f205243b1d20d8e03d4d34b6`.

| Arquivo | Linhas | Instruções | Funções | Ramificações |
| --- | --- | --- | --- | --- |
| total | 97.42% | 93.17% | 98.92% | 89.81% |
| src/app.ts | 100% | 100% | 100% | 100% |
| src/server.ts | 0% | 0% | 0% | 0% |
| src/controller/AlunoController.ts | 100% | 100% | 100% | 100% |
| src/controller/MensalidadeController.ts | 100% | 100% | 100% | 100% |
| src/controller/PlanoController.ts | 100% | 100% | 100% | 100% |
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
