import 'dotenv/config';
import { NextRequest, NextResponse } from 'next/server';
import { StudentExamResult } from '@/types';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const SHEET_NAME = 'Sheet1'; 

async function getAccessToken(): Promise<string> {
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
        throw new Error("Google credentials (Client ID, Secret, Refresh Token) must be configured.");
    }
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: REFRESH_TOKEN,
            grant_type: 'refresh_token',
        }),
    });

    const data = await response.json();
    if (!response.ok) {
        console.error("Token refresh failed:", data);
        throw new Error(data.error_description || 'Failed to refresh access token.');
    }
    return data.access_token;
}

const headerRow: string[] = [
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
  return obj && 
         typeof obj.student_no === 'number' && !isNaN(obj.student_no) &&
         typeof obj.student_name === 'string' && obj.student_name.trim() !== '' &&
         typeof obj.exam_name === 'string' && obj.exam_name.trim() !== '';
}

export async function GET(req: NextRequest) {
    try {
        if (!SHEET_ID) {
            throw new Error("GOOGLE_SHEET_ID is not defined in your environment.");
        }

        const accessToken = await getAccessToken();
        const range = `${SHEET_NAME}!A:Z`;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to fetch from Google Sheets.');
        }

        const rows = data.values;
        if (!rows || rows.length <= 1) {
            return NextResponse.json([]);
        }

        const header = rows[0] as string[];
        const jsonData = rows.slice(1).map((row: string[]) => {
            if (row.every(cell => cell === '')) return null;
            const rowData: { [key: string]: any } = {};
            header.forEach((key, index) => {
                 const value = row[index];
                 const numericKeys = [
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
            return rowData;
        }).filter((item: any) => item && isStudentExamResult(item));

        return NextResponse.json(jsonData);
    } catch (error: any) {
        console.error('Google Sheets API GET Error:', error);
        return NextResponse.json({ error: 'Google Sheets verileri okunurken bir hata oluştu.', details: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        if (!SHEET_ID) {
            throw new Error("GOOGLE_SHEET_ID is not defined in your environment.");
        }

        const accessToken = await getAccessToken();
        const body = await req.json();
        const data: StudentExamResult[] = body.data;

        if (!Array.isArray(data)) {
            return NextResponse.json({ error: 'Geçersiz veri formatı. Bir dizi bekleniyor.' }, { status: 400 });
        }
        
        // Clear the sheet
        const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}:clear`;
        await fetch(clearUrl, {
             method: 'POST',
             headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        // Write new data
        const values = [
            headerRow,
            ...data.map(item => headerRow.map(key => (item as any)[key] !== undefined ? (item as any)[key] : ""))
        ];
        
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A1?valueInputOption=USER_ENTERED`;
        const result = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values }),
        });

        const resultData = await result.json();
        if (!result.ok) {
            throw new Error(resultData.error?.message || 'Failed to write to Google Sheets.');
        }

        return NextResponse.json({ success: true, updatedRange: resultData.updatedRange });

    } catch (error: any) {
        console.error('Google Sheets API POST Error:', error);
        return NextResponse.json({ error: 'Google Sheets\'e yazılırken bir hata oluştu.', details: error.message }, { status: 500 });
    }
}
