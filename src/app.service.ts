import { Injectable, Logger } from '@nestjs/common';
import { LoaderService as PositionsLoaderService } from './positions-loader/loader.service';
import { LoaderService as EventsLoaderService } from './events-loader/loader.service';
import { LoaderService as PoolHourDatasLoaderService } from './pool-hours-data-loader/loader.service';
import { StatisticService } from './statistic/statistic.service';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AppService {
    private readonly logger = new Logger(AppService.name);

    isSyncing = false;

    constructor(
        private readonly configService: ConfigService,
        private readonly positionsLoaderService: PositionsLoaderService,
        private readonly eventsLoaderService: EventsLoaderService,
        private readonly poolHourDatasLoaderService: PoolHourDatasLoaderService,
        private readonly statisticService: StatisticService,
    ) {
        this.positionsLoaderService.init();
        this.eventsLoaderService.init();
        this.poolHourDatasLoaderService.init();

        setInterval(async () => {
            if (this.isSyncing) {
                return;
            }

            const positionsInfo = await this.positionsLoaderService.info();
            const eventsInfo = (await this.eventsLoaderService.info())[0];
            const eventsCount = await this.eventsLoaderService.getEventsCount();
            const poolHourDatasInfo = await this.poolHourDatasLoaderService.info();

            this.logger.log('--------------------------------');
            this.logger.log(`Positions progress: ${positionsInfo.progress}% / count: ${positionsInfo.count} / left: ${positionsInfo.timeToLoadFormatted}`);
            this.logger.log(`Events progress: ${eventsInfo.progress}% / count: ${eventsCount} / left: ${eventsInfo.timeToLoadFormatted}`);
            this.logger.log(`Pool Hour Datas progress: ${poolHourDatasInfo.progress}% / count: ${poolHourDatasInfo.count} / left: ${poolHourDatasInfo.timeToLoadFormatted}`);
        }, 1000 * 10);

        this.relaodStatistic();

        setInterval(async () => {
            this.relaodStatistic();
        }, this.configService.get('statisticSyncInterval'));
    }

    async relaodStatistic() {
        try {
            this.isSyncing = true;
            await this.statisticService.relaodData();
        } catch (error) {
            this.logger.error(error);
        } finally {
            this.isSyncing = false;
        }
    }
}
