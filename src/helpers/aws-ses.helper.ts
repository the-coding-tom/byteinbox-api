import {
  SESv2Client,
  CreateEmailIdentityCommand,
  PutEmailIdentityMailFromAttributesCommand,
  GetEmailIdentityCommand,
  DeleteEmailIdentityCommand,
} from '@aws-sdk/client-sesv2';
import { fromEnv } from '@aws-sdk/credential-provider-env';

/**
 * AWS SES Helper for managing email domains with BYODKIM
 */

interface DnsRecord {
  type: string;
  name: string;
  recordType: string;
  value: string;
  priority?: number;
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
      value: 'v=DMARC1; p=none',
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
      identityType: response.IdentityType,
      verifiedForSendingStatus: response.VerifiedForSendingStatus || false,
      verificationStatus: response.VerificationStatus,
      dkimStatus: response.DkimAttributes?.Status || 'PENDING',
      dkimTokens: response.DkimAttributes?.Tokens || [],
      mailFromDomain: response.MailFromAttributes?.MailFromDomain,
      mailFromStatus: response.MailFromAttributes?.MailFromDomainStatus || 'PENDING',
      behaviorOnMxFailure: response.MailFromAttributes?.BehaviorOnMxFailure,
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
 * Validate domain name format
 */
export function isValidDomainName(domain: string): boolean {
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  return domainRegex.test(domain);
}
