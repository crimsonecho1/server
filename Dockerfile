# Dockerfile
FROM node:18

# تثبيت python و yt-dlp و ffmpeg
RUN apt-get update && apt-get install -y python3 ffmpeg yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# إعداد متغير البيئة لتخطي فحص python
ENV YOUTUBE_DL_SKIP_PYTHON_CHECK=1

EXPOSE 8080
CMD ["node", "server.js"]

RUN apt-get update && apt-get install -y ffmpeg
