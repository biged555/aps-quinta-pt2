import type { Request, Response } from "express";
import type AlunoService from "../services/AlunoService.js";

export default class AlunoController {
    constructor(private readonly service: AlunoService) {}

    getAll = async (_req: Request, res: Response) => { res.status(200).json(await this.service.getAll()); };
    getByKeyword = async (req: Request, res: Response) => { res.status(200).json(await this.service.getByKeyword(req.query.keyword)); };
    getById = async (req: Request, res: Response) => { res.status(200).json(await this.service.getById(req.params.id)); };
    create = async (req: Request, res: Response) => { res.status(201).json(await this.service.create(req.body)); };
    update = async (req: Request, res: Response) => { res.status(200).json(await this.service.update(req.params.id, req.body)); };
    remove = async (req: Request, res: Response) => {
        await this.service.remove(req.params.id);
        res.status(200).json({ message: "Aluno removido com sucesso." });
    };
    getByPlano = async (req: Request, res: Response) => { res.status(200).json(await this.service.getByPlano(req.params.planoId)); };
}
