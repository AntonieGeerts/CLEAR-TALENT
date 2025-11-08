import { defineConfig } from '@prisma/client/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  seed: 'tsx prisma/seed.ts',
});
