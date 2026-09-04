import React, { useState } from "react";
import { Routes, Route, NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, FileQuestion, ClipboardList, Users, ScanLine,
  BarChart3, LogOut, Plus, Search, ArrowLeft, ArrowRight,
  CheckCircle2, XCircle, Download, Eye, Shuffle, QrCode,
  FileText, Upload, ChevronRight
} from "lucide-react";

const questions = [
  {id:1, text:"Qual é o resultado de 2 + 2?", options:["3","4","5","6"], answer:1, topic:"Operações", difficulty:"Fácil"},
  {id:2, text:"Qual é a média de 4, 6 e 8?", options:["5","6","7","8"], answer:1, topic:"Estatística", difficulty:"Fácil"},
  {id:3, text:"Em uma distribuição normal, aproximadamente quantos dados ficam entre -1 e +1 desvio padrão?", options:["50%","68%","95%","99%"], answer:1, topic:"Probabilidade", difficulty:"Média"},
  {id:4, text:"Qual medida representa o valor central de um conjunto ordenado?", options:["Média","Variância","Mediana","Amplitude"], answer:2, topic:"Estatística", difficulty:"Fácil"},
  {id:5, text:"Qual é a probabilidade de obter cara em uma moeda justa?", options:["10%","25%","50%","75%"], answer:2, topic:"Probabilidade", difficulty:"Fácil"},
  {id:6, text:"Qual gráfico é mais adequado para comparar categorias?", options:["Barras","Dispersão","Histograma","Linha"], answer:0, topic:"Gráficos", difficulty:"Média"}
];

const students = [
  ["001","Maria Silva","8,0","8/10"], ["002","João Souza","7,0","7/10"],
  ["003","Ana Costa","9,0","9/10"], ["004","Pedro Lima","6,0","6/10"],
  ["005","Laura Mendes","8,5","8,5/10"]
];

function Layout({children}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed,setCollapsed] = useState(false);
  const nav = [
    ["/","Dashboard",LayoutDashboard],
    ["/questoes","Questões",FileQuestion],
    ["/avaliacoes","Avaliações",ClipboardList],
    ["/turmas","Turmas",Users],
    ["/correcoes","Correções",ScanLine],
    ["/relatorios","Relatórios",BarChart3],
  ];
  return <div className={"app "+(collapsed?"collapsed":"")}>
    <aside className="sidebar">
      <div className="brand" onClick={()=>navigate("/")}>
        <div className="logo">P</div><span>Prova<span>+</span></span>
      </div>
      <nav>{nav.map(([to,label,Icon])=>
        <NavLink key={to} to={to} className={({isActive})=>isActive?"active":""}>
          <Icon size={19}/><span>{label}</span>
        </NavLink>
      )}</nav>
      <div className="sidebar-bottom">
        <button onClick={()=>navigate("/login")}><LogOut size={18}/><span>Sair</span></button>
        <button className="collapse" onClick={()=>setCollapsed(!collapsed)}>{collapsed?"→":"←"}<span>Recolher menu</span></button>
      </div>
    </aside>
    <main className="main">
      <header className="topbar">
        <div className="crumb">{location.pathname === "/" ? "Visão geral" : "Prova+ / "+(nav.find(n=>n[0]===location.pathname)?.[1] || "Sistema")}</div>
        <div className="profile"><div className="avatar">PL</div><div><b>Prof. Luana</b><small>Professor</small></div></div>
      </header>
      <section className="content">{children}</section>
    </main>
  </div>
}

function Login(){
  const navigate=useNavigate();
  const [email,setEmail]=useState(""); const [pass,setPass]=useState("");
  return <div className="login-page">
    <div className="login-card">
      <div className="brand center"><div className="logo">P</div><span>Prova<span>+</span></span></div>
      <h1>Bem-vindo de volta</h1><p>Acesse sua conta para gerenciar suas avaliações.</p>
      <label>E-mail<input value={email} onChange={e=>setEmail(e.target.value)} placeholder="professor@exemplo.com"/></label>
      <label>Senha<input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••"/></label>
      <div className="row-between"><label className="check"><input type="checkbox"/> Lembrar de mim</label><a>Esqueci minha senha</a></div>
      <button className="primary full" onClick={()=>navigate("/")}>Entrar</button>
      <small className="demo">N1 — dados demonstrativos / mock</small>
    </div>
  </div>
}

function Dashboard(){
 const navigate=useNavigate();
 return <><PageTitle title="Olá, Prof. Luana 👋" subtitle="Tenha uma visão rápida das suas avaliações."/>
 <div className="stats">
  <Stat label="Avaliações" value="12" note="+2 este mês" icon={<ClipboardList/>}/>
  <Stat label="Questões" value="86" note="+14 este mês" icon={<FileQuestion/>}/>
  <Stat label="Alunos" value="148" note="em 5 turmas" icon={<Users/>}/>
  <Stat label="Correções" value="38" note="esta semana" icon={<ScanLine/>}/>
 </div>
 <div className="grid2">
  <Card title="Avaliações recentes" action={<button className="text-btn" onClick={()=>navigate("/avaliacoes")}>Ver todas <ChevronRight size={16}/></button>}>
   {[["P1 - Probabilidade","3ª fase • 40 alunos","Corrigida"],["P2 - Estatística","3ª fase • 38 alunos","Em andamento"],["N1 - Fundamentos","2ª fase • 35 alunos","Rascunho"]].map((x,i)=>
    <div className="list-row" key={i}><div className="icon-box"><FileText size={18}/></div><div className="grow"><b>{x[0]}</b><small>{x[1]}</small></div><Status text={x[2]}/></div>)}
  </Card>
  <Card title="Ações rápidas">
    <div className="quick-grid">
      <button onClick={()=>navigate("/questoes")}><Plus/><b>Nova questão</b><small>Cadastrar no banco</small></button>
      <button onClick={()=>navigate("/avaliacoes/nova")}><ClipboardList/><b>Nova avaliação</b><small>Montar uma prova</small></button>
      <button onClick={()=>navigate("/correcoes")}><ScanLine/><b>Corrigir provas</b><small>Iniciar leitura</small></button>
      <button onClick={()=>navigate("/relatorios")}><BarChart3/><b>Ver relatórios</b><small>Analisar resultados</small></button>
    </div>
  </Card>
 </div>
 </> 
}

function Stat({label,value,note,icon}){return <div className="stat"><div className="stat-icon">{icon}</div><small>{label}</small><strong>{value}</strong><span>{note}</span></div>}
function Status({text}){return <span className={"status "+text.toLowerCase().replaceAll(" ","-")}>{text}</span>}
function PageTitle({title,subtitle,action}){return <div className="page-title"><div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>}
function Card({title,action,children}){return <div className="card"><div className="card-head"><h3>{title}</h3>{action}</div>{children}</div>}

function Questions(){
 const [search,setSearch]=useState("");
 const filtered=questions.filter(q=>q.text.toLowerCase().includes(search.toLowerCase()));
 return <><PageTitle title="Banco de questões" subtitle="Crie, consulte e organize suas questões objetivas." action={<button className="primary"><Plus size={18}/> Nova questão</button>}/>
 <div className="toolbar"><div className="search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar questão..."/></div><select><option>Todas as disciplinas</option><option>Probabilidade</option><option>Estatística</option></select><select><option>Todas as dificuldades</option><option>Fácil</option><option>Média</option></select></div>
 <div className="question-list">{filtered.map(q=><Card key={q.id} title={"Questão "+String(q.id).padStart(2,"0")} action={<span className="tag">{q.topic} • {q.difficulty}</span>}><p className="question-text">{q.text}</p><div className="options">{q.options.map((o,i)=><div className={i===q.answer?"correct":""} key={o}><span>{String.fromCharCode(65+i)}</span>{o}{i===q.answer&&<CheckCircle2 size={16}/>}</div>)}</div><div className="card-actions"><button>Editar</button><button>Duplicar</button></div></Card>)}</div>
 </>
}

function Assessments(){
 const navigate=useNavigate();
 return <><PageTitle title="Avaliações" subtitle="Crie provas, gere versões e acompanhe as correções." action={<button className="primary" onClick={()=>navigate("/avaliacoes/nova")}><Plus/> Nova avaliação</button>}/>
 <Card title="Suas avaliações">
 <table><thead><tr><th>Nome</th><th>Turma</th><th>Questões</th><th>Alunos</th><th>Status</th><th></th></tr></thead><tbody>
 {[["P1 - Probabilidade","3ª fase","10","40","Corrigida"],["P2 - Estatística","3ª fase","12","38","Em andamento"],["N1 - Fundamentos","2ª fase","8","35","Rascunho"],["Revisão - Gráficos","2ª fase","6","35","Corrigida"]].map((r,i)=><tr key={i}><td><b>{r[0]}</b></td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td><Status text={r[4]}/></td><td><button className="icon-btn" onClick={()=>navigate("/avaliacoes/"+(i+1))}><Eye size={17}/></button></td></tr>)}
 </tbody></table></Card></>
}

function NewAssessment(){
 const navigate=useNavigate(); const [shuffle,setShuffle]=useState(true); const [alt,setAlt]=useState(true); const [versions,setVersions]=useState(40);
 return <><Back/><PageTitle title="Nova avaliação" subtitle="Configure a prova e escolha as questões."/>
 <div className="form-grid"><Card title="Informações"><label>Nome da avaliação<input defaultValue="P1 - Probabilidade"/></label><label>Turma<select><option>Engenharia de Software — 3ª fase</option><option>Engenharia de Software — 2ª fase</option></select></label><label>Valor total<input type="number" defaultValue="10"/></label></Card>
 <Card title="Questões"><div className="select-all"><b>Questões selecionadas</b><span>6 selecionadas</span></div>{questions.map(q=><label className="question-check" key={q.id}><input type="checkbox" defaultChecked={q.id<=5}/><span><b>Q{q.id}</b> {q.text}</span><small>{q.options.length} alternativas</small></label>)}</Card></div>
 <Card title="Configurações de geração"><div className="settings"><label className="switch"><input type="checkbox" checked={shuffle} onChange={e=>setShuffle(e.target.checked)}/><span/>Embaralhar questões</label><label className="switch"><input type="checkbox" checked={alt} onChange={e=>setAlt(e.target.checked)}/><span/>Embaralhar alternativas</label><label>Quantidade de versões<input type="number" value={versions} onChange={e=>setVersions(e.target.value)}/></label></div></Card>
 <div className="bottom-actions"><button className="secondary" onClick={()=>navigate("/avaliacoes")}>Cancelar</button><button className="primary" onClick={()=>navigate("/avaliacoes/1/gerar")}><Shuffle/> Gerar provas</button></div>
 </>
}

function Generate(){
 const navigate=useNavigate();
 return <><Back/><PageTitle title="Provas geradas" subtitle="A avaliação foi configurada e as versões estão prontas."/>
 <div className="success-banner"><CheckCircle2/><div><b>Geração concluída!</b><span>40 versões foram geradas com sucesso.</span></div></div>
 <div className="stats"><Stat label="Versões" value="40" note="geradas" icon={<Shuffle/>}/><Stat label="Questões" value="10" note="por prova" icon={<FileQuestion/>}/><Stat label="Identificação" value="QR Code" note="por folha" icon={<QrCode/>}/></div>
 <div className="grid2"><Card title="Arquivos da avaliação"><FileAction icon={<FileText/>} title="Caderno de provas" text="40 versões • PDF"/><FileAction icon={<QrCode/>} title="Folhas de resposta" text="40 folhas • PDF"/><FileAction icon={<CheckCircle2/>} title="Gabarito" text="1 arquivo • PDF"/></Card>
 <Card title="Configuração aplicada"><Info label="Embaralhamento" value="Questões e alternativas"/><Info label="Turma" value="Engenharia de Software — 3ª fase"/><Info label="Alunos" value="40 identificados"/></Card></div>
 <div className="bottom-actions"><button className="secondary" onClick={()=>navigate("/avaliacoes")}>Voltar às avaliações</button><button className="primary" onClick={()=>navigate("/correcoes")}><ScanLine/> Ir para correção</button></div>
 </>
}
function FileAction({icon,title,text}){return <div className="file-action"><div className="icon-box">{icon}</div><div className="grow"><b>{title}</b><small>{text}</small></div><button className="icon-btn"><Download size={17}/></button></div>}
function Info({label,value}){return <div className="info"><span>{label}</span><b>{value}</b></div>}
function Back(){const n=useNavigate();return <button className="back" onClick={()=>n(-1)}><ArrowLeft size={17}/> Voltar</button>}

function Classes(){
 return <><PageTitle title="Turmas" subtitle="Organize os alunos que participarão das avaliações." action={<button className="primary"><Plus/> Nova turma</button>}/><div className="class-grid">
 {[["Engenharia de Software — 3ª fase","Probabilidade e Estatística","40 alunos","2026"],["Engenharia de Software — 2ª fase","Fundamentos","35 alunos","2026"],["Banco de Dados — 3ª fase","Banco de Dados II","38 alunos","2026"],["Desenvolvimento Web — 4ª fase","Web","35 alunos","2026"]].map((c,i)=><Card key={i} title={c[0]} action={<span className="tag">{c[3]}</span>}><p>{c[1]}</p><div className="class-foot"><span><Users size={16}/> {c[2]}</span><button className="text-btn">Ver alunos <ChevronRight size={16}/></button></div></Card>)}
 </div></>
}

function Corrections(){
 const navigate=useNavigate();
 return <><PageTitle title="Correção de provas" subtitle="Leia as folhas de resposta e acompanhe o processamento." action={<button className="primary"><Upload/> Enviar folhas</button>}/>
 <Card title="Selecione a avaliação"><select className="large-select"><option>P1 - Probabilidade — 3ª fase</option><option>P2 - Estatística — 3ª fase</option></select></Card>
 <div className="scan-area"><div className="scan-icon"><QrCode size={42}/></div><h2>Pronto para corrigir</h2><p>Leia o QR Code da folha ou envie imagens/PDFs das folhas de resposta.</p><button className="primary" onClick={()=>navigate("/correcoes/resultado")}><ScanLine/> Iniciar leitura</button><small>Fluxo demonstrativo da N1</small></div>
 <div className="progress-card"><div><b>Última correção</b><span>P1 - Probabilidade • 40 provas</span></div><Status text="Corrigida"/><button className="icon-btn"><Eye size={17}/></button></div>
 </>
}

function CorrectionResult(){
 const navigate=useNavigate();
 const answer=[1,0,2,2,2,0,1,3,1,2];
 const key=[1,1,2,2,2,0,1,3,1,0];
 return <><Back/><PageTitle title="Resultado da correção" subtitle="P1 - Probabilidade • processamento demonstrativo"/>
 <div className="result-head"><div><small>Aluno identificado</small><h2>Maria Silva</h2><span>RA 001 • Versão B • QR Code #827361</span></div><div className="big-score">8,0<small>/ 10</small></div></div>
 <Card title="Detalhamento das respostas"><table><thead><tr><th>Questão</th><th>Gabarito</th><th>Marcada</th><th>Resultado</th></tr></thead><tbody>{answer.map((a,i)=><tr key={i}><td>Questão {i+1}</td><td><b>{String.fromCharCode(65+key[i])}</b></td><td><b>{String.fromCharCode(65+a)}</b></td><td>{a===key[i]?<span className="ok"><CheckCircle2 size={17}/> Acertou</span>:<span className="error"><XCircle size={17}/> Errou</span>}</td></tr>)}</tbody></table></Card>
 <div className="bottom-actions"><button className="secondary" onClick={()=>navigate("/correcoes")}>Voltar</button><button className="primary" onClick={()=>navigate("/relatorios")}><BarChart3/> Ver estatísticas</button></div>
 </>
}

function Reports(){
 const data=[["Q1","B","B","90%","B"],["Q2","C","A","35%","A"],["Q3","D","D","72%","D"],["Q4","A","C","48%","C"],["Q5","B","B","84%","B"],["Q6","A","A","76%","A"]];
 return <><PageTitle title="Relatórios" subtitle="Analise o desempenho da turma e exporte os resultados." action={<button className="primary"><Download/> Exportar Excel</button>}/>
 <div className="stats"><Stat label="Média da turma" value="7,8" note="de 10 pontos" icon={<BarChart3/>}/><Stat label="Aproveitamento" value="78%" note="acertos" icon={<CheckCircle2/>}/><Stat label="Maior nota" value="10,0" note="3 alunos" icon={<CheckCircle2/>}/><Stat label="Menor nota" value="4,0" note="1 aluno" icon={<XCircle/>}/></div>
 <div className="grid2"><Card title="Notas dos alunos"><table><thead><tr><th>RA</th><th>Aluno</th><th>Acertos</th><th>Nota</th></tr></thead><tbody>{students.map(s=><tr><td>{s[0]}</td><td><b>{s[1]}</b></td><td>{s[3]}</td><td><b>{s[2]}</b></td></tr>)}</tbody></table></Card>
 <Card title="Alternativa mais marcada por questão"><table><thead><tr><th>Questão</th><th>Gabarito</th><th>Mais marcada</th><th>Acertos</th></tr></thead><tbody>{data.map(d=><tr><td><b>{d[0]}</b></td><td>{d[1]}</td><td><span className={d[1]===d[4]?"ok":"warn"}>{d[4]}</span></td><td>{d[3]}</td></tr>)}</tbody></table></Card></div>
 <Card title="Distribuição das respostas"><div className="bars">{data.map(d=><div className="bar-row"><b>{d[0]}</b><div className="bar"><span style={{width:d[3]}}/></div><small>{d[3]}</small></div>)}</div></Card>
 </>
}

function AssessmentDetail(){const navigate=useNavigate();return <><Back/><PageTitle title="P1 - Probabilidade" subtitle="3ª fase • 40 alunos" action={<button className="primary" onClick={()=>navigate("/avaliacoes/1/gerar")}><Shuffle/> Gerar versões</button>}/><div className="grid2"><Card title="Resumo"><Info label="Questões" value="10"/><Info label="Valor" value="10 pontos"/><Info label="Versões" value="40"/><Info label="Status" value="Corrigida"/></Card><Card title="Configurações"><Info label="Questões" value="Embaralhadas"/><Info label="Alternativas" value="Embaralhadas"/><Info label="Identificação" value="QR Code"/></Card></div><Card title="Ações"><div className="quick-grid"><button onClick={()=>navigate("/avaliacoes/1/gerar")}><FileText/><b>Visualizar prova</b><small>Versões geradas</small></button><button onClick={()=>navigate("/correcoes")}><ScanLine/><b>Corrigir</b><small>Ler folhas</small></button><button onClick={()=>navigate("/relatorios")}><BarChart3/><b>Relatórios</b><small>Ver estatísticas</small></button></div></Card></>}

export default function App(){
 return <Routes><Route path="/login" element={<Login/>}/><Route element={<Layout/>}>
  <Route path="/" element={<Dashboard/>}/><Route path="/questoes" element={<Questions/>}/><Route path="/avaliacoes" element={<Assessments/>}/><Route path="/avaliacoes/nova" element={<NewAssessment/>}/><Route path="/avaliacoes/1" element={<AssessmentDetail/>}/><Route path="/avaliacoes/1/gerar" element={<Generate/>}/><Route path="/turmas" element={<Classes/>}/><Route path="/correcoes" element={<Corrections/>}/><Route path="/correcoes/resultado" element={<CorrectionResult/>}/><Route path="/relatorios" element={<Reports/>}/>
 </Route></Routes>
}