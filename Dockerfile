FROM node:18

# تثبيت التبعيات المطلوبة
RUN apt-get update && \
    apt-get install -y python3 ffmpeg wget && \
    rm -rf /var/lib/apt/lists/*

# نسخ ملفات المشروع
WORKDIR /app
COPY package*.json ./
COPY . .

# تثبيت تبعيات Node.js
RUN npm install

# إعداد متغير البيئة لتخطي فحص python
ENV YOUTUBE_DL_SKIP_PYTHON_CHECK=1

# منح صلاحيات التشغيل لملفات السكربت
RUN chmod +x ./start.sh

EXPOSE 8080

# تشغيل سكربت البدء
CMD ["./start.sh"]