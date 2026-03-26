# Step 1 — Use a 2-stage build
# Stage 1: BUILD stage — compiles the Java code
# Stage 2: RUN stage — runs the compiled code
# Why 2 stages? The build stage needs Maven + JDK (big)
# The run stage only needs JRE (small)
# Final container is much smaller this way

# ── STAGE 1: BUILD ──
# eclipse-temurin = official Java distribution
# 17-jdk = Java 17 with full development kit
FROM eclipse-temurin:17-jdk AS build

# Create /app folder
WORKDIR /app

# Copy Maven wrapper and pom.xml first
COPY pom.xml .

# Copy source code
COPY src ./src

# Build the app — creates a .jar file in target/ folder
# -DskipTests = don't run tests during build (saves time)
RUN apt-get update && apt-get install -y maven && \
    mvn package -DskipTests

# ── STAGE 2: RUN ──
# Only needs JRE (Java Runtime) — much smaller than JDK
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy ONLY the built .jar file from Stage 1
# Everything else (Maven, source code) is left behind
COPY --from=build /app/target/*.jar app.jar

# Tell Docker this container uses port 8080
EXPOSE 8080

# Start Spring Boot
# Same as "java -jar app.jar" in your terminal
CMD ["java", "-jar", "app.jar"]