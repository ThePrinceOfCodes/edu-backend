"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectOrganizationInvitation = exports.removeOrganizationInvitationByToken = exports.resendOrganizationInvitationByToken = exports.updateOrganizationInvitationByToken = exports.getOrganizationInvitations = exports.updateOrganizationMemberById = exports.getOrganizationMemberById = exports.getOrganizationMembers = exports.acceptOrganizationInvitation = exports.inviteUsersToOrganization = exports.resendOrganizationOnboarding = exports.enableOrganizationById = exports.createInternalOrganization = exports.disableOrganizationById = exports.updateOrganizationById = exports.getOrganizationById = exports.getOrganizations = exports.getUserOrganizations = exports.inviteMember = exports.updateOnboardingStep = exports.createOrganization = void 0;
const organization_model_1 = __importDefault(require("./organization.model"));
const organization_member_model_1 = __importDefault(require("./organization_member.model"));
const organization_interfaces_1 = require("./organization.interfaces");
const project_model_1 = __importDefault(require("../projects/project.model"));
const project_member_model_1 = __importDefault(require("../projects/project_member.model"));
const activity_logs_1 = require("../activity_logs");
const service_1 = require("../email/service");
const index_1 = require("../users/index");
const index_2 = require("../auth/index");
const crypto_1 = __importDefault(require("crypto"));
const config_1 = __importDefault(require("@src/config/config"));
const moment_1 = __importDefault(require("moment"));
const organization_invitation_model_1 = __importDefault(require("./organization_invitation.model"));
const organization_invitation_interfaces_1 = require("./organization_invitation.interfaces");
const index_3 = require("../hubstaff/index");
const createOrganization = async (orgBody, userId, actorId) => {
    const org = await organization_model_1.default.create(Object.assign(Object.assign({}, orgBody), { onboarding: {
            currentStep: organization_interfaces_1.OnboardingStep.OWNER_INVITED,
            completedSteps: [organization_interfaces_1.OnboardingStep.OWNER_INVITED],
            completedAt: new Date()
        } }));
    // Add owner as active member
    await organization_member_model_1.default.create({
        organizationId: org.id,
        userId,
        role: organization_interfaces_1.OrganizationMemberRole.OWNER,
        status: organization_interfaces_1.OrganizationMemberStatus.ACTIVE
    });
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.ORG_CREATED,
        description: `Organization "${org.name}" was created`,
        organizationId: org.id,
        actorId: actorId || userId,
        targetId: org.id,
        metadata: {
            module: 'organizations',
            operation: 'create_organization',
            ownerId: userId,
            source: actorId && actorId !== userId ? 'internal_admin' : 'self_service',
        },
    });
    return org;
};
exports.createOrganization = createOrganization;
const updateOnboardingStep = async (organizationId, step) => {
    const org = await organization_model_1.default.findById(organizationId);
    if (!org)
        return;
    if (!org.onboarding) {
        org.onboarding = {
            currentStep: step,
            completedSteps: [],
            completedAt: new Date()
        };
    }
    if (!org.onboarding.completedSteps.includes(step)) {
        org.onboarding.completedSteps.push(step);
        org.onboarding.currentStep = step;
        org.onboarding.completedAt = new Date();
        await org.save();
    }
};
exports.updateOnboardingStep = updateOnboardingStep;
const inviteMember = async (organizationId, userId, actorId) => {
    const count = await organization_member_model_1.default.countDocuments({ organizationId });
    if (count === 1) {
        await (0, exports.updateOnboardingStep)(organizationId, organization_interfaces_1.OnboardingStep.STAFF_INVITED);
    }
    const member = await organization_member_model_1.default.create({
        organizationId,
        userId,
        status: organization_interfaces_1.OrganizationMemberStatus.INVITED
    });
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.ORG_MEMBER_INVITED,
        description: `A member was invited to the organization`,
        organizationId,
        actorId,
        targetId: userId,
        metadata: {
            module: 'organizations',
            operation: 'invite_member',
            invitationMethod: 'direct_member_invite',
        },
    });
    return member;
};
exports.inviteMember = inviteMember;
const getUserOrganizations = async (userId) => {
    const memberships = await organization_member_model_1.default.find({ userId }).populate('organization');
    const results = await Promise.all(memberships.map(async (m) => {
        const organizationId = m.organizationId;
        const hubstaffToken = await index_3.HubstaffAccessToken.findOne({ organizationId });
        const orgObj = m.organization ? m.organization.toJSON() : {};
        return {
            _id: m._id,
            userId: m.userId,
            organizationId: m.organizationId,
            role: m.role,
            status: m.status,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
            organization: Object.assign(Object.assign({}, orgObj), { isHubstaffConnected: !!hubstaffToken })
        };
    }));
    return results;
};
exports.getUserOrganizations = getUserOrganizations;
const getOrganizations = async (filter, options) => {
    if (filter.search) {
        filter.name = { $regex: filter.search, $options: 'i' };
        delete filter.search;
    }
    // @ts-ignore
    const organizations = await organization_model_1.default.paginate(filter, options);
    const resultsWithCounts = await Promise.all(organizations.results.map(async (org) => {
        const membersCount = await organization_member_model_1.default.countDocuments({ organizationId: org.id });
        const projectsCount = await project_model_1.default.countDocuments({ organizationId: org.id });
        return Object.assign(Object.assign({}, org.toJSON()), { membersCount, projectsCount });
    }));
    organizations.results = resultsWithCounts;
    return organizations;
};
exports.getOrganizations = getOrganizations;
const getOrganizationById = async (id) => {
    const org = await organization_model_1.default.findById(id);
    if (!org)
        return null;
    const membersCount = await organization_member_model_1.default.countDocuments({ organizationId: org.id });
    const projectsCount = await project_model_1.default.countDocuments({ organizationId: org.id });
    return Object.assign(Object.assign({}, org.toJSON()), { membersCount, projectsCount });
};
exports.getOrganizationById = getOrganizationById;
const updateOrganizationById = async (id, updateBody, actorId) => {
    const org = await organization_model_1.default.findById(id);
    if (!org) {
        throw new Error('Organization not found');
    }
    const changedFields = Object.keys(updateBody || {}).filter((key) => updateBody[key] !== undefined);
    Object.assign(org, updateBody);
    await org.save();
    if (changedFields.length > 0) {
        await activity_logs_1.activityLogService.createActivityLog({
            type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
            action: activity_logs_1.activityLogInterfaces.ActivityLogAction.ORG_UPDATED,
            description: `Organization "${org.name}" was updated`,
            organizationId: org.id,
            actorId,
            targetId: org.id,
            metadata: {
                module: 'organizations',
                operation: 'update_organization',
                changedFields,
                update: updateBody,
            },
        });
    }
    return org;
};
exports.updateOrganizationById = updateOrganizationById;
const disableOrganizationById = async (id, actorId) => {
    const org = await organization_model_1.default.findById(id);
    if (!org) {
        throw new Error('Organization not found');
    }
    org.status = 'disabled';
    await org.save();
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.ORG_DISABLED,
        description: `Organization "${org.name}" was disabled`,
        organizationId: org.id,
        actorId,
        targetId: org.id,
        metadata: {
            module: 'organizations',
            operation: 'disable_organization',
        },
    });
    return org;
};
exports.disableOrganizationById = disableOrganizationById;
const createInternalOrganization = async (orgBody, actorId) => {
    const { name, organizationName, workEmail } = orgBody;
    const domain = workEmail.split('@')[1];
    if (config_1.default.redisBaseKey.includes("PROD")) {
        if (await organization_model_1.default.isDomainTaken(domain)) {
            throw new Error(`An organization with the domain ${domain} already exists.`);
        }
    }
    // 1. Create User
    // Check if user exists first? Assuming new user flow as per requirements.
    // If we re-use existing user, we should fetch by email.
    // However, prompt implies "so a new user".
    // I will try to create. If email taken, user service might throw?
    // userService.createUser checks Auth.isEmailTaken.
    // Let's create user.
    const user = await index_1.userService.createUser({
        name,
        email: workEmail
    });
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.USER,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.USER_REGISTERED,
        description: `User account ${workEmail} was registered`,
        actorId,
        targetId: user.id,
        metadata: {
            module: 'organizations',
            operation: 'create_internal_organization_user',
            registrationType: 'internal_admin_created',
            email: workEmail,
        },
    });
    // 2. Create Auth
    const randomPassword = crypto_1.default.randomBytes(16).toString('hex') + "1aA"; // strong enough
    await index_2.authService.createAuth({
        user: user.id,
        email: workEmail,
        password: randomPassword,
        provider: 'email'
    });
    // 3. Create Organization & Link Owner
    const organization = await (0, exports.createOrganization)({
        name: organizationName,
        domain,
        status: 'active'
    }, user.id, actorId);
    const token = index_2.authService.generateToken(user.id, (0, moment_1.default)().add(200, 'hour'), "onboarding", { organizationId: organization.id });
    // Send Onboarding Email
    await service_1.emailManagementService.sendOrganizationOnboardingEmail(workEmail, organization.name, token);
    return organization;
};
exports.createInternalOrganization = createInternalOrganization;
const enableOrganizationById = async (id, actorId) => {
    const org = await organization_model_1.default.findById(id);
    if (!org) {
        throw new Error('Organization not found');
    }
    org.status = 'active';
    await org.save();
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.ORG_ENABLED,
        description: `Organization "${org.name}" was enabled`,
        organizationId: org.id,
        actorId,
        targetId: org.id,
        metadata: {
            module: 'organizations',
            operation: 'enable_organization',
        },
    });
    return org;
};
exports.enableOrganizationById = enableOrganizationById;
const resendOrganizationOnboarding = async (organizationId) => {
    const org = await organization_model_1.default.findById(organizationId);
    if (!org) {
        throw new Error('Organization not found');
    }
    const ownerMember = await organization_member_model_1.default.findOne({
        organizationId: org.id,
        role: organization_interfaces_1.OrganizationMemberRole.OWNER
    });
    if (!ownerMember) {
        throw new Error('Organization owner not found');
    }
    const user = await index_1.userService.getUserById(ownerMember.userId);
    if (!user) {
        throw new Error('Owner user not found');
    }
    const token = index_2.authService.generateToken(user.id, (0, moment_1.default)().add(200, 'hour'), "onboarding", { organizationId: org.id });
    await service_1.emailManagementService.sendOrganizationOnboardingEmail(user.email, org.name, token);
    return { success: true };
};
exports.resendOrganizationOnboarding = resendOrganizationOnboarding;
const inviteUsersToOrganization = async (organizationId, members, actorId) => {
    var _a;
    const organization = await organization_model_1.default.findById(organizationId);
    if (!organization) {
        throw new Error('Organization not found');
    }
    const creator = await index_1.userService.getUserById(actorId);
    if (!creator) {
        throw new Error('Creator not found');
    }
    const creatorName = creator.name || creator.email || "";
    const creatorAvatar = creator.avatar || ""; // Assuming avatar exists on user model
    const results = [];
    // Check count for first staff invited logic
    const initialMemberCount = await organization_member_model_1.default.countDocuments({ organizationId });
    const isFirstStaff = initialMemberCount === 1; // Only owner exists
    let staffAddedOrInvited = false;
    for (let { email, role, birthday, startDate, projects, payRate } of members) {
        try {
            const user = await index_1.userService.getUserByEmail(email);
            if (user) {
                // Check if already an active organization member
                const existingMember = await organization_member_model_1.default.findOne({
                    organizationId,
                    userId: user.id,
                    status: organization_interfaces_1.OrganizationMemberStatus.ACTIVE
                });
                if (existingMember) {
                    results.push({ email, status: 'already_active_member' });
                    continue;
                }
            }
            // Check for existing invitation
            let invitation = await organization_invitation_model_1.default.findOne({
                email,
                organizationId,
                status: organization_invitation_interfaces_1.OrganizationInvitationStatus.PENDING
            });
            if (invitation) {
                // Update existing invitation
                invitation.expiresAt = (0, moment_1.default)().add(7, 'days').toDate();
                if (role)
                    invitation.role = role;
                if (birthday)
                    invitation.birthday = birthday;
                if (startDate)
                    invitation.startDate = startDate;
                if (projects)
                    invitation.projects = projects;
                if (payRate)
                    invitation.hourlyRate = Number(payRate);
                await invitation.save();
                await service_1.emailManagementService.sendOrganizationInvitationEmail(email, (user === null || user === void 0 ? void 0 : user.name) || email.split('@')[0], organization.name, invitation.token, creatorName, creatorAvatar);
                await activity_logs_1.activityLogService.createActivityLog({
                    type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
                    action: activity_logs_1.activityLogInterfaces.ActivityLogAction.ORG_INVITATION_RESENT,
                    description: `Invitation was re-sent to ${email} for organization "${organization.name}"`,
                    organizationId,
                    actorId,
                    targetId: invitation.token,
                    metadata: {
                        module: 'organizations',
                        email,
                        role: invitation.role,
                        operation: 'reinvite_member',
                    },
                });
                staffAddedOrInvited = true;
                results.push({ email, invitation, status: 're-invited' });
                continue;
            }
            // Create new invitation (for both existing and non-existing users)
            const expiresAt = (0, moment_1.default)().add(7, 'days').toDate();
            const token = index_2.authService.generateToken((user === null || user === void 0 ? void 0 : user.id) || email, (0, moment_1.default)(expiresAt), "onboarding", { organizationId });
            invitation = await organization_invitation_model_1.default.create(Object.assign(Object.assign(Object.assign(Object.assign({ email,
                organizationId,
                token, status: organization_invitation_interfaces_1.OrganizationInvitationStatus.PENDING, role: role || organization_interfaces_1.OrganizationMemberRole.MEMBER, expiresAt }, (birthday && { birthday })), (startDate && { startDate })), (projects && { projects })), (payRate && { hourlyRate: Number(payRate) })));
            await service_1.emailManagementService.sendOrganizationInvitationEmail(email, (user === null || user === void 0 ? void 0 : user.name) || email.split('@')[0], organization.name, token, creatorName, creatorAvatar);
            await activity_logs_1.activityLogService.createActivityLog({
                type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
                action: activity_logs_1.activityLogInterfaces.ActivityLogAction.ORG_MEMBER_INVITED,
                description: `Invitation was sent to ${email} to join organization "${organization.name}"`,
                organizationId,
                actorId,
                targetId: invitation.token,
                metadata: {
                    module: 'organizations',
                    email,
                    role: invitation.role,
                    projectsCount: ((_a = invitation.projects) === null || _a === void 0 ? void 0 : _a.length) || 0,
                    operation: 'new_invitation',
                },
            });
            staffAddedOrInvited = true;
            results.push({ email, invitation, status: 'invited' });
        }
        catch (error) {
            results.push({ email, status: 'error', message: error.message });
        }
    }
    if (isFirstStaff && staffAddedOrInvited) {
        await (0, exports.updateOnboardingStep)(organizationId, organization_interfaces_1.OnboardingStep.STAFF_INVITED);
    }
    else {
        if (staffAddedOrInvited) {
            await (0, exports.updateOnboardingStep)(organizationId, organization_interfaces_1.OnboardingStep.STAFF_INVITED);
        }
    }
    return results;
};
exports.inviteUsersToOrganization = inviteUsersToOrganization;
/**
 * Accept organization invitation
 * @param {string} userId - User ID accepting the invitation
 * @param {string} organizationId - Organization ID
 * @returns {Promise<any>}
 */
const acceptOrganizationInvitation = async (userId, organizationId) => {
    const user = await index_1.userService.getUserById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    const organization = await organization_model_1.default.findById(organizationId);
    // Find the pending invitation
    const invitation = await organization_invitation_model_1.default.findOne({
        email: user.email,
        organizationId,
        status: organization_invitation_interfaces_1.OrganizationInvitationStatus.PENDING
    });
    if (!invitation) {
        throw new Error('Invitation not found or already accepted');
    }
    // Find or create the member record
    let member = await organization_member_model_1.default.findOne({
        userId,
        organizationId
    });
    if (!member) {
        member = new organization_member_model_1.default({
            userId,
            organizationId
        });
    }
    // Copy birthday, startDate, and role from invitation
    if (invitation.birthday)
        member.birthday = invitation.birthday;
    if (invitation.startDate)
        member.startDate = invitation.startDate;
    if (invitation.hourlyRate)
        member.hourlyRate = invitation.hourlyRate;
    member.role = invitation.role;
    member.status = organization_interfaces_1.OrganizationMemberStatus.ACTIVE;
    await member.save();
    // Add user to specified projects
    if (invitation.projects && invitation.projects.length > 0) {
        for (const { projectId, role } of invitation.projects) {
            // Check if project exists and belongs to this organization
            const project = await project_model_1.default.findOne({ _id: projectId, organizationId });
            if (!project) {
                console.warn(`Project ${projectId} not found or doesn't belong to organization ${organizationId}`);
                continue;
            }
            // Check if user is already a member of this project
            const existingProjectMember = await project_member_model_1.default.findOne({
                projectId,
                userId
            });
            if (!existingProjectMember) {
                // Add user to project
                await project_member_model_1.default.create({
                    projectId,
                    userId,
                    hourlyRate: invitation.hourlyRate || 0,
                    role: role || member.role,
                    status: organization_interfaces_1.OrganizationMemberStatus.ACTIVE
                });
                // Log activity
                await activity_logs_1.activityLogService.createActivityLog({
                    type: activity_logs_1.activityLogInterfaces.ActivityLogType.PROJECT,
                    action: activity_logs_1.activityLogInterfaces.ActivityLogAction.PROJECT_MEMBER_ADDED,
                    description: `User ${user.email} was added to a project via invitation acceptance`,
                    organizationId,
                    projectId,
                    actorId: userId,
                    targetId: userId,
                    metadata: {
                        module: 'organizations',
                        operation: 'accept_organization_invitation_project_assignment',
                    },
                });
            }
        }
    }
    // Mark invitation as accepted
    invitation.status = organization_invitation_interfaces_1.OrganizationInvitationStatus.ACCEPTED;
    await invitation.save();
    // Log activity
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.ORG_MEMBER_JOINED,
        description: `User ${user.email} joined organization "${(organization === null || organization === void 0 ? void 0 : organization.name) || organizationId}"`,
        organizationId,
        actorId: userId,
        targetId: userId,
        metadata: {
            module: 'organizations',
            operation: 'accept_organization_invitation',
        },
    });
    return { user, member };
};
exports.acceptOrganizationInvitation = acceptOrganizationInvitation;
/**
 * Get organization members
 * @param {any} filter
 * @param {any} options
 * @returns {Promise<any>}
 */
const getOrganizationMembers = async (filter, options) => {
    var _a, _b, _c, _d;
    const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
    const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
    const skip = (page - 1) * limit;
    const [sortField = 'createdAt', sortOrder = 'desc'] = String(options.sortBy || 'createdAt:desc').split(':');
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const match = Object.assign(Object.assign(Object.assign({}, (filter.organizationId ? { organizationId: filter.organizationId } : {})), (filter.role ? { role: filter.role } : {})), (filter.status ? { status: filter.status } : {}));
    const pipeline = [
        { $match: match },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user',
            },
        },
        { $unwind: '$user' },
        {
            $lookup: {
                from: 'projectmembers',
                let: { memberUserId: '$userId', memberOrgId: '$organizationId' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$userId', '$$memberUserId'] },
                                    { $eq: ['$status', 'active'] },
                                ],
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: 'projects',
                            let: { memberProjectId: '$projectId', memberOrgId: '$$memberOrgId' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$_id', '$$memberProjectId'] },
                                                { $eq: ['$organizationId', '$$memberOrgId'] },
                                            ],
                                        },
                                    },
                                },
                                { $project: { _id: 1 } },
                            ],
                            as: 'project',
                        },
                    },
                    { $match: { project: { $ne: [] } } },
                    { $group: { _id: '$projectId' } },
                ],
                as: 'memberProjects',
            },
        },
    ];
    if (filter.search) {
        pipeline.push({
            $match: {
                $or: [
                    { 'user.name': { $regex: filter.search, $options: 'i' } },
                    { 'user.email': { $regex: filter.search, $options: 'i' } },
                    { role: { $regex: filter.search, $options: 'i' } },
                    { status: { $regex: filter.search, $options: 'i' } },
                ],
            },
        });
    }
    if (filter.email) {
        pipeline.push({
            $match: {
                'user.email': { $regex: filter.email, $options: 'i' },
            },
        });
    }
    pipeline.push({
        $project: {
            id: '$_id',
            _id: 0,
            organizationId: 1,
            userId: 1,
            role: 1,
            status: 1,
            hourlyRate: 1,
            permissionOverrides: 1,
            birthday: 1,
            startDate: 1,
            projectCount: { $size: '$memberProjects' },
            createdAt: 1,
            updatedAt: 1,
            user: {
                id: '$user._id',
                name: '$user.name',
                email: '$user.email',
                avatar: '$user.avatar',
            },
        },
    });
    const results = await organization_member_model_1.default.aggregate([
        ...pipeline,
        {
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [
                    { $sort: { [sortField]: sortDirection } },
                    { $skip: skip },
                    { $limit: limit },
                ],
            },
        },
    ]);
    const totalResults = ((_c = (_b = (_a = results[0]) === null || _a === void 0 ? void 0 : _a.metadata) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.total) || 0;
    return {
        results: ((_d = results[0]) === null || _d === void 0 ? void 0 : _d.data) || [],
        page,
        limit,
        totalPages: Math.ceil(totalResults / limit),
        totalResults,
    };
};
exports.getOrganizationMembers = getOrganizationMembers;
const getOrganizationMemberById = async (organizationId, memberId) => {
    const member = await organization_member_model_1.default.findOne({ _id: memberId, organizationId });
    if (!member) {
        return null;
    }
    const memberObj = member.toJSON();
    const user = await index_1.userService.getUserById(member.userId);
    const projectMemberships = await project_member_model_1.default.find({ userId: member.userId, status: 'active' }).lean();
    const projectIds = Array.from(new Set(projectMemberships.map((item) => item.projectId).filter(Boolean)));
    const projects = projectIds.length
        ? await project_model_1.default.find({ _id: { $in: projectIds }, organizationId }).select('_id name').lean()
        : [];
    const projectById = new Map(projects.map((project) => [project._id, project]));
    const assignmentList = projectMemberships
        .map((item) => {
        const project = projectById.get(item.projectId);
        if (!project)
            return null;
        return {
            id: project._id,
            name: project.name,
            role: item.role,
        };
    })
        .filter(Boolean);
    return {
        id: memberObj.id,
        organizationId: memberObj.organizationId,
        userId: memberObj.userId,
        role: memberObj.role,
        status: memberObj.status,
        hourlyRate: memberObj.hourlyRate,
        permissionOverrides: memberObj.permissionOverrides,
        birthday: memberObj.birthday,
        startDate: memberObj.startDate,
        createdAt: memberObj.createdAt,
        updatedAt: memberObj.updatedAt,
        user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
        } : null,
        projects: assignmentList,
    };
};
exports.getOrganizationMemberById = getOrganizationMemberById;
const updateOrganizationMemberById = async (organizationId, memberId, actorId, payload) => {
    const member = await organization_member_model_1.default.findOne({ _id: memberId, organizationId });
    if (!member) {
        return null;
    }
    if (payload.role !== undefined)
        member.role = payload.role;
    if (payload.hourlyRate !== undefined)
        member.hourlyRate = payload.hourlyRate;
    if (payload.startDate !== undefined)
        member.set('startDate', payload.startDate ? new Date(payload.startDate) : null);
    if (payload.birthday !== undefined)
        member.set('birthday', payload.birthday ? new Date(payload.birthday) : null);
    await member.save();
    if (typeof payload.name === 'string') {
        const user = await index_1.userService.getUserById(member.userId);
        if (user) {
            user.name = payload.name.trim() || user.name;
            await user.save();
        }
    }
    const targetUser = await index_1.userService.getUserById(member.userId);
    const changedFields = Object.keys(payload || {}).filter((key) => payload[key] !== undefined);
    if (changedFields.length > 0) {
        await activity_logs_1.activityLogService.createActivityLog({
            type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
            action: activity_logs_1.activityLogInterfaces.ActivityLogAction.ORG_MEMBER_UPDATED,
            description: `Member ${(targetUser === null || targetUser === void 0 ? void 0 : targetUser.name) || (targetUser === null || targetUser === void 0 ? void 0 : targetUser.email) || member.userId} was updated in organization`,
            organizationId,
            actorId,
            targetId: member.userId,
            metadata: {
                module: 'organizations',
                operation: 'update_organization_member',
                changedFields,
                updates: payload,
                memberId,
            },
        });
    }
    return (0, exports.getOrganizationMemberById)(organizationId, memberId);
};
exports.updateOrganizationMemberById = updateOrganizationMemberById;
/**
 * Get organization invitations
 * @param {any} filter
 * @param {any} options
 * @returns {Promise<any>}
 */
const getOrganizationInvitations = async (filter, options) => {
    // @ts-ignore
    return organization_invitation_model_1.default.paginate(filter, options);
};
exports.getOrganizationInvitations = getOrganizationInvitations;
const updateOrganizationInvitationByToken = async (organizationId, invitationToken, actorId, payload) => {
    const invitation = await organization_invitation_model_1.default.findOne({
        organizationId,
        token: invitationToken,
        status: organization_invitation_interfaces_1.OrganizationInvitationStatus.PENDING,
    });
    if (!invitation) {
        return null;
    }
    if (payload.role !== undefined)
        invitation.role = payload.role;
    if (payload.payRate !== undefined)
        invitation.hourlyRate = payload.payRate === null ? 0 : Number(payload.payRate);
    if (payload.startDate !== undefined)
        invitation.set('startDate', payload.startDate ? new Date(payload.startDate) : null);
    if (payload.birthday !== undefined)
        invitation.set('birthday', payload.birthday ? new Date(payload.birthday) : null);
    if (payload.projects !== undefined)
        invitation.projects = payload.projects;
    invitation.expiresAt = (0, moment_1.default)().add(7, 'days').toDate();
    await invitation.save();
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.ORG_INVITATION_UPDATED,
        description: `Pending invitation for ${invitation.email} was updated`,
        organizationId,
        actorId,
        targetId: invitation.token,
        metadata: {
            module: 'organizations',
            invitationToken,
            operation: 'update_invitation',
            role: invitation.role,
        },
    });
    return invitation;
};
exports.updateOrganizationInvitationByToken = updateOrganizationInvitationByToken;
const resendOrganizationInvitationByToken = async (organizationId, invitationToken, actorId) => {
    var _a;
    const invitation = await organization_invitation_model_1.default.findOne({
        organizationId,
        token: invitationToken,
        status: organization_invitation_interfaces_1.OrganizationInvitationStatus.PENDING,
    });
    if (!invitation) {
        return null;
    }
    const invitePayload = {
        email: invitation.email,
        role: invitation.role,
    };
    if (invitation.hourlyRate !== undefined && invitation.hourlyRate !== null) {
        invitePayload.payRate = String(invitation.hourlyRate);
    }
    if (invitation.birthday) {
        invitePayload.birthday = invitation.birthday;
    }
    if (invitation.startDate) {
        invitePayload.startDate = invitation.startDate;
    }
    if ((_a = invitation.projects) === null || _a === void 0 ? void 0 : _a.length) {
        invitePayload.projects = invitation.projects;
    }
    await (0, exports.inviteUsersToOrganization)(organizationId, [invitePayload], actorId);
    return invitation;
};
exports.resendOrganizationInvitationByToken = resendOrganizationInvitationByToken;
const removeOrganizationInvitationByToken = async (organizationId, invitationToken, actorId) => {
    const invitation = await organization_invitation_model_1.default.findOne({
        organizationId,
        token: invitationToken,
        status: organization_invitation_interfaces_1.OrganizationInvitationStatus.PENDING,
    });
    if (!invitation) {
        return null;
    }
    invitation.status = organization_invitation_interfaces_1.OrganizationInvitationStatus.REJECTED;
    await invitation.save();
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.ORG_INVITATION_REMOVED,
        description: `Pending invitation for ${invitation.email} was removed`,
        organizationId,
        actorId,
        targetId: invitation.token,
        metadata: {
            module: 'organizations',
            invitationToken,
            operation: 'remove_invitation',
        },
    });
    return invitation;
};
exports.removeOrganizationInvitationByToken = removeOrganizationInvitationByToken;
/**
 * Reject organization invitation
 * @param {string} userId - User ID rejecting the invitation
 * @param {string} organizationId - Organization ID
 * @returns {Promise<any>}
 */
const rejectOrganizationInvitation = async (userId, organizationId) => {
    // Find and remove the member record
    const user = await index_1.userService.getUserById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    // Mark invitation as expired/rejected if it exists
    const invitation = await organization_invitation_model_1.default.findOne({
        email: user.email,
        organizationId,
        status: organization_invitation_interfaces_1.OrganizationInvitationStatus.PENDING
    });
    if (invitation) {
        invitation.status = organization_invitation_interfaces_1.OrganizationInvitationStatus.REJECTED;
        await invitation.save();
    }
    // Log activity
    await activity_logs_1.activityLogService.createActivityLog({
        type: activity_logs_1.activityLogInterfaces.ActivityLogType.ORGANIZATION,
        action: activity_logs_1.activityLogInterfaces.ActivityLogAction.ORG_MEMBER_REJECTED,
        description: `User ${user.email} rejected an organization invitation`,
        organizationId,
        actorId: userId,
        targetId: userId,
        metadata: {
            module: 'organizations',
            operation: 'reject_organization_invitation',
        },
    });
    return { success: true };
};
exports.rejectOrganizationInvitation = rejectOrganizationInvitation;
//# sourceMappingURL=organization.service.js.map