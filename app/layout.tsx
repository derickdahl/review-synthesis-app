import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sonance Review Synthesis | AI-Powered Performance Reviews',
  description: 'Professional AI-powered performance review synthesis tool for modern organizations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FAFAFA 0%, #F0F0F0 100%)' }}>
          <header className="sonance-card border-0 rounded-none shadow-sm">
            <div className="sonance-accent-bar"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <div>
                      <h1 className="sonance-title text-xl">
                        Sonance Review Synthesis
                      </h1>
                      <p className="sonance-subtitle text-xs">
                        Powered by AI Technology
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="sonance-subtitle text-sm">
                      Professional Performance Reviews
                    </div>
                    <div className="text-xs text-gray-400">
                      Confidential & Secure
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main className="py-8">
            {children}
          </main>
          <footer className="mt-16 py-8 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="sonance-subtitle text-sm">© 2026 Sonance</span>
                  <span className="text-gray-300">•</span>
                  <span className="sonance-subtitle text-sm">Enterprise Solutions</span>
                </div>
                <div className="sonance-subtitle text-sm">
                  Built with AI Excellence
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}