import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export interface CrateInfo {
  description: string;
  modules: string[];
}

export interface CrateSearchResult {
    crates: { name: string; description: string }[];
    meta: {
        total: number;
    };
}

export class DocsRsApi {
  private readonly userAgent: string;
  private readonly cache: Map<string, CacheEntry<any>>;
  private readonly cacheDuration: number;

  constructor() {
    this.userAgent = 'mcp-docsrs-tool/1.0 (https://github.com/shuakami/mcp-init)';
    this.cache = new Map<string, CacheEntry<any>>();
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  private _getStdlibPotentialUrls(itemPath: string): string[] {
    const parts = itemPath.split('::');
    const crateName = parts[0];
    const itemParts = parts.slice(1);
    const modPath = itemParts.slice(0, -1).join('/');
    const itemName = itemParts.slice(-1)[0];
    
    // The base URL for the standard library is different from docs.rs
    const baseUrl = `https://doc.rust-lang.org/stable/${crateName}/`;
  
    // List of possible item types in stdlib docs
    const itemTypes = ['struct', 'enum', 'fn', 'trait', 'mod', 'type', 'macro'];
  
    const potentialUrls = itemTypes.map(type => {
      const finalItemName = (type === 'macro' && itemName.endsWith('!')) ? itemName.slice(0, -1) : itemName;
      let url = baseUrl;
      if (modPath) {
          url += `${modPath}/`;
      }
      url += `${type}.${finalItemName}.html`;
      return url;
    });
  
    // URL for modules
    let moduleIndexUrl = baseUrl;
    if (modPath) {
        moduleIndexUrl += `${modPath}/`;
    }
    moduleIndexUrl += `${itemName}/index.html`;
    potentialUrls.push(moduleIndexUrl);
  
    return potentialUrls;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && entry.expiry > Date.now()) {
      return entry.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setInCache<T>(key: string, data: T): void {
    const expiry = Date.now() + this.cacheDuration;
    this.cache.set(key, { data, expiry });
  }

  async searchCrates(query: string, page: number = 1): Promise<CrateSearchResult> {
    const cacheKey = `search:${query}:${page}`;
    const cached = this.getFromCache<CrateSearchResult>(cacheKey);
    if (cached) return cached;

    const headers = { 'User-Agent': this.userAgent };
    const response = await fetch(`https://crates.io/api/v1/crates?q=${encodeURIComponent(query)}&per_page=5&page=${page}`, { headers });

    if (!response.ok) {
      throw new Error(`Crates.io API request failed: ${response.statusText}`);
    }
    const result = await response.json() as CrateSearchResult;
    this.setInCache(cacheKey, result);
    return result;
  }

  async scrapeCrateInfo(crateName: string): Promise<CrateInfo> {
    const cacheKey = `info:${crateName}`;
    const cached = this.getFromCache<CrateInfo>(cacheKey);
    if (cached) return cached;

    const url = `https://docs.rs/${crateName}/latest/${crateName.replace(/-/g, '_')}/`;
    const headers = { 'User-Agent': this.userAgent };
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`docs.rs page request failed: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const description = $('meta[name="description"]').attr('content') || 'No description found.';
    
    const modules: string[] = [];
    $('#modules + .item-table .mod').each((_i, el) => {
      modules.push($(el).text().trim());
    });

    const result = { description, modules };
    this.setInCache(cacheKey, result);
    return result;
  }

  async scrapeCrateFeatures(crateName: string): Promise<{ name: string; description: string }[]> {
    const cacheKey = `features:${crateName}`;
    const cached = this.getFromCache<{ name: string; description: string }[]>(cacheKey);
    if (cached) return cached;

    const url = `https://docs.rs/crate/${crateName}/latest/features`;
    const headers = { 'User-Agent': this.userAgent };
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`docs.rs features page request failed: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const features: { name: string; description: string }[] = [];
    $('#main h3').each((_i, el) => {
      const featureName = $(el).attr('id');
      if (featureName) {
        const descriptionEl = $(el).next();
        let description = descriptionEl.text().trim().replace(/\s+/g, ' ');

        if (descriptionEl.is('ul')) {
          const deps = descriptionEl.find('a').map((_j, depEl) => $(depEl).text().trim()).get();
          description = `Enables: ${deps.join(', ')}`;
        }
        
        if (description === 'This feature flag does not enable additional features.') {
            description = 'No specific sub-features enabled.';
        }
        features.push({ name: featureName, description });
      }
    });
    this.setInCache(cacheKey, features);
    return features;
  }

  async scrapeItemDefinition(itemPath: string): Promise<{ itemType: string; docHtml: string }> {
    const cacheKey = `definition:${itemPath}`;
    const cached = this.getFromCache<{ itemType: string; docHtml: string }>(cacheKey);
    if (cached) return cached;

    const parts = itemPath.split('::');
    const crateName = parts[0];
    const isStdLib = ['std', 'core', 'alloc'].includes(crateName);

    const headers = { 
        'User-Agent': isStdLib ? this.userAgent : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
    };
    let fetchPromises: Promise<Response>[];

    if (isStdLib) {
        const potentialUrls = this._getStdlibPotentialUrls(itemPath);
        fetchPromises = potentialUrls.map(url => fetch(url, { headers }));
    } else {
        const searchName = parts.slice(1).join('::');
        const itemName = parts.slice(-1)[0].replace(/!$/, '');

        const searchResults = await this.searchInCrate(crateName, itemName);
        let item = searchResults.find(r => r.name === searchName);
        if (!item) {
            item = searchResults.find(r => r.name === itemName || r.name.endsWith('::' + itemName));
        }
        if (!item) {
            throw new Error(`Could not find item "${searchName}" in crate "${crateName}".`);
        }
        fetchPromises = [fetch(item.path, { headers })];
    }
    
    try {
        // We use Promise.any for stdlib, and a direct fetch for others.
        // Wrapping the single promise in an array and using .any still works.
        const successfulResponse = await Promise.any(fetchPromises.map(p => p.then(res => {
            if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res;
        })));

      const html = await successfulResponse.text();
      const $ = cheerio.load(html);
      
      const mainContent = $('#main-content');
      const itemType = mainContent.find('.main-heading span').first().text().trim() || 'Unknown';
        const rawDocHtml = mainContent.find('details.top-doc > .docblock').html() || mainContent.find('.docblock').first().html();

        let docMarkdown = 'No documentation found.';
        if (rawDocHtml) {
            const turndownService = new TurndownService();
            docMarkdown = turndownService.turndown(rawDocHtml);
        }

        const result = { itemType, docHtml: docMarkdown };
      this.setInCache(cacheKey, result);
      return result;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to process documentation page for "${itemPath}". Reason: ${error.message}`);
      }
        throw new Error(`An unknown error occurred while processing documentation for "${itemPath}".`);
    }
  }

  async scrapeItemExamples(itemPath: string): Promise<string[]> {
    const cacheKey = `examples:${itemPath}`;
    const cached = this.getFromCache<string[]>(cacheKey);
    if (cached) return cached;

    const parts = itemPath.split('::');
    const crateName = parts[0];
    const isStdLib = ['std', 'core', 'alloc'].includes(crateName);

    const headers = { 
        'User-Agent': isStdLib ? this.userAgent : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
    };
    let fetchPromises: Promise<Response>[];

    if (isStdLib) {
        const potentialUrls = this._getStdlibPotentialUrls(itemPath);
        fetchPromises = potentialUrls.map(url => fetch(url, { headers }));
    } else {
        const searchName = parts.slice(1).join('::');
        const itemName = parts.slice(-1)[0].replace(/!$/, '');

        const searchResults = await this.searchInCrate(crateName, itemName);
        let item = searchResults.find(r => r.name === searchName);
        if (!item) {
            item = searchResults.find(r => r.name === itemName || r.name.endsWith('::' + itemName));
        }
        if (!item) {
            return [];
        }
        fetchPromises = [fetch(item.path, { headers })];
    }

    try {
        const successfulResponse = await Promise.any(fetchPromises.map(p => p.then(res => {
            if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res;
        })));
      
      const html = await successfulResponse.text();
      const $ = cheerio.load(html);
      
      const examples: string[] = [];
      $('#main-content .example-wrap pre.rust').each((_i, el) => {
          examples.push($(el).text());
      });

      this.setInCache(cacheKey, examples);
      return examples;
    } catch (error) {
        return [];
    }
  }

  async searchInCrate(crateName: string, query: string): Promise<{ name: string; type: string; path: string }[]> {
    const cacheKey = `search-in:${crateName}:${query}`;
    const cached = this.getFromCache<{ name: string; type: string; path: string }[]>(cacheKey);
    if (cached) return cached;

    const baseUrl = `https://docs.rs/${crateName}/latest/${crateName.replace(/-/g, '_')}/`;
    const url = `${baseUrl}all.html`;
    const headers = { 'User-Agent': this.userAgent };
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`Failed to fetch all.html: ${response.statusText}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const searchIndex: { name: string; type: string; path: string }[] = [];
    $('#main-content h3').each((_i, h3) => {
        const itemType = $(h3).text().trim();
        const list = $(h3).next('ul.all-items');
        
        list.find('li > a').each((_j, a) => {
            const itemName = $(a).text().trim();
            const itemPath = $(a).attr('href');
            if (itemName && itemPath) {
                // Prepend the base URL to make the path absolute
                const fullPath = new URL(itemPath, baseUrl).href;
                searchIndex.push({ name: itemName, type: itemType.slice(0, -1), path: fullPath });
            }
        });
    });
    
    const queryLower = query.toLowerCase();
    const results = searchIndex.filter(item => item.name.toLowerCase().includes(queryLower));
    
    this.setInCache(cacheKey, results);
    return results;
  }
} 