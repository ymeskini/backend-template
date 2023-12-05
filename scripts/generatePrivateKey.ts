import { writeFileSync } from 'fs';
import { generateKeyPair, exportPKCS8, exportSPKI } from 'jose';
import { join } from 'path';

const generateKeyPairKeys = async () => {
  const { privateKey, publicKey } = await generateKeyPair('RS256', {
    modulusLength: 4096,
  });

  writeFileSync(join(__dirname, 'private.pem'), await exportPKCS8(privateKey));
  writeFileSync(join(__dirname, 'public.pem'), await exportSPKI(publicKey));
};

generateKeyPairKeys();
