import { createApp } from "./app.js";
import supabase from "./config/supabase.js";
import PlanoRepository from "./repositories/PlanoRepository.js";
import AlunoRepository from "./repositories/AlunoRepository.js";
import MensalidadeRepository from "./repositories/MensalidadeRepository.js";

const app = createApp({
    planos: new PlanoRepository(supabase),
    alunos: new AlunoRepository(supabase),
    mensalidades: new MensalidadeRepository(supabase),
});
const port = process.env.PORT ?? 3000;
app.listen(port, () => { console.log(`Servidor executando em http://localhost:${port}`); });
