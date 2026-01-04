import 'dotenv/config';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

const OAUTH2_CLIENT = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export async function GET(req: NextRequest) {
    const scopes = [
        'https://www.googleapis.com/auth/spreadsheets',
    ];

    const url = OAUTH2_CLIENT.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
    });

    return NextResponse.json({ url });
}
