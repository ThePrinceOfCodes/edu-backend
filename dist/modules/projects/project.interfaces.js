"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkDay = exports.ProjectMemberStatus = exports.ProjectMemberRole = exports.ProjectStatus = void 0;
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus["ACTIVE"] = "active";
    ProjectStatus["ARCHIVED"] = "archived";
})(ProjectStatus = exports.ProjectStatus || (exports.ProjectStatus = {}));
var ProjectMemberRole;
(function (ProjectMemberRole) {
    ProjectMemberRole["OWNER"] = "owner";
    ProjectMemberRole["MANAGER"] = "manager";
    ProjectMemberRole["MEMBER"] = "member";
    ProjectMemberRole["VIEWER"] = "viewer";
})(ProjectMemberRole = exports.ProjectMemberRole || (exports.ProjectMemberRole = {}));
var ProjectMemberStatus;
(function (ProjectMemberStatus) {
    ProjectMemberStatus["ACTIVE"] = "active";
    ProjectMemberStatus["INACTIVE"] = "inactive";
    ProjectMemberStatus["INVITED"] = "invited";
})(ProjectMemberStatus = exports.ProjectMemberStatus || (exports.ProjectMemberStatus = {}));
var WorkDay;
(function (WorkDay) {
    WorkDay["MON"] = "Mon";
    WorkDay["TUE"] = "Tue";
    WorkDay["WED"] = "Wed";
    WorkDay["THU"] = "Thu";
    WorkDay["FRI"] = "Fri";
    WorkDay["SAT"] = "Sat";
    WorkDay["SUN"] = "Sun";
})(WorkDay = exports.WorkDay || (exports.WorkDay = {}));
//# sourceMappingURL=project.interfaces.js.map