package com.roommate.p2p_roommate;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class P2pRoommateApplicationTests {

	@Test
	void contextLoads() {
	}

}
