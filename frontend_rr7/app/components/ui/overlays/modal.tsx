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
	Transition,
	TransitionChild,
} from '@headlessui/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Fragment } from 'react'

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
 * Modal component using HeadlessUI Dialog.
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
	const handleClose = () => {
		if (!blockViewport) {
			onClose()
		}
	}

	const modalSize = autoSize ? 'auto' : size || 'md'

	return (
		<Transition as={Fragment} show={open}>
			<Dialog className="relative z-50" onClose={handleClose}>
				{/* Backdrop */}
				<TransitionChild
					as={Fragment}
					enter="ease-out duration-300"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-300"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-[5px]" />
				</TransitionChild>

				{/* Modal container */}
				<div className="fixed inset-0 flex items-center justify-center">
					<TransitionChild
						as={Fragment}
						enter="ease-out duration-300"
						enterFrom="opacity-0 translate-y-full"
						enterTo="opacity-100 translate-y-0"
						leave="ease-in duration-300"
						leaveFrom="opacity-100 translate-y-0"
						leaveTo="opacity-0 translate-y-full"
					>
						<DialogPanel
							className={cn(
								modalContainerVariants({ size: modalSize }),
								minHeight && 'h-auto',
							)}
							style={{ minHeight: minHeight || undefined }}
						>
							{children}
						</DialogPanel>
					</TransitionChild>
				</div>
			</Dialog>
		</Transition>
	)
}
