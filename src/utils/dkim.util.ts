import { generateKeyPairSync } from 'crypto';

/**
 * DKIM Key Generation Utility
 * Generates unique RSA key pairs for each domain to ensure proper DKIM isolation
 */

export interface DkimKeyPair {
  publicKey: string;
  privateKey: string;
  selector: string;
}

/**
 * Generate a unique DKIM key pair
 * @param keySize - RSA key size (default: 2048 bits)
 * @returns DkimKeyPair with public key, private key, and selector
 */
export function generateDkimKeyPair(keySize: number = 2048): DkimKeyPair {
  // Generate RSA key pair
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: keySize,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // Create unique selector (without _domainkey suffix - that's added when building the DNS record)
  const selector = `byteinbox`;

  return {
    publicKey: publicKey.replace(/-----BEGIN PUBLIC KEY-----\n?/, '').replace(/\n?-----END PUBLIC KEY-----/, '').replace(/\n/g, ''),
    privateKey: privateKey.replace(/-----BEGIN PRIVATE KEY-----\n?/, '').replace(/\n?-----END PRIVATE KEY-----/, '').replace(/\n/g, ''),
    selector
  };
}


/**
 * Validate DKIM key pair
 * @param publicKey - Base64 encoded public key
 * @param privateKey - Base64 encoded private key
 * @returns boolean indicating if the key pair is valid
 */
export function validateDkimKeyPair(publicKey: string, privateKey: string): boolean {
  try {
    // Basic validation - check if keys are properly formatted
    const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
    const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    
    // Try to create key objects to validate format
    const crypto = require('crypto');
    crypto.createPublicKey(publicKeyPem);
    crypto.createPrivateKey(privateKeyPem);
    
    return true;
  } catch (error) {
    return false;
  }
}
