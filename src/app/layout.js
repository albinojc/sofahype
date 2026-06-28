import './globals.css';

export const metadata = {
  title: 'SofáHype',
  description: 'O guia brasileiro para decidir o que assistir.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
