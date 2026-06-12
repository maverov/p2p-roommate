# Stage 1: Build the Maven application
FROM maven:3.9.6-eclipse-temurin-25 AS build
WORKDIR /app

# Copy pom.xml and download source dependencies to cache layers
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source tree and compile the distribution fat-jar
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimalist runtime footprint using Eclipse Temurin JDK 25
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Create a non-privileged system user for high-security isolation
RUN addgroup -S staygroup && adduser -S stayuser -G staygroup
USER stayuser

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Run JVM using explicit Virtual Thread optimization optimizations and container awareness
ENTRYPOINT ["java", \
            "-XX:+UseContainerSupport", \
            "-XX:+RAMPercentage=75.0", \
            "-Djava.security.egd=file:/dev/./urandom", \
            "-jar", \
            "app.jar"]