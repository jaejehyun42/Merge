const dbModule = require('../db/user');
const jwt = require('jsonwebtoken');

async function authRoute(fastify, options) {
    fastify.post('/auth/check', async (request, reply) => {
        try {
            const accessToken = request.cookies.access_token; 
            const refreshToken = request.cookies.refresh_token;

            if (!accessToken || !refreshToken) {
                console.log("🚨 토큰 없음, 로그인 필요");
                return reply.status(401).send({ authenticated: false, message: 'Unauthorized' });
            }

            let decoded;
            try {
                decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
            } catch (error) {
                if (error.name === 'TokenExpiredError') {
                    console.log("🔄 Access Token 만료, Refresh Token으로 갱신 시도");
                } else {
                    console.log("🚨 Access Token이 유효하지 않음:", error.message);
                    return reply.status(401).send({ authenticated: false, message: 'Invalid token' });
                }
            }

            const db = fastify.db;
            const user = await dbModule.getUserByRefreshToken(db, refreshToken);
            if (!user) {
                console.log("🚨 Refresh Token이 DB에 없음, 다시 로그인 필요");
                return reply.status(401).send({ authenticated: false, message: 'Invalid refresh token' });
            }

            // ✅ Access Token 재발급 (인증할 때마다 연장)
            const newAccessToken = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '15m' } // Access Token 15분 유지
            );

            reply.setCookie('access_token', newAccessToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge: 15 * 60 * 1000 // 15분
            });
            console.log("✅ 인증 성공, 응답 데이터:", { authenticated: true, user: { userId: user.id, email: user.email } });
            return reply.send({
                authenticated: true,
                user: { userId: user.id, email: user.email }
            });
        } catch (error) {
            console.error("🚨 JWT 인증 오류:", error);
            return reply.status(500).send({ authenticated: false, message: 'Server error' });
        }
    });

    fastify.get('/auth/logout', async (request, reply) => {
        try {
            // 1️⃣ Access Token & Refresh Token 쿠키 삭제
            reply.clearCookie('access_token', { path: '/' });
            reply.clearCookie('refresh_token', { path: '/' });
            
            const db = fastify.db;
            await dbModule.invalidateRefreshToken(db, request.cookies.refresh_token);
            // 2️⃣ 성공 응답
            reply.clearCookie('authToken', {     // 기존의 인증 정보를 무효화
                domain: 'localhost',
                path: '/'
            });
            return reply.send({ success: true, logoutUrl: 'https://accounts.google.com/Logout' });
        } catch (error) {
            console.error("🚨 로그아웃 오류:", error);
            return reply.status(500).send({ success: false, message: '로그아웃 중 오류 발생' });
        }
    });
}

module.exports = authRoute;