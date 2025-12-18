import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { to, code, expiryMinutes } = await req.json();
    if (!to || !code) {
      return NextResponse.json({ error: 'missing params' }, { status: 400 });
    }

    const EGOSMS_BASE =
      process.env.EGOSMS_BASE_URL ||
      process.env.NEXT_PUBLIC_EGOSMS_BASE_URL ||
      'https://www.egosms.co/api/v1/plain/';
    const EGOSMS_USERNAME = process.env.EGOSMS_USERNAME || process.env.NEXT_PUBLIC_EGOSMS_USERNAME;
    const EGOSMS_PASSWORD = process.env.EGOSMS_PASSWORD || process.env.NEXT_PUBLIC_EGOSMS_PASSWORD;
    const EGOSMS_SENDER = process.env.EGOSMS_SENDER || process.env.NEXT_PUBLIC_EGOSMS_SENDER || 'FamilyAlbum';

    if (!EGOSMS_USERNAME || !EGOSMS_PASSWORD) {
      console.error('EgoSMS config missing', {
        EGOSMS_BASE,
        hasUsername: Boolean(EGOSMS_USERNAME),
        hasPassword: Boolean(EGOSMS_PASSWORD),
        sender: EGOSMS_SENDER,
      });
      return NextResponse.json({ error: 'SMS credentials not configured' }, { status: 500 });
    }

    const normalized = String(to).replace(/\s+/g, '');
    let number = normalized;
    if (normalized.startsWith('+')) {
      number = normalized;
    } else if (normalized.startsWith('0')) {
      // If local format starts with 0, prepend country code +256 (Uganda)
      number = `+256${normalized.slice(1)}`;
    } else if (normalized.startsWith('256')) {
      number = `+${normalized}`;
    } else {
      number = `+${normalized}`;
    }
    const message = `Your Family Album OTP is ${code}. It expires in ${expiryMinutes} minute(s).`;

    const url = new URL(EGOSMS_BASE);
    url.search = new URLSearchParams({
      number,
      message,
      username: EGOSMS_USERNAME,
      password: EGOSMS_PASSWORD,
      sender: EGOSMS_SENDER,
      priority: '0',
    }).toString();

    const res = await fetch(url.toString());
    const text = await res.text().catch(() => '');

    const success = res.ok && text.toLowerCase().includes('ok');
    if (!success) {
      console.error('EgoSMS send failed', {
        status: res.status,
        statusText: res.statusText,
        response: text,
        url: url.toString(),
      });
      return NextResponse.json({ error: text || 'send failed' }, { status: 502 });
    }

    return NextResponse.json({ ok: true, response: text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

