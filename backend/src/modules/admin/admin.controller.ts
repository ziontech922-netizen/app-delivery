import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { Auth, CurrentUser } from '@modules/auth/decorators';
import { AdminService } from './admin.service';
import {
  ApproveMerchantDto,
  SuspendMerchantDto,
  RejectMerchantDto,
  AdminCancelOrderDto,
  UpdateUserStatusDto,
  UpdateUserRoleDto,
  AdminRefundPaymentDto,
  AdminMerchantQueryDto,
  AdminOrderQueryDto,
  AdminUserQueryDto,
  AdminAuditQueryDto,
} from './dto';

@Controller('admin')
@Auth(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // =============================================
  // HELPER
  // =============================================

  private getAuditContext(adminId: string, req: Request) {
    return {
      adminId,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
  }

  // =============================================
  // DASHBOARD
  // =============================================

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // =============================================
  // MERCHANTS
  // =============================================

  @Get('merchants')
  async listMerchants(@Query() query: AdminMerchantQueryDto) {
    return this.adminService.listMerchants(query);
  }

  @Get('merchants/:id')
  async getMerchant(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getMerchantDetails(id);
  }

  @Post('merchants/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveMerchant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveMerchantDto,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    return this.adminService.approveMerchant(id, dto, this.getAuditContext(adminId, req));
  }

  @Post('merchants/:id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendMerchant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendMerchantDto,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    return this.adminService.suspendMerchant(id, dto, this.getAuditContext(adminId, req));
  }

  @Post('merchants/:id/activate')
  @HttpCode(HttpStatus.OK)
  async activateMerchant(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    return this.adminService.activateMerchant(id, this.getAuditContext(adminId, req));
  }

  @Post('merchants/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectMerchant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectMerchantDto,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    return this.adminService.rejectMerchant(id, dto, this.getAuditContext(adminId, req));
  }

  // =============================================
  // ORDERS
  // =============================================

  @Get('orders')
  async listOrders(@Query() query: AdminOrderQueryDto) {
    return this.adminService.listOrders(query);
  }

  @Get('orders/:id')
  async getOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getOrderDetails(id);
  }

  @Post('orders/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminCancelOrderDto,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    return this.adminService.cancelOrder(id, dto, this.getAuditContext(adminId, req));
  }

  // =============================================
  // USERS
  // =============================================

  @Get('users')
  async listUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Get('users/:id')
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    return this.adminService.updateUserStatus(id, dto, this.getAuditContext(adminId, req));
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    return this.adminService.updateUserRole(id, dto, this.getAuditContext(adminId, req));
  }

  // =============================================
  // PAYMENTS
  // =============================================

  @Get('payments')
  async listPayments(@Query() query: AdminOrderQueryDto) {
    return this.adminService.listPayments(query);
  }

  @Post('payments/:id/refund')
  @HttpCode(HttpStatus.OK)
  async refundPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminRefundPaymentDto,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    return this.adminService.refundPayment(id, dto, this.getAuditContext(adminId, req));
  }

  // =============================================
  // AUDIT LOGS
  // =============================================

  @Get('audit-logs')
  async listAuditLogs(@Query() query: AdminAuditQueryDto) {
    return this.adminService.listAuditLogs(query);
  }
}
