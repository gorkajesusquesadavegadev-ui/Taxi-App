package com.taya.controller;
import com.taya.service.StatsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/stats")
public class StatsController {
    private final StatsService stats;
    public StatsController(StatsService s) { this.stats = s; }

    @GetMapping("/cliente") @PreAuthorize("hasRole('CLIENTE')")
    public StatsService.StatsResponse cliente(@AuthenticationPrincipal String uid) {
        return stats.statsDe(Long.valueOf(uid), false);
    }

    @GetMapping("/taxista") @PreAuthorize("hasRole('TAXISTA')")
    public StatsService.StatsResponse taxista(@AuthenticationPrincipal String uid) {
        return stats.statsDe(Long.valueOf(uid), true);
    }

    @GetMapping("/zonas") @PreAuthorize("hasRole('TAXISTA')")
    public List<StatsService.ZonaCaliente> zonas() {
        return stats.zonasCalientes();
    }
}
