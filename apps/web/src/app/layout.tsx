import type { Metadata } from 'next';
import '@xyflow/react/dist/style.css';
import './globals.css';
import { product } from '../lib/config';
export const metadata: Metadata = { title: `${product.name} — Ruang Belajar Algoritma`, description: 'Susun algoritma lewat flowchart, satu langkah setiap kali.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="id"><body>{children}</body></html>;
}
