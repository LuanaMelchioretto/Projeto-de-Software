-- CreateTable
CREATE TABLE `sessoes` (
    `jti` VARCHAR(36) NOT NULL,
    `professor_id` INTEGER NOT NULL,
    `expira_em` DATETIME(3) NOT NULL,
    `revogada_em` DATETIME(3) NULL,
    `criada_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sessoes_professor_id_idx`(`professor_id`),
    PRIMARY KEY (`jti`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessoes` ADD CONSTRAINT `sessoes_professor_id_fkey` FOREIGN KEY (`professor_id`) REFERENCES `professores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
