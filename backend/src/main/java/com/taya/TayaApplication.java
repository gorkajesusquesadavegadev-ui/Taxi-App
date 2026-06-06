package com.taya;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TayaApplication {
    public static void main(String[] args) { SpringApplication.run(TayaApplication.class, args); }
}
