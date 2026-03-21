"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPermissionOverride = exports.Permission = exports.Role = exports.rbacInterfaces = exports.rbacService = exports.rbacController = void 0;
const rbacController = __importStar(require("./rbac.controller"));
exports.rbacController = rbacController;
const rbacService = __importStar(require("./rbac.service"));
exports.rbacService = rbacService;
const rbacInterfaces = __importStar(require("./rbac.interfaces"));
exports.rbacInterfaces = rbacInterfaces;
const rbac_model_1 = require("./rbac.model");
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return rbac_model_1.Role; } });
Object.defineProperty(exports, "Permission", { enumerable: true, get: function () { return rbac_model_1.Permission; } });
Object.defineProperty(exports, "UserPermissionOverride", { enumerable: true, get: function () { return rbac_model_1.UserPermissionOverride; } });
//# sourceMappingURL=index.js.map