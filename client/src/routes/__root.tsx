import { Outlet, createRootRouteWithContext } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { Toaster } from "#/components/ui/sonner"
import Footer from "../components/Footer"
import Header from "../components/Header"
import { AuthProvider } from "../components/AuthProvider"

import TanStackQueryProvider from "../integrations/tanstack-query/root-provider"
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools"

import type { QueryClient } from "@tanstack/react-query"

interface MyRouterContext {
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootLayout,
})

function RootLayout() {
	return (
		<TanStackQueryProvider>
			<AuthProvider>
				<div className="flex min-h-screen flex-col">
					<Header />
					<Outlet />
					<Footer />
				</div>
				<Toaster />
			</AuthProvider>
			<TanStackDevtools
				config={{
					position: "bottom-right",
				}}
				plugins={[
					{
						name: "Tanstack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
					TanStackQueryDevtools,
				]}
			/>
		</TanStackQueryProvider>
	)
}
