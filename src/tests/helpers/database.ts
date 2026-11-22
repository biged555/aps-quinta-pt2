import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { createApp } from "../../app.js";
import PlanoRepository from "../../repositories/PlanoRepository.js";
import AlunoRepository from "../../repositories/AlunoRepository.js";
import MensalidadeRepository from "../../repositories/MensalidadeRepository.js";

const project = process.env.TEST_DB_PROJECT ?? "";
const url = process.env.TEST_SUPABASE_URL ?? "";
const key = process.env.TEST_SUPABASE_KEY ?? "";
if (!/^academia-test-[a-f0-9]{32}$/.test(project) || !/^http:\/\/127\.0\.0\.1:\d+$/.test(url) || !key) {
    throw new Error("Integração exige o banco descartável. Execute npm run test:integration ou npm test; não use o .env da aplicação.");
}

export const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
        // O Supabase adiciona /rest/v1 no gateway. O PostgREST local atende na raiz.
        fetch: (input, init) => {
            const target = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
            if (target.origin !== url || !target.pathname.startsWith("/rest/v1/")) throw new Error("Destino não permitido nos testes.");
            target.pathname = target.pathname.slice("/rest/v1".length);
            return fetch(target, init);
        },
    },
});

export const repositories = {
    planos: new PlanoRepository(client), alunos: new AlunoRepository(client), mensalidades: new MensalidadeRepository(client),
};
export const app = createApp(repositories);

export function resetDatabase() {
    // TRUNCATE também limpa cobranças pagas sem desabilitar o trigger da aplicação.
    // Só pode atingir o container do projeto aleatório criado pelo runner.
    execFileSync("docker", [
        "compose", "--env-file", "test-infra/compose.env", "-f", "test-infra/compose.yaml", "-p", project,
        "exec", "-T", "db", "psql", "-U", "postgres", "-d", "academia_test", "-v", "ON_ERROR_STOP=1", "-c",
        "TRUNCATE TABLE public.mensalidades, public.alunos, public.planos;",
    ], { stdio: "pipe", timeout: 10000 });
}
