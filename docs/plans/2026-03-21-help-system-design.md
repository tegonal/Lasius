# Help System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Port the context-sensitive help drawer from the Next.js frontend to the React Router 7 frontend, so users can view locale-aware MDX help content based on the current route.

**Architecture:** Headless UI `Dialog` drawer mounted globally in `root.tsx`, driven by a Zustand store. MDX files are compiled server-side via a resource route using `@mdx-js/mdx` and rendered client-side with `mdx-js/mdx`'s `run()`. Route-to-file mapping converts the current pathname into an MDX filename. Locale fallback from user's language to `en`.

**Tech Stack:** React Router 7, Zustand 5, Headless UI React, @mdx-js/mdx, lucide-react, react-i18next

---

## File Structure

```
app/features/help/
├── components/
│   ├── help-drawer.tsx          # Right-side drawer + MDX rendering
│   ├── help-button.tsx          # Global nav trigger (ghost icon button)
│   └── mdx/
│       ├── tip.tsx              # <Tip> callout
│       ├── note.tsx             # <Note> callout
│       ├── warning.tsx          # <Warning> callout
│       └── inline-icon.tsx      # <InlineIcon name="..." /> dynamic icon
├── store/
│   └── help-store.ts            # Zustand store (isOpen, customHelpFile)
└── lib/
    └── route-to-help-file.ts    # Route pathname → MDX filename mapping

app/routes/
└── api.help.$locale.$slug.ts    # Resource route: server-side MDX compilation

public/help/
├── en/   (19 files)
├── de/   (19 files)
├── fr/   (19 files)
├── it/   (18 files)
└── es/   (19 files)
```

---

### Task 1: Install Dependencies

**Files:**
- Modify: `frontend_rr7/package.json`

**Step 1: Install packages**

Run from `frontend_rr7/`:
```bash
yarn add @headlessui/react @mdx-js/mdx
```

**Step 2: Verify**

Run: `yarn check`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend_rr7/package.json frontend_rr7/yarn.lock
git commit -m "feat(help): add @headlessui/react and @mdx-js/mdx dependencies"
```

---

### Task 2: Create Zustand Help Store

**Files:**
- Create: `frontend_rr7/app/features/help/store/help-store.ts`

**Step 1: Write the store**

```typescript
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

import { create } from 'zustand'

interface HelpStore {
	closeHelp: () => void
	customHelpFile: string | null
	isOpen: boolean
	openHelp: (customFile?: string) => void
	toggleHelp: () => void
}

export const useHelpStore = create<HelpStore>((set) => ({
	closeHelp: () => set({ customHelpFile: null, isOpen: false }),
	customHelpFile: null,
	isOpen: false,
	openHelp: (customFile?: string) =>
		set({ customHelpFile: customFile ?? null, isOpen: true }),
	toggleHelp: () =>
		set((state) => ({ customHelpFile: null, isOpen: !state.isOpen })),
}))
```

**Step 2: Verify**

Run: `yarn check`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend_rr7/app/features/help/store/help-store.ts
git commit -m "feat(help): add Zustand help store"
```

---

### Task 3: Create Route-to-Help-File Mapping

**Files:**
- Create: `frontend_rr7/app/features/help/lib/route-to-help-file.ts`

**Step 1: Write the mapping function**

```typescript
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

/**
 * Converts a route pathname to an MDX help file name.
 *
 * Examples:
 *   /user/home       → user-home
 *   /organisation/projects → organisation-projects
 *   /                → login
 *   /settings/[id]   → settings-dynamic
 */
export const routeToHelpFile = (path: string): string => {
	// Remove leading slash and replace remaining slashes with hyphens
	let normalized = path.replace(/^\//, '').replace(/\//g, '-')

	// Handle root/index
	if (normalized === '') {
		normalized = 'login'
	}

	// Handle dynamic route segments (React Router uses :param syntax)
	normalized = normalized.replace(/:[^-/]+/g, 'dynamic')

	return normalized
}
```

**Step 2: Verify**

Run: `yarn check`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend_rr7/app/features/help/lib/route-to-help-file.ts
git commit -m "feat(help): add route-to-help-file mapping utility"
```

---

### Task 4: Create MDX Callout Components

**Files:**
- Create: `frontend_rr7/app/features/help/components/mdx/tip.tsx`
- Create: `frontend_rr7/app/features/help/components/mdx/note.tsx`
- Create: `frontend_rr7/app/features/help/components/mdx/warning.tsx`
- Create: `frontend_rr7/app/features/help/components/mdx/inline-icon.tsx`

**Step 1: Write Tip component**

```typescript
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

import { Lightbulb } from 'lucide-react'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'

interface TipProps {
	children: React.ReactNode
}

export const Tip = ({ children }: TipProps) => {
	return (
		<div className="mb-3 flex gap-2">
			<span className="text-warning flex-shrink-0">
				<LucideIcon icon={Lightbulb} size={20} />
			</span>
			<span className="leading-relaxed">{children}</span>
		</div>
	)
}
```

**Step 2: Write Note component**

```typescript
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

import { Info } from 'lucide-react'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'

interface NoteProps {
	children: React.ReactNode
}

export const Note = ({ children }: NoteProps) => {
	return (
		<div className="mb-3 flex gap-2">
			<span className="text-info flex-shrink-0">
				<LucideIcon icon={Info} size={20} />
			</span>
			<span className="leading-relaxed">{children}</span>
		</div>
	)
}
```

**Step 3: Write Warning component**

```typescript
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

import { TriangleAlert } from 'lucide-react'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'

interface WarningProps {
	children: React.ReactNode
}

export const Warning = ({ children }: WarningProps) => {
	return (
		<div className="mb-3 flex gap-2">
			<span className="text-error flex-shrink-0">
				<LucideIcon icon={TriangleAlert} size={20} />
			</span>
			<span className="leading-relaxed">{children}</span>
		</div>
	)
}
```

**Step 4: Write InlineIcon component**

```typescript
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

import * as LucideIcons from 'lucide-react'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'

import type { LucideIcon as LucideIconType } from 'lucide-react'

interface InlineIconProps {
	name: keyof typeof LucideIcons
	size?: number
}

export const InlineIcon = ({ name, size = 18 }: InlineIconProps) => {
	const IconComponent = LucideIcons[name] as LucideIconType

	if (!IconComponent) {
		return <span>{name}</span>
	}

	return (
		<span className="inline-flex align-middle">
			<LucideIcon icon={IconComponent} size={size} />
		</span>
	)
}
```

**Step 5: Verify**

Run: `yarn check`
Expected: PASS

**Step 6: Commit**

```bash
git add frontend_rr7/app/features/help/components/mdx/
git commit -m "feat(help): add MDX callout components (Tip, Note, Warning, InlineIcon)"
```

---

### Task 5: Create Resource Route for MDX Compilation

**Files:**
- Create: `frontend_rr7/app/routes/api.help.$locale.$slug.ts`
- Modify: `frontend_rr7/app/routes.ts` (add route)

**Step 1: Write the resource route**

This is the React Router 7 equivalent of the Next.js API route. It reads an `.mdx` file from disk, compiles it server-side using `@mdx-js/mdx`'s `compile()`, and returns the compiled JS as JSON. The client will use `run()` from `@mdx-js/mdx` to execute it.

```typescript
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

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { compile } from '@mdx-js/mdx'
import { data } from 'react-router'

import type { Route } from './+types/api.help.$locale.$slug'

/**
 * Resource route for server-side MDX compilation of help files.
 *
 * Route: /api/help/:locale/:slug
 * Example: /api/help/en/user-home
 *
 * Returns compiled MDX JS string as JSON. Client uses @mdx-js/mdx `run()` to render.
 * This keeps the MDX compiler out of the client bundle.
 */
export async function loader({ params }: Route.LoaderArgs) {
	const { locale, slug } = params

	if (!locale || !slug) {
		return data({ error: 'Invalid parameters' }, { status: 400 })
	}

	// Sanitize inputs to prevent path traversal
	const safeLocale = locale.replace(/[^a-z-]/g, '')
	const safeSlug = slug.replace(/[^a-z0-9-]/g, '')

	const filePath = join(
		process.cwd(),
		'public',
		'help',
		safeLocale,
		`${safeSlug}.mdx`,
	)

	if (!existsSync(filePath)) {
		return data({ error: 'Help file not found' }, { status: 404 })
	}

	try {
		const mdxText = readFileSync(filePath, 'utf8')

		const compiled = await compile(mdxText, {
			outputFormat: 'function-body',
			development: false,
		})

		return data(
			{ code: String(compiled) },
			{
				headers: {
					'Cache-Control':
						'public, s-maxage=3600, stale-while-revalidate',
				},
			},
		)
	} catch {
		return data({ error: 'Failed to compile MDX' }, { status: 500 })
	}
}
```

**Step 2: Add route to routes.ts**

Add this line in the API routes section of `frontend_rr7/app/routes.ts`:

```typescript
route('api/help/:locale/:slug', 'routes/api.help.$locale.$slug.ts'),
```

The routes.ts API section should look like:

```typescript
// API routes (public)
route('api/session-status', 'routes/api.session-status.tsx'),
route('api/locales/:lang/:ns', 'routes/api.locales.$lang.$ns.ts'),
route('api/help/:locale/:slug', 'routes/api.help.$locale.$slug.ts'),
```

**Step 3: Verify**

Run: `yarn check`
Expected: PASS

**Step 4: Commit**

```bash
git add frontend_rr7/app/routes/api.help.$locale.$slug.ts frontend_rr7/app/routes.ts
git commit -m "feat(help): add resource route for server-side MDX compilation"
```

---

### Task 6: Create HelpDrawer Component

**Files:**
- Create: `frontend_rr7/app/features/help/components/help-drawer.tsx`

**Step 1: Write the HelpDrawer**

This is the core component. Key differences from the Next.js version:
- Uses `useLocation()` from React Router instead of `useRouter()` from Next.js
- Uses `@mdx-js/mdx`'s `run()` instead of `next-mdx-remote`'s `MDXRemote`
- Uses `Fragment` and `jsx`/`jsxs` from `react/jsx-runtime` for `run()`
- Locale comes from `useTranslation()` hook (same as Next.js)
- Fallback locale is `'en'` (hardcoded, same as Next.js `DEFAULT_LOCALE`)

```typescript
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

import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from '@headlessui/react'
import { run } from '@mdx-js/mdx'
import { X } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as jsxRuntime from 'react/jsx-runtime'
import { useLocation } from 'react-router'

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
	Icon: ({ name, size }: { name: string; size?: number }) => (
		<InlineIcon
			name={name as keyof typeof import('lucide-react')}
			size={size}
		/>
	),
	Note: ({ children }: { children: React.ReactNode }) => (
		<Note>{children}</Note>
	),
	Tip: ({ children }: { children: React.ReactNode }) => (
		<Tip>{children}</Tip>
	),
	Warning: ({ children }: { children: React.ReactNode }) => (
		<Warning>{children}</Warning>
	),
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
	li: ({ children }: { children: React.ReactNode }) => (
		<li className="mb-1">{children}</li>
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
	ul: ({ children }: { children: React.ReactNode }) => (
		<ul className="mt-4 mb-4 list-disc pl-6">{children}</ul>
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

	useEffect(() => {
		if (!isOpen) return

		const loadHelpContent = async () => {
			setLoading(true)
			setError(false)
			setIsFallbackLanguage(false)

			try {
				const helpFileName =
					customHelpFile ?? routeToHelpFile(location.pathname)
				const locale = i18n.language

				// Try user's locale first
				let response = await fetch(
					`/api/help/${locale}/${helpFileName}`,
				)

				// Fallback to English if locale not found
				if (!response.ok && locale !== FALLBACK_LOCALE) {
					response = await fetch(
						`/api/help/${FALLBACK_LOCALE}/${helpFileName}`,
					)
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
					Fragment,
					baseUrl: import.meta.url,
				})

				setMdxContent(<MdxComponent components={mdxComponents} />)
			} catch {
				setError(true)
			} finally {
				setLoading(false)
			}
		}

		loadHelpContent()
	}, [isOpen, location.pathname, i18n.language, customHelpFile])

	return (
		<Dialog className="relative z-50" onClose={closeHelp} open={isOpen}>
			{/* Backdrop */}
			<DialogBackdrop
				className="fixed inset-0 bg-black/20 duration-300 ease-out data-[closed]:opacity-0"
				transition
			/>

			{/* Drawer */}
			<div className="fixed inset-0 overflow-hidden">
				<div className="absolute inset-0 overflow-hidden">
					<div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
						<DialogPanel
							className="pointer-events-auto w-screen max-w-[90vw] transform transition duration-300 ease-out data-[closed]:translate-x-full sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px]"
							transition
						>
							<div className="bg-base-100 flex h-full flex-col shadow-2xl">
								{/* Header */}
								<div className="border-base-300 border-b px-6 py-4">
									<div className="flex items-center justify-between">
										<DialogTitle className="text-lg font-semibold">
											{t('common.actions.help', {
												defaultValue: 'Help',
											})}
										</DialogTitle>
										<Button
											aria-label={t(
												'common.actions.close',
												{ defaultValue: 'Close' },
											)}
											fullWidth={false}
											onClick={closeHelp}
											shape="circle"
											size="sm"
											variant="ghost"
										>
											<LucideIcon icon={X} size={20} />
										</Button>
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
												{t(
													'common.errors.helpNotAvailable',
													{
														defaultValue:
															'Help content not available for this page.',
													},
												)}
											</p>
										</div>
									)}

									{isFallbackLanguage &&
										!loading &&
										!error && (
											<div className="alert alert-info mb-4">
												<p>
													{t(
														'common.info.helpFallbackLanguage',
														{
															defaultValue:
																'This help content is not available in your selected language yet. Showing English version.',
														},
													)}
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
						</DialogPanel>
					</div>
				</div>
			</div>
		</Dialog>
	)
}
```

**Step 2: Verify**

Run: `yarn check`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend_rr7/app/features/help/components/help-drawer.tsx
git commit -m "feat(help): add HelpDrawer component with MDX rendering"
```

---

### Task 7: Create HelpButton Component

**Files:**
- Create: `frontend_rr7/app/features/help/components/help-button.tsx`

**Step 1: Write the HelpButton**

Simplified version without Plausible telemetry (not yet set up in frontend_rr7). Uses the existing `Button` and `LucideIcon` components.

```typescript
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

import { HelpCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { useHelpStore } from '~/features/help/store/help-store'

export const HelpButton = () => {
	const { t } = useTranslation('common')
	const { toggleHelp } = useHelpStore()

	return (
		<Button
			aria-label={t('common.actions.help', { defaultValue: 'Help' })}
			data-testid="help-btn"
			fullWidth={false}
			onClick={toggleHelp}
			shape="circle"
			variant="ghost"
		>
			<LucideIcon icon={HelpCircle} size={20} />
		</Button>
	)
}
```

**Step 2: Verify**

Run: `yarn check`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend_rr7/app/features/help/components/help-button.tsx
git commit -m "feat(help): add HelpButton component"
```

---

### Task 8: Mount HelpDrawer in root.tsx

**Files:**
- Modify: `frontend_rr7/app/root.tsx`

**Step 1: Add HelpDrawer to Layout**

Import the `HelpDrawer` and render it after `<Scripts />` in the `Layout` component.

Add import at top of file:
```typescript
import { HelpDrawer } from '~/features/help/components/help-drawer'
```

In the `Layout` function, add `<HelpDrawer />` after `<Scripts />`:

```tsx
<body>
	{children}
	<ScrollRestoration />
	<Scripts />
	<HelpDrawer />
</body>
```

**Step 2: Verify**

Run: `yarn check`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend_rr7/app/root.tsx
git commit -m "feat(help): mount HelpDrawer globally in root layout"
```

---

### Task 9: Add HelpButton to Login Page

**Files:**
- Modify: `frontend_rr7/app/routes/login.tsx`

**Step 1: Add HelpButton to login page**

Import and add the `HelpButton` below the provider buttons section (after the demo mode info block, before closing `</CardBody>`).

Add import:
```typescript
import { HelpButton } from '~/features/help/components/help-button'
```

Add the HelpButton after the `{/* Demo mode info */}` block and before `</CardBody>`:

```tsx
{/* Help */}
<div className="mt-6 flex justify-center">
	<HelpButton />
</div>
```

**Step 2: Verify**

Run: `yarn check`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend_rr7/app/routes/login.tsx
git commit -m "feat(help): add HelpButton to login page"
```

---

### Task 10: Copy MDX Content Files

**Files:**
- Create: `frontend_rr7/public/help/` (entire directory tree)

**Step 1: Copy all help content from frontend**

```bash
cp -r frontend/public/help frontend_rr7/public/help
```

**Step 2: Verify files were copied**

```bash
ls frontend_rr7/public/help/
# Expected: de  en  es  fr  it

ls frontend_rr7/public/help/en/ | wc -l
# Expected: 19
```

**Step 3: Commit**

```bash
git add frontend_rr7/public/help/
git commit -m "feat(help): copy MDX help content files (5 locales)"
```

---

### Task 11: Manual Smoke Test

**No files to modify — manual verification only.**

**Step 1: Start the dev server** (if not running)

```bash
cd frontend_rr7 && yarn dev
```

**Step 2: Open login page**

Navigate to `http://localhost:3000/login`

**Step 3: Click the help button**

- The help drawer should slide in from the right
- It should show content from `public/help/en/login.mdx`
- The close button (X) should dismiss it
- Clicking the backdrop should also dismiss it

**Step 4: Test locale fallback**

Switch browser language to Italian and verify:
- If `it/login.mdx` exists → shows Italian content
- If a file is missing in `it/` → shows English fallback with info banner

---

## Dependency Summary

| Package | Version | Purpose |
|---------|---------|---------|
| `@headlessui/react` | latest | Dialog/drawer component |
| `@mdx-js/mdx` | latest | Server-side MDX compilation + client-side `run()` |

Already installed: `zustand`, `lucide-react`, `react-i18next`, `react-router`

## Key Differences from Next.js Version

| Aspect | Next.js | React Router 7 |
|--------|---------|----------------|
| Router hook | `useRouter()` → `router.pathname` | `useLocation()` → `location.pathname` |
| MDX rendering | `next-mdx-remote` (serialize/MDXRemote) | `@mdx-js/mdx` (compile/run) |
| API route | `pages/api/help/[locale]/[...slug].ts` | `routes/api.help.$locale.$slug.ts` resource route |
| Location | `components/ui/overlays/` + `stores/` | `features/help/` (all-in-one feature directory) |
| Telemetry | Plausible events on help open | Deferred (not yet set up) |
