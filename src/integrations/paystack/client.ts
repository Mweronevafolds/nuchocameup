import axios, { AxiosInstance } from 'axios';

export interface PaystackInitializeResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

export interface PaystackVerifyResponse {
    status: boolean;
    message: string;
    data: {
        id: number;
        reference: string;
        amount: number;
        paid_at: string;
        created_at: string;
        channel: string;
        currency: string;
        status: string;
        customer: {
            id: number;
            email: string;
            first_name: string;
            last_name: string;
            phone: string;
        };
        [key: string]: any;
    };
}

export class PaystackClient {
    private apiClient: AxiosInstance;
    private publicKey: string;
    private secretKey: string;
    private baseURL: string = 'https://api.paystack.co';

    constructor(secretKey: string, publicKey: string) {
        this.secretKey = secretKey;
        this.publicKey = publicKey;

        this.apiClient = axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Initialize a Paystack transaction
     */
    async initializeTransaction(
        email: string,
        amount: number,
        reference: string,
        metadata?: Record<string, any>
    ): Promise<PaystackInitializeResponse> {
        try {
            const response = await this.apiClient.post('/transaction/initialize', {
                email,
                amount: Math.round(amount * 100), // Convert to cents
                reference,
                metadata: {
                    ...metadata,
                    custom_fields: [
                        {
                            display_name: 'Order Reference',
                            variable_name: 'order_ref',
                            value: reference,
                        },
                    ],
                },
            });

            return response.data;
        } catch (error) {
            console.error('Paystack initialization error:', error);
            throw new Error('Failed to initialize Paystack transaction');
        }
    }

    /**
     * Verify a Paystack transaction
     */
    async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
        try {
            const response = await this.apiClient.get(`/transaction/verify/${reference}`);
            return response.data;
        } catch (error) {
            console.error('Paystack verification error:', error);
            throw new Error('Failed to verify Paystack transaction');
        }
    }

    /**
     * Get transaction details
     */
    async getTransaction(transactionId: number): Promise<PaystackVerifyResponse> {
        try {
            const response = await this.apiClient.get(`/transaction/${transactionId}`);
            return response.data;
        } catch (error) {
            console.error('Paystack get transaction error:', error);
            throw new Error('Failed to get transaction details');
        }
    }

    /**
     * Get the public key for frontend initialization
     */
    getPublicKey(): string {
        return this.publicKey;
    }
}

// Initialize and export Paystack client
let paystackClient: PaystackClient | null = null;

export function getPaystackClient(): PaystackClient {
    if (!paystackClient) {
        const secretKey = import.meta.env.VITE_PAYSTACK_SECRET_KEY;
        const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

        if (!secretKey || !publicKey) {
            throw new Error('Paystack keys not configured. Please set VITE_PAYSTACK_SECRET_KEY and VITE_PAYSTACK_PUBLIC_KEY');
        }

        paystackClient = new PaystackClient(secretKey, publicKey);
    }

    return paystackClient;
}

export function getPaystackPublicKey(): string {
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
        throw new Error('Paystack public key not configured');
    }
    return publicKey;
}
