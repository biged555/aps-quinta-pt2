import express from "express";
import planoRoutes from "./routes/planoRoutes.js";
import alunoRoutes from "./routes/alunoRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import mensalidadeRoutes from "./routes/mensalidadeRoutes.js";
import swaggerUi from "swagger-ui-express";
import { openapiDocument } from "./docs/openapi.js";

const app = express();
app.use(express.json());
app.get("/openapi.json", (_req, res) => { res.json(openapiDocument); });
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument, {
    customSiteTitle: "Academia System — Documentação da API",
    swaggerOptions: { validatorUrl: null, displayRequestDuration: true },
}));
app.get("/", (_req, res) => {
    res.status(200).json({ message: "Academia System - API", version: "1.0.0" });
});
app.use("/planos", planoRoutes);
app.use("/alunos", alunoRoutes);
app.use("/mensalidades", mensalidadeRoutes);
app.use((_req, res) => { res.status(404).json({ message: "Rota não encontrada." }); });
app.use(errorHandler);
export default app;
