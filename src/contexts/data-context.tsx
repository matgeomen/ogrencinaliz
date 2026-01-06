"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { StudentExamResult, UserProfile } from '@/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, writeBatch, deleteDoc, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
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
  apiKey: string | null;
  setApiKey: (key: string) => void;
  userProfile: WithId<UserProfile> | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [localData, setLocalData] = useState<WithId<StudentExamResult>[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const { toast } = useToast();
  const { firestore, isUserLoading } = useFirebase();
  const { user } = useUser();

  const userProfileRef = useMemoFirebase(() => {
    return user && firestore ? doc(firestore, 'users', user.uid) : null;
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  
  // State for user settings, initialized from profile or local storage
  const [storagePreference, setStoragePreferenceState] = useState<StoragePreference>('local');
  const [profileAvatar, setProfileAvatarState] = useState<string>('');
  const [apiKey, setApiKeyState] = useState<string | null>(null);

  // Effect to load initial settings from userProfile or localStorage
  useEffect(() => {
    if (isProfileLoading || isUserLoading) return;
    
    const pref = userProfile?.storagePreference || (localStorage.getItem('storagePreference') as StoragePreference) || 'local';
    setStoragePreferenceState(pref);

    const avatar = userProfile?.photoURL || localStorage.getItem('profileAvatar');
    if (avatar) {
      setProfileAvatarState(avatar);
    } else {
      const defaultAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');
      if (defaultAvatar) setProfileAvatarState(defaultAvatar.imageUrl);
    }
    
    const key = userProfile?.apiKey || localStorage.getItem('gemini_api_key');
    if (key) {
      setApiKeyState(key);
      if (typeof window !== 'undefined') {
        process.env.GEMINI_API_KEY = key;
      }
    }
    
    // Load local student data and set mock data if it's the very first launch
    const savedData = localStorage.getItem('studentData');
    if (savedData) {
      setLocalData(JSON.parse(savedData));
    } else {
      // This is the first launch ever, load mock data
      const initialData = mockStudentData.map(d => ({...d, id: `${d.student_no}-${d.exam_name}`}));
      setLocalData(initialData);
      localStorage.setItem('studentData', JSON.stringify(initialData));
      toast({ title: "Örnek Veriler Yüklendi", description: "Uygulamayı keşfetmeniz için örnek deneme sonuçları eklendi." });
    }
    setIsInitialLoad(false);

  }, [userProfile, isProfileLoading, isUserLoading, toast]);
  

  const setStoragePreference = (pref: StoragePreference) => {
    setStoragePreferenceState(pref);
    localStorage.setItem('storagePreference', pref);
  };
  
  const setApiKey = (key: string) => {
    setApiKeyState(key);
    localStorage.setItem('gemini_api_key', key);
    if (typeof window !== 'undefined') {
        process.env.GEMINI_API_KEY = key;
    }
  }
  
  const setProfileAvatar = (url: string) => {
    setProfileAvatarState(url);
    localStorage.setItem('profileAvatar', url);
  }

  const resultsCollection = useMemoFirebase(() => {
    if ((storagePreference === 'cloud' || storagePreference === 'both') && firestore && user) {
      return collection(firestore, 'users', user.uid, 'results');
    }
    return null;
  }, [firestore, user, storagePreference]);

  const { data: cloudData, isLoading: isFirestoreLoading } = useCollection<StudentExamResult>(resultsCollection);

  const studentData = useMemo(() => {
    if (isInitialLoad) return [];
    
    if (storagePreference === 'cloud') {
      return cloudData || [];
    }
    if (storagePreference === 'local') {
      return localData;
    }
    if (storagePreference === 'both') {
      const allDataMap = new Map<string, WithId<StudentExamResult>>();
      localData.forEach(ld => allDataMap.set(ld.id, ld));
      (cloudData || []).forEach(cd => allDataMap.set(cd.id, cd));
      return Array.from(allDataMap.values());
    }
    return [];
  }, [localData, cloudData, storagePreference, isInitialLoad]);

  const loading = isFirestoreLoading || isUserLoading || isProfileLoading || isInitialLoad;

  const exams = useMemo(() => Array.from(new Set(studentData.map(d => d.exam_name))).sort(), [studentData]);
  const classes = useMemo(() => Array.from(new Set(studentData.map(d => d.class))).sort(), [studentData]);

  useEffect(() => {
    if (!loading && exams.length > 0) {
      if (!selectedExam || !exams.includes(selectedExam)) {
        setSelectedExam(exams[0]);
      }
    } else if (!loading && exams.length === 0) {
        setSelectedExam('');
    }
  }, [exams, selectedExam, loading]);


  const addStudentData = useCallback(async (newData: StudentExamResult[]) => {
    const dataWithIds = newData.map(item => ({...item, id: `${item.student_no}-${item.exam_name}`.replace(/[\/.]/g, '-')}));

    if (storagePreference === 'local' || storagePreference === 'both') {
       setLocalData(prevData => {
         const dataMap = new Map(prevData.map(d => [d.id, d]));
         dataWithIds.forEach(item => dataMap.set(item.id, item));
         const updatedData = Array.from(dataMap.values());
         localStorage.setItem('studentData', JSON.stringify(updatedData));
         return updatedData;
       });
       toast({ title: 'Veriler yerel olarak kaydedildi.' });
    }

    if ((storagePreference === 'cloud' || storagePreference === 'both') && firestore && user) {
        const batch = writeBatch(firestore);
        dataWithIds.forEach(item => {
            const docRef = doc(firestore, 'users', user.uid, 'results', item.id);
            batch.set(docRef, item, { merge: true });
        });

        try {
            await batch.commit();
            toast({ title: 'Veriler başarıyla Firebase\'e kaydedildi.' });
        } catch (error) {
            console.error("Failed to save data to Firestore:", error);
            toast({ title: "Firebase'e Kaydedilemedi", description: "Veriler buluta kaydedilirken bir hata oluştu.", variant: "destructive" });
        }
    } else if (storagePreference === 'cloud') {
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
            }
        } catch(error) {
            console.error("Error deleting exam from Firestore:", error);
            toast({ title: "Silme Hatası", description: "Buluttan deneme silinirken bir hata oluştu.", variant: "destructive" });
        }
    }
  }, [firestore, user, storagePreference, toast]);

  const value: DataContextType = {
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
    storagePreference,
    setStoragePreference,
    apiKey,
    setApiKey,
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
