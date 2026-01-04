const express = require('express');
const router = express.Router();
const Board = require('../models/Board');

/**
 * @swagger
 * components:
 *   schemas:
 *     Board:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - author
 *       properties:
 *         id:
 *           type: integer
 *           description: 게시글 ID
 *         title:
 *           type: string
 *           description: 게시글 제목
 *         content:
 *           type: string
 *           description: 게시글 내용
 *         author:
 *           type: string
 *           description: 작성자
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 생성 시간
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: 수정 시간
 */

/**
 * @swagger
 * /boards:
 *   get:
 *     summary: 게시글 목록 조회
 *     tags: [Boards]
 *     responses:
 *       200:
 *         description: 게시글 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Board'
 */
router.get('/', async (req, res) => {
    try {
        const boards = await Board.findAll({
            order: [['created_at', 'DESC']]
        });
        res.json(boards);
    } catch (error) {
        console.error('Error fetching boards:', error);
        res.status(500).json({ error: 'Failed to fetch boards' });
    }
});

/**
 * @swagger
 * /boards:
 *   post:
 *     summary: 게시글 생성
 *     tags: [Boards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - author
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               author:
 *                 type: string
 *     responses:
 *       201:
 *         description: 게시글 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Board'
 *       400:
 *         description: 잘못된 요청
 */
router.post('/', async (req, res) => {
    const { title, content, author } = req.body;

    if (!title || !content || !author) {
        return res.status(400).json({ error: 'Title, content, and author are required' });
    }

    try {
        const board = await Board.create({
            title,
            content,
            author
        });
        res.status(201).json(board);
    } catch (error) {
        console.error('Error creating board:', error);

        // Sequelize validation error
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                error: 'Validation error',
                details: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({ error: 'Failed to create board' });
    }
});

module.exports = router;

