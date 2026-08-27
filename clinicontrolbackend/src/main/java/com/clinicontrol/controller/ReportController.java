package com.clinicontrol.controller;

import com.clinicontrol.security.AuthenticatedUser;
import com.clinicontrol.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/rest/v1/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final ReportService reportService;

    /**
     * Returns inventory report data for a date range (used for PDF generation).
     */
    @GetMapping("/inventory")
    public ResponseEntity<?> getInventoryReport(@AuthenticationPrincipal AuthenticatedUser user,
                                                 @RequestParam(name = "start_date") String startDate,
                                                 @RequestParam(name = "end_date") String endDate) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        try {
            Map<String, Object> data = reportService.getInventoryReportData(user.getClinicId(), startDate, endDate);
            return ResponseEntity.ok(data);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error generating inventory report", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An internal error occurred"));
        }
    }

    /**
     * Returns all inventory data for CSV export (no date filter).
     */
    @GetMapping("/inventory/csv")
    public ResponseEntity<?> getCsvExport(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user.getClinicId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "No clinic access"));
        }
        try {
            List<Map<String, Object>> rows = reportService.getCsvExportData(user.getClinicId());
            return ResponseEntity.ok(rows);
        } catch (Exception e) {
            log.error("Error generating CSV export data", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "An internal error occurred"));
        }
    }
}
