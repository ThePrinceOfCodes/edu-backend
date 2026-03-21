"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationStats = exports.getProjectStats = exports.getSystemStats = void 0;
const moment_1 = __importDefault(require("moment"));
const organizations_1 = require("../organizations");
const projects_1 = require("../projects");
const users_1 = require("../users");
const sessions_1 = require("../sessions");
const calculateGrowth = (current, previous) => {
    if (previous === 0)
        return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
};
const getSystemStats = async () => {
    var _a, _b, _c;
    const startOfCurrentMonth = (0, moment_1.default)().startOf('month').toDate();
    const startOfLastMonth = (0, moment_1.default)().subtract(1, 'month').startOf('month').toDate();
    // 1. Total Organizations
    const totalOrgs = await organizations_1.Organization.countDocuments({});
    const additionsThisMonthOrg = await organizations_1.Organization.countDocuments({ createdAt: { $gte: startOfCurrentMonth } });
    const additionsLastMonthOrg = await organizations_1.Organization.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth }
    });
    const orgsGrowth = calculateGrowth(additionsThisMonthOrg, additionsLastMonthOrg);
    // 2. Total Projects
    const totalProjects = await projects_1.Project.countDocuments({});
    const additionsThisMonthProject = await projects_1.Project.countDocuments({ createdAt: { $gte: startOfCurrentMonth } });
    const additionsLastMonthProject = await projects_1.Project.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth }
    });
    const projectsGrowth = calculateGrowth(additionsThisMonthProject, additionsLastMonthProject);
    // 3. Total Users (Client only)
    const totalUsers = await users_1.User.countDocuments({ accountType: 'client' });
    const additionsThisMonthUser = await users_1.User.countDocuments({
        accountType: 'client',
        createdAt: { $gte: startOfCurrentMonth }
    });
    const additionsLastMonthUser = await users_1.User.countDocuments({
        accountType: 'client',
        createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth }
    });
    const usersGrowth = calculateGrowth(additionsThisMonthUser, additionsLastMonthUser);
    // 4. Total Hours Logged
    const hoursAgg = await sessions_1.Session.aggregate([
        {
            $match: {
                endTime: { $exists: true, $ne: null }
            }
        },
        {
            $project: {
                duration: { $subtract: ['$endTime', '$startTime'] },
                createdAt: 1
            }
        },
        {
            $group: {
                _id: null,
                totalSeconds: { $sum: '$duration' },
                thisMonthSeconds: {
                    $sum: {
                        $cond: [
                            { $gte: ['$createdAt', startOfCurrentMonth] },
                            '$duration',
                            0
                        ]
                    }
                },
                lastMonthSeconds: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $gte: ['$createdAt', startOfLastMonth] },
                                    { $lt: ['$createdAt', startOfCurrentMonth] }
                                ]
                            },
                            '$duration',
                            0
                        ]
                    }
                }
            }
        }
    ]);
    const totalSeconds = ((_a = hoursAgg[0]) === null || _a === void 0 ? void 0 : _a.totalSeconds) || 0;
    const totalHours = Math.round(totalSeconds / 3600 / 1000);
    const thisMonthSeconds = ((_b = hoursAgg[0]) === null || _b === void 0 ? void 0 : _b.thisMonthSeconds) || 0;
    const lastMonthSeconds = ((_c = hoursAgg[0]) === null || _c === void 0 ? void 0 : _c.lastMonthSeconds) || 0;
    const hoursGrowth = calculateGrowth(thisMonthSeconds, lastMonthSeconds);
    return {
        organizations: {
            total: totalOrgs,
            growth: orgsGrowth
        },
        projects: {
            total: totalProjects,
            growth: projectsGrowth
        },
        users: {
            total: totalUsers,
            growth: usersGrowth
        },
        hours: {
            total: totalHours,
            growth: hoursGrowth
        }
    };
};
exports.getSystemStats = getSystemStats;
const getProjectStats = async (organizationId) => {
    const filter = {};
    if (organizationId) {
        filter.organizationId = organizationId;
    }
    const total = await projects_1.Project.countDocuments(filter);
    const active = await projects_1.Project.countDocuments(Object.assign(Object.assign({}, filter), { status: 'active' }));
    const inactive = await projects_1.Project.countDocuments(Object.assign(Object.assign({}, filter), { status: 'archived' }));
    return {
        total,
        active,
        inactive
    };
};
exports.getProjectStats = getProjectStats;
const getOrganizationStats = async () => {
    const total = await organizations_1.Organization.countDocuments({});
    const active = await organizations_1.Organization.countDocuments({ status: 'active' });
    const inactive = await organizations_1.Organization.countDocuments({ status: 'disabled' });
    return {
        total,
        active,
        inactive
    };
};
exports.getOrganizationStats = getOrganizationStats;
//# sourceMappingURL=analytics.service.js.map