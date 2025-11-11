import * as crypto from 'crypto';
import axios from 'axios';

/**
 * Generate a signing secret with whsec_ prefix
 */
export function generateSigningSecret(): string {
  const randomBytes = crypto.randomBytes(32).toString('base64');
  return `whsec_${randomBytes}`;
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 * @param payload - JSON payload to sign
 * @param secret - Webhook signing secret
 * @returns HMAC signature in format: sha256=<hash>
 */
export function generateWebhookSignature(payload: any, secret: string): string {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadString);
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Build standardized webhook payload
 * @param eventType - Type of event (e.g., 'email.delivered')
 * @param data - Event-specific data
 * @param eventId - Optional event ID (generated if not provided)
 * @returns Standardized webhook payload
 */
export function buildWebhookPayload(eventType: string, data: any, eventId?: string): any {
  const id = eventId || `evt_${crypto.randomBytes(16).toString('hex')}`;
  const created = Math.floor(Date.now() / 1000);

  return {
    id,
    type: eventType,
    created,
    data,
  };
}

/**
 * Publish webhook event to a URL
 * @param url - Webhook endpoint URL
 * @param payload - Webhook payload
 * @param secret - Signing secret
 * @param deliveryId - Unique delivery ID
 * @param timeout - Request timeout in milliseconds (default: 10s)
 * @returns Response data and status
 */
export async function publishWebhookEvent(
  url: string,
  payload: any,
  secret: string,
  deliveryId: string,
  timeout: number = 10000,
): Promise<{ success: boolean; status?: number; data?: any; error?: string }> {
  try {
    const payloadString = JSON.stringify(payload);
    const signature = generateWebhookSignature(payloadString, secret);
    const timestamp = Math.floor(Date.now() / 1000);

    const response = await axios.post(url, payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ByteInbox-Webhooks/1.0',
        'X-ByteInbox-Signature': signature,
        'X-ByteInbox-Event': payload.type,
        'X-ByteInbox-Delivery-ID': deliveryId,
        'X-ByteInbox-Timestamp': timestamp.toString(),
      },
      timeout,
      validateStatus: (status) => status >= 200 && status < 300,
    });

    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        status: error.response?.status,
        data: error.response?.data,
        error: error.message,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
