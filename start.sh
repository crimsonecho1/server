#!/bin/bash
# تحميل ffmpeg إلى مجلد محلي
mkdir -p ./ffmpeg
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar -xf ffmpeg-release-amd64-static.tar.xz
mv ffmpeg-*-static/ffmpeg ./ffmpeg/
chmod +x ./ffmpeg/ffmpeg

# إنشاء ملف الكوكيز من محتوى الملف المرفق
cat <<EOT > youtube.com_cookies.txt
# Netscape HTTP Cookie File
# http://curl.haxx.se/rfc/cookie_spec.html
# This is a generated file!  Do not edit.

.youtube.com	TRUE	/	TRUE	1782395654	__Secure-3PAPISID	2qTfl8cLPYwkVzyW/A8LtI4P9LKU02ZnPl
.youtube.com	TRUE	/	TRUE	1785852920	PREF	tz=Africa.Cairo&f7=100&f5=20000
.youtube.com	TRUE	/	TRUE	1782395654	__Secure-3PSID	g.a000wAgYw2N-RkMXsuz9g0NQVyR9kbw7QNxAw1jgO3lSVjQt9juedOAtI0n_yL7nYweyuNyYBgACgYKAQcSARQSFQHGX2Mi1z-cdVittYJ0TLFWr1UlxBoVAUF8yKod0UCCVHUPI9XfNOoc2eL30076
.youtube.com	TRUE	/	TRUE	1782395654	LOGIN_INFO	AFmmF2swRQIgEOR13IKljly5fbQqOOYLQGUYzg8oNa3Fp9hZij-uzcUCIQCazwUE6P63YWNreNANEYIZ83I9P3VZDS9n45W-VK4Ftg:QUQ3MjNmekxOZkhXZl81bVB4UFRYa1U4S3I1Z0JTaXRqLUtpSzE3SVpacGxqTWZ2RjJwdzRjVUlDY0FfcnJNSjllQXROYVdlZ0s3V0tzSzd3YWZUUjVZUVlxazk1ZTNwNGZtTDEzNTVET0lKUjlwVGlJR1VTLVA1TndLb01JSklOQjZaZ1VlR01LOEFsRTBxLWVLbklONE5DbUR1ZzB6Vkx3
.youtube.com	TRUE	/	TRUE	1782828923	__Secure-1PSIDTS	sidts-CjEB5H03PzCMnssb7a3ngXYHk9joj_zSjX1Hpe3vG35N7NPrIQsblV9Lp_VFCQOsQrrQEAA
.youtube.com	TRUE	/	TRUE	1782828923	__Secure-3PSIDTS	sidts-CjEB5H03PzCMnssb7a3ngXYHk9joj_zSjX1Hpe3vG35N7NPrIQsblV9Lp_VFCQOsQrrQEAA
.youtube.com	TRUE	/	TRUE	1782828942	__Secure-3PSIDCC	AKEyXzXF0q6Xg6CZjdZtQgn3nnCdgD2K9AQ9JKprCxWxjMjpLYF2BvWx5Zut88eK_BPgLZOhlFQ
EOT

# شغل الخادم
node server.js