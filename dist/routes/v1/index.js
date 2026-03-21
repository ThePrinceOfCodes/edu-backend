"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_route_1 = __importDefault(require("./auth.route"));
const schoolBoard_route_1 = __importDefault(require("./schoolBoard.route"));
const school_route_1 = __importDefault(require("./school.route"));
const staff_route_1 = __importDefault(require("./staff.route"));
const router = express_1.default.Router();
const generalRoutes = [
    {
        path: '/auth',
        route: auth_route_1.default,
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