FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 5000

# The official node:alpine image already ships a non-root "node" user
# (uid 1000) — running as it instead of root means a container-escape
# vulnerability in this app or a dependency doesn't hand an attacker root
# inside the container. Nothing here writes to disk at runtime (uploads use
# multer's memoryStorage, straight through to Cloudinary/R2 — see
# middleware/upload.js), so no chown of /app is needed for this to work.
USER node

# Probes readiness (Mongo actually connected — see app.js's /api/health/ready),
# not just liveness, so an orchestrator won't route traffic to an instance
# that's up but can't reach its database yet. Uses Node directly instead of
# curl/wget so no extra package has to be installed into the image.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get({host:'localhost',port:process.env.PORT||5000,path:'/api/health/ready',timeout:3000},res=>process.exit(res.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "src/server.js"]
