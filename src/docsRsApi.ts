import * as cheerio from 'cheerio';

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
    const modPath = parts.slice(1, -1).join('/');
    const itemName = parts.slice(-1)[0];
    
    const itemTypes = ['struct', 'enum', 'fn', 'trait', 'mod', 'type'];
    const potentialUrls = itemTypes.map(type => 
      `https://docs.rs/${crateName}/latest/${crateName.replace(/-/g, '_')}/${modPath}/${type}.${itemName}.html`
    );
    potentialUrls.push(`https://docs.rs/${crateName}/latest/${crateName.replace(/-/g, '_')}/${modPath}/${itemName}/index.html`);

    const headers = { 'User-Agent': this.userAgent };
    const fetchPromises = potentialUrls.map(url => fetch(url, { headers }).then(res => {
        if (!res.ok) throw new Error(`URL ${url} failed with status ${res.status}`);
        return res;
    }));

    try {
      const successfulResponse = await Promise.any(fetchPromises);
      const html = await successfulResponse.text();
      const $ = cheerio.load(html);
      
      const mainContent = $('#main-content');
      const itemType = mainContent.find('.main-heading span').first().text().trim() || 'Unknown';
      const docHtml = mainContent.find('details.top-doc > .docblock').html() || 'No documentation found.';

      const result = { itemType, docHtml };
      this.setInCache(cacheKey, result);
      return result;
    } catch (error) {
      // This will be an AggregateError
      if (error instanceof AggregateError) {
        const firstErrorMessage = error.errors[0]?.message || 'Unknown error';
        // Provide a more specific error message based on common failure cases
        if (firstErrorMessage.includes('404')) {
            throw new Error(`Could not find a valid documentation page for "${itemPath}". Please check the path is correct.`);
        }
      }
      throw new Error(`Could not find a valid documentation page for "${itemPath}". All attempts failed.`);
    }
  }

  async scrapeItemExamples(itemPath: string): Promise<string[]> {
    const cacheKey = `examples:${itemPath}`;
    const cached = this.getFromCache<string[]>(cacheKey);
    if (cached) return cached;

    const parts = itemPath.split('::');
    const crateName = parts[0];
    const modPath = parts.slice(1, -1).join('/');
    const itemName = parts.slice(-1)[0];
    
    const itemTypes = ['struct', 'enum', 'fn', 'trait', 'mod', 'type'];
    const potentialUrls = itemTypes.map(type => 
      `https://docs.rs/${crateName}/latest/${crateName.replace(/-/g, '_')}/${modPath}/${type}.${itemName}.html`
    );
    potentialUrls.push(`https://docs.rs/${crateName}/latest/${crateName.replace(/-/g, '_')}/${modPath}/${itemName}/index.html`);

    const headers = { 'User-Agent': this.userAgent };
    const fetchPromises = potentialUrls.map(url => fetch(url, { headers }).then(res => {
        if (!res.ok) throw new Error(`URL ${url} failed with status ${res.status}`);
        return res;
    }));

    try {
      const successfulResponse = await Promise.any(fetchPromises);
      const html = await successfulResponse.text();
      const $ = cheerio.load(html);
      
      const examples: string[] = [];
      $('#main-content .example-wrap pre.rust').each((_i, el) => {
          examples.push($(el).text());
      });

      this.setInCache(cacheKey, examples);
      return examples;
    } catch (error) {
      if (error instanceof AggregateError) {
        throw new Error(`Could not find a valid documentation page for "${itemPath}" to scrape examples from. Please check the path.`);
      }
      throw new Error(`Could not find a valid documentation page for "${itemPath}".`);
    }
  }

  async searchInCrate(crateName: string, query: string): Promise<{ name: string; type: string; path: string }[]> {
    const cacheKey = `search-in:${crateName}:${query}`;
    const cached = this.getFromCache<{ name: string; type: string; path: string }[]>(cacheKey);
    if (cached) return cached;

    const url = `https://docs.rs/${crateName}/latest/${crateName.replace(/-/g, '_')}/all.html`;
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
                searchIndex.push({ name: itemName, type: itemType.slice(0, -1), path: itemPath });
            }
        });
    });
    
    const queryLower = query.toLowerCase();
    const results = searchIndex.filter(item => item.name.toLowerCase().includes(queryLower));
    
    this.setInCache(cacheKey, results);
    return results;
  }
} 