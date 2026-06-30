import * as Sentry from '@sentry/nextjs';

export async function GET() {
    try {
        throw new Error('SafeDeliver Sentry test — server/API route error');
    } catch (err) {
        Sentry.captureException(err);
        return Response.json({ ok: true, message: 'Server error captured and sent to Sentry' });
    }
}
