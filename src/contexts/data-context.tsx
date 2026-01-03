"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { StudentExamResult } from '@/types';
import { mockStudentData } from '@/lib/mock-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentExamResult[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [profileAvatar, setProfileAvatarState] = useState<string>('');

  useEffect(() => {
    // Load student data
    const storedData = localStorage.getItem('studentData');
    if (storedData) {
      setStudentData(JSON.parse(storedData));
    } else {
      setStudentData(mockStudentData);
    }
    
    // Load profile avatar
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
  }, []);

  const exams = useMemo(() => Array.from(new Set(studentData.map(d => d.exam_name))).sort(), [studentData]);
  const classes = useMemo(() => Array.from(new Set(studentData.map(d => d.class))).sort(), [studentData]);

  useEffect(() => {
    if (studentData.length > 0) {
      localStorage.setItem('studentData', JSON.stringify(studentData));
      
      if (selectedExam && !exams.includes(selectedExam)) {
        setSelectedExam(exams[0] || '');
      } else if (!selectedExam && exams.length > 0) {
        setSelectedExam(exams[0]);
      }
    }
  }, [studentData, selectedExam, exams]);
  
  const setProfileAvatar = (url: string) => {
    setProfileAvatarState(url);
    localStorage.setItem('profileAvatar', url);
  }

  const addStudentData = (newData: StudentExamResult[]) => {
    setStudentData(prevData => {
        const updatedData = [...prevData];
        newData.forEach(newItem => {
            const exists = updatedData.some(
                item => item.exam_name === newItem.exam_name && item.student_no === newItem.student_no
            );
            if (!exists) {
                updatedData.push(newItem);
            }
        });
        return updatedData;
    });
  };

  const deleteExam = (examNameToDelete: string) => {
    setStudentData(prevData => prevData.filter(d => d.exam_name !== examNameToDelete));
  };

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
