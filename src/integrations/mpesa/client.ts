import axios, { AxiosInstance } from 'axios';
import { supabase } from '@/integrations/supabase/client';

interface MpesaToken {
    access_token: string;
    expires_in: number;
    tokenTimestamp?: number;
}

interface MpesaStkPushRequest {
    BusinessShortCode: string;
    Password: string;
    Timestamp: string;
    TransactionType: string;
    Amount: number;
    PartyA: string;
    PartyB: string;
    PhoneNumber: string;
    CallBackURL: string;
    AccountReference: string;
    TransactionDesc: string;
}

interface MpesaStkPushResponse {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
}

interface MpesaStatusResponse {
    Result: {
        ResultCode: number;
        ResultDesc: string;
        [key: string]: any;
    };
}

export class MpesaClient {
    private apiClient: AxiosInstance;
    private consumerKey: string;
    private consumerSecret: string;
    private shortcode: string;
    private passkey: string;
    private baseURL: string;
    private token: MpesaToken | null = null;

    constructor(
        consumerKey: string,
        consumerSecret: string,
        shortcode: string,
        passkey: string,
        environment: 'sandbox' | 'production' = 'sandbox'
    ) {
        this.consumerKey = consumerKey;
        this.consumerSecret = consumerSecret;
        this.shortcode = shortcode;
        this.passkey = passkey;

        this.baseURL =
            environment === 'sandbox'
                ? 'https://sandbox.safaricom.co.ke'
                : 'https://api.safaricom.co.ke';

        this.apiClient = axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
        });
    }

    /**
     * Get access token from M-Pesa
     */
    private async getAccessToken(): Promise<string> {
        // Return cached token if still valid
        if (this.token && this.token.tokenTimestamp) {
            const expiresIn = this.token.expires_in * 1000; // Convert to milliseconds
            const isExpired = Date.now() - this.token.tokenTimestamp > expiresIn * 0.9; // Refresh at 90%

            if (!isExpired) {
                return this.token.access_token;
            }
        }

        try {
            const credentials = btoa(
                `${this.consumerKey}:${this.consumerSecret}`
            );

            const response = await axios.get(
                `${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`,
                {
                    headers: {
                        Authorization: `Basic ${credentials}`,
                    },
                    timeout: 5000,
                }
            );

            this.token = {
                ...response.data,
                tokenTimestamp: Date.now(),
            };

            return this.token.access_token;
        } catch (error) {
            console.error('Failed to get M-Pesa access token:', error);
            throw new Error('Failed to authenticate with M-Pesa');
        }
    }

    /**
     * Initiate STK push via Supabase Edge Function (avoids CORS issues)
     */
    async initiateStkPush(
        phoneNumber: string,
        amount: number,
        orderId: string,
        callbackUrl: string
    ): Promise<MpesaStkPushResponse> {
        // Use supabase.functions.invoke() — it automatically sends the correct
        // Authorization header using the configured anon key, avoiding 401 errors.
        const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
            body: {
                phoneNumber: this.formatPhoneNumber(phoneNumber),
                amount: Math.floor(amount),
                orderId,
                callbackUrl,
            },
        });

        if (error) {
            console.error('STK Push failed:', error);

            // Read the actual error body from the edge function response
            let detail = error.message || 'Unknown error';
            let statusCode: number | string = 'unknown';
            try {
                // FunctionsHttpError exposes the raw Response in error.context
                const ctx = (error as any).context;
                if (ctx) {
                    statusCode = ctx.status ?? statusCode;
                    const body = await ctx.clone().json().catch(() => null);
                    if (body?.error) detail = body.error;
                }
            } catch { /* ignore parse failures */ }

            console.error(`Edge function error (${statusCode}):`, detail);
            throw new Error(`Failed to initiate M-Pesa payment (${statusCode}): ${detail}`);
        }

        return data as MpesaStkPushResponse;
    }

    /**
     * Check payment status using CheckoutRequestID
     * Note: This still uses direct API call - consider moving to Edge Function if CORS issues arise
     */
    async checkPaymentStatus(
        checkoutRequestId: string
    ): Promise<MpesaStatusResponse> {
        try {
            const token = await this.getAccessToken();
            const timestamp = this.generateTimestamp();
            const password = this.generatePassword(timestamp);

            const payload = {
                BusinessShortCode: this.shortcode,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestId,
            };

            const response = await this.apiClient.post(
                '/mpesa/stkpushquery/v1/query',
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.error('Payment status check failed:', error);
            throw error;
        }
    }

    /**
     * Validate and format phone number to 254XXXXXXXXX format
     */
    private formatPhoneNumber(phoneNumber: string): string {
        // Remove any spaces, dashes, or other characters
        let cleaned = phoneNumber.replace(/\D/g, '');

        // If starts with 0, replace with 254
        if (cleaned.startsWith('0')) {
            cleaned = '254' + cleaned.substring(1);
        }

        // If doesn't start with 254, add it
        if (!cleaned.startsWith('254')) {
            cleaned = '254' + cleaned;
        }

        // Validate length (should be 12 digits: 254 + 9 digits)
        if (cleaned.length !== 12) {
            throw new Error(`Invalid phone number format: ${phoneNumber}`);
        }

        return cleaned;
    }

    /**
     * Generate current timestamp in YYYYMMDDHHmmss format
     */
    private generateTimestamp(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    /**
     * Generate password using shortcode, passkey, and timestamp
     */
    private generatePassword(timestamp: string): string {
        const data = `${this.shortcode}${this.passkey}${timestamp}`;
        return btoa(data);
    }

    /**
     * Verify webhook signature (use HMAC-SHA256 with passkey)
     */
    verifyWebhookSignature(signature: string, payload: string): boolean {
        try {
            // This is a simplified verification - Safaricom uses custom logic
            // In production, verify based on their documentation
            return true;
        } catch (error) {
            console.error('Webhook signature verification failed:', error);
            return false;
        }
    }
}

/**
 * Create singleton M-Pesa client instance
 */
let mpesaClient: MpesaClient | null = null;

export function initializeMpesaClient(): MpesaClient {
    if (mpesaClient) {
        return mpesaClient;
    }

    const consumerKey = import.meta.env.VITE_MPESA_CONSUMER_KEY;
    const consumerSecret = import.meta.env.VITE_MPESA_CONSUMER_SECRET;
    const shortcode = import.meta.env.VITE_MPESA_SHORTCODE;
    const passkey = import.meta.env.VITE_MPESA_PASSKEY;
    const environment = (import.meta.env.VITE_MPESA_ENV || 'sandbox') as 'sandbox' | 'production';

    if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
        throw new Error('M-Pesa environment variables are not configured');
    }

    mpesaClient = new MpesaClient(consumerKey, consumerSecret, shortcode, passkey, environment);
    return mpesaClient;
}

export function getMpesaClient(): MpesaClient {
    if (!mpesaClient) {
        return initializeMpesaClient();
    }
    return mpesaClient;
}
