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

import React from 'react'

type Props = {
  size?: number
  className?: string
}

export const LasiusIcon: React.FC<Props> = ({ size = 32, className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 45 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}>
      <path
        d="M14.4688 16.918C14.6301 16.2702 14.8801 15.6211 15.3484 15.145C15.8889 14.5955 16.6665 14.3357 17.4334 14.2576C19.2848 14.069 21.142 14.8544 22.5532 16.0681C23.964 17.2819 24.9786 18.8916 25.8212 20.5514C26.1851 21.268 25.4816 21.3022 24.8767 21.4058C24.3145 21.502 23.7405 21.5125 23.1715 21.5145C21.6909 21.5195 20.1963 21.4611 18.7618 21.0945C17.3272 20.7281 15.9444 20.0315 14.9614 18.924C14.6989 18.6285 14.4605 18.2916 14.3881 17.9032C14.3273 17.5766 14.3887 17.2403 14.4688 16.918ZM0.909212 17.3891C0.370576 19.9586 0.891508 23.3247 2.72298 25.3266C4.53614 27.3084 7.10944 28.8116 9.5667 29.8459C13.0662 31.3189 17.0036 31.7879 20.719 31.2182C24.4914 30.64 28.6567 29.548 32.0873 27.8495C33.1349 27.331 34.2762 26.6406 35.0025 25.7058C35.9223 24.5218 35.3549 23.5418 34.5106 22.4702C31.5937 18.7681 28.1473 15.2461 24.0934 12.7968C22.2281 11.67 19.7965 10.1622 17.6797 9.76439C15.8393 10.8317 14.2881 11.7424 12.3469 12.9483C13.6428 11.8816 14.939 10.8148 16.235 9.74786C17.5687 8.65011 18.9021 7.55224 20.236 6.45453C22.0112 4.99309 24.3538 3.19318 25.2644 2.60391C26.1751 2.01465 27.3536 1.3504 28.6393 1.31826C29.9249 1.28612 36.2648 1.21111 37.6041 2.12179C38.9433 3.03247 39.0317 4.31813 39.5674 5.06809C40.1031 5.81806 42.1629 6.51064 42.8887 5.5502C44.8171 2.2825 39.3365 0.948599 36.9425 0.621855C34.1854 0.245613 30.4089 -0.111261 28.5321 0.0325958C26.6553 0.176453 25.5991 0.600821 24.5802 1.21017C23.5615 1.81951 21.7897 3.07234 20.156 4.4941C19.2935 5.24468 17.56 6.59082 16.6443 7.27315C16.1373 7.65103 15.6336 8.0254 15.0953 8.36551C14.7368 8.59203 13.7726 9.42115 13.357 9.40133C10.3253 9.25726 7.23243 9.90217 4.85861 11.4985C2.92317 12.8003 1.46571 14.7344 0.909212 17.3891Z"
        fill="currentcolor"
      />
    </svg>
  )
}
