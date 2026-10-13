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
    ativo BOOLEAN NOT NULL DEFAULT 1
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
    tipo_cliente ENUM('PF','PJ') NOT NULL,
    valor_comissao DECIMAL(12,2) NOT NULL,

    FOREIGN KEY (id_vendedor)
        REFERENCES vendedores(id_vendedor),

    FOREIGN KEY (id_regiao)
        REFERENCES regioes(id_regiao)
);


INSERT INTO regioes
(nome_regiao, percentual_bonus)
VALUES
('Norte', 1.00),
('Nordeste', 1.00),
('Sudeste', 0.00),
('Sul', 0.50);


SELECT * FROM regioes;

SELECT * FROM vendedores;

SELECT * FROM vendas;