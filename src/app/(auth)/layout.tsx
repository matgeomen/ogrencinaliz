import { FirebaseClientProvider } from "@/firebase/client-provider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <div className="min-h-screen bg-secondary">
        {children}
      </div>
    </FirebaseClientProvider>
  );
}