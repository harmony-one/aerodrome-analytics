import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiExtraModels, ApiQuery, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { StatisticService } from './statistic.service';
import { IGetQueryParams } from 'src/interfaces';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';

export class UserQueryDto implements IGetQueryParams {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  skip?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  blockNumberFrom?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  blockNumberTo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timestampFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timestampTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  order?: 'ASC' | 'DESC';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: 'blockNumber' | 'timestamp';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wallet?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  positionId?: string;
}

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

    return this.statisticService.getInfoByPosition(id);
  }

  @Get('/wallets/:id')
  getWallet(@Param('id') id: string) {
    return this.statisticService.getStatisticByWallet(id);
  }

  @Get('/by-ticks/:id')
  getAnalysis(@Param('id') id: string) {
    return this.statisticService.getStatisticByTicks(Number(id));
  }

  @Get('/grouped-by-ticks/:id')
  getGroupedByTicks(@Param('id') id: string) {
    return this.statisticService.getExtendedStatisticByTicks(Number(id));
  }

  @Get('/events')
  getEvents(@Query() query: UserQueryDto) {
    return this.statisticService.getEvents(query);
  }

  @Get('/positions')
  getPositions(@Query() query: UserQueryDto) {
    return this.statisticService.getPositions(query);
  }

  @Get('/compiled-positions')
  getCompiledPositions(@Query() query: UserQueryDto) {
    return this.statisticService.getCompiledPositions(query);
  }

  @Get('/compiled-rewards')
  getCompiledRewards(@Query() query: UserQueryDto) {
    return this.statisticService.getCompiledRewards(query);
  }
}
