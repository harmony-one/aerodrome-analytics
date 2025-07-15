import { AbiItem } from 'web3-utils/types';
import Web3 from 'web3';
import {
  getContractDeploymentBlock,
  getEventsAbi,
  getHmyLogs,
} from './api';

import EventEmitter = require('events');
import { Injectable, Logger } from '@nestjs/common';
import { IEvent } from 'src/interfaces';
import moment = require('moment');
// const { ethers } = require("ethers");

export interface IEventTrackerService {
  contractAddress: string;
  contractAbi: any[];
  getEventCallback: (IEvent) => Promise<any>;
  onComplete: () => Promise<any>;
  chain?: 'bsc' | 'eth' | 'hmy';
  eventName?: string;
  web3: Web3;
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

@Injectable()
export class EventTrackerService {
  private readonly logger = new Logger(EventTrackerService.name);
  dbCollectionPrefix = '';

  chain: 'hmy' | 'eth' | 'bsc' = "eth";

  events: any[] = [];

  lastBlock = 0;
  lastNodeBlock = 0;
  startBlock = 0;
  lastSuccessfulRead = 0;
  contractAddress = '';

  blocksInterval = 5000;
  waitInterval = 500;
  cacheLimit = 10000;

  abiEvents: Record<string, AbiItem>;
  contractAbiEvents: any[];
  eventLogs = [];
  eventName = '';

  getEventCallback: (IEvent) => Promise<any>;
  onComplete: () => Promise<any>;
  contract: any;

  web3: Web3;

  latestRequestTime = 0;

  constructor(
    params: IEventTrackerService,
  ) {
    this.web3 = params.web3;
    this.chain = params.chain || 'eth';

    this.contractAddress = params.contractAddress;
    this.abiEvents = getEventsAbi(this.web3, params.contractAbi);
    this.getEventCallback = params.getEventCallback;
    this.onComplete = params.onComplete || (() => Promise.resolve());
    this.contract = new this.web3.eth.Contract(params.contractAbi, params.contractAddress);
    this.eventName = params.eventName;
  }

  async start(startBlock: number, lastBlock: number) {
    try {
      // this.lastBlock = await getContractDeploymentBlock(this.contractAddress);
      // this.startBlock = this.lastBlock;

      this.lastNodeBlock = await this.web3.eth.getBlockNumber();

      this.lastBlock = lastBlock;
      this.startBlock = startBlock;

      // if (!startBlock) {
      //   this.lastBlock = this.lastNodeBlock - 30000;
      //   this.startBlock = this.lastBlock;
      // } else {
      //   this.lastBlock = startBlock;
      //   this.startBlock = startBlock;
      // }

      // const defStartBlock = Number(this.lastNodeBlock) - 250000;

      // const req = await this.getAllEvents({ size: 1, page: 0, sort: { blockNumber: -1 } });

      // if (req.content.length) {
      //   this.lastBlock = req.content[0].blockNumber;
      //   // this.lastBlock = Number(this.lastBlock) - 250000; // reload last 5 days on restart
      //   this.lastBlock = Number(this.lastBlock) - 100000; // reload last 2 days on restart
      // }

      // this.lastBlock = Math.max(this.lastBlock, defStartBlock);
      // this.startBlock = this.lastBlock;

      setTimeout(this.readEvents, 100);

      // this.logger.log(`Start Event Service ${this.dbCollectionPrefix} - ok`, {
      //   lastBlock: this.lastBlock,
      //   startBlock: this.startBlock,
      // });
    } catch (e) {
      this.logger.error(`Start ${this.dbCollectionPrefix}`, { error: e });
      throw new Error(`start ${this.dbCollectionPrefix}: ${e.message}`);
    }
  }

  addIfNotFoundMany = async (events: IEvent[]) => {
    for (let i = 0; i < events.length; i++) {
      const collectionName = `${this.dbCollectionPrefix}_data`;

      // const dbEvent = await this.database.find(collectionName, {
      //   transactionHash: events[i].transactionHash,
      //   data: events[i].data,
      // });

      // if (!dbEvent) {
      //   await this.database.insert(collectionName, events[i]);
      // }
    }
  };

  readEvents = async () => {
    try {
      const start = Date.now();

      this.lastNodeBlock = await this.web3.eth.getBlockNumber();

      if (this.lastNodeBlock > this.lastBlock) {
        const from = this.lastBlock;
        const to =
          from + this.blocksInterval > this.lastNodeBlock
            ? this.lastNodeBlock
            : from + this.blocksInterval;

        let result = [];

        if (this.chain === "hmy") {
          const res = await getHmyLogs({
            fromBlock: '0x' + from.toString(16),
            toBlock: '0x' + to.toString(16),
            address: this.contractAddress,
          });

          result = res.result;
        } else {
          result = await this.contract.getPastEvents(this.eventName || "allEvents", {
            fromBlock: '0x' + from.toString(16),
            toBlock: '0x' + to.toString(16),
          });
        }

        const events = [];

        for (let i = 0; i < result.length; i++) {
          const item = result[i];

          const topics = this.chain === 'hmy' ? item.topics : item.raw.topics;
          const data = this.chain === 'hmy' ? item.data : item.raw.data;

          const topic = topics[0].toLowerCase();
          const abiItem = this.abiEvents[topic];

          if (abiItem) {
            const returnValues = this.web3.eth.abi.decodeLog(
              abiItem.inputs,
              data,
              topics.slice(1)
            );

            events.push({
              ...item,
              name: abiItem.name,
              returnValues,
              blockNumber: Number(item.blockNumber),
              topics
            });
          }
        }

        const uniqEvents = {};

        for (let i = 0; i < events.length; i++) {
          const event = events[i];

          uniqEvents[event.name + '_' + event.transactionHash] = event;
        }

        if (Object.values(uniqEvents).length) {
          // save events to DB
          // await this.addIfNotFoundMany(events);

          // send events to other services via eventsEmitter
          // events.forEach(event => this.eventEmitter.emit(event.name, event));
          await Promise.all(Object.values(uniqEvents).map(async e => await this.getEventCallback(e)));
        }

        // cache - disabled
        // this.events = this.eventLogs.concat(events);

        this.lastBlock = to;
        this.lastSuccessfulRead = Date.now();

        // console.log('Last block: ', this.lastBlock);

        this.latestRequestTime = (Date.now() - start) / 1000;
      } else {
        await this.onComplete();
        await sleep(20);
      }
    } catch (e) {
      this.logger.error('Error getEvents', { error: e, message: e.message });
    }

    setTimeout(this.readEvents, this.waitInterval);
  };

  getProgress = () =>
    ((this.lastBlock - this.startBlock) / (this.lastNodeBlock - this.startBlock) * 100).toFixed(4);

  getInfo = () => {
    const timeToLoad = this.latestRequestTime * (this.lastNodeBlock - this.lastBlock) / this.blocksInterval;
    const timeToLoadFormatted = moment.duration(timeToLoad, 'seconds').humanize();

    return {
      progress: this.getProgress(),
      lastBlock: this.lastBlock,
      lastNodeBlock: this.lastNodeBlock,
      lastSuccessfulRead: this.lastSuccessfulRead,
      blocksInterval: this.blocksInterval,
      dbCollectionPrefix: this.dbCollectionPrefix,
      contractAddress: this.contractAddress,
      waitInterval: this.waitInterval,
      latestRequestTime: this.latestRequestTime,
      timeToLoadFormatted,
      timeToLoad,
    };
  };

  getAllEvents = async (params: any) => ({ content: [] });
}