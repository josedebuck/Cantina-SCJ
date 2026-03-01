import "./globals.css"


export const metadata = {
  title: "Stock Cantina SCJ",
  description: "Sistema de inventario"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-gray-100 text-gray-900">
        {children}
      </body>
    </html>
  )
}