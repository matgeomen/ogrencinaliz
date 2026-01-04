"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { StudentExamResult } from '@/types';
import { mockStudentData } from '@/lib/mock-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';

interface DataContextType {
  studentData: StudentExamResult[];
  addStudentData: (newData: StudentExamResult[]) => void;
  deleteExam: (examName: string) => void;
  exams: string[];
  selectedExam: string;
  setSelectedExam: (examName: string) => void;
  classes: string[];
  loading: boolean;
  profileAvatar: string;
  setProfileAvatar: (url: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

async function fetchSheetData(): Promise<StudentExamResult[]> {
  const res = await fetch('/api/sheets');
  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Failed to fetch sheet data, Body:", errorBody);
    throw new Error(`Failed to fetch sheet data: ${res.statusText}`);
  }
  return res.json();
}

async function updateSheetData(data: StudentExamResult[]) {
  const res = await fetch('/api/sheets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update sheet data: ${res.statusText}`);
  }
  return res.json();
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentExamResult[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [profileAvatar, setProfileAvatarState] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const data = await fetchSheetData();
        setStudentData(data);
        if (data.length > 0) {
          const exams = Array.from(new Set(data.map((d: StudentExamResult) => d.exam_name))).sort();
          setSelectedExam(exams[0] || '');
        }
      } catch (error) {
        console.error("Error loading data from Google Sheets, falling back to local data.", error);
        toast({
          title: "Canlı Veri Yüklenemedi",
          description: "Google Sheets verileri yüklenemedi. Çevrimdışı modda devam ediliyor. Ayarlarınızı kontrol edin.",
          variant: "destructive",
        });
        // Fallback to local data if sheets fail
        const storedData = localStorage.getItem('studentData');
        const initialData = storedData ? JSON.parse(storedData) : mockStudentData;
        setStudentData(initialData);
      }

      // Load profile avatar from localStorage
      const storedAvatar = localStorage.getItem('profileAvatar');
      if (storedAvatar) {
        setProfileAvatarState(storedAvatar);
      } else {
        const defaultAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');
        if (defaultAvatar) {
            setProfileAvatarState(defaultAvatar.imageUrl);
        }
      }

      setLoading(false);
    }
    loadInitialData();
  }, [toast]);
  
  const exams = useMemo(() => Array.from(new Set(studentData.map(d => d.exam_name))).sort(), [studentData]);
  const classes = useMemo(() => Array.from(new Set(studentData.map(d => d.class))).sort(), [studentData]);

  useEffect(() => {
    if (!loading && studentData.length > 0) {
       localStorage.setItem('studentData', JSON.stringify(studentData));
       if (selectedExam && !exams.includes(selectedExam)) {
        setSelectedExam(exams[0] || '');
      } else if (!selectedExam && exams.length > 0) {
        setSelectedExam(exams[0]);
      }
    }
  }, [studentData, selectedExam, exams, loading]);
  
  const setProfileAvatar = (url: string) => {
    setProfileAvatarState(url);
    localStorage.setItem('profileAvatar', url);
  }

  const addStudentData = useCallback(async (newData: StudentExamResult[]) => {
    let updatedData: StudentExamResult[] = [];
    setStudentData(prevData => {
        const currentData = [...prevData];
        newData.forEach(newItem => {
            const exists = currentData.some(
                item => item.exam_name === newItem.exam_name && item.student_no === newItem.student_no
            );
            if (!exists) {
                currentData.push(newItem);
            }
        });
        updatedData = currentData;
        return updatedData;
    });

    try {
        await updateSheetData(updatedData);
        toast({ title: "Veriler Google Sheets'e kaydedildi." });
    } catch (error) {
        console.error("Failed to save data to Google Sheets:", error);
        toast({ title: "Google Sheets'e Kaydedilemedi", description: "Veriler sadece yerel olarak kaydedildi.", variant: "destructive" });
    }
  }, [toast]);

  const deleteExam = useCallback(async (examNameToDelete: string) => {
    let updatedData: StudentExamResult[] = [];
    setStudentData(prevData => {
        updatedData = prevData.filter(d => d.exam_name !== examNameToDelete);
        return updatedData;
    });
    
    try {
        await updateSheetData(updatedData);
        toast({ title: "Veriler Google Sheets'te güncellendi." });
    } catch (error) {
        console.error("Failed to update data in Google Sheets:", error);
        toast({ title: "Google Sheets Güncellenemedi", description: "Değişiklikler sadece yerel olarak kaydedildi.", variant: "destructive" });
    }
  }, [toast]);

  const value = {
    studentData,
    addStudentData,
    deleteExam,
    exams,
    selectedExam,
    setSelectedExam,
    classes,
    loading,
    profileAvatar,
    setProfileAvatar,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
