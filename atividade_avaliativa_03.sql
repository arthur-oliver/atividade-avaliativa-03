-- Sistema de Vendas com Comissoes, Metas e Performance
-- Execute este arquivo no MySQL Workbench.
-- ATENCAO: os comandos DROP TABLE abaixo apagam as tabelas existentes.
-- Use-os somente se quiser recriar a base de testes do zero.

CREATE DATABASE IF NOT EXISTS db_vendas;
USE db_vendas;

DROP TABLE IF EXISTS vendas;
DROP TABLE IF EXISTS vendedores;
DROP TABLE IF EXISTS regioes;

CREATE TABLE vendedores (
    id_vendedor INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    meta_mensal DECIMAL(12,2) NOT NULL,
    percentual_base DECIMAL(5,2) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE regioes (
    id_regiao INT PRIMARY KEY AUTO_INCREMENT,
    nome_regiao VARCHAR(50) NOT NULL,
    percentual_bonus DECIMAL(5,2) NOT NULL
);

CREATE TABLE vendas (
    id_venda INT PRIMARY KEY,
    id_vendedor INT NOT NULL,
    id_regiao INT NOT NULL,
    data_venda DATETIME NOT NULL,
    valor_venda DECIMAL(12,2) NOT NULL,
    tipo_cliente ENUM('PF', 'PJ') NOT NULL,
    valor_comissao DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (id_vendedor) REFERENCES vendedores(id_vendedor),
    FOREIGN KEY (id_regiao) REFERENCES regioes(id_regiao)
);

-- DML: cadastrar as quatro regioes.
INSERT INTO regioes (nome_regiao, percentual_bonus) VALUES
('Norte', 1.00),
('Nordeste', 1.00),
('Sudeste', 0.00),
('Sul', 0.50);

-- DML: cadastrar cinco vendedores.
INSERT INTO vendedores (nome, meta_mensal, percentual_base) VALUES
('Joao Silva', 10000.00, 5.00),
('Maria Souza', 12000.00, 5.00),
('Carlos Oliveira', 15000.00, 6.00),
('Ana Santos', 11000.00, 4.00),
('Pedro Costa', 13000.00, 5.00);

-- DML: cadastrar 15 vendas de exemplo.
-- Comissao = valor_venda * (percentual_base + percentual_cliente + bonus_regiao) / 100
-- PF acrescenta 2%; PJ acrescenta 3%.
INSERT INTO vendas (id_venda, id_vendedor, id_regiao, data_venda, valor_venda, tipo_cliente, valor_comissao) VALUES
(1, 1, 1, '2026-10-09 10:00:00', 2000.00, 'PF', 160.00),
(2, 2, 2, '2026-10-09 11:00:00', 3000.00, 'PJ', 270.00),
(3, 3, 3, '2026-10-09 12:00:00', 4000.00, 'PJ', 360.00),
(4, 4, 4, '2026-10-09 13:00:00', 5000.00, 'PF', 325.00),
(5, 5, 1, '2026-10-09 14:00:00', 2500.00, 'PJ', 225.00),
(6, 1, 2, '2026-10-09 15:00:00', 3500.00, 'PF', 280.00),
(7, 2, 3, '2026-10-10 10:00:00', 4500.00, 'PJ', 360.00),
(8, 3, 4, '2026-10-10 11:00:00', 5500.00, 'PF', 467.50),
(9, 4, 1, '2026-10-10 12:00:00', 6000.00, 'PJ', 480.00),
(10, 5, 2, '2026-10-10 13:00:00', 6500.00, 'PF', 520.00),
(11, 1, 3, '2026-10-10 14:00:00', 7000.00, 'PJ', 560.00),
(12, 2, 4, '2026-10-10 15:00:00', 7500.00, 'PF', 637.50),
(13, 3, 1, '2026-10-11 10:00:00', 8000.00, 'PJ', 800.00),
(14, 4, 2, '2026-10-11 11:00:00', 8500.00, 'PF', 595.00),
(15, 5, 3, '2026-10-11 12:00:00', 9000.00, 'PJ', 720.00);

-- CONSULTAS (SELECT)

-- 1. Listar regioes.
SELECT * FROM regioes;

-- 2. Listar vendedores.
SELECT * FROM vendedores;

-- 3. Consultar um vendedor pelo codigo.
SELECT * FROM vendedores WHERE id_vendedor = 1;

-- 4. Listar vendas com nome do vendedor e regiao (JOIN).
SELECT
    v.id_venda,
    ven.nome AS vendedor,
    r.nome_regiao AS regiao,
    v.data_venda,
    v.valor_venda,
    v.tipo_cliente,
    v.valor_comissao
FROM vendas v
INNER JOIN vendedores ven ON v.id_vendedor = ven.id_vendedor
INNER JOIN regioes r ON v.id_regiao = r.id_regiao
ORDER BY v.id_venda;

-- 5. Consultar vendas de um vendedor.
SELECT * FROM vendas WHERE id_vendedor = 1;

-- 6. Consultar vendas de uma regiao.
SELECT * FROM vendas WHERE id_regiao = 1;

-- 7. Atualizar a meta mensal de um vendedor.
-- Execute este comando quando quiser testar a alteracao.
-- UPDATE vendedores SET meta_mensal = 15000.00 WHERE id_vendedor = 1;

-- 8. Desativar um vendedor.
-- UPDATE vendedores SET ativo = FALSE WHERE id_vendedor = 5;

-- 9. Excluir uma venda.
-- Descomente para testar; a venda sera removida.
-- DELETE FROM vendas WHERE id_venda = 15;

-- RELATORIOS E INDICADORES

-- 10. Total de vendas e total vendido.
SELECT COUNT(*) AS quantidade_vendas, SUM(valor_venda) AS total_vendido
FROM vendas;

-- 11. Vendas por regiao (JOIN, GROUP BY e SUM).
SELECT r.nome_regiao, COUNT(v.id_venda) AS quantidade_vendas,
       SUM(v.valor_venda) AS total_vendido
FROM regioes r
LEFT JOIN vendas v ON v.id_regiao = r.id_regiao
GROUP BY r.id_regiao, r.nome_regiao
ORDER BY total_vendido DESC;

-- 12. Vendas por tipo de cliente (GROUP BY e SUM).
SELECT tipo_cliente, COUNT(*) AS quantidade_vendas,
       SUM(valor_venda) AS total_vendido
FROM vendas
GROUP BY tipo_cliente;

-- 13. Melhor vendedor por total vendido.
SELECT ven.id_vendedor, ven.nome, SUM(v.valor_venda) AS total_vendido
FROM vendedores ven
INNER JOIN vendas v ON ven.id_vendedor = v.id_vendedor
GROUP BY ven.id_vendedor, ven.nome
ORDER BY total_vendido DESC
LIMIT 1;

-- 14. Maior comissao registrada.
SELECT v.id_venda, ven.nome AS vendedor, v.valor_comissao
FROM vendas v
INNER JOIN vendedores ven ON ven.id_vendedor = v.id_vendedor
ORDER BY v.valor_comissao DESC
LIMIT 1;

-- 15. Comissao media geral.
SELECT AVG(valor_comissao) AS comissao_media FROM vendas;

-- 16. Comissao media por regiao.
SELECT r.nome_regiao, AVG(v.valor_comissao) AS comissao_media
FROM regioes r
INNER JOIN vendas v ON v.id_regiao = r.id_regiao
GROUP BY r.id_regiao, r.nome_regiao;

-- 17. Metas atingidas: compara total vendido com a meta mensal.
SELECT ven.id_vendedor, ven.nome, ven.meta_mensal,
       COALESCE(SUM(v.valor_venda), 0) AS total_vendido,
       CASE
           WHEN COALESCE(SUM(v.valor_venda), 0) >= ven.meta_mensal THEN 'Meta atingida'
           ELSE 'Meta nao atingida'
       END AS situacao_meta
FROM vendedores ven
LEFT JOIN vendas v ON ven.id_vendedor = v.id_vendedor
    AND v.data_venda >= '2026-10-01 00:00:00'
    AND v.data_venda < '2026-11-01 00:00:00'
GROUP BY ven.id_vendedor, ven.nome, ven.meta_mensal;

-- 18. Vendas de outubro de 2026.
SELECT * FROM vendas
WHERE data_venda >= '2026-10-01 00:00:00'
  AND data_venda < '2026-11-01 00:00:00';
