import { promises as dns } from 'dns';

/**
 * DNS Verification Utility
 * Verifies DNS records using native Node.js DNS resolution
 */

export interface DnsVerificationResult {
  verified: boolean;
  recordFound: boolean;
  expectedValue: string;
  actualValue?: string;
  error?: string;
}

/**
 * Verify a TXT DNS record
 * @param hostname - Full DNS record name (e.g., "selector._domainkey.example.com")
 * @param expectedValue - Expected TXT record value
 * @returns Verification result
 */
export async function verifyTxtRecord(
  hostname: string,
  expectedValue: string
): Promise<DnsVerificationResult> {
  try {
    const records = await dns.resolveTxt(hostname);

    // TXT records are returned as arrays of strings (for chunked records)
    // Join them into a single continuous string with no spaces
    for (const record of records) {
      // DNS returns chunked records as array of strings - join without separator
      const actualValue = record.join('');

      // Normalize both values for comparison (remove all whitespace, quotes, backslashes)
      const normalizedActual = normalizeValue(actualValue);
      const normalizedExpected = normalizeValue(expectedValue);
      console.log('normalizedActual', normalizedActual);
      console.log('normalizedExpected', normalizedExpected);

      if (normalizedActual === normalizedExpected) {
        return {
          verified: true,
          recordFound: true,
          expectedValue,
          actualValue,
        };
      }
    }

    // Record found but value doesn't match
    return {
      verified: false,
      recordFound: true,
      expectedValue,
      actualValue: records.length > 0 ? records[0].join('') : undefined,
      error: 'TXT record value does not match expected value',
    };
  } catch (error) {
    // DNS record not found or other error
    return {
      verified: false,
      recordFound: false,
      expectedValue,
      error: error.code === 'ENOTFOUND' || error.code === 'ENODATA'
        ? 'DNS record not found'
        : error.message,
    };
  }
}

/**
 * Verify an MX DNS record
 * @param hostname - Domain name to check MX records
 * @param expectedValue - Expected MX server hostname
 * @param expectedPriority - Expected MX priority (optional)
 * @returns Verification result
 */
export async function verifyMxRecord(
  hostname: string,
  expectedValue: string,
  expectedPriority?: number
): Promise<DnsVerificationResult> {
  try {
    const records = await dns.resolveMx(hostname);

    // Check if any MX record matches
    for (const record of records) {
      const normalizedExchange = record.exchange.toLowerCase().replace(/\.$/, '');
      const normalizedExpected = expectedValue.toLowerCase().replace(/\.$/, '');

      if (normalizedExchange === normalizedExpected) {
        // If priority is specified, check it too
        if (expectedPriority !== undefined && record.priority !== expectedPriority) {
          continue;
        }

        return {
          verified: true,
          recordFound: true,
          expectedValue: `${expectedPriority || record.priority} ${expectedValue}`,
          actualValue: `${record.priority} ${record.exchange}`,
        };
      }
    }

    // Record found but value doesn't match
    return {
      verified: false,
      recordFound: true,
      expectedValue: `${expectedPriority || 10} ${expectedValue}`,
      actualValue: records.length > 0
        ? `${records[0].priority} ${records[0].exchange}`
        : undefined,
      error: 'MX record value does not match expected value',
    };
  } catch (error) {
    return {
      verified: false,
      recordFound: false,
      expectedValue: `${expectedPriority || 10} ${expectedValue}`,
      error: error.code === 'ENOTFOUND' || error.code === 'ENODATA'
        ? 'DNS record not found'
        : error.message,
    };
  }
}

/**
 * Verify a CNAME DNS record
 * @param hostname - Hostname to check CNAME
 * @param expectedValue - Expected CNAME target
 * @returns Verification result
 */
export async function verifyCnameRecord(
  hostname: string,
  expectedValue: string
): Promise<DnsVerificationResult> {
  try {
    const records = await dns.resolveCname(hostname);

    // Normalize and compare
    const normalizedExpected = expectedValue.toLowerCase().replace(/\.$/, '');

    for (const record of records) {
      const normalizedActual = record.toLowerCase().replace(/\.$/, '');

      if (normalizedActual === normalizedExpected) {
        return {
          verified: true,
          recordFound: true,
          expectedValue,
          actualValue: record,
        };
      }
    }

    return {
      verified: false,
      recordFound: true,
      expectedValue,
      actualValue: records.length > 0 ? records[0] : undefined,
      error: 'CNAME record value does not match expected value',
    };
  } catch (error) {
    return {
      verified: false,
      recordFound: false,
      expectedValue,
      error: error.code === 'ENOTFOUND' || error.code === 'ENODATA'
        ? 'DNS record not found'
        : error.message,
    };
  }
}

/**
 * Normalize DNS record value for comparison
 * Removes all whitespace, quotes, and escape characters to get continuous string
 */
function normalizeValue(value: string): string {
  return value
    .replace(/\\/g, '') // Remove all backslashes (escape characters from DNS)
    .replace(/["']/g, '') // Remove all quotes (from chunked TXT records)
    .replace(/\s/g, ''); // Remove ALL whitespace (spaces, tabs, newlines)
}

/**
 * Verify DNS record based on type
 * @param recordType - Type of DNS record (TXT, MX, CNAME)
 * @param hostname - Hostname to verify
 * @param expectedValue - Expected value
 * @param priority - Priority for MX records
 * @returns Verification result
 */
export async function verifyDnsRecord(
  recordType: string,
  hostname: string,
  expectedValue: string,
  priority?: number
): Promise<DnsVerificationResult> {
  switch (recordType.toUpperCase()) {
    case 'TXT':
      return verifyTxtRecord(hostname, expectedValue);
    case 'MX':
      return verifyMxRecord(hostname, expectedValue, priority);
    case 'CNAME':
      return verifyCnameRecord(hostname, expectedValue);
    default:
      return {
        verified: false,
        recordFound: false,
        expectedValue,
        error: `Unsupported record type: ${recordType}`,
      };
  }
}
