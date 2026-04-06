import express, { Request, Response, Router } from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
import schoolBoardRoute from './schoolBoard.route';
import schoolRoute from './school.route';
import staffRoute from './staff.route';
import schoolTypeRoute from './schoolType.route';
import classRoute from './class.route';
import studentRoute from './student.route';
import academicSessionRoute from './academicSession.route';
import termRoute from './term.route';
import attendanceRoute from './attendance.route';
import messagingRoute from './messaging.route';
import eventsRoute from './events.route';

const router = express.Router();

interface IRoute {
  path: string;
  route: Router;
}
const generalRoutes: IRoute[] = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/school-boards',
    route: schoolBoardRoute,
  },
  {
    path: '/schools',
    route: schoolRoute,
  },
  {
    path: '/staff',
    route: staffRoute,
  },
  {
    path: '/school-types',
    route: schoolTypeRoute,
  },
  {
    path: '/classes',
    route: classRoute,
  },
  {
    path: '/students',
    route: studentRoute,
  },
  {
    path: '/academic-sessions',
    route: academicSessionRoute,
  },
  {
    path: '/terms',
    route: termRoute,
  },
  {
    path: '/attendance',
    route: attendanceRoute,
  },
  {
    path: '/messages',
    route: messagingRoute,
  },
  {
    path: '/events',
    route: eventsRoute,
  },
];

router.get("/", (_: Request, res: Response): void => {
  res.send(`You've reached api routes of Trackup`);
});

// Mount General Routes
generalRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
