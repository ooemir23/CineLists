'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

function ActionNotificationContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const actionMsg = searchParams.get('actionMsg');

    useEffect(() => {
        if (actionMsg) {
            let message = '';
            switch (actionMsg) {
                case 'added':
                    message = 'İzleme listenize eklendi! ✨';
                    break;
                case 'watched':
                    message = 'İzlendi olarak işaretlendi! ✅';
                    break;
                case 'watching':
                    message = 'İzleniyor olarak işaretlendi! 📺';
                    break;
                default:
                    message = 'İşlem başarıyla tamamlandı!';
            }
            
            toast.success(message, {
                position: 'top-center',
                duration: 4000,
            });

            // Clean up the URL
            const params = new URLSearchParams(searchParams.toString());
            params.delete('actionMsg');
            const newPath = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
            router.replace(newPath, { scroll: false });
        }
    }, [actionMsg, searchParams, router]);

    return null;
}

export function ActionNotification() {
    return (
        <Suspense fallback={null}>
            <ActionNotificationContent />
        </Suspense>
    );
}
