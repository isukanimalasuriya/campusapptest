import { Router } from "express";
import { auth } from "../middleware/authMiddleware.js";
import { skillReadLimiter, skillWriteLimiter } from "../middleware/skillRateLimit.js";
import * as skillController from "../controllers/skillController.js";

const router = Router();

// Notifications (before /:skillId)
router.get("/notifications", auth, skillReadLimiter, skillController.getSkillNotifications);
router.patch("/notifications/read-all", auth, skillWriteLimiter, skillController.markAllSkillNotificationsRead);
router.patch("/notifications/:notifId/read", auth, skillWriteLimiter, skillController.markSkillNotificationRead);

// Skill posts
router.post("/offer", auth, skillWriteLimiter, skillController.offerSkill);
router.get("/", auth, skillReadLimiter, skillController.getSkills);

// Skill requests
router.post("/request", auth, skillWriteLimiter, skillController.requestHelp);
router.get("/requests", auth, skillReadLimiter, skillController.getRequests);
router.patch("/request/:id/status", auth, skillWriteLimiter, skillController.updateRequestStatus);
router.patch("/request/:id/feedback", auth, skillWriteLimiter, skillController.submitFeedback);

// Learning requests
router.post("/learning-request", auth, skillWriteLimiter, skillController.postLearningRequest);
router.get("/learning-requests", auth, skillReadLimiter, skillController.getLearningRequests);
router.get("/my-learning-requests", auth, skillReadLimiter, skillController.getMyLearningRequests);
router.patch("/learning-request/:id/cancel", auth, skillWriteLimiter, skillController.cancelLearningRequest);
router.post("/learning-request/:id/volunteer", auth, skillWriteLimiter, skillController.volunteerToHelp);
router.patch("/learning-request/:id/accept-volunteer", auth, skillWriteLimiter, skillController.acceptVolunteer);

// Join requests (specific paths before generic :joinId)
router.patch("/:skillId/join-request/:joinId/cancel", auth, skillWriteLimiter, skillController.cancelPendingJoinRequest);
router.post("/:skillId/join-request", auth, skillWriteLimiter, skillController.requestToJoin);
router.get("/:skillId/join-requests", auth, skillReadLimiter, skillController.getJoinRequests);
router.patch("/:skillId/join-request/:joinId", auth, skillWriteLimiter, skillController.handleJoinRequest);

export default router;
