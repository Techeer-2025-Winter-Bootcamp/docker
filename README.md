# Docker 실습 가이드

Docker 컨테이너 기술을 단계별로 학습하는 실습 가이드입니다.

## 📋 목차

1. [Docker Hub 이미지 실행](#1-docker-hub-이미지-실행)
2. [Dockerfile로 단일 컨테이너 실행](#2-dockerfile로-단일-컨테이너-실행)
3. [Docker Compose로 멀티 컨테이너 실행](#3-docker-compose로-멀티-컨테이너-실행)
4. [볼륨 매핑으로 Hot Reload 구현](#4-볼륨-매핑으로-hot-reload-구현)
5. [Docker Compose Watch 활용](#5-docker-compose-watch-활용)

---

## 1. Docker Hub 이미지 실행

Docker Hub에서 공식 이미지를 받아 간단히 컨테이너를 실행해봅니다.

### 실습: Nginx 웹 서버 실행

```bash
# 1. Docker Hub에서 nginx 이미지 다운로드
docker pull nginx:latest

# 2. 다운로드된 이미지 확인
docker images

# 3. 컨테이너 실행 (포트 8080을 80으로 매핑)
docker run -d -p 8080:80 --name my-nginx nginx:latest

# 4. 실행 중인 컨테이너 확인
docker ps

# 5. 브라우저에서 http://localhost:8080 접속하여 확인

# 6. 컨테이너 로그 확인
docker logs my-nginx

# 7. 컨테이너 중지 및 삭제
docker stop my-nginx
docker rm my-nginx
```

### 주요 명령어 설명
- `docker pull`: Docker Hub에서 이미지 다운로드
- `docker run -d`: 백그라운드에서 컨테이너 실행
- `docker run -p`: 호스트 포트와 컨테이너 포트 매핑
- `docker ps`: 실행 중인 컨테이너 목록 확인 
- `docker logs`: 컨테이너 로그 확인
---

## 2. Dockerfile로 단일 컨테이너 실행

FastAPI 애플리케이션을 Dockerfile로 이미지화하고 실행합니다.

### FastAPI 애플리케이션 구조

```
fastapi/
├── Dockerfile
├── requirements.txt
└── app/
    ├── __init__.py
    ├── main.py
    ├── models.py
    ├── schemas.py
    └── database.py
```

### Dockerfile 작성 예시

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 빌드 및 실행

```bash
# 1. FastAPI 디렉토리로 이동
cd fastapi

# 2. Docker 이미지 빌드
docker build -t my-fastapi:latest .

# 3. 빌드된 이미지 확인
docker images | grep my-fastapi

# 4. 컨테이너 실행
docker run -d -p 8000:8000 --name fastapi-container my-fastapi:latest

# 5. API 테스트
curl http://localhost:8000
curl http://localhost:8000/docs

# 6. 컨테이너 로그 확인
docker logs -f fastapi-container

# 7. 정리
docker stop fastapi-container
docker rm fastapi-container
```

### 주요 개념
- **FROM**: 베이스 이미지 지정
- **WORKDIR**: 작업 디렉토리 설정
- **COPY**: 파일을 이미지로 복사
- **RUN**: 이미지 빌드 시 실행할 명령어
- **CMD**: 컨테이너 시작 시 실행할 명령어

---

## 3. Docker Compose로 멀티 컨테이너 실행

FastAPI와 PostgreSQL을 Docker Compose로 함께 실행합니다.

### docker-compose.yml 구조

```yaml
version: '3.8'

services:
  fastapi:
    build: ./fastapi
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/dbname
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: dbname
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 실행 명령어

```bash
# 1. 프로젝트 루트로 이동
cd /Users/Documents/docker

# 2. 서비스 빌드 및 실행
docker compose up -d

# 3. 실행 중인 서비스 확인
docker compose ps

# 4. 로그 확인
docker compose logs -f

# 5. 특정 서비스 로그만 확인
docker compose logs -f fastapi

# 6. 서비스 중지
docker compose stop

# 7. 서비스 중지 및 컨테이너 삭제
docker compose down

# 8. 볼륨까지 함께 삭제
docker compose down -v
```

### 주요 개념
- **services**: 실행할 컨테이너들 정의
- **build**: Dockerfile을 이용한 이미지 빌드
- **image**: Docker Hub의 이미지 사용
- **depends_on**: 서비스 간 의존성 설정
- **environment**: 환경 변수 설정
- **volumes**: 데이터 영속성 보장

---

## 4. 볼륨 매핑으로 Hot Reload 구현

소스 코드를 수정하면 즉시 반영되도록 볼륨을 마운트합니다.

### docker-compose.yml에 볼륨 추가

```yaml
services:
  fastapi:
    build: ./fastapi
    ports:
      - "8000:8000"
    volumes:
      - ./fastapi/app:/app/app  # 소스 코드 마운트
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/dbname
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    depends_on:
      - postgres
```

### 실습 순서

```bash
# 1. Hot Reload가 적용된 서비스 시작
docker compose up -d

# 2. 로그 확인 (--reload 옵션이 활성화되었는지 확인)
docker compose logs fastapi

# 3. 소스 코드 수정
# fastapi/app/main.py 파일을 수정

# 4. 로그에서 자동 재시작 확인
docker compose logs -f fastapi
# "Detected file change in ..." 메시지 확인

# 5. 브라우저에서 변경사항 확인
# http://localhost:8000
```

### 볼륨 타입
- **바인드 마운트**: 호스트의 특정 경로를 컨테이너에 마운트
- **네임드 볼륨**: Docker가 관리하는 볼륨 (데이터 영속성)
- **익명 볼륨**: 임시 데이터 저장

### Hot Reload 동작 원리
1. 호스트에서 파일 수정
2. 바인드 마운트를 통해 컨테이너 내부 파일도 즉시 변경
3. uvicorn의 `--reload` 옵션이 파일 변경 감지
4. 애플리케이션 자동 재시작

---

## 4-1. 환경 변수 관리 (environment vs env_file)

Docker Compose에서 환경 변수를 설정하는 방법은 크게 3가지가 있습니다.

### 방법 1: environment (직접 작성)

docker-compose.yml에 직접 환경 변수를 작성하는 방법입니다.

```yaml
services:
  fastapi:
    build: ./fastapi
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/dbname
      - DEBUG=True
      - LOG_LEVEL=info
```

**장점**: 간단하고 명확함
**단점**: 민감한 정보가 코드에 노출됨, 환경별 관리 어려움

### 방법 2: env_file (권장)

별도의 `.env` 파일을 참조하는 방법입니다.

**docker-compose.yml 설정**:
```yaml
services:
  fastapi:
    build: ./fastapi
    env_file:
      - ./fastapi/.env
```

**fastapi/.env 파일**:
```bash
# Database Configuration
DATABASE_URL=postgresql://fastapi_user:fastapi_password@db:5432/fastapi_db
POSTGRES_USER=fastapi_user
POSTGRES_PASSWORD=fastapi_password
POSTGRES_DB=fastapi_db

# Application Configuration
APP_NAME=FastAPI Application
DEBUG=True
LOG_LEVEL=info

# API Keys
API_KEY=your_api_key_here
SECRET_KEY=your_secret_key_here
```

**장점**: 
- 환경별로 다른 .env 파일 사용 가능 (.env.dev, .env.prod)
- 민감한 정보를 Git에서 제외 가능
- 환경 변수 관리가 편리함

**단점**: 
- 파일 관리가 필요함

### 환경 변수 우선순위

Docker Compose에서 환경 변수는 다음 순서로 우선순위가 적용됩니다 (높음 → 낮음):

1. `docker compose run -e` 명령어로 전달된 변수
2. 셸 환경 변수
3. `environment` 설정
4. `env_file` 설정
5. Dockerfile의 `ENV`
6. 기본값 (변수가 정의되지 않은 경우)

### 보안 주의사항

⚠️ **절대로 Git에 커밋하지 말아야 할 것들**:
- `.env` 파일 (실제 비밀키, 패스워드 포함)
- 데이터베이스 비밀번호
- API 키, Secret 키
- 토큰, 인증서

✅ **Git에 커밋해도 되는 것들**:
- `.env.example` 파일 (템플릿, 실제 값 없음)
- docker-compose.yml (env_file 참조만 포함)
- .dockerignore (환경 변수 파일 제외 설정 포함)

### .gitignore 설정 확인

```gitignore
# Environment variables
.env
.env.local
.env.*.local
*.env

# 하지만 example 파일은 포함
!.env.example
```

### 환경별 .env 파일 관리

```bash
# 개발 환경
.env.development

# 테스트 환경
.env.test

# 프로덕션 환경
.env.production

# 사용 시
docker compose --env-file .env.development up -d
docker compose --env-file .env.production up -d
```

---

## 5. Docker Compose Watch 활용

Docker Compose v2.22+에서 제공하는 watch 기능으로 더 효율적인 개발 환경을 구축합니다.

### docker-compose.yml에 watch 설정 추가

```yaml
services:
  fastapi:
    build: ./fastapi
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/dbname
    depends_on:
      - postgres
    develop:
      watch:
        - action: sync
          path: ./fastapi/app
          target: /app/app
          ignore:
            - __pycache__/
        - action: rebuild
          path: ./fastapi/requirements.txt
```

### watch 모드 실행

```bash
# 1. watch 모드로 서비스 시작
docker compose watch

# 또는 up과 함께 사용
docker compose up --watch

# 2. 파일 수정 테스트
# - fastapi/app/main.py 수정 → 자동 sync
# - fastapi/requirements.txt 수정 → 자동 rebuild

# 3. 종료 (Ctrl+C)
```

### watch vs 볼륨 마운트 비교

| 항목 | 볼륨 마운트 | docker compose watch |
|------|------------|---------------------|
| 설정 복잡도 | 간단 | 약간 복잡 |
| 성능 | OS에 따라 다름 | 최적화됨 |
| 파일 동기화 | 실시간 | 실시간 |
| 선택적 무시 | .dockerignore | watch ignore |
| 의존성 변경 대응 | 수동 재빌드 | 자동 재빌드 |

---

## 🚀 전체 실습 플로우

```bash
# 1단계: 이미지 풀 실습
docker pull nginx
docker run -d -p 8080:80 nginx
docker stop $(docker ps -q)

# 2단계: 단일 컨테이너
cd fastapi
docker build -t my-fastapi .
docker run -d -p 8000:8000 my-fastapi
docker stop $(docker ps -q)

# 3단계: 멀티 컨테이너 (FastAPI + PostgreSQL)
cd ..
docker compose -f docker-compose.fastapi-postgres.yml up -d
docker compose -f docker-compose.fastapi-postgres.yml ps
docker compose -f docker-compose.fastapi-postgres.yml logs

# 4단계: Hot Reload 테스트
# docker-compose 파일에는 이미 volumes가 설정되어 있음
# fastapi/app/main.py 파일 수정하여 자동 반영 확인

# 5단계: Watch 모드
docker compose -f docker-compose.fastapi-postgres.yml watch
# 파일 수정하여 자동 동기화 확인

# 6단계: 정리
docker compose -f docker-compose.fastapi-postgres.yml down -v
```

### 서비스별 실습 예시

```bash
# FastAPI 실습
docker compose -f docker-compose.fastapi-postgres.yml up -d
curl http://localhost:8080
docker compose -f docker-compose.fastapi-postgres.yml down

# Express 실습
docker compose -f docker-compose.express-postgres.yml up -d
curl http://localhost:3000
docker compose -f docker-compose.express-postgres.yml down

# Django 실습
docker compose -f docker-compose.django-postgres.yml up -d
curl http://localhost:8000
docker compose -f docker-compose.django-postgres.yml down
```

---

## 📚 유용한 명령어 모음

### Docker 기본 명령어

```bash
# 이미지 관리
docker images                    # 이미지 목록
docker rmi <image-id>           # 이미지 삭제
docker image prune              # 사용하지 않는 이미지 삭제

# 컨테이너 관리
docker ps                       # 실행 중인 컨테이너
docker ps -a                    # 모든 컨테이너
docker stop <container-id>      # 컨테이너 중지
docker rm <container-id>        # 컨테이너 삭제
docker exec -it <container> bash # 컨테이너 접속

# 로그 및 모니터링
docker logs <container>         # 로그 확인
docker logs -f <container>      # 실시간 로그
docker stats                    # 리소스 사용량 확인
docker inspect <container>      # 상세 정보
```

### Docker Compose 명령어

```bash
# 기본 명령어
docker compose up               # 서비스 시작 (포그라운드)
docker compose up -d            # 서비스 시작 (백그라운드)
docker compose down             # 서비스 중지 및 삭제
docker compose down -v          # 볼륨까지 삭제

# 관리 명령어
docker compose ps               # 서비스 상태
docker compose logs             # 로그 확인
docker compose logs -f          # 실시간 로그
docker compose exec <service> bash  # 서비스 컨테이너 접속

# 빌드 관련
docker compose build            # 이미지 빌드
docker compose build --no-cache # 캐시 없이 빌드
docker compose up --build       # 빌드 후 시작

# watch 모드
docker compose watch            # watch 모드 시작
docker compose up --watch       # up과 함께 watch

# 특정 compose 파일 사용 (-f 옵션)
docker compose -f docker-compose.fastapi-postgres.yml up -d
docker compose -f docker-compose.express-postgres.yml up -d
docker compose -f docker-compose.django-postgres.yml up -d

# 여러 compose 파일 동시 실행
docker compose -f docker-compose.fastapi-postgres.yml -f docker-compose.express-postgres.yml up -d
```

### 서비스별 Compose 파일 실행 예시

```bash
# FastAPI + PostgreSQL 실행
docker compose -f docker-compose.fastapi-postgres.yml up -d
docker compose -f docker-compose.fastapi-postgres.yml logs -f
curl http://localhost:8080

# Express + PostgreSQL 실행
docker compose -f docker-compose.express-postgres.yml up -d
docker compose -f docker-compose.express-postgres.yml logs -f
curl http://localhost:3000

# Django + PostgreSQL 실행
docker compose -f docker-compose.django-postgres.yml up -d
docker compose -f docker-compose.django-postgres.yml logs -f
curl http://localhost:8000

# 각각 중지
docker compose -f docker-compose.fastapi-postgres.yml down
docker compose -f docker-compose.express-postgres.yml down
docker compose -f docker-compose.django-postgres.yml down
```

---

## 🔧 트러블슈팅

### 포트가 이미 사용 중일 때

Docker 컨테이너를 실행할 때 "port is already allocated" 에러가 발생하는 경우가 있습니다.

**macOS / Linux**
```bash
# 포트를 사용하는 프로세스 확인
lsof -i :8000

# 또는 netstat 사용
netstat -anv | grep 8000

# 해당 프로세스 종료
kill -9 <PID>
```

**Windows (PowerShell)**
```powershell
# 포트를 사용하는 프로세스 확인
netstat -ano | findstr :8000

# 해당 프로세스 종료
taskkill /PID <PID> /F
```

**Windows (CMD)**
```cmd
# 포트를 사용하는 프로세스 확인
netstat -ano | findstr :8000

# 해당 프로세스 종료
taskkill /PID <PID> /F
```

### 로컬에 설치된 DB와의 포트 충돌

**⚠️ 주의: 로컬에 PostgreSQL, MySQL, MongoDB 등이 설치되어 있으면 Docker 컨테이너와 포트 충돌이 발생합니다!**

#### 충돌 발생 원인

1. **같은 포트 사용**: 
   - PostgreSQL 기본 포트: 5432
   - MySQL 기본 포트: 3306
   - MongoDB 기본 포트: 27017
   - Redis 기본 포트: 6379

2. **로컬 DB가 이미 실행 중**: 
   - macOS/Linux: brew services로 설치한 DB는 자동 시작됨
   - Windows: 서비스로 등록된 DB는 부팅 시 자동 시작됨

3. **Docker 컨테이너 시도**: 
   - Docker Compose로 DB 컨테이너 실행 시 같은 포트를 사용하려 해서 충돌

#### 해결 방법

**방법 1: 로컬 DB 중지 (권장)**

macOS:
```bash
# PostgreSQL 중지
brew services stop postgresql

# MySQL 중지
brew services stop mysql

# MongoDB 중지
brew services stop mongodb-community

# 실행 중인 서비스 확인
brew services list
```

Linux (Ubuntu/Debian):
```bash
# PostgreSQL 중지
sudo systemctl stop postgresql

# MySQL 중지
sudo systemctl stop mysql

# MongoDB 중지
sudo systemctl stop mongod

# 서비스 상태 확인
sudo systemctl status postgresql
```

Windows (PowerShell 관리자 권한):
```powershell
# PostgreSQL 중지
Stop-Service postgresql-x64-<version>

# MySQL 중지
Stop-Service MySQL80

# MongoDB 중지
Stop-Service MongoDB

# 서비스 목록 확인
Get-Service | Where-Object {$_.Status -eq "Running"}
```

**방법 2: Docker 컨테이너의 포트 번호 변경**

docker-compose.yml에서 호스트 포트를 변경:

```yaml
services:
  postgres:
    image: postgres:15
    ports:
      - "5433:5432"  # 로컬 5432 대신 5433 사용
```

이후 애플리케이션 연결 시 변경된 포트 사용:
```bash
# 로컬 PostgreSQL: localhost:5432
# Docker PostgreSQL: localhost:5433
```

**방법 3: 로컬 DB 자동 시작 비활성화**

macOS:
```bash
# 자동 시작 비활성화
brew services stop postgresql

# 필요할 때만 수동 실행
postgres -D /usr/local/var/postgres
```

Windows (PowerShell 관리자 권한):
```powershell
# 자동 시작 비활성화
Set-Service -Name postgresql-x64-<version> -StartupType Manual
```

#### 포트 충돌 진단

```bash
# Docker Compose 실행 시 에러 확인
docker compose up

# 출력 예시:
# Error: Bind for 0.0.0.0:5432 failed: port is already allocated

# 1. 포트 사용 확인 (macOS/Linux)
lsof -i :5432

# 2. PostgreSQL 프로세스 확인 (macOS/Linux)
ps aux | grep postgres

# 3. 포트 사용 확인 (Windows)
netstat -ano | findstr :5432

# 4. 로컬 DB 접속 시도
psql -U postgres -h localhost -p 5432
# 접속되면 로컬 PostgreSQL이 실행 중
```

#### 개발 환경 권장 설정

**Docker를 사용할 때는 로컬 DB를 중지하는 것이 권장됩니다:**

✅ **장점**:
- 포트 충돌 없음
- 환경 일관성 (모든 개발자가 같은 DB 버전 사용)
- 격리된 환경 (로컬 시스템에 영향 없음)
- 쉬운 초기화 및 재설정

❌ **로컬 DB 사용 시 문제점**:
- 버전 차이로 인한 호환성 문제
- 데이터 정리 어려움
- 시스템 리소스 항상 사용
- 포트 충돌 관리 필요

### 이미지 캐시 문제
```bash
# 캐시 없이 재빌드
docker compose build --no-cache

# 모든 빌드 캐시 삭제
docker builder prune -a
```

---

## 📖 참고 자료

- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
- [Docker Hub](https://hub.docker.com/)
- [Docker Compose Watch](https://docs.docker.com/compose/file-watch/)

---
