// src/app/layout.tsx

// 1. Importações de Estilos e Tipos Essenciais
import './globals.css'; // Importa o arquivo de estilos globais (que contém o seu style.css)
import type { Metadata } from 'next'; // Importa o tipo 'Metadata' para tipagem
import { Inter } from 'next/font/google'; // Importa a função para otimizar a fonte Inter do Google Fonts

// 2. Configuração da Fonte
const inter = Inter({ subsets: ['latin'] }); // Carrega e configura a fonte Inter, otimizando o carregamento

// 3. Metadados Estáticos da Página
// Esta constante define as informações <meta> que aparecem no cabeçalho <head> da página,
// como o título exibido na aba do navegador e a descrição para mecanismos de busca.
export const metadata: Metadata = {
  title: 'Music-Play Audio Player', // Título principal da aplicação
  description: 'Player de áudio convertido para Next.js', // Descrição da aplicação
};

// 4. Componente de Layout Raiz (RootLayout)
// Este é um componente de servidor que envolve todas as páginas da aplicação.
// Ele define a estrutura HTML fundamental (<html> e <body>).
export default function RootLayout({
  children, // 'children' (filhos) é o conteúdo da página atual (ex: o seu Player.tsx)
}: Readonly<{
  children: React.ReactNode; // Tipagem padrão para o conteúdo filho
}>) {
  return (
    // Estrutura HTML da página
    <html lang="en"> 
      <head>
        {/*
          Adiciona o link do Font Awesome para que os ícones (play, pause, volume, etc.)
          funcionem corretamente na página. Esta é a maneira de incluir recursos externos
          no <head> do Next.js.
        */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      </head>
      
      {/* O <body> recebe a classe da fonte otimizada configurada acima. */}
      <body className={inter.className}>
        {/*
          {children} é o placeholder onde o Next.js renderizará o conteúdo da página
          atual (neste caso, o componente <Player /> importado em page.tsx).
        */}
        {children}
      </body>
    </html>
  );
}