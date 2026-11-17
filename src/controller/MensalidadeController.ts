import type { Request, Response } from "express";
import type MensalidadeService from "../services/MensalidadeService.js";

export default class MensalidadeController {
    constructor(private readonly service: MensalidadeService) {}

    getAll = async (_req: Request, res: Response) => { res.status(200).json(await this.service.getAll()); };
    getById = async (req: Request, res: Response) => { res.status(200).json(await this.service.getById(req.params.id)); };
    create = async (req: Request, res: Response) => { res.status(201).json(await this.service.create(req.body)); };
    update = async (req: Request, res: Response) => { res.status(200).json(await this.service.update(req.params.id, req.body)); };
    remove = async (req: Request, res: Response) => {
        await this.service.remove(req.params.id);
        res.status(200).json({ message: "Mensalidade removida com sucesso." });
    };
}
