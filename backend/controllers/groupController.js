import Group from "../models/group.js";

export const createGroup = async (req, res) => {
  try {
    const { name, course, topic, description, category, isPublic, maxMembers } = req.body;
    const userId = req.user.id;

    const group = new Group({
      name,
      course,
      topic,
      description,
      category: category || "General Discussion",
      creator: userId,
      creatorRole: "admin",
      isPublic: isPublic !== undefined ? isPublic : true,
      maxMembers: maxMembers || 50,
      // ✅ Removed inviteCode here — pre-save hook handles it
      members: [{ 
        user: userId, 
        role: "admin",
        joinedAt: new Date() 
      }],
    });

    await group.save();

    res.status(201).json({
      success: true,
      message: "Study group created successfully",
      data: group,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create study group",
      error: error.message,
    });
  }
};
// Get all public groups
export const getPublicGroups = async (req, res) => {
  try {
    const groups = await Group.find({ isPublic: true, status: "active" })
      .populate("creator", "name email")
      .populate("members.user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch groups",
      error: error.message,
    });
  }
};

// Get group by ID
export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("creator", "name email")
      .populate("members.user", "name email");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch group",
      error: error.message,
    });
  }
};

// Get current user's groups
export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const groups = await Group.find({
      $or: [
        { creator: userId },
        { "members.user": userId }
      ],
      status: "active"
    })
      .populate("creator", "name email")
      .populate("members.user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch your groups",
      error: error.message,
    });
  }
};

// Update group
export const updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if user is creator or admin
    const userMember = group.members.find(
      (member) => member.user.toString() === req.user.id
    );
    
    if (group.creator.toString() !== req.user.id && userMember?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only group creator or admin can update this group",
      });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Group updated successfully",
      data: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update group",
      error: error.message,
    });
  }
};

// Delete group (soft delete - archive instead of actually deleting)
export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if user is creator
    if (group.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the group creator can delete this group",
      });
    }

    // Soft delete - mark as archived
    group.status = "archived";
    await group.save();

    res.status(200).json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete group",
      error: error.message,
    });
  }
};

// Join group by invite code
export const joinGroupByCode = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    const group = await Group.findOne({ inviteCode, status: "active" });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Invalid invite code or group not found",
      });
    }

    // Check if group is full
    if (group.isFull()) {
      return res.status(400).json({
        success: false,
        message: `Group is full (max ${group.maxMembers} members)`,
      });
    }

    // Check if user already in group
    const existingMember = group.members.find(
      (member) => member.user.toString() === userId
    );
    
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this group",
      });
    }

    // Add user to members
    group.members.push({ user: userId, role: "member" });
    await group.save();

    res.status(200).json({
      success: true,
      message: "Successfully joined the group",
      data: group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to join group",
      error: error.message,
    });
  }
};

// Leave group
export const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const userId = req.user.id;
    
    // Check if user is the creator
    if (group.creator.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Group creator cannot leave the group. Transfer ownership or delete the group instead.",
      });
    }

    // Remove user from members
    group.members = group.members.filter(
      (member) => member.user.toString() !== userId
    );
    
    await group.save();

    res.status(200).json({
      success: true,
      message: "Successfully left the group",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to leave group",
      error: error.message,
    });
  }
};

// Get group members
export const getGroupMembers = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("members.user", "name email");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    res.status(200).json({
      success: true,
      data: group.members,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch members",
      error: error.message,
    });
  }
};