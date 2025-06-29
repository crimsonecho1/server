// server.js
const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.post('/info', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing URL' });

    try {
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noPlaylist: true,
            preferFreeFormats: true
        });

        const mp4Formats = {};
        const mp3Formats = {};

        info.formats?.forEach(f => {
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

            if (f.vcodec === 'none' && f.acodec !== 'none') {
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

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch video info' });
    }
});

app.get('/download', (req, res) => {
    const { url, format_id } = req.query;
    if (!url || !format_id) return res.status(400).json({ error: 'Missing parameters' });

    res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');

    const process = youtubedl(
        url,
        ['--dump-single-json', '--no-playlist', '--prefer-free-formats', '--cookies', 'cookies.txt'],
        { shell: true }
    );

    process.stdout.pipe(res);

    process.stderr.on('data', (data) => {
        console.error('stderr:', data.toString());
    });

    process.on('error', (err) => {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Download failed' });
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
