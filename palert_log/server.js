const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(__dirname));

const TARGET_DIR = path.join(__dirname, 'logs');

app.get(['/', '/log.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'log.html'));
});

app.get('/files', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        if (!fs.existsSync(TARGET_DIR)) {
            fs.mkdirSync(TARGET_DIR, { recursive: true });
        }

        const files = fs.readdirSync(TARGET_DIR);
        const fileDetails = files.map(file => {
            const filePath = path.join(TARGET_DIR, file);
            try {
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    isFile: stats.isFile(),
                    size: stats.size,
                    mtime: stats.mtime
                };
            } catch (err) {
                return null;
            }
        }).filter(file => file !== null && file.isFile)
            .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));

        const totalCount = fileDetails.length;
        const paginatedFiles = fileDetails.slice(offset, offset + limit);

        res.json({
            files: paginatedFiles,
            total: totalCount,
            hasMore: offset + limit < totalCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/file-content/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(TARGET_DIR, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: '檔案不存在' });
        }

        const content = fs.readFileSync(filePath, 'utf8');
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    try {
        if (process.platform === 'win32') {
            exec(`start http://localhost:${PORT}`);
        } else {
            exec(`open http://localhost:${PORT}`);
        }
        console.log(`網站運行於: http://localhost:${PORT}`);
    } catch (error) {
        console.error('無法開啟瀏覽器:', error);
    }
});