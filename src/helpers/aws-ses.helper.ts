import {
  SESv2Client,
  CreateEmailIdentityCommand,
  PutEmailIdentityMailFromAttributesCommand,
  GetEmailIdentityCommand,
  DeleteEmailIdentityCommand,
} from '@aws-sdk/client-sesv2';
import { fromEnv } from '@aws-sdk/credential-provider-env';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * AWS SES Helper for managing email domains with BYODKIM
 */

interface DkimKeys {
  publicKey: string;
  privateKey: string;
  publicKeyBase64: string;
  privateKeyBase64: string;
}

interface DnsRecord {
  type: string;
  name: string;
  recordType: string;
  value: string;
  priority?: number;
}

/**
 * Generate RSA key pair for DKIM
 */
export async function generateDkimKeyPair(): Promise<DkimKeys> {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      'rsa',
      {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      },
      (err, publicKey, privateKey) => {
        if (err) {
          reject(err);
          return;
        }

        // Convert to base64 (remove headers and newlines)
        const publicKeyBase64 = publicKey
          .replace(/-----BEGIN PUBLIC KEY-----/, '')
          .replace(/-----END PUBLIC KEY-----/, '')
          .replace(/\r?\n|\r/g, '');

        const privateKeyBase64 = privateKey
          .replace(/-----BEGIN PRIVATE KEY-----/, '')
          .replace(/-----END PRIVATE KEY-----/, '')
          .replace(/\r?\n|\r/g, '');

        resolve({
          publicKey,
          privateKey,
          publicKeyBase64,
          privateKeyBase64,
        });
      }
    );
  });
}

/**
 * Load and base64-encode a private key from file
 */
export function loadBase64PrivateKey(privateKeyPath: string): string {
  const privateKeyPem = fs.readFileSync(privateKeyPath, 'utf8');
  const privateKeyBase64 = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\r?\n|\r/g, '');
  return privateKeyBase64;
}

/**
 * Load and base64-encode a public key from file
 */
export function loadBase64PublicKey(publicKeyPath: string): string {
  const publicKeyPem = fs.readFileSync(publicKeyPath, 'utf8');
  const publicKeyBase64 = publicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\r?\n|\r/g, '');
  return publicKeyBase64;
}

/**
 * Create SES v2 client
 */
export function createSESClient(region: string = 'us-east-1'): SESv2Client {
  const credentials = fromEnv();
  return new SESv2Client({ region, credentials });
}

/**
 * Register domain with AWS SES using BYODKIM
 */
export async function registerDomainWithSES(
  domain: string,
  selector: string,
  privateKeyBase64: string,
  region: string = 'us-east-1'
): Promise<void> {
  const sesClient = createSESClient(region);

  // Create the Email Identity with BYODKIM
  await sesClient.send(
    new CreateEmailIdentityCommand({
      EmailIdentity: domain,
      DkimSigningAttributes: {
        DomainSigningSelector: selector,
        DomainSigningPrivateKey: privateKeyBase64,
      },
    })
  );

  // Set up the Custom MAIL FROM domain
  const mailFromDomain = `send.${domain}`;
  await sesClient.send(
    new PutEmailIdentityMailFromAttributesCommand({
      EmailIdentity: domain,
      MailFromDomain: mailFromDomain,
      BehaviorOnMxFailure: 'USE_DEFAULT_VALUE',
    })
  );
}

/**
 * Generate DNS records for domain verification
 */
export function generateDnsRecords(
  domain: string,
  selector: string,
  publicKeyBase64: string,
  region: string = 'us-east-1'
): DnsRecord[] {
  const mailFromDomain = `send.${domain}`;
  const sesRegionEndpoint = `feedback-smtp.${region}.amazonses.com`;

  return [
    {
      type: 'dkim',
      name: `${selector}._domainkey.${domain}`,
      recordType: 'TXT',
      value: `v=DKIM1; k=rsa; p=${publicKeyBase64}`,
    },
    {
      type: 'spf',
      name: mailFromDomain,
      recordType: 'TXT',
      value: 'v=spf1 include:amazonses.com ~all',
    },
    {
      type: 'mx',
      name: mailFromDomain,
      recordType: 'MX',
      value: sesRegionEndpoint,
      priority: 10,
    },
    {
      type: 'dmarc',
      name: `_dmarc.${domain}`,
      recordType: 'TXT',
      value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`,
    },
  ];
}

/**
 * Get domain verification status from AWS SES
 */
export async function getDomainVerificationStatus(
  domain: string,
  region: string = 'us-east-1'
): Promise<any> {
  const sesClient = createSESClient(region);

  try {
    const response = await sesClient.send(
      new GetEmailIdentityCommand({
        EmailIdentity: domain,
      })
    );

    return {
      verified: response.VerifiedForSendingStatus || false,
      dkimStatus: response.DkimAttributes?.Status || 'PENDING',
      mailFromDomain: response.MailFromAttributes?.MailFromDomain,
      mailFromStatus: response.MailFromAttributes?.MailFromDomainStatus || 'PENDING',
    };
  } catch (error) {
    throw new Error(`Failed to get domain verification status: ${error.message}`);
  }
}

/**
 * Delete domain from AWS SES
 */
export async function deleteDomainFromSES(
  domain: string,
  region: string = 'us-east-1'
): Promise<void> {
  const sesClient = createSESClient(region);

  await sesClient.send(
    new DeleteEmailIdentityCommand({
      EmailIdentity: domain,
    })
  );
}

/**
 * Generate a unique DKIM selector
 */
export function generateDkimSelector(domain: string): string {
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(4).toString('hex');
  return `byteinbox-${timestamp}-${randomStr}`;
}

/**
 * Save DKIM keys to storage (file system or database)
 * In production, you should encrypt these keys before storing
 */
export function saveDkimKeys(
  domain: string,
  keys: DkimKeys,
  storagePath: string = './dkim-keys'
): { publicKeyPath: string; privateKeyPath: string } {
  // Create storage directory if it doesn't exist
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }

  const sanitizedDomain = domain.replace(/[^a-zA-Z0-9]/g, '_');
  const publicKeyPath = path.join(storagePath, `${sanitizedDomain}_public.pem`);
  const privateKeyPath = path.join(storagePath, `${sanitizedDomain}_private.pem`);

  fs.writeFileSync(publicKeyPath, keys.publicKey);
  fs.writeFileSync(privateKeyPath, keys.privateKey);

  return { publicKeyPath, privateKeyPath };
}

/**
 * Validate domain name format
 */
export function isValidDomainName(domain: string): boolean {
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  return domainRegex.test(domain);
}
