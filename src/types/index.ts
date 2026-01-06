
export interface KonuAnalizi {
  konu: string;
  sonuc: 'D' | 'Y' | 'B'; // Doğru, Yanlış, Boş
}

export interface DersAnalizi {
  dogru: number;
  yanlis: number;
  net: number;
  kazanimlar: KonuAnalizi[];
}

export interface StudentExamResult {
  id?: string;
  exam_name: string;
  date: string;
  class: string;
  student_no: number;
  student_name: string;
  toplam_dogru: number;
  toplam_yanlis: number;
  toplam_net: number;
  toplam_puan: number;
  turkce: DersAnalizi;
  mat: DersAnalizi;
  fen: DersAnalizi;
  tarih: DersAnalizi;
  din: DersAnalizi;
  ing: DersAnalizi;
}


export interface ExamStats {
  exam_name: string;
  date: string;
  studentCount: number;
  avgScore: number;
}

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    role: 'admin' | 'user';
    createdAt: any; // Firestore ServerTimestamp
    storagePreference?: 'local' | 'cloud' | 'both';
    apiKey?: string;
}
