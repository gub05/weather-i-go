// api/googleEarthEngine.js

import ee from '@google/earthengine';

const GEE_PRIVATE_KEY = process.env.EXPO_PUBLIC_GEE_PRIVATE_KEY;
const GEE_CLIENT_EMAIL = process.env.EXPO_PUBLIC_GEE_CLIENT_EMAIL;

export const initializeGEE = async () => {
  try {
    console.log("Attempting to authenticate GEE...");
    
    await ee.data.authenticateViaPrivateKey({
      client_email: GEE_CLIENT_EMAIL,
      private_key: GEE_PRIVATE_KEY,
    });

    console.log('GEE Authentication successful.');

    console.log("Attempting to initialize GEE...");
    await ee.initialize(null, null);

    console.log('GEE Initialized.');

  } catch (err) {
    console.error('ERROR during GEE setup:', err);
    throw err;
  }
};