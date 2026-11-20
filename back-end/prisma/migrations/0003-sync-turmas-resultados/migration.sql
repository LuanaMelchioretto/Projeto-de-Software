-- Campos usados pelo dashboard, cadastro de turmas e resultados que ainda
-- nao estavam presentes no historico de migracoes.
ALTER TABLE `turmas`
    ADD COLUMN `identificacao` VARCHAR(50) NULL,
    ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;

-- Preserva turmas existentes e fornece uma identificacao unica para cada uma.
UPDATE `turmas` SET `identificacao` = CONCAT('TURMA-', `id`);

ALTER TABLE `turmas`
    MODIFY COLUMN `identificacao` VARCHAR(50) NOT NULL,
    ADD UNIQUE INDEX `turmas_professor_id_identificacao_key` (`professor_id`, `identificacao`);

ALTER TABLE `resultados_aluno`
    ADD COLUMN `liberado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `token_acesso` VARCHAR(191) NULL,
    ADD UNIQUE INDEX `resultados_aluno_token_acesso_key` (`token_acesso`);
