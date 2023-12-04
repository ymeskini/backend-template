import { jwtVerify, SignJWT, importPKCS8, importSPKI } from 'jose';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const runExample = async () => {
  const keySignature = await importPKCS8(
    readFileSync(join(__dirname, 'private.pem')).toString(),
    'RS256',
  );
  const publicKeySignature = await importSPKI(
    readFileSync(join(__dirname, 'public.pem')).toString(),
    'RS256',
  );

  const token = await new SignJWT()
    .setProtectedHeader({
      alg: 'RS256',
    })
    .setExpirationTime('15m')
    .setSubject('1234567890')
    .sign(keySignature);

  const decoded = await jwtVerify(token, publicKeySignature, {
    algorithms: ['RS256'],
  });
  console.log(decoded);
};

runExample();
