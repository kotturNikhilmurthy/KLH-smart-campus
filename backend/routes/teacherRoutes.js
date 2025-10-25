import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
  getTeacherDashboardSummary,
  respondToFeedback,
  uploadResource,
  updateResource,
  deleteResource,
} from "../controllers/teacherController.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.use(authenticate, requireRole("teacher"));

router.get("/dashboard", asyncHandler(getTeacherDashboardSummary));

router.post("/feedback/:feedbackId/respond", asyncHandler(respondToFeedback));

router.post("/resources", asyncHandler(uploadResource));
router.patch("/resources/:resourceId", asyncHandler(updateResource));
router.delete("/resources/:resourceId", asyncHandler(deleteResource));

export default router;
