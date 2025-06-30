const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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
            noPlaylist: true
        });
        

        const mp4Formats = {};
        const mp3Formats = {};
        let bestAudio = null;

        info.formats?.forEach(f => {
            const resolution = f.height ? `${f.height}p` : 'audio';

            if (f.vcodec === 'none' && f.acodec !== 'none' && f.filesize) {
                if (!bestAudio || f.filesize > bestAudio.filesize) {
                    bestAudio = f;
                }
                if (!mp3Formats[resolution]) {
                    mp3Formats[resolution] = {
                        format_id: f.format_id,
                        resolution: 'audio',
                        ext: 'mp3',
                        filesize: f.filesize
                    };
                }
            }

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
        });

        res.json({
            title: info.title,
            thumbnail: info.thumbnail,
            bestAudioFormatId: bestAudio?.format_id || null,
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

app.get('/download', async (req, res) => {
    const { url, format_id, audio_id } = req.query;
    if (!url || !format_id || !audio_id) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    const filename = `${uuidv4()}.mp4`;
    const outputPath = path.join(__dirname, filename);

    try {
        await youtubedl(url, {
            f: `${format_id}+${audio_id}`,
            o: outputPath,
            mergeOutputFormat: 'mp4',
            ffmpegLocation: './ffmpeg/ffmpeg'
        });

        res.download(outputPath, 'video.mp4', (err) => {
            fs.unlinkSync(outputPath); // حذف الملف بعد التحميل
        });
    } catch (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Download failed' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
