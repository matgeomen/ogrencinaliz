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


function isStudentExamResult(obj: any): obj is StudentExamResult {
  return (
    obj &&
    typeof obj.exam_name === 'string' &&
    typeof obj.date === 'string' &&
    typeof obj.class === 'string' &&
    typeof obj.student_no === 'number' &&
    typeof obj.student_name === 'string' &&
    typeof obj.toplam_dogru === 'number' &&
    typeof obj.toplam_yanlis === 'number' &&
    typeof obj.toplam_net === 'number' &&
    typeof obj.toplam_puan === 'number' &&
    typeof obj.turkce_d === 'number' &&
    typeof obj.turkce_y === 'number' &&
    typeof obj.turkce_net === 'number' &&
    typeof obj.tarih_d === 'number' &&
    typeof obj.tarih_y === 'number' &&
    typeof obj.tarih_net === 'number' &&
    typeof obj.din_d === 'number' &&
    typeof obj.din_y === 'number' &&
    typeof obj.din_net === 'number' &&
    typeof obj.ing_d === 'number' &&
    typeof obj.ing_y === 'number' &&
    typeof obj.ing_net === 'number' &&
    typeof obj.mat_d === 'number' &&
    typeof obj.mat_y === 'number' &&
    typeof obj.mat_net === 'number' &&
    typeof obj.fen_d === 'number' &&
    typeof obj.fen_y === 'number' &&
    typeof obj.fen_net === 'number'
  );
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
        if (!rows || rows.length <= 1) { // Check for header or empty
            // If the sheet is empty or only has a header, return an empty array
            return NextResponse.json([]);
        }

        const header = rows[0] as (keyof StudentExamResult)[];
        const data = rows.slice(1).map(row => {
            const rowData: Partial<StudentExamResult> = {};
            header.forEach((key, index) => {
                const value = row[index];
                if (value !== undefined && value !== null && value !== '') {
                    const numericKeys: (keyof StudentExamResult)[] = [
                        "student_no", "toplam_dogru", "toplam_yanlis", "toplam_net", 
                        "toplam_puan", "turkce_d", "turkce_y", "turkce_net",
                        "tarih_d", "tarih_y", "tarih_net", "din_d", "din_y", "din_net",
                        "ing_d", "ing_y", "ing_net", "mat_d", "mat_y", "mat_net",
                        "fen_d", "fen_y", "fen_net"
                    ];
                    if (numericKeys.includes(key)) {
                        (rowData as any)[key] = parseFloat(value.toString().replace(',', '.')) || 0;
                    } else {
                        (rowData as any)[key] = value;
                    }
                }
            });
            // Ensure all required fields have default values if not present
            headerRow.forEach(key => {
                if (rowData[key] === undefined) {
                    const numericKeys: (keyof StudentExamResult)[] = [
                        "student_no", "toplam_dogru", "toplam_yanlis", "toplam_net", "toplam_puan",
                         "turkce_d", "turkce_y", "turkce_net", "tarih_d", "tarih_y", "tarih_net",
                         "din_d", "din_y", "din_net", "ing_d", "ing_y", "ing_net", "mat_d", 
                         "mat_y", "mat_net", "fen_d", "fen_y", "fen_net"
                    ];
                     if (numericKeys.includes(key)) {
                        (rowData as any)[key] = 0;
                     } else {
                        (rowData as any)[key] = '';
                     }
                }
            });

            return rowData;
        }).filter(row => row && isStudentExamResult(row)); // Filter out empty/invalid rows

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
        
        // If data is empty, we just cleared the sheet, so we're done.
        if (data.length === 0) {
             // We still need to write the header back
             await sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: `${SHEET_NAME}!A1`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [headerRow],
                },
            });
             return NextResponse.json({ success: true, message: "Sheet cleared and header restored." });
        }

        const values = [
            headerRow,
            ...data.map(item => headerRow.map(key => item[key] !== undefined ? item[key] : ""))
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
