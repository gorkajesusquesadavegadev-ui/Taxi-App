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

    public record SubscribeRequest(
        @jakarta.validation.constraints.NotBlank(message = "Falta el endpoint de la suscripción")
        @jakarta.validation.constraints.Size(max = 1000, message = "Endpoint demasiado largo") String endpoint,
        @jakarta.validation.constraints.Size(max = 500, message = "Clave demasiado larga") String p256dh,
        @jakarta.validation.constraints.Size(max = 500, message = "Clave demasiado larga") String auth) {}

    @PostMapping("/subscribe")
    @Transactional
    public void subscribe(@AuthenticationPrincipal String uid, @jakarta.validation.Valid @RequestBody SubscribeRequest r) {
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
    public void unsubscribe(@jakarta.validation.Valid @RequestBody SubscribeRequest r) {
        if (r.endpoint() != null) subs.deleteByEndpoint(r.endpoint());
    }
}
