#!/bin/bash
# تحميل ffmpeg إلى مجلد محلي
mkdir -p ./ffmpeg
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar -xf ffmpeg-release-amd64-static.tar.xz
mv ffmpeg-*-static/ffmpeg ./ffmpeg/
chmod +x ./ffmpeg/ffmpeg
# شغل الخادم
node server.js
