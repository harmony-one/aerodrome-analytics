import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { LoaderService } from './loader.service';

@ApiTags('positions-loader')
@Controller('positions-loader')
export class LoaderController {
  constructor(
    private readonly configService: ConfigService,
    private readonly loaderService: LoaderService
  ) { }
  @Get('/info')
  getInfo() {
    return this.loaderService.info();
  }

  @Get('/latest-100-data')
  getLatest100Data() {
    return this.loaderService.getLatest100Data();
  }
}
