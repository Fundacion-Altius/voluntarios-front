import { defineConfig } from 'cypress';
import fs from 'fs';
import path from 'path';
import 'chai-string';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Register the 'getMostRecentFile' task
      on('task', {
        getMostRecentFile(downloadsFolder: string) {
          const files = fs.readdirSync(downloadsFolder);
          if (files.length === 0) {
            return null;
          }
          const sortedFiles = files
            .map(file => ({
              name: file,
              time: fs.statSync(path.join(downloadsFolder, file)).mtime.getTime(),
            }))
            .sort((a, b) => b.time - a.time);
          
          return sortedFiles[0].name;  // Return the most recent file name
        },

        // Register the 'clearFolder' task
        clearFolder(folderPath: string) {
          const files = fs.readdirSync(folderPath);
          files.forEach((file) => {
            fs.unlinkSync(path.join(folderPath, file));
          });
          return null;
        }
      });

      return config;
    },
  },
});
