import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mohitchimote.com',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/work/journey-los'),
    }),
  ],
});
