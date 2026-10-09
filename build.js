import { execSync } from 'child_process';
import { build } from 'vite';

async function main() {
  console.log('Building client...');
  execSync('npx vite build', { stdio: 'inherit' });

  console.log('Building server...');
  await build({
    build: {
      ssr: 'server/src/index.ts',
      outDir: 'api',
      emptyOutDir: false,
      copyPublicDir: false,
    },
  });

  console.log('✅ Build complete!');
}

main().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
