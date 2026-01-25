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

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleCron() {
    this.logger.log('Starting BCV Base scraping...');
    await this.scrapeRates();
  }

  async scrapeRates() {
    try {
      // Ignore SSL errors for BCV
      const agent = new https.Agent({
        rejectUnauthorized: false,
      });

      const { data } = await axios.get('https://www.bcv.org.ve/', {
        httpsAgent: agent,
      });

      const $ = cheerio.load(data);
      const rates: { code: string; rate: string }[] = [];

      // Selectors based on BCV structure (subject to change, robust error handling needed)
      // Usually inside #dolar, #euro divs
      const usdRate = $('#dolar strong').text().trim().replace(',', '.');
      const eurRate = $('#euro strong').text().trim().replace(',', '.');

      if (usdRate && !isNaN(parseFloat(usdRate))) {
        rates.push({ code: 'USD', rate: usdRate });
      }

      if (eurRate && !isNaN(parseFloat(eurRate))) {
        rates.push({ code: 'EUR', rate: eurRate });
      }

      if (rates.length === 0) {
        this.logger.warn('No rates found on BCV page check selectors');
        return;
      }

      const allCurrencies = await this.currenciesService.findAll();

      for (const item of rates) {
        const currency = allCurrencies.find((c) => c.code === item.code);
        if (currency) {
          await this.currenciesService.addRate(
            currency.id,
            item.rate,
            'BCV_SCRAPER',
          );
          this.logger.log(`Updated ${item.code} rate to ${item.rate}`);
        } else {
          this.logger.warn(`Currency ${item.code} not found in DB`);
        }
      }
    } catch (error) {
      this.logger.error('Error scraping BCV', error);
    }
  }
}
