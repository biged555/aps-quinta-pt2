import { spawn, spawnSync } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { saveCoverageReport } from "./coverage-report.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const project = `academia-test-${randomUUID().replaceAll("-", "")}`;
const compose = ["compose", "--env-file", "test-infra/compose.env", "-f", "test-infra/compose.yaml", "-p", project];
const flags = process.argv.slice(2);
if (flags.some(flag => !["--coverage", "--integration"].includes(flag))) throw new Error("Argumento de testes desconhecido.");

function docker(args, capture = false) {
    const result = spawnSync("docker", args, { cwd: root, encoding: "utf8", stdio: capture ? "pipe" : "inherit" });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Docker falhou (${args[0]}). Verifique se o Docker Desktop está iniciado.`);
    return result.stdout?.trim();
}

function token() {
    const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
    const body = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ role: "service_role", exp: Math.floor(Date.now() / 1000) + 3600 })}`;
    return `${body}.${createHmac("sha256", "academia-test-only-secret-at-least-32-characters").update(body).digest("base64url")}`;
}

let child;
let interrupted = false;
for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => { interrupted = true; child?.kill(signal); });
}

try {
    docker(["info", "--format", "{{.ServerVersion}}"], true);
    console.log(`Preparando banco temporário: ${project}`);
    docker([...compose, "up", "-d"]);
    const address = docker([...compose, "port", "rest", "3000"], true);
    if (!/^127\.0\.0\.1:\d+$/.test(address ?? "")) throw new Error("Porta de testes não é local.");
    const url = `http://${address}`;
    const key = token();
    let ready = false;
    for (let i = 0; i < 60 && !interrupted; i++) {
        try {
            const response = await fetch(`${url}/planos?limit=0`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(1500) });
            if (response.ok) { ready = true; break; }
        } catch { /* aguarda a inicialização do PostgREST */ }
        await delay(1000);
    }
    if (!ready) throw new Error("O banco de testes não ficou pronto ou a execução foi interrompida.");
    const args = ["node_modules/vitest/vitest.mjs", "run"];
    if (flags.includes("--integration")) args.push("src/tests/integration");
    if (flags.includes("--coverage")) args.push("--coverage");
    const code = await new Promise((resolve, reject) => {
        child = spawn(process.execPath, args, {
            cwd: root, stdio: "inherit",
            env: { ...process.env, NODE_ENV: "test", TEST_DB_PROJECT: project, TEST_SUPABASE_URL: url, TEST_SUPABASE_KEY: key },
        });
        child.once("error", reject);
        child.once("exit", code => resolve(code ?? 1));
    });
    process.exitCode = interrupted ? 1 : Number(code);
    if (process.exitCode === 0 && flags.includes("--coverage")) await saveCoverageReport(root);
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
} finally {
    // Somente o projeto exclusivo desta execução é removido, inclusive após falhas.
    try { docker([...compose, "down", "--volumes", "--remove-orphans"]); }
    catch { console.error(`Limpeza pendente: docker ${compose.join(" ")} down --volumes --remove-orphans`); process.exitCode = 1; }
}
