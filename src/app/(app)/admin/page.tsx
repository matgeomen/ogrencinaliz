"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { useFirebase } from '@/firebase/provider';
import { useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, User as UserIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPage() {
    const router = useRouter();
    const { firestore } = useFirebase();
    const { user: currentUser, isUserLoading: isAuthLoading } = useUser();
    
    const userProfileRef = useMemoFirebase(() => {
        if (firestore && currentUser) {
            return doc(firestore, 'users', currentUser.uid);
        }
        return null;
    }, [firestore, currentUser]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const usersCollectionRef = useMemoFirebase(() => {
        if (firestore && userProfile?.role === 'admin') {
            return collection(firestore, 'users');
        }
        return null;
    }, [firestore, userProfile]);

    const { data: users, isLoading: areUsersLoading } = useCollection<UserProfile>(usersCollectionRef);

    useEffect(() => {
        if (!isAuthLoading && !isProfileLoading && userProfile?.role !== 'admin') {
            router.replace('/dashboard');
        }
    }, [isAuthLoading, isProfileLoading, userProfile, router]);


    const isLoading = isAuthLoading || isProfileLoading;

    if (isLoading) {
        return (
             <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (userProfile?.role !== 'admin') {
         return (
             <div className="flex h-[80vh] w-full items-center justify-center">
                <p>Yönetici yetkiniz yok.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Admin Paneli"
                description="Kullanıcıları ve sistem ayarlarını yönetin."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Kullanıcı Listesi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>E-posta</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Kayıt Tarihi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {areUsersLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={3}><Skeleton className="h-6" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : users && users.length > 0 ? (
                                    users.map(u => (
                                        <TableRow key={u.uid}>
                                            <TableCell className="font-medium">{u.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                                                    {u.role === 'admin' ? <Shield className="mr-1 h-3 w-3" /> : <UserIcon className="mr-1 h-3 w-3" />}
                                                    {u.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {u.createdAt?.toDate ? format(u.createdAt.toDate(), 'dd.MM.yyyy HH:mm') : 'Bilinmiyor'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            Hiç kullanıcı bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
