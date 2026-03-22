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

import { Dialog } from '@base-ui/react/dialog'
import { run } from '@mdx-js/mdx'
import { X } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import * as jsxRuntime from 'react/jsx-runtime'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { InlineIcon } from '~/features/help/components/mdx/inline-icon'
import { Note } from '~/features/help/components/mdx/note'
import { Tip } from '~/features/help/components/mdx/tip'
import { Warning } from '~/features/help/components/mdx/warning'
import { routeToHelpFile } from '~/features/help/lib/route-to-help-file'
import { useHelpStore } from '~/features/help/store/help-store'

const FALLBACK_LOCALE = 'en'

/** MDX components for styling help content */
const mdxComponents = {
	a: ({ children, href }: { children: React.ReactNode; href?: string }) => (
		<a
			className="text-primary hover:underline"
			href={href}
			rel="noopener noreferrer"
			target="_blank"
		>
			{children}
		</a>
	),
	blockquote: ({ children }: { children: React.ReactNode }) => (
		<blockquote className="border-primary mb-4 border-l-4 pl-4 italic">
			{children}
		</blockquote>
	),
	code: ({ children }: { children: React.ReactNode }) => (
		<code className="bg-base-200 rounded px-1.5 py-0.5 font-mono text-sm">
			{children}
		</code>
	),
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
	Icon: ({ name, size }: { name: string; size?: number }) => (
		<InlineIcon
			name={name as React.ComponentProps<typeof InlineIcon>['name']}
			size={size}
		/>
	),
	li: ({ children }: { children: React.ReactNode }) => (
		<li className="mb-1">{children}</li>
	),
	Note: ({ children }: { children: React.ReactNode }) => (
		<Note>{children}</Note>
	),
	ol: ({ children }: { children: React.ReactNode }) => (
		<ol className="mt-4 mb-4 list-decimal pl-6">{children}</ol>
	),
	p: ({ children }: { children: React.ReactNode }) => (
		<p className="mt-4 mb-4 leading-relaxed">{children}</p>
	),
	pre: ({ children }: { children: React.ReactNode }) => (
		<pre className="bg-base-200 mb-4 overflow-x-auto rounded-lg p-4">
			{children}
		</pre>
	),
	Tip: ({ children }: { children: React.ReactNode }) => <Tip>{children}</Tip>,
	ul: ({ children }: { children: React.ReactNode }) => (
		<ul className="mt-4 mb-4 list-disc pl-6">{children}</ul>
	),
	Warning: ({ children }: { children: React.ReactNode }) => (
		<Warning>{children}</Warning>
	),
}

export const HelpDrawer = () => {
	const { closeHelp, customHelpFile, isOpen } = useHelpStore()
	const { i18n, t } = useTranslation('common')
	const location = useLocation()
	const [mdxContent, setMdxContent] = useState<React.ReactNode>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(false)
	const [isFallbackLanguage, setIsFallbackLanguage] = useState(false)

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			closeHelp()
		}
	}

	useEffect(() => {
		if (!isOpen) return

		const loadHelpContent = async () => {
			setMdxContent(null)
			setLoading(true)
			setError(false)
			setIsFallbackLanguage(false)

			try {
				const helpFileName =
					customHelpFile ?? routeToHelpFile(location.pathname)
				const locale = i18n.language

				// Try user's locale first
				let response = await fetch(`/api/help/${locale}/${helpFileName}`)

				// Fallback to English if locale not found
				if (!response.ok && locale !== FALLBACK_LOCALE) {
					response = await fetch(`/api/help/${FALLBACK_LOCALE}/${helpFileName}`)
					if (response.ok) {
						setIsFallbackLanguage(true)
					}
				}

				if (!response.ok) {
					throw new Error('Help file not found')
				}

				const { code } = await response.json()

				// Run the compiled MDX code to get a React component
				const { default: MdxComponent } = await run(code, {
					...jsxRuntime,
					baseUrl: import.meta.url,
					Fragment,
				})

				setMdxContent(<MdxComponent components={mdxComponents} />)
			} catch {
				setError(true)
			} finally {
				setLoading(false)
			}
		}

		void loadHelpContent()
	}, [isOpen, location.pathname, i18n.language, customHelpFile])

	return (
		<Dialog.Root modal onOpenChange={handleOpenChange} open={isOpen}>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
				<div className="fixed inset-0 z-50 overflow-hidden">
					<div className="absolute inset-0 overflow-hidden">
						<div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
							<Dialog.Popup className="pointer-events-auto w-screen max-w-[90vw] transform transition-transform duration-300 data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px]">
								<div className="bg-base-100 flex h-full flex-col shadow-2xl">
									{/* Header */}
									<div className="border-base-300 border-b px-6 py-4">
										<div className="flex items-center justify-between">
											<Dialog.Title className="text-lg font-semibold">
												{t('common.actions.help', {
													defaultValue: 'Help',
												})}
											</Dialog.Title>
											<Dialog.Close
												render={
													<Button
														aria-label={t('common.actions.close', {
															defaultValue: 'Close',
														})}
														fullWidth={false}
														shape="circle"
														size="sm"
														variant="ghost"
													>
														<LucideIcon icon={X} size={20} />
													</Button>
												}
											/>
										</div>
									</div>

									{/* Content */}
									<div className="flex-1 overflow-y-auto px-8 py-6">
										{loading && (
											<div className="flex items-center justify-center py-12">
												<span className="loading loading-spinner loading-lg" />
											</div>
										)}

										{error && !loading && (
											<div className="alert alert-warning">
												<p>
													{t('common.errors.helpNotAvailable', {
														defaultValue:
															'Help content not available for this page.',
													})}
												</p>
											</div>
										)}

										{isFallbackLanguage && !loading && !error && (
											<div className="alert alert-info mb-4">
												<p>
													{t('common.info.helpFallbackLanguage', {
														defaultValue:
															'This help content is not available in your selected language yet. Showing English version.',
													})}
												</p>
											</div>
										)}

										{mdxContent && !loading && !error && (
											<div className="prose prose-sm max-w-none">
												{mdxContent}
											</div>
										)}
									</div>
								</div>
							</Dialog.Popup>
						</div>
					</div>
				</div>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
