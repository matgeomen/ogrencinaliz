import 'dotenv/config';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { NextRequest, NextResponse } from 'next/server';
import { StudentExamResult } from '@/types';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const SHEET_NAME = 'Sheet1'; 

async function getAuthClient(): Promise<OAuth2Client> {
    const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    if (process.env.GOOGLE_REFRESH_TOKEN) {
        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        });
    } else {
        throw new Error("Google Refresh Token not found. Please authenticate through settings.");
    }
    
    return oauth2Client;
}

const headerRow: (keyof StudentExamResult)[] = [
    "exam_name", "date", "class", "student_no", "student_name", 
    "toplam_dogru", "toplam_yanlis", "toplam_net", "toplam_puan",
    "turkce_d", "turkce_y", "turkce_net",
    "tarih_d", "tarih_y", "tarih_net",
    "din_d", "din_y", "din_net",
    "ing_d", "ing_y", "ing_net",
    "mat_d", "mat_y", "mat_net",
    "fen_d", "fen_y", "fen_net"
];

function isStudentExamResult(obj: any): obj is StudentExamResult {
  return obj && typeof obj.student_no === 'number' && typeof obj.student_name === 'string';
}

export async function GET(req: NextRequest) {
    try {
        const auth = await getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });

        if (!SHEET_ID) {
            throw new Error("GOOGLE_SHEET_ID is not defined in your environment.");
        }

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!A:Z`,
        });

        const rows = response.data.values;
        if (!rows || rows.length <= 1) {
            return NextResponse.json([]);
        }

        const header = rows[0] as (keyof StudentExamResult)[];
        const data = rows.slice(1).map(row => {
            const rowData: { [key: string]: any } = {};
            header.forEach((key, index) => {
                const value = row[index];
                const numericKeys: string[] = [
                    "student_no", "toplam_dogru", "toplam_yanlis", "toplam_net", "toplam_puan",
                    "turkce_d", "turkce_y", "turkce_net", "tarih_d", "tarih_y", "tarih_net",
                    "din_d", "din_y", "din_net", "ing_d", "ing_y", "ing_net", "mat_d", 
                    "mat_y", "mat_net", "fen_d", "fen_y", "fen_net"
                ];

                if (numericKeys.includes(key)) {
                    rowData[key] = parseFloat(String(value).replace(',', '.')) || 0;
                } else {
                    rowData[key] = value || '';
                }
            });
            return rowData as StudentExamResult;
        }).filter(item => isStudentExamResult(item));

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Google Sheets API GET Error:', error.message);
        return NextResponse.json({ error: 'Google Sheets verileri okunurken bir hata oluştu.', details: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });
        
        if (!SHEET_ID) {
            throw new Error("GOOGLE_SHEET_ID is not defined in your environment.");
        }

        const body = await req.json();
        const data: StudentExamResult[] = body.data;

        if (!Array.isArray(data)) {
            return NextResponse.json({ error: 'Geçersiz veri formatı. Bir dizi bekleniyor.' }, { status: 400 });
        }

        // Clear the sheet first
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SHEET_ID,
            range: SHEET_NAME,
        });
        
        const values = [
            headerRow,
            ...data.map(item => headerRow.map(key => item[key]))
        ];

        const result = await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: values,
            },
        });

        return NextResponse.json({ success: true, updatedRange: result.data.updatedRange });
    } catch (error: any) {
        console.error('Google Sheets API POST Error:', error.message);
        return NextResponse.json({ error: 'Google Sheets\'e yazılırken bir hata oluştu.', details: error.message }, { status: 500 });
    }
}
