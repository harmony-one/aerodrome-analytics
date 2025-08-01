import { Injectable, Logger } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { PoolHourData } from 'src/entities';
import { Repository } from 'typeorm';

import { IPoolHourDatas } from 'src/interfaces';
import { getPoolHourDatas } from "src/api";
import { sleep } from "src/utils";
import * as moment from "moment";
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoaderService {
    private readonly logger = new Logger(LoaderService.name);

    pools = [
        // '0x4e962bb3889bf030368f56810a9c96b83cb3e778',
        '0x3e66e55e97ce60096f74b7c475e8249f2d31a9fb'
    ]

    latestError = '';
    latestRequestTime = 0;

    constructor(
        private configService: ConfigService,
        @InjectRepository(PoolHourData)
        private repository: Repository<PoolHourData>,
    ) {}

    init = async () => {
        this.logger.log('init');

        this.pools.forEach(pool => this.loadData(pool));
    }

    loadData = async (poolAddress: string) => {
        try {
            const start = Date.now();

            const latestData = await this.getLatestData(poolAddress);

            let periodStartUnix = latestData ? latestData.periodStartUnix : 0;

            // this.logger.log(`periodStartUnix=${periodStartUnix}`);

            const data = await getPoolHourDatas({
                first: 1000,
                filter: {
                    poolAddress: poolAddress,
                    periodStartUnix_gt: periodStartUnix
                },
              }, this.configService.get('thegraph'))

            if (!!data?.length) {
                // const count = await this.getCount();

                await Promise.all(data.map(
                    async (item, idx) => await this.addData(item, poolAddress, 0)
                ));

                this.latestRequestTime = (Date.now() - start) / 1000;

                // this.logger.log('-Pool Hour Datas Loader-------------------------------')
                // this.logger.log(`new=${data.length}, total=${count}`)
                // this.logger.log(`from=${moment(data[0]?.periodStartUnix * 1000).format('YYYY-MM-DD HH:mm:ss')} to=${moment(data[data.length - 1]?.periodStartUnix * 1000).format('YYYY-MM-DD HH:mm:ss')}`);
            } else {
                // this.logger.log('sleep 50 seconds')
                await sleep(50000);
            }
        } catch (e) {
            this.logger.error(e);
        }

        setTimeout(() => this.loadData(poolAddress), 100);
    }

    addData = async (data: IPoolHourDatas, pool: string, index: number) => {
        try {
            const newData = this.repository.create({
                id: data.periodStartUnix,
                periodStartUnix: data.periodStartUnix,
                token0Price: data.token0Price,
                token1Price: data.token1Price,
                tick: data.tick,
                pool: pool,
                metadata: data,
            })

            return this.repository.save(newData);
        } catch (err) {
            this.logger.error(err);
            return err;
        }
    }

    getCount(): Promise<number> {
        return this.repository.count();
    }

    getLatestData(poolAddress: string) {
        return this.repository.findOne({
            where: {
                pool: poolAddress,
            },
            order: {
                periodStartUnix: 'DESC',
            },
        });
    }

    getFirstData(poolAddress: string) {
        return this.repository.findOne({
            where: {
                pool: poolAddress,
            },
            order: {
                periodStartUnix: 'ASC',
            },
        });
    }

    getLatest100Data() {
        return this.repository.find({
            order: {
                periodStartUnix: 'DESC',
            },
            take: 100,
        });
    }

    info = async () => {
        const latestData = await this.getLatestData(this.pools[0]);
        const firstData = await this.getFirstData(this.pools[0]);

        if(!latestData || !firstData) {
            return {
                latestError: this.latestError,
                latestData: latestData,
                count: 0,
                timeToLoadFormatted: 9999999999,
                timeToLoad: 9999999999,
                progress: 0,
            }
        }

        const count = await this.getCount();

        const hoursLeft = (Date.now() - latestData.periodStartUnix * 1000) / (1000 * 60 * 60);

        const timeToLoad = this.latestRequestTime * hoursLeft / 1000;       
        const timeToLoadFormatted = moment.duration(timeToLoad, 'seconds').humanize();

        const progress = ((latestData.periodStartUnix - firstData.periodStartUnix) / (Date.now() / 1000 - firstData.periodStartUnix) * 100).toFixed(2);

        return {
            latestError: this.latestError,
            latestData: latestData,
            count: count,
            timeToLoadFormatted: timeToLoadFormatted,
            timeToLoad: timeToLoad,
            progress: progress,
        }
    }
}
