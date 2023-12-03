import { SignJWT, jwtVerify } from 'jose';
import { envVariables } from './env';

type Payload = any;

const secret = new TextEncoder().encode(envVariables.JWT_SECRET);

export const generateToken = (payload: Payload) => {
  return new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).sign(secret);
};

export const verifyToken = (token: string) => {
  return jwtVerify(token, secret, {
    algorithms: ['HS256'],
  });
};
