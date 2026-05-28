-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 20-Maio-2026 às 12:09
-- Versão do servidor: 10.4.32-MariaDB
-- versão do PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `loja_informatica`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `avaliacoes`
--

CREATE TABLE `avaliacoes` (
  `id` int(11) NOT NULL,
  `utilizador_id` int(11) NOT NULL,
  `produto_id` int(11) NOT NULL,
  `classificacao` int(11) DEFAULT NULL CHECK (`classificacao` between 1 and 5),
  `comentario` text DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `categoria_pai` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `categorias`
--

INSERT INTO `categorias` (`id`, `nome`, `categoria_pai`) VALUES
(1, 'Lifestyle', NULL),
(2, 'Running', NULL),
(3, 'New Drops', NULL),
(4, 'Basketball', NULL),
(5, 'Skate', NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `contactos`
--

CREATE TABLE `contactos` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `assunto` varchar(150) DEFAULT NULL,
  `mensagem` text NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `encomendas`
--

CREATE TABLE `encomendas` (
  `id` int(11) NOT NULL,
  `utilizador_id` int(11) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `estado` varchar(50) DEFAULT 'pendente',
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `itens_encomenda`
--

CREATE TABLE `itens_encomenda` (
  `id` int(11) NOT NULL,
  `encomenda_id` int(11) NOT NULL,
  `produto_id` int(11) NOT NULL,
  `quantidade` int(11) NOT NULL,
  `preco` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `pagamentos`
--

CREATE TABLE `pagamentos` (
  `id` int(11) NOT NULL,
  `encomenda_id` int(11) NOT NULL,
  `metodo_pagamento` varchar(50) DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `pago_em` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `produtos`
--

CREATE TABLE `produtos` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `preco` decimal(10,2) NOT NULL,
  `stock` int(11) DEFAULT 0,
  `categoria_id` int(11) DEFAULT NULL,
  `especificacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`especificacoes`)),
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `promocao` tinyint(1) DEFAULT 0,
  `imagens` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `produtos`
--

INSERT INTO `produtos` (`id`, `nome`, `descricao`, `preco`, `stock`, `categoria_id`, `especificacoes`, `criado_em`, `promocao`, `imagens`) VALUES
(1, 'Nike Air Force 1 ''07', 'O clássico branco que nunca sai de moda. Cabedal em pele e sola Air.', 109.99, 5, 1, NULL, '2026-05-20 09:51:35', 1, NULL),
(2, 'Adidas Stan Smith', 'Ícone minimalista com perfurado verde. Estilo limpo para o dia a dia.', 99.99, 8, 1, NULL, '2026-05-20 09:51:35', 0, NULL),
(3, 'Converse Chuck 70 High', 'Canvas premium e sola de borracha vulcanizada. Edição Chuck 70.', 84.99, 15, 1, NULL, '2026-05-20 09:51:35', 0, NULL),
(4, 'New Balance 550', 'Silhueta retro de basquetebol reborn. Combinações vintage.', 119.99, 6, 1, NULL, '2026-05-20 09:51:35', 0, NULL),
(5, 'Puma Suede Classic', 'Camurça icónica desde os anos 60. Streetwear essencial.', 79.99, 12, 1, NULL, '2026-05-20 09:51:35', 1, NULL),
(6, 'Nike Air Zoom Pegasus 41', 'Amortecimento React e Zoom Air. O daily runner mais popular.', 139.99, 4, 2, NULL, '2026-05-20 09:51:35', 1, NULL),
(7, 'Adidas Ultraboost Light', 'Boost leve e upper Primeknit. Conforto máximo em cada passo.', 189.99, 7, 2, NULL, '2026-05-20 09:51:35', 0, NULL),
(8, 'Asics Gel-Nimbus 26', 'Gel cushioning e FF Blast+. Feito para longas distâncias.', 169.99, 2, 2, NULL, '2026-05-20 09:51:35', 1, NULL),
(9, 'New Balance Fresh Foam X 1080v13', 'Fresh Foam X e upper Hypoknit. Corrida suave e estável.', 164.99, 3, 2, NULL, '2026-05-20 09:51:35', 0, NULL),
(10, 'Hoka Clifton 9', 'Meta-Rocker e espuma compressiva. Leveza para corridas fáceis.', 144.99, 5, 2, NULL, '2026-05-20 09:51:35', 0, NULL),
(11, 'Air Jordan 1 Retro High OG', 'Silhueta que mudou o jogo. Cabedal em pele e Swoosh icónico.', 179.99, 10, 3, NULL, '2026-05-20 09:51:35', 1, NULL),
(12, 'Nike Dunk Low Retro', 'Skateboarding heritage com estética college. Cores OG.', 119.99, 12, 3, NULL, '2026-05-20 09:51:35', 0, NULL),
(13, 'adidas Yeezy Boost 350 V2', 'Primeknit upper e full-length Boost. Silhueta reconhecível.', 229.99, 8, 3, NULL, '2026-05-20 09:51:35', 0, NULL),
(14, 'New Balance 1906R', 'Tecnologia N-ergy e ABZORB SBS. Runner Y2K aesthetic.', 149.99, 15, 3, NULL, '2026-05-20 09:51:35', 1, NULL),
(15, 'Nike Air Max 1', 'A primeira Air Max visível. Design Tinker Hatfield.', 139.99, 20, 3, NULL, '2026-05-20 09:51:35', 0, NULL),
(16, 'Air Jordan 4 Retro', 'Mesh panels e wings laterais. Um dos Jordan mais desejados.', 209.99, 6, 4, NULL, '2026-05-20 09:51:35', 1, NULL),
(17, 'Nike LeBron 21', 'Zoom Air e suporte para jogadores explosivos. Domina o court.', 199.99, 4, 4, NULL, '2026-05-20 09:51:35', 0, NULL),
(18, 'Adidas Harden Vol. 8', 'Tração BOOST e estabilidade lateral. Assinatura James Harden.', 159.99, 10, 4, NULL, '2026-05-20 09:51:35', 1, NULL),
(19, 'Under Armour Curry 11', 'Flow cushioning sem borracha. Velocidade de Stephen Curry.', 169.99, 8, 4, NULL, '2026-05-20 09:51:35', 0, NULL),
(20, 'Puma MB.03', 'Assinatura LaMelo Ball. Design futurista e grip agressivo.', 129.99, 5, 4, NULL, '2026-05-20 09:51:35', 0, NULL),
(21, 'Nike SB Dunk Low Pro', 'Zoom Air no heel e suede resistente. Feito para skate.', 109.99, 20, 5, NULL, '2026-05-20 09:51:35', 1, NULL),
(22, 'Vans Old Skool Pro', 'Suede/canvas com waffle sole. O stripe lateral clássico.', 74.99, 10, 5, NULL, '2026-05-20 09:51:35', 0, NULL),
(23, 'Converse CONS Louie Lopez Pro', 'Assinatura Louie Lopez. Durabilidade para sessões longas.', 79.99, 15, 5, NULL, '2026-05-20 09:51:35', 1, NULL),
(24, 'Adidas Busenitz Pro', 'Cupsole vulcanizada inspirada em futebol. Controlo e feel.', 89.99, 4, 5, NULL, '2026-05-20 09:51:35', 0, NULL),
(25, 'New Balance Numeric 306', 'FUELCELL foam e upper em mesh. Pro model NB Numeric.', 94.99, 7, 5, NULL, '2026-05-20 09:51:35', 1, NULL),
(26, 'DC Shoes Metric S', 'Super Suede e ventilation holes. Estilo anos 90 reborn.', 84.99, 12, 5, NULL, '2026-05-20 09:51:35', 0, NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `utilizadores`
--

CREATE TABLE `utilizadores` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `palavra_passe` varchar(255) NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `admin` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `utilizadores`
--

INSERT INTO `utilizadores` (`id`, `nome`, `email`, `palavra_passe`, `criado_em`, `admin`) VALUES
(1, 'Admin InfoStore', 'admin@admin.com', '$2y$10$TW4M77ksrKPbN/bBgAr7peEABKVLmxM6fWzWIj.TpT2YzfQEiSU7G', '2026-05-20 09:51:35', 1),
(2, 'Utilizador Test', 'user@user.com', '$2y$10$Ag7fEyqNwlBXxLsAiM8s.e6bPLXNKDaXc8rGFvCJK0u6Kq7VV4dqS', '2026-05-20 09:51:35', 0),
(3, 'João Silva', 'joao@email.com', '$2y$10$NoxN8s1E6Fg4nwqMVyCQxubMRgFqAFBnl3m8LWq7o.mM0QvX6h4I2', '2026-05-20 09:51:35', 0),
(4, 'Maria Costa', 'maria@email.com', '$2y$10$Ag7fEyqNwlBXxLsAiM8s.e6bPLXNKDaXc8rGFvCJK0u6Kq7VV4dqS', '2026-05-20 09:51:35', 0);

--
-- Índices para tabelas despejadas
--

--
-- Índices para tabela `avaliacoes`
--
ALTER TABLE `avaliacoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `utilizador_id` (`utilizador_id`),
  ADD KEY `idx_avaliacoes_produto` (`produto_id`);

--
-- Índices para tabela `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categoria_pai` (`categoria_pai`);

--
-- Índices para tabela `contactos`
--
ALTER TABLE `contactos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contactos_email` (`email`);

--
-- Índices para tabela `encomendas`
--
ALTER TABLE `encomendas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_encomendas_utilizador` (`utilizador_id`);

--
-- Índices para tabela `itens_encomenda`
--
ALTER TABLE `itens_encomenda`
  ADD PRIMARY KEY (`id`),
  ADD KEY `produto_id` (`produto_id`),
  ADD KEY `idx_itens_encomenda` (`encomenda_id`);

--
-- Índices para tabela `pagamentos`
--
ALTER TABLE `pagamentos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `encomenda_id` (`encomenda_id`);

--
-- Índices para tabela `produtos`
--
ALTER TABLE `produtos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_produtos_categoria` (`categoria_id`),
  ADD KEY `idx_produtos_promocao` (`promocao`);

--
-- Índices para tabela `utilizadores`
--
ALTER TABLE `utilizadores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `avaliacoes`
--
ALTER TABLE `avaliacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `contactos`
--
ALTER TABLE `contactos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `encomendas`
--
ALTER TABLE `encomendas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `itens_encomenda`
--
ALTER TABLE `itens_encomenda`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pagamentos`
--
ALTER TABLE `pagamentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `produtos`
--
ALTER TABLE `produtos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de tabela `utilizadores`
--
ALTER TABLE `utilizadores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restrições para despejos de tabelas
--

--
-- Limitadores para a tabela `avaliacoes`
--
ALTER TABLE `avaliacoes`
  ADD CONSTRAINT `avaliacoes_ibfk_1` FOREIGN KEY (`utilizador_id`) REFERENCES `utilizadores` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `avaliacoes_ibfk_2` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `categorias`
--
ALTER TABLE `categorias`
  ADD CONSTRAINT `categorias_ibfk_1` FOREIGN KEY (`categoria_pai`) REFERENCES `categorias` (`id`) ON DELETE SET NULL;

--
-- Limitadores para a tabela `encomendas`
--
ALTER TABLE `encomendas`
  ADD CONSTRAINT `encomendas_ibfk_1` FOREIGN KEY (`utilizador_id`) REFERENCES `utilizadores` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `itens_encomenda`
--
ALTER TABLE `itens_encomenda`
  ADD CONSTRAINT `itens_encomenda_ibfk_1` FOREIGN KEY (`encomenda_id`) REFERENCES `encomendas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `itens_encomenda_ibfk_2` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `pagamentos`
--
ALTER TABLE `pagamentos`
  ADD CONSTRAINT `pagamentos_ibfk_1` FOREIGN KEY (`encomenda_id`) REFERENCES `encomendas` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `produtos`
--
ALTER TABLE `produtos`
  ADD CONSTRAINT `produtos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
