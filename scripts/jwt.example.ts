import { jwtVerify, SignJWT, importPKCS8, importSPKI } from 'jose';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const publicPem = readFileSync(join(__dirname, 'public.pem'));
const privatePem = readFileSync(join(__dirname, 'private.pem'));

const runExample = async () => {
  const keySignature = await importPKCS8(privatePem.toString(), 'RS256');
  const publicKeySignature = await importSPKI(publicPem.toString(), 'RS256');

  const token = await new SignJWT({ foo: 'bar' })
    .setProtectedHeader({
      alg: 'RS256',
    })
    .setSubject('1234567890')
    .sign(keySignature);

  const decoded = await jwtVerify(token, publicKeySignature, {
    algorithms: ['RS256'],
  });

  console.log(decoded);
};

runExample();
