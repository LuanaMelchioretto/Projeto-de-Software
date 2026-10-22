CREATE TABLE `tokens_redefinicao_senha` (
    `token_hash` CHAR(64) NOT NULL,
    `professor_id` INTEGER NOT NULL,
    `expira_em` DATETIME(3) NOT NULL,
    `usado_em` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tokens_redefinicao_senha_professor_id_idx`(`professor_id`),
    PRIMARY KEY (`token_hash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `tokens_redefinicao_senha` ADD CONSTRAINT `tokens_redefinicao_senha_professor_id_fkey` FOREIGN KEY (`professor_id`) REFERENCES `professores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
