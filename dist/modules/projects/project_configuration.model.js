"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const toJSON_1 = require("../toJSON");
const project_configuration_interfaces_1 = require("./project_configuration.interfaces");
const projectConfigurationSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: uuid_1.v4,
    },
    projectId: {
        type: String,
        ref: 'Project',
        required: true,
        unique: true, // One config per project
    },
    maxHoursPerWeekPerMember: {
        type: Number,
        min: 0,
    },
    minHoursPerWeekPerMember: {
        type: Number,
        min: 0,
    },
    defaultHourlyRate: {
        type: Number,
        min: 0,
    },
    currency: {
        type: String,
        default: 'USD',
        trim: true,
        uppercase: true,
    },
    overtimeAllowed: {
        type: Boolean,
        default: false,
    },
    requireTimesheetApproval: {
        type: Boolean,
        default: true,
    },
    budgetCap: {
        type: Number,
        min: 0,
    },
    budgetType: {
        type: String,
        enum: Object.values(project_configuration_interfaces_1.BudgetType),
        default: project_configuration_interfaces_1.BudgetType.TIME_AND_MATERIALS,
    },
    workingDays: {
        type: [String],
        enum: Object.values(project_configuration_interfaces_1.WeekDay),
        default: [
            project_configuration_interfaces_1.WeekDay.MONDAY,
            project_configuration_interfaces_1.WeekDay.TUESDAY,
            project_configuration_interfaces_1.WeekDay.WEDNESDAY,
            project_configuration_interfaces_1.WeekDay.THURSDAY,
            project_configuration_interfaces_1.WeekDay.FRIDAY,
        ],
    },
}, {
    timestamps: true,
});
projectConfigurationSchema.plugin(toJSON_1.toJSON);
const ProjectConfiguration = mongoose_1.default.model('ProjectConfiguration', projectConfigurationSchema);
exports.default = ProjectConfiguration;
//# sourceMappingURL=project_configuration.model.js.map