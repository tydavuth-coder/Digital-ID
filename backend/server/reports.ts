import PDFDocument from "pdfkit";
import type { User } from "../drizzle/schema";

export interface ReportData {
  totalUsers: number;
  activeUsers: number;
  pendingKYC: number;
  approvedKYC: number;
  rejectedKYC: number;
  activeSessions: number;
  userGrowthData: Array<{ month: string; count: number }>;
  kycApprovalData: Array<{ month: string; approved: number; rejected: number }>;
  serviceUsageData: Array<{ service: string; connections: number }>;
  recentUsers: User[];
  dateRange: { start: Date; end: Date };
  reportType: "monthly" | "quarterly";
}

export async function generatePDFReport(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .fillColor("#1e3a8a")
        .text("Digital ID System", { align: "center" });

      doc
        .fontSize(18)
        .fillColor("#3b82f6")
        .text(
          `${data.reportType === "monthly" ? "Monthly" : "Quarterly"} Analytics Report`,
          { align: "center" }
        );

      doc
        .fontSize(10)
        .fillColor("#6b7280")
        .text(
          `Report Period: ${data.dateRange.start.toLocaleDateString()} - ${data.dateRange.end.toLocaleDateString()}`,
          { align: "center" }
        );

      doc
        .fontSize(8)
        .text(`Generated: ${new Date().toLocaleString()}`, { align: "center" })
        .moveDown(2);

      // Summary Statistics
      doc.fontSize(16).fillColor("#1e3a8a").text("Executive Summary", { underline: true });
      doc.moveDown(0.5);

      const summaryData = [
        { label: "Total Users", value: data.totalUsers, color: "#3b82f6" },
        { label: "Active Users", value: data.activeUsers, color: "#10b981" },
        { label: "Pending KYC", value: data.pendingKYC, color: "#f59e0b" },
        { label: "Approved KYC", value: data.approvedKYC, color: "#10b981" },
        { label: "Rejected KYC", value: data.rejectedKYC, color: "#ef4444" },
        { label: "Active Sessions", value: data.activeSessions, color: "#8b5cf6" },
      ];

      let yPosition = doc.y;
      summaryData.forEach((item, index) => {
        const xPosition = 50 + (index % 2) * 250;
        if (index % 2 === 0 && index > 0) {
          yPosition += 60;
        }

        doc
          .rect(xPosition, yPosition, 200, 50)
          .fillAndStroke("#f3f4f6", "#e5e7eb");

        doc
          .fontSize(10)
          .fillColor("#6b7280")
          .text(item.label, xPosition + 10, yPosition + 10);

        doc
          .fontSize(20)
          .fillColor(item.color)
          .text(item.value.toString(), xPosition + 10, yPosition + 25);
      });

      doc.y = yPosition + 70;
      doc.moveDown(1);

      // User Growth Trend
      doc.fontSize(16).fillColor("#1e3a8a").text("User Growth Trend", { underline: true });
      doc.moveDown(0.5);

      if (data.userGrowthData.length > 0) {
        doc.fontSize(10).fillColor("#374151");

        const chartHeight = 120;
        const chartWidth = 450;
        const chartX = 70;
        const chartY = doc.y;

        // Draw chart axes
        doc
          .moveTo(chartX, chartY)
          .lineTo(chartX, chartY + chartHeight)
          .lineTo(chartX + chartWidth, chartY + chartHeight)
          .stroke("#9ca3af");

        // Find max value for scaling
        const maxValue = Math.max(1, ...data.userGrowthData.map((d) => d.count));
        const barWidth = chartWidth / data.userGrowthData.length - 10;

        // Draw bars
        data.userGrowthData.forEach((item, index) => {
          const barHeight = maxValue > 0 ? (item.count / maxValue) * chartHeight : 0;
          const x = chartX + index * (barWidth + 10) + 5;
          const y = chartY + chartHeight - barHeight;

          doc.rect(x, y, barWidth, barHeight).fillAndStroke("#3b82f6", "#2563eb");

          // Month label
          doc
            .fontSize(8)
            .fillColor("#6b7280")
            .text(item.month, x - 5, chartY + chartHeight + 5, {
              width: barWidth + 10,
              align: "center",
            });

          // Value label
          doc
            .fontSize(8)
            .fillColor("#1e3a8a")
            .text(item.count.toString(), x - 5, y - 15, {
              width: barWidth + 10,
              align: "center",
            });
        });

        doc.y = chartY + chartHeight + 30;
      } else {
        doc.fontSize(10).fillColor("#9ca3af").text("No data available for this period");
      }

      doc.moveDown(2);

      // KYC Approval Rate
      doc.addPage();
      doc.fontSize(16).fillColor("#1e3a8a").text("KYC Verification Trends", { underline: true });
      doc.moveDown(0.5);

      if (data.kycApprovalData.length > 0) {
        const totalApproved = data.kycApprovalData.reduce((sum, d) => sum + d.approved, 0);
        const totalRejected = data.kycApprovalData.reduce((sum, d) => sum + d.rejected, 0);
        const total = totalApproved + totalRejected;
        const approvalRate = total > 0 ? ((totalApproved / total) * 100).toFixed(1) : "0";

        doc
          .fontSize(12)
          .fillColor("#374151")
          .text(`Overall Approval Rate: ${approvalRate}%`, { align: "center" });

        doc
          .fontSize(10)
          .fillColor("#10b981")
          .text(`Approved: ${totalApproved}`, { continued: true, align: "center" })
          .fillColor("#6b7280")
          .text(" | ", { continued: true })
          .fillColor("#ef4444")
          .text(`Rejected: ${totalRejected}`);

        doc.moveDown(1);

        // KYC trend table
        const tableTop = doc.y;
        const col1X = 70;
        const col2X = 250;
        const col3X = 400;

        doc.fontSize(10).fillColor("#1e3a8a").font("Helvetica-Bold");
        doc.text("Month", col1X, tableTop);
        doc.text("Approved", col2X, tableTop);
        doc.text("Rejected", col3X, tableTop);

        doc.font("Helvetica");
        let rowY = tableTop + 20;

        data.kycApprovalData.forEach((item) => {
          doc.fillColor("#374151").text(item.month, col1X, rowY);
          doc.fillColor("#10b981").text(item.approved.toString(), col2X, rowY);
          doc.fillColor("#ef4444").text(item.rejected.toString(), col3X, rowY);
          rowY += 20;
        });

        doc.y = rowY + 10;
      } else {
        doc.fontSize(10).fillColor("#9ca3af").text("No KYC data available for this period");
      }

      doc.moveDown(2);

      // Service Usage
      doc.fontSize(16).fillColor("#1e3a8a").text("Service Usage Statistics", { underline: true });
      doc.moveDown(0.5);

      if (data.serviceUsageData.length > 0) {
        const tableTop = doc.y;
        const col1X = 70;
        const col2X = 400;

        doc.fontSize(10).fillColor("#1e3a8a").font("Helvetica-Bold");
        doc.text("Service Name", col1X, tableTop);
        doc.text("Connections", col2X, tableTop);

        doc.font("Helvetica");
        let rowY = tableTop + 20;

        data.serviceUsageData.forEach((item) => {
          doc.fillColor("#374151").text(item.service, col1X, rowY);
          doc.fillColor("#3b82f6").text(item.connections.toString(), col2X, rowY);
          rowY += 20;
        });

        doc.y = rowY + 10;
      } else {
        doc.fontSize(10).fillColor("#9ca3af").text("No service usage data available");
      }

      doc.moveDown(2);

      // Recent Users
      if (data.recentUsers.length > 0) {
        doc.addPage();
        doc.fontSize(16).fillColor("#1e3a8a").text("Recent User Registrations", { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const col1X = 50;
        const col2X = 200;
        const col3X = 350;
        const col4X = 480;

        doc.fontSize(9).fillColor("#1e3a8a").font("Helvetica-Bold");
        doc.text("Name", col1X, tableTop);
        doc.text("Email", col2X, tableTop);
        doc.text("Status", col3X, tableTop);
        doc.text("KYC", col4X, tableTop);

        doc.font("Helvetica");
        let rowY = tableTop + 20;

        data.recentUsers.slice(0, 20).forEach((user) => {
          if (rowY > 700) {
            doc.addPage();
            rowY = 50;
          }

          doc
            .fillColor("#374151")
            .text(user.nameEnglish || user.username || "N/A", col1X, rowY, {
              width: 140,
              ellipsis: true,
            });
          doc.text(user.email || "N/A", col2X, rowY, { width: 140, ellipsis: true });
          doc.text(user.status, col3X, rowY);
          doc.text(user.kycStatus, col4X, rowY);
          rowY += 18;
        });
      }

      // Footer - add to each page as they are created
      // Note: Footer is already added during page creation, no need to loop

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
