import {
  BarChart3,
  ClipboardList,
  FileQuestion,
  LayoutDashboard,
  ScanLine,
  Users,
} from "lucide-react";

export const navigationItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/questoes", label: "Questões", icon: FileQuestion },
  { to: "/avaliacoes", label: "Avaliações", icon: ClipboardList },
  { to: "/turmas", label: "Turmas", icon: Users },
  { to: "/correcoes", label: "Correções", icon: ScanLine },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
];
