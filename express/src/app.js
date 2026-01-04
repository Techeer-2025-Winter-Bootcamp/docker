const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// 데이터베이스 연결 및 모델 동기화
const sequelize = require('./db');
const Board = require('./models/Board');

// 테이블 자동 생성 (개발 환경)
sequelize.sync({ alter: false })
    .then(() => {
        console.log('Database synchronized');
    })
    .catch((error) => {
        console.error('Error synchronizing database:', error);
    });

// Swagger UI
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 기본 라우트
app.get('/', (req, res) => {
    res.json({ message: 'Express Board API (Sequelize ORM)' });
});

// 게시판 라우트
const boardRoutes = require('./routes/boards');
app.use('/boards', boardRoutes);

// 서버 시작
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Swagger docs available at http://localhost:${port}/swagger`);
}); 