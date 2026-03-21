import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, authorize, requireInternalUser } from '../../modules/auth';
import * as schoolBoardValidation from '../../modules/school-board/schoolBoard.validation';
import * as schoolBoardController from '../../modules/school-board/schoolBoard.controller';

const router = express.Router();

router
  .route('/')
  .post(
    authenticate,
    requireInternalUser,
    authorize('schoolBoards.write'),
    validate(schoolBoardValidation.createSchoolBoard),
    schoolBoardController.createSchoolBoard
  )
  .get(
    authenticate,
    requireInternalUser,
    authorize('schoolBoards.read'),
    validate(schoolBoardValidation.getSchoolBoards),
    schoolBoardController.getSchoolBoards
  );

router
  .route('/:schoolBoardId')
  .get(
    authenticate,
    requireInternalUser,
    authorize('schoolBoards.read'),
    validate(schoolBoardValidation.getSchoolBoard),
    schoolBoardController.getSchoolBoard
  )
  .patch(
    authenticate,
    requireInternalUser,
    authorize('schoolBoards.write'),
    validate(schoolBoardValidation.updateSchoolBoard),
    schoolBoardController.updateSchoolBoard
  )
  .delete(
    authenticate,
    requireInternalUser,
    authorize('schoolBoards.write'),
    validate(schoolBoardValidation.deleteSchoolBoard),
    schoolBoardController.deleteSchoolBoard
  );

export default router;
