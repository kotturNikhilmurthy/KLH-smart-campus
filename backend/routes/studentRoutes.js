import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
  getStudentDashboardSummary,
  getClubs,
  joinClub,
  leaveClub,
} from "../controllers/studentController.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.use(authenticate, requireRole("student"));

router.get("/dashboard", asyncHandler(getStudentDashboardSummary));
router.get("/clubs", asyncHandler(getClubs));
router.post("/clubs/:clubId/join", asyncHandler(joinClub));
router.post("/clubs/:clubId/leave", asyncHandler(leaveClub));

export default router;
