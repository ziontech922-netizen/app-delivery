import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { Auth, CurrentUser } from '@modules/auth/decorators';
import { UserRole } from '@prisma/client';
import {
  CreateDriverProfileDto,
  UpdateDriverProfileDto,
  UpdateLocationDto,
  SetAvailabilityDto,
  AcceptOrderDto,
  CompleteDeliveryDto,
  DriverQueryDto,
  NearbyDriversQueryDto,
  DriverOrdersQueryDto,
  ApproveDriverDto,
  SuspendDriverDto,
  RejectDriverDto,
  RegisterDriverDto,
} from './dto';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  // ===========================================
  // PUBLIC REGISTRATION
  // ===========================================

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  registerDriver(@Body() dto: RegisterDriverDto) {
    return this.driversService.registerDriver(dto);
  }

  // ===========================================
  // PROFILE ENDPOINTS (DRIVER)
  // ===========================================

  @Post('profile')
  @Auth(UserRole.DRIVER)
  createProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateDriverProfileDto,
  ) {
    return this.driversService.createProfile(userId, dto);
  }

  @Get('profile')
  @Auth(UserRole.DRIVER)
  getMyProfile(@CurrentUser('sub') userId: string) {
    return this.driversService.getMyProfile(userId);
  }

  @Patch('profile')
  @Auth(UserRole.DRIVER)
  updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateDriverProfileDto,
  ) {
    return this.driversService.updateProfile(userId, dto);
  }

  // Alias endpoints for frontend compatibility (/me = /profile)
  @Get('me')
  @Auth(UserRole.DRIVER)
  getMe(@CurrentUser('sub') userId: string) {
    return this.driversService.getMyProfile(userId);
  }

  @Patch('me')
  @Auth(UserRole.DRIVER)
  updateMe(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateDriverProfileDto,
  ) {
    return this.driversService.updateProfile(userId, dto);
  }

  @Patch('me/status')
  @Auth(UserRole.DRIVER)
  updateMyStatus(
    @CurrentUser('sub') userId: string,
    @Body() dto: SetAvailabilityDto,
  ) {
    return this.driversService.setAvailability(userId, dto);
  }

  @Get('me/stats')
  @Auth(UserRole.DRIVER)
  getMyStatsAlias(@CurrentUser('sub') userId: string) {
    return this.driversService.getMyStats(userId);
  }

  @Get('me/earnings/summary')
  @Auth(UserRole.DRIVER)
  getEarningsSummary(@CurrentUser('sub') userId: string) {
    return this.driversService.getEarningsSummary(userId);
  }

  @Get('me/earnings/daily')
  @Auth(UserRole.DRIVER)
  getDailyEarnings(
    @CurrentUser('sub') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.driversService.getDailyEarnings(userId, startDate, endDate);
  }

  // ===========================================
  // LOCATION & AVAILABILITY (DRIVER)
  // ===========================================

  @Post('location')
  @Auth(UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  updateLocation(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.driversService.updateLocation(userId, dto);
  }

  @Post('availability')
  @Auth(UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  setAvailability(
    @CurrentUser('sub') userId: string,
    @Body() dto: SetAvailabilityDto,
  ) {
    return this.driversService.setAvailability(userId, dto);
  }

  // ===========================================
  // ORDER MANAGEMENT (DRIVER)
  // ===========================================

  @Get('orders/available')
  @Auth(UserRole.DRIVER)
  getAvailableOrders(
    @CurrentUser('sub') userId: string,
    @Query() query: DriverOrdersQueryDto,
  ) {
    return this.driversService.getAvailableOrders(userId, query);
  }

  @Get('orders')
  @Auth(UserRole.DRIVER)
  getMyOrders(
    @CurrentUser('sub') userId: string,
    @Query() query: DriverOrdersQueryDto,
  ) {
    return this.driversService.getMyOrders(userId, query);
  }

  @Post('orders/accept')
  @Auth(UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  acceptOrder(
    @CurrentUser('sub') userId: string,
    @Body() dto: AcceptOrderDto,
  ) {
    return this.driversService.acceptOrder(userId, dto);
  }

  @Post('orders/complete')
  @Auth(UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  completeDelivery(
    @CurrentUser('sub') userId: string,
    @Body() dto: CompleteDeliveryDto,
  ) {
    return this.driversService.completeDelivery(userId, dto);
  }

  // ===========================================
  // STATISTICS (DRIVER)
  // ===========================================

  @Get('stats')
  @Auth(UserRole.DRIVER)
  getMyStats(@CurrentUser('sub') userId: string) {
    return this.driversService.getMyStats(userId);
  }

  // ===========================================
  // NEARBY DRIVERS (MERCHANT/ADMIN)
  // ===========================================

  @Get('nearby')
  @Auth(UserRole.MERCHANT, UserRole.ADMIN)
  findNearbyDrivers(@Query() query: NearbyDriversQueryDto) {
    return this.driversService.findNearbyDrivers(query);
  }

  // ===========================================
  // ADMIN ENDPOINTS
  // ===========================================

  @Get()
  @Auth(UserRole.ADMIN)
  listDrivers(@Query() query: DriverQueryDto) {
    return this.driversService.listDrivers(query);
  }

  @Get(':id')
  @Auth(UserRole.ADMIN)
  getDriverById(@Param('id') driverId: string) {
    return this.driversService.getDriverById(driverId);
  }

  @Post(':id/approve')
  @Auth(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  approveDriver(
    @Param('id') driverId: string,
    @Body() dto: ApproveDriverDto,
  ) {
    return this.driversService.approveDriver(driverId, dto);
  }

  @Post(':id/suspend')
  @Auth(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  suspendDriver(
    @Param('id') driverId: string,
    @Body() dto: SuspendDriverDto,
  ) {
    return this.driversService.suspendDriver(driverId, dto);
  }

  @Post(':id/activate')
  @Auth(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  activateDriver(@Param('id') driverId: string) {
    return this.driversService.activateDriver(driverId);
  }

  @Post(':id/reject')
  @Auth(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  rejectDriver(
    @Param('id') driverId: string,
    @Body() dto: RejectDriverDto,
  ) {
    return this.driversService.rejectDriver(driverId, dto);
  }
}
