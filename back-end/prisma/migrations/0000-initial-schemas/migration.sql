-- CreateTable
CREATE TABLE `alternativas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `questao_id` INTEGER NOT NULL,
    `texto` TEXT NOT NULL,
    `eh_correta` BOOLEAN NOT NULL DEFAULT false,

    INDEX `alternativas_questao_id_idx`(`questao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alunos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `matricula` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `alunos_matricula_key`(`matricula`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aplicacoes_prova` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `avaliacao_id` INTEGER NOT NULL,
    `turma_id` INTEGER NOT NULL,
    `data_aplicacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `aplicacoes_prova_avaliacao_id_idx`(`avaliacao_id`),
    INDEX `aplicacoes_prova_turma_id_idx`(`turma_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avaliacao_questoes` (
    `avaliacao_id` INTEGER NOT NULL,
    `questao_id` INTEGER NOT NULL,
    `ordem` INTEGER NOT NULL,

    INDEX `avaliacao_questoes_questao_id_idx`(`questao_id`),
    PRIMARY KEY (`avaliacao_id`, `questao_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avaliacoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `professor_id` INTEGER NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `embaralhar_questoes` BOOLEAN NOT NULL DEFAULT false,
    `embaralhar_alternativas` BOOLEAN NOT NULL DEFAULT false,
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `avaliacoes_professor_id_idx`(`professor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disciplinas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `codigo` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `disciplinas_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matriculas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aluno_id` INTEGER NOT NULL,
    `turma_id` INTEGER NOT NULL,

    INDEX `matriculas_turma_id_idx`(`turma_id`),
    UNIQUE INDEX `matriculas_aluno_id_turma_id_key`(`aluno_id`, `turma_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `professores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `senha_hash` VARCHAR(255) NOT NULL,
    `matricula` VARCHAR(50) NOT NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `professores_email_key`(`email`),
    UNIQUE INDEX `professores_matricula_key`(`matricula`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `professor_id` INTEGER NOT NULL,
    `disciplina_id` INTEGER NOT NULL,
    `enunciado` TEXT NOT NULL,
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `questoes_professor_id_idx`(`professor_id`),
    INDEX `questoes_disciplina_id_idx`(`disciplina_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `respostas_aluno` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `versao_prova_id` INTEGER NOT NULL,
    `questao_id` INTEGER NOT NULL,
    `alternativa_selecionada_id` INTEGER NOT NULL,

    INDEX `respostas_aluno_versao_prova_id_idx`(`versao_prova_id`),
    INDEX `respostas_aluno_questao_id_idx`(`questao_id`),
    INDEX `respostas_aluno_alternativa_selecionada_id_idx`(`alternativa_selecionada_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resultados_aluno` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `versao_prova_id` INTEGER NOT NULL,
    `nota_final` DECIMAL(4, 2) NOT NULL,
    `total_acertos` INTEGER NOT NULL,

    UNIQUE INDEX `resultados_aluno_versao_prova_id_key`(`versao_prova_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `turmas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `professor_id` INTEGER NOT NULL,
    `disciplina_id` INTEGER NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `semestre` VARCHAR(10) NOT NULL,

    INDEX `turmas_professor_id_idx`(`professor_id`),
    INDEX `turmas_disciplina_id_idx`(`disciplina_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `versoes_prova` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aplicacao_id` INTEGER NOT NULL,
    `aluno_id` INTEGER NOT NULL,
    `qr_code_hash` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `versoes_prova_qr_code_hash_key`(`qr_code_hash`),
    INDEX `versoes_prova_aplicacao_id_idx`(`aplicacao_id`),
    INDEX `versoes_prova_aluno_id_idx`(`aluno_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `alternativas` ADD CONSTRAINT `alternativas_questao_id_fkey` FOREIGN KEY (`questao_id`) REFERENCES `questoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aplicacoes_prova` ADD CONSTRAINT `aplicacoes_prova_avaliacao_id_fkey` FOREIGN KEY (`avaliacao_id`) REFERENCES `avaliacoes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aplicacoes_prova` ADD CONSTRAINT `aplicacoes_prova_turma_id_fkey` FOREIGN KEY (`turma_id`) REFERENCES `turmas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacao_questoes` ADD CONSTRAINT `avaliacao_questoes_avaliacao_id_fkey` FOREIGN KEY (`avaliacao_id`) REFERENCES `avaliacoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacao_questoes` ADD CONSTRAINT `avaliacao_questoes_questao_id_fkey` FOREIGN KEY (`questao_id`) REFERENCES `questoes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacoes` ADD CONSTRAINT `avaliacoes_professor_id_fkey` FOREIGN KEY (`professor_id`) REFERENCES `professores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matriculas` ADD CONSTRAINT `matriculas_aluno_id_fkey` FOREIGN KEY (`aluno_id`) REFERENCES `alunos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matriculas` ADD CONSTRAINT `matriculas_turma_id_fkey` FOREIGN KEY (`turma_id`) REFERENCES `turmas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questoes` ADD CONSTRAINT `questoes_professor_id_fkey` FOREIGN KEY (`professor_id`) REFERENCES `professores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questoes` ADD CONSTRAINT `questoes_disciplina_id_fkey` FOREIGN KEY (`disciplina_id`) REFERENCES `disciplinas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `respostas_aluno` ADD CONSTRAINT `respostas_aluno_versao_prova_id_fkey` FOREIGN KEY (`versao_prova_id`) REFERENCES `versoes_prova`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `respostas_aluno` ADD CONSTRAINT `respostas_aluno_questao_id_fkey` FOREIGN KEY (`questao_id`) REFERENCES `questoes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `respostas_aluno` ADD CONSTRAINT `respostas_aluno_alternativa_selecionada_id_fkey` FOREIGN KEY (`alternativa_selecionada_id`) REFERENCES `alternativas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resultados_aluno` ADD CONSTRAINT `resultados_aluno_versao_prova_id_fkey` FOREIGN KEY (`versao_prova_id`) REFERENCES `versoes_prova`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turmas` ADD CONSTRAINT `turmas_professor_id_fkey` FOREIGN KEY (`professor_id`) REFERENCES `professores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turmas` ADD CONSTRAINT `turmas_disciplina_id_fkey` FOREIGN KEY (`disciplina_id`) REFERENCES `disciplinas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `versoes_prova` ADD CONSTRAINT `versoes_prova_aplicacao_id_fkey` FOREIGN KEY (`aplicacao_id`) REFERENCES `aplicacoes_prova`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `versoes_prova` ADD CONSTRAINT `versoes_prova_aluno_id_fkey` FOREIGN KEY (`aluno_id`) REFERENCES `alunos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
