import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as https from 'https';
import { CurrenciesService } from '../settings/currencies/currencies.service';

@Injectable()
export class BCVScraperService {
  private readonly logger = new Logger(BCVScraperService.name);

  constructor(private readonly currenciesService: CurrenciesService) {}

  @Cron('0 8-18/1 * * *') // Every hour from 8am to 6pm
  async handleCron() {
    this.logger.log('Starting BCV Base scraping...');
    await this.scrapeRates();
  }

  async scrapeRates() {
    const results: any = { rates: [], errors: [], logs: [] };
    try {
      // Ignore SSL errors for BCV
      const agent = new https.Agent({
        rejectUnauthorized: false,
      });

      const { data } = await axios.get('https://www.bcv.org.ve/', {
        httpsAgent: agent,
        timeout: 30000, // 30s timeout
      });

      const $ = cheerio.load(data);
      const rates: { code: string; rate: string }[] = [];

      // Valid selectors strategy
      // 1. Primary: #dolar strong, #euro strong
      // 2. Fallback: looking for text content

      const getRate = (id: string, name: string) => {
        // Selector 1: Standard ID
        let rate = $(`${id} strong`).text().trim().replace(',', '.');

        // Selector 2: Fallback Container
        if (!rate || isNaN(parseFloat(rate))) {
          const container = $(
            `div.view-tipo-de-cambio-oficial-del-bcv:contains("${name}")`,
          ).first();
          rate = container.find('strong').text().trim().replace(',', '.');
        }

        // DEBUG: Log everything found to result
        results.logs.push(`Debug ${name}: Found '${rate}'`);

        return rate;
      };

      const usdRate = getRate('#dolar', 'USD');
      const eurRate = getRate('#euro', 'EUR');

      if (usdRate && !isNaN(parseFloat(usdRate))) {
        // IMPORTANT: The rate shown for "USD" on BCV site is the value of 1 USD in VES.
        // In our system, USD is Base, so we store this rate on the VES currency.
        rates.push({ code: 'VES', rate: usdRate });
      }

      if (eurRate && !isNaN(parseFloat(eurRate))) {
        rates.push({ code: 'EUR', rate: eurRate });
      }

      if (rates.length === 0) {
        const msg = 'CRITICAL: No rates found on BCV page. Check selectors.';
        this.logger.error(msg);
        results.errors.push(msg);
        return results;
      }

      const allCurrencies = await this.currenciesService.findAll();

      for (const item of rates) {
        const currency = allCurrencies.find((c) => c.code === item.code);
        if (currency) {
          // Check if rate is different to avoid spamming DB history with same rate
          // Assuming addRate handles logic or we just push it.
          // Better to push it to have daily record even if same.
          await this.currenciesService.addRate(
            currency.id,
            item.rate,
            'BCV_SCRAPER',
          );
          const msg = `Updated ${item.code} rate to ${item.rate}`;
          this.logger.log(msg);
          results.rates.push(msg);
        } else {
          const msg = `Currency ${item.code} not found in DB`;
          this.logger.warn(msg);
          results.logs.push(msg); // Just a log, not a critical error
        }
      }
    } catch (error) {
      this.logger.error('Error scraping BCV', error);
      results.errors.push(`Exception: ${error.message}`);
    }
    return results;
  }
}
