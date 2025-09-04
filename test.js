const axios = require('axios');

const accessToken = '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';
const owner = 'nebulaservices-app';         // e.g., nebulaservices-app
const repo = 'asdfasfeasndkjankjasbjd';              // e.g., nebula-server
const branch = 'main';                 // or any other branch




async function getFileContent(path) {
    try {
        const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
            headers: {
                Authorization: `token ${accessToken}`,
                Accept: 'application/vnd.github.v3+json',
            }
        });

        // If it's a file and has content
        if (res.data.type === 'file' && res.data.content) {
            const content = Buffer.from(res.data.content, 'base64').toString('utf-8');
            console.log(`\n📄 ${path}:\n${content}\n`);
        } else if (res.data.type === 'file') {
            console.warn(`⚠️ Skipped ${path}: No text content or content too large`);
        } else if (res.data.type === 'dir') {
            await listFilesRecursively(path); // Recurse into folders
        }
    } catch (err) {
        console.error(`❌ Failed to fetch ${path}:`, err.response?.data?.message || err.message);
    }
}

async function listFilesRecursively(dir = '') {
    try {
        const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${dir}?ref=${branch}`, {
            headers: {
                Authorization: `token ${accessToken}`,
                Accept: 'application/vnd.github.v3+json',
            }
        });

        for (const item of res.data) {
            if (item.type === 'dir') {
                await listFilesRecursively(item.path); // Go deeper
            } else if (item.type === 'file') {
                await getFileContent(item.path); // Fetch file content
            }
        }
    } catch (err) {
        console.error(`❌ Failed to list ${dir}:`, err.response?.data?.message || err.message);
    }
}

// Start from root
listFilesRecursively();