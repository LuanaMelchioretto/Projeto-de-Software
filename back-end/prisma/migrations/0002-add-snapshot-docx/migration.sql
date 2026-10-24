ALTER TABLE `versoes_prova`
ADD COLUMN `conteudo_snapshot` JSON NOT NULL,
ADD COLUMN `caminho_docx` VARCHAR(255) NULL;
