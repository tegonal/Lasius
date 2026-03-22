import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import babel from 'vite-plugin-babel'

function patchPluginsForVite8(plugins: Plugin[]): Plugin[] {
	return plugins.map((plugin) => {
		const originalConfig = plugin.config
		if (typeof originalConfig === 'function') {
			plugin.config = async function (
				...args: Parameters<typeof originalConfig>
			) {
				const result = await (originalConfig as Function).apply(this, args)
				if (result && typeof result === 'object') stripEsbuildOptions(result)
				return result
			}
		}
		return plugin
	})
}

/**
 * Wraps reactRouter() plugins to strip deprecated esbuild/esbuildOptions
 * from their config hook returns before Vite processes them.
 * Remove once @react-router/dev adds vite ^8 support.
 */
function stripEsbuildOptions(obj: Record<string, unknown>): void {
	delete obj.esbuild
	const optimizeDeps = obj.optimizeDeps as Record<string, unknown> | undefined
	if (optimizeDeps) delete optimizeDeps.esbuildOptions
	const environments = obj.environments as
		| Record<string, Record<string, unknown>>
		| undefined
	if (environments) {
		for (const env of Object.values(environments)) delete env.esbuild
	}
}

export default defineConfig(() => ({
	build: {
		sourcemap: false,
	},
	plugins: [
		tailwindcss(),
		...patchPluginsForVite8(reactRouter() as Plugin[]),
		...patchPluginsForVite8([
			babel({
				babelConfig: {
					plugins: ['babel-plugin-react-compiler'],
					presets: ['@babel/preset-typescript'],
				},
				filter: /\.[jt]sx?$/,
			}) as Plugin,
		]),
	],
	resolve: {
		tsconfigPaths: true,
	},
	server: {
		forwardConsole: {
			logLevels: ['error', 'warn', 'info', 'log', 'debug'],
			unhandledErrors: true,
		},
		host: true,
	},
}))
