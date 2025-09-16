import { Inter } from 'next/font/google';
import './globals.css';
import Layout from '../components/layout/Layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ICTAAA 2026',
  description: 'Sustainable Innovations in Management in the Digital Transformation Era',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  );
}