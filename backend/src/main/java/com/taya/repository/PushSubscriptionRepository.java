package com.taya.repository;
import com.taya.model.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {
    List<PushSubscription> findByUsuarioId(Long usuarioId);
    Optional<PushSubscription> findByEndpoint(String endpoint);
    void deleteByEndpoint(String endpoint);
}
