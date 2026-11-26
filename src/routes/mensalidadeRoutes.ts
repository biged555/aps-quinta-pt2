import { Router } from "express";
import MensalidadeController from "../controller/MensalidadeController.js";

const router = Router();
const controller = new MensalidadeController();
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);
export default router;
