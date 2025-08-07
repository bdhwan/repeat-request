# Node.js 베이스 이미지 사용
FROM node:18-alpine

# non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사 (있는 경우)
COPY --chown=nodejs:nodejs package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 애플리케이션 소스 복사
COPY --chown=nodejs:nodejs . .

# non-root 사용자로 전환
USER nodejs

# 애플리케이션 포트 노출 (필요한 경우)
EXPOSE 3000

# 애플리케이션 실행
CMD ["node", "index.js"]