import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

export async function saveCoverageReport(root) {
    const summary = JSON.parse(await readFile(path.join(root, "coverage/coverage-summary.json"), "utf8"));
    const normalized = Object.fromEntries(Object.entries(summary).map(([file, value]) => [
        file === "total" ? file : path.relative(root, file).replaceAll("\\", "/"), value,
    ]));
    const metrics = ["lines", "statements", "functions", "branches"];
    for (const metric of metrics) {
        if (typeof normalized.total?.[metric]?.pct !== "number" || normalized.total[metric].pct < 60) {
            throw new Error(`Cobertura insuficiente: ${metric}. O relatório de entrega não foi atualizado.`);
        }
    }
    const sources = [];
    async function collect(directory) {
        for (const entry of await readdir(directory, { withFileTypes: true })) {
            const file = path.join(directory, entry.name);
            if (entry.isDirectory()) await collect(file);
            else if (file.endsWith(".ts")) sources.push(file);
        }
    }
    await collect(path.join(root, "src"));
    sources.push(path.join(root, "vitest.config.ts"));
    const hash = createHash("sha256");
    for (const file of sources.sort()) {
        hash.update(path.relative(root, file).replaceAll("\\", "/"));
        hash.update((await readFile(file, "utf8")).replaceAll("\r\n", "\n"));
    }
    const rows = Object.entries(normalized).map(([file, values]) =>
        `| ${file} | ${metrics.map(metric => `${values[metric].pct}%`).join(" | ")} |`);
    const report = `# Relatório de cobertura\n\n` +
        `Gerado em: ${new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "medium" }).format(new Date())} (America/Sao_Paulo).\n\n` +
        `Comando: \`npm run test:coverage\`. Provedor: Vitest/V8. Limite global: 60% em cada métrica.\n\n` +
        `SHA-256 dos fontes, testes e configuração Vitest (quebras normalizadas): \`${hash.digest("hex")}\`.\n\n` +
        `| Arquivo | Linhas | Instruções | Funções | Ramificações |\n| --- | --- | --- | --- | --- |\n${rows.join("\n")}\n\n` +
        `Todos os fontes em src são incluídos, mesmo sem execução. Apenas src/tests e src/config são excluídos. ` +
        `Controllers, Services, Repositories, Routes, validadores, middleware e server.ts permanecem na medição.\n\n` +
        `O HTML detalhado é gerado em coverage/index.html; o resumo por arquivo está em ` +
        `[coverage-summary.json](coverage-summary.json). Este relatório só é atualizado após testes e limites aprovados.\n\n` +
        `A integração usa Supertest, cliente Supabase e Repositories reais contra PostgreSQL/PostgREST locais descartáveis. ` +
        `Ela não valida infraestrutura, autenticação ou configurações do projeto Supabase hospedado.\n`;
    await mkdir(path.join(root, "reports"), { recursive: true });
    await writeFile(path.join(root, "reports/coverage-summary.json"), JSON.stringify(normalized, null, 2) + "\n");
    await writeFile(path.join(root, "reports/coverage.md"), report);
}
