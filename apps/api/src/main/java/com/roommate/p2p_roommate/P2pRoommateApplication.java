package com.roommate.p2p_roommate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.roommate.p2p_roommate.global.security.GoogleOAuthProperties;
import com.roommate.p2p_roommate.global.security.JwtProperties;

@SpringBootApplication
@EnableConfigurationProperties({ JwtProperties.class, GoogleOAuthProperties.class })
public class P2pRoommateApplication {

	public static void main(String[] args) {
		SpringApplication.run(P2pRoommateApplication.class, args);
	}
}
