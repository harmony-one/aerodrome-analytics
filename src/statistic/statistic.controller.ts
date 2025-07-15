import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { StatisticService } from './statistic.service';

@ApiTags('stats')
@Controller('stats')
export class StatisticController {
  constructor(
    private readonly configService: ConfigService,
    private readonly statisticService: StatisticService
  ) { }
  @Get('/positions/:id')
  getPosition(@Param('id') id: string, @Query() query: any) {
    if(query.walletId) {
      return this.statisticService.getPositionByWallet(query.walletId);
    } 

    return this.statisticService.getPosition(id);
  }

  // @Get('/wallets/:id')
  // getWallet(@Param('id') id: string) {
  //   return this.statisticService.getWallet(id);
  // }

  @Get('/positions')
  getPositions() {
    return this.statisticService.getPositions();
  }

  @Get('/by-ticks/:id')
  getAnalysis(@Param('id') id: string) {
    return this.statisticService.getStatisticByTicks(Number(id));
  }

  @Get('/grouped-by-ticks/:id')
  getGroupedByTicks(@Param('id') id: string) {
    return this.statisticService.getExtendedStatisticByTicks(Number(id));
  }
}
