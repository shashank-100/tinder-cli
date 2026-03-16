import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { SwipeDecision, Profile } from './types.js';

export class CSVExporter {
  private filePath: string;
  private initialized = false;
  private imagesDir: string;

  constructor(filename: string = 'tinder_profiles.csv') {
    this.filePath = path.join(process.cwd(), filename);
    this.imagesDir = path.join(process.cwd(), 'profile_images');

    // Create images directory
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }
  }

  private initializeCSV() {
    if (!this.initialized) {
      this.initialized = true;
      if (!fs.existsSync(this.filePath)) {
        const headers = 'Name,Age,Bio,Score,Action,Reasoning,Image URLs\n';
        fs.writeFileSync(this.filePath, headers, 'utf-8');
        console.log(`\n📄 CSV file created: ${this.filePath}\n`);
      } else {
        console.log(`\n📄 Appending to: ${this.filePath}\n`);
      }
    }
  }

  private escapeCSV(value: string): string {
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private async downloadImage(url: string, filepath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filepath);
      const protocol = url.startsWith('https') ? https : http;

      protocol.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    });
  }

  private async saveImages(imageUrls: string[], profileName: string, profileAge: number): Promise<string[]> {
    const savedPaths: string[] = [];
    const timestamp = Date.now();
    const safeName = profileName.replace(/[^a-zA-Z0-9]/g, '_');

    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const url = imageUrls[i];
        if (!url || typeof url !== 'string') continue;

        const ext = url.includes('.jpg') ? 'jpg' : url.includes('.png') ? 'png' : 'jpg';
        const filename = `${safeName}_${profileAge}_${timestamp}_${i + 1}.${ext}`;
        const filepath = path.join(this.imagesDir, filename);

        await this.downloadImage(url, filepath);
        savedPaths.push(filepath);
      } catch (error) {
        console.error(`Failed to download image ${i + 1}:`, error);
      }
    }

    return savedPaths;
  }

  async downloadImages(imageUrls: string[], profileName: string, profileAge: number): Promise<string[]> {
    return this.saveImages(imageUrls, profileName, profileAge);
  }

  async saveProfile(decision: SwipeDecision & { extractedProfile?: Profile }, imageUrls: string[] = []) {
    this.initializeCSV();

    const profile = decision.extractedProfile || decision.profile;
    const name = this.escapeCSV(profile.name);
    const age = profile.age;
    const bio = this.escapeCSV(profile.bio || '');
    const score = decision.score;
    const action = decision.action;
    const reasoning = this.escapeCSV(decision.reasoning || '');

    // imageUrls are already local paths (downloaded before scoring)
    const validPaths = Array.isArray(imageUrls) ? imageUrls.filter(p => p) : [];
    const images = this.escapeCSV(validPaths.join(' | '));

    const row = `${name},${age},${bio},${score},${action},${reasoning},${images}\n`;

    fs.appendFileSync(this.filePath, row, 'utf-8');
  }

  getFilePath(): string {
    return this.filePath;
  }
}
