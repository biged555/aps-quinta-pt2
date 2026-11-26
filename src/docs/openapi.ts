// Documentação das rotas, entradas e respostas da API.
export const openapiDocument = {
  "openapi": "3.0.3",
  "info": {
    "title": "Academia System — API REST",
    "version": "1.0.0",
    "description": "Gestão de planos, alunos e mensalidades. A API não implementa autenticação de usuários. A chave do Supabase pertence somente ao servidor e não deve ser informada no Swagger. Try it out executa requisições reais na instância aberta."
  },
  "servers": [{"url": "/", "description": "Mesma origem da documentação"}],
  "tags": [{"name": "Sistema"},{"name": "Planos"},{"name": "Alunos"},{"name": "Mensalidades"}],
  "paths": {
    "/": {
      "get": {
        "tags": ["Sistema"],
        "operationId": "consultarSistema",
        "summary": "Identificar a API",
        "responses": {
          "200": {
            "description": "Operação concluída.",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["message", "version"],
                  "properties": {
                    "message": {"type": "string", "example": "Academia System - API"},
                    "version": {"type": "string", "example": "1.0.0"}
                  }
                }
              }
            }
          }
        }
      }
    },
    "/planos": {
      "get": {
        "tags": ["Planos"],
        "operationId": "listarPlanos",
        "summary": "Listar planos",
        "description": "Ordenação por ordem_exibicao crescente. Sem registros, retorna [].",
        "responses": {
          "200": {
            "description": "Operação concluída.",
            "content": {"application/json": {"schema": {"type": "array", "items": {"$ref": "#/components/schemas/Plano"}}}}
          },
          "500": {"$ref": "#/components/responses/500"}
        }
      },
      "post": {
        "tags": ["Planos"],
        "operationId": "criarPlano",
        "summary": "Criar plano",
        "description": "Cadastra um plano.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {"$ref": "#/components/schemas/PlanoInput"},
              "examples": {
                "cadastro": {
                  "summary": "Dados de exemplo; substitua os UUIDs pelos IDs cadastrados.",
                  "value": {
                    "nome": "Musculação",
                    "descricao": "Treino de força com pesos livres e máquinas.",
                    "icon": "💪",
                    "ordem_exibicao": 1,
                    "valor_mensal": 129.9,
                    "duracao_meses": 12,
                    "ativo": true
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Registro criado com UUID automático.",
            "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Plano"}}}
          },
          "400": {"$ref": "#/components/responses/400"},
          "413": {"$ref": "#/components/responses/413"},
          "500": {"$ref": "#/components/responses/500"}
        }
      }
    },
    "/planos/{id}": {
      "get": {
        "tags": ["Planos"],
        "operationId": "consultarPlano",
        "summary": "Consultar plano por ID",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "UUID do registro.",
            "schema": {"type": "string", "format": "uuid", "example": "11111111-1111-4111-8111-111111111111"}
          }
        ],
        "responses": {
          "200": {
            "description": "Operação concluída.",
            "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Plano"}}}
          },
          "400": {"$ref": "#/components/responses/400"},
          "404": {"$ref": "#/components/responses/404"},
          "500": {"$ref": "#/components/responses/500"}
        }
      },
      "put": {
        "tags": ["Planos"],
        "operationId": "atualizarPlano",
        "summary": "Atualizar plano",
        "description": "Substitui os campos editáveis; desativar não remove vínculos existentes.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "UUID do registro.",
            "schema": {"type": "string", "format": "uuid", "example": "11111111-1111-4111-8111-111111111111"}
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {"$ref": "#/components/schemas/PlanoInput"},
              "examples": {
                "cadastro": {
                  "summary": "Dados de exemplo; substitua os UUIDs pelos IDs cadastrados.",
                  "value": {
                    "nome": "Musculação",
                    "descricao": "Treino de força com pesos livres e máquinas.",
                    "icon": "💪",
                    "ordem_exibicao": 1,
                    "valor_mensal": 129.9,
                    "duracao_meses": 12,
                    "ativo": true
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Operação concluída.",
            "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Plano"}}}
          },
          "400": {"$ref": "#/components/responses/400"},
          "404": {"$ref": "#/components/responses/404"},
          "413": {"$ref": "#/components/responses/413"},
          "500": {"$ref": "#/components/responses/500"}
        }
      },
      "delete": {
        "tags": ["Planos"],
        "operationId": "excluirPlano",
        "summary": "Excluir plano",
        "description": "Bloqueado quando há alunos vinculados.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "UUID do registro.",
            "schema": {"type": "string", "format": "uuid", "example": "11111111-1111-4111-8111-111111111111"}
          }
        ],
        "responses": {
          "200": {
            "description": "Exclusão concluída, com mensagem JSON.",
            "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Mensagem"}}}
          },
          "400": {"$ref": "#/components/responses/400"},
          "404": {"$ref": "#/components/responses/404"},
          "409": {"$ref": "#/components/responses/409"},
          "500": {"$ref": "#/components/responses/500"}
        }
      }
    },
    "/planos/search": {
      "get": {
        "tags": ["Planos"],
        "operationId": "pesquisarPlanos",
        "summary": "Pesquisar planos",
        "description": "Busca parcial sem diferenciar maiúsculas em nome e descricao. Não aceita vírgulas, parênteses, aspas, barra invertida ou curingas %/*; espaços externos são removidos.",
        "parameters": [
          {
            "name": "keyword",
            "in": "query",
            "required": true,
            "schema": {"type": "string", "minLength": 1},
            "example": "muscula"
          }
        ],
        "responses": {
          "200": {
            "description": "Operação concluída.",
            "content": {"application/json": {"schema": {"type": "array", "items": {"$ref": "#/components/schemas/Plano"}}}}
          },
          "400": {"$ref": "#/components/responses/400"},
          "500": {"$ref": "#/components/responses/500"}
        }
      }
    },
    "/alunos": {
      "get": {
        "tags": ["Alunos"],
        "operationId": "listarAlunos",
        "summary": "Listar alunos",
        "description": "Ordenação por nome crescente. Sem registros, retorna [].",
        "responses": {
          "200": {
            "description": "Operação concluída.",
            "content": {"application/json": {"schema": {"type": "array", "items": {"$ref": "#/components/schemas/Aluno"}}}}
          },
          "500": {"$ref": "#/components/responses/500"}
        }
      },
      "post": {
        "tags": ["Alunos"],
        "operationId": "criarAluno",
        "summary": "Criar aluno",
        "description": "Exige plano existente e ativo. Valor negociado pode diferir do preço do plano.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {"$ref": "#/components/schemas/AlunoInput"},
              "examples": {
                "cadastro": {
                  "summary": "Dados de exemplo; substitua os UUIDs pelos IDs cadastrados.",
                  "value": {
                    "planoId": "11111111-1111-4111-8111-111111111111",
                    "nome": "Eduardo Lopes",
                    "descricao": "Aluno iniciante, foco em hipertrofia.",
                    "email": "eduardo@example.com",
                    "telefone": "(41) 99999-1111",
                    "data_nascimento": "2003-05-14",
                    "valor_mensalidade": 119.9,
                    "ativo": true
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Registro criado com UUID automático.",
            "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Aluno"}}}
          },
          "400": {"$ref": "#/components/responses/400"},
          "409": {"$ref": "#/components/responses/409"},
          "413": {"$ref": "#/components/responses/413"},
          "500": {"$ref": "#/components/responses/500"}
        }
      }
    },
    "/alunos/{id}": {
      "get": {
        "tags": ["Alunos"],
        "operationId": "consultarAluno",
        "summary": "Consultar aluno por ID",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "UUID do registro.",
            "schema": {"type": "string", "format": "uuid", "example": "11111111-1111-4111-8111-111111111111"}
          }
        ],
        "responses": {
          "200": {
            "description": "Operação concluída.",
            "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Aluno"}}}
          },
          "400": {"$ref": "#/components/responses/400"},
          "404": {"$ref": "#/components/responses/404"},
          "500": {"$ref": "#/components/responses/500"}
        }
      },
      "put": {
        "tags": ["Alunos"],
        "operationId": "atualizarAluno",
        "summary": "Atualizar aluno",
        "description": "Substitui os campos editáveis. Transferência exige plano ativo; manter um plano desativado é permitido.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "UUID do registro.",
            "schema": {"type": "string", "format": "uuid", "example": "11111111-1111-4111-8111-111111111111"}
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {"$ref": "#/components/schemas/AlunoInput"},
              "examples": {
                "cadastro": {
                  "summary": "Dados de exemplo; substitua os UUIDs pelos IDs cadastrados.",
                  "value": {
                    "planoId": "11111111-1111-4111-8111-111111111111",
                    "nome": "Eduardo Lopes",
                    "descricao": "Aluno iniciante, foco em hipertrofia.",
                    "email": "eduardo@example.com",
                    "telefone": "(41) 99999-1111",
                    "data_nascimento": "2003-05-14",
                    "valor_mensalidade": 119.9,
                    "ativo": true
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Operação concluída.",
            "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Aluno"}}}
          },
          "400": {"$ref": "#/components/responses/400"},
          "404": {"$ref": "#/components/responses/404"},
          "409": {"$ref": "#/components/responses/409"},
          "413": {"$ref": "#/components/responses/413"},
          "500": {"$ref": "#/components/responses/500"}
        }
      },
      "delete": {
        "tags": ["Alunos"],
        "operationId": "excluirAluno",
        "summary": "Excluir aluno",
        "description": "Bloqueado quando há mensalidades vinculadas, de qualquer status.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "UUID do registro.",
            "schema": {"type": "string", "format": "uuid", "example": "11111111-1111-4111-8111-111111111111"}
          }
        ],
        "responses": {
          "200": {
            "description": "Exclusão concluída, com mensagem JSON.",
            "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Mensagem"}}}
          },
          "400": {"$ref": "#/components/responses/400"},
          "404": {"$ref": "#/components/responses/404"},
          "409": {"$ref": "#/components/responses/409"},
          "500": {"$ref": "#/components/responses/500"}
        }
      }
    },
    "/alunos/search": {
      "get": {
        "tags": ["Alunos"],
        "operationId": "pesquisarAlunos",
        "summary": "Pesquisar alunos",
        "description": "Busca parcial sem diferenciar maiúsculas em nome e email. Não aceita vírgulas, parênteses, aspas, barra invertida ou curingas %/*; espaços externos são removidos.",
        "parameters": [
          {
            "name": "keyword",
            "in": "query",
            "required": true,
            "schema": {"type": "string", "minLength": 1},
            "example": "eduardo"
          }
        ],
        "responses": {
          "200": {
            "description": "Operação concluída.",
            "content": {"application/json": {"schema": {"type": "array", "items": {"$ref": "#/components/schemas/Aluno"}}}}
          },
          "400": {"$ref": "#/components/responses/400"},
          "500": {"$ref": "#/components/responses/500"}
        }
      }
    },
    "/mensalidades": {
      "get": {
        "tags": ["Mensalidades"],
        "operationId": "listarMensalidades",
        "summary": "Listar mensalidades",
        "description": "Competência decrescente, com desempate por ID crescente. Sem registros, retorna [].",
        "responses": {
          "200": {
            "description": "Operação concluída.",
            "content": {
              "application/json": {"schema": {"type": "array", "items": {"$ref": "#/components/schemas/Mensalidade"}}}
            }
          },
          "500": {"$ref": "#/components/responses/500"}
        }
      },
      "post": {
        "tags": ["Mensalidades"],
        "operationId": "criarMensalidade",
        "summary": "Criar mensalidade",
        "description": "Exige aluno ativo e competência livre. O valor informado é preservado como histórico.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {"$ref": "#/components/schemas/MensalidadeInput"},
              "examples": {
                "cadastro": {
                  "summary": "Dados de exemplo; substitua os UUIDs pelos IDs cadastrados.",
                  "value": {
                    "alunoId": "11111111-1111-4111-8111-111111111111",
                    "competencia": "2026-11-01",
                    "valor": 119.9,
                    "data_vencimento": "2026-11-10",
                    "data_pagamento": null,
                    "status": "pendente"
                  }
                },
                "pagamento": {
                  "summary": "Pagamento: use uma data não futura.",
                  "value": {
                    "alunoId": "11111111-1111-4111-8111-111111111111",
                    "competencia": "2026-11-01",
                    "valor": 119.9,
                    "data_vencimento": "2026-11-10",
                    "data_pagamento": "2026-11-17",
                    "status": "paga"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Registro criado com UUID automático.",
            "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Mensalidade"}}}
          },
          "400": {"$ref": "#/components/responses/400"},
          "409": {"$ref": "#/components/responses/409"},
          "413": {"$ref": "#/components/responses/413"},
          "500": {"$ref": "#/components/responses/500"}
        }
      }
    },
    "/mensalidades/{id}": {
      "get": {
        "tags": ["Mensalidades"],
        "operationId": "consultarMensalidade",
        "summary": "Consultar mensalidade por ID",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "UUID do registro.",
            "schema": {"type": "string", "format": "uuid", "example": "11111111-1111-4111-8111-111111111111"}
          }
        ],
        "responses": {
          "200": {
            "description": "Operação concluída.",
            "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Mensalidade"}}}
          },
          "400": {"$ref": "#/components/responses/400"},
          "404": {"$ref": "#/components/responses/404"},
          "500": {"$ref": "#/components/responses/500"}
        }
      },
      "put": {
        "tags": ["Mensalidades"],
        "operationId": "atualizarMensalidade",
        "summary": "Atualizar mensalidade",
        "description": "Substitui os campos editáveis. Paga é imutável; pendente/cancelada pode ser corrigida, paga ou cancelada. Permite quitar cobrança antiga de aluno inativo mantendo o vínculo.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "UUID do registro.",
            "schema": {"type": "string", "format": "uuid", "example": "11111111-1111-4111-8111-111111111111"}
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {"$ref": "#/components/schemas/MensalidadeInput"},
              "examples": {
                "cadastro": {
                  "summary": "Dados de exemplo; substitua os UUIDs pelos IDs cadastrados.",
                  "value": {
                    "alunoId": "11111111-1111-4111-8111-111111111111",
                    "competencia": "2026-11-01",
                    "valor": 119.9,
                    "data_vencimento": "2026-11-10",
                    "data_pagamento": null,
                    "status": "pendente"
                  }
                },
                "pagamento": {
                  "summary": "Pagamento: use uma data não futura.",
                  "value": {
                    "alunoId": "11111111-1111-4111-8111-111111111111",
                    "competencia": "2026-11-01",
                    "valor": 119.9,
                    "data_vencimento": "2026-11-10",
                    "data_pagamento": "2026-11-17",
                    "status": "paga"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Operação concluída.",
            "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Mensalidade"}}}
          },
          "400": {"$ref": "#/components/responses/400"},
          "404": {"$ref": "#/components/responses/404"},
          "409": {"$ref": "#/components/responses/409"},
          "413": {"$ref": "#/components/responses/413"},
          "500": {"$ref": "#/components/responses/500"}
        }
      },
      "delete": {
        "tags": ["Mensalidades"],
        "operationId": "excluirMensalidade",
        "summary": "Excluir mensalidade",
        "description": "Somente pendente ou cancelada pode ser excluída.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "UUID do registro.",
            "schema": {"type": "string", "format": "uuid", "example": "11111111-1111-4111-8111-111111111111"}
          }
        ],
        "responses": {
          "200": {
            "description": "Exclusão concluída, com mensagem JSON.",
            "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Mensagem"}}}
          },
          "400": {"$ref": "#/components/responses/400"},
          "404": {"$ref": "#/components/responses/404"},
          "409": {"$ref": "#/components/responses/409"},
          "500": {"$ref": "#/components/responses/500"}
        }
      }
    },
    "/alunos/plano/{planoId}": {
      "get": {
        "tags": ["Alunos"],
        "operationId": "listarAlunosPorPlano",
        "summary": "Listar alunos de um plano",
        "description": "Ordenação por nome. UUID válido sem alunos retorna [], mesmo se o plano não existir.",
        "parameters": [
          {
            "name": "planoId",
            "in": "path",
            "required": true,
            "description": "UUID do registro.",
            "schema": {"type": "string", "format": "uuid", "example": "11111111-1111-4111-8111-111111111111"}
          }
        ],
        "responses": {
          "200": {
            "description": "Operação concluída.",
            "content": {"application/json": {"schema": {"type": "array", "items": {"$ref": "#/components/schemas/Aluno"}}}}
          },
          "400": {"$ref": "#/components/responses/400"},
          "500": {"$ref": "#/components/responses/500"}
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Erro": {
        "type": "object",
        "required": ["message"],
        "properties": {
          "message": {"type": "string", "minLength": 1, "example": "Dados inválidos."},
          "erros": {"type": "array", "items": {"type": "string"}, "example": ["O campo nome é obrigatório."]}
        }
      },
      "Mensagem": {
        "type": "object",
        "required": ["message"],
        "properties": {"message": {"type": "string", "minLength": 1, "example": "Registro removido com sucesso."}}
      },
      "PlanoInput": {
        "type": "object",
        "required": ["nome", "descricao", "icon", "ordem_exibicao", "valor_mensal", "duracao_meses", "ativo"],
        "properties": {
          "nome": {"type": "string", "minLength": 1, "example": "Musculação"},
          "descricao": {"type": "string", "minLength": 1, "example": "Treino de força com pesos livres e máquinas."},
          "icon": {"type": "string", "minLength": 1, "example": "💪"},
          "ordem_exibicao": {"type": "integer", "minimum": 0, "example": 1},
          "valor_mensal": {"type": "number", "minimum": 0, "example": 129.9},
          "duracao_meses": {"type": "integer", "minimum": 1, "example": 12},
          "ativo": {"type": "boolean", "example": true}
        },
        "description": "Corpo completo para POST e PUT. Não envie id ou created_at: a API os rejeita. Campos adicionais são ignorados."
      },
      "Plano": {
        "type": "object",
        "required": ["id", "nome", "descricao", "icon", "ordem_exibicao", "valor_mensal", "duracao_meses", "ativo", "created_at"],
        "properties": {
          "id": {"type": "string", "format": "uuid", "example": "11111111-1111-4111-8111-111111111111", "readOnly": true},
          "nome": {"type": "string", "minLength": 1, "example": "Musculação"},
          "descricao": {"type": "string", "minLength": 1, "example": "Treino de força com pesos livres e máquinas."},
          "icon": {"type": "string", "minLength": 1, "example": "💪"},
          "ordem_exibicao": {"type": "integer", "minimum": 0, "example": 1},
          "valor_mensal": {"type": "number", "minimum": 0, "example": 129.9},
          "duracao_meses": {"type": "integer", "minimum": 1, "example": 12},
          "ativo": {"type": "boolean", "example": true},
          "created_at": {
            "type": "string",
            "format": "date-time",
            "readOnly": true,
            "nullable": true,
            "example": "2026-11-01T12:00:00Z"
          }
        }
      },
      "AlunoInput": {
        "type": "object",
        "required": ["planoId", "nome", "descricao", "email", "telefone", "data_nascimento", "valor_mensalidade", "ativo"],
        "properties": {
          "planoId": {"type": "string", "format": "uuid", "example": "11111111-1111-4111-8111-111111111111"},
          "nome": {"type": "string", "minLength": 1, "example": "Eduardo Lopes"},
          "descricao": {"type": "string", "minLength": 1, "example": "Aluno iniciante, foco em hipertrofia."},
          "email": {"type": "string", "format": "email", "example": "eduardo@example.com"},
          "telefone": {"type": "string", "pattern": "^[0-9()+\\-\\s]{8,20}$", "example": "(41) 99999-1111"},
          "data_nascimento": {"type": "string", "format": "date", "description": "Data real e não futura.", "example": "2003-05-14"},
          "valor_mensalidade": {"type": "number", "minimum": 0, "example": 119.9},
          "ativo": {"type": "boolean", "example": true}
        },
        "description": "Corpo completo para POST e PUT. Não envie id ou created_at: a API os rejeita. Campos adicionais são ignorados."
      },
      "Aluno": {
        "type": "object",
        "required": [
          "id",
          "planoId",
          "nome",
          "descricao",
          "email",
          "telefone",
          "data_nascimento",
          "valor_mensalidade",
          "ativo",
          "created_at"
        ],
        "properties": {
          "id": {"type": "string", "format": "uuid", "example": "11111111-1111-4111-8111-111111111111", "readOnly": true},
          "planoId": {"type": "string", "format": "uuid", "example": "11111111-1111-4111-8111-111111111111"},
          "nome": {"type": "string", "minLength": 1, "example": "Eduardo Lopes"},
          "descricao": {"type": "string", "minLength": 1, "example": "Aluno iniciante, foco em hipertrofia."},
          "email": {"type": "string", "format": "email", "example": "eduardo@example.com"},
          "telefone": {"type": "string", "pattern": "^[0-9()+\\-\\s]{8,20}$", "example": "(41) 99999-1111"},
          "data_nascimento": {"type": "string", "format": "date", "description": "Data real e não futura.", "example": "2003-05-14"},
          "valor_mensalidade": {"type": "number", "minimum": 0, "example": 119.9},
          "ativo": {"type": "boolean", "example": true},
          "created_at": {
            "type": "string",
            "format": "date-time",
            "readOnly": true,
            "nullable": true,
            "example": "2026-11-01T12:00:00Z"
          }
        }
      },
      "MensalidadeInput": {
        "type": "object",
        "required": ["alunoId", "competencia", "valor", "data_vencimento", "data_pagamento", "status"],
        "properties": {
          "alunoId": {"type": "string", "format": "uuid", "example": "11111111-1111-4111-8111-111111111111"},
          "competencia": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-01$",
            "description": "Primeiro dia do mês de referência. Única por aluno, inclusive quando cancelada.",
            "example": "2026-11-01"
          },
          "valor": {"type": "number", "minimum": 0, "example": 119.9, "maximum": 99999999.99, "multipleOf": 0.01},
          "data_vencimento": {"type": "string", "format": "date", "example": "2026-11-10"},
          "data_pagamento": {
            "type": "string",
            "format": "date",
            "nullable": true,
            "description": "Obrigatória e não futura quando paga (America/Sao_Paulo); null quando pendente/cancelada.",
            "example": null
          },
          "status": {"type": "string", "enum": ["pendente", "paga", "cancelada"], "example": "pendente"}
        },
        "description": "Corpo completo para POST e PUT. Não envie id ou created_at: a API os rejeita. Campos adicionais são ignorados."
      },
      "Mensalidade": {
        "type": "object",
        "required": ["id", "alunoId", "competencia", "valor", "data_vencimento", "data_pagamento", "status", "created_at"],
        "properties": {
          "id": {"type": "string", "format": "uuid", "example": "11111111-1111-4111-8111-111111111111", "readOnly": true},
          "alunoId": {"type": "string", "format": "uuid", "example": "11111111-1111-4111-8111-111111111111"},
          "competencia": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-01$",
            "description": "Primeiro dia do mês de referência. Única por aluno, inclusive quando cancelada.",
            "example": "2026-11-01"
          },
          "valor": {"type": "number", "minimum": 0, "example": 119.9, "maximum": 99999999.99, "multipleOf": 0.01},
          "data_vencimento": {"type": "string", "format": "date", "example": "2026-11-10"},
          "data_pagamento": {
            "type": "string",
            "format": "date",
            "nullable": true,
            "description": "Obrigatória e não futura quando paga (America/Sao_Paulo); null quando pendente/cancelada.",
            "example": null
          },
          "status": {"type": "string", "enum": ["pendente", "paga", "cancelada"], "example": "pendente"},
          "created_at": {
            "type": "string",
            "format": "date-time",
            "readOnly": true,
            "nullable": false,
            "example": "2026-11-01T12:00:00Z"
          }
        }
      }
    },
    "responses": {
      "400": {
        "description": "UUID, JSON ou dados inválidos; vínculo informado inexistente.",
        "content": {
          "application/json": {
            "schema": {"$ref": "#/components/schemas/Erro"},
            "example": {"message": "UUID, JSON ou dados inválidos; vínculo informado inexistente."}
          }
        }
      },
      "404": {
        "description": "Registro ou rota não encontrado.",
        "content": {
          "application/json": {
            "schema": {"$ref": "#/components/schemas/Erro"},
            "example": {"message": "Registro ou rota não encontrado."}
          }
        }
      },
      "409": {
        "description": "Conflito com as regras de negócio ou relacionamentos.",
        "content": {
          "application/json": {
            "schema": {"$ref": "#/components/schemas/Erro"},
            "example": {"message": "Conflito com as regras de negócio ou relacionamentos."}
          }
        }
      },
      "413": {
        "description": "Corpo da requisição excede o tamanho permitido.",
        "content": {
          "application/json": {
            "schema": {"$ref": "#/components/schemas/Erro"},
            "example": {"message": "Corpo da requisição excede o tamanho permitido."}
          }
        }
      },
      "500": {
        "description": "Falha inesperada; detalhes internos não são expostos.",
        "content": {
          "application/json": {
            "schema": {"$ref": "#/components/schemas/Erro"},
            "example": {"message": "Falha inesperada; detalhes internos não são expostos."}
          }
        }
      }
    }
  }
};
