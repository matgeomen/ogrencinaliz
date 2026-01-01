import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
}

export function PageHeader({ title, description, className, children, ...props }: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl font-headline">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}
