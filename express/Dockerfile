# Node.js 18-alpine 이미지 사용
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /backend

# package.json과 package-lock.json 파일을 작업 디렉토리로 복사
COPY package*.json ./

# npm 패키지 설치
RUN npm install

# 나머지 소스 파일을 작업 디렉토리로 복사
COPY . .

EXPOSE 3000

# 개발 서버 시작
CMD ["npm", "run", "dev"]