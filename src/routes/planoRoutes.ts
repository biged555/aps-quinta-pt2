import { Router } from "express";
import PlanoController from "../controller/PlanoController.js";

const router = Router();
const controller = new PlanoController();

router.get("/", controller.getAll);
router.get("/search", controller.getByKeyword);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
