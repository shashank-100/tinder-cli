import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function run(command: string): Promise<string> {
  const { stdout } = await execAsync(`agent-browser --cdp http://localhost:9222 ${command}`);
  return stdout.trim();
}

async function extractImages() {
  console.log('Step 1: Get snapshot to find photos region...\n');
  const snapshot = await run('snapshot -i');
  console.log(snapshot);

  console.log('\n\nStep 2: Finding photos region reference...\n');
  const photosMatch = snapshot.match(/region ".*?photos".*?\[ref=(e\d+)\]/i);

  if (!photosMatch) {
    console.log('❌ No photos region found!');
    return;
  }

  const photosRef = `@${photosMatch[1]}`;
  console.log(`✅ Found photos region: ${photosRef}`);

  console.log('\n\nStep 3: Get HTML of photos region...\n');
  const html = await run(`get html ${photosRef}`);
  console.log('HTML length:', html.length);
  console.log('First 500 chars:', html.substring(0, 500));

  console.log('\n\nStep 4: Extract background-image URLs...\n');
  const urlMatches = html.match(/background-image:\s*url\(&quot;([^&]+)&quot;\)/g) || [];
  console.log(`Found ${urlMatches.length} URL matches`);

  const urls = urlMatches
    .map(match => {
      const urlMatch = match.match(/url\(&quot;([^&]+)&quot;\)/);
      return urlMatch ? urlMatch[1] : null;
    })
    .filter((url): url is string => url !== null && url.includes('gotinder.com'))
    .slice(0, 4);

  console.log('\n\n✅ Extracted Image URLs:');
  urls.forEach((url, i) => {
    console.log(`${i + 1}. ${url.substring(0, 100)}...`);
  });

  console.log(`\n\nTotal: ${urls.length} images extracted`);
  return urls;
}

extractImages().catch(console.error);
