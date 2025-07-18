const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 8080;

// مسار ملف الكوكيز
const COOKIES_PATH = path.join(__dirname, 'youtube.com_cookies.txt');

app.use(cors());
app.use(express.json());

// إعدادات yt-dlp الأساسية
const baseOptions = {
    noPlaylist: true,
    preferFreeFormats: true,
    forceIpv4: true,
    verbose: true,
    userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    referer: 'https://www.youtube.com/',
    ...(fs.existsSync(COOKIES_PATH) && { cookies: COOKIES_PATH }),
};

app.post('/info', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing URL' });

    try {
        const info = await youtubedl(url, {
            ...baseOptions,
            dumpSingleJson: true,
        });

        const mp4Formats = {};
        const mp3Formats = {};
        let bestAudio = null;

        info.formats?.forEach((f) => {
            const resolution = f.height ? `${f.height}p` : 'audio';

            // MP3 (Audio Only)
            if (f.vcodec === 'none' && f.acodec !== 'none' && f.filesize) {
                if (!bestAudio || f.filesize > bestAudio.filesize) {
                    bestAudio = f;
                }

                if (!mp3Formats[resolution]) {
                    mp3Formats[resolution] = {
                        format_id: f.format_id,
                        resolution: 'audio',
                        ext: 'mp3',
                        filesize: f.filesize,
                    };
                }
            }

            // MP4 (Video)
            if (f.ext === 'mp4' && f.vcodec !== 'none' && f.filesize) {
                if (!mp4Formats[resolution]) {
                    mp4Formats[resolution] = {
                        format_id: f.format_id,
                        resolution,
                        ext: 'mp4',
                        filesize: f.filesize,
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
                mp3: Object.values(mp3Formats),
            },
        });
    } catch (err) {
        console.error('Video info error:', err);
        res.status(500).json({ error: 'Failed to fetch video info', details: err.message });
    }
});

app.get('/download', async (req, res) => {
    const { url, format_id, audio_id } = req.query;

    if (!url || !format_id || !audio_id) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    const tempFile = `${uuidv4()}.mp4`;
    const outputPath = path.join(__dirname, tempFile);

    try {
        await youtubedl(url, {
            ...baseOptions,
            f: `${format_id}+${audio_id}`,
            o: outputPath,
            mergeOutputFormat: 'mp4',
            ffmpegLocation: './ffmpeg/ffmpeg', // تأكد من أن FFmpeg موجود في هذا المسار
        });

        res.download(outputPath, 'video.mp4', (err) => {
            if (!err) fs.unlinkSync(outputPath); // حذف الملف بعد التنزيل
        });
    } catch (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Download failed', details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    if (fs.existsSync(COOKIES_PATH)) {
        console.log('🔑 Using YouTube cookies for authentication');
    } else {
        console.log('⚠️ No YouTube cookies found - using limited access');
    }
});
