"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Input,
} from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDocs, collection } from 'firebase/firestore';
import { useFirebase } from '@/firebase';


const loginSchema = z.object({
  email: z.string().email({ message: 'Geçerli bir e-posta adresi girin.' }),
  password: z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır.' }),
});

const registerSchema = z.object({
  email: z.string().email({ message: 'Geçerli bir e-posta adresi girin.' }),
  password: z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır.' }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor.",
  path: ["confirmPassword"],
});


type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onLoginSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({ title: 'Giriş başarılı!', description: 'Kontrol merkezine yönlendiriliyorsunuz...' });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Giriş hatası',
        description: error.message || 'Bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    setIsLoading(true);
    try {
      // Check if there are any users already
      const usersCollectionRef = collection(firestore, "users");
      const usersSnapshot = await getDocs(usersCollectionRef);
      const isFirstUser = usersSnapshot.empty;

      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Save user to Firestore with appropriate role
      const userRef = doc(firestore, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        role: isFirstUser ? 'admin' : 'user', // Assign 'admin' if first user
        createdAt: serverTimestamp(),
        storagePreference: 'local',
        displayName: user.email?.split('@')[0] || 'Yeni Kullanıcı',
        photoURL: '',
      });
      
      toast({ title: 'Kayıt başarılı!', description: isFirstUser ? 'Admin olarak giriş yapılıyor...' : 'Giriş yapabilirsiniz.' });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Kayıt hatası',
        description: error.message || 'Bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
       <div className="absolute top-8 flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary"/>
            <h1 className="text-2xl font-bold">LGS Radar</h1>
        </div>
      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Giriş Yap</TabsTrigger>
          <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Hesabınıza Giriş Yapın</CardTitle>
              <CardDescription>
                Devam etmek için bilgilerinizi girin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-posta</FormLabel>
                        <FormControl>
                          <Input placeholder="ornek@eposta.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Şifre</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Giriş Yap
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="register">
            <Card>
                <CardHeader>
                    <CardTitle>Yeni Hesap Oluştur</CardTitle>
                    <CardDescription>Başlamak için bir hesap oluşturun.</CardDescription>
                </Header>
                <CardContent>
                    <Form {...registerForm}>
                        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                            <FormField control={registerForm.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>E-posta</FormLabel><FormControl><Input placeholder="ornek@eposta.com" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={registerForm.control} name="password" render={({ field }) => (
                                <FormItem><FormLabel>Şifre</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={registerForm.control} name="confirmPassword" render={({ field }) => (
                                <FormItem><FormLabel>Şifre Tekrar</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Kayıt Ol
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
