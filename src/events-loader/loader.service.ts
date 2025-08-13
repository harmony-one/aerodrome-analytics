import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Web3Service } from 'nest-web3';

import { EventTrackerService } from '../event-tracker/event-tracker.service';
import nftSettingsRegistryJson from '../abi/NftSettingsRegistry';
import { InjectRepository } from '@nestjs/typeorm';
import { EventA as EventModel } from 'src/entities';
import { Repository } from 'typeorm';
import { IEvent } from 'src/interfaces';
@Injectable()
export class LoaderService {
    private readonly logger = new Logger(LoaderService.name);
    private client = this.web3Service.getClient('base');

    rewardsContracts = [
        '0x6399ed6725cC163D019aA64FF55b22149D7179A8',
        // '0x9B55cb6cAe1e303B5EDce6F9fcf90246D382809c'
    ]

    trackers = {};

    idx = 0;

    constructor(
        private configService: ConfigService,
        private readonly web3Service: Web3Service,
        @InjectRepository(EventModel)
        private eventsRepository: Repository<EventModel>,
    ) {}
    
    init = async () => {
        this.logger.log('init');

        this.trackers = this.rewardsContracts.map((reward) => {
            return new EventTrackerService({
                contractAddress: reward,
                contractAbi: nftSettingsRegistryJson.abuGlauge,
                web3: this.client,
                chain: 'eth',
                getEventCallback: this.addEvent,
                onComplete: async () => { },
            })
        })

        Object.values(this.trackers).forEach(async (tracker: EventTrackerService) => {
            const latestEvent = await this.eventsRepository.findOne({
                where: {
                    contractAddress: tracker.getInfo().contractAddress,
                },
                order: {
                    blockNumber: 'DESC',
                },
            });

            const startBlockNumber = this.configService.get('startSyncBlock');

            tracker.start(startBlockNumber, latestEvent ? latestEvent.blockNumber : startBlockNumber);
        });

        // setInterval(async () => {
        //     const eventsCount = await this.getEventsCount();

        //     Object.values(this.trackers).forEach((tracker: EventTrackerService) => {
        //         this.logger.log(`------ Progress Events Loader ${tracker.getInfo().contractAddress}: ${(+tracker.getInfo().progress * 100).toFixed(2)}% count=${eventsCount}`);
        //     });
        // }, 10000);
    }

    getEventsCount(): Promise<number> {
        return this.eventsRepository.count();
    }

    addEvent = async (event: IEvent) => {
        try {
            const existingEvent = null;
            
            // await this.eventsRepository.findOne({
            //     where: {
            //         id: `${event.name}_${event.transactionHash}`,
            //     },
            // });

            if (!existingEvent) {
                const newEvent = this.eventsRepository.create({
                    id: `${event.name}_${event.transactionHash}`,
                    eventName: event.name,
                    eventValues: Object.keys(event.returnValues)
                        .filter((key: string) => isNaN(Number(key)) && key !== '__length__')
                        .reduce((acc: any, key: string) => {
                            acc[key] = event.returnValues[key];
                            return acc;
                        }, {}),
                    transactionHash: event.transactionHash,
                    blockNumber: event.blockNumber,
                    contractAddress: event.address,
                    tokenId: event.returnValues?.tokenId || '',
                    user: event.returnValues?.user || event.returnValues?.from || '',
                })

                return this.eventsRepository.save(newEvent);
            }
        } catch (err) {
            // return err;
        }
    }

    info = () => Object.values(this.trackers).map((tracker: EventTrackerService) => tracker.getInfo());
}
