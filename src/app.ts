import express from "express";
import criarPlanoRoutes from "./routes/planoRoutes.js";
import criarAlunoRoutes from "./routes/alunoRoutes.js";
import PlanoController from "./controller/PlanoController.js";
import AlunoController from "./controller/AlunoController.js";
import PlanoService from "./services/PlanoService.js";
import AlunoService from "./services/AlunoService.js";
import type { IPlanoRepository } from "./repositories/IPlanoRepository.js";
import type { IAlunoRepository } from "./repositories/IAlunoRepository.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import type { IMensalidadeRepository } from "./repositories/IMensalidadeRepository.js";
import MensalidadeService from "./services/MensalidadeService.js";
import MensalidadeController from "./controller/MensalidadeController.js";
import criarMensalidadeRoutes from "./routes/mensalidadeRoutes.js";

export function createApp(repositories: { planos: IPlanoRepository; alunos: IAlunoRepository; mensalidades: IMensalidadeRepository }) {
    const app = express();
    app.use(express.json());
    app.get("/", (_req, res) => {
        res.status(200).json({ message: "Academia System - API", version: "1.0.0" });
    });
    const planoService = new PlanoService(repositories.planos, repositories.alunos);
    const alunoService = new AlunoService(repositories.alunos, repositories.planos, repositories.mensalidades);
    const mensalidadeService = new MensalidadeService(repositories.mensalidades, repositories.alunos);
    app.use("/planos", criarPlanoRoutes(new PlanoController(planoService)));
    app.use("/alunos", criarAlunoRoutes(new AlunoController(alunoService)));
    app.use("/mensalidades", criarMensalidadeRoutes(new MensalidadeController(mensalidadeService)));
    app.use((_req, res) => { res.status(404).json({ message: "Rota não encontrada." }); });
    app.use(errorHandler);
    return app;
}
