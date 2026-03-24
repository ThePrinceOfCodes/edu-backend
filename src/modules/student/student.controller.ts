import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as studentService from './student.service';

const getStudentIdFromParams = (req: Request) => req.params['studentId'] as string;

export const createStudent = catchAsync(async (req: Request, res: Response) => {
  const student = await studentService.createStudent(req.body, req.account);
  res.status(httpStatus.CREATED).send(student);
});

export const createStudentsBulk = catchAsync(async (req: Request, res: Response) => {
  const result = await studentService.createStudentsBulk(req.body.students, req.account);
  res.status(httpStatus.CREATED).send(result);
});

export const getStudents = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, [
    'firstName',
    'lastName',
    'regNumber',
    'stateOfOrigin',
    'localGovernment',
    'gender',
    'school',
    'classId',
    'status',
  ]);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await studentService.queryStudents(filter, options, req.account);
  res.send(result);
});

export const getStudentById = catchAsync(async (req: Request, res: Response) => {
  const student = await studentService.getStudentById(getStudentIdFromParams(req), req.account);
  res.send(student);
});

export const updateStudent = catchAsync(async (req: Request, res: Response) => {
  const student = await studentService.updateStudentById(getStudentIdFromParams(req), req.body, req.account);
  res.send(student);
});

export const promoteStudent = catchAsync(async (req: Request, res: Response) => {
  const student = await studentService.promoteStudentById(getStudentIdFromParams(req), req.body, req.account);
  res.send(student);
});

export const deleteStudent = catchAsync(async (req: Request, res: Response) => {
  await studentService.deleteStudentById(getStudentIdFromParams(req), req.account);
  res.status(httpStatus.NO_CONTENT).send();
});
