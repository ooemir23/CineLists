import { Prisma } from '@prisma/client';

export type ApiResponse<T = void> =
    | { success: true; data: T }
    | { success: false; error: string; details?: unknown };

export function handleError(error: unknown, context: string): ApiResponse {
    console.error(`[${context}] Error:`, error);

    // Prisma specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                return { success: false, error: 'Bu kayıt zaten mevcut' };
            case 'P2025':
                return { success: false, error: 'Kayıt bulunamadı' };
            default:
                return { success: false, error: 'Veritabanı hatası oluştu' };
        }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
        return { success: false, error: 'Geçersiz veri formatı' };
    }

    // Network/API errors
    if (error instanceof Error) {
        if (error.message.includes('fetch')) {
            return { success: false, error: 'Ağ bağlantısı hatası' };
        }
        if (error.message.includes('TMDB')) {
            return { success: false, error: 'Film veritabanı servisi geçici olarak kullanılamıyor' };
        }
    }

    // Generic error
    return {
        success: false,
        error: 'Beklenmeyen bir hata oluştu',
        details: process.env.NODE_ENV === 'development' ? error : undefined
    };
}

export function createApiResponse<T>(data: T): ApiResponse<T> {
    return { success: true, data };
}