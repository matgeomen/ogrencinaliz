"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StudentExamResult } from '@/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { WithId } from '@/firebase/firestore/use-collection';
import { mockStudentData } from '@/lib/mock-data';

type StoragePreference = 'local' | 'cloud' | 'both';

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
  storagePreference: StoragePreference;
  setStoragePreference: (pref: StoragePreference) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [localData, setLocalData] = useState<WithId<StudentExamResult>[]>(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('studentData');
      return savedData ? JSON.parse(savedData) : mockStudentData.map(d => ({...d, id: `${d.student_no}-${d.exam_name}`}));
    }
    return mockStudentData.map(d => ({...d, id: `${d.student_no}-${d.exam_name}`}));
  });
  
  const [storagePreference, setStoragePreferenceState] = useState<StoragePreference>('local');
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [profileAvatar, setProfileAvatarState] = useState<string>('');
  const { toast } = useToast();
  
  const { firestore, auth, user, isUserLoading } = useFirebase();

  useEffect(() => {
    const savedPref = localStorage.getItem('storagePreference') as StoragePreference;
    if (savedPref) {
      setStoragePreferenceState(savedPref);
    }
    const storedAvatar = localStorage.getItem('profileAvatar');
    if (storedAvatar) {
      setProfileAvatarState(storedAvatar);
    } else {
      const defaultAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');
      if (defaultAvatar) setProfileAvatarState(defaultAvatar.imageUrl);
    }
  }, []);

  const setStoragePreference = (pref: StoragePreference) => {
    setStoragePreferenceState(pref);
    localStorage.setItem('storagePreference', pref);
    if ((pref === 'cloud' || pref === 'both') && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  };

  useEffect(() => {
    if (!isUserLoading && (storagePreference === 'cloud' || storagePreference === 'both') && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth, storagePreference]);
  
  const resultsCollection = useMemoFirebase(() => {
    if ((storagePreference === 'cloud' || storagePreference === 'both') && firestore && user) {
      return collection(firestore, 'results');
    }
    return null;
  }, [firestore, user, storagePreference]);

  const { data: cloudData, isLoading: isFirestoreLoading } = useCollection<StudentExamResult>(resultsCollection);

  const studentData = useMemo(() => {
    if (storagePreference === 'cloud') {
      return cloudData || [];
    }
    if (storagePreference === 'local') {
      return localData;
    }
    if (storagePreference === 'both') {
      // Merge local and cloud data, giving precedence to cloud data
      const allData = [...localData];
      if (cloudData) {
        cloudData.forEach(cd => {
          const index = allData.findIndex(ld => ld.id === cd.id);
          if (index !== -1) {
            allData[index] = cd; // Update with cloud data
          } else {
            allData.push(cd); // Add new cloud data
          }
        });
      }
      return allData;
    }
    return [];
  }, [localData, cloudData, storagePreference]);

  const loading = isFirestoreLoading || isUserLoading;

  const exams = useMemo(() => Array.from(new Set(studentData.map(d => d.exam_name))).sort(), [studentData]);
  const classes = useMemo(() => Array.from(new Set(studentData.map(d => d.class))).sort(), [studentData]);

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
    const dataWithIds = newData.map(item => ({...item, id: `${item.student_no}-${item.exam_name}`}));

    if (storagePreference === 'local' || storagePreference === 'both') {
       setLocalData(prevData => {
         const updatedData = [...prevData];
         dataWithIds.forEach(item => {
            const index = updatedData.findIndex(d => d.id === item.id);
            if(index !== -1) {
                updatedData[index] = item;
            } else {
                updatedData.push(item);
            }
         });
         localStorage.setItem('studentData', JSON.stringify(updatedData));
         return updatedData;
       });
       toast({ title: 'Veriler yerel olarak kaydedildi.' });
    }

    if ((storagePreference === 'cloud' || storagePreference === 'both') && firestore && resultsCollection) {
        const batch = writeBatch(firestore);
        newData.forEach(item => {
            // Use a consistent ID for cloud and local
            const docId = `${item.student_no}-${item.exam_name}-${item.date}`;
            const newDocRef = doc(firestore, 'results', docId);
            batch.set(newDocRef, item, { merge: true });
        });

        try {
            await batch.commit();
            toast({ title: 'Veriler başarıyla Firebase\'e kaydedildi.' });
        } catch (error) {
            console.error("Failed to save data to Firestore:", error);
            toast({ title: "Firebase'e Kaydedilemedi", description: "Veriler buluta kaydedilirken bir hata oluştu.", variant: "destructive" });
        }
    } else if (storagePreference === 'cloud' || storagePreference === 'both') {
        toast({ title: 'Bulut depolama aktif değil.', description: 'Firebase bağlantısı kurulamadı.', variant: 'destructive' });
    }
  }, [firestore, resultsCollection, storagePreference, toast]);
  
  const deleteExam = useCallback(async (examNameToDelete: string) => {
    if (storagePreference === 'local' || storagePreference === 'both') {
      setLocalData(prevData => {
        const updatedData = prevData.filter(d => d.exam_name !== examNameToDelete);
        localStorage.setItem('studentData', JSON.stringify(updatedData));
        return updatedData;
      });
    }

    if ((storagePreference === 'cloud' || storagePreference === 'both') && firestore && cloudData) {
        const batch = writeBatch(firestore);
        const docsToDelete = cloudData.filter(d => d.exam_name === examNameToDelete);

        if(docsToDelete.length > 0) {
            docsToDelete.forEach(docToDelete => {
                const docRef = doc(firestore, 'results', docToDelete.id);
                batch.delete(docRef);
            });
            
            try {
                await batch.commit();
                toast({ title: `"${examNameToDelete}" denemesi buluttan silindi.` });
            } catch (error) {
                console.error("Failed to delete data from Firestore:", error);
                toast({ title: "Firebase'den Silinemedi", variant: "destructive" });
            }
        }
    }
    toast({ title: "Deneme Silindi", description: `"${examNameToDelete}" denemesi ve ilişkili tüm veriler silindi.` });
  }, [firestore, cloudData, storagePreference, toast]);

  const value: DataContextType = {
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
    storagePreference,
    setStoragePreference,
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
