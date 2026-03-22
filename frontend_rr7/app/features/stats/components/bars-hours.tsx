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
	type BarCustomLayerProps,
	type BarDatum,
	ResponsiveBar,
} from '@nivo/bar'
import { line } from 'd3-shape'

import {
	TooltipContainer,
	TooltipItem,
} from '~/components/ui/charts/chart-tooltips'
import {
	getContrastLabelTextColor,
	nivoTheme,
	useNivoColors,
} from '~/components/ui/charts/nivo-theme'
import { type NivoChartDataType } from '~/lib/api/functions/get-nivo-chart-data-from-api-stats-data'

const Line =
	(props: undefined | { category: string; value: number }[]) =>
	(layerProps: BarCustomLayerProps<BarDatum>) => {
		if (!props) return null
		const { bars, xScale, yScale } = layerProps

		const lineBegins = line<{ category: string; value: number }>()
			.x((item) => {
				const scaleValue = xScale(item.category as any)
				return (scaleValue as number) + (bars[0]?.width || 0) / 2
			})
			.y((item) => yScale(item.value) as number)

		return (
			<path
				d={lineBegins(props) || undefined}
				fill="none"
				stroke="oklch(var(--color-secondary))"
				strokeWidth={1}
				style={{ pointerEvents: 'none' }}
			/>
		)
	}

export type BarChartGroupMode = 'grouped' | 'stacked'

type Props = {
	groupMode: BarChartGroupMode
	indexBy: string
	stats:
		| undefined
		| {
				ceilingData: NivoChartDataType
				data: NivoChartDataType
				keys: string[]
		  }
}

export const BarsHours = ({ groupMode, indexBy, stats }: Props) => {
	const nivoColors = useNivoColors()
	const { ceilingData, data, keys } = stats || {}
	if (!data) return null
	return (
		<ResponsiveBar
			axisBottom={{
				tickPadding: 5,
				tickRotation: 0,
				tickSize: 5,
			}}
			axisLeft={{
				tickPadding: 5,
				tickRotation: 0,
				tickSize: 5,
			}}
			axisRight={null}
			axisTop={null}
			borderRadius={3}
			borderWidth={0}
			colors={nivoColors}
			data={data}
			groupMode={groupMode}
			indexBy={indexBy}
			indexScale={{ round: true, type: 'band' }}
			keys={keys}
			label={(d) => `${d.value}h`}
			labelSkipHeight={12}
			labelSkipWidth={20}
			labelTextColor={getContrastLabelTextColor}
			layers={[
				'axes',
				'grid',
				'bars',
				'legends',
				Line(ceilingData as undefined | { category: string; value: number }[]),
			]}
			margin={{ bottom: 60, left: 60, right: 30, top: 25 }}
			padding={0.3}
			theme={nivoTheme}
			tooltip={({ color, id, indexValue, value }) => (
				<TooltipContainer title={String(indexValue)}>
					<TooltipItem color={color} label={String(id)} value={`${value}h`} />
				</TooltipContainer>
			)}
			valueScale={{ type: 'linear' }}
		/>
	)
}

export default BarsHours
