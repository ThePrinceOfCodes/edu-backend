import { IUserDoc } from '@modules/users/user.interfaces'


declare global {
  namespace Express {
    interface Request {
      account: IUserDoc & { permissions: string[] },
    }
  }
}

export { }