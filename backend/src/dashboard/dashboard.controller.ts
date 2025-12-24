import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê tổng quan dashboard' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async getStats(@Req() req) {
    const tenantId = req.user.tenantId;
    return this.dashboardService.getStats(tenantId);
  }

  @Get('recent-activities')
  @ApiOperation({ summary: 'Lấy hoạt động gần đây' })
  async getRecentActivities(@Req() req) {
    const tenantId = req.user.tenantId;
    return this.dashboardService.getRecentActivities(tenantId);
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Lấy dữ liệu biểu đồ doanh thu 12 tháng' })
  async getRevenueChart(@Req() req) {
    const tenantId = req.user.tenantId;
    return this.dashboardService.getRevenueChart(tenantId);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm bán chạy' })
  async getTopProducts(@Req() req) {
    const tenantId = req.user.tenantId;
    return this.dashboardService.getTopProducts(tenantId);
  }
}
