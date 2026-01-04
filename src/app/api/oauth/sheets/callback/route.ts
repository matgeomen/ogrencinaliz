import 'dotenv/config';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

async function appendToEnvFile(updates: { key: string, value: string }[]) {
    const envPath = path.resolve(process.cwd(), '.env');
    let envFileContent = '';
    try {
        envFileContent = await fs.readFile(envPath, 'utf-8');
    } catch (error: any) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }

    let lines = envFileContent.split('\n');
    
    updates.forEach(({ key, value }) => {
        const keyIndex = lines.findIndex(line => line.startsWith(`${key}=`));
        const formattedValue = value.includes(' ') ? `"${value}"` : value;
        if (keyIndex !== -1) {
            lines[keyIndex] = `${key}=${formattedValue}`;
        } else {
            lines.push(`${key}=${formattedValue}`);
        }
    });

    await fs.writeFile(envPath, lines.filter(Boolean).join('\n'));
}


export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (typeof code !== 'string') {
        return NextResponse.redirect(new URL('/settings?error=auth_failed', req.url));
    }
     if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
        return NextResponse.json({ error: "Google API credentials are not configured." }, { status: 500 });
    }

    try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenResponse.json();

        if (!tokenResponse.ok) {
            throw new Error(tokens.error_description || 'Failed to exchange token.');
        }
        
        const updates: { key: string, value: string }[] = [];

        if (tokens.refresh_token) {
            updates.push({ key: 'GOOGLE_REFRESH_TOKEN', value: tokens.refresh_token });
        }
        if (tokens.access_token) {
            updates.push({ key: 'GOOGLE_ACCESS_TOKEN', value: tokens.access_token });
        }
        if (tokens.expires_in) {
            const expiryDate = Date.now() + tokens.expires_in * 1000;
            updates.push({ key: 'GOOGLE_TOKEN_EXPIRY', value: expiryDate.toString() });
        }

        if(updates.length > 0) {
            await appendToEnvFile(updates);
        }

        return NextResponse.redirect(new URL('/settings?success=true', req.url));
    } catch (error: any) {
        console.error('Error getting tokens:', error);
        return NextResponse.redirect(new URL(`/settings?error=token_exchange_failed&message=${encodeURIComponent(error.message)}`, req.url));
    }
}
