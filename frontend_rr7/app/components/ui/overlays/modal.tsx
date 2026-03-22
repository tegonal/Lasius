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
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '~/lib/utils/cn'

const modalContainerVariants = cva(
	'bg-base-100 text-base-content relative mx-2 rounded-lg p-6 shadow-lg md:mx-0 md:p-8',
	{
		defaultVariants: {
			size: 'md',
		},
		variants: {
			size: {
				auto: 'h-auto w-full max-w-full md:w-auto md:max-w-[80%]',
				lg: 'w-full max-w-full md:w-4/5 md:max-w-[800px]',
				md: 'w-full max-w-full md:w-4/5 md:max-w-[500px]',
				xl: 'w-full max-w-full md:w-4/5 md:max-w-[1200px]',
			},
		},
	},
)

type ModalContainerProps = VariantProps<typeof modalContainerVariants>

interface Props extends ModalContainerProps {
	autoSize?: boolean
	blockViewport?: boolean
	children: React.ReactNode
	minHeight?: number | string
	onClose: () => void
	open: boolean
}

/**
 * Modal component using Base UI Dialog.
 * Provides focus trapping, backdrop click to close, and accessibility.
 */
export const Modal = ({
	autoSize = false,
	blockViewport = false,
	children,
	minHeight,
	onClose,
	open,
	size,
}: Props) => {
	const modalSize = autoSize ? 'auto' : size || 'md'

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen && !blockViewport) {
			onClose()
		}
	}

	return (
		<Dialog.Root modal onOpenChange={handleOpenChange} open={open}>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[5px] transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
				<Dialog.Popup
					className={cn('fixed inset-0 z-50 flex items-center justify-center')}
				>
					<div
						className={cn(
							modalContainerVariants({ size: modalSize }),
							minHeight && 'h-auto',
							'transition-all duration-300 data-[ending-style]:translate-y-full data-[ending-style]:opacity-0 data-[starting-style]:translate-y-full data-[starting-style]:opacity-0',
						)}
						style={{ minHeight: minHeight || undefined }}
					>
						{children}
					</div>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
