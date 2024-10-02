const fs = require('fs');
const path = require('path');

module.exports = (on, config) => {
  on('task', {
    clearDownloadsFolder(folderPath) {
      console.log('Clearing downloads folder:', folderPath);
      fs.rmdirSync(folderPath, { recursive: true });
      fs.mkdirSync(folderPath);
      return null;
    },
    getMostRecentFile(folderPath) {
      const files = fs.readdirSync(folderPath);
      if (files.length === 0) {
        return null;
      }
      const mostRecentFile = files
        .map((fileName) => ({
          name: fileName,
          time: fs.statSync(path.join(folderPath, fileName)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time)[0].name;
      return path.join(folderPath, mostRecentFile);
    },
  });
};
