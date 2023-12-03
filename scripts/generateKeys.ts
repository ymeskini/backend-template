import { exportJWK, exportPKCS8, generateKeyPair } from 'jose';

const generateKeyPairKeys = async () => {
  const { privateKey } = await generateKeyPair('PS256', {
    modulusLength: 4096,
    extractable: true,
  });

  console.log(await exportJWK(privateKey));
  console.log(await exportPKCS8(privateKey));
};

generateKeyPairKeys();
