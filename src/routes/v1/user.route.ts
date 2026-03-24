import express from 'express';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, authorize } from '../../modules/auth';
import * as userValidation from '../../modules/users/user.validation';
import * as userController from '../../modules/users/user.controller';

const router = express.Router();

router
  .route('/')
  .post(
    authenticate,
    authorize('users.write'),
    validate(userValidation.createInternalUser),
    userController.createInternalUser
  )
  .get(
    authenticate,
    authorize('users.read'),
    validate(userValidation.getUsers),
    userController.getUsers
  );

router
  .route('/:userId')
  .get(
    authenticate,
    authorize('users.read'),
    validate(userValidation.getUserById),
    userController.getUserById
  )
  .patch(
    authenticate,
    authorize('users.write'),
    validate(userValidation.updateUserById),
    userController.updateUserById
  )
  .delete(
    authenticate,
    authorize('users.write'),
    validate(userValidation.deleteUserById),
    userController.deleteUserById
  );

router
  .route('/:userId/deactivate')
  .post(
    authenticate,
    authorize('users.write'),
    validate(userValidation.deactivateUserById),
    userController.deactivateUserById
  );

export default router;
