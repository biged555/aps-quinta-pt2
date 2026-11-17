import { Router } from "express";
import type MensalidadeController from "../controller/MensalidadeController.js";

export default function criarMensalidadeRoutes(controller: MensalidadeController) {
    const router = Router();
    router.get("/", controller.getAll);
    router.get("/:id", controller.getById);
    router.post("/", controller.create);
    router.put("/:id", controller.update);
    router.delete("/:id", controller.remove);
    return router;
}
