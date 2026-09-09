import React, { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FileText, Search } from "lucide-react";
import PageTitle from "../../components/page-title/PageTitle";
import Button from "../../components/button/Button";
import { CreateButton, ViewButton } from "../../components/button/ActionButtons";
import Card from "../../components/card/Card";
import EmptyState from "../../components/empty-state/EmptyState";
import Feedback, { FEEDBACK_DURATION } from "../../components/feedback/Feedback";
import SearchField from "../../components/search-field/SearchField";
import { AssessmentContext } from "./AssessmentProvider";
import { ClassContext } from "../classes/ClassProvider";
import "./AssessmentsPage.css";

export default function AssessmentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { assessments } = useContext(AssessmentContext);
  const { classes } = useContext(ClassContext);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState(location.state?.feedback ?? null);
  const filteredAssessments = assessments.filter((assessment) =>
    assessment.name.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")),
  );

  function dismissFeedback() {
    setFeedback(null);
    navigate(location.pathname, { replace: true, state: null });
  }

  return (
    <div className="assessments-page">
      <PageTitle
        title="Avaliações"
        subtitle="Gerencie suas provas e aplicações."
        action={<CreateButton onClick={() => navigate("/avaliacoes/nova")}>Nova avaliação</CreateButton>}
      />
      {feedback && <Feedback duration={FEEDBACK_DURATION} onDismiss={dismissFeedback}>{feedback}</Feedback>}
      <SearchField
        className="assessments-search"
        label="Buscar pelo nome da avaliação"
        placeholder="Buscar pelo nome da avaliação…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onClear={() => setSearch("")}
      />
      {assessments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma avaliação cadastrada"
          description="Crie sua primeira avaliação usando as questões do banco."
          action={<CreateButton onClick={() => navigate("/avaliacoes/nova")}>Nova avaliação</CreateButton>}
        />
      ) : filteredAssessments.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhuma avaliação encontrada"
          description="Tente outro nome ou limpe a busca para ver todas as avaliações."
          action={<Button variant="secondary" onClick={() => setSearch("")}>Ver todas as avaliações</Button>}
        />
      ) : (
        <div className="assessment-list">
          {filteredAssessments.map((assessment) => (
            <Card
              as="article"
              key={assessment.id}
              aria-label={assessment.name}
              header={<><h2>{assessment.name}</h2><span className="tag">{assessment.status}</span></>}
              footer={(
                <>
                  <span>{assessment.questionCount} {assessment.questionCount === 1 ? "questão" : "questões"}</span>
                  <ViewButton aria-label={`Visualizar ${assessment.name}`} onClick={() => navigate(`/avaliacoes/${assessment.id}`)} />
                </>
              )}
            >
              <p>{classes.find((schoolClass) => schoolClass.id === assessment.classId)?.name ?? "Turma não definida"}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
