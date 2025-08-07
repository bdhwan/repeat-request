# repeat-request

크론탭과 유사한 기능을 하는 HTTP 요청 스케줄러 서버

## 기능

- 초(s), 분(m), 시간(h) 단위 반복 요청
- 크론 표현식을 사용한 스케줄링
- GET, POST 등 다양한 HTTP 메서드 지원
- 요청 및 응답 로깅

## 사용법

### 환경변수

- `CRON_SCHEDULE`: 스케줄 설정 (필수)
- `REQUEST_TIMEOUT`: 요청 타임아웃 시간 (초 단위, 기본값: 60)

스케줄 설정 예시:
```
10s, POST, http://localhost:8080/api/v1/test
1m, GET, http://localhost:8080/api/v1/test
1h, GET, http://localhost:8080/api/v1/test
0 10 * * *, GET, http://localhost:8080/api/v1/test
```

### Docker 실행

```bash
docker build -t bdhwan/repeat-request:0.0.1 .

# 기본 타임아웃(60초) 사용
docker run -e CRON_SCHEDULE="10s, GET, http://example.com/api" bdhwan/repeat-request:0.0.1

# 커스텀 타임아웃(30초) 설정
docker run -e REQUEST_TIMEOUT=30 -e CRON_SCHEDULE="10s, GET, http://example.com/api" bdhwan/repeat-request:0.0.1
```

### Docker Stack 예시

#### 기본 설정
```yaml
version: "3.8"
services:
  repeat-request:
    image: bdhwan/repeat-request:0.0.1
    environment:
      REQUEST_TIMEOUT: 60
      CRON_SCHEDULE: |
        10s, POST, http://localhost:8080/api/v1/test
        1m, GET, http://localhost:8080/api/v1/test
        1h, GET, http://localhost:8080/api/v1/test
        0 10 * * *, GET, http://localhost:8080/api/v1/test
    volumes:
      - /etc/localtime:/etc/localtime:ro
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.platform.arch == x86_64
```

#### CloudWatch 로그 설정 포함
```yaml
version: "3.8"
services:
  repeat-request:
    image: bdhwan/repeat-request:0.0.1
    environment:
      REQUEST_TIMEOUT: 60
      CRON_SCHEDULE: |
        10s, POST, http://localhost:8080/api/v1/test
        1m, GET, http://localhost:8080/api/v1/test
        1h, GET, http://localhost:8080/api/v1/test
        0 10 * * *, GET, http://localhost:8080/api/v1/test
    volumes:
      - /etc/localtime:/etc/localtime:ro
    logging:
      driver: awslogs
      options:
        awslogs-group: /ecs/repeat-request
        awslogs-region: ap-northeast-2
        awslogs-stream-prefix: repeat-request
        awslogs-create-group: "true"
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.platform.arch == x86_64
```

#### CloudWatch 로그 설정 (Docker Swarm)
```yaml
version: "3.8"
services:
  repeat-request:
    image: bdhwan/repeat-request:0.0.1
    environment:
      REQUEST_TIMEOUT: 60
      CRON_SCHEDULE: |
        10s, POST, http://localhost:8080/api/v1/test
        1m, GET, http://localhost:8080/api/v1/test
        1h, GET, http://localhost:8080/api/v1/test
        0 10 * * *, GET, http://localhost:8080/api/v1/test
    volumes:
      - /etc/localtime:/etc/localtime:ro
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.platform.arch == x86_64
      labels:
        - "com.datadoghq.ad.logs"='[{"source": "nodejs", "service": "repeat-request"}]'
    logging:
      driver: awslogs
      options:
        awslogs-group: /aws/dockerswarm/repeat-request
        awslogs-region: ap-northeast-2
        awslogs-stream-prefix: repeat-request
        awslogs-datetime-format: '%Y-%m-%dT%H:%M:%S.%fZ'
        tag: "{{.Name}}/{{.ID}}"
```

## 테스트

```bash
# 의존성 설치
npm install

# 테스트 실행
npm test

# 커버리지 포함 테스트
npm run test:coverage

# Docker Compose로 통합 테스트
docker-compose -f docker-compose.test.yml up
```

## 로그 형식

### 요청 시작
```
[2024-01-01T12:00:00.000Z] GET http://example.com/api
```

### 요청 완료
```
[2024-01-01T12:00:00.500Z] 500ms GET http://example.com/api 200 OK
```

### 오류 발생
```
[2024-01-01T12:00:00.500Z] 500ms GET http://example.com/api ERROR Connection refused
```