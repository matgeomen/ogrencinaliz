# **App Name**: LGS Radar

## Core Features:

- Demo/PHP Mode Selection: Allow users to switch between demo mode (localStorage) and PHP mode (fetch API).
- Excel Import: Import student exam data from Excel files, supporting both local parsing (SheetJS) in demo mode and server-side processing via PHP upload.
- Dashboard Statistics: Calculate and display key statistics such as total students, average net score, average total score, and success rate.
- Student Performance Analysis: Display student-specific data, along with modal view with ders bazli bar chart
- AI Analysis rapor: Employ a generative AI tool that reasons about student results at a selected school and generates insights to support or highlight areas needing attention.
- PDF import and process: import student exam data from pdf files, and show the student informations at the dashboard
- AI desteki E-okul veri analizi: Çekilen e okul verilerini kullanarak not ortalamasını ve der başarısını ders bazlı tablo ve ya grafik oluştur ve göster

## Style Guidelines:

- Primary color: Deep indigo (#3F51B5) to convey trust and intellect.
- Background color: Very light gray (#F5F5F5) to ensure readability and a clean look.
- Accent color: Muted teal (#4CAF50) to highlight important actions.
- Body text and headline font: 'Inter', sans-serif
- Use simple, line-based icons from a consistent set (e.g., Font Awesome) to maintain a clean and modern aesthetic.
- Fixed sidebar on the left, collapsing to 70px width. Top bar with search, exam dropdown, and profile image. Use 'active' class to highlight the current page.
- Subtle transitions for page loads and modal appearances to provide a smooth user experience.