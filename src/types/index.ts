export interface StudentExamResult {
  exam_name: string;
  date: string;
  class: string;
  student_no: number;
  student_name: string;
  toplam_dogru: number;
  toplam_yanlis: number;
  toplam_net: number;
  toplam_puan: number;
  turkce_d: number;
  turkce_y: number;
  turkce_net: number;
  tarih_d: number;
  tarih_y: number;
  tarih_net: number;
  din_d: number;
  din_y: number;
  din_net: number;
  ing_d: number;
  ing_y: number;
  ing_net: number;
  mat_d: number;
  mat_y: number;
  mat_net: number;
  fen_d: number;
  fen_y: number;
  fen_net: number;
}

export interface ExamStats {
  exam_name: string;
  date: string;
  studentCount: number;
  avgScore: number;
}
