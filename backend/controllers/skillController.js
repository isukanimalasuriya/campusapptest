import mongoose from "mongoose";
import Skill from "../models/Skill.js";
import SkillRequest from "../models/SkillRequest.js";
import LearningRequest from "../models/LearningRequest.js";
import SkillExchangeNotification from "../models/SkillExchangeNotification.js";
import { User } from "../models/user.js";
import { io } from "../index.js";
import {
  LIMITS,
  clamp,
  escapeRegex,
  sanitizeOfferBody,
  sanitizeLearningRequestBody,
} from "../utils/skillValidation.js";

async function getAuthProfile(req) {
  const u = await User.findById(req.user.id).select("name");
  if (!u) return null;
  return { id: req.user.id, name: u.name };
}

async function pushSkillNotification(userId, type, title, body, meta = {}) {
  if (!userId) return;
  try {
    await SkillExchangeNotification.create({
      userId,
      type,
      title,
      body: clamp(body, LIMITS.notificationBody),
      meta,
    });
  } catch (e) {
    console.error("pushSkillNotification:", e.message);
  }
}

function paginateQuery(req, defaultLimit = 40) {
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || String(defaultLimit)), 10) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// ── Notifications ─────────────────────────────

export const getSkillNotifications = async (req, res) => {
  try {
    const list = await SkillExchangeNotification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const unread = await SkillExchangeNotification.countDocuments({ userId: req.user.id, read: false });
    res.json({ data: list, unread });
  } catch (e) {
    res.status(500).json({ message: "Error loading notifications", error: e.message });
  }
};

export const markSkillNotificationRead = async (req, res) => {
  try {
    const { notifId } = req.params;
    const n = await SkillExchangeNotification.findOneAndUpdate(
      { _id: notifId, userId: req.user.id },
      { read: true },
      { new: true },
    );
    if (!n) return res.status(404).json({ message: "Notification not found" });
    res.json(n);
  } catch (e) {
    res.status(500).json({ message: "Error updating notification", error: e.message });
  }
};

export const markAllSkillNotificationsRead = async (req, res) => {
  try {
    await SkillExchangeNotification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Error updating notifications", error: e.message });
  }
};

// ── Skill posts ─────────────────────────────

export const offerSkill = async (req, res) => {
  try {
    const authUser = await getAuthProfile(req);
    if (!authUser) return res.status(401).json({ message: "User not found" });

    const raw = sanitizeOfferBody(req.body);
    if (!raw.skillName || !raw.subject || !raw.moduleCode || !raw.availability) {
      return res.status(400).json({ message: "skillName, subject, moduleCode, and availability are required" });
    }
    if (!["Beginner", "Intermediate", "Advanced"].includes(raw.skillLevel)) {
      return res.status(400).json({ message: "Invalid skillLevel" });
    }
    if (!["Online", "Offline"].includes(raw.mode)) {
      return res.status(400).json({ message: "Invalid mode" });
    }

    let meetingLink = "";
    if (raw.mode === "Online" && raw.isPublic) {
      const roomIdentifier = `SmartCampus-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      meetingLink = `https://meet.jit.si/${roomIdentifier}`;
    }

    const newSkill = new Skill({
      ...raw,
      meetingLink,
      providerName: authUser.name,
      userId: authUser.id,
    });
    await newSkill.save();
    res.status(201).json(newSkill);
  } catch (error) {
    console.error("Error in offerSkill:", error);
    res.status(500).json({ message: "Error offering skill", error: error.message });
  }
};

export const getSkills = async (req, res) => {
  try {
    const { page, limit, skip } = paginateQuery(req, 50);
    const q = clamp(req.query.q || "", LIMITS.searchQuery);
    const moduleCode = clamp(req.query.moduleCode || "", LIMITS.moduleCode);
    const filter = {};
    if (q) {
      const safe = escapeRegex(q);
      filter.$or = [
        { skillName: new RegExp(safe, "i") },
        { subject: new RegExp(safe, "i") },
        { moduleCode: new RegExp(safe, "i") },
      ];
    }
    if (moduleCode) filter.moduleCode = moduleCode;

    const [skills, total] = await Promise.all([
      Skill.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Skill.countDocuments(filter),
    ]);
    res.json({
      data: skills,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching skills", error: error.message });
  }
};

// ── Skill requests ────────────────────────────

export const requestHelp = async (req, res) => {
  try {
    const authUser = await getAuthProfile(req);
    if (!authUser) return res.status(401).json({ message: "User not found" });

    const { skillId, preferredTime } = req.body;
    const problemDescription = clamp(req.body.problemDescription, LIMITS.problemDescription);
    if (!skillId || !problemDescription) {
      return res.status(400).json({ message: "skillId and problemDescription are required" });
    }

    const newRequest = new SkillRequest({
      skillId,
      problemDescription,
      preferredTime: preferredTime || undefined,
      requesterName: authUser.name,
      requesterId: authUser.id,
    });
    await newRequest.save();
    const populatedRequest = await SkillRequest.findById(newRequest._id).populate("skillId");
    const matchingPeer = await Skill.findById(skillId);
    res.status(201).json({
      request: populatedRequest,
      matchingPeers: [matchingPeer],
      meetingLink: matchingPeer?.meetingLink,
    });
  } catch (error) {
    res.status(500).json({ message: "Error requesting help", error: error.message });
  }
};

export const getRequests = async (req, res) => {
  try {
    const { page, limit, skip } = paginateQuery(req, 40);
    const [requests, total] = await Promise.all([
      SkillRequest.find().populate("skillId").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SkillRequest.countDocuments(),
    ]);
    res.json({
      data: requests,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching requests", error: error.message });
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["Pending", "Scheduled", "Completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const reqDoc = await SkillRequest.findById(id).populate("skillId");
    if (!reqDoc) return res.status(404).json({ message: "Request not found" });

    const uid = String(req.user.id);
    const isRequester = String(reqDoc.requesterId || "") === uid;
    const skillOwner = reqDoc.skillId && String(reqDoc.skillId.userId || "") === uid;

    if (status === "Scheduled") {
      if (!skillOwner) return res.status(403).json({ message: "Only the host can accept this request" });
      if (reqDoc.status !== "Pending") return res.status(400).json({ message: "Invalid state transition" });
    } else if (status === "Completed") {
      if (!isRequester && !skillOwner) return res.status(403).json({ message: "Not allowed" });
      if (reqDoc.status !== "Scheduled") return res.status(400).json({ message: "Session must be scheduled first" });
    }

    reqDoc.status = status;
    await reqDoc.save();
    const updated = await SkillRequest.findById(id).populate("skillId");
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating status", error: error.message });
  }
};

export const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const rating = Number(req.body.rating);
    const feedback = clamp(req.body.feedback, LIMITS.feedback);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "rating must be 1–5" });
    }

    const reqDoc = await SkillRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ message: "Request not found" });
    if (String(reqDoc.requesterId || "") !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the requester can submit feedback" });
    }

    reqDoc.rating = rating;
    reqDoc.feedback = feedback;
    reqDoc.status = "Completed";
    await reqDoc.save();
    res.status(200).json(reqDoc);
  } catch (error) {
    res.status(500).json({ message: "Error submitting feedback", error: error.message });
  }
};

// ── Learning requests ────────────────────────

export const postLearningRequest = async (req, res) => {
  try {
    const authUser = await getAuthProfile(req);
    if (!authUser) return res.status(401).json({ message: "User not found" });

    const raw = sanitizeLearningRequestBody(req.body);
    if (!raw.subject || !raw.moduleCode || !raw.titleWhatIWantToLearn || !raw.preferredTime) {
      return res.status(400).json({ message: "subject, moduleCode, title, and preferredTime are required" });
    }
    if (!["Beginner", "Intermediate", "Advanced"].includes(raw.skillLevel || "Beginner")) {
      return res.status(400).json({ message: "Invalid skillLevel" });
    }
    if (!["Online", "Offline"].includes(raw.mode)) {
      return res.status(400).json({ message: "Invalid mode" });
    }

    const lr = new LearningRequest({
      ...raw,
      skillLevel: raw.skillLevel || "Beginner",
      requesterName: authUser.name,
      requesterId: authUser.id,
    });
    await lr.save();
    res.status(201).json(lr);
  } catch (error) {
    console.error("Error in postLearningRequest:", error);
    res.status(500).json({ message: "Error posting learning request", error: error.message });
  }
};

export const getLearningRequests = async (req, res) => {
  try {
    const { page, limit, skip } = paginateQuery(req, 40);
    const filter = { status: "Open" };
    const [requests, total] = await Promise.all([
      LearningRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      LearningRequest.countDocuments(filter),
    ]);
    res.json({
      data: requests,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching learning requests", error: error.message });
  }
};

export const getMyLearningRequests = async (req, res) => {
  try {
    const requests = await LearningRequest.find({ requesterId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching your learning requests", error: error.message });
  }
};

export const cancelLearningRequest = async (req, res) => {
  try {
    const lr = await LearningRequest.findById(req.params.id);
    if (!lr) return res.status(404).json({ message: "Learning request not found" });
    if (String(lr.requesterId || "") !== String(req.user.id)) {
      return res.status(403).json({ message: "Not your request" });
    }
    if (lr.status !== "Open") {
      return res.status(400).json({ message: "Only open requests can be cancelled" });
    }
    lr.status = "Closed";
    await lr.save();
    res.json(lr);
  } catch (e) {
    res.status(500).json({ message: "Error cancelling request", error: e.message });
  }
};

export const volunteerToHelp = async (req, res) => {
  try {
    const authUser = await getAuthProfile(req);
    if (!authUser) return res.status(401).json({ message: "User not found" });

    const { id } = req.params;
    const message = clamp(req.body.message, LIMITS.volunteerMessage);
    if (!message) return res.status(400).json({ message: "message is required" });

    const lr = await LearningRequest.findById(id);
    if (!lr) return res.status(404).json({ message: "Learning request not found" });
    if (lr.status !== "Open") return res.status(400).json({ message: "This request is no longer open" });

    if (lr.requesterId && String(lr.requesterId) === String(authUser.id)) {
      return res.status(400).json({ message: "You cannot volunteer on your own request" });
    }

    const alreadyVolunteered = lr.volunteers.some(
      (v) => String(v.userId || "") === String(authUser.id) || v.userName === authUser.name,
    );
    if (alreadyVolunteered) return res.status(400).json({ message: "Already volunteered" });

    lr.volunteers.push({ userId: authUser.id, userName: authUser.name, message });
    await lr.save();

    if (lr.requesterId) {
      const title = "New volunteer";
      const body = `${authUser.name} offered to help with "${lr.titleWhatIWantToLearn}"`;
      await pushSkillNotification(lr.requesterId, "new_volunteer", title, body, {
        learningRequestId: lr._id,
      });
      io.to(`user:${String(lr.requesterId)}`).emit("new_volunteer", {
        learningRequestId: lr._id,
        volunteerName: authUser.name,
        subject: lr.subject,
        titleWhatIWantToLearn: lr.titleWhatIWantToLearn,
      });
    }

    res.status(200).json(lr);
  } catch (error) {
    console.error("Error in volunteerToHelp:", error);
    res.status(500).json({ message: "Error volunteering", error: error.message });
  }
};

export const acceptVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    const { volunteerId, volunteerName } = req.body;

    const lr = await LearningRequest.findById(id);
    if (!lr) return res.status(404).json({ message: "Learning request not found" });
    if (!lr.requesterId || String(lr.requesterId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the person who posted this request can accept a volunteer" });
    }
    if (lr.status !== "Open") {
      return res.status(400).json({ message: "This request is already matched or closed" });
    }

    const volunteerOk = lr.volunteers.some(
      (v) =>
        (volunteerId && String(v.userId || "") === String(volunteerId)) ||
        (volunteerName && v.userName === volunteerName),
    );
    if (!volunteerOk) {
      return res.status(400).json({ message: "That volunteer is not on this request" });
    }

    let meetingLink = "";
    if (lr.mode === "Online") {
      const roomIdentifier = `SmartCampus-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      meetingLink = `https://meet.jit.si/${roomIdentifier}`;
    }

    const newSkill = new Skill({
      skillName: lr.titleWhatIWantToLearn,
      subject: lr.subject,
      moduleCode: lr.moduleCode,
      description: lr.description,
      skillLevel: lr.skillLevel || "Beginner",
      mode: lr.mode,
      isPublic: true,
      meetingLink,
      availability: lr.preferredTime,
      providerName: volunteerName,
      userId: volunteerId,
      joinRequests: [
        {
          userId: lr.requesterId,
          userName: lr.requesterName,
          status: "Approved",
        },
      ],
    });
    await newSkill.save();

    const updateResult = await LearningRequest.updateOne(
      { _id: id, status: "Open" },
      {
        $set: {
          acceptedVolunteer: { userId: volunteerId, userName: volunteerName },
          resultingSkillId: newSkill._id,
          status: "Matched",
        },
      },
    );

    if (updateResult.modifiedCount === 0) {
      await Skill.findByIdAndDelete(newSkill._id);
      return res.status(409).json({ message: "This request was already matched" });
    }

    const lrUpdated = await LearningRequest.findById(id);
    const payload = {
      learningRequestId: lr._id,
      resultingSkillId: newSkill._id,
      skillName: newSkill.skillName,
      meetingLink,
      mode: lr.mode,
    };

    if (volunteerId) {
      await pushSkillNotification(volunteerId, "volunteer_accepted", "Your offer was accepted", `Session created: ${newSkill.skillName}`, {
        learningRequestId: lr._id,
        skillId: newSkill._id,
      });
      io.to(`user:${String(volunteerId)}`).emit("volunteer_accepted", payload);
    }
    await pushSkillNotification(req.user.id, "learning_matched", "You matched with a volunteer", newSkill.skillName, {
      learningRequestId: lr._id,
      skillId: newSkill._id,
    });
    io.to(`user:${String(req.user.id)}`).emit("learning_request_matched", payload);

    res.status(200).json({ learningRequest: lrUpdated, skill: newSkill });
  } catch (error) {
    console.error("Error in acceptVolunteer:", error);
    res.status(500).json({ message: "Error accepting volunteer", error: error.message });
  }
};

// ── Join requests ────────────────────────────

export const requestToJoin = async (req, res) => {
  try {
    const authUser = await getAuthProfile(req);
    if (!authUser) return res.status(401).json({ message: "User not found" });

    const { skillId } = req.params;
    const skill = await Skill.findById(skillId);
    if (!skill) return res.status(404).json({ message: "Skill post not found" });
    if (!skill.isPublic) return res.status(400).json({ message: "This session is not public" });

    const alreadyRequested = skill.joinRequests.some(
      (j) => String(j.userId || "") === String(authUser.id) || j.userName === authUser.name,
    );
    if (alreadyRequested) return res.status(400).json({ message: "Already requested to join" });

    skill.joinRequests.push({ userId: authUser.id, userName: authUser.name, status: "Pending" });
    await skill.save();

    if (skill.userId) {
      await pushSkillNotification(skill.userId, "new_join_request", "New join request", `${authUser.name} wants to join "${skill.skillName}"`, {
        skillId: skill._id,
      });
      io.to(`user:${String(skill.userId)}`).emit("new_join_request", {
        skillId: skill._id,
        skillName: skill.skillName,
        requesterName: authUser.name,
      });
    }

    res.status(200).json(skill);
  } catch (error) {
    console.error("Error in requestToJoin:", error);
    res.status(500).json({ message: "Error requesting to join", error: error.message });
  }
};

export const getJoinRequests = async (req, res) => {
  try {
    const { skillId } = req.params;
    const skill = await Skill.findById(skillId);
    if (!skill) return res.status(404).json({ message: "Skill post not found" });
    if (String(skill.userId || "") !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the host can view join requests" });
    }
    res.status(200).json(skill.joinRequests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching join requests", error: error.message });
  }
};

export const cancelPendingJoinRequest = async (req, res) => {
  try {
    const { skillId, joinId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(joinId)) {
      return res.status(400).json({ message: "Invalid join id" });
    }
    const jid = new mongoose.Types.ObjectId(joinId);
    const result = await Skill.findOneAndUpdate(
      {
        _id: skillId,
        joinRequests: {
          $elemMatch: {
            _id: jid,
            userId: req.user.id,
            status: "Pending",
          },
        },
      },
      { $pull: { joinRequests: { _id: jid } } },
      { new: true },
    );
    if (!result) {
      return res.status(404).json({ message: "Pending join request not found or not yours" });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in cancelPendingJoinRequest:", error);
    res.status(500).json({ message: "Error cancelling join request", error: error.message });
  }
};

export const handleJoinRequest = async (req, res) => {
  try {
    const { skillId, joinId } = req.params;
    const { status } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "status must be Approved or Rejected" });
    }

    const skill = await Skill.findById(skillId);
    if (!skill) return res.status(404).json({ message: "Skill post not found" });
    if (String(skill.userId || "") !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the host can update join requests" });
    }

    const joinReq = skill.joinRequests.id(joinId);
    if (!joinReq) return res.status(404).json({ message: "Join request not found" });

    joinReq.status = status;
    await skill.save();

    if (joinReq.userId) {
      const room = `user:${String(joinReq.userId)}`;
      if (status === "Approved") {
        await pushSkillNotification(joinReq.userId, "join_approved", "Join request approved", `You can attend: ${skill.skillName}`, {
          skillId: skill._id,
        });
        io.to(room).emit("join_request_approved", {
          skillId: skill._id,
          joinId,
          skillName: skill.skillName,
          meetingLink: skill.meetingLink || null,
          mode: skill.mode,
        });
      } else {
        await pushSkillNotification(joinReq.userId, "join_rejected", "Join request declined", skill.skillName, {
          skillId: skill._id,
        });
        io.to(room).emit("join_request_rejected", {
          skillId: skill._id,
          joinId,
          skillName: skill.skillName,
        });
      }
    }

    res.status(200).json(skill);
  } catch (error) {
    console.error("Error in handleJoinRequest:", error);
    res.status(500).json({ message: "Error handling join request", error: error.message });
  }
};
