import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	clientPrefix: "VITE_",

	client: {
		VITE_APP_TITLE: z.string().min(1).optional(),
		VITE_API_URL: z.url(),
		/** Same origin as API host + `/static`, e.g. http://localhost:7000/static */
		VITE_STATIC_URL: z.url(),
	},

	runtimeEnv: import.meta.env,

	emptyStringAsUndefined: true,
})
