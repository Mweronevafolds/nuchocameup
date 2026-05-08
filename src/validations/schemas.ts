import { z } from 'zod';

/**
 * Shipping address validation schema
 */
export const shippingAddressSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phoneNumber: z
        .string()
        .regex(
            /^(?:\+254|0|254)[17]\d{8}$/,
            'Invalid Kenyan phone number. Use format: 254712345678, 0712345678, or +254712345678'
        ),
    street: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    postalCode: z.string().min(3, 'Postal code is required'),
    country: z.string().default('Kenya'),
    deliveryMethod: z.enum(['doorstep', 'pickup']).default('doorstep'),
    pickupPointId: z.string().optional(),
});

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

/**
 * Payment validation schema
 */
export const paymentSchema = z.object({
    phoneNumber: z
        .string()
        .regex(
            /^(?:\+254|0|254)[17]\d{8}$/,
            'Invalid Kenyan phone number'
        ),
    amount: z.number().positive('Amount must be greater than 0'),
    currency: z.string().default('KES'),
});

export type PaymentDetails = z.infer<typeof paymentSchema>;

/**
 * Order schema
 */
export const orderSchema = z.object({
    phoneNumber: z.string(),
    email: z.string().email(),
    shippingAddress: z.object({
        street: z.string(),
        city: z.string(),
        postalCode: z.string(),
        country: z.string(),
    }),
    totalAmount: z.number().positive(),
    currency: z.string(),
    paymentMethod: z.string().default('MPESA'),
    deliveryMethod: z.string().default('doorstep'),
    pickupPointId: z.string().optional(),
    notes: z.string().optional(),
});

export type Order = z.infer<typeof orderSchema>;

/**
 * Product search validation
 */
export const searchParamsSchema = z.object({
    q: z.string().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    sizes: z.string().array().optional(),
    inStock: z.boolean().optional().default(true),
    sort: z.enum(['price-asc', 'price-desc', 'newest', 'bestselling']).optional(),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;
