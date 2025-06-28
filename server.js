// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Route to fetch video info
app.post('/info', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing URL' });

    const ytDlp = spawn(path.join(__dirname, 'yt-dlp.exe'), [
        url,
        '--dump-json',
        '--no-playlist'
    ]);

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
            const mp4Formats = {};
            const mp3Formats = {};

            info.formats.forEach(f => {
                const resolution = f.height ? `${f.height}p` : 'audio';
                if (!f.filesize) return;

                if (f.ext === 'mp4' && f.vcodec !== 'none') {
                    if (!mp4Formats[resolution]) {
                        mp4Formats[resolution] = {
                            format_id: f.format_id,
                            resolution,
                            ext: 'mp4',
                            filesize: f.filesize
                        };
                    }
                }

                if (f.ext === 'mp3' || (f.vcodec === 'none' && f.acodec !== 'none')) {
                    if (!mp3Formats[resolution]) {
                        mp3Formats[resolution] = {
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
                    mp4: Object.values(mp4Formats),
                    mp3: Object.values(mp3Formats)
                }
            });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Invalid video data' });
        }
    });
});

// Route to download video
app.get('/download', (req, res) => {
    const { url, format_id } = req.query;
    if (!url || !format_id) return res.status(400).json({ error: 'Missing URL or format ID' });

    res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');

    const process = spawn(path.join(__dirname, 'yt-dlp.exe'), [
        url,
        '-f', format_id,
        '-o', '-',
        '--merge-output-format', 'mp4',
        '--ffmpeg-location', path.join(__dirname, './ffmpeg/ffmpeg.exe')
    ]);

    process.stdout.pipe(res);

    process.stderr.on('data', data => {
        console.error(`stderr: ${data}`);
    });

    process.on('error', (err) => {
        console.error(`Download error: ${err}`);
        res.status(500).json({ error: 'Download failed' });
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
