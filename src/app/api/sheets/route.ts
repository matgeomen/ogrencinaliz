import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { NextRequest, NextResponse } from 'next/server';
import { StudentExamResult } from '@/types';

// Bu değerleri ortam değişkenlerinden almalısınız.
// `.env.local` dosyanıza ekleyin:
// GOOGLE_SHEET_ID=...
// GOOGLE_CLIENT_ID=...
// GOOGLE_CLIENT_SECRET=...
// GOOGLE_REDIRECT_URI=http://localhost:9002/api/auth/callback/google

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const SHEET_NAME = 'Sheet1'; // Veya verilerinizin olduğu sayfa adı

async function getAuthClient(): Promise<OAuth2Client> {
    const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    // Normalde burada bir veritabanından veya dosyadan token alırsınız.
    // Şimdilik, bu örnekte token'ı manuel olarak yönettiğimizi varsayalım.
    // Gerçek bir uygulamada, ilk yetkilendirmeden sonra token'ı saklamanız gerekir.
    // Örneğin, `/api/auth/google` ve `/api/auth/callback/google` rotaları oluşturup
    // kullanıcıyı yetkilendirme sayfasına yönlendirip token'ı alabilirsiniz.
    const tokens = {
        // Bu token'ları OAuth2 akışından sonra elde etmelisiniz.
        // access_token: '...',
        // refresh_token: '...',
        // expiry_date: ...
    };
    
    // Bu örnekte, token'ların eksik olduğunu ve servisin çalışmayabileceğini unutmayın.
    // Entegrasyonun tam çalışması için tam bir OAuth2 akışı uygulanmalıdır.
    if (tokens) {
        oauth2Client.setCredentials(tokens);
    }

    return oauth2Client;
}


function isStudentExamResult(obj: any): obj is StudentExamResult {
  return (
    typeof obj.exam_name === 'string' &&
    typeof obj.date === 'string' &&
    typeof obj.class === 'string' &&
    typeof obj.student_no === 'number' &&
    typeof obj.student_name === 'string' &&
    typeof obj.toplam_dogru === 'number' &&
    typeof obj.toplam_yanlis === 'number' &&
    typeof obj.toplam_net === 'number' &&
    typeof obj.toplam_puan === 'number' &&
    typeof obj.turkce_net === 'number' &&
    typeof obj.tarih_net === 'number' &&
    typeof obj.din_net === 'number' &&
    typeof obj.ing_net === 'number' &&
    typeof obj.mat_net === 'number' &&
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

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!A:Z`,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return NextResponse.json([]);
        }

        const header = rows[0] as (keyof StudentExamResult)[];
        const data = rows.slice(1).map(row => {
            const rowData: Partial<StudentExamResult> = {};
            header.forEach((key, index) => {
                const value = row[index];
                if (value !== undefined && value !== null) {
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
            return rowData as StudentExamResult;
        }).filter(isStudentExamResult);

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
