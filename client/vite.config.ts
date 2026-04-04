import { defineConfig } from "vite"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import { devtools } from "@tanstack/devtools-vite"
import tsconfigPaths from "vite-tsconfig-paths"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const config = defineConfig({
	plugins: [
		devtools(),
		tsconfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
		TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
		viteReact({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
	],
})

export default config
