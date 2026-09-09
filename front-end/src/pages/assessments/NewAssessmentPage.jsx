import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Plus, Save, Search, Trash2 } from "lucide-react";
import PageTitle from "../../components/page-title/PageTitle";
import Button from "../../components/button/Button";
import Card, { CardActions } from "../../components/card/Card";
import EmptyState from "../../components/empty-state/EmptyState";
import Feedback from "../../components/feedback/Feedback";
import SearchField from "../../components/search-field/SearchField";
import { QuestionBankContext } from "../questions/QuestionBankProvider";
import { filterQuestions } from "../questions/questionUtils";
import { AssessmentContext } from "./AssessmentProvider";
import "./AssessmentsPage.css";

export default function NewAssessmentPage() {
  const navigate = useNavigate();
  const { questions } = useContext(QuestionBankContext);
  const { createAssessment } = useContext(AssessmentContext);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [error, setError] = useState(null);
  const filteredQuestions = filterQuestions(questions, search);
  const selectedQuestions = selectedIds.map((id) => questions.find((question) => question.id === id)).filter(Boolean);

  function handleSave(event) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Por favor, informe o título da avaliação.");
      event.currentTarget.elements.name.focus();
      return;
    }
    if (selectedQuestions.length === 0) {
      setError("Selecione pelo menos uma questão para compor a prova.");
      return;
    }
    createAssessment({
      name: name.trim(),
      questionIds: selectedQuestions.map((question) => question.id),
      shuffleQuestions,
      shuffleOptions,
    });
    navigate("/avaliacoes", { state: { feedback: "Avaliação salva com sucesso!" } });
  }

  return (
    <div className="assessments-page">
      <PageTitle
        title="Nova avaliação"
        subtitle="Defina o título e selecione as questões da prova."
        action={<Button variant="secondary" icon={ArrowLeft} onClick={() => navigate("/avaliacoes")}>Voltar para avaliações</Button>}
      />
      {error && <Feedback variant="error" onDismiss={() => setError(null)}>{error}</Feedback>}
      <form className="assessment-form" aria-label="Nova avaliação" onSubmit={handleSave} noValidate>
        <Card header={<h2>Dados da avaliação</h2>}>
          <div className="assessment-field">
            <label htmlFor="assessment-name">Título da avaliação *</label>
            <input
              id="assessment-name"
              name="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Prova Parcial de Algoritmos"
            />
          </div>
          <fieldset className="assessment-settings">
            <legend>Opções de embaralhamento</legend>
            <label>
              <input type="checkbox" checked={shuffleQuestions} onChange={(event) => setShuffleQuestions(event.target.checked)} />
              Embaralhar a ordem das questões
            </label>
            <label>
              <input type="checkbox" checked={shuffleOptions} onChange={(event) => setShuffleOptions(event.target.checked)} />
              Embaralhar a ordem das alternativas das questões
            </label>
          </fieldset>
        </Card>

        <Card as="section" aria-labelledby="selected-questions-title" header={<h2 id="selected-questions-title">Questões selecionadas ({selectedQuestions.length})</h2>}>
          {selectedQuestions.length === 0 ? <p>Nenhuma questão selecionada ainda.</p> : (
            <ol className="assessment-questions">
              {selectedQuestions.map((question, index) => (
                <li key={question.id}>
                  <p><strong>Q{index + 1}:</strong> {question.text}</p>
                  <Button
                    variant="icon"
                    icon={Trash2}
                    aria-label={`Remover questão ${question.id}`}
                    onClick={() => setSelectedIds((current) => current.filter((id) => id !== question.id))}
                  />
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card as="section" aria-labelledby="available-questions-title" header={<h2 id="available-questions-title">Banco de questões disponíveis</h2>}>
          <SearchField
            className="assessments-search"
            label="Buscar pelo texto da questão"
            placeholder="Buscar pelo texto da questão…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
          />
          {questions.length === 0 ? (
            <EmptyState icon={BookOpen} title="Seu banco de questões está vazio" description="Cadastre questões no banco para compor uma avaliação." />
          ) : filteredQuestions.length === 0 ? (
            <EmptyState icon={Search} title="Nenhuma questão encontrada" description="Tente outro trecho do enunciado ou limpe a busca." />
          ) : (
            <ul className="assessment-questions assessment-question-bank">
              {filteredQuestions.map((question) => {
                const selected = selectedIds.includes(question.id);
                return (
                  <li key={question.id}>
                    <p>{question.text}</p>
                    <Button
                      variant="secondary"
                      icon={selected ? undefined : Plus}
                      disabled={selected}
                      aria-label={`${selected ? "Questão selecionada" : "Adicionar questão"} ${question.id}`}
                      onClick={() => setSelectedIds((current) => current.includes(question.id) ? current : [...current, question.id])}
                    >
                      {selected ? "Selecionada" : "Adicionar"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <CardActions>
          <Button variant="secondary" onClick={() => navigate("/avaliacoes")}>Cancelar</Button>
          <Button type="submit" icon={Save}>Salvar avaliação</Button>
        </CardActions>
      </form>
    </div>
  );
}
