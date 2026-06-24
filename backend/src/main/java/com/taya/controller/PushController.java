package com.taya.controller;
import com.taya.model.PushSubscription;
import com.taya.repository.PushSubscriptionRepository;
import com.taya.service.WebPushService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/push")
public class PushController {
    private final PushSubscriptionRepository subs;
    private final WebPushService push;
    public PushController(PushSubscriptionRepository subs, WebPushService push) {
        this.subs = subs; this.push = push;
    }

    /** Clave pública VAPID (pública por diseño): el navegador la usa al suscribirse. */
    @GetMapping("/vapid-public-key")
    public Map<String, String> vapidKey() { return Map.of("publicKey", push.publicKey()); }

    public record SubscribeRequest(String endpoint, String p256dh, String auth) {}

    @PostMapping("/subscribe")
    @Transactional
    public void subscribe(@AuthenticationPrincipal String uid, @RequestBody SubscribeRequest r) {
        if (r.endpoint() == null || r.p256dh() == null || r.auth() == null) return;
        var sub = subs.findByEndpoint(r.endpoint()).orElseGet(PushSubscription::new);
        sub.setUsuarioId(Long.valueOf(uid));
        sub.setEndpoint(r.endpoint());
        sub.setP256dh(r.p256dh());
        sub.setAuth(r.auth());
        subs.save(sub);
    }

    @PostMapping("/unsubscribe")
    @Transactional
    public void unsubscribe(@RequestBody SubscribeRequest r) {
        if (r.endpoint() != null) subs.deleteByEndpoint(r.endpoint());
    }
}
