import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3.js";
import Message from "../models/message.js";
import Resource from "../models/resource.js";
import Announcement from "../models/announcement.js";
import Group from "../models/group.js";
import { cleanText } from "../config/profanity.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

const isMember = (group, userId) =>
  group.members.some((m) => m.user.toString() === userId);

const isAdminOrCreator = (group, userId) =>
  group.creator.toString() === userId ||
  group.members.some(
    (m) => m.user.toString() === userId && m.role === "admin"
  );

const getFileType = (mimeType) => {
  if (!mimeType) return "other";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("excel") ||
    mimeType.includes("powerpoint") ||
    mimeType.includes("text") ||
    mimeType.includes("sheet") ||
    mimeType.includes("presentation")
  ) return "document";
  return "other";
};

// ── Messages ──────────────────────────────────────────────────────────────────

export const getMessages = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });
    if (!isMember(group, req.user.id))
      return res.status(403).json({ success: false, message: "Members only" });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const total = await Message.countDocuments({
      group: req.params.id,
      deleted: false,
    });

    const messages = await Message.find({
      group: req.params.id,
      deleted: false,
    })
      .populate("sender", "name email")
      .populate({
        path: "replyTo",
        select: "content sender file deleted",
        populate: { path: "sender", select: "name" },
      })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        hasMore: skip + messages.length < total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

// UPDATED: Now returns UNREAD message count
export const getMessageCount = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });
    if (!isMember(group, req.user.id))
      return res.status(403).json({ success: false, message: "Members only" });

    // Count unread messages (messages not read by the current user)
    const unreadCount = await Message.countDocuments({
      group: req.params.id,
      deleted: false,
      readBy: { $ne: req.user.id } // User hasn't read this message
    });

    res.status(200).json({ success: true, count: unreadCount });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get message count",
      error: error.message,
    });
  }
};

// NEW: Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });
    if (!isMember(group, req.user.id))
      return res.status(403).json({ success: false, message: "Members only" });

    // Mark all unread messages as read for this user
    const result = await Message.updateMany(
      {
        group: req.params.id,
        deleted: false,
        readBy: { $ne: req.user.id }
      },
      {
        $addToSet: { readBy: req.user.id }
      }
    );

    res.status(200).json({ 
      success: true, 
      message: "Messages marked as read",
      markedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
      error: error.message,
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { content, replyTo } = req.body;
    const file = req.file;

    if (!content?.trim() && !file)
      return res.status(400).json({
        success: false,
        message: "Message must have text or a file",
      });

    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });
    if (!isMember(group, req.user.id))
      return res.status(403).json({ success: false, message: "Members only" });

    // Validate replyTo
    if (replyTo) {
      const parent = await Message.findById(replyTo);
      if (!parent || parent.group.toString() !== req.params.id) {
        return res.status(400).json({
          success: false,
          message: "Invalid reply target",
        });
      }
    }

    // Clean text content
    const cleanedContent = content?.trim() ? cleanText(content.trim()) : "";

    // Build file object if file uploaded
    let fileData = null;
    if (file) {
      fileData = {
        url: file.location,
        key: file.key,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        fileType: getFileType(file.mimetype),
      };
    }

    const message = await Message.create({
      group: req.params.id,
      sender: req.user.id,
      content: cleanedContent,
      file: fileData,
      replyTo: replyTo || null,
      messageType: file ? "file" : "text",
      readBy: [req.user.id] // Sender has read their own message
    });

    // If file uploaded, also save to resources automatically
    if (file && fileData) {
      await Resource.create({
        group: req.params.id,
        uploadedBy: req.user.id,
        title: file.originalname,
        description: `Shared in chat`,
        type: fileData.fileType === "image" ? "link" : "link",
        url: file.location,
        fileKey: file.key,
        mimeType: file.mimetype,
        fileType: fileData.fileType,
        size: file.size,
        sourceMessage: message._id,
      });
    }

    const populated = await Message.findById(message._id)
      .populate("sender", "name email")
      .populate({
        path: "replyTo",
        select: "content sender file deleted",
        populate: { path: "sender", select: "name" },
      });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message)
      return res.status(404).json({ success: false, message: "Message not found" });

    const group = await Group.findById(req.params.id);
    const canDelete =
      message.sender.toString() === req.user.id ||
      isAdminOrCreator(group, req.user.id);

    if (!canDelete)
      return res.status(403).json({ success: false, message: "Not authorized" });

    // Delete file from S3 if exists
    if (message.file?.key) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: message.file.key,
          })
        );
      } catch (s3Err) {
        console.error("S3 delete error:", s3Err.message);
      }
    }

    // Soft delete
    message.deleted = true;
    await message.save();

    res.status(200).json({ success: true, message: "Message deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: error.message,
    });
  }
};

// ── Resources ─────────────────────────────────────────────────────────────────

export const getResources = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });
    if (!isMember(group, req.user.id))
      return res.status(403).json({ success: false, message: "Members only" });

    const resources = await Resource.find({ group: req.params.id })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch resources",
      error: error.message,
    });
  }
};

export const addResource = async (req, res) => {
  try {
    const { title, description, type, url, content } = req.body;
    if (!title?.trim())
      return res.status(400).json({ success: false, message: "Title is required" });

    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });
    if (!isMember(group, req.user.id))
      return res.status(403).json({ success: false, message: "Members only" });

    const resource = await Resource.create({
      group: req.params.id,
      uploadedBy: req.user.id,
      title: title.trim(),
      description,
      type: type || "link",
      url,
      content,
    });

    const populated = await resource.populate("uploadedBy", "name email");
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add resource",
      error: error.message,
    });
  }
};

export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource)
      return res.status(404).json({ success: false, message: "Resource not found" });

    const group = await Group.findById(req.params.id);
    const canDelete =
      resource.uploadedBy.toString() === req.user.id ||
      isAdminOrCreator(group, req.user.id);

    if (!canDelete)
      return res.status(403).json({ success: false, message: "Not authorized" });

    // Delete from S3 if has key
    if (resource.fileKey) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: resource.fileKey,
          })
        );
      } catch (s3Err) {
        console.error("S3 delete error:", s3Err.message);
      }
    }

    await resource.deleteOne();
    res.status(200).json({ success: true, message: "Resource deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete resource",
      error: error.message,
    });
  }
};

// ── Announcements ─────────────────────────────────────────────────────────────

export const getAnnouncements = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });

    const announcements = await Announcement.find({ group: req.params.id })
      .populate("author", "name email")
      .sort({ pinned: -1, createdAt: -1 });

    const unreadCount = announcements.filter(
      (a) => !a.readBy.includes(req.user.id)
    ).length;

    res.status(200).json({ success: true, data: announcements, unreadCount });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
      error: error.message,
    });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, pinned } = req.body;
    if (!title?.trim() || !content?.trim())
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });

    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });
    if (!isAdminOrCreator(group, req.user.id))
      return res.status(403).json({
        success: false,
        message: "Only admins can post announcements",
      });

    const announcement = await Announcement.create({
      group: req.params.id,
      author: req.user.id,
      title: cleanText(title.trim()),
      content: cleanText(content.trim()),
      pinned: pinned || false,
      readBy: [req.user.id],
    });

    const populated = await announcement.populate("author", "name email");
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create announcement",
      error: error.message,
    });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.announcementId);
    if (!announcement)
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });

    const group = await Group.findById(req.params.id);
    if (!isAdminOrCreator(group, req.user.id))
      return res.status(403).json({
        success: false,
        message: "Only admins can delete announcements",
      });

    await announcement.deleteOne();
    res.status(200).json({ success: true, message: "Announcement deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete announcement",
      error: error.message,
    });
  }
};

export const markAnnouncementsRead = async (req, res) => {
  try {
    await Announcement.updateMany(
      { group: req.params.id, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } }
    );
    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark as read",
      error: error.message,
    });
  }
};