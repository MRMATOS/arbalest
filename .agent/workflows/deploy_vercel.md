---
description: Deploy application to Vercel
---
1. Login and Initialize Project
   To deploy, we use the Vercel CLI. This command will prompt you to log in (browser) and set up the project.
   Run the following command and accept the defaults (Y) for most questions:
   - "Set up and deploy?" [Y]
   - "Which scope?" [Select your user/team]
   - "Link to existing project?" [N] (unless you already created one)
   - "Project name?" [Enter or type name]
   - "In which directory?" [./]
   - "Want to modify settings?" [N] (Vite is usually auto-detected)

   ```bash
   npx vercel
   ```

2. Deploy to Production
   After the preview deployment is successful, run this to deploy to the live production URL.
   ```bash
   npx vercel --prod
   ```
