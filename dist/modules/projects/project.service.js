"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMemberToProjectInternal = exports.getInternalProjectById = exports.getInternalProjects = exports.createInternalProject = exports.getProjectInvitations = exports.unassignProjectMember = exports.assignProjectMember = exports.updateProjectMemberProfile = exports.getProjectMemberProfile = exports.getProjectMembers = exports.inviteUserToProject = exports.getUserProjects = exports.updateProject = exports.getProjectStats = exports.getProject = exports.createProject = void 0;
const project_model_1 = __importDefault(require("./project.model"));
const project_member_model_1 = __importDefault(require("./project_member.model"));
const project_interfaces_1 = require("./project.interfaces");
const index_1 = require("../users/index");
const index_2 = require("../auth/index");
const organization_member_model_1 = __importDefault(require("../organizations/organization_member.model"));
const organization_interfaces_1 = require("../organizations/organization.interfaces");
const project_invitation_model_1 = __importDefault(require("./project_invitation.model"));
const project_invitation_interfaces_1 = require("./project_invitation.interfaces");
const moment_1 = __importDefault(require("moment"));
const http_status_1 = __importDefault(require("http-status"));
const index_3 = require("../errors/index");
const sessions_1 = require("../sessions");
const activity_logs_1 = require("../activity_logs");
const service_1 = require("../email/service");
const organizations_1 = require("../organizations");
const createProject = async (projectBody, creatorId, organizationId) => {
    // If organizationId is provided, use it. Otherwise fallback (deprecated/legacy behavior if needed, or throw)
    // Given the new requirement, we should rely on organizationId.
    let targetOrgId = organizationId;
    if (!targetOrgId) {
        // Fallback for transition or internal calls if applicable
        const orgMember = await organization_member_model_1.default.findOne({ userId: creatorId });
        if (!orgMember) {
            throw new index_3.ApiError(http_status_1.default.BAD_REQUEST, 'User does not belong to an organization');
        }
        targetOrgId = orgMember.organizationId;
    }
    else {
        // Verify user is member of this org? (Already checked by validateOrganizationAccess middleware usually)
        const orgMember = await organization_member_model_1.default.findOne({ userId: creatorId, organizationId: targetOrgId });
        if (!orgMember) {
            throw new index_3.ApiError(http_status_1.default.FORBIDDEN, 'User does not belong to this organization');
        }
    }
    const project = await project_model_1.default.create(Object.assign(Object.assign({}, projectBody), { organizationId: targetOrgId }));
    await project_member_model_1.default.create({
        projectId: project.id,
        userId: creatorId,
        role: project_interfaces_1.ProjectMemberRole.OWNER,
        status: project_interfaces_1.ProjectMemberStatus.ACTIVE
    });
    // Log Activity
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.PROJECT,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.PROJECT_CREATED,
        description: `Project "${project.name}" was created`,
        organizationId: project.organizationId,
        projectId: project.id,
        actorId: creatorId,
        targetId: project.id,
        metadata: {
            module: 'projects',
            operation: 'create_project',
            context: { projectName: project.name },
        }
    });
    const projectCount = await project_model_1.default.countDocuments({ organizationId: project.organizationId });
    if (projectCount === 1) {
        await organizations_1.organizationService.updateOnboardingStep(project.organizationId, organization_interfaces_1.OnboardingStep.PROJECT_CREATED);
    }
    return project;
};
exports.createProject = createProject;
const getProject = async (id) => {
    const project = await project_model_1.default.findById(id);
    if (!project) {
        return null;
    }
    const memberStats = await project_member_model_1.default.aggregate([
        {
            $match: {
                projectId: id,
                status: project_interfaces_1.ProjectMemberStatus.ACTIVE
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                managers: {
                    $sum: {
                        $cond: [
                            { $in: ['$role', [project_interfaces_1.ProjectMemberRole.MANAGER]] },
                            1,
                            0
                        ]
                    }
                },
                staff: {
                    $sum: {
                        $cond: [
                            { $eq: ['$role', project_interfaces_1.ProjectMemberRole.MEMBER] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);
    const stats = memberStats[0] || { total: 0, managers: 0, staff: 0 };
    const projectObj = project.toJSON();
    return Object.assign(Object.assign({}, projectObj), { membersCount: stats.total, managersCount: stats.managers, staffCount: stats.staff });
};
exports.getProject = getProject;
const getProjectStats = async (projectId, organizationId) => {
    const project = await project_model_1.default.findById(projectId);
    if (!project) {
        throw new index_3.ApiError(http_status_1.default.NOT_FOUND, 'Project not found');
    }
    if (organizationId && project.organizationId !== organizationId) {
        throw new index_3.ApiError(http_status_1.default.NOT_FOUND, 'Project not found in organization');
    }
    const membersAssigned = await project_member_model_1.default.countDocuments({
        projectId,
        // NOTE: intentionally not filtered by status for now.
        // I am not yet certain whether consumers expect active-only or all member states.
        // status: ProjectMemberStatus.ACTIVE,
    });
    const sessionStats = await sessions_1.Session.aggregate([
        {
            $match: {
                projectId,
                endTime: { $exists: true, $ne: null },
            },
        },
        {
            $lookup: {
                from: 'projectmembers',
                let: { memberProjectId: '$projectId', memberUserId: '$userId' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$projectId', '$$memberProjectId'] },
                                    { $eq: ['$userId', '$$memberUserId'] },
                                ],
                            },
                        },
                    },
                    { $project: { _id: 0, hourlyRate: 1 } },
                ],
                as: 'memberRate',
            },
        },
        {
            $addFields: {
                hourlyRate: { $ifNull: [{ $arrayElemAt: ['$memberRate.hourlyRate', 0] }, 0] },
                durationMs: {
                    $max: [
                        0,
                        {
                            $subtract: [
                                { $subtract: ['$endTime', '$startTime'] },
                                { $ifNull: ['$deductedSeconds', 0] },
                            ],
                        },
                    ],
                },
            },
        },
        {
            $group: {
                _id: null,
                totalHoursWorked: { $sum: { $divide: ['$durationMs', 1000 * 60 * 60] } },
                totalPayment: {
                    $sum: {
                        $multiply: [
                            { $divide: ['$durationMs', 1000 * 60 * 60] },
                            '$hourlyRate',
                        ],
                    },
                },
            },
        },
    ]);
    const totals = sessionStats[0] || { totalHoursWorked: 0, totalPayment: 0 };
    return {
        projectId,
        membersAssigned,
        totalHoursWorked: Number((totals.totalHoursWorked || 0).toFixed(2)),
        totalPayment: Number((totals.totalPayment || 0).toFixed(2)),
    };
};
exports.getProjectStats = getProjectStats;
const updateProject = async (projectId, updateBody, actorId) => {
    const project = await (0, exports.getProject)(projectId);
    if (!project) {
        throw new index_3.ApiError(http_status_1.default.NOT_FOUND, 'Project not found');
    }
    const changedFields = Object.keys(updateBody || {}).filter((key) => updateBody[key] !== undefined);
    const projectDoc = await project_model_1.default.findByIdAndUpdate(projectId, updateBody, { new: true });
    if (projectDoc && changedFields.length > 0) {
        await activity_logs_1.activityLogService.createActivityLog({
            type: activity_logs_1.activityLogInterfaces.ActivityLogType.PROJECT,
            action: activity_logs_1.activityLogInterfaces.ActivityLogAction.PROJECT_UPDATED,
            description: `Project "${projectDoc.name}" was updated`,
            organizationId: projectDoc.organizationId,
            projectId: projectDoc.id,
            actorId,
            targetId: projectDoc.id,
            metadata: {
                module: 'projects',
                operation: 'update_project',
                changedFields,
                update: updateBody,
                context: { projectName: projectDoc.name },
            },
        });
    }
    return projectDoc;
};
exports.updateProject = updateProject;
const getUserProjects = async (userId, organizationId, page, limit, filter = {}, search = '') => {
    // Determine eligible project IDs based on Project Membership
    const memberships = await project_member_model_1.default.find({ userId });
    let projectIds = memberships.map(m => m.projectId);
    // Filter project IDs if they belong to the specified organization
    // OR filter the initial query to Project collection.
    // Better approach: Query Project collection where _id IN projectIds AND organizationId = organizationId.
    // If organizationId is NOT provided (legacy/admin?), maybe return all?
    // User request: "client projects routes need to be roiuted through org/:orgId/projects" -> implies orgId is present.
    const query = Object.assign({ _id: { $in: projectIds } }, filter);
    if (organizationId) {
        query['organizationId'] = organizationId;
    }
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }
    const totalResults = await project_model_1.default.countDocuments(query);
    const totalPages = Math.ceil(totalResults / limit);
    const results = await project_model_1.default.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });
    const projectIdsInPage = results.map((project) => project.id);
    const projectFinancialStats = await sessions_1.Session.aggregate([
        {
            $match: {
                projectId: { $in: projectIdsInPage },
                endTime: { $exists: true, $ne: null }
            }
        },
        {
            $lookup: {
                from: 'projectmembers',
                let: { projectId: '$projectId', userId: '$userId' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$projectId', '$$projectId'] },
                                    { $eq: ['$userId', '$$userId'] }
                                ]
                            }
                        }
                    },
                    { $project: { _id: 0, hourlyRate: 1 } }
                ],
                as: 'memberRate'
            }
        },
        {
            $addFields: {
                hourlyRate: { $ifNull: [{ $arrayElemAt: ['$memberRate.hourlyRate', 0] }, 0] },
                durationMs: {
                    $max: [
                        0,
                        {
                            $subtract: [
                                { $subtract: ['$endTime', '$startTime'] },
                                { $ifNull: ['$deductedSeconds', 0] }
                            ]
                        }
                    ]
                }
            }
        },
        {
            $group: {
                _id: '$projectId',
                totalHours: { $sum: { $divide: ['$durationMs', 1000 * 60 * 60] } },
                totalSpent: {
                    $sum: {
                        $multiply: [
                            { $divide: ['$durationMs', 1000 * 60 * 60] },
                            '$hourlyRate'
                        ]
                    }
                }
            }
        }
    ]);
    const statsByProjectId = projectFinancialStats.reduce((acc, stat) => {
        acc[stat._id] = {
            totalHours: stat.totalHours || 0,
            totalSpent: stat.totalSpent || 0
        };
        return acc;
    }, {});
    const resultsWithMembersCount = await Promise.all(results.map(async (project) => {
        var _a, _b;
        const members = await project_member_model_1.default.find({
            projectId: project.id,
            status: project_interfaces_1.ProjectMemberStatus.ACTIVE
        }).populate({ path: 'user', select: 'name avatar' });
        const projectObj = project.toJSON();
        const membersList = members
            .map((m) => {
            var _a, _b;
            return ({
                name: (_a = m.user) === null || _a === void 0 ? void 0 : _a.name,
                avatar: (_b = m.user) === null || _b === void 0 ? void 0 : _b.avatar
            });
        })
            .filter((m) => m.name);
        return Object.assign(Object.assign({}, projectObj), { membersCount: members.length, members: membersList, totalHours: Number((((_a = statsByProjectId[project.id]) === null || _a === void 0 ? void 0 : _a.totalHours) || 0).toFixed(2)), totalSpent: Number((((_b = statsByProjectId[project.id]) === null || _b === void 0 ? void 0 : _b.totalSpent) || 0).toFixed(2)) });
    }));
    return {
        results: resultsWithMembersCount,
        page,
        limit,
        totalPages,
        totalResults
    };
};
exports.getUserProjects = getUserProjects;
const inviteUserToProject = async (projectId, members, actorId) => {
    const project = await (0, exports.getProject)(projectId);
    if (!project) {
        throw new Error('Project not found');
    }
    const organization = await organizations_1.Organization.findById(project.organizationId);
    if (!organization) {
        throw new Error('Organization not found');
    }
    const creator = await index_1.userService.getUserById(actorId);
    if (!creator) {
        throw new Error('Creator not found');
    }
    const creatorName = creator.name || creator.email;
    const results = [];
    for (let { email, role } of members) {
        try {
            const user = await index_1.userService.getUserByEmail(email);
            if (user) {
                // ... (existing logic for org member check)
                // Check if member of the organization
                let orgMember = await organization_member_model_1.default.findOne({
                    organizationId: project.organizationId,
                    userId: user.id
                });
                if (!orgMember) {
                    // Add to Organization immediately
                    orgMember = await organization_member_model_1.default.create({
                        organizationId: project.organizationId,
                        userId: user.id,
                        role: organization_interfaces_1.OrganizationMemberRole.MEMBER,
                        status: organization_interfaces_1.OrganizationMemberStatus.ACTIVE
                    });
                    // Log Org Member Invited/Added (implicitly by project add)
                    await activity_logs_1.activityLogService.createActivityLog({
                        type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
                        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.ORG_MEMBER_ADDED,
                        description: `User ${user.email} was added to organization via project invitation flow`,
                        organizationId: project.organizationId,
                        actorId,
                        targetId: user.id,
                        metadata: {
                            module: 'projects',
                            operation: 'invite_user_to_project_org_membership_add',
                        },
                    });
                }
                // Check if already project member
                const projMember = await project_member_model_1.default.findOne({
                    projectId: project.id,
                    userId: user.id
                });
                if (projMember) {
                    // Already in project, maybe update status if invited?
                    if (projMember.status === project_interfaces_1.ProjectMemberStatus.INVITED) {
                        Object.assign(projMember, { status: project_interfaces_1.ProjectMemberStatus.ACTIVE, role });
                        await projMember.save();
                        // Log Member Added (Activated)
                        await activity_logs_1.activityLogService.createActivityLog({
                            type: activity_logs_1.activityLogInterfaces.ActivityLogType.PROJECT,
                            action: activity_logs_1.activityLogInterfaces.ActivityLogAction.PROJECT_MEMBER_ADDED,
                            description: `User ${user.name || user.email} joined project "${project.name}" as ${role}`,
                            organizationId: project.organizationId,
                            projectId: project.id,
                            actorId,
                            targetId: user.id,
                            metadata: {
                                module: 'projects',
                                operation: 'invite_user_to_project_activate_member',
                                method: 'activation',
                                role,
                            }
                        });
                        results.push({ email, user, status: 'activated_existing_member' });
                        continue;
                    }
                    // Update role if already active? (Maybe just return already member)
                    results.push({ email, user, status: 'already_member' });
                    continue;
                }
                // Add to Project
                await project_member_model_1.default.create({
                    projectId: project.id,
                    userId: user.id,
                    hourlyRate: 0,
                    role: role || project_interfaces_1.ProjectMemberRole.MEMBER,
                    status: project_interfaces_1.ProjectMemberStatus.ACTIVE
                });
                // Log Member Added
                await activity_logs_1.activityLogService.createActivityLog({
                    type: activity_logs_1.activityLogInterfaces.ActivityLogType.PROJECT,
                    action: activity_logs_1.activityLogInterfaces.ActivityLogAction.PROJECT_MEMBER_ADDED,
                    description: `User ${user.name || user.email} was added to project "${project.name}" as ${role}`,
                    organizationId: project.organizationId,
                    projectId: project.id,
                    actorId,
                    targetId: user.id,
                    metadata: {
                        module: 'projects',
                        operation: 'invite_user_to_project',
                        context: { method: 'direct_add', role },
                    }
                });
                results.push({ email, user, status: 'added' });
            }
            else {
                // User does not exist anywhere
                // Check for existing pending invitation
                let invitation = await project_invitation_model_1.default.findOne({
                    email,
                    projectId,
                    status: project_invitation_interfaces_1.ProjectInvitationStatus.PENDING
                });
                if (invitation) {
                    // Resend invite? Extend expiration?
                    invitation.expiresAt = (0, moment_1.default)().add(7, 'days').toDate();
                    // Update role in invitation
                    if (role) {
                        invitation.role = role;
                    }
                    console.log(invitation.token);
                    await invitation.save();
                    await service_1.emailManagementService.sendProjectInvitationEmail(email, project.name, organization.name, invitation.token, creatorName);
                    results.push({ email, invitation, status: 're-invited' });
                    continue;
                }
                const expiresAt = (0, moment_1.default)().add(7, 'days').toDate();
                const token = index_2.authService.generateToken(email, (0, moment_1.default)(expiresAt), "onboarding", { organizationId: project.organizationId, projectId: project.id });
                invitation = await project_invitation_model_1.default.create({
                    email,
                    projectId: project.id,
                    organizationId: project.organizationId,
                    token,
                    status: project_invitation_interfaces_1.ProjectInvitationStatus.PENDING,
                    role: role || project_interfaces_1.ProjectMemberRole.MEMBER,
                    expiresAt
                });
                await service_1.emailManagementService.sendProjectInvitationEmail(email, project.name, organization.name, token, creatorName);
                results.push({ email, invitation, status: 'invited' });
            }
        }
        catch (error) {
            results.push({ email, status: 'error', message: error.message });
        }
    }
    return results;
};
exports.inviteUserToProject = inviteUserToProject;
const getProjectMembers = async (projectId, filter = {}, options = {}, search = '') => {
    const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
    const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
    const skip = (page - 1) * limit;
    const pipeline = [
        { $match: { projectId } }
    ];
    if (filter.role) {
        pipeline.push({ $match: { role: filter.role } });
    }
    if (filter.status) {
        pipeline.push({ $match: { status: filter.status } });
    }
    // Lookup user details
    pipeline.push({
        $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
        }
    });
    // Note: If userId is ref, mongoose might store it as string, so localField is correct. 
    // Usually 'users' collection _id is what we need.
    pipeline.push({ $unwind: '$user' });
    if (search) {
        pipeline.push({
            $match: {
                $or: [
                    { 'user.name': { $regex: search, $options: 'i' } },
                    { 'user.email': { $regex: search, $options: 'i' } }
                ]
            }
        });
    }
    pipeline.push({
        $lookup: {
            from: 'sessions',
            let: { memberProjectId: '$projectId', memberUserId: '$userId' },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ['$projectId', '$$memberProjectId'] },
                                { $eq: ['$userId', '$$memberUserId'] },
                                { $ne: ['$endTime', null] }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        startTime: 1,
                        endTime: 1,
                        deductedSeconds: 1
                    }
                }
            ],
            as: 'sessions'
        }
    });
    pipeline.push({
        $addFields: {
            hourlyRate: { $ifNull: ['$hourlyRate', 0] },
            totalDurationMs: {
                $sum: {
                    $map: {
                        input: '$sessions',
                        as: 's',
                        in: {
                            $max: [
                                0,
                                {
                                    $subtract: [
                                        { $subtract: ['$$s.endTime', '$$s.startTime'] },
                                        { $ifNull: ['$$s.deductedSeconds', 0] }
                                    ]
                                }
                            ]
                        }
                    }
                }
            }
        }
    });
    pipeline.push({
        $addFields: {
            totalHoursWorked: { $divide: ['$totalDurationMs', 1000 * 60 * 60] },
            amountEarned: {
                $multiply: [
                    { $divide: ['$totalDurationMs', 1000 * 60 * 60] },
                    '$hourlyRate'
                ]
            }
        }
    });
    pipeline.push({
        $project: {
            id: '$_id',
            _id: 0,
            projectId: 1,
            userId: 1,
            name: '$user.name',
            role: 1,
            jobTitle: '$role',
            status: 1,
            hourlyRate: 1,
            weeklyLimitHours: 1,
            dailyLimitHours: 1,
            requiredBreaks: 1,
            expectedWeeklyHours: 1,
            expectedWorkDays: 1,
            notes: 1,
            totalHoursWorked: { $round: ['$totalHoursWorked', 2] },
            amountEarned: { $round: ['$amountEarned', 2] },
            createdAt: 1,
            user: {
                id: '$user._id',
                name: '$user.name',
                email: '$user.email',
                avatar: '$user.avatar'
            }
        }
    });
    const dataPipeline = [
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
    ];
    const results = await project_member_model_1.default.aggregate([
        ...pipeline,
        {
            $facet: {
                metadata: [{ $count: 'total' }],
                data: dataPipeline
            }
        }
    ]);
    const metadata = results[0].metadata[0] || { total: 0 };
    const data = results[0].data;
    return {
        results: data,
        page,
        limit,
        totalPages: Math.ceil(metadata.total / limit),
        totalResults: metadata.total
    };
};
exports.getProjectMembers = getProjectMembers;
const getProjectMemberProfile = async (projectId, userId, organizationId, startDate, endDate) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const project = await project_model_1.default.findById(projectId);
    if (!project) {
        throw new index_3.ApiError(http_status_1.default.NOT_FOUND, 'Project not found');
    }
    if (project.organizationId !== organizationId) {
        throw new index_3.ApiError(http_status_1.default.NOT_FOUND, 'Project not found in organization');
    }
    const member = await project_member_model_1.default.findOne({ projectId, userId }).populate({
        path: 'user',
        select: 'name email avatar',
    });
    if (!member) {
        throw new index_3.ApiError(http_status_1.default.NOT_FOUND, 'Project member not found');
    }
    const orgMember = await organization_member_model_1.default.findOne({ organizationId: project.organizationId, userId });
    const resolvedStartDate = startDate || (0, moment_1.default)().startOf('week').toISOString();
    const resolvedEndDate = endDate || (0, moment_1.default)().endOf('week').toISOString();
    const aggregatedSessions = await sessions_1.sessionService.getAggregatedSessions(userId, projectId, resolvedStartDate, resolvedEndDate);
    const now = (0, moment_1.default)();
    const startOfWeek = now.clone().startOf('week').valueOf();
    const endOfWeek = now.clone().endOf('week').valueOf();
    const startOfToday = now.clone().startOf('day').valueOf();
    const endOfToday = now.clone().endOf('day').valueOf();
    const statsResult = await sessions_1.Session.aggregate([
        { $match: { userId, projectId, endTime: { $exists: true, $ne: null } } },
        {
            $group: {
                _id: null,
                totalAllTime: {
                    $sum: { $subtract: ["$endTime", "$startTime"] }
                },
                totalThisWeek: {
                    $sum: {
                        $cond: [
                            { $and: [{ $gte: ["$startTime", startOfWeek] }, { $lte: ["$startTime", endOfWeek] }] },
                            { $subtract: ["$endTime", "$startTime"] },
                            0
                        ]
                    }
                },
                totalToday: {
                    $sum: {
                        $cond: [
                            { $and: [{ $gte: ["$startTime", startOfToday] }, { $lte: ["$startTime", endOfToday] }] },
                            { $subtract: ["$endTime", "$startTime"] },
                            0
                        ]
                    }
                }
            }
        }
    ]);
    const stats = statsResult[0] || { totalAllTime: 0, totalThisWeek: 0, totalToday: 0 };
    const totalHoursAllTime = stats.totalAllTime / (1000 * 60 * 60);
    const totalWorkedThisWeek = stats.totalThisWeek / (1000 * 60 * 60);
    const totalWorkedToday = stats.totalToday / (1000 * 60 * 60);
    const avgActivityRate = aggregatedSessions.length
        ? aggregatedSessions.reduce((sum, s) => sum + (s.activityRate || 0), 0) / aggregatedSessions.length
        : 0;
    const effectiveRate = (_b = (_a = member.hourlyRate) !== null && _a !== void 0 ? _a : orgMember === null || orgMember === void 0 ? void 0 : orgMember.hourlyRate) !== null && _b !== void 0 ? _b : 0;
    const memberObj = member.toJSON();
    return {
        project: {
            id: project.id,
            name: project.name,
            organizationId: project.organizationId,
        },
        member: {
            id: memberObj.id,
            userId: memberObj.userId,
            projectId: memberObj.projectId,
            role: memberObj.role,
            jobTitle: memberObj.role,
            status: memberObj.status,
            hourlyRate: (_c = memberObj.hourlyRate) !== null && _c !== void 0 ? _c : 0,
            weeklyLimitHours: (_d = memberObj.weeklyLimitHours) !== null && _d !== void 0 ? _d : null,
            dailyLimitHours: (_e = memberObj.dailyLimitHours) !== null && _e !== void 0 ? _e : null,
            requiredBreaks: !!memberObj.requiredBreaks,
            expectedWeeklyHours: (_f = memberObj.expectedWeeklyHours) !== null && _f !== void 0 ? _f : null,
            expectedWorkDays: memberObj.expectedWorkDays || [],
            notes: memberObj.notes || '',
            createdAt: memberObj.createdAt,
            user: {
                id: (_g = memberObj.user) === null || _g === void 0 ? void 0 : _g.id,
                name: (_h = memberObj.user) === null || _h === void 0 ? void 0 : _h.name,
                email: (_j = memberObj.user) === null || _j === void 0 ? void 0 : _j.email,
                avatar: (_k = memberObj.user) === null || _k === void 0 ? void 0 : _k.avatar,
            },
        },
        employment: {
            startDate: (orgMember === null || orgMember === void 0 ? void 0 : orgMember.startDate) || null,
            birthday: (orgMember === null || orgMember === void 0 ? void 0 : orgMember.birthday) || null,
        },
        rangeMetrics: {
            totalHoursWorked: Number(totalHoursAllTime.toFixed(2)),
            totalWorkedThisWeek: Number(totalWorkedThisWeek.toFixed(2)),
            totalWorkedToday: Number(totalWorkedToday.toFixed(2)),
            amountEarned: Number((totalHoursAllTime * effectiveRate).toFixed(2)),
            avgActivityRate: Number(avgActivityRate.toFixed(2)),
        },
        rawActivity: {
            aggregatedSessions,
        },
    };
};
exports.getProjectMemberProfile = getProjectMemberProfile;
const updateProjectMemberProfile = async (projectId, userId, organizationId, actorId, payload) => {
    const project = await project_model_1.default.findById(projectId);
    if (!project) {
        throw new index_3.ApiError(http_status_1.default.NOT_FOUND, 'Project not found');
    }
    if (project.organizationId !== organizationId) {
        throw new index_3.ApiError(http_status_1.default.NOT_FOUND, 'Project not found in organization');
    }
    const member = await project_member_model_1.default.findOne({ projectId, userId });
    if (!member) {
        throw new index_3.ApiError(http_status_1.default.NOT_FOUND, 'Project member not found');
    }
    if (payload.role !== undefined)
        member.role = payload.role;
    if (payload.hourlyRate !== undefined)
        member.hourlyRate = payload.hourlyRate;
    if (payload.weeklyLimitHours !== undefined)
        member.weeklyLimitHours = payload.weeklyLimitHours;
    if (payload.dailyLimitHours !== undefined)
        member.dailyLimitHours = payload.dailyLimitHours;
    if (payload.requiredBreaks !== undefined)
        member.requiredBreaks = payload.requiredBreaks;
    if (payload.expectedWeeklyHours !== undefined)
        member.expectedWeeklyHours = payload.expectedWeeklyHours;
    if (payload.expectedWorkDays !== undefined)
        member.expectedWorkDays = payload.expectedWorkDays;
    if (payload.notes !== undefined)
        member.notes = payload.notes;
    await member.save();
    if (payload.startDate !== undefined || payload.birthday !== undefined) {
        const setPayload = {};
        if (payload.startDate !== undefined)
            setPayload['startDate'] = payload.startDate ? new Date(payload.startDate) : null;
        if (payload.birthday !== undefined)
            setPayload['birthday'] = payload.birthday ? new Date(payload.birthday) : null;
        await organization_member_model_1.default.findOneAndUpdate({ organizationId: project.organizationId, userId }, { $set: setPayload }, { new: true });
    }
    const user = await index_1.userService.getUserById(userId);
    const changedFields = Object.keys(payload || {}).filter((key) => payload[key] !== undefined);
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.PROJECT,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.PROJECT_MEMBER_UPDATED,
        description: `Project member ${(user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.email) || userId} was updated in project "${project.name}"`,
        organizationId,
        projectId,
        actorId,
        targetId: userId,
        metadata: {
            module: 'projects',
            operation: 'update_project_member_profile',
            changedFields,
            context: { updates: payload },
        },
    });
    return (0, exports.getProjectMemberProfile)(projectId, userId, organizationId);
};
exports.updateProjectMemberProfile = updateProjectMemberProfile;
const assignProjectMember = async (organizationId, projectId, userId, role = project_interfaces_1.ProjectMemberRole.MEMBER, actorId) => {
    const project = await project_model_1.default.findById(projectId);
    if (!project || project.organizationId !== organizationId) {
        throw new index_3.ApiError(http_status_1.default.NOT_FOUND, 'Project not found in organization');
    }
    const orgMember = await organization_member_model_1.default.findOne({ organizationId, userId });
    if (!orgMember) {
        throw new index_3.ApiError(http_status_1.default.NOT_FOUND, 'Organization member not found');
    }
    let member = await project_member_model_1.default.findOne({ projectId, userId });
    const wasExistingMember = !!member;
    if (!member) {
        member = await project_member_model_1.default.create({
            projectId,
            userId,
            role,
            status: project_interfaces_1.ProjectMemberStatus.ACTIVE,
        });
    }
    else {
        member.role = role;
        member.status = project_interfaces_1.ProjectMemberStatus.ACTIVE;
        await member.save();
    }
    const user = await index_1.userService.getUserById(userId);
    const memberLabel = (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.email) || userId;
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.PROJECT,
        action: wasExistingMember
            ? activity_logs_1.activityLogInterfaces.ActivityLogAction.PROJECT_MEMBER_UPDATED
            : activity_logs_1.activityLogInterfaces.ActivityLogAction.PROJECT_MEMBER_ADDED,
        description: wasExistingMember
            ? `Project member ${memberLabel} was updated in project "${project.name}"`
            : `Project member ${memberLabel} was added to project "${project.name}" as ${role}`,
        organizationId,
        projectId,
        actorId,
        targetId: userId,
        metadata: {
            module: 'projects',
            operation: wasExistingMember ? 'assign_existing_member' : 'assign_new_member',
            context: { role },
        },
    });
    return member;
};
exports.assignProjectMember = assignProjectMember;
const unassignProjectMember = async (organizationId, projectId, userId, actorId) => {
    const project = await project_model_1.default.findById(projectId);
    if (!project || project.organizationId !== organizationId) {
        throw new index_3.ApiError(http_status_1.default.NOT_FOUND, 'Project not found in organization');
    }
    const member = await project_member_model_1.default.findOne({ projectId, userId });
    if (!member) {
        throw new index_3.ApiError(http_status_1.default.NOT_FOUND, 'Project member not found');
    }
    member.status = project_interfaces_1.ProjectMemberStatus.INACTIVE;
    await member.save();
    const user = await index_1.userService.getUserById(userId);
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.PROJECT,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.PROJECT_MEMBER_REMOVED,
        description: `Project member ${(user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.email) || userId} was removed from project "${project.name}"`,
        organizationId,
        projectId,
        actorId,
        targetId: userId,
        metadata: {
            module: 'projects',
            operation: 'unassign_member',
        },
    });
    return { success: true };
};
exports.unassignProjectMember = unassignProjectMember;
const getProjectInvitations = async (projectId, options = {}) => {
    const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
    const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
    const skip = (page - 1) * limit;
    const query = { projectId, status: project_invitation_interfaces_1.ProjectInvitationStatus.PENDING };
    const totalResults = await project_invitation_model_1.default.countDocuments(query);
    const totalPages = Math.ceil(totalResults / limit);
    const results = await project_invitation_model_1.default.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    return {
        results: results.map(e => {
            var _a;
            let inv = e.toJSON();
            return Object.assign(Object.assign({}, inv), { user: {
                    id: inv.id,
                    email: inv.email,
                    name: ((_a = inv.email.split("@")[0]) === null || _a === void 0 ? void 0 : _a.replace(".", " ")) || "",
                    avatar: ""
                }, userId: inv.id, jobTitle: inv.role, status: "invited" });
        }),
        page,
        limit,
        totalPages,
        totalResults
    };
};
exports.getProjectInvitations = getProjectInvitations;
const createInternalProject = async (projectBody, actorId) => {
    // Check if organization exists? (Optional but good)
    const project = await project_model_1.default.create(projectBody);
    // Log Activity (System/Internal User action)
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.PROJECT,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.PROJECT_CREATED,
        description: `Project "${project.name}" was created via internal admin`,
        organizationId: project.organizationId,
        projectId: project.id,
        actorId,
        targetId: project.id,
        metadata: {
            module: 'projects',
            operation: 'create_internal_project',
            context: { method: 'internal_admin' },
        }
    });
    return project;
};
exports.createInternalProject = createInternalProject;
const getInternalProjects = async (filter, options) => {
    // @ts-ignore
    const projects = await project_model_1.default.paginate(filter, options);
    const resultsWithMembersCount = await Promise.all(projects.results.map(async (project) => {
        // We can reuse the aggregation logic or simpler count if we don't need breakdown
        // User asked for "count of users", implying total active members usually.
        const count = await project_member_model_1.default.countDocuments({
            projectId: project.id,
            status: project_interfaces_1.ProjectMemberStatus.ACTIVE
        });
        return Object.assign(Object.assign({}, project.toJSON()), { membersCount: count });
    }));
    projects.results = resultsWithMembersCount;
    return projects;
};
exports.getInternalProjects = getInternalProjects;
const getInternalProjectById = async (id) => {
    const project = await project_model_1.default.findById(id);
    if (!project)
        return null;
    const memberStats = await project_member_model_1.default.aggregate([
        {
            $match: {
                projectId: id,
                status: project_interfaces_1.ProjectMemberStatus.ACTIVE
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                managers: {
                    $sum: {
                        $cond: [
                            { $in: ['$role', [project_interfaces_1.ProjectMemberRole.MANAGER]] },
                            1,
                            0
                        ]
                    }
                },
                staff: {
                    $sum: {
                        $cond: [
                            { $eq: ['$role', project_interfaces_1.ProjectMemberRole.MEMBER] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);
    const stats = memberStats[0] || { total: 0, managers: 0, staff: 0 };
    return Object.assign(Object.assign({}, project.toJSON()), { membersCount: stats.total, managersCount: stats.managers, staffCount: stats.staff });
};
exports.getInternalProjectById = getInternalProjectById;
const addMemberToProjectInternal = async (projectId, organizationId, userId, role = project_interfaces_1.ProjectMemberRole.MEMBER, actorId) => {
    // 1. Validate Project and Organization
    const project = await project_model_1.default.findById(projectId);
    if (!project)
        throw new Error('Project not found');
    if (project.organizationId !== organizationId)
        throw new Error('Project does not belong to the organization');
    const organization = await organizations_1.Organization.findById(organizationId);
    if (!organization)
        throw new Error('Organization not found');
    const user = await index_1.userService.getUserById(userId);
    if (!user)
        throw new Error('User not found');
    // 2. Add to Organization (if not already member)
    const orgMember = await organization_member_model_1.default.findOne({ organizationId, userId });
    if (!orgMember) {
        await organization_member_model_1.default.create({
            organizationId,
            userId,
            role: organization_interfaces_1.OrganizationMemberRole.MEMBER,
            status: organization_interfaces_1.OrganizationMemberStatus.ACTIVE
        });
        // Log Org Member Added
        await activity_logs_1.activityLogService.createActivityLog({
            type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
            action: activity_logs_1.activityLogInterfaces.ActivityLogAction.ORG_MEMBER_ADDED,
            description: `User ${user.email} was added to organization via internal project assignment`,
            organizationId,
            actorId,
            targetId: userId,
            metadata: {
                module: 'projects',
                operation: 'add_member_to_project_internal_org_membership_add',
            },
        });
    }
    // 3. Add to Project (if not already member)
    let projectMember = await project_member_model_1.default.findOne({ projectId, userId });
    if (projectMember) {
        if (projectMember.status !== project_interfaces_1.ProjectMemberStatus.ACTIVE) {
            projectMember.status = project_interfaces_1.ProjectMemberStatus.ACTIVE;
            projectMember.role = role || projectMember.role; // Update role if provided
            await projectMember.save();
        }
        else {
            // Already active, maybe update role?
            if (role && projectMember.role !== role) {
                projectMember.role = role;
                await projectMember.save();
            }
        }
    }
    else {
        projectMember = await project_member_model_1.default.create({
            projectId,
            userId,
            role,
            status: project_interfaces_1.ProjectMemberStatus.ACTIVE
        });
    }
    // Log Project Member Added
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.PROJECT,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.PROJECT_MEMBER_ADDED,
        description: `User ${user.email} was added to project "${project.name}" via internal admin`,
        organizationId,
        projectId,
        actorId,
        targetId: userId,
        metadata: {
            module: 'projects',
            operation: 'add_member_to_project_internal',
        },
    });
    return projectMember;
};
exports.addMemberToProjectInternal = addMemberToProjectInternal;
//# sourceMappingURL=project.service.js.map