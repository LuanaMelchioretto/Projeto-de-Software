import React from "react";
import PageTitle from "../components/page-title/PageTitle";

export default function NotFoundPage({ title = "Página não encontrada" }) {
  return <PageTitle title={title} />;
}
