import { Request, Response, NextFunction } from 'express';

export const extractUserContext = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  req.role = req.headers['x-user-role'] as string | undefined;
  req.userId = req.headers['x-user-id'] as string | undefined;
  req.email = req.headers['x-user-email'] as string | undefined;
  next();
};
