import 'dotenv/config';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const OAUTH2_CLIENT = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

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

    try {
        const { tokens } = await OAUTH2_CLIENT.getToken(code);
        
        const updates: { key: string, value: string }[] = [];

        if (tokens.refresh_token) {
            updates.push({ key: 'GOOGLE_REFRESH_TOKEN', value: tokens.refresh_token });
        }
        if (tokens.access_token) {
            updates.push({ key: 'GOOGLE_ACCESS_TOKEN', value: tokens.access_token });
        }
        if (tokens.expiry_date) {
            updates.push({ key: 'GOOGLE_TOKEN_EXPIRY', value: tokens.expiry_date.toString() });
        }

        if(updates.length > 0) {
            await appendToEnvFile(updates);
        }

        return NextResponse.redirect(new URL('/settings?success=true', req.url));
    } catch (error) {
        console.error('Error getting tokens:', error);
        return NextResponse.redirect(new URL('/settings?error=token_exchange_failed', req.url));
    }
}
