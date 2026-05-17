import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../utils';
import * as guardianService from './guardian.service';

export const createGuardian = catchAsync(async (req: Request, res: Response) => {
  const result = await guardianService.createGuardian(req.body, req.account);
  res.status(httpStatus.CREATED).send(result);
});

export const getGuardians = catchAsync(async (req: Request, res: Response) => {
  const qParam = req.query['q'] as string | undefined;
  const query = qParam ? { q: qParam } : undefined;
  const result = await guardianService.getGuardians(req.account, query);
  res.send(result);
});

export const linkStudentsToGuardian = catchAsync(async (req: Request, res: Response) => {
  const result = await guardianService.linkStudentsToGuardian(
    {
      guardianId: req.params['guardianId'] as string,
      studentIds: req.body.studentIds,
      relationshipType: req.body.relationshipType || 'parent',
      parentType: req.body.parentType || null,
      isPrimary: req.body.isPrimary || false,
    },
    req.account
  );

  res.send(result);
});

export const unlinkStudentsFromGuardian = catchAsync(async (req: Request, res: Response) => {
  const result = await guardianService.unlinkStudentsFromGuardian(
    {
      guardianId: req.params['guardianId'] as string,
      studentIds: req.body.studentIds,
      relationshipType: 'caretaker',
    },
    req.account
  );

  res.send(result);
});

export const getMyStudentsOverview = catchAsync(async (req: Request, res: Response) => {
  const result = await guardianService.getMyStudentsOverview(req.account);
  res.send(result);
});
