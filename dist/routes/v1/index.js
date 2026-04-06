"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_route_1 = __importDefault(require("./auth.route"));
const user_route_1 = __importDefault(require("./user.route"));
const schoolBoard_route_1 = __importDefault(require("./schoolBoard.route"));
const school_route_1 = __importDefault(require("./school.route"));
const staff_route_1 = __importDefault(require("./staff.route"));
const schoolType_route_1 = __importDefault(require("./schoolType.route"));
const class_route_1 = __importDefault(require("./class.route"));
const student_route_1 = __importDefault(require("./student.route"));
const academicSession_route_1 = __importDefault(require("./academicSession.route"));
const term_route_1 = __importDefault(require("./term.route"));
const attendance_route_1 = __importDefault(require("./attendance.route"));
const messaging_route_1 = __importDefault(require("./messaging.route"));
const router = express_1.default.Router();
const generalRoutes = [
    {
        path: '/auth',
        route: auth_route_1.default,
    },
    {
        path: '/users',
        route: user_route_1.default,
    },
    {
        path: '/school-boards',
        route: schoolBoard_route_1.default,
    },
    {
        path: '/schools',
        route: school_route_1.default,
    },
    {
        path: '/staff',
        route: staff_route_1.default,
    },
    {
        path: '/school-types',
        route: schoolType_route_1.default,
    },
    {
        path: '/classes',
        route: class_route_1.default,
    },
    {
        path: '/students',
        route: student_route_1.default,
    },
    {
        path: '/academic-sessions',
        route: academicSession_route_1.default,
    },
    {
        path: '/terms',
        route: term_route_1.default,
    },
    {
        path: '/attendance',
        route: attendance_route_1.default,
    },
    {
        path: '/messages',
        route: messaging_route_1.default,
    },
];
router.get("/", (_, res) => {
    res.send(`You've reached api routes of Trackup`);
});
// Mount General Routes
generalRoutes.forEach((route) => {
    router.use(route.path, route.route);
});
exports.default = router;
//# sourceMappingURL=index.js.map