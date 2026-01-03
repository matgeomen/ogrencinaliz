import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const OAUTH2_CLIENT = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

async function appendToEnvFile(key: string, value: string) {
    const envPath = path.resolve(process.cwd(), '.env');
    let envFileContent = '';
    try {
        envFileContent = await fs.readFile(envPath, 'utf-8');
    } catch (error: any) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }

    const lines = envFileContent.split('\n');
    const newLines = lines.filter(line => !line.startsWith(`${key}=`));
    newLines.push(`${key}=${value}`);
    
    await fs.writeFile(envPath, newLines.join('\n'));
}


export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (typeof code !== 'string') {
        return NextResponse.redirect(new URL('/settings?error=true', req.url));
    }

    try {
        const { tokens } = await OAUTH2_CLIENT.getToken(code);
        
        if (tokens.refresh_token) {
            // In a real app, you'd save this to a secure database associated with the user
            // For this example, we'll save it to a .env file (NOT recommended for production)
            await appendToEnvFile('GOOGLE_REFRESH_TOKEN', tokens.refresh_token);
        }

         if (tokens.access_token) {
            await appendToEnvFile('GOOGLE_ACCESS_TOKEN', tokens.access_token);
         }
         
         if (tokens.expiry_date) {
            await appendToEnvFile('GOOGLE_TOKEN_EXPIRY', tokens.expiry_date.toString());
         }


        // Redirect back to settings page with success
        return NextResponse.redirect(new URL('/settings?success=true', req.url));
    } catch (error) {
        console.error('Error getting tokens:', error);
        return NextResponse.redirect(new URL('/settings?error=true', req.url));
    }
}
