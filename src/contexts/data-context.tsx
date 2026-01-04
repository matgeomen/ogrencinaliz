"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { StudentExamResult } from '@/types';
import { mockStudentData } from '@/lib/mock-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useUser } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { WithId } from '@/firebase/firestore/use-collection';

interface DataContextType {
  studentData: WithId<StudentExamResult>[];
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

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [profileAvatar, setProfileAvatarState] = useState<string>('');
  const { toast } = useToast();
  
  const { firestore, auth, user, isUserLoading } = useFirebase();

  // Sign in anonymously if not already signed in
  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);
  
  const resultsCollection = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'results');
  }, [firestore]);

  const { data: studentData, isLoading: isFirestoreLoading } = useCollection<StudentExamResult>(resultsCollection);

  const loading = isFirestoreLoading || isUserLoading;

  useEffect(() => {
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
  }, []);
  
  const exams = useMemo(() => {
      if (!studentData) return [];
      return Array.from(new Set(studentData.map(d => d.exam_name))).sort();
  }, [studentData]);
  
  const classes = useMemo(() => {
      if (!studentData) return [];
      return Array.from(new Set(studentData.map(d => d.class))).sort();
  }, [studentData]);

  useEffect(() => {
    if (!loading && exams.length > 0) {
      if (!selectedExam || !exams.includes(selectedExam)) {
        setSelectedExam(exams[0]);
      }
    }
  }, [exams, selectedExam, loading]);
  
  const setProfileAvatar = (url: string) => {
    setProfileAvatarState(url);
    localStorage.setItem('profileAvatar', url);
  }

  const addStudentData = useCallback(async (newData: StudentExamResult[]) => {
    if (!firestore || !resultsCollection) {
        toast({ title: 'Veritabanı bağlantısı kurulamadı.', variant: 'destructive' });
        return;
    }

    const batch = writeBatch(firestore);
    
    newData.forEach(item => {
        const newDocRef = doc(resultsCollection); // Create a new doc with a generated ID
        batch.set(newDocRef, item);
    });

    try {
        await batch.commit();
        toast({ title: 'Veriler başarıyla Firestore\'a kaydedildi.' });
    } catch (error) {
        console.error("Failed to save data to Firestore:", error);
        toast({ title: "Firestore'a Kaydedilemedi", description: "Veriler kaydedilirken bir hata oluştu.", variant: "destructive" });
    }
  }, [firestore, resultsCollection, toast]);
  

  const deleteExam = useCallback(async (examNameToDelete: string) => {
    if (!firestore || !studentData) {
        toast({ title: 'Veritabanı bağlantısı kurulamadı.', variant: 'destructive' });
        return;
    }

    const batch = writeBatch(firestore);
    const docsToDelete = studentData.filter(d => d.exam_name === examNameToDelete);

    if(docsToDelete.length === 0) return;

    docsToDelete.forEach(docToDelete => {
        const docRef = doc(firestore, 'results', docToDelete.id);
        batch.delete(docRef);
    });
    
    try {
        await batch.commit();
        toast({ title: `"${examNameToDelete}" denemesi silindi.` });
    } catch (error) {
        console.error("Failed to delete data from Firestore:", error);
        toast({ title: "Firestore'dan Silinemedi", description: "Veriler silinirken bir hata oluştu.", variant: "destructive" });
    }
  }, [firestore, studentData, toast]);

  const value = {
    studentData: studentData || [],
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
