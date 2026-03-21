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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validate_middleware_1 = __importDefault(require("../../modules/validate/validate.middleware"));
const holidayValidation = __importStar(require("../../modules/holidays/holiday.validation"));
const holidayController = __importStar(require("../../modules/holidays/holiday.controller"));
const access_middleware_1 = require("@src/modules/access/access.middleware");
const access_constants_1 = require("@src/modules/access/access.constants");
const router = express_1.default.Router({ mergeParams: true });
router
    .route('/')
    .post((0, access_middleware_1.requirePermission)(access_constants_1.PERMISSIONS.MANAGE_HOLIDAYS), (0, validate_middleware_1.default)(holidayValidation.createHoliday), holidayController.createHoliday)
    .get((0, access_middleware_1.requirePermission)(access_constants_1.PERMISSIONS.VIEW_HOLIDAYS), (0, validate_middleware_1.default)(holidayValidation.getHolidaysByYear), holidayController.getHolidaysByYear);
router
    .route('/bulk')
    .post((0, access_middleware_1.requirePermission)(access_constants_1.PERMISSIONS.MANAGE_HOLIDAYS), (0, validate_middleware_1.default)(holidayValidation.bulkCreateHolidays), holidayController.bulkCreateHolidays);
router
    .route('/:holidayId')
    .patch((0, access_middleware_1.requirePermission)(access_constants_1.PERMISSIONS.MANAGE_HOLIDAYS), (0, validate_middleware_1.default)(holidayValidation.updateHoliday), holidayController.updateHoliday)
    .delete((0, access_middleware_1.requirePermission)(access_constants_1.PERMISSIONS.MANAGE_HOLIDAYS), (0, validate_middleware_1.default)(holidayValidation.deleteHoliday), holidayController.deleteHoliday);
exports.default = router;
//# sourceMappingURL=holiday.route.js.map