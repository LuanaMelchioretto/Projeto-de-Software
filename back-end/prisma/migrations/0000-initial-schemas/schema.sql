-- =========================================================
-- Script de Criação da Estrutura do Banco de Dados
-- =========================================================

CREATE DATABASE IF NOT EXISTS provaplus_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE provaplus_db;

-- 1. Professores (Acesso Web)
CREATE TABLE IF NOT EXISTS professores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    matricula VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 2. Disciplinas
CREATE TABLE IF NOT EXISTS disciplinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 3. Turmas (Vinculadas ao Professor)
CREATE TABLE IF NOT EXISTS turmas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    professor_id INT NOT NULL,
    disciplina_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    semestre VARCHAR(10) NOT NULL,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE RESTRICT,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 4. Alunos
CREATE TABLE IF NOT EXISTS alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    matricula VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 5. Matrículas (Alunos nas Turmas)
CREATE TABLE IF NOT EXISTS matriculas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    turma_id INT NOT NULL,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
    UNIQUE(aluno_id, turma_id)
) ENGINE=InnoDB;

-- 6. Banco de Questões
CREATE TABLE IF NOT EXISTS questoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    professor_id INT NOT NULL,
    disciplina_id INT NOT NULL,
    enunciado TEXT NOT NULL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE RESTRICT,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 7. Alternativas das Questões
CREATE TABLE IF NOT EXISTS alternativas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    questao_id INT NOT NULL,
    texto TEXT NOT NULL,
    eh_correta BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (questao_id) REFERENCES questoes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Avaliações (A Prova Criada)
CREATE TABLE IF NOT EXISTS avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    professor_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    embaralhar_questoes BOOLEAN DEFAULT FALSE,
    embaralhar_alternativas BOOLEAN DEFAULT FALSE,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 9. Composição da Avaliação (Questões da Prova)
CREATE TABLE IF NOT EXISTS avaliacao_questoes (
    avaliacao_id INT NOT NULL,
    questao_id INT NOT NULL,
    ordem INT NOT NULL,
    PRIMARY KEY (avaliacao_id, questao_id),
    FOREIGN KEY (avaliacao_id) REFERENCES avaliacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (questao_id) REFERENCES questoes(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 10. Aplicações (Prova Vinculada à Turma)
CREATE TABLE IF NOT EXISTS aplicacoes_prova (
    id INT AUTO_INCREMENT PRIMARY KEY,
    avaliacao_id INT NOT NULL,
    turma_id INT NOT NULL,
    data_aplicacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (avaliacao_id) REFERENCES avaliacoes(id) ON DELETE RESTRICT,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 11. Versões e QR Code (Identificação do Aluno)
CREATE TABLE IF NOT EXISTS versoes_prova (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aplicacao_id INT NOT NULL,
    aluno_id INT NOT NULL,
    qr_code_hash VARCHAR(255) NOT NULL UNIQUE,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes_prova(id) ON DELETE CASCADE,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 12. Respostas (Correção Automatizada)
CREATE TABLE IF NOT EXISTS respostas_aluno (
    id INT AUTO_INCREMENT PRIMARY KEY,
    versao_prova_id INT NOT NULL,
    questao_id INT NOT NULL,
    alternativa_selecionada_id INT NOT NULL,
    FOREIGN KEY (versao_prova_id) REFERENCES versoes_prova(id) ON DELETE CASCADE,
    FOREIGN KEY (questao_id) REFERENCES questoes(id) ON DELETE RESTRICT,
    FOREIGN KEY (alternativa_selecionada_id) REFERENCES alternativas(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 13. Notas Finais
CREATE TABLE IF NOT EXISTS resultados_aluno (
    id INT AUTO_INCREMENT PRIMARY KEY,
    versao_prova_id INT NOT NULL UNIQUE,
    nota_final DECIMAL(4,2) NOT NULL,
    total_acertos INT NOT NULL,
    FOREIGN KEY (versao_prova_id) REFERENCES versoes_prova(id) ON DELETE CASCADE
) ENGINE=InnoDB;
