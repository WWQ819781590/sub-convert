import {
  BadRequestException,
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

type SubscriptionConfig = Record<string, SubscriptionItem>;

interface SubscriptionItem {
  url: string;
  target: string;
}

@Injectable()
export class ConfigFileService {
  private readonly subconverterUrl = this.getSubconverterUrl();
  private readonly publicDir = this.getPublicDir();

  async readJsonFile(fileName: string) {
    if (!fileName || extname(fileName) !== '.json') {
      throw new BadRequestException('Only .json config files are supported.');
    }

    const filePath = this.resolvePublicPath(fileName);

    try {
      const content = await readFile(filePath, 'utf8');
      return JSON.parse(content) as unknown;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundException(`Config file not found: ${fileName}`);
      }

      if (error instanceof SyntaxError) {
        throw new BadRequestException(`Invalid JSON config file: ${fileName}`);
      }

      throw error;
    }
  }

  async convertSubscription(key: string) {
    if (!key) {
      throw new BadRequestException('Query parameter "key" is required.');
    }

    const config = await this.readSubscriptionConfig();
    const item = config[key];

    if (!item) {
      throw new NotFoundException(`Config key not found: ${key}`);
    }

    if (!item.url || !item.target) {
      throw new BadRequestException(`Invalid config for key: ${key}`);
    }

    const requestUrl = this.buildSubconverterUrl(item);

    try {
      const response = await fetch(requestUrl, {
        signal: AbortSignal.timeout(15000),
      });
      const content = await response.text();

      if (!response.ok) {
        throw new BadGatewayException(
          `Subconverter request failed: HTTP ${response.status} ${content}`,
        );
      }

      return content;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new BadGatewayException(
        `Subconverter request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private resolvePublicPath(fileName: string) {
    const normalizedName = normalize(fileName);
    const filePath = resolve(join(this.publicDir, normalizedName));
    const publicRoot = this.publicDir.endsWith(sep) ? this.publicDir : `${this.publicDir}${sep}`;

    if (!filePath.startsWith(publicRoot)) {
      throw new BadRequestException('Invalid config file path.');
    }

    return filePath;
  }

  private getPublicDir() {
    if (process.env.PUBLIC_DIR) {
      return resolve(process.env.PUBLIC_DIR);
    }

    const candidates = [resolve(process.cwd(), 'public'), resolve(process.cwd(), '../../public')];
    return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
  }

  private getSubconverterUrl() {
    const url = process.env.SUBCONVERTER_URL?.trim();

    if (!url) {
      throw new Error('SUBCONVERTER_URL environment variable is required.');
    }

    return url;
  }

  private async readSubscriptionConfig() {
    const config = await this.readJsonFile('config.json');

    if (!this.isSubscriptionConfig(config)) {
      throw new BadRequestException('Invalid config.json format.');
    }

    return config;
  }

  private buildSubconverterUrl(item: SubscriptionItem) {
    const baseUrl = this.subconverterUrl.endsWith('/')
      ? this.subconverterUrl.slice(0, -1)
      : this.subconverterUrl;

    return `${baseUrl}/sub?target=${encodeURIComponent(item.target)}&url=${encodeURIComponent(item.url)}`;
  }

  private isSubscriptionConfig(value: unknown): value is SubscriptionConfig {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    return Object.values(value).every(
      (item) =>
        item &&
        typeof item === 'object' &&
        !Array.isArray(item) &&
        typeof (item as SubscriptionItem).url === 'string' &&
        typeof (item as SubscriptionItem).target === 'string',
    );
  }
}
