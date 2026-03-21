"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPermissionOverride = exports.Permission = exports.Role = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("../toJSON/index");
const index_2 = require("../paginate/index");
// --- Role Schema ---
const roleSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    permissions: [{
            type: String,
            ref: 'Permission', // logic reference, though we use string IDs
        }]
}, {
    timestamps: true,
});
roleSchema.plugin(index_1.toJSON);
roleSchema.plugin(index_2.paginate);
exports.Role = mongoose_1.default.model('Role', roleSchema);
// --- Permission Schema ---
const permissionSchema = new mongoose_1.default.Schema({
    permission: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    label: {
        type: String,
        required: true,
    },
    group: {
        type: String,
        required: true,
    },
    defaultRoles: [{
            type: String,
        }]
}, {
    timestamps: true,
});
permissionSchema.plugin(index_1.toJSON);
// permissionSchema.plugin(paginate); 
exports.Permission = mongoose_1.default.model('Permission', permissionSchema);
// --- UserPermissionOverride Schema ---
const userPermissionOverrideSchema = new mongoose_1.default.Schema({
    userId: {
        type: String,
        ref: 'User',
        required: true,
    },
    permissionId: {
        type: String,
        required: true, // permission slug
    },
    accessType: {
        type: String,
        enum: ['ALLOW', 'DENY'],
        required: true,
    }
}, {
    timestamps: true,
});
userPermissionOverrideSchema.index({ userId: 1, permissionId: 1 }, { unique: true });
userPermissionOverrideSchema.plugin(index_1.toJSON);
exports.UserPermissionOverride = mongoose_1.default.model('UserPermissionOverride', userPermissionOverrideSchema);
//# sourceMappingURL=rbac.model.js.map