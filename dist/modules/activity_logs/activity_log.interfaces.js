"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLogAction = exports.ActivityTargetType = exports.ActivityLogType = void 0;
var ActivityLogType;
(function (ActivityLogType) {
    ActivityLogType["PROJECT"] = "project";
    ActivityLogType["ORGANIZATION"] = "organization";
    ActivityLogType["USER"] = "user";
    ActivityLogType["SYSTEM"] = "system";
})(ActivityLogType = exports.ActivityLogType || (exports.ActivityLogType = {}));
var ActivityTargetType;
(function (ActivityTargetType) {
    ActivityTargetType["USER"] = "user";
    ActivityTargetType["PROJECT"] = "project";
    ActivityTargetType["ORGANIZATION"] = "organization";
    ActivityTargetType["TIMESHEET"] = "timesheet";
    ActivityTargetType["PTO_REQUEST"] = "pto_request";
    ActivityTargetType["PTO_POLICY"] = "pto_policy";
    ActivityTargetType["HOLIDAY"] = "holiday";
    ActivityTargetType["INVITATION"] = "invitation";
    ActivityTargetType["ROLE"] = "role";
    ActivityTargetType["OTHER"] = "other";
})(ActivityTargetType = exports.ActivityTargetType || (exports.ActivityTargetType = {}));
var ActivityLogAction;
(function (ActivityLogAction) {
    // Project Actions
    ActivityLogAction["PROJECT_CREATED"] = "project_created";
    ActivityLogAction["PROJECT_UPDATED"] = "project_updated";
    ActivityLogAction["PROJECT_ARCHIVED"] = "project_archived";
    ActivityLogAction["PROJECT_DELETED"] = "project_deleted";
    ActivityLogAction["PROJECT_MEMBER_ADDED"] = "project_member_added";
    ActivityLogAction["PROJECT_MEMBER_REMOVED"] = "project_member_removed";
    ActivityLogAction["PROJECT_MEMBER_UPDATED"] = "project_member_updated";
    // Auth & User Actions
    ActivityLogAction["USER_LOGIN"] = "user_login";
    ActivityLogAction["USER_REGISTERED"] = "user_registered";
    ActivityLogAction["USER_PROFILE_UPDATED"] = "user_profile_updated";
    ActivityLogAction["USER_2FA_UPDATED"] = "user_2fa_updated";
    ActivityLogAction["USER_PROFILE_IMAGE_DELETED"] = "user_profile_image_deleted";
    ActivityLogAction["USER_PROFILE_IMAGE_UPDATED"] = "user_profile_image_updated";
    ActivityLogAction["USER_CREATED_INTERNAL"] = "user_created_internal";
    ActivityLogAction["USER_DISABLED"] = "user_disabled";
    ActivityLogAction["USER_ENABLED"] = "user_enabled";
    ActivityLogAction["USER_PASSWORD_RESET"] = "user_password_reset";
    ActivityLogAction["USER_PASSWORD_CHANGED"] = "user_password_changed";
    // Timesheet Actions
    ActivityLogAction["TIMESHEET_UPDATED"] = "timesheet_updated";
    ActivityLogAction["TIMESHEET_DELETED"] = "timesheet_deleted";
    // PTO Actions
    ActivityLogAction["PTO_REQUEST_CREATED"] = "pto_request_created";
    ActivityLogAction["PTO_REQUEST_UPDATED"] = "pto_request_updated";
    ActivityLogAction["PTO_POLICY_CREATED"] = "pto_policy_created";
    ActivityLogAction["PTO_POLICY_UPDATED"] = "pto_policy_updated";
    // Holiday Actions
    ActivityLogAction["HOLIDAY_CREATED"] = "holiday_created";
    ActivityLogAction["HOLIDAY_UPDATED"] = "holiday_updated";
    ActivityLogAction["HOLIDAY_DELETED"] = "holiday_deleted";
    // Organization Actions
    ActivityLogAction["ORG_CREATED"] = "org_created";
    ActivityLogAction["ORG_UPDATED"] = "org_updated";
    ActivityLogAction["ORG_ENABLED"] = "org_enabled";
    ActivityLogAction["ORG_DISABLED"] = "org_disabled";
    ActivityLogAction["ORG_MEMBER_INVITED"] = "org_member_invited";
    ActivityLogAction["ORG_MEMBER_ADDED"] = "org_member_added";
    ActivityLogAction["ORG_MEMBER_UPDATED"] = "org_member_updated";
    ActivityLogAction["ORG_MEMBER_JOINED"] = "org_member_joined";
    ActivityLogAction["ORG_MEMBER_REJECTED"] = "org_member_rejected";
    ActivityLogAction["ORG_INVITATION_UPDATED"] = "org_invitation_updated";
    ActivityLogAction["ORG_INVITATION_RESENT"] = "org_invitation_resent";
    ActivityLogAction["ORG_INVITATION_REMOVED"] = "org_invitation_removed";
    // Staff Actions
    ActivityLogAction["STAFF_ACTIVITY_DELETED"] = "staff_activity_deleted";
    // RBAC/Governance Actions
    ActivityLogAction["RBAC_OVERRIDE_ADDED"] = "rbac_override_added";
    ActivityLogAction["RBAC_OVERRIDE_REMOVED"] = "rbac_override_removed";
    ActivityLogAction["RBAC_ROLE_PERMISSION_TOGGLED"] = "rbac_role_permission_toggled";
})(ActivityLogAction = exports.ActivityLogAction || (exports.ActivityLogAction = {}));
//# sourceMappingURL=activity_log.interfaces.js.map