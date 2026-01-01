"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { StudentExamResult } from '@/types';
import { mockStudentData } from '@/lib/mock-data';

interface DataContextType {
  studentData: StudentExamResult[];
  addStudentData: (newData: StudentExamResult[]) => void;
  exams: string[];
  selectedExam: string;
  setSelectedExam: (examName: string) => void;
  classes: string[];
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentExamResult[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');

  useEffect(() => {
    // Simulate loading from localStorage or a server
    // In a real app, you might fetch this from an API or localStorage
    const storedData = localStorage.getItem('studentData');
    if (storedData) {
      setStudentData(JSON.parse(storedData));
    } else {
      setStudentData(mockStudentData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (studentData.length > 0) {
      localStorage.setItem('studentData', JSON.stringify(studentData));
      const uniqueExams = Array.from(new Set(studentData.map(d => d.exam_name)));
      if (!selectedExam && uniqueExams.length > 0) {
        setSelectedExam(uniqueExams[0]);
      }
    }
  }, [studentData, selectedExam]);


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

  const exams = useMemo(() => Array.from(new Set(studentData.map(d => d.exam_name))).sort(), [studentData]);
  const classes = useMemo(() => Array.from(new Set(studentData.map(d => d.class))).sort(), [studentData]);

  const value = {
    studentData,
    addStudentData,
    exams,
    selectedExam,
    setSelectedExam,
    classes,
    loading,
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
