import {
  SESv2Client,
  CreateEmailIdentityCommand,
  PutEmailIdentityMailFromAttributesCommand,
  GetEmailIdentityCommand,
  DeleteEmailIdentityCommand,
  SendEmailCommand,
} from '@aws-sdk/client-sesv2';
import { fromEnv } from '@aws-sdk/credential-provider-env';
import * as nodemailer from 'nodemailer';
import psl from 'psl';
import { AwsSesVerificationStatus } from '../common/enums/generic.enum';

/**
 * AWS SES Helper for managing email domains with BYODKIM
 */

interface DnsRecord {
  record: string; // SPF, DKIM, DMARC, MX
  name: string; // send, send.marketing, byteinbox._domainkey, etc.
  type: string; // TXT, MX, CNAME
  value: string;
  ttl: string; // Auto or specific TTL
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

  // Check if domain already exists
  const domainExists = await checkDomainExists(domain, region);
  if (domainExists) {
    console.log(`Domain ${domain} already exists in AWS SES, skipping creation`);
    return;
  }

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
 * Extract subdomain from a domain using psl library
 * Examples:
 * - hobbin.finance -> null (no subdomain)
 * - marketing.hobbin.finance -> "marketing"
 * - sales.marketing.hobbin.finance -> "sales.marketing"
 */
function extractSubdomain(domain: string): string | null {
  const parsed = psl.parse(domain);

  // Check if parsing failed (returns string) or result doesn't have subdomain
  if ('error' in parsed) return null;

  // parsed is ParsedDomain at this point
  return parsed.subdomain;
}

/**
 * Generate DNS records for domain verification with subdomain support
 */
export function generateDnsRecords(
  domain: string,
  selector: string,
  publicKeyBase64: string,
  region: string = 'us-east-1'
): DnsRecord[] {
  const subdomain = extractSubdomain(domain);
  const sesRegionEndpoint = `feedback-smtp.${region}.amazonses.com`;

  // Build record names with subdomain support
  // For main domain (hobbin.finance): "send"
  // For subdomain (marketing.hobbin.finance): "send.marketing"
  const sendPrefix = subdomain ? `send.${subdomain}` : 'send';
  const dkimPrefix = subdomain ? `${selector}._domainkey.${subdomain}` : `${selector}._domainkey`;
  const dmarcPrefix = subdomain ? `_dmarc.${subdomain}` : '_dmarc';

  return [
    {
      record: 'DKIM',
      name: dkimPrefix,
      type: 'TXT',
      value: `p=${publicKeyBase64}`, // Store with p= prefix only, v=DKIM1; k=rsa; added during verification
      ttl: 'Auto',
    },
    {
      record: 'SPF',
      name: sendPrefix,
      type: 'TXT',
      value: 'v=spf1 include:amazonses.com ~all',
      ttl: 'Auto',
    },
    {
      record: 'SPF',
      name: sendPrefix,
      type: 'MX',
      value: sesRegionEndpoint,
      ttl: 'Auto',
      priority: 10,
    },
    {
      record: 'DMARC',
      name: dmarcPrefix,
      type: 'TXT',
      value: 'v=DMARC1; p=none',
      ttl: 'Auto',
    },
  ];
}

/**
 * Check if domain exists in AWS SES
 */
export async function checkDomainExists(
  domain: string,
  region: string = 'us-east-1'
): Promise<boolean> {
  const sesClient = createSESClient(region);

  try {
    await sesClient.send(
      new GetEmailIdentityCommand({
        EmailIdentity: domain,
      })
    );
    return true; // Domain exists
  } catch (error) {
    // If domain doesn't exist, AWS throws NotFoundException
    if (error.name === 'NotFoundException') {
      return false;
    }
    // Re-throw other errors
    throw new Error(`Failed to check domain existence: ${error.message}`);
  }
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
      dkimStatus: response.DkimAttributes?.Status || AwsSesVerificationStatus.pending,
      dkimTokens: response.DkimAttributes?.Tokens || [],
      mailFromDomain: response.MailFromAttributes?.MailFromDomain,
      mailFromStatus: response.MailFromAttributes?.MailFromDomainStatus || AwsSesVerificationStatus.pending,
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
 * Send email via AWS SES with tracking configuration
 */
export interface SendEmailParams {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
  subject: string;
  text?: string;
  html?: string;
  region: string;
  configurationSetName?: string;
  tags?: Record<string, string>;
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export interface SendEmailToSingleRecipientParams {
  from: string;
  actualRecipient: string; // The single recipient who will actually receive the email
  displayTo: string[]; // TO addresses to show in email header
  displayCc?: string[]; // CC addresses to show in email header
  replyTo?: string[];
  subject: string;
  text?: string;
  html?: string;
  region: string;
  configurationSetName?: string;
  tags?: Record<string, string>;
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export interface SendEmailResult {
  messageId: string;
  success: boolean;
}

export async function sendEmailWithSES(params: SendEmailParams): Promise<SendEmailResult> {
  const {
    from,
    to,
    cc,
    bcc,
    replyTo,
    subject,
    text,
    html,
    region,
    configurationSetName,
    tags = {},
    headers = {},
    attachments = [],
  } = params;

  const sesClient = createSESClient(region);

  // Convert tags object to EmailTags array format
  const emailTags = Object.entries(tags).map(([key, value]) => ({
    Name: key,
    Value: String(value),
  }));

  // If attachments or custom headers are present, use Raw format
  const useRawFormat = attachments.length > 0 || Object.keys(headers).length > 0;

  let sendParams: any;

  if (useRawFormat) {
    // Build Raw MIME message using nodemailer
    const mailOptions: any = {
      from,
      to,
      cc,
      bcc,
      replyTo,
      subject,
      text,
      html,
      headers,
      attachments: attachments.map((att) => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
        contentType: att.contentType,
      })),
    };

    // Create a transporter (we won't use it to send, just to build the message)
    const transporter = nodemailer.createTransport({ streamTransport: true });

    // Generate the raw MIME message
    const info = await transporter.sendMail(mailOptions);

    // Read the stream into a buffer
    const chunks: Buffer[] = [];
    for await (const chunk of info.message) {
      chunks.push(chunk);
    }
    const rawMessage = Buffer.concat(chunks).toString();

    sendParams = {
      FromEmailAddress: from,
      Content: {
        Raw: {
          Data: Buffer.from(rawMessage),
        },
      },
    };
  } else {
    // Use Simple format for emails without attachments
    const emailContent: any = {
      Simple: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {},
      },
    };

    if (text) {
      emailContent.Simple.Body.Text = {
        Data: text,
        Charset: 'UTF-8',
      };
    }

    if (html) {
      emailContent.Simple.Body.Html = {
        Data: html,
        Charset: 'UTF-8',
      };
    }

    // If neither text nor html provided, use subject as text
    if (!text && !html) {
      emailContent.Simple.Body.Text = {
        Data: subject,
        Charset: 'UTF-8',
      };
    }

    const destination: any = {
      ToAddresses: to,
    };

    if (cc && cc.length > 0) {
      destination.CcAddresses = cc;
    }

    if (bcc && bcc.length > 0) {
      destination.BccAddresses = bcc;
    }

    sendParams = {
      FromEmailAddress: from,
      Destination: destination,
      Content: emailContent,
    };

    if (replyTo && replyTo.length > 0) {
      sendParams.ReplyToAddresses = replyTo;
    }
  }

  // Add configuration set if provided (for tracking)
  if (configurationSetName) {
    sendParams.ConfigurationSetName = configurationSetName;
  }

  // Add tags if provided
  if (emailTags.length > 0) {
    sendParams.EmailTags = emailTags;
  }

  try {
    const result = await sesClient.send(new SendEmailCommand(sendParams));

    return {
      messageId: result.MessageId || '',
      success: true,
    };
  } catch (error) {
    throw new Error(`Failed to send email via AWS SES: ${error.message}`);
  }
}

/**
 * Send email to single recipient with custom TO/CC headers
 * This creates the illusion of a multi-recipient email while enabling per-recipient tracking
 */
export async function sendEmailToSingleRecipient(
  params: SendEmailToSingleRecipientParams
): Promise<SendEmailResult> {
  const {
    from,
    actualRecipient,
    displayTo,
    displayCc = [],
    replyTo,
    subject,
    text,
    html,
    region,
    configurationSetName,
    tags = {},
    headers = {},
    attachments = [],
  } = params;

  const sesClient = createSESClient(region);

  // Build raw MIME message with custom TO/CC headers
  // Note: We don't set 'to' field because nodemailer would override our custom To header
  // Instead, we only use custom headers and let AWS SES Destination handle actual delivery
  const mailOptions: any = {
    from,
    subject,
    text,
    html,
    replyTo,
    headers: {
      ...headers,
      // Set custom TO/CC headers to show all recipients (creates the illusion)
      To: displayTo.join(', '),
      ...(displayCc.length > 0 && { Cc: displayCc.join(', ') }),
    },
    attachments: attachments.map((att) => ({
      filename: att.filename,
      content: Buffer.from(att.content, 'base64'),
      contentType: att.contentType,
    })),
  };

  // Create a transporter (we won't use it to send, just to build the message)
  const transporter = nodemailer.createTransport({ streamTransport: true });

  // Generate the raw MIME message
  const info = await transporter.sendMail(mailOptions);

  // Read the stream into a buffer
  const chunks: Buffer[] = [];
  for await (const chunk of info.message) {
    chunks.push(chunk);
  }
  const rawMessage = Buffer.concat(chunks);

  // Convert tags object to EmailTags array format
  const emailTags = Object.entries(tags).map(([key, value]) => ({
    Name: key,
    Value: String(value),
  }));

  const sendParams: any = {
    FromEmailAddress: from,
    Destination: {
      ToAddresses: [actualRecipient], // Only send to this one recipient
    },
    Content: {
      Raw: {
        Data: rawMessage,
      },
    },
  };

  // Add configuration set if provided (for tracking)
  if (configurationSetName) {
    sendParams.ConfigurationSetName = configurationSetName;
  }

  // Add tags if provided
  if (emailTags.length > 0) {
    sendParams.EmailTags = emailTags;
  }

  try {
    const result = await sesClient.send(new SendEmailCommand(sendParams));

    return {
      messageId: result.MessageId || '',
      success: true,
    };
  } catch (error) {
    throw new Error(`Failed to send email via AWS SES: ${error.message}`);
  }
}
