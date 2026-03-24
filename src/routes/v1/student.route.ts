import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, authorize } from '../../modules/auth';
import * as studentValidation from '../../modules/student/student.validation';
import * as studentController from '../../modules/student/student.controller';

const router = express.Router();

router
  .route('/')
  .post(
    authenticate,
    authorize('students.write'),
    validate(studentValidation.createStudent),
    studentController.createStudent
  )
  .get(authenticate, authorize('students.read'), validate(studentValidation.getStudents), studentController.getStudents);

router.post(
  '/bulk-import',
  authenticate,
  authorize('students.write'),
  validate(studentValidation.createStudentsBulk),
  studentController.createStudentsBulk
);

router.post(
  '/:studentId/promote',
  authenticate,
  authorize('students.write'),
  validate(studentValidation.promoteStudent),
  studentController.promoteStudent
);

router
  .route('/:studentId')
  .get(
    authenticate,
    authorize('students.read'),
    validate(studentValidation.getStudentById),
    studentController.getStudentById
  )
  .patch(
    authenticate,
    authorize('students.write'),
    validate(studentValidation.updateStudent),
    studentController.updateStudent
  )
  .delete(
    authenticate,
    authorize('students.write'),
    validate(studentValidation.deleteStudent),
    studentController.deleteStudent
  );

export default router;
