# 书签管理器
体验网址：[https://home.justnow.uk/](https://home.justnow.uk/)

一个基于Next.js的书签管理应用，支持书签的增删改查、批量管理和元数据抓取功能。

![image.png](https://img.justnow.uk/2025/06/72b101ba80e40caab93958052809150b.png)

## 功能特性

- 书签的增删改查
- 批量导入/导出书签
- 自动抓取网页元数据
- 支持Docker部署
- 数据备份功能

功能截图
![image.png](https://img.justnow.uk/2025/06/01115d0bc59da2bce2832be04b15066e.png)

![image.png](https://img.justnow.uk/2025/06/c3fc2d8b6ab58fa98d875c7efff8bafd.png)


![image.png](https://img.justnow.uk/2025/06/ac26290f27aa7f6e8148aaed6e98ce2c.png)

![image.png](https://img.justnow.uk/2025/06/71a7881ce05009048077b32876a69261.png)

![image.png](https://img.justnow.uk/2025/06/d39e1014affabce04ce5973327d4f57b.png)

![image.png](https://img.justnow.uk/2025/06/d54f2305909db9f3662e47d446d3966e.png)


## 安装指南

### 前置条件

- Node.js 20+
- pnpm
- Docker (可选)

### 本地开发

1. 克隆仓库
2. 安装依赖:
   ```bash
   pnpm install
   ```
3. 启动开发服务器:
   ```bash
   pnpm run dev
   ```

### Docker部署

```bash
docker build -t bookmark-manager .

docker run -p 3000:3000 bookmark-manager

#多平台支持
docker run --privileged --rm tonistiigi/binfmt --install all
docker buildx create --name mybuilder --use
docker buildx build --platform linux/amd64,linux/arm64 -t bookmark-manager:1.0.0  .

```


## docker-compose部署
```shell
version: '3.3'
services:
    bookmark-manager:
        image: 'jiema66/bookmark-manager:1.0.1'
        container_name: bookmark-manager
        volumes:
            - './backups:/app/backups'
        ports:
            - '3000:3000'
        restart: unless-stopped

```


## 使用说明

1. 访问 `http://localhost:3000`
2. 添加/管理书签
3. 使用批量管理功能处理多个书签

