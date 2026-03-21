"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationMemberStatus = exports.OrganizationMemberRole = exports.OnboardingStep = void 0;
var OnboardingStep;
(function (OnboardingStep) {
    OnboardingStep["OWNER_INVITED"] = "OWNER_INVITED";
    OnboardingStep["OWNER_VERIFIED"] = "OWNER_VERIFIED";
    OnboardingStep["PROJECT_CREATED"] = "PROJECT_CREATED";
    OnboardingStep["STAFF_INVITED"] = "STAFF_INVITED";
    OnboardingStep["DESKTOP_CONNECTED"] = "DESKTOP_CONNECTED";
})(OnboardingStep = exports.OnboardingStep || (exports.OnboardingStep = {}));
var OrganizationMemberRole;
(function (OrganizationMemberRole) {
    OrganizationMemberRole["OWNER"] = "owner";
    OrganizationMemberRole["MANAGER"] = "manager";
    OrganizationMemberRole["MEMBER"] = "member";
})(OrganizationMemberRole = exports.OrganizationMemberRole || (exports.OrganizationMemberRole = {}));
var OrganizationMemberStatus;
(function (OrganizationMemberStatus) {
    OrganizationMemberStatus["INVITED"] = "invited";
    OrganizationMemberStatus["ACTIVE"] = "active";
})(OrganizationMemberStatus = exports.OrganizationMemberStatus || (exports.OrganizationMemberStatus = {}));
//# sourceMappingURL=organization.interfaces.js.map