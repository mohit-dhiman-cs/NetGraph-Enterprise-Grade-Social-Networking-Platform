package com.netgraph.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import com.netgraph.backend.entity.*;

@SpringBootApplication
@EnableCaching
@EntityScan(basePackageClasses = { User.class, Post.class, Message.class, Comment.class })
@EnableJpaRepositories("com.netgraph.backend.repository")
public class NetGraphApplication {

	public static void main(String[] args) {
		SpringApplication.run(NetGraphApplication.class, args);
	}

}
