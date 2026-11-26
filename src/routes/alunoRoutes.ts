import { Router } from "express";
import AlunoController from "../controller/AlunoController.js";

const router = Router();
const controller = new AlunoController();

router.get("/", controller.getAll);
router.get("/search", controller.getByKeyword);
router.get("/plano/:planoId", controller.getByPlano);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
