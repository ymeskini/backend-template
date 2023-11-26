import { verify, sign, SignOptions } from 'jsonwebtoken';
import { envVariables } from './env';

type Payload = { userId: string; scopes: string[] } | string;

export const generateToken = (payload: Payload, options?: SignOptions) => {
  return sign(payload, envVariables.JWT_SECRET, options);
};

export const verifyToken = (token: string) => {
  return verify(token, envVariables.JWT_SECRET);
};
