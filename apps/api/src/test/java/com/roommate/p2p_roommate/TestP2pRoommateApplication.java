package com.roommate.p2p_roommate;

import org.springframework.boot.SpringApplication;

public class TestP2pRoommateApplication {

	public static void main(String[] args) {
		SpringApplication.from(P2pRoommateApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
