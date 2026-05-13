-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Tempo de geração: 11-Maio-2026 às 22:07
-- Versão do servidor: 10.11.15-MariaDB
-- versão do PHP: 8.2.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de dados: `scopeplan`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `projetos`
--

CREATE TABLE `projetos` (
  `id` int(10) UNSIGNED NOT NULL,
  `nome` varchar(200) NOT NULL,
  `descricao` text DEFAULT NULL,
  `status` enum('planejamento','em_andamento','em_revisao','concluido','cancelado') NOT NULL DEFAULT 'planejamento',
  `custo_estimado` decimal(12,2) DEFAULT NULL,
  `gestor_id` int(10) UNSIGNED NOT NULL,
  `criado_em` datetime NOT NULL DEFAULT current_timestamp(),
  `atualizado_em` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Projetos gerenciados na plataforma ScopePlan';

--
-- Extraindo dados da tabela `projetos`
--

INSERT INTO `projetos` (`id`, `nome`, `descricao`, `status`, `custo_estimado`, `gestor_id`, `criado_em`, `atualizado_em`) VALUES
(1, 'ScopePlan MVP', 'Plataforma web para gestão e documentação de requisitos.', 'em_andamento', 2270.00, 1, '2026-05-10 04:11:39', '2026-05-10 04:11:39');

-- --------------------------------------------------------

--
-- Estrutura da tabela `requisitos`
--

CREATE TABLE `requisitos` (
  `id` int(10) UNSIGNED NOT NULL,
  `projeto_id` int(10) UNSIGNED NOT NULL,
  `titulo` varchar(300) NOT NULL,
  `descricao` text DEFAULT NULL,
  `tipo` enum('funcional','nao_funcional','negocio','restricao') NOT NULL DEFAULT 'funcional',
  `prioridade` enum('baixa','media','alta','critica') NOT NULL DEFAULT 'media',
  `status` enum('rascunho','em_revisao','aprovado','rejeitado','implementado') NOT NULL DEFAULT 'rascunho',
  `numero_versao` smallint(5) UNSIGNED NOT NULL DEFAULT 1,
  `autor_id` int(10) UNSIGNED NOT NULL,
  `criado_em` datetime NOT NULL DEFAULT current_timestamp(),
  `atualizado_em` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Requisitos vinculados aos projetos, com controle de versão';

--
-- Extraindo dados da tabela `requisitos`
--

INSERT INTO `requisitos` (`id`, `projeto_id`, `titulo`, `descricao`, `tipo`, `prioridade`, `status`, `numero_versao`, `autor_id`, `criado_em`, `atualizado_em`) VALUES
(1, 1, 'Gestão de projetos', NULL, 'funcional', 'alta', 'rascunho', 1, 2, '2026-05-10 04:11:52', '2026-05-10 04:11:52'),
(2, 1, 'Cadastro de requisitos', NULL, 'funcional', 'alta', 'rascunho', 1, 2, '2026-05-10 04:11:52', '2026-05-10 04:11:52'),
(3, 1, 'Controle de versão', NULL, 'funcional', 'media', 'rascunho', 1, 2, '2026-05-10 04:11:52', '2026-05-10 04:11:52'),
(4, 1, 'Dashboard de acompanhamento', NULL, 'funcional', 'media', 'rascunho', 1, 2, '2026-05-10 04:11:52', '2026-05-10 04:11:52');

-- --------------------------------------------------------

--
-- Estrutura da tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(10) UNSIGNED NOT NULL,
  `nome` varchar(120) NOT NULL,
  `email` varchar(180) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `perfil` enum('analista','desenvolvedor','cliente','gestor') NOT NULL DEFAULT 'analista',
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `criado_em` datetime NOT NULL DEFAULT current_timestamp(),
  `atualizado_em` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Usuários da plataforma ScopePlan';

--
-- Extraindo dados da tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha_hash`, `perfil`, `ativo`, `criado_em`, `atualizado_em`) VALUES
(1, 'Admin Gestor', 'gestor@scopeplan.com', '$2b$12$exemplo_hash_gestor', 'gestor', 1, '2026-05-10 04:11:21', '2026-05-10 04:11:21'),
(2, 'Ana Analista', 'analista@scopeplan.com', '$2b$12$exemplo_hash_analista', 'analista', 1, '2026-05-10 04:11:21', '2026-05-10 04:11:21'),
(3, 'Carlos Cliente', 'cliente@scopeplan.com', '$2b$12$exemplo_hash_cliente', 'cliente', 1, '2026-05-10 04:11:21', '2026-05-10 04:11:21');

-- --------------------------------------------------------

--
-- Estrutura da tabela `validacoes`
--

CREATE TABLE `validacoes` (
  `id` int(10) UNSIGNED NOT NULL,
  `requisito_id` int(10) UNSIGNED NOT NULL,
  `validador_id` int(10) UNSIGNED NOT NULL,
  `resultado` enum('pendente','aprovado','aprovado_com_ressalvas','rejeitado') NOT NULL DEFAULT 'pendente',
  `comentario` text DEFAULT NULL,
  `validado_em` datetime DEFAULT NULL,
  `criado_em` datetime NOT NULL DEFAULT current_timestamp(),
  `atualizado_em` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Validações e aprovações de requisitos pelos stakeholders';

--
-- Extraindo dados da tabela `validacoes`
--

INSERT INTO `validacoes` (`id`, `requisito_id`, `validador_id`, `resultado`, `comentario`, `validado_em`, `criado_em`, `atualizado_em`) VALUES
(1, 1, 3, 'pendente', 'Aguardando revisão do cliente.', NULL, '2026-05-10 04:12:08', '2026-05-10 04:12:08'),
(2, 2, 3, 'pendente', 'Aguardando revisão do cliente.', NULL, '2026-05-10 04:12:08', '2026-05-10 04:12:08');

--
-- Índices para tabelas despejadas
--

--
-- Índices para tabela `projetos`
--
ALTER TABLE `projetos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_gestor_id` (`gestor_id`);

--
-- Índices para tabela `requisitos`
--
ALTER TABLE `requisitos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_projeto_id` (`projeto_id`),
  ADD KEY `idx_tipo` (`tipo`),
  ADD KEY `idx_prioridade` (`prioridade`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_autor_id` (`autor_id`);

--
-- Índices para tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_perfil` (`perfil`);

--
-- Índices para tabela `validacoes`
--
ALTER TABLE `validacoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_requisito_id` (`requisito_id`),
  ADD KEY `idx_validador_id` (`validador_id`),
  ADD KEY `idx_resultado` (`resultado`);

--
-- AUTO_INCREMENT de tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `projetos`
--
ALTER TABLE `projetos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `requisitos`
--
ALTER TABLE `requisitos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `validacoes`
--
ALTER TABLE `validacoes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Restrições para despejos de tabelas
--

--
-- Limitadores para a tabela `projetos`
--
ALTER TABLE `projetos`
  ADD CONSTRAINT `fk_projeto_gestor` FOREIGN KEY (`gestor_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE;

--
-- Limitadores para a tabela `requisitos`
--
ALTER TABLE `requisitos`
  ADD CONSTRAINT `fk_requisito_autor` FOREIGN KEY (`autor_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_requisito_projeto` FOREIGN KEY (`projeto_id`) REFERENCES `projetos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Limitadores para a tabela `validacoes`
--
ALTER TABLE `validacoes`
  ADD CONSTRAINT `fk_validacao_requisito` FOREIGN KEY (`requisito_id`) REFERENCES `requisitos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_validacao_validador` FOREIGN KEY (`validador_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
