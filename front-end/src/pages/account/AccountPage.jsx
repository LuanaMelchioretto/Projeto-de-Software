import React, { useEffect, useRef, useState } from "react";
import { Trash2, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../auth/api";
import { passwordHint, validatePassword } from "../../auth/passwordPolicy";
import { useAuth } from "../../auth/AuthContext";
import PageTitle from "../../components/page-title/PageTitle";
import "./AccountPage.css";

export default function AccountPage() {
  const navigate = useNavigate();

  const { user, updateUser, endSession } = useAuth();
  const [form, setForm] = useState({
    nome: user.nome,
    matricula: user.matricula,
  });
  const [password, setPassword] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmacao: "",
  });
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cancelDeleteRef = useRef(null);

  useEffect(() => {
    let active = true;

    api(`/professores/${user.id}`)
      .then((fresh) => {
        if (!active) return;
        setForm({ nome: fresh.nome, matricula: fresh.matricula });
        updateUser(fresh);
      })
      .catch((error) => {
        if (active) setFeedback({ type: "error", message: error.message });
      });
    return () => {
      active = false;
    };
  }, [user.id, updateUser]);

  useEffect(() => {
    if (!confirmDelete) return undefined;

    cancelDeleteRef.current?.focus();

    const onEscape = (event) => {
      if (event.key === "Escape" && !busy) setConfirmDelete(false);
    };

    window.addEventListener("keydown", onEscape);

    return () => window.removeEventListener("keydown", onEscape);
  }, [confirmDelete, busy]);

  const change = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));
  const changePasswordField = (field) => (event) =>
    setPassword((current) => ({ ...current, [field]: event.target.value }));

  async function saveProfile(event) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);

    try {
      const updated = await api(`/professores/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      updateUser(updated);
      setForm({ nome: updated.nome, matricula: updated.matricula });
      setFeedback({ type: "success", message: "Dados salvos com sucesso." });
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setFeedback(null);

    const passwordError = validatePassword(password.novaSenha);

    if (passwordError) {
      setFeedback({ type: "error", message: passwordError });
      return;
    }
    if (password.novaSenha !== password.confirmacao) {
      setFeedback({
        type: "error",
        message: "A confirmação da senha não confere.",
      });

      return;
    }
    setBusy(true);
    try {
      await api(`/professores/${user.id}/senha`, {
        method: "PATCH",
        body: JSON.stringify({
          senhaAtual: password.senhaAtual,
          novaSenha: password.novaSenha,
        }),
      });
      endSession();
      navigate("/login", { replace: true, state: { passwordChanged: true } });
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    setBusy(true);
    setFeedback(null);
    try {
      await api(`/professores/${user.id}`, { method: "DELETE" });
      endSession();
      navigate("/login", { replace: true, state: { accountDeleted: true } });
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <section className="account-page">
      <PageTitle
        title="Minha conta"
        subtitle="Consulte e atualize seus dados de professor."
      />
      
      {feedback && (
        <p
          className={`account-feedback ${feedback.type}`}
          role={feedback.type === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      )}

      <div className="account-grid">

        <form className="account-card" onSubmit={saveProfile}>
          <h2>Dados da conta</h2>

          <label>
            Nome
            <input
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              value={form.nome}
              onChange={change("nome")}
            />
          </label>

          <label>
            E-mail
            <input
              type="email"
              value={user.email}
              readOnly
              aria-describedby="account-email-hint"
            />
          </label>

          <p id="account-email-hint">
            O e-mail de acesso não pode ser alterado.
          </p>

          <label>
            Matrícula
            <input
              required
              maxLength={50}
              value={form.matricula}
              onChange={change("matricula")}
            />
          </label>

          <p>
            Situação: <strong>{user.status === 1 ? "Ativa" : "Inativa"}</strong>
          </p>

          <button type="submit" className="primary" disabled={busy}>
            Salvar alterações
          </button>
        </form>

        <form className="account-card" onSubmit={changePassword}>
          <h2>Trocar senha</h2>

          <label>
            Senha atual
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password.senhaAtual}
              onChange={changePasswordField("senhaAtual")}
            />
          </label>

          <label>
            Nova senha
            <input
              required
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={password.novaSenha}
              onChange={changePasswordField("novaSenha")}
            />
          </label>

          <p>{passwordHint}</p>

          <label>
            Confirmar nova senha
            <input
              required
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={password.confirmacao}
              onChange={changePasswordField("confirmacao")}
            />
          </label>

          <p>Após a troca, entre novamente com a nova senha.</p>

          <button type="submit" className="primary" disabled={busy}>
            Alterar senha
          </button>

        </form>

      </div>

      <div className="account-card account-danger">
        <div className="account-danger-icon">
          <Trash2 size={22} aria-hidden="true" />
        </div>

        <div className="account-danger-copy">
          <h2>Excluir conta</h2>
          <p>Encerre seu acesso ao sistema. Seu histórico será preservado.</p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          disabled={busy}
        >
          Excluir minha conta
        </button>

      </div>

      {confirmDelete && (
        <div className="account-dialog-backdrop">
          <div
            className="account-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-description"
          >
            <div className="account-dialog-icon">
              <TriangleAlert size={25} aria-hidden="true" />
            </div>

            <h2 id="delete-account-title">Excluir sua conta?</h2>
            <p id="delete-account-description">
              Você perderá o acesso imediatamente e suas sessões serão
              encerradas. Seus dados e histórico serão preservados.
            </p>

            <div className="account-dialog-actions">
              <button
                type="button"
                ref={cancelDeleteRef}
                className="account-dialog-cancel"
                onClick={() => setConfirmDelete(false)}
                disabled={busy}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="account-dialog-confirm"
                onClick={deleteAccount}
                disabled={busy}
              >
                {busy ? "Excluindo..." : "Sim, excluir conta"}
              </button>
            </div>
          </div>
        </div>

      )}
    </section>
  );
}
