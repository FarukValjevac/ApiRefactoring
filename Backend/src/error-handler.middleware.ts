import { ErrorRequestHandler } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    message: err.message,
  });
};
