// server.js
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const ytDlpPath = path.join(__dirname, 'yt-dlp');

app.post('/info', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing URL' });

    const ytDlp = spawn(ytDlpPath, [url, '--dump-json', '--no-playlist']);

    let data = '';

    ytDlp.stdout.on('data', chunk => {
        data += chunk.toString();
    });

    ytDlp.stderr.on('data', err => {
        console.error('yt-dlp error:', err.toString());
    });

    ytDlp.on('close', code => {
        if (code !== 0) return res.status(500).json({ error: 'yt-dlp failed' });

        try {
            const info = JSON.parse(data);
            const mp4 = {};
            const mp3 = {};

            info.formats.forEach(f => {
                const resolution = f.height ? `${f.height}p` : 'audio';

                if (!f.filesize) return;

                if (f.ext === 'mp4' && f.vcodec !== 'none') {
                    if (!mp4[resolution]) {
                        mp4[resolution] = {
                            format_id: f.format_id,
                            resolution,
                            ext: 'mp4',
                            filesize: f.filesize
                        };
                    }
                }

                if (f.vcodec === 'none' && f.acodec !== 'none') {
                    if (!mp3[f.format_id]) {
                        mp3[f.format_id] = {
                            format_id: f.format_id,
                            resolution: 'audio',
                            ext: 'mp3',
                            filesize: f.filesize
                        };
                    }
                }
            });

            res.json({
                title: info.title,
                thumbnail: info.thumbnail,
                formats: {
                    mp4: Object.values(mp4),
                    mp3: Object.values(mp3)
                }
            });
        } catch (err) {
            console.error('JSON parse error:', err);
            res.status(500).json({ error: 'Failed to parse yt-dlp output' });
        }
    });
});

app.get('/download', (req, res) => {
    const { url, format_id } = req.query;
    if (!url || !format_id) return res.status(400).json({ error: 'Missing URL or format ID' });

    const outputName = 'video.mp4';
    res.setHeader('Content-Disposition', `attachment; filename="${outputName}"`);

    const process = spawn(ytDlpPath, [
        url,
        '-f', format_id,
        '-o', '-',
        '--merge-output-format', 'mp4'
    ]);

    process.stdout.pipe(res);

    process.stderr.on('data', data => {
        console.error(`stderr: ${data}`);
    });

    process.on('error', err => {
        console.error(`Download error: ${err}`);
        res.status(500).json({ error: 'Download failed' });
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
