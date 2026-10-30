import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { dashboard, reports } from "../controllers/reports/reports.controller";

const reportsRoutes = Router();
reportsRoutes.use(requireAuth);
reportsRoutes.get("/dashboard", dashboard);
reportsRoutes.get("/relatorios", reports);
export { reportsRoutes };
