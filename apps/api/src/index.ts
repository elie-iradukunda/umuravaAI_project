import { env } from "./config/env.js";
import { createRepository } from "./lib/create-repository.js";
import { createApp } from "./app.js";

const bootstrap = async () => {
  const repository = await createRepository();

  const app = createApp(repository);

  app.listen(env.PORT, () => {
    console.log(
      `Umurava API listening on http://localhost:${env.PORT} using ${repository.kind} storage`
    );
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
