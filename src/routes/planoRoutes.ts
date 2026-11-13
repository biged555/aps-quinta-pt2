import { Router } from "express";
import PlanoController from "../controller/PlanoController.js";

export default function criarPlanoRoutes(controller: PlanoController) {
    const router = Router();

    router.get("/", controller.getAll);
    router.get("/search", controller.getByKeyword);
    router.get("/:id", controller.getById);
    router.post("/", controller.create);
    router.put("/:id", controller.update);
    router.delete("/:id", controller.remove);

    return router;
}
