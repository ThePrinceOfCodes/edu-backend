"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../modules/auth");
const validate_1 = require("../../modules/validate");
const timesheet_1 = require("../../modules/timesheet");
const router = express_1.default.Router();
router
    .route('/')
    .get(auth_1.authenticate, (0, validate_1.validate)(timesheet_1.timesheetValidation.getTimesheets), timesheet_1.timesheetController.getTimesheets);
router
    .route('/owner')
    .get(auth_1.authenticate, (0, validate_1.validate)(timesheet_1.timesheetValidation.getOwnerTimesheets), timesheet_1.timesheetController.getOwnerTimesheets);
router
    .route('/member')
    .get(auth_1.authenticate, (0, validate_1.validate)(timesheet_1.timesheetValidation.getMemberTimesheets), timesheet_1.timesheetController.getMemberTimesheets);
router
    .route('/:timesheetId')
    .get(auth_1.authenticate, (0, validate_1.validate)(timesheet_1.timesheetValidation.getTimesheet), timesheet_1.timesheetController.getTimesheet)
    .patch(auth_1.authenticate, (0, validate_1.validate)(timesheet_1.timesheetValidation.updateTimesheet), timesheet_1.timesheetController.updateTimesheet)
    .delete(auth_1.authenticate, (0, validate_1.validate)(timesheet_1.timesheetValidation.deleteTimesheet), timesheet_1.timesheetController.deleteTimesheet);
router
    .route('/member/:timesheetId/sessions')
    .get(auth_1.authenticate, (0, validate_1.validate)(timesheet_1.timesheetValidation.getTimesheetSessions), timesheet_1.timesheetController.getTimesheetSessions);
router
    .route('/member/:timesheetId/submit')
    .post(auth_1.authenticate, (0, validate_1.validate)(timesheet_1.timesheetValidation.submitTimesheet), timesheet_1.timesheetController.submitTimesheet);
router
    .route('/:timesheetId/approve')
    .post(auth_1.authenticate, (0, validate_1.validate)(timesheet_1.timesheetValidation.approveTimesheet), timesheet_1.timesheetController.approveTimesheet);
router
    .route('/:timesheetId/reject')
    .post(auth_1.authenticate, (0, validate_1.validate)(timesheet_1.timesheetValidation.rejectTimesheet), timesheet_1.timesheetController.rejectTimesheet);
router
    .route('/:timesheetId/status')
    .patch(auth_1.authenticate, (0, validate_1.validate)(timesheet_1.timesheetValidation.updateStatus), timesheet_1.timesheetController.updateStatus);
exports.default = router;
//# sourceMappingURL=timesheet.route.js.map