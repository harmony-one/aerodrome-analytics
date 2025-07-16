import { Injectable, Logger } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Position } from 'src/entities';
import { Repository } from 'typeorm';

import { IPosition } from 'src/interfaces';
import { getPositions } from "src/api";
import { sleep } from "src/utils";
import * as moment from "moment";
import { ConfigService } from '@nestjs/config';
import { Web3Service } from 'nest-web3';
@Injectable()
export class LoaderService {
    private readonly logger = new Logger(LoaderService.name);

    pools = [
        '0x4e962bb3889bf030368f56810a9c96b83cb3e778',
    ]

    latestError = '';
    startBlockNumber = 0;
    latestBlockNumber = 0;
    blocksInterval = 5000;

    private client = this.web3Service.getClient('base');
    
    latestChainBlock = 0;
    latestRequestTime = 0;

    constructor(
        private configService: ConfigService,
        private readonly web3Service: Web3Service,
        @InjectRepository(Position)
        private repository: Repository<Position>,
    ) {
        this.startBlockNumber = this.configService.get('startSyncBlock');
    }

    init = async () => {
        this.logger.log('init');

        this.latestChainBlock = await this.client.eth.getBlockNumber();

        this.pools.forEach(async (pool) => {
            const latestData = await this.getLatestData(pool);

            this.latestBlockNumber = Math.min(
                latestData?.blockNumber || this.startBlockNumber,
                this.latestChainBlock
            );

            this.loadData(pool)
        });
    }

    loadData = async (poolAddress: string) => {
        try {
            const blockFrom = this.latestBlockNumber;
            const blockTo = Math.min(blockFrom + this.blocksInterval, this.latestChainBlock);

            let skip = 0;
            let data = [];

            const start = Date.now();

            while (true) {
                const newData = await getPositions({
                    first: 1000,
                    skip: skip,
                    filter: {
                        poolAddress: poolAddress,
                        blockNumber_gt: blockFrom,
                        blockNumber_lte: blockTo,
                    }
                }, this.configService.get('thegraph'))

                data = data.concat(newData);

                // this.logger.log(`${this.getProgress()}% skip=${skip} blockFrom=${blockFrom} blockTo=${blockTo} newData=${newData.length}`);

                if (newData.length < 1000) {
                    break;
                } else {
                    skip += 1000;
                }
            }

            if (data.length > 0) {
                await Promise.all(data.map(
                    async (item) => await this.addData(item, poolAddress)
                ));
            }

            this.latestRequestTime = (Date.now() - start) / 1000;

            // this.logger.log(`${this.getProgress()}% blockFrom=${blockFrom} blockTo=${blockTo} newData=${data.length}`);

            this.latestBlockNumber = blockTo;

            if (this.latestBlockNumber >= this.latestChainBlock) {
                await sleep(60000);
                this.logger.log('sleep')
                this.latestChainBlock = await this.client.eth.getBlockNumber();
            }
        } catch (e) {
            this.logger.error(e);
            this.latestError = e.message || 'unknown error';
        }

        setTimeout(() => this.loadData(poolAddress), 100);
    }

    addData = async (data: IPosition, pool: string) => {
        try {
            const newData = this.repository.create({
                id: data.id,
                timestamp: data.transaction.timestamp,
                blockNumber: data.transaction.blockNumber,
                transactionHash: data.transaction.id,
                depositedToken0: data.depositedToken0,
                depositedToken1: data.depositedToken1,
                tickLower: data.tickLower.tickIdx,
                tickUpper: data.tickUpper.tickIdx,
                pool: pool,
                metadata: data
            })

            return this.repository.save(newData);
        } catch (err) {
            this.logger.error(err);
            return err;
        }
    }

    getProgress = () =>
        ((this.latestBlockNumber - this.startBlockNumber) / (this.latestChainBlock - this.startBlockNumber) * 100).toFixed(4);

    getCount(): Promise<number> {
        return this.repository.count();
    }

    getLatestData(poolAddress: string): Promise<Position> {
        return this.repository.findOne({
            where: {
                pool: poolAddress,
            },
            order: {
                blockNumber: 'DESC',
            },
        });
    }

    getLatest100Data(): Promise<Position[]> {
        return this.repository.find({
            order: {
                timestamp: 'DESC',
            },
            take: 100,
        });
    }

    info = async () => {
        const count = await this.getCount();
        const timeToLoad = this.latestRequestTime * (this.latestChainBlock - this.latestBlockNumber) / this.blocksInterval;
        const timeToLoadFormatted = moment.duration(timeToLoad, 'seconds').humanize();
        
        return {
            count: count,
            latestBlockNumber: this.latestBlockNumber,
            latestChainBlock: this.latestChainBlock,
            latestRequestTime: this.latestRequestTime,
            blocksInterval: this.blocksInterval,
            progress: this.getProgress(),
            timeToLoadFormatted,
            error: this.latestError,
        }
    }
}
