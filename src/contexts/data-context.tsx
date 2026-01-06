"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { StudentExamResult, UserProfile } from '@/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, writeBatch, deleteDoc, query, where, getDocs, setDoc } from 'firebase/firestore';
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
  userProfile: UserProfile | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [localData, setLocalData] = useState<WithId<StudentExamResult>[]>([]);
  const [storagePreference, setStoragePreferenceState] = useState<StoragePreference>('local');
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [profileAvatar, setProfileAvatarState] = useState<string>('');
  const { toast } = useToast();
  
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const userProfileRef = useMemoFirebase(() => {
    return user && firestore ? doc(firestore, 'users', user.uid) : null;
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (isUserLoading || isProfileLoading) return;

    // Prioritize cloud data, then local, then default
    const pref = userProfile?.storagePreference || localStorage.getItem('storagePreference') as StoragePreference || 'local';
    setStoragePreferenceState(pref);
    localStorage.setItem('storagePreference', pref);
    
    const avatar = userProfile?.photoURL || localStorage.getItem('profileAvatar');
    if (avatar) {
      setProfileAvatarState(avatar);
    } else {
       const defaultAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');
       if (defaultAvatar) setProfileAvatarState(defaultAvatar.imageUrl);
    }

    const savedData = localStorage.getItem('studentData');
    if (savedData) {
      setLocalData(JSON.parse(savedData));
    } else {
      const initialData = mockStudentData.map(d => ({...d, id: `${d.student_no}-${d.exam_name}`}));
      setLocalData(initialData);
      localStorage.setItem('studentData', JSON.stringify(initialData));
    }
  }, [userProfile, isUserLoading, isProfileLoading]);


  const setStoragePreference = (pref: StoragePreference) => {
    setStoragePreferenceState(pref);
    localStorage.setItem('storagePreference', pref);
    if(user && firestore) {
      setDoc(doc(firestore, 'users', user.uid), { storagePreference: pref }, { merge: true });
    }
  };
  
  const resultsCollection = useMemoFirebase(() => {
    if ((storagePreference === 'cloud' || storagePreference === 'both') && firestore && user) {
      return collection(firestore, 'users', user.uid, 'results');
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
      const allData = [...localData];
      if (cloudData) {
        cloudData.forEach(cd => {
          const index = allData.findIndex(ld => ld.id === cd.id);
          if (index !== -1) {
            allData[index] = cd;
          } else {
            allData.push(cd);
          }
        });
      }
      return allData;
    }
    return [];
  }, [localData, cloudData, storagePreference]);

  const loading = isFirestoreLoading || isUserLoading || isProfileLoading;

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
     if(user && firestore) {
      setDoc(doc(firestore, 'users', user.uid), { photoURL: url }, { merge: true });
    }
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

    if ((storagePreference === 'cloud' || storagePreference === 'both') && firestore && user) {
        const batch = writeBatch(firestore);
        dataWithIds.forEach(item => {
            const docId = item.id.replace(/[\/.]/g, '-');
            const newDocRef = doc(firestore, 'users', user.uid, 'results', docId);
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
        toast({ title: 'Bulut depolama aktif değil.', description: 'Lütfen giriş yapın ve profil sayfasından Firebase ayarlarını kontrol edin.', variant: 'destructive' });
    }
  }, [firestore, user, storagePreference, toast]);
  
  const deleteExam = useCallback(async (examNameToDelete: string) => {
    if (storagePreference === 'local' || storagePreference === 'both') {
      setLocalData(prevData => {
        const updatedData = prevData.filter(d => d.exam_name !== examNameToDelete);
        localStorage.setItem('studentData', JSON.stringify(updatedData));
        return updatedData;
      });
    }

    if ((storagePreference === 'cloud' || storagePreference === 'both') && firestore && user) {
        const q = query(collection(firestore, 'users', user.uid, 'results'), where('exam_name', '==', examNameToDelete));
        try {
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const batch = writeBatch(firestore);
                querySnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                toast({ title: `"${examNameToDelete}" denemesi buluttan silindi.` });
            }
        } catch(error) {
            console.error("Error deleting exam from Firestore:", error);
            toast({ title: "Silme Hatası", description: "Buluttan deneme silinirken bir hata oluştu.", variant: "destructive" });
        }
    }
  }, [firestore, user, storagePreference, toast]);

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
    userProfile,
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
