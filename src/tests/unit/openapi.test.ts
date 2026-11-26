import SwaggerParser from "@apidevtools/swagger-parser";
import { describe, expect, it } from "vitest";
import { openapiDocument } from "../../docs/openapi.js";

describe("contrato OpenAPI", () => {
    it("é um documento OpenAPI 3 válido com referências resolvidas", async () => {
        const document = await SwaggerParser.validate(JSON.parse(JSON.stringify(openapiDocument)), { resolve: { external: false } });
        expect(document.info.title).toContain("Academia System");
    });
    it("documenta o CRUD, pesquisas, filtro e raiz sem duplicar operationIds", () => {
        const ids = new Set<string>();
        let count = 0;
        for (const operations of Object.values(openapiDocument.paths)) {
            for (const operation of Object.values(operations)) {
                expect(ids.has(operation.operationId)).toBe(false);
                ids.add(operation.operationId);
                expect(operation.summary).toBeTruthy();
                count++;
            }
        }
        expect(count).toBe(19);
        for (const entidade of ["planos", "alunos", "mensalidades"] as const) {
            expect(openapiDocument.paths[`/${entidade}`]).toHaveProperty("get");
            expect(openapiDocument.paths[`/${entidade}`]).toHaveProperty("post");
            expect(Object.keys(openapiDocument.paths[`/${entidade}/{id}`]).sort()).toEqual(["delete", "get", "put"]);
        }
    });
});
