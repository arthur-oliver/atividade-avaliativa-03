const express = require("express")
const mysql = require("mysql2/promise")
require("dotenv").config()

const app = express()

app.use(express.json())

app.get("/", (req, res) => { res.json({ mensagem: "API funcionando!" }) })

const conexao = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "db_vendas",
    port: process.env.DB_PORT || 3306
})

function calcularComissao(valorVenda, percentualBase, tipoCliente, percentualRegiao) {

    let percentualCliente = 0

    if (tipoCliente === "PF") {
        percentualCliente = 2
    } else if (tipoCliente === "PJ") {
        percentualCliente = 3
    }

    let percentualTotal = percentualBase + percentualCliente + percentualRegiao

    let comissao = valorVenda * percentualTotal / 100

    return comissao
}

async function cadastrarVendedor(nome, metaMensal, percentualBase) {

    try {

        let [resultado] = await conexao.execute(
            `INSERT INTO vendedores
            (nome, meta_mensal, percentual_base, ativo)
            VALUES (?, ?, ?, ?)`,
            [nome, metaMensal, percentualBase, 1]
        )

        return resultado

    } catch (erro) {

        console.error("Erro ao cadastrar vendedor:", erro.message)

        throw erro
    }
}

async function listarVendedores() {

    try {

        let [resultados] = await conexao.execute(
            "SELECT * FROM vendedores"
        )

        return resultados

    } catch (erro) {

        console.error("Erro ao listar vendedores:", erro.message)

        throw erro
    }
}

async function consultarVendedor(id) {

    try {

        let [resultados] = await conexao.execute(
            "SELECT * FROM vendedores WHERE id_vendedor = ?",
            [id]
        )

        return resultados

    } catch (erro) {

        console.error("Erro ao consultar vendedor:", erro.message)

        throw erro
    }
}

async function atualizarVendedor(id, metaMensal, percentualBase) {

    try {

        let [resultado] = await conexao.execute(
            `UPDATE vendedores
            SET meta_mensal = ?, percentual_base = ?
            WHERE id_vendedor = ?`,
            [metaMensal, percentualBase, id]
        )

        return resultado

    } catch (erro) {

        console.error("Erro ao atualizar vendedor:", erro.message)

        throw erro
    }
}

async function desativarVendedor(id) {

    try {

        let [resultado] = await conexao.execute(
            `UPDATE vendedores
            SET ativo = ?
            WHERE id_vendedor = ?`,
            [0, id]
        )

        return resultado

    } catch (erro) {

        console.error("Erro ao desativar vendedor:", erro.message)

        throw erro
    }
}

async function registrarVenda(
    idVenda,
    idVendedor,
    idRegiao,
    dataVenda,
    valorVenda,
    tipoCliente
) {

    try {

        let [vendaExistente] = await conexao.execute(
            "SELECT * FROM vendas WHERE id_venda = ?",
            [idVenda]
        )

        if (vendaExistente.length > 0) {
            throw new Error("Código de venda já existe")
        }

        let [vendedores] = await conexao.execute(
            "SELECT * FROM vendedores WHERE id_vendedor = ?",
            [idVendedor]
        )

        if (vendedores.length === 0) {
            throw new Error("Vendedor não encontrado")
        }

        if (vendedores[0].ativo === 0) {
            throw new Error("Vendedor está inativo")
        }

        let [regioes] = await conexao.execute(
            "SELECT * FROM regioes WHERE id_regiao = ?",
            [idRegiao]
        )

        if (regioes.length === 0) {
            throw new Error("Região não encontrada")
        }

        if (valorVenda <= 0) {
            throw new Error("O valor da venda deve ser positivo")
        }

        if (tipoCliente !== "PF" && tipoCliente !== "PJ") {
            throw new Error("Tipo de cliente deve ser PF ou PJ")
        }

        let percentualBase = Number(vendedores[0].percentual_base)
        let percentualRegiao = Number(regioes[0].percentual_bonus)

        let valorComissao = calcularComissao(
            Number(valorVenda),
            percentualBase,
            tipoCliente,
            percentualRegiao
        )

        let [resultado] = await conexao.execute(
            `INSERT INTO vendas
            (
                id_venda,
                id_vendedor,
                id_regiao,
                data_venda,
                valor_venda,
                tipo_cliente,
                valor_comissao
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                idVenda,
                idVendedor,
                idRegiao,
                dataVenda,
                valorVenda,
                tipoCliente,
                valorComissao
            ]
        )

        return {
            resultado: resultado,
            valor_comissao: valorComissao
        }

    } catch (erro) {

        console.error("Erro ao registrar venda:", erro.message)

        throw erro
    }
}

async function listarVendas() {

    try {

        let [resultados] = await conexao.execute(
            `SELECT
                v.id_venda,
                v.data_venda,
                v.valor_venda,
                v.tipo_cliente,
                v.valor_comissao,
                ven.id_vendedor,
                ven.nome AS vendedor,
                r.id_regiao,
                r.nome_regiao AS regiao
            FROM vendas v
            INNER JOIN vendedores ven
                ON v.id_vendedor = ven.id_vendedor
            INNER JOIN regioes r
                ON v.id_regiao = r.id_regiao
            ORDER BY v.data_venda`
        )

        return resultados

    } catch (erro) {

        console.error("Erro ao listar vendas:", erro.message)

        throw erro
    }
}

async function consultarVendasPorVendedor(idVendedor) {

    try {

        let [resultados] = await conexao.execute(
            `SELECT
                v.id_venda,
                v.data_venda,
                v.valor_venda,
                v.tipo_cliente,
                v.valor_comissao,
                ven.nome AS vendedor,
                r.nome_regiao AS regiao
            FROM vendas v
            INNER JOIN vendedores ven
                ON v.id_vendedor = ven.id_vendedor
            INNER JOIN regioes r
                ON v.id_regiao = r.id_regiao
            WHERE v.id_vendedor = ?
            ORDER BY v.data_venda`,
            [idVendedor]
        )

        return resultados

    } catch (erro) {

        console.error("Erro ao consultar vendas por vendedor:", erro.message)

        throw erro
    }
}

async function consultarVendasPorRegiao(idRegiao) {

    try {

        let [resultados] = await conexao.execute(
            `SELECT
                v.id_venda,
                v.data_venda,
                v.valor_venda,
                v.tipo_cliente,
                v.valor_comissao,
                ven.nome AS vendedor,
                r.nome_regiao AS regiao
            FROM vendas v
            INNER JOIN vendedores ven
                ON v.id_vendedor = ven.id_vendedor
            INNER JOIN regioes r
                ON v.id_regiao = r.id_regiao
            WHERE v.id_regiao = ?
            ORDER BY v.data_venda`,
            [idRegiao]
        )

        return resultados

    } catch (erro) {

        console.error("Erro ao consultar vendas por região:", erro.message)

        throw erro
    }
}

async function excluirVenda(id) {

    try {

        let [venda] = await conexao.execute(
            "SELECT * FROM vendas WHERE id_venda = ?",
            [id]
        )

        if (venda.length === 0) {
            throw new Error("Venda não encontrada")
        }

        let [resultado] = await conexao.execute(
            "DELETE FROM vendas WHERE id_venda = ?",
            [id]
        )

        return resultado

    } catch (erro) {

        console.error("Erro ao excluir venda:", erro.message)

        throw erro
    }
}

async function gerarRelatorioPerformance(inicio, fim) {

    try {

        let [totalVendas] = await conexao.execute(
            `SELECT COUNT(*) AS total_vendas
            FROM vendas
            WHERE DATE(data_venda) BETWEEN ? AND ?`,
            [inicio, fim]
        )

        let [vendasPorRegiao] = await conexao.execute(
            `SELECT
                r.nome_regiao AS regiao,
                SUM(v.valor_venda) AS total_vendido
            FROM vendas v
            INNER JOIN regioes r
                ON v.id_regiao = r.id_regiao
            WHERE DATE(v.data_venda) BETWEEN ? AND ?
            GROUP BY r.id_regiao, r.nome_regiao
            ORDER BY total_vendido DESC`,
            [inicio, fim]
        )

        let [vendasPorCliente] = await conexao.execute(
            `SELECT
                tipo_cliente,
                SUM(valor_venda) AS total_vendido
            FROM vendas
            WHERE DATE(data_venda) BETWEEN ? AND ?
            GROUP BY tipo_cliente`,
            [inicio, fim]
        )

        let [melhorVendedor] = await conexao.execute(
            `SELECT
                ven.id_vendedor,
                ven.nome,
                SUM(v.valor_venda) AS total_vendido
            FROM vendas v
            INNER JOIN vendedores ven
                ON v.id_vendedor = ven.id_vendedor
            WHERE DATE(v.data_venda) BETWEEN ? AND ?
            GROUP BY ven.id_vendedor, ven.nome
            ORDER BY total_vendido DESC
            LIMIT 1`,
            [inicio, fim]
        )

        let [maiorComissao] = await conexao.execute(
            `SELECT
                ven.id_vendedor,
                ven.nome,
                SUM(v.valor_comissao) AS total_comissao
            FROM vendas v
            INNER JOIN vendedores ven
                ON v.id_vendedor = ven.id_vendedor
            WHERE DATE(v.data_venda) BETWEEN ? AND ?
            GROUP BY ven.id_vendedor, ven.nome
            ORDER BY total_comissao DESC
            LIMIT 1`,
            [inicio, fim]
        )

        let [comissaoMedia] = await conexao.execute(
            `SELECT
                AVG(valor_comissao) AS comissao_media
            FROM vendas
            WHERE DATE(data_venda) BETWEEN ? AND ?`,
            [inicio, fim]
        )

        let [comissaoMediaRegiao] = await conexao.execute(
            `SELECT
                r.nome_regiao AS regiao,
                AVG(v.valor_comissao) AS comissao_media
            FROM vendas v
            INNER JOIN regioes r
                ON v.id_regiao = r.id_regiao
            WHERE DATE(v.data_venda) BETWEEN ? AND ?
            GROUP BY r.id_regiao, r.nome_regiao`,
            [inicio, fim]
        )

        let [metasAtingidas] = await conexao.execute(
            `SELECT COUNT(*) AS vendedores_que_atingiram_meta
            FROM (
                SELECT
                    ven.id_vendedor,
                    ven.meta_mensal,
                    SUM(v.valor_venda) AS total_vendido
                FROM vendedores ven
                INNER JOIN vendas v
                    ON ven.id_vendedor = v.id_vendedor
                WHERE DATE(v.data_venda) BETWEEN ? AND ?
                GROUP BY ven.id_vendedor, ven.meta_mensal
                HAVING SUM(v.valor_venda) >= ven.meta_mensal
            ) AS vendedores_meta`,
            [inicio, fim]
        )

        return {
            periodo: {
                inicio: inicio,
                fim: fim
            },
            total_vendas: totalVendas,
            vendas_por_regiao: vendasPorRegiao,
            vendas_por_tipo_cliente: vendasPorCliente,
            melhor_vendedor: melhorVendedor,
            maior_comissao: maiorComissao,
            metas_atingidas: metasAtingidas,
            comissao_media_geral: comissaoMedia,
            comissao_media_por_regiao: comissaoMediaRegiao
        }

    } catch (erro) {

        console.error("Erro ao gerar relatório:", erro.message)

        throw erro
    }
}

app.post("/vendedores", async (req, res) => {

    try {

        let { nome, meta_mensal, percentual_base } = req.body

        if (!nome || meta_mensal === undefined || percentual_base === undefined) {

            return res.status(400).json({
                mensagem: "Informe nome, meta mensal e percentual base"
            })
        }

        let resultado = await cadastrarVendedor(
            nome,
            meta_mensal,
            percentual_base
        )

        res.status(201).json({
            mensagem: "Vendedor cadastrado com sucesso",
            id_vendedor: resultado.insertId
        })

    } catch (erro) {

        res.status(500).json({
            mensagem: erro.message
        })
    }
})

app.get("/vendedores", async (req, res) => {

    try {

        let resultados = await listarVendedores()

        res.status(200).json(resultados)

    } catch (erro) {

        res.status(500).json({
            mensagem: erro.message
        })
    }
})

app.get("/vendedores/:id", async (req, res) => {

    try {

        let resultados = await consultarVendedor(req.params.id)

        if (resultados.length === 0) {

            return res.status(404).json({
                mensagem: "Vendedor não encontrado"
            })
        }

        res.status(200).json(resultados[0])

    } catch (erro) {

        res.status(500).json({
            mensagem: erro.message
        })
    }
})

app.put("/vendedores/:id", async (req, res) => {

    try {

        let { meta_mensal, percentual_base } = req.body

        if (meta_mensal === undefined || percentual_base === undefined) {

            return res.status(400).json({
                mensagem: "Informe meta mensal e percentual base"
            })
        }

        let vendedor = await consultarVendedor(req.params.id)

        if (vendedor.length === 0) {

            return res.status(404).json({
                mensagem: "Vendedor não encontrado"
            })
        }

        await atualizarVendedor(
            req.params.id,
            meta_mensal,
            percentual_base
        )

        res.status(200).json({
            mensagem: "Vendedor atualizado com sucesso"
        })

    } catch (erro) {

        res.status(500).json({
            mensagem: erro.message
        })
    }
})

app.patch("/vendedores/:id/desativar", async (req, res) => {

    try {

        let vendedor = await consultarVendedor(req.params.id)

        if (vendedor.length === 0) {

            return res.status(404).json({
                mensagem: "Vendedor não encontrado"
            })
        }

        await desativarVendedor(req.params.id)

        res.status(200).json({
            mensagem: "Vendedor desativado com sucesso"
        })

    } catch (erro) {

        res.status(500).json({
            mensagem: erro.message
        })
    }
})

app.post("/vendas", async (req, res) => {

    try {

        let {
            id_venda,
            id_vendedor,
            id_regiao,
            data_venda,
            valor_venda,
            tipo_cliente
        } = req.body

        if (
            id_venda === undefined ||
            id_vendedor === undefined ||
            id_regiao === undefined ||
            !data_venda ||
            valor_venda === undefined ||
            !tipo_cliente
        ) {

            return res.status(400).json({
                mensagem: "Informe todos os dados da venda"
            })
        }

        let resultado = await registrarVenda(
            id_venda,
            id_vendedor,
            id_regiao,
            data_venda,
            valor_venda,
            tipo_cliente
        )

        res.status(201).json({
            mensagem: "Venda registrada com sucesso",
            id_venda: id_venda,
            valor_comissao: resultado.valor_comissao
        })

    } catch (erro) {

        res.status(400).json({
            mensagem: erro.message
        })
    }
})

app.get("/vendas", async (req, res) => {

    try {

        let resultados = await listarVendas()

        res.status(200).json(resultados)

    } catch (erro) {

        res.status(500).json({
            mensagem: erro.message
        })
    }
})

app.get("/vendas/vendedor/:id", async (req, res) => {

    try {

        let resultados = await consultarVendasPorVendedor(
            req.params.id
        )

        res.status(200).json(resultados)

    } catch (erro) {

        res.status(500).json({
            mensagem: erro.message
        })
    }
})

app.get("/vendas/regiao/:id", async (req, res) => {

    try {

        let resultados = await consultarVendasPorRegiao(
            req.params.id
        )

        res.status(200).json(resultados)

    } catch (erro) {

        res.status(500).json({
            mensagem: erro.message
        })
    }
})

app.delete("/vendas/:id", async (req, res) => {

    try {

        await excluirVenda(req.params.id)

        res.status(200).json({
            mensagem: "Venda excluída com sucesso"
        })

    } catch (erro) {

        if (erro.message === "Venda não encontrada") {

            return res.status(404).json({
                mensagem: erro.message
            })
        }

        res.status(500).json({
            mensagem: erro.message
        })
    }
})

app.get("/relatorios/performance", async (req, res) => {

    try {

        let { inicio, fim } = req.query

        if (!inicio || !fim) {

            return res.status(400).json({
                mensagem: "Informe as datas inicio e fim"
            })
        }

        let resultado = await gerarRelatorioPerformance(
            inicio,
            fim
        )

        res.status(200).json(resultado)

    } catch (erro) {

        res.status(500).json({
            mensagem: erro.message
        })
    }
})

let PORTA = process.env.PORT || 3000

app.listen(PORTA, () => {

    console.log(`Servidor funcionando na porta ${PORTA}`)
})
