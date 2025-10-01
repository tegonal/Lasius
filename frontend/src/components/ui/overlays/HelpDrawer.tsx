/**
 * Lasius - Open source time tracker for teams
 * Copyright (c) Tegonal Genossenschaft (https://tegonal.com)
 *
 * This file is part of Lasius.
 *
 * Lasius is free software: you can redistribute it and/or modify it under the terms of the
 * GNU Affero General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * Lasius is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Lasius.
 * If not, see <https://www.gnu.org/licenses/>.
 *
 */

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Button } from 'components/primitives/buttons/Button'
import { InlineIcon } from 'components/ui/help/InlineIcon'
import { Tip } from 'components/ui/help/Tip'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { AnimatePresence, m } from 'framer-motion'
import { X } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { useHelpStore } from 'stores/helpStore'

// MDX components for styling
const mdxComponents = {
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="mb-4 text-3xl font-bold">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="border-base-content/20 mt-12 mb-3 border-b pb-2 text-2xl font-semibold">
      {children}
    </h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="mt-8 mb-2 text-xl font-semibold">{children}</h3>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mt-4 mb-4 leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="mt-4 mb-4 list-disc pl-6">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="mt-4 mb-4 list-decimal pl-6">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => <li className="mb-1">{children}</li>,
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="bg-base-200 rounded px-1.5 py-0.5 font-mono text-sm">{children}</code>
  ),
  pre: ({ children }: { children: React.ReactNode }) => (
    <pre className="bg-base-200 mb-4 overflow-x-auto rounded-lg p-4">{children}</pre>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-primary mb-4 border-l-4 pl-4 italic">{children}</blockquote>
  ),
  a: ({ children, href }: { children: React.ReactNode; href?: string }) => (
    <a
      href={href}
      className="text-primary hover:underline"
      target="_blank"
      rel="noopener noreferrer">
      {children}
    </a>
  ),
  Tip: ({ children }: { children: React.ReactNode }) => <Tip>{children}</Tip>,
  Icon: ({ name, size }: { name: string; size?: number }) => (
    <InlineIcon name={name as keyof typeof import('lucide-react')} size={size} />
  ),
}

// Route to help file mapping
const routeToHelpFile = (path: string): string => {
  // Remove leading slash and replace remaining slashes with hyphens
  // /user/home -> user-home
  // /organisation/projects -> organisation-projects
  let normalized = path.replace(/^\//, '').replace(/\//g, '-')

  // Handle root/index
  if (normalized === '') {
    normalized = 'login'
  }

  // Handle dynamic routes by removing brackets
  normalized = normalized.replace(/\[.*?\]/g, 'dynamic')

  return normalized
}

export const HelpDrawer: React.FC = () => {
  const { isOpen, closeHelp, customHelpFile } = useHelpStore()
  const { i18n, t } = useTranslation('common')
  const router = useRouter()
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const loadHelpContent = async () => {
      setLoading(true)
      setError(false)

      try {
        const helpFileName = customHelpFile || routeToHelpFile(router.pathname)
        const locale = i18n.language
        const response = await fetch(`/help/${locale}/${helpFileName}.mdx`)

        if (!response.ok) {
          throw new Error('Help file not found')
        }

        const mdxText = await response.text()
        const mdxResult = await serialize(mdxText)
        setMdxSource(mdxResult)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    loadHelpContent()
  }, [isOpen, router.pathname, i18n.language, customHelpFile])

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onClose={closeHelp} className="relative z-50">
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed inset-0 bg-black/20"
          />

          {/* Drawer */}
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
                <DialogPanel
                  as={m.div}
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={
                    {
                      duration: 0.3,
                      ease: 'easeInOut',
                    } as any
                  }
                  className="pointer-events-auto w-screen max-w-[90vw] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px]">
                  <div className="bg-base-100 flex h-full flex-col shadow-2xl">
                    {/* Header */}
                    <div className="border-base-300 border-b px-6 py-4">
                      <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-semibold">
                          {t('common.actions.help', { defaultValue: 'Help' })}
                        </DialogTitle>
                        <Button
                          onClick={closeHelp}
                          variant="ghost"
                          shape="circle"
                          size="sm"
                          fullWidth={false}>
                          <LucideIcon icon={X} size={20} />
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-8 py-6">
                      {loading && (
                        <div className="flex items-center justify-center py-12">
                          <span className="loading loading-spinner loading-lg"></span>
                        </div>
                      )}

                      {error && !loading && (
                        <div className="alert alert-warning">
                          <p>
                            {t('common.errors.helpNotAvailable', {
                              defaultValue: 'Help content not available for this page.',
                            })}
                          </p>
                        </div>
                      )}

                      {mdxSource && !loading && !error && (
                        <div className="prose prose-sm max-w-none">
                          <MDXRemote {...mdxSource} components={mdxComponents} />
                        </div>
                      )}
                    </div>
                  </div>
                </DialogPanel>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
