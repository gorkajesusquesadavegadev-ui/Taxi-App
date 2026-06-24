package com.taya.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taya.model.PushSubscription;
import com.taya.repository.PushSubscriptionRepository;
import jakarta.annotation.PostConstruct;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.security.Security;
import java.util.List;
import java.util.Map;

/**
 * Envío de notificaciones Web Push (VAPID). Tolerante a fallos: nunca rompe el
 * flujo de negocio; las suscripciones caducadas (404/410) se eliminan solas.
 */
@Service
public class WebPushService {
    private static final Logger log = LoggerFactory.getLogger(WebPushService.class);
    private final PushSubscriptionRepository subs;
    private final ObjectMapper mapper = new ObjectMapper();
    private PushService pushService;

    @Value("${push.vapid.public}") private String publicKey;
    @Value("${push.vapid.private}") private String privateKey;
    @Value("${push.vapid.subject}") private String subject;

    public WebPushService(PushSubscriptionRepository subs) { this.subs = subs; }

    public String publicKey() { return publicKey; }

    @PostConstruct
    void init() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null)
            Security.addProvider(new BouncyCastleProvider());
        try {
            pushService = new PushService(publicKey, privateKey, subject);
        } catch (Exception e) {
            log.error("No se pudo inicializar Web Push (VAPID): {}", e.getMessage());
        }
    }

    /** Envía un push a todas las suscripciones del usuario (no bloquea al llamante). */
    @Async
    public void enviar(Long usuarioId, String title, String body, String url, String tag) {
        if (pushService == null) return;
        List<PushSubscription> lista = subs.findByUsuarioId(usuarioId);
        if (lista.isEmpty()) return;
        byte[] payload;
        try {
            payload = mapper.writeValueAsBytes(Map.of(
                "title", title == null ? "CanaryCab" : title,
                "body", body == null ? "" : body,
                "url", url == null ? "/" : url,
                "tag", tag == null ? "canarycab" : tag));
        } catch (Exception e) { return; }

        for (PushSubscription s : lista) {
            try {
                var notification = new Notification(s.getEndpoint(), s.getP256dh(), s.getAuth(), payload);
                var res = pushService.send(notification);
                int code = res.getStatusLine().getStatusCode();
                if (code == 404 || code == 410) {
                    subs.deleteById(s.getId()); // suscripción caducada
                }
            } catch (Exception e) {
                log.warn("Fallo enviando push a {}: {}", s.getUsuarioId(), e.getMessage());
            }
        }
    }
}
